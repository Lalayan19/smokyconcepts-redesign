"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import brown from "@/assets/images/ultra slims/brown.png";
import gray from "@/assets/images/ultra slims/gray.png";
import orange from "@/assets/images/ultra slims/orange.png";
import pink from "@/assets/images/ultra slims/pink.png";
import white from "@/assets/images/ultra slims/white.png";

const IMAGES = { white, orange, pink, gray, brown };
type ColorKey = keyof typeof IMAGES;

// Back (slot 0, mostly hidden) to front (slot 4, fully visible and on top).
const INITIAL_ORDER: ColorKey[] = ["white", "orange", "pink", "gray", "brown"];

const SLOT_LEFT_PERCENT = [-11, 2, 12, 23, 37];
const SLOT_BRIGHTNESS = [0.55, 0.68, 0.8, 0.92, 1];
// Front item is full height; each slot behind it is 5px shorter, all sharing
// the same bottom line.
const FRONT_HEIGHT_PERCENT = 80;
const HEIGHT_STEP_PX = 5;
const heightForSlot = (slot: number) =>
  `calc(${FRONT_HEIGHT_PERCENT}% - ${(4 - slot) * HEIGHT_STEP_PX}px)`;
const OFF_RIGHT_PERCENT = 115;
const OFF_LEFT_PERCENT = -50;
const STAGGER_MS = 100;
const TRANSITION_MS = 300;
const EXIT_MS = 180;
// However much delay is left for the wrapping item's entry once its exit
// has already used some of its "arrives last" budget (4 cascade steps).
const ENTRY_DELAY_MS = Math.max(0, 4 * STAGGER_MS - EXIT_MS);
const SWIPE_THRESHOLD_PX = 30;
const WHEEL_THRESHOLD = 15;

function rotateForward<T>(order: T[]): T[] {
  return [order[4], order[0], order[1], order[2], order[3]];
}
function rotateBackward<T>(order: T[]): T[] {
  return [order[1], order[2], order[3], order[4], order[0]];
}

type Wrapping = {
  color: ColorKey;
  direction: "left" | "right";
  phase: "exit" | "hidden";
};

type UltraSlimsSectionProps = {
  buttonHref: string;
};

