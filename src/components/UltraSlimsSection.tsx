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
type Direction = "left" | "right";

// Back (slot 0, mostly hidden) to front (slot 4, fully visible and on top).
const INITIAL_ORDER: ColorKey[] = ["white", "orange", "pink", "gray", "brown"];
const SLOT_COUNT = INITIAL_ORDER.length;
const FRONT_SLOT = SLOT_COUNT - 1;

const SLOT_LEFT_PERCENT = [-11, 2, 12, 23, 37];
const SLOT_BRIGHTNESS = [0.55, 0.68, 0.8, 0.92, 1];
// Front item is full height; each slot behind it is 5px shorter, all sharing
// the same bottom line.
const FRONT_HEIGHT_PERCENT = 80;
const HEIGHT_STEP_PX = 5;
const heightForSlot = (slot: number) =>
  `calc(${FRONT_HEIGHT_PERCENT}% - ${(FRONT_SLOT - slot) * HEIGHT_STEP_PX}px)`;
const OFF_RIGHT_PERCENT = 115;
const OFF_LEFT_PERCENT = -50;
// One step of the carousel: the item at the leading edge leaves, every other
// item moves up one slot (each only once the item ahead of it has started to
// go), and the leaver comes back in at the far end. Anything longer — such as
// choosing an item deep in the stack — is just several steps in a row, each
// one finished before the next begins, so the stack is never left half empty.
const TRANSITION_MS = 300;
const FOLLOW_GAP_MS = 100; // after the item ahead starts leaving that slot
// The leaving item goes out, waits a beat off-screen, then slides back in.
const EXIT_MS = 260;
const ENTRY_MS = 220;
const EXIT_EASE = "cubic-bezier(0.45, 0, 0.55, 1)";
const LEADER_CLEAR_MS = 130; // a leaving item has cleared its slot about halfway out
const ENTRY_GAP_MS = 60;
// Rounds of a multi-step move start this far apart. Any closer and an item
// would be told to move again before it has settled, or two items would end
// up sharing a slot (checked by simulating the whole schedule).
const ROUND_SPACING_MS = 450;
// Upper bound for the "teleported, now re-enter" step (rAF normally beats it).
const REENTER_SETTLE_MS = 100;
const REENTER_TYPICAL_MS = 50;
const SWIPE_THRESHOLD_PX = 30;
const WHEEL_THRESHOLD = 15;

// The item under the finger is "selected": it grows and lifts, nothing else
// about it changes (it stays in its slot and keeps its stacking order). Lift
// is a % of the item's own height so it never gets clipped at the top.
const AXIS_SLOP_PX = 6;
const SELECT_SCALE = 1.08;
const SELECT_LIFT = "-3%";
const VIBRATE_MS = 20;
// Source PNGs are 174x276; used to find the visible part of each item.
const IMAGE_ASPECT = 174 / 276;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SELECT_TRANSITION = `translate 200ms ${EASE}, scale 200ms ${EASE}`;

function rotateForward<T>(order: T[]): T[] {
  return [order[order.length - 1], ...order.slice(0, -1)];
}
function rotateBackward<T>(order: T[]): T[] {
  return [...order.slice(1), order[0]];
}

type StepPlan = {
  hopStart: number[]; // by rank (1..4): when that item moves up one slot
  entryDelay: number; // how long the leaver waits before sliding back in
  totalMs: number;
};

// Works in "rank" space: rank 0 is the edge that leads the motion (the front
// slot for a right step, the back slot for a left one) and ranks grow away
// from it. Each item moves into the slot of the rank ahead of it, and only
// once that item has cleared out; the leaver re-enters at the far end after
// the last item has left that slot.
function planStep(): StepPlan {
  const hopStart: number[] = [];
  let slotAheadFreeAt = LEADER_CLEAR_MS;
  for (let rank = 1; rank < SLOT_COUNT; rank++) {
    hopStart[rank] = slotAheadFreeAt;
    slotAheadFreeAt += FOLLOW_GAP_MS;
  }
  const hiddenAt = EXIT_MS + REENTER_TYPICAL_MS;
  const entryDelay = Math.max(ENTRY_GAP_MS, slotAheadFreeAt - hiddenAt);
  const totalMs = Math.max(
    hopStart[SLOT_COUNT - 1] + TRANSITION_MS,
    EXIT_MS + REENTER_SETTLE_MS + entryDelay + ENTRY_MS,
  );
  return { hopStart, entryDelay, totalMs };
}

