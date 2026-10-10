"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { StaticImageData } from "next/image";

// The six drawings of the packs, in the order they are in the row (Asset 1 is
// Ultra Slims, ... Asset 6 is Sticks). They are drawn to one scale, so their
// sizes next to each other are the sizes of the packs.
import ultraSlims from "@/assets/images/Popular sizes/Asset 1.svg";
import compact from "@/assets/images/Popular sizes/Asset 2.svg";
import superSlims from "@/assets/images/Popular sizes/Asset 3.svg";
import slims from "@/assets/images/Popular sizes/Asset 4.svg";
import kingSize from "@/assets/images/Popular sizes/Asset 5.svg";
import sticks from "@/assets/images/Popular sizes/Asset 6.svg";

type Item = { name: string; image: StaticImageData; versions?: string };

// In the order they were in the old picture of the whole row.
const ITEMS: Item[] = [
  { name: "Ultra Slims", image: ultraSlims, versions: "3 versions" },
  { name: "Compact", image: compact, versions: "3 versions" },
  { name: "Super Slims", image: superSlims, versions: "3 versions" },
  { name: "Slims", image: slims, versions: "3 versions" },
  { name: "King Size", image: kingSize },
  { name: "Sticks", image: sticks },
];
const COUNT = ITEMS.length;
// Which item is in the middle when the page loads.
const START_INDEX = 2;

// The packs stand on a line 208px below the top of the row (the tallest packs,
// Super Slims and Slims, are drawn 208px tall), and under them there is room for the name
// of the pack in the middle and the small line under it. The row is under the
// section's text, and the button under the row (see globals.css).
const PACK_BOX_PX = 208;
const LABEL_GAP_PX = 4;
const LABEL_H = 34;
// The pictures are drawn at this share of their own size.
const ART_SCALE = PACK_BOX_PX / superSlims.height;
// On a small phone (see globals.css) everything about the packs is smaller by
// this factor, so the row still fits in the section.
const K = "var(--pack-k, 1)";
const ROW_H = `calc(${K} * ${PACK_BOX_PX}px + ${LABEL_GAP_PX + LABEL_H}px)`;
const PACK_H = `calc(${K} * ${PACK_BOX_PX}px)`;

// The packs stand in a loop, each GAP_PX from the next (edge to edge, at full
// size; the packs are not all as wide, so their centres are not all the same
// distance apart): the one in the middle at full size, with one next to it on
// each side (a little smaller). The size changes continuously with the distance
// from the middle while you drag.
const GAP_PX = 12;
const MIN_SCALE = 0.8;
// The box each pack stands in (the picture is centred in it).
const BOX_PX = 150;
// The packs further out than the ones next to the middle one fade out between
// 1 and FADE_END items from the middle, so none shows at the edge of the screen
// when the row is at rest, and they fade in as they come close.
const FADE_END = 1.8;

// Where each pack's centre is along the loop, in px at full size, and the
// length of the whole loop.
const WIDTHS = ITEMS.map((item) => Math.round(item.image.width * ART_SCALE));
const CENTERS: number[] = [];
WIDTHS.forEach((width, i) => {
  CENTERS.push(i === 0 ? 0 : CENTERS[i - 1] + (WIDTHS[i - 1] + width) / 2 + GAP_PX);
});
const PERIOD = WIDTHS.reduce((sum, width) => sum + width + GAP_PX, 0);

// Letting go of a drag: how far ahead (ms) the swipe speed is projected to
// choose the item to land on, and the most items one swipe can travel.
const PROJECT_MS = 280;
const MAX_FLING = 6;

const mod = (value: number, size: number) => ((value % size) + size) % size;

// The distance along the loop (px at full size) of the row's position `pos`
// (in items, may be a fraction, may be any number), and back.
function posToStrip(pos: number) {
  const turns = Math.floor(pos / COUNT);
  const within = pos - turns * COUNT;
  const n = Math.floor(within);
  const from = CENTERS[n];
  const to = n + 1 < COUNT ? CENTERS[n + 1] : PERIOD;
  return turns * PERIOD + from + (within - n) * (to - from);
}

function stripToPos(strip: number) {
  const turns = Math.floor(strip / PERIOD);
  const within = strip - turns * PERIOD;
  let n = COUNT - 1;
  while (n > 0 && CENTERS[n] > within) n -= 1;
  const from = CENTERS[n];
  const to = n + 1 < COUNT ? CENTERS[n + 1] : PERIOD;
  return turns * COUNT + n + (within - from) / (to - from);
}

// How far, in items, the item at `index` is from the middle when the row is at
// `pos` (the item `pos` is exactly in the middle), going the short way round
// the loop. The row is only these items: the one that leaves on one side is the
// same one that arrives on the other.
function offsetFrom(index: number, pos: number) {
  return mod(index - pos + COUNT / 2, COUNT) - COUNT / 2;
}

