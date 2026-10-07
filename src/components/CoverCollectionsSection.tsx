"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import atelierCoin from "@/assets/images/covered_collections_section/atelier.png";
import classicCoin from "@/assets/images/covered_collections_section/classic.png";
import premiumCoin from "@/assets/images/covered_collections_section/premium.png";
import specialCoin from "@/assets/images/covered_collections_section/special.png";

// `description` is the text under the button while that collection is in the
// middle of the row.
const COLLECTIONS = [
  {
    name: "Classic",
    image: classicCoin,
    href: "/shop?collection=Classic",
    description:
      "The everyday essentials. Clean lines, high-quality leather and timeless colors — brown, blue and black — at the most accessible price in the line, and ready to carry your own text.",
  },
  {
    name: "Premium",
    image: premiumCoin,
    href: "/shop?collection=Premium",
    description:
      "Richer leathers and bolder character. Each case is hand-finished in a distinctive color or texture, for those who want even a small ritual to feel special.",
  },
  {
    name: "Atelier",
    image: atelierCoin,
    href: "/shop?collection=Atelier",
    description:
      "Made to order. Every piece is hand-assembled in our atelier to the exact dimensions of your pack, then finished with your personal touch.",
  },
  {
    name: "Special Edition",
    image: specialCoin,
    href: "/shop?collection=Special+Edition",
    description:
      "Limited designs, released once. Rare finishes and unique details created for a moment — when they sell out, they do not return.",
  },
];
const COUNT = COLLECTIONS.length;
// Which coin is in the middle when the page loads.
const START_INDEX = 3;

// The coin in the middle is COIN_PX across, the ones next to it SMALL_PX; the
// size changes continuously with how far a coin is from the middle while you
// drag.
const COIN_PX = 180;
const SMALL_PX = 125;
const MIN_SCALE = SMALL_PX / COIN_PX;
const GAP_PX = 12; // between the middle coin and the ones next to it
// Coins are SLOT_PX apart so that the middle coin and the next one (drawn at
// MIN_SCALE) are GAP_PX apart.
const SLOT_PX = Math.round((COIN_PX * (1 + MIN_SCALE)) / 2 + GAP_PX);

// Letting go of a drag: how far ahead (ms) the swipe speed is projected to
// choose the coin to land on, and the most coins one swipe can travel.
const PROJECT_MS = 280;
const MAX_FLING = 6;
// A coin starts to fade out this many coins before it wraps round to the other
// side, so on a wide screen it never visibly pops from one side to the other.
const FADE_SPAN = 0.5;

const mod = (value: number, size: number) => ((value % size) + size) % size;

// How far, in coins, the coin at `index` is from the middle when the row is at
// `pos` (the coin `pos` is exactly in the middle), going the short way round
// the loop: from -2 (about to wrap to the far right) up to just under 2 (about
// to wrap to the far left). The row is only these four coins: the one that
// leaves on one side is the same one that arrives on the other.
function offsetFrom(index: number, pos: number) {
  return mod(index - pos + COUNT / 2, COUNT) - COUNT / 2;
}

function placementFor(index: number, pos: number) {
  const offset = offsetFrom(index, pos);
  const distance = Math.abs(offset);
  const t = Math.min(1, distance);
  const eased = t * t * (3 - 2 * t);
  const scale = 1 - (1 - MIN_SCALE) * eased;
  const opacity = Math.min(1, (COUNT / 2 - distance) / FADE_SPAN);
  return {
    transform: `translate3d(${(offset * SLOT_PX).toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`,
    opacity: Number(opacity.toFixed(3)),
    zIndex: Math.round(100 - distance * 10),
  };
}

type LabelState = {
  current: number;
  // The name that is on its way out, if the middle coin just changed.
  previous: number | null;
  // How many times the middle coin has changed; used to restart the animation.
  changes: number;
};