const STEP_PLAN = planStep();
const ONE_STEP_MS = STEP_PLAN.totalMs;

type Wrapping = {
  direction: Direction;
  phase: "exit" | "hidden";
  fromSlot: number;
};
type WrappingMap = Partial<Record<ColorKey, Wrapping>>;
type ElementMap = Partial<Record<ColorKey, HTMLDivElement | null>>;

const ZERO_DELAYS = Object.fromEntries(
  INITIAL_ORDER.map((c) => [c, 0]),
) as Record<ColorKey, number>;
const INITIAL_SLOTS = Object.fromEntries(
  INITIAL_ORDER.map((c, i) => [c, i]),
) as Record<ColorKey, number>;

type UltraSlimsSectionProps = {
  buttonHref: string;
};

export default function UltraSlimsSection({ buttonHref }: UltraSlimsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<ElementMap>({});
  const selectRefs = useRef<ElementMap>({});
  const orderRef = useRef<ColorKey[]>(INITIAL_ORDER);
  const animatingRef = useRef(false);

  // Each item's slot as currently drawn. It trails `orderRef` (the order the
  // step ends in) because items move up one at a time, not all at once.
  const [slots, setSlots] = useState<Record<ColorKey, number>>(INITIAL_SLOTS);
  const [delays, setDelays] = useState<Record<ColorKey, number>>(ZERO_DELAYS);
  const [wrapping, setWrapping] = useState<WrappingMap>({});

  // One step. Right: the front item slides off the right edge while every
  // other item moves up a slot, each starting once the item ahead has started
  // to go; left is the exact mirror. The leaver isn't gone for good — once
  // off-screen it is teleported (invisible, no transition) to the opposite
  // edge, waits a beat, then slides in as the new back (or front) item.
  const rotateStep = useCallback((direction: Direction) => {
    const prev = orderRef.current;
    const next = direction === "right" ? rotateForward(prev) : rotateBackward(prev);
    const leaverSlot = direction === "right" ? FRONT_SLOT : 0;
    const leaver = prev[leaverSlot];
    const slotOfRank = (rank: number) => (direction === "right" ? FRONT_SLOT - rank : rank);

    // The leaver stops being rendered specially and takes its normal slot
    // position again after its entry delay. Double-rAF normally does this
    // right after the "hidden" teleport paints, but rAF can simply not fire
    // (backgrounded tab, throttled device), so a timeout backs it up.
    const reenter = () => {
      setWrapping((w) => {
        const current = w[leaver];
        return current ? { ...w, [leaver]: { ...current, phase: "hidden" } } : w;
      });
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        setDelays((d) => ({ ...d, [leaver]: STEP_PLAN.entryDelay }));
        setWrapping((w) => {
          const rest = { ...w };
          delete rest[leaver];
          return rest;
        });
        // The delay belongs to this entry only; clear it once it has played so
        // the item's next move (it steps up in the following round) is on time.
        window.setTimeout(
          () => setDelays((d) => ({ ...d, [leaver]: 0 })),
          STEP_PLAN.entryDelay + ENTRY_MS,
        );
      };
      requestAnimationFrame(() => requestAnimationFrame(settle));
      window.setTimeout(settle, REENTER_SETTLE_MS);
    };

    prev.forEach((color, slot) => {
      const rank = direction === "right" ? FRONT_SLOT - slot : slot;
      if (rank === 0) return;
      const toSlot = slotOfRank(rank - 1);
      window.setTimeout(
        () => setSlots((s) => ({ ...s, [color]: toSlot })),
        STEP_PLAN.hopStart[rank],
      );
    });
    window.setTimeout(reenter, EXIT_MS);

    orderRef.current = next;
    setSlots((s) => ({ ...s, [leaver]: next.indexOf(leaver) }));
    setWrapping((w) => ({
      ...w,
      [leaver]: { direction, phase: "exit", fromSlot: leaverSlot },
    }));
  }, []);

  // Rotates the stack by `steps` slots as that many single steps in a row.
  // Each round starts as soon as the one before it has got far enough along
  // for the two not to collide, rather than after it has fully finished, so
  // choosing an item deep in the stack doesn't take several full rounds.
  const rotate = useCallback(
    (direction: Direction, steps: number) => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      rotateStep(direction);
      for (let round = 1; round < steps; round++) {
        window.setTimeout(() => rotateStep(direction), round * ROUND_SPACING_MS);
      }
      window.setTimeout(
        () => {
          animatingRef.current = false;
          setDelays(ZERO_DELAYS);
        },
        (steps - 1) * ROUND_SPACING_MS + ONE_STEP_MS,
      );
    },
    [rotateStep],
  );

  // Choosing an item behind the front one brings it forward: the front item
  // leaves and comes back at the far end, then the next, and so on, until the
  // chosen item is at the front.
  const bringToFront = useCallback(
    (color: ColorKey) => {
      const slot = orderRef.current.indexOf(color);
      if (slot === FRONT_SLOT) return;
      rotate("right", FRONT_SLOT - slot);
    },
    [rotate],
  );

  // Touching an item selects it; sliding the finger sideways moves the
  // selection to whichever item is under the finger (the items themselves
  // never move), and lifting the finger brings the selected item to the
  // front. A touch that starts on empty space swipes the stack instead.
  // Vertical gestures are left alone so the page still scrolls normally —
  // the axis is only decided once movement passes a small slop, and nothing
  // is intercepted before that or if it turns out vertical.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let startX = 0;
    let startY = 0;
    let selected: ColorKey | null = null;
    let startedOnItem = false;
    let decided = false;
    let horizontal = false;
    let swiped = false;
    let wheelCooldown = false;
    let wheelTimer: number | undefined;

    // Haptic tick. Android browsers have navigator.vibrate, but Chrome only
    // allows it once the user has tapped the page (a touch-down doesn't
    // count), and says so by returning false — then the release of the touch,
    // which does count, gets another go. iPhone Safari has no vibration API;
    // since 17.4 it plays a haptic tick whenever an <input switch> is toggled
    // during a touch, so a hidden one is flipped instead.
    let tickBlocked = false;
    let iosToggle: HTMLLabelElement | null = null;
    let iosInput: HTMLInputElement | null = null;
    const isIOS = () =>
      /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const tick = () => {
      if (typeof navigator.vibrate === "function") {
        tickBlocked = !navigator.vibrate(VIBRATE_MS);
        return;
      }
      if (!isIOS()) return;
      if (!iosToggle || !iosInput) {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.setAttribute("switch", "");
        input.id = `ultra-slims-haptic-${Math.random().toString(36).slice(2)}`;
        input.tabIndex = -1;
        input.setAttribute("aria-hidden", "true");
        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.setAttribute("aria-hidden", "true");
        for (const el of [input, label]) {
          Object.assign(el.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "1px",
            height: "1px",
            opacity: "0",
            pointerEvents: "none",
          });
        }
        document.body.append(input, label);
        iosInput = input;
        iosToggle = label;
      }
      iosToggle.click();
    };

    // Topmost item whose visible artwork covers x (and y, when given).
    const hitTest = (x: number, y?: number): ColorKey | null => {
      let best: ColorKey | null = null;
      let bestSlot = -1;
      for (const color of INITIAL_ORDER) {
        const el = itemRefs.current[color];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // The box is wider than the artwork; only the artwork is touchable.
        const imageWidth = r.height * IMAGE_ASPECT;
        const left = r.left + (r.width - imageWidth) / 2;
        if (x < left || x > left + imageWidth) continue;
        if (y !== undefined && (y < r.top || y > r.bottom)) continue;
        const slot = orderRef.current.indexOf(color);
        if (slot > bestSlot) {
          best = color;
          bestSlot = slot;
        }
      }
      return best;
    };

    const select = (color: ColorKey | null) => {
      if (color === selected) return;
      if (selected) {
        const prev = selectRefs.current[selected];
        if (prev) {
          prev.style.transition = SELECT_TRANSITION;
          prev.style.scale = "1";
          prev.style.translate = "0 0";
        }
      }
      selected = color;
      if (!color) return;
      const el = selectRefs.current[color];
      if (el) {
        el.style.transition = SELECT_TRANSITION;
        el.style.scale = String(SELECT_SCALE);
        el.style.translate = `0 ${SELECT_LIFT}`;
      }
      tick();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      select(null);
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      decided = false;
      horizontal = false;
      swiped = false;
      startedOnItem = false;
      if (animatingRef.current) return;
      const hit = hitTest(t.clientX, t.clientY);
      if (hit) {
        startedOnItem = true;
        select(hit);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (decided && !horizontal) return; // vertical gesture: let the page scroll

      const t = e.touches[0];
      const dx = t.clientX - startX; // positive = finger moved right
      const dy = t.clientY - startY;

      if (!decided) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP_PX) return;
        decided = true;
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (!horizontal) {
          select(null);
          return;
        }
      }

      e.preventDefault();
      if (startedOnItem) {
        select(hitTest(t.clientX));
      } else if (!swiped && Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
        swiped = true;
        rotate(dx < 0 ? "left" : "right", 1);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const color = selected;
      select(null);
      if (!startedOnItem || !color) return;

      // Second chance if Chrome blocked the touch-down buzz; on iPhone the
      // release is the gesture Safari is surest to play a haptic for.
      if (tickBlocked || isIOS()) tick();

      const isFront = orderRef.current.indexOf(color) === FRONT_SLOT;
      // A plain tap on a back item reorders instead of following the
      // surrounding link; a tap on the front item lets the link go through.
      if (!decided && !isFront) e.preventDefault();
      bringToFront(color);
    };

    const onTouchCancel = () => select(null);

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical: ignore
      if (Math.abs(e.deltaX) < WHEEL_THRESHOLD) return;
      if (wheelCooldown) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      wheelCooldown = true;
      rotate(e.deltaX > 0 ? "left" : "right", 1);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelCooldown = false;
      }, ONE_STEP_MS + 100);
    };

    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: false });
    section.addEventListener("touchcancel", onTouchCancel, { passive: true });
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
      section.removeEventListener("touchcancel", onTouchCancel);
      section.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer);
      iosInput?.remove();
      iosToggle?.remove();
    };
  }, [rotate, bringToFront]);

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
        className="relative h-[300px] left-1/2 mt-[46px] aspect-video w-screen -mx-[50vw] touch-pan-y select-none overflow-hidden bg-white [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
      >
        {/* Fixed DOM order on purpose: reordering keyed children makes React
            move the nodes, and a re-inserted node loses its CSS transition
            (it snaps). Slot comes from `order`; the DOM never reshuffles. */}
        {INITIAL_ORDER.map((color) => {
          const slot = slots[color];
          const wrap = wrapping[color];

          let left = `${SLOT_LEFT_PERCENT[slot]}%`;
          let height = heightForSlot(slot);
          let zIndex: number = slot;
          let brightness = SLOT_BRIGHTNESS[slot];
          let transitionDuration = TRANSITION_MS;
          let transitionDelay = delays[color] ?? 0;
          let timingFunction = EASE;
          // Only a leaver sliding back in ever carries a delay (everything else
          // moves up on timers), and it comes in quicker than the others step.
          if (transitionDelay > 0) transitionDuration = ENTRY_MS;

          if (wrap) {
            zIndex = 10 + wrap.fromSlot;
            brightness = SLOT_BRIGHTNESS[FRONT_SLOT];
            if (wrap.phase === "exit") {
              // Keep the height of the slot it is leaving while it slides off.
              height = heightForSlot(wrap.fromSlot);
              left = `${wrap.direction === "right" ? OFF_RIGHT_PERCENT : OFF_LEFT_PERCENT}%`;
              transitionDuration = EXIT_MS;
              transitionDelay = 0;
              timingFunction = EXIT_EASE;
            } else {
              left = `${wrap.direction === "right" ? OFF_LEFT_PERCENT : OFF_RIGHT_PERCENT}%`;
              transitionDuration = 0;
              transitionDelay = 0;
            }
          }

          return (
            <div
              key={color}
              ref={(el) => {
                itemRefs.current[color] = el;
              }}
              className="pointer-events-none absolute bottom-[10%] w-[44%]"
              style={{
                left,
                height,
                zIndex,
                filter: `brightness(${brightness})`,
                transitionProperty: "left, height, filter",
                transitionDuration: `${transitionDuration}ms`,
                transitionTimingFunction: timingFunction,
                transitionDelay: `${transitionDelay}ms`,
              }}
            >
              <div
                ref={(el) => {
                  selectRefs.current[color] = el;
                }}
                className="absolute inset-0"
                style={{ transformOrigin: "50% 100%" }}
              >
                <Image
                  src={IMAGES[color]}
                  alt={`${color} Ultra Slims cover`}
                  fill
                  className="object-contain"
                  sizes="40vw"
                  priority={slot === FRONT_SLOT}
                />
              </div>
            </div>
          );
        })}
      </div>
      </Link>
    </section>
  );
}
