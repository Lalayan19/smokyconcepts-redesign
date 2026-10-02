"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import ShopProductCard from "@/components/ShopProductCard";
import { findProductBySlug, type Product } from "@/data/products";

const PRODUCTS = [
  "orangerie",
  "kish-mish-2",
  "forest",
  "old-money",
  "seaman",
]
  .map(findProductBySlug)
  .filter((p): p is Product => p !== undefined);
const COUNT = PRODUCTS.length;
// Which product is in the middle when the page loads.
const START_INDEX = 2;

// The row is a horizontal scroller of the shop's product cards that snaps so
// one card at a time sits in the middle. The card in the middle is shown at
// exactly the size it has on the shop page (see shopCardWidth; its height is
// simply its own content, as in the shop) and every other card is smaller, and
// the size changes continuously with how far a card is from the middle while
// you drag.
const MIN_SCALE = 0.7;
const GAP_PX = 16; // between the middle card and the ones next to it
const PAD_Y_PX = 12;
// Extra room above and below the cards so their shadows are not cut off by the
// row's overflow; cancelled out with negative margins so the layout is the same
// as without it.
const SHADOW_ROOM_PX = 48;

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

// The row loops: the products are rendered three times over and the scroller
// starts in the middle copy. Whenever it comes to rest in the first or last
// copy it is moved by exactly one copy, which looks identical, so there is
// always more to drag in both directions.
const COPIES = 3;
const SETTLE_MS = 140;

// Every card has a shadow: a small one when it is off to the side, growing to a
// bigger one as it comes to the middle.
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

// Size, shadow and stacking of the card at row position `index` when the row is
// scrolled to `scrollLeft` (the card is exactly in the middle at
// scrollLeft = index * slot).
function layoutFor(index: number, scrollLeft: number, slot: number) {
  const distance = Math.abs(index * slot - scrollLeft) / slot;
  const t = Math.min(1, distance);
  const eased = t * t * (3 - 2 * t);
  const scale = 1 - (1 - MIN_SCALE) * eased;
  const near = 1 - eased; // 1 in the middle, 0 from one slot away on
  const offsetY = lerp(2, 14, near).toFixed(1);
  const blur = lerp(6, 36, near).toFixed(1);
  const alpha = lerp(0.08, 0.22, near).toFixed(3);
  return {
    transform: `scale(${scale.toFixed(4)})`,
    boxShadow: `0 ${offsetY}px ${blur}px rgba(18, 42, 38, ${alpha})`,
    zIndex: Math.round(100 - Math.min(distance, 10) * 10),
  };
}

function subscribeToResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const getPageWidth = () => document.documentElement.clientWidth;
const getServerPageWidth = () => 375;

type UltraSlimsSectionProps = {
  buttonHref: string;
};