function placementFor(index: number, pos: number) {
  const offset = offsetFrom(index, pos);
  const distance = Math.abs(offset);
  const t = Math.min(1, distance);
  const eased = t * t * (3 - 2 * t);
  const scale = 1 - (1 - MIN_SCALE) * eased;
  const opacity = Math.max(0, Math.min(1, (FADE_END - distance) / (FADE_END - 1)));
  // Going the short way round the loop; the pack that leaves on one side is the
  // same one that arrives on the other, out of sight (it has faded out by then).
  const x = mod(CENTERS[index] - posToStrip(pos) + PERIOD / 2, PERIOD) - PERIOD / 2;
  return {
    // The packs are smaller on a small phone (see globals.css), and so are the
    // spaces between them.
    transform: `translate3d(calc(${K} * ${x.toFixed(2)}px), 0, 0) scale(${scale.toFixed(4)})`,
    opacity: Number(opacity.toFixed(3)),
    zIndex: Math.round(100 - distance * 10),
  };
}

type LabelState = {
  current: number;
  // The name that is on its way out, if the middle pack just changed.
  previous: number | null;
  // How many times the middle pack has changed; used to restart the animation.
  changes: number;
  // Which way the row moved: 1 when the next packs come in from the right
  // (dragging to the left), -1 the other way.
  direction: 1 | -1;
};

function Name({ item }: { item: Item }) {
  return (
    <>
      <span
        className="block font-bold text-black"
        style={{ fontSize: 16, lineHeight: "20px" }}
      >
        {item.name}
      </span>
      {item.versions && (
        <span
          className="block font-medium text-[#6b6b6b]"
          style={{ marginTop: 2, fontSize: 10, lineHeight: "12px" }}
        >
          {item.versions}
        </span>
      )}
    </>
  );
}

