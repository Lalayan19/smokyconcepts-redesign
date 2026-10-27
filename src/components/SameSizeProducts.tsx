"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import DragScroll from "@/components/DragScroll";
import { COLLECTION_KEYS } from "@/data/collectionKeys";
import { formatPrice, type Product } from "@/data/products";

const CARD_PX = 216; // 13.5rem
const GAP_PX = 12;
const SLOT_PX = CARD_PX + GAP_PX;
const LEFT_PX = 8; // room before the first card
// The row is drawn with at least this many cards (repeating the collection if
// it has fewer), so the card that wraps round is always out of sight.
const MIN_CARDS = 4;

// Letting go of a drag: how far ahead (ms) the swipe speed is projected to
// choose the card to land on, and the most cards one swipe can travel.
const PROJECT_MS = 280;
const MAX_FLING = 6;

const mod = (value: number, size: number) => ((value % size) + size) % size;

// Where, in cards, the card at `index` is from the left edge when the row is at
// `pos` (card `pos` is exactly at the left edge): from -1 (just off the left)
// up to `total - 1` (waiting off the right). A card that leaves on the left is
// the same one that comes back in on the right.
function offsetFrom(index: number, pos: number, total: number) {
  return mod(index - pos + 1, total) - 1;
}

function translateFor(index: number, pos: number, total: number) {
  const x = LEFT_PX + offsetFrom(index, pos, total) * SLOT_PX;
  return `translate3d(${x.toFixed(2)}px, 0, 0)`;
}

function ProductTile({ product }: { product: Product }) {
  const home = useTranslations("Home");
  const collectionKey = COLLECTION_KEYS[product.collection];
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fffffe] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.97]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#414141]">{product.name}</p>
        <p className="text-[11px] font-semibold text-[#898989]">
          {collectionKey ? home(`collections.${collectionKey}.name`) : product.collection}
        </p>
        <p className="mt-1.5 text-sm font-extrabold text-[#414141]">
          {formatPrice(product.price)}
        </p>
      </div>
      <div className="relative h-16 w-14 shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="56px"
          loading="eager"
          draggable={false}
          className="relative z-10 object-contain object-bottom"
        />
      </div>
    </div>
  );
}

// The row of cards: it loops, so there is no end to hit however hard you swipe.
// It is moved by hand (not by the browser's scrolling, which has two ends): the
// cards are placed by one number, `pos`, and the one that leaves on the left
// comes back in on the right.
function LoopingRow({ products }: { products: Product[] }) {
  const copies = Math.ceil(MIN_CARDS / products.length);
  const cards = Array.from({ length: products.length * copies }, (_, i) => ({
    product: products[i % products.length],
    isRepeat: i >= products.length,
  }));
  const total = cards.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const posRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame: number | null = null;

    const show = (next: number) => {
      posRef.current = next;
      cardRefs.current.forEach((el, i) => {
        if (el) el.style.transform = translateFor(i, next, total);
      });
    };
    show(posRef.current);

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
        show(mod(target, total));
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
          show(mod(target, total));
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
      show(drag.startPos - dx / SLOT_PX);
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
        Math.max(rest - MAX_FLING, Math.round(pos - (speed / SLOT_PX) * PROJECT_MS)),
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
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
    };

    // Sideways trackpad scrolling.
    let wheelTimer: number | undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // the page scrolls
      e.preventDefault();
      stop();
      show(
        posRef.current +
          (e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX) / SLOT_PX,
      );
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(
        () => animateTo(Math.round(posRef.current), 300),
        120,
      );
    };

    // Tabbing to a card brings it to the left edge.
    const onFocusIn = (e: FocusEvent) => {
      const card = (e.target as Element).closest("[data-card]");
      if (!card) return;
      const index = Number(card.getAttribute("data-card"));
      const pos = posRef.current;
      animateTo(pos + mod(index - pos + total / 2, total) - total / 2, 380);
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
  }, [total]);

  return (
    // All the cards sit on top of each other in one grid cell (which gives the
    // row the height of a card) and are moved sideways from there.
    <div
      ref={trackRef}
      className="samesize-loop mt-4 pb-1 select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        // Nothing in here can be scrolled into view, so cards waiting off to
        // the side stay put when they are tabbed to or dragged.
        overflow: "clip",
        // Sideways is ours, up and down still scrolls the page.
        touchAction: "pan-y",
        cursor: "grab",
      }}
    >
      {cards.map(({ product, isRepeat }, i) => (
        <Link
          key={`${product.slug}-${i}`}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          href={`/products/${product.slug}`}
          data-card={i}
          draggable={false}
          // A repeat of a card is only there to fill the loop: not for
          // reading out or tabbing to.
          aria-hidden={isRepeat || undefined}
          tabIndex={isRepeat ? -1 : undefined}
          style={{
            gridArea: "1 / 1",
            justifySelf: "start",
            width: CARD_PX,
            willChange: "transform",
            // Server-rendered at the start; after that the drag code owns this.
            transform: translateFor(i, 0, total),
          }}
        >
          <ProductTile product={product} />
        </Link>
      ))}
    </div>
  );
}

// The same cards as a plain row, each one once: for a tablet and larger (see
// `.samesize-loop` and `.samesize-flat` in globals.css), where the row is wide and
// there is no use in looping the cards round to fill it. If there are more than
// fit, the row scrolls sideways; it never repeats a card.
function FlatRow({ products }: { products: Product[] }) {
  return (
    <DragScroll className="samesize-flat scrollbar-hide mt-4 hidden snap-x gap-3 overflow-x-auto pb-1 pl-2">
      {products.map((product) => (
        <Link
          key={product.slug}
          href={`/products/${product.slug}`}
          className="block shrink-0 snap-start"
          style={{ width: CARD_PX }}
        >
          <ProductTile product={product} />
        </Link>
      ))}
    </DragScroll>
  );
}

export default function SameSizeProducts({
  collection,
  products,
}: {
  collection: string;
  products: Product[];
}) {
  const t = useTranslations("Product");
  const home = useTranslations("Home");
  if (products.length === 0) return null;
  // The collection's name in the chosen language (the same names as in the home page's row).
  const collectionKey = COLLECTION_KEYS[collection];
  const collectionName = collectionKey ? home(`collections.${collectionKey}.name`) : collection;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        {/* In line with the left edge of the first card (which has LEFT_PX before it). */}
        <h2
          className="text-[0.9375rem] font-extrabold tracking-[-0.01em] text-[#414141]"
          style={{ paddingLeft: LEFT_PX }}
        >
          {t("moreInCollection", { collection: collectionName })}
        </h2>
        <span className="shrink-0 text-xs font-semibold text-[#898989]">
          {t("styles", { count: products.length })}
        </span>
      </div>

      {products.length === 1 ? (
        // One card: nothing to loop through.
        <div className="mt-4 pb-1 pl-2">
          <Link href={`/products/${products[0].slug}`} className="block w-[13.5rem]">
            <ProductTile product={products[0]} />
          </Link>
        </div>
      ) : (
        <>
          <LoopingRow products={products} />
          <FlatRow products={products} />
        </>
      )}
    </section>
  );
}