export default function UltraSlimsSection({ buttonHref }: UltraSlimsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<ColorKey[]>(INITIAL_ORDER);
  const [delays, setDelays] = useState<Record<ColorKey, number>>(
    Object.fromEntries(INITIAL_ORDER.map((c) => [c, 0])) as Record<ColorKey, number>,
  );
  const [wrapping, setWrapping] = useState<Wrapping | null>(null);
  const animatingRef = useRef(false);

  // A swipe right sends the front item sliding off the right edge of the
  // screen while every other item steps one slot closer to the front, each
  // starting 100ms after the last (so the shift ripples through the stack
  // instead of moving all at once); left is the exact mirror. The exiting
  // item isn't gone for good — once off-screen it's teleported (invisible,
  // no transition) to the opposite edge, then animates in to become the
  // new back slot, landing at the same moment the rest of the cascade
  // finishes.
  const swipe = useCallback((direction: "left" | "right") => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    setOrder((prev) => {
      const wrappingColor = direction === "right" ? prev[4] : prev[0];
      const nextDelays = {} as Record<ColorKey, number>;
      prev.forEach((color, slot) => {
        const steps = direction === "right" ? 4 - slot : slot;
        nextDelays[color] = steps * STAGGER_MS;
      });
      setDelays(nextDelays);
      setWrapping({ color: wrappingColor, direction, phase: "exit" });

      window.setTimeout(() => {
        setWrapping({ color: wrappingColor, direction, phase: "hidden" });

        // The delay recorded earlier for this color was its *exit* delay
        // (always 0 — it leaves immediately). Swap in the delay for its
        // entry now, at the exact render where it stops being rendered
        // specially and starts using the normal slot position, so it still
        // lands at the same moment as the rest of the cascade. Double-rAF
        // normally does this right after the "hidden" teleport paints, but
        // rAF can simply not fire (backgrounded tab, throttled device), so
        // a timeout backs it up — same failsafe pattern used for the video
        // transitions on the personalization page.
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          setDelays((prev) => ({ ...prev, [wrappingColor]: ENTRY_DELAY_MS }));
          setWrapping(null);
        };
        requestAnimationFrame(() => requestAnimationFrame(settle));
        window.setTimeout(settle, 100);
      }, EXIT_MS);

      return direction === "right" ? rotateForward(prev) : rotateBackward(prev);
    });

    window.setTimeout(() => {
      animatingRef.current = false;
    }, 4 * STAGGER_MS + TRANSITION_MS);
  }, []);

  // Horizontal swipe (touch) / trackpad scroll steps through the stack.
  // Vertical gestures are left alone so the page still scrolls normally —
  // axis is only decided once movement crosses the threshold, and nothing
  // is intercepted before that or if it turns out vertical.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let startX = 0;
    let startY = 0;
    let decided = false;
    let horizontal = false;
    let wheelCooldown = false;
    let wheelTimer: number | undefined;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      decided = false;
      horizontal = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (decided && horizontal) {
        e.preventDefault();
        return;
      }
      if (decided && !horizontal) return; // vertical gesture: let the page scroll

      const dx = startX - e.touches[0].clientX; // positive = swiped left
      const dy = startY - e.touches[0].clientY;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;

      decided = true;
      horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal) return;

      e.preventDefault();
      swipe(dx > 0 ? "left" : "right");
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical: ignore
      if (Math.abs(e.deltaX) < WHEEL_THRESHOLD) return;
      if (wheelCooldown) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      wheelCooldown = true;
      swipe(e.deltaX > 0 ? "left" : "right");
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelCooldown = false;
      }, 4 * STAGGER_MS + TRANSITION_MS + 100);
    };

    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer);
    };
  }, [swipe]);

  return (
    <section className="relative left-1/2 mb-3 w-screen -mx-[50vw] rounded-[1.5rem] h-[80vh] supports-[-webkit-touch-callout:none]:max-md:h-[100vh] overflow-hidden bg-white px-6 pt-12 pb-10 text-center">
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
        className="mt-[60px] inline-flex h-10 w-[176px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[20px] font-normal text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        Buy Now
      </button>

      <div
        ref={sectionRef}
        className="relative h-[300px] left-1/2 mt-[46px] aspect-video w-screen -mx-[50vw] touch-pan-y overflow-hidden bg-white"
      >
        {/* Fixed DOM order on purpose: reordering keyed children makes React
            move the nodes, and a re-inserted node loses its CSS transition
            (it snaps). Slot comes from `order`; the DOM never reshuffles. */}
        {INITIAL_ORDER.map((color) => {
          const slot = order.indexOf(color);
          const isWrapping = wrapping?.color === color;

          let left = `${SLOT_LEFT_PERCENT[slot]}%`;
          let height = heightForSlot(slot);
          let zIndex: number = slot;
          let brightness = SLOT_BRIGHTNESS[slot];
          let transitionDuration = TRANSITION_MS;
          let transitionDelay = delays[color] ?? 0;

          if (isWrapping && wrapping) {
            zIndex = 10;
            brightness = SLOT_BRIGHTNESS[4];
            if (wrapping.phase === "exit") {
              // Keep the height of the slot it is leaving while it slides off.
              height = heightForSlot(wrapping.direction === "right" ? 4 : 0);
              left = `${wrapping.direction === "right" ? OFF_RIGHT_PERCENT : OFF_LEFT_PERCENT}%`;
              transitionDuration = EXIT_MS;
              transitionDelay = 0;
            } else {
              left = `${wrapping.direction === "right" ? OFF_LEFT_PERCENT : OFF_RIGHT_PERCENT}%`;
              transitionDuration = 0;
              transitionDelay = 0;
            }
          }

          return (
            <div
              key={color}
              className="absolute bottom-[10%] w-[44%]"
              style={{
                left,
                height,
                zIndex,
                filter: `brightness(${brightness})`,
                transitionProperty: "left, height, filter",
                transitionDuration: `${transitionDuration}ms`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDelay: `${transitionDelay}ms`,
              }}
            >
              <Image
                src={IMAGES[color]}
                alt={`${color} Ultra Slims cover`}
                fill
                className="object-contain"
                sizes="40vw"
                priority={slot === 4}
              />
            </div>
          );
        })}
      </div>
      </Link>
    </section>
  );
}
