"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import ShopProductCard from "@/components/ShopProductCard";
import { findProductBySlug, type Product } from "@/data/products";

const PRODUCTS = [
  "orangerie",
  "kish-mish-2",
  "forest",
  "old-money",
  "seaman",
  "classic-brown",
  "classic-blue",
  "classic-black",
]
  .map(findProductBySlug)
  .filter((p): p is Product => p !== undefined);
const COUNT = PRODUCTS.length;
// Which product is in the middle when the page loads.
const START_INDEX = 2;

// The row is the shop's product cards with one card at a time in the middle.
// The card in the middle is shown at exactly the size it has on the shop page
// (see shopCardWidth; its height is simply its own content, as in the shop) and
// every other card is smaller, and the size changes continuously with how far a
// card is from the middle while you drag.
const MIN_SCALE = 0.7;
const GAP_PX = 16; // between the middle card and the ones next to it
const PAD_Y_PX = 12;
// Extra room above and below the cards so their shadows are not cut off by the
// row's overflow; cancelled out with negative margins so the layout is the same
// as without it.
const SHADOW_ROOM_PX = 48;

// Letting go of a drag: how far ahead (ms) the swipe speed is projected to
// choose the card to land on, and the most cards one swipe can travel.
const PROJECT_MS = 280;
const MAX_FLING = 6;
// A card starts to fade out this many cards before it wraps round to the other
// side, so on a wide screen it never visibly pops from one side to the other.
const FADE_SPAN = 0.5;

// The width a card has on the shop page at this page width: that page lays the
// cards out in a grid with 2 columns on phones, 3 from `sm` and 4 from `lg`.
function shopCardWidth(pageWidth: number) {
  if (pageWidth >= 1024) {
    const content = Math.min(pageWidth, 1920) - 2 * 120;
    return (content - 3 * 20) / 4;
  }
  if (pageWidth >= 640) return (pageWidth - 2 * 32 - 2 * 20) / 3;
  return (pageWidth - 2 * 16 - 12) / 2;
}

// Cards are `slot` apart so that the middle card and the next one are GAP_PX
// apart (the next one is drawn at MIN_SCALE).
function slotFor(cardWidth: number) {
  return Math.round((cardWidth * (1 + MIN_SCALE)) / 2 + GAP_PX);
}

// Every card has a shadow: a small one when it is off to the side, growing to a
// bigger one as it comes to the middle.
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const mod = (value: number, size: number) => ((value % size) + size) % size;

// How far, in cards, the card at `index` is from the middle when the row is at
// `pos` (the card `pos` is exactly in the middle), going the short way round
// the loop: from -COUNT/2 (about to wrap to the far right) up to just under
// COUNT/2 (about to wrap to the far left). The row is only these cards: the one
// that leaves on one side is the same one that arrives on the other.
function offsetFrom(index: number, pos: number) {
  return mod(index - pos + COUNT / 2, COUNT) - COUNT / 2;
}

// Place, size, shadow and stacking of the card at `index` when the row is at
// `pos`.
function placementFor(index: number, pos: number, slot: number) {
  const offset = offsetFrom(index, pos);
  const distance = Math.abs(offset);
  const t = Math.min(1, distance);
  const eased = t * t * (3 - 2 * t);
  const scale = 1 - (1 - MIN_SCALE) * eased;
  const near = 1 - eased; // 1 in the middle, 0 from one slot away on
  const offsetY = lerp(2, 14, near).toFixed(1);
  const blur = lerp(6, 36, near).toFixed(1);
  const alpha = lerp(0.08, 0.22, near).toFixed(3);
  const opacity = Math.min(1, (COUNT / 2 - distance) / FADE_SPAN);
  return {
    transform: `translate3d(${(offset * slot).toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`,
    boxShadow: `0 ${offsetY}px ${blur}px rgba(18, 42, 38, ${alpha})`,
    opacity: Number(opacity.toFixed(3)),
    zIndex: Math.round(100 - distance * 10),
  };
}

function subscribeToResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const getPageWidth = () => document.documentElement.clientWidth;
const getServerPageWidth = () => 375;

type LabelState = {
  current: number;
  // The name that is on its way out, if the middle card just changed.
  previous: number | null;
  // How many times the middle card has changed; used to restart the animation.
  changes: number;
  // Which way the row moved: 1 when the next cards come in from the right
  // (dragging to the left), -1 the other way.
  direction: 1 | -1;
};

type UltraSlimsSectionProps = {
  buttonHref: string;
};

export default function UltraSlimsSection({ buttonHref }: UltraSlimsSectionProps) {
  const pageWidth = useSyncExternalStore(subscribeToResize, getPageWidth, getServerPageWidth);
  const cardWidth = shopCardWidth(pageWidth);
  const slot = slotFor(cardWidth);

  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Which card is in the middle, as a fraction while the row is moving. Kept
  // here (not in the effect) so a change of page width, which re-runs the
  // effect with new spacing, keeps the row where it was.
  const posRef = useRef(START_INDEX);
  const [label, setLabel] = useState<LabelState>({
    current: START_INDEX,
    previous: null,
    changes: 0,
    direction: 1,
  });

  // The row is moved by hand rather than by the browser's own scrolling: a
  // scroller has two ends, and a hard swipe would run into one of them. Here
  // there are only the cards, placed by `pos`, so there is never an end.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame: number | null = null;
    let middle = mod(Math.round(posRef.current), COUNT); // the card nearest the middle

    const show = (next: number) => {
      posRef.current = next;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const placement = placementFor(i, next, slot);
        el.style.transform = placement.transform;
        el.style.boxShadow = placement.boxShadow;
        el.style.opacity = String(placement.opacity);
        el.style.zIndex = String(placement.zIndex);
      });
      const nearest = mod(Math.round(next), COUNT);
      if (nearest !== middle) {
        // The short way round from the old middle card to the new one.
        const step = mod(nearest - middle + COUNT / 2, COUNT) - COUNT / 2;
        middle = nearest;
        setLabel((s) => ({
          current: nearest,
          previous: s.current,
          changes: s.changes + 1,
          direction: step > 0 ? 1 : -1,
        }));
      }
    };
    // Put the cards where they belong for this spacing.
    show(posRef.current);

    // A picture that has never been on screen is only decoded the first time
    // it is painted, which can leave a card empty for a moment as it slides in.
    // Decode them all now instead.
    cardRefs.current.forEach((el) => {
      el?.querySelectorAll("img").forEach((img) => {
        img.decode().catch(() => {});
      });
    });

    const stop = () => {
      if (frame === null) return;
      cancelAnimationFrame(frame);
      frame = null;
    };

    const animateTo = (target: number, duration: number) => {
      stop();
      const from = posRef.current;
      if (from === target) return;
      if (
        duration <= 0 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        show(mod(target, COUNT));
        return;
      }
      const startedAt = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / duration);
        if (t < 1) {
          show(from + (target - from) * (1 - Math.pow(1 - t, 3)));
          frame = requestAnimationFrame(step);
        } else {
          // Looks identical, keeps the numbers small.
          frame = null;
          show(mod(target, COUNT));
        }
      };
      frame = requestAnimationFrame(step);
    };

    // Touch and mouse dragging. A mouse that leaves the row keeps dragging, so
    // once a drag has started the listeners are on the window.
    let drag: {
      id: number;
      startX: number;
      startPos: number;
      moved: boolean;
      stoppedMotion: boolean; // the finger went down on a row that was still moving
      samples: { t: number; x: number }[]; // the last ~100ms, for the speed
    } | null = null;
    let suppressClick = false;
    let suppressTimer: number | undefined;

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 4) drag.moved = true;
      if (!drag.moved) return;
      drag.samples.push({ t: e.timeStamp, x: e.clientX });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) {
        drag.samples.shift();
      }
      show(drag.startPos - dx / slot);
    };
    const endDrag = (e: PointerEvent, cancelled: boolean) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      track.style.cursor = "grab";

      // Letting go of a drag over a card, or tapping to stop a moving row,
      // must not open that card.
      if (d.moved || d.stoppedMotion) {
        suppressClick = true;
        window.clearTimeout(suppressTimer);
        suppressTimer = window.setTimeout(() => {
          suppressClick = false;
        }, 350);
      }

      const pos = posRef.current;
      if (!d.moved) {
        // A tap: the card's own link opens it; the row settles on a card in
        // case the tap stopped it half way.
        animateTo(Math.round(pos), 260);
        return;
      }

      // Land on the card the swipe is heading for: further the faster it was.
      const first = d.samples[0];
      const last = d.samples[d.samples.length - 1];
      const elapsed = last.t - first.t;
      const stillFor = e.timeStamp - last.t;
      const speed =
        cancelled || stillFor > 80 || elapsed <= 0
          ? 0
          : (last.x - first.x) / elapsed; // px per ms, positive towards the right
      const rest = Math.round(pos);
      const target = Math.min(
        rest + MAX_FLING,
        Math.max(rest - MAX_FLING, Math.round(pos - (speed / slot) * PROJECT_MS)),
      );
      animateTo(target, 210 + 84 * Math.min(Math.abs(target - pos), 5));
    };
    function onPointerUp(e: PointerEvent) {
      endDrag(e, false);
    }
    function onPointerCancel(e: PointerEvent) {
      endDrag(e, true);
    }
    const onPointerDown = (e: PointerEvent) => {
      // A second finger is ignored; a new first touch always starts afresh,
      // even if the previous one never reported that it ended.
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      const stoppedMotion = frame !== null;
      stop();
      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: posRef.current,
        moved: false,
        stoppedMotion,
        samples: [{ t: e.timeStamp, x: e.clientX }],
      };
      track.style.cursor = "grabbing";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // On a tablet and larger (many cards in view, and a mouse that can point at
      // any of them) only the card in the middle opens: a click on another one
      // brings it to the middle instead. A phone is not changed.
      if (!window.matchMedia("(min-width: 744px) and (min-height: 500px)").matches) return;
      const card = (e.target as Element).closest("[data-card]");
      if (!card) return;
      const offset = offsetFrom(Number(card.getAttribute("data-card")), posRef.current);
      if (Math.abs(offset) < 0.5) return; // the middle card: its own link opens it
      e.preventDefault();
      e.stopPropagation();
      animateTo(posRef.current + offset, 420);
    };

    // Sideways trackpad scrolling.
    let wheelTimer: number | undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // the page scrolls
      e.preventDefault();
      stop();
      show(
        posRef.current + (e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX) / slot,
      );
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(
        () => animateTo(Math.round(posRef.current), 300),
        120,
      );
    };

    // Tabbing to a card brings it to the middle.
    const onFocusIn = (e: FocusEvent) => {
      const card = (e.target as Element).closest("[data-card]");
      if (!card) return;
      const index = Number(card.getAttribute("data-card"));
      animateTo(posRef.current + offsetFrom(index, posRef.current), 380);
    };

    // The pictures in the cards would otherwise start a browser drag-and-drop.
    const onDragStart = (e: Event) => e.preventDefault();

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("click", onClickCapture, true);
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("focusin", onFocusIn);
    track.addEventListener("dragstart", onDragStart);
    return () => {
      stop();
      window.clearTimeout(wheelTimer);
      window.clearTimeout(suppressTimer);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("focusin", onFocusIn);
      track.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [slot]);

  return (
    <section className="ultra-slims-section relative left-1/2 mb-3 w-screen -mx-[50vw] rounded-b-[1.5rem] min-h-[80vh] supports-[-webkit-touch-callout:none]:max-md:min-h-[100vh] overflow-hidden bg-white px-6 pt-12 pb-10 text-center">
      <Link href={buttonHref}>
      <h2
        className="font-montserrat italic text-[#000000]"
        style={{marginTop: "36px", fontWeight: 680, fontSize: "44px", lineHeight: 1.1 }}
      >
        Ultra Slims
      </h2>
      <p
        className="mx-auto  max-w-md font-montserrat text-[#000000]"
        style={{ fontSize: "14px" }}
      >
        <strong className="font-bold">Compatible</strong> Most of Ultra Slims sizes
      </p>

      <button
        style={{
          letterSpacing: "0.1em",
          fontWeight: 500,
          ...BUTTON_EDGE,
        }}
        className="mt-[20px] font-montserrat inline-flex h-[42px] w-[140px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[17px] text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        SHOP
      </button>
      </Link>

      {/* A thin line, then the name of the card in the middle: when it changes
          the old name leaves the way the row is moving and the new one comes in
          from the other side. */}
      <div
        aria-hidden="true"
        style={{ marginTop: 24, width: "80%",margin: "24px auto", height: 1, backgroundColor: "#DEDEDE" }}
      />
      <div
        className="ultra-slims-name relative mx-auto overflow-hidden font-montserrat italic text-[#000000]"
        style={{
          marginTop: 28,
          height: 28,
          lineHeight: "28px",
          fontSize: 20,
          fontWeight: 690,
        }}
      >
        {label.previous !== null && (
          <span
            key={`out-${label.changes}`}
            aria-hidden="true"
            className="product-name-out absolute inset-0"
            style={{ "--name-shift": `${label.direction * 50}%` } as CSSProperties}
            onAnimationEnd={() =>
              setLabel((s) =>
                s.changes === label.changes ? { ...s, previous: null } : s,
              )
            }
          >
            {PRODUCTS[label.previous].name}
          </span>
        )}
        <span
          key={`in-${label.changes}`}
          aria-live="polite"
          className={
            label.changes > 0
              ? "product-name-in absolute inset-0"
              : "absolute inset-0"
          }
          style={{ "--name-shift": `${label.direction * 50}%` } as CSSProperties}
        >
          {PRODUCTS[label.current].name}
        </span>
      </div>

      {/* Outside the link above: the cards are links themselves. All five
          cards sit on top of each other in one grid cell (which gives the row
          the height of a card) and are moved sideways from there. */}
      <div
        ref={trackRef}
        className="relative left-1/2 w-screen -mx-[50vw] select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
        style={{
          // The cards start 30px below the name (the row's own top padding
          // supplies PAD_Y_PX of that).
          marginTop: 30 - PAD_Y_PX - SHADOW_ROOM_PX,
          marginBottom: -SHADOW_ROOM_PX,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          // Nothing in here can be scrolled into view, so the cards that are
          // off to the side stay put when they are tabbed to or dragged.
          overflow: "clip",
          // The cards' stacking order (middle one on top) stays inside the row.
          isolation: "isolate",
          paddingBlock: PAD_Y_PX + SHADOW_ROOM_PX,
          // Sideways is ours, up and down still scrolls the page.
          touchAction: "pan-y",
          cursor: "grab",
        }}
      >
        {PRODUCTS.map((product, index) => (
          <div
            key={product.slug}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            data-card={index}
            // The section is text-centered; the shop's cards are not.
            className="text-left"
            style={{
              gridArea: "1 / 1",
              justifySelf: "center",
              width: cardWidth,
              // Same corners as the card, so the shadow follows them.
              borderRadius: "1rem",
              willChange: "transform",
              // Server-rendered with the starting places; after that the drag
              // code owns these four.
              ...placementFor(index, START_INDEX, slot),
            }}
          >
            {/* Only these few pictures, fetched as soon as the page loads, so a
                card is never empty when it slides into view. */}
            <ShopProductCard product={product} eager />
          </div>
        ))}
      </div>
    </section>
  );
}