export default function PopularSizesSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Which item is in the middle, as a fraction while the row is moving.
  const posRef = useRef(START_INDEX);
  const [label, setLabel] = useState<LabelState>({
    current: START_INDEX,
    previous: null,
    changes: 0,
    direction: 1,
  });

  // The row is moved by hand rather than by the browser's own scrolling: a
  // scroller has two ends, and a hard swipe would run into one of them. Here
  // there are only the items, placed by `pos`, so there is never an end.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame: number | null = null;
    let middle = mod(Math.round(posRef.current), COUNT); // the pack nearest the middle

    const show = (next: number) => {
      posRef.current = next;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const placement = placementFor(i, next);
        el.style.transform = placement.transform;
        el.style.opacity = String(placement.opacity);
        el.style.zIndex = String(placement.zIndex);
      });
      const nearest = mod(Math.round(next), COUNT);
      if (nearest !== middle) {
        // The short way round from the old middle pack to the new one.
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
    show(posRef.current);

    // A picture that has never been on screen is only decoded the first time
    // it is painted, which can leave a pack empty for a moment as it slides in.
    // Decode them all now instead.
    itemRefs.current.forEach((el) => {
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
      let startedAt: number | null = null;
      const step = (now: number) => {
        if (startedAt === null) startedAt = now;
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
    // How much smaller than full size the packs are drawn (a small phone).
    const packScale = () =>
      parseFloat(getComputedStyle(track).getPropertyValue("--pack-k")) || 1;

    let drag: {
      id: number;
      startX: number;
      startPos: number;
      startStrip: number; // where along the loop the row was when the finger went down
      scale: number; // packScale() when the finger went down
      pack: number | null; // the pack the finger went down on
      moved: boolean;
      stoppedMotion: boolean; // the finger went down on a row that was still moving
      samples: { t: number; x: number }[]; // the last ~100ms, for the speed
    } | null = null;
    // The whole section opens the size picker when it is tapped, so the end of
    // a drag (which also ends over the row) must not count as a tap.
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
      show(stripToPos(drag.startStrip - dx / drag.scale));
    };
    const endDrag = (e: PointerEvent, cancelled: boolean) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      track.style.cursor = "grab";

      const pos = posRef.current;
      // A tap on a pack that is not the one in the middle brings that pack to
      // the middle and nothing else: it must not open the size picker.
      const tappedOther =
        !d.moved &&
        !cancelled &&
        d.pack !== null &&
        d.pack !== mod(Math.round(pos), COUNT);

      if (d.moved || d.stoppedMotion || tappedOther) {
        suppressClick = true;
        window.clearTimeout(suppressTimer);
        suppressTimer = window.setTimeout(() => {
          suppressClick = false;
        }, 350);
      }

      if (tappedOther && d.pack !== null) {
        animateTo(pos + offsetFrom(d.pack, pos), 420);
        return;
      }
      if (!d.moved) {
        // A tap on the pack in the middle (or anywhere else in the section):
        // it opens the size picker; the row settles on a pack in case the tap
        // stopped it half way.
        animateTo(Math.round(pos), 260);
        return;
      }

      // Land on the pack the swipe is heading for: further the faster it was.
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
        Math.max(
          rest - MAX_FLING,
          Math.round(stripToPos(posToStrip(pos) - (speed / d.scale) * PROJECT_MS)),
        ),
      );
      animateTo(target, 300 + 120 * Math.min(Math.abs(target - pos), 5));
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
      const pack = (e.target as Element).closest("[data-pack]");
      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: posRef.current,
        startStrip: posToStrip(posRef.current),
        scale: packScale(),
        pack: pack ? Number(pack.getAttribute("data-pack")) : null,
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
        stripToPos(
          posToStrip(posRef.current) +
            (e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX) / packScale(),
        ),
      );
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(
        () => animateTo(Math.round(posRef.current), 300),
        120,
      );
    };

    // The pictures would otherwise start a browser drag-and-drop.
    const onDragStart = (e: Event) => e.preventDefault();

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("click", onClickCapture, true);
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("dragstart", onDragStart);
    return () => {
      stop();
      window.clearTimeout(wheelTimer);
      window.clearTimeout(suppressTimer);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, []);

  const shift = { "--name-shift": `${label.direction * 50}%` } as CSSProperties;

  return (
    <>
    <div
      ref={trackRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="Popular sizes"
      className="popular-sizes-track relative select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
      style={{
        height: ROW_H,
        // Nothing in here can be scrolled into view, so the packs off to the
        // side stay put when they are dragged.
        overflow: "clip",
        // The packs' stacking order (middle one on top) stays inside the row.
        isolation: "isolate",
        // Sideways is ours, up and down still scrolls the page.
        touchAction: "pan-y",
        cursor: "grab",
      }}
    >
      {/* The packs, all standing on the same line. */}
      <div className="absolute inset-x-0 top-0" style={{ height: PACK_H }}>
        {ITEMS.map((item, index) => (
          <div
            key={item.name}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            data-pack={index}
            className="absolute flex items-end justify-center"
            style={{
              top: 0,
              left: "50%",
              width: BOX_PX,
              height: PACK_H,
              marginLeft: -BOX_PX / 2,
              // They shrink towards the line they stand on.
              transformOrigin: "50% 100%",
              willChange: "transform",
              // Server-rendered with the starting places; after that the drag
              // code owns these.
              ...placementFor(index, START_INDEX),
            }}
          >
            <Image
              src={item.image}
              alt={item.name}
              width={Math.round(item.image.width * ART_SCALE)}
              height={Math.round(item.image.height * ART_SCALE)}
              // Only six small pictures, fetched as soon as the page loads, so
              // a pack is never empty when it slides into view.
              loading="eager"
              draggable={false}
              className="block max-w-none"
              style={{
                width: `calc(${K} * ${Math.round(item.image.width * ART_SCALE)}px)`,
                height: `calc(${K} * ${Math.round(item.image.height * ART_SCALE)}px)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* The name of the pack in the middle, and the small line under it, below
          the packs: when the middle pack changes the old name leaves the way the
          row is moving and the new one comes in from the other side. */}
      <div
        className="absolute left-1/2 overflow-hidden text-center font-montserrat"
        style={{
          bottom: 0,
          height: LABEL_H,
          width: 240,
          marginLeft: -120,
        }}
      >
        {label.previous !== null && (
          <span
            key={`out-${label.changes}`}
            aria-hidden="true"
            className="product-name-out absolute inset-0"
            style={shift}
            onAnimationEnd={() =>
              setLabel((s) =>
                s.changes === label.changes ? { ...s, previous: null } : s,
              )
            }
          >
            <Name item={ITEMS[label.previous]} />
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
          style={shift}
        >
          <Name item={ITEMS[label.current]} />
        </span>
      </div>
    </div>

    {/* A tablet and larger (see `.popular-sizes-static` in globals.css) has no
        slider: all the packs stand in one row, each with its name under it. */}
    <div
      role="list"
      aria-label="Popular sizes"
      className="popular-sizes-static hidden font-montserrat"
    >
      {ITEMS.map((item) => (
        <div
          key={item.name}
          role="listitem"
          className="popular-sizes-static-item"
          // The pack's own width is what it is when the row has room; when the
          // row is narrower the packs all get narrower together.
          style={{ flexBasis: Math.round(item.image.width * ART_SCALE) }}
        >
          <div className="popular-sizes-static-art">
            <Image
              src={item.image}
              alt={item.name}
              width={Math.round(item.image.width * ART_SCALE)}
              height={Math.round(item.image.height * ART_SCALE)}
              draggable={false}
            />
          </div>
          <div className="popular-sizes-static-label">
            <Name item={item} />
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