export default function CoverCollectionsSection() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const coinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [label, setLabel] = useState<LabelState>({
    current: START_INDEX,
    previous: null,
    changes: 0,
  });

  // The row is moved by hand rather than by the browser's own scrolling: a
  // scroller has two ends, and a hard swipe would run into one of them. Here
  // there are only the four coins, placed by `pos`, so there is never an end.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let pos = START_INDEX; // which coin is in the middle, as a fraction while moving
    let middle = START_INDEX; // the coin nearest the middle
    let frame: number | null = null;

    // A picture that has never been on screen is only decoded the first time
    // it is painted, which can leave a coin empty for a moment as it slides in.
    // Decode them all now instead.
    coinRefs.current.forEach((el) => {
      el?.querySelectorAll("img").forEach((img) => {
        img.decode().catch(() => {});
      });
    });

    const show = (next: number) => {
      pos = next;
      const nearest = mod(Math.round(pos), COUNT);
      coinRefs.current.forEach((el, i) => {
        if (!el) return;
        const placement = placementFor(i, pos);
        el.style.transform = placement.transform;
        el.style.opacity = String(placement.opacity);
        el.style.zIndex = String(placement.zIndex);
        // Only the coin in the middle opens the shop when it is clicked.
        el.style.cursor = i === nearest ? "pointer" : "";
      });
      if (nearest !== middle) {
        middle = nearest;
        setLabel((s) => ({
          current: nearest,
          previous: s.current,
          changes: s.changes + 1,
        }));
      }
    };

    const stop = () => {
      if (frame === null) return;
      cancelAnimationFrame(frame);
      frame = null;
    };

    const animateTo = (target: number, duration: number) => {
      stop();
      const from = pos;
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

    // Touch and mouse dragging.
    let drag: {
      id: number;
      startX: number;
      startPos: number;
      coin: number | null; // the coin the finger went down on
      moved: boolean;
      samples: { t: number; x: number }[]; // the last ~100ms, for the speed
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      // A second finger is ignored; a new first touch always starts afresh,
      // even if the previous one never reported that it ended.
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      stop();
      const coin = (e.target as Element).closest("[data-coin]");
      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: pos,
        coin: coin ? Number(coin.getAttribute("data-coin")) : null,
        moved: false,
        samples: [{ t: e.timeStamp, x: e.clientX }],
      };
      track.style.cursor = "grabbing";
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        // capture can fail for a pointer the browser no longer tracks
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 4) drag.moved = true;
      if (!drag.moved) return;
      drag.samples.push({ t: e.timeStamp, x: e.clientX });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) {
        drag.samples.shift();
      }
      show(drag.startPos - dx / SLOT_PX);
    };
    const endDrag = (e: PointerEvent, cancelled: boolean) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      track.style.cursor = "grab";

      if (!d.moved) {
        // A tap: the coin in the middle opens the shop for its collection; a
        // coin beside it only comes to the middle first.
        if (cancelled || d.coin === null) {
          animateTo(Math.round(pos), 260);
        } else if (d.coin === mod(Math.round(pos), COUNT)) {
          animateTo(Math.round(pos), 260); // in case the tap stopped it half way
          router.push(COLLECTIONS[d.coin].href);
        } else {
          animateTo(pos + offsetFrom(d.coin, pos), 420);
        }
        return;
      }

      // Land on the coin the swipe is heading for: further the faster it was.
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
        Math.max(rest - MAX_FLING, Math.round(pos - (speed / SLOT_PX) * PROJECT_MS)),
      );
      animateTo(target, 300 + 120 * Math.min(Math.abs(target - pos), 5));
    };
    const onPointerUp = (e: PointerEvent) => endDrag(e, false);
    const onPointerCancel = (e: PointerEvent) => endDrag(e, true);

    // Sideways trackpad scrolling.
    let wheelTimer: number | undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // the page scrolls
      e.preventDefault();
      stop();
      show(pos + (e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX) / SLOT_PX);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => animateTo(Math.round(pos), 300), 120);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      animateTo(Math.round(pos) + (e.key === "ArrowRight" ? 1 : -1), 380);
    };

    // Have the pages the coins lead to ready before they are tapped.
    COLLECTIONS.forEach(({ href }) => router.prefetch(href));

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerCancel);
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("keydown", onKeyDown);
    return () => {
      stop();
      window.clearTimeout(wheelTimer);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerCancel);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  const current = COLLECTIONS[label.current];

  return (
    <section className="relative left-1/2 z-10 w-screen -mx-[50vw] bg-white">
      <div
        className="collections-card overflow-hidden rounded-[1.5rem] bg-black px-6 text-center"
        style={{ paddingTop: 62, paddingBottom: 37 }}
      >
        <h2
          className="font-montserrat text-center italic text-white"
          style={{ fontSize: "44px", fontWeight: 600 }}
        >
          Collections
        </h2>

        {/* Name of the coin in the middle: the old name drops out downwards while
            the new one comes in from the top. */}
        <div
          className="relative mx-auto overflow-hidden font-montserrat text-white"
          style={{
            marginTop: 24,
            // Moved up 4px without moving anything below it.
            top: -4,
            height: 24,
            lineHeight: "24px",
            fontSize: 20,
            fontWeight: 400,
          }}
        >
          {label.previous !== null && (
            <span
              key={`out-${label.changes}`}
              aria-hidden="true"
              className="collection-name-out absolute inset-0"
              onAnimationEnd={() =>
                setLabel((s) =>
                  s.changes === label.changes ? { ...s, previous: null } : s,
                )
              }
            >
              {COLLECTIONS[label.previous].name}
            </span>
          )}
          <span
            key={`in-${label.changes}`}
            aria-live="polite"
            className={
              label.changes > 0
                ? "collection-name-in absolute inset-0"
                : "absolute inset-0"
            }
          >
            {current.name}
          </span>
        </div>

        {/* Full width of the section, 180px tall. */}
        <div className="relative -mx-6" style={{ marginTop: 18, height: COIN_PX }}>
          <div
            ref={trackRef}
            tabIndex={0}
            role="group"
            aria-roledescription="carousel"
            aria-label="Collections"
            className="select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              // The coins' stacking order (middle one on top) stays inside the
              // row, so the fade below is always drawn over all of them.
              isolation: "isolate",
              // Sideways is ours, up and down still scrolls the page.
              touchAction: "pan-y",
              cursor: "grab",
            }}
          >
            {COLLECTIONS.map((collection, index) => (
              <div
                key={collection.name}
                ref={(el) => {
                  coinRefs.current[index] = el;
                }}
                data-coin={index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  width: COIN_PX,
                  height: COIN_PX,
                  marginLeft: -COIN_PX / 2,
                  cursor: index === START_INDEX ? "pointer" : undefined,
                  willChange: "transform",
                  // Server-rendered with the starting places; after that the
                  // drag code owns these.
                  ...placementFor(index, START_INDEX),
                }}
              >
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  sizes={`${COIN_PX}px`}
                  // Only four images, fetched as soon as the page loads, so a
                  // coin is never an empty circle when it comes into view.
                  loading="eager"
                  draggable={false}
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {/* Fades the coins out towards both edges. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #000000 0%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 75%, #000000 100%)",
            }}
          />
        </div>

        <div className="flex justify-center" style={{ marginTop: 37 }}>
          <Link
            href={current.href}
            style={{
              width: 165,
              height: 42,
              fontSize: 17,
              fontWeight: 500,
              letterSpacing: "0.1em",
              ...BUTTON_EDGE,
            }}
            className="inline-flex items-center justify-center rounded-[8px] bg-[#dcc090] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
          >
            LEARN MORE
          </Link>
        </div>

        {/* What the collection in the middle is. The four texts sit on top of
            each other in one grid cell, so the block is as tall as the longest
            and nothing moves when the text changes; the one for the coin in the
            middle fades in as the others fade out. */}
        <div
          className="collections-desc mx-auto grid"
          style={{ marginTop: 28, maxWidth: 320, gridTemplateColumns: "minmax(0, 1fr)" }}
        >
          {COLLECTIONS.map((collection, index) => {
            const shown = index === label.current;
            return (
              <p
                key={collection.name}
                aria-hidden={shown ? undefined : true}
                className="font-montserrat text-center text-white"
                style={{
                  gridArea: "1 / 1",
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.55,
                  opacity: shown ? 0.85 : 0,
                  transition: "opacity 350ms ease",
                }}
              >
                {collection.description}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