export default function UltraSlimsSection({ buttonHref }: UltraSlimsSectionProps) {
  const pageWidth = useSyncExternalStore(subscribeToResize, getPageWidth, getServerPageWidth);
  const cardWidth = shopCardWidth(pageWidth);
  const slot = slotFor(cardWidth);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slotRef = useRef<number | null>(null);
  // Which card (position in the whole row) is in the middle, as of the last
  // time the row came to rest. Kept as an index rather than a pixel position
  // because a change of page width changes the spacing, and the browser
  // re-snaps the row on its own when that happens.
  const restingIndexRef = useRef(COUNT + START_INDEX);

  const applyLayout = useCallback(() => {
    const scroller = scrollerRef.current;
    const currentSlot = slotRef.current;
    if (!scroller || currentSlot === null) return;
    const left = scroller.scrollLeft;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const { transform, boxShadow, zIndex } = layoutFor(i, left, currentSlot);
      el.style.transform = transform;
      el.style.boxShadow = boxShadow;
      el.style.zIndex = String(zIndex);
    });
  }, []);

  // Put the resting card in the middle before the first paint, and again if
  // the page width (and with it the spacing) changes.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    slotRef.current = slot;
    scroller.scrollLeft = restingIndexRef.current * slot;
    applyLayout();
  }, [slot, applyLayout]);

  // Touch and trackpad dragging is the browser's own scrolling (momentum and
  // snapping included); here the sizes follow it, the loop is kept topped up
  // once it comes to rest, and a mouse (which has no drag-to-scroll of its
  // own) gets one.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const copyPx = COUNT * slot;

    let holding = false; // a finger or the mouse is down
    let settleTimer: number | undefined;

    const recenter = () => {
      if (holding) return;
      const index = Math.round(scroller.scrollLeft / slot);
      if (index < COUNT) scroller.scrollLeft += copyPx;
      else if (index >= COUNT * 2) scroller.scrollLeft -= copyPx;
      restingIndexRef.current = Math.round(scroller.scrollLeft / slot);
    };
    const settleSoon = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(recenter, SETTLE_MS);
    };
    const onScroll = () => {
      applyLayout();
      settleSoon();
    };
    const onTouchStart = () => {
      holding = true;
    };
    const onTouchEnd = () => {
      holding = false;
      settleSoon();
    };

    let suppressClick = false;
    let drag: { x: number; left: number; moved: boolean } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: scroller.scrollLeft, moved: false };
      holding = true;
      scroller.style.scrollSnapType = "none";
      scroller.style.cursor = "grabbing";
      try {
        scroller.setPointerCapture(e.pointerId);
      } catch {
        // capture can fail for a pointer the browser no longer tracks
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      scroller.scrollLeft = drag.left - dx;
    };
    const endDrag = () => {
      if (!drag) return;
      suppressClick = drag.moved;
      drag = null;
      holding = false;
      scroller.style.cursor = "grab";
      scroller.style.scrollSnapType = "x mandatory";
      const nearest = Math.round(scroller.scrollLeft / slot);
      scroller.scrollTo({ left: nearest * slot, behavior: "smooth" });
      settleSoon();
    };
    // Letting go of a mouse drag over a card must not open that card.
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", onTouchEnd, { passive: true });
    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointermove", onPointerMove);
    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointercancel", endDrag);
    scroller.addEventListener("click", onClickCapture, true);
    return () => {
      window.clearTimeout(settleTimer);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchEnd);
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointermove", onPointerMove);
      scroller.removeEventListener("pointerup", endDrag);
      scroller.removeEventListener("pointercancel", endDrag);
      scroller.removeEventListener("click", onClickCapture, true);
    };
  }, [slot, applyLayout]);

  return (
    <section className="relative left-1/2 mb-3 w-screen -mx-[50vw] rounded-[1.5rem] min-h-[80vh] supports-[-webkit-touch-callout:none]:max-md:min-h-[100vh] overflow-hidden bg-white px-6 pt-12 pb-10 text-center">
      <Link href={buttonHref}>
      <h2
        className="font-montserrat italic text-[#414141]"
        style={{marginTop: "60px", fontWeight: 600, fontSize: "52px", lineHeight: 1.1 }}
      >
        Ultra Slims
      </h2>
      <p
        className="mx-auto mt-1 max-w-md font-montserrat text-[#414141]"
        style={{ fontSize: "16px" }}
      >
        <strong className="font-bold">Compatible</strong> Most of Ultra Slims sizes
      </p>

      <button
        style={{ letterSpacing: "0.1em" }}
        className="mt-[50px] inline-flex h-10 w-[176px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[20px] font-normal text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        Buy Now
      </button>
      </Link>

      {/* Outside the link above: the cards are links themselves. */}
      <div
        ref={scrollerRef}
        className="scrollbar-hide relative left-1/2 w-screen -mx-[50vw] select-none bg-white [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
        style={{
          marginTop: 80 - SHADOW_ROOM_PX,
          marginBottom: -SHADOW_ROOM_PX,
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBlock: PAD_Y_PX + SHADOW_ROOM_PX,
          scrollSnapType: "x mandatory",
          overscrollBehaviorX: "contain",
          cursor: "grab",
        }}
      >
        {/* Room on both sides so the first and last card can reach the middle. */}
        <div aria-hidden="true" style={{ flex: `0 0 calc(50% - ${slot / 2}px)` }} />
        {Array.from({ length: COPIES * COUNT }, (_, index) => {
          const product = PRODUCTS[index % COUNT];
          const isClone = Math.floor(index / COUNT) !== 1;
          return (
            <div
              key={index}
              // The extra copies exist only to make the loop; they are not for
              // tabbing to or reading out.
              inert={isClone}
              style={{
                flex: `0 0 ${slot}px`,
                // The card is wider than the slot (its neighbours overlap the
                // slot's edges), so the slot must be allowed to be narrower
                // than its content.
                minWidth: 0,
                display: "flex",
                justifyContent: "center",
                scrollSnapAlign: "center",
              }}
            >
              <div
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                // The section is text-centered; the shop's cards are not.
                className="text-left"
                style={{
                  flex: "none",
                  width: cardWidth,
                  // Same corners as the card, so the shadow follows them.
                  borderRadius: "1rem",
                  willChange: "transform",
                  // Server-rendered with the starting sizes; after that the
                  // scroll handler owns these three.
                  ...layoutFor(index, (COUNT + START_INDEX) * slot, slot),
                }}
              >
                <ShopProductCard product={product} />
              </div>
            </div>
          );
        })}
        <div aria-hidden="true" style={{ flex: `0 0 calc(50% - ${slot / 2}px)` }} />
      </div>
    </section>
  );
}
