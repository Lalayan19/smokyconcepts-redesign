"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import type { StaticImageData } from "next/image";

// The six drawings of the packs, in the order they are in the row. They are drawn
// to one scale, so their sizes next to each other are the sizes of the packs. (The
// names of the files are as they are in the folder, letter for letter: the server
// tells "Slims" from "slims".)
import ultraSlims from "@/assets/images/Popular sizes/Ultra slims.svg";
import compact from "@/assets/images/Popular sizes/Compact.svg";
import superSlims from "@/assets/images/Popular sizes/super slims.svg";
import slims from "@/assets/images/Popular sizes/slims.svg";
import kingSize from "@/assets/images/Popular sizes/king size.svg";
import sticks from "@/assets/images/Popular sizes/sticks.svg";

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
// Which pack is in the middle when the page loads.
const START_INDEX = 2;

// The tallest packs, Super Slims and Slims, are drawn 208px tall at full size (as the
// tablet's and the laptop's row has them: see globals.css).
const PACK_BOX_PX = 208;
// On a phone the name of a pack (11px) and the small line under it (7.6px) are smaller
// than a tablet's and a laptop's (16px and 10px), and a little further from the pack.
const LABEL_GAP_PX = 6;
const LABEL_H = 23;
// The pictures are drawn at this share of their own size.
const ART_SCALE = PACK_BOX_PX / superSlims.height;
// On a phone the packs are drawn smaller than that (the tallest are 161px tall), and the
// space between them is smaller too (24px at full size, GAP_PX below).
const PHONE_ICON_SCALE = 0.775;
// The packs stand on a line at the bottom of the row, and the row is as tall as the
// tallest of them (so the "Select Cigarette" button above it is as far from the tops of
// the packs as it is from the text above it, see globals.css); under each pack there
// is room for its name and the small line under it. The row is under the section's text
// and button.
const PHONE_PACK_BOX_PX = PACK_BOX_PX * PHONE_ICON_SCALE;
// On a small phone (see globals.css) everything about the packs is smaller by
// this factor, so the row still fits in the section.
const K = "var(--pack-k, 1)";
const ROW_H = `calc(${K} * ${PHONE_PACK_BOX_PX}px + ${LABEL_GAP_PX + LABEL_H}px)`;
const PACK_H = `calc(${K} * ${PHONE_PACK_BOX_PX}px)`;

// The packs stand in a loop, each GAP_PX from the next (edge to edge; the packs are
// not all as wide, so their centres are not all the same distance apart), all the
// same size. Nothing pulls the row to a pack, and no pack is bigger than the others;
// the row goes where the finger takes it, and a little further when it is let go
// quickly.
const GAP_PX = 12;

// The width of each pack's picture at full size (as the tablet's and the laptop's
// row has them), and on a phone.
const WIDTHS = ITEMS.map((item) => Math.round(item.image.width * ART_SCALE));
const PHONE_WIDTHS = WIDTHS.map((width) => Math.round(width * PHONE_ICON_SCALE));

// Where each pack's centre is along the loop, in px at full size, and the
// length of the whole loop.
const CENTERS: number[] = [];
PHONE_WIDTHS.forEach((width, i) => {
  CENTERS.push(
    i === 0 ? 0 : CENTERS[i - 1] + (PHONE_WIDTHS[i - 1] + width) / 2 + GAP_PX,
  );
});
const PERIOD = PHONE_WIDTHS.reduce((sum, width) => sum + width + GAP_PX, 0);

// The loop is drawn five times, side by side (two turns before, the real one, two
// turns after), so on a screen wider than the loop (a phone turned sideways) a
// pack that leaves on one side is already there on the other, and nothing ever
// pops in at an edge.
const TURNS = [-2, -1, 0, 1, 2];
// (The middle of the row is the space between the pack in the middle and the next one,
// Super Slims and Slims: with Compact, Super Slims, Slims and King Size in view.)
const START_STRIP =
  (CENTERS[START_INDEX] +
    PHONE_WIDTHS[START_INDEX] / 2 +
    CENTERS[START_INDEX + 1] -
    PHONE_WIDTHS[START_INDEX + 1] / 2) /
  2;

// How fast the row slows down after a flick (a share of its speed is left after
// each millisecond), and the speed (px per ms) it stops at.
const FRICTION = 0.9965;
const STOP_SPEED = 0.02;
const MAX_SPEED = 3;

const mod = (value: number, size: number) => ((value % size) + size) % size;

// Where the pack `index`, in the turn `turn`, is (its centre, in px at full size,
// from the middle of the row) when the middle of the row is `strip` px along the
// loop.
function transformFor(index: number, turn: number, strip: number) {
  const x = CENTERS[index] + turn * PERIOD - strip;
  // The packs are smaller on a small phone (see globals.css), and so are the
  // spaces between them.
  return `translate3d(calc(${K} * ${x.toFixed(2)}px), 0, 0)`;
}

// The name of a pack and the line under it: smaller on a phone (`compact`).
function Name({ item, compact = false }: { item: Item; compact?: boolean }) {
  return (
    <>
      <span
        className="block font-bold text-black"
        style={
          compact ? { fontSize: 10.8, lineHeight: "13px" } : { fontSize: 16, lineHeight: "20px" }
        }
      >
        {item.name}
      </span>
      {item.versions && (
        <span
          className="block font-medium text-[#6b6b6b]"
          style={
            compact
              ? { marginTop: 1, fontSize: 7.6, lineHeight: "9px" }
              : { marginTop: 2, fontSize: 10, lineHeight: "12px" }
          }
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
  // How far along the loop the middle of the row is (0 up to PERIOD).
  const stripRef = useRef(START_STRIP);

  // The row is moved by hand rather than by the browser's own scrolling: a
  // scroller has two ends, and a hard swipe would run into one of them. Here
  // there are only the packs, placed by `strip`, so there is never an end.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame: number | null = null;

    const show = (next: number) => {
      const strip = mod(next, PERIOD);
      stripRef.current = strip;
      itemRefs.current.forEach((el, n) => {
        if (!el) return;
        el.style.transform = transformFor(n % COUNT, TURNS[Math.floor(n / COUNT)], strip);
      });
    };
    show(stripRef.current);

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

    // The row keeps going after a flick, a little less fast each moment, until it
    // stops wherever it is. `speed` is in px per ms along the loop.
    const glide = (speed: number) => {
      stop();
      if (
        Math.abs(speed) < STOP_SPEED ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      let v = speed;
      let last: number | null = null;
      const step = (now: number) => {
        if (last === null) last = now;
        const dt = Math.min(now - last, 50);
        last = now;
        show(stripRef.current + v * dt);
        v *= Math.pow(FRICTION, dt);
        frame = Math.abs(v) > STOP_SPEED ? requestAnimationFrame(step) : null;
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
      startStrip: number; // where along the loop the row was when the finger went down
      scale: number; // packScale() when the finger went down
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
      show(drag.startStrip - dx / drag.scale);
    };
    const endDrag = (e: PointerEvent, cancelled: boolean) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      track.style.cursor = "grab";

      if (d.moved || d.stoppedMotion) {
        suppressClick = true;
        window.clearTimeout(suppressTimer);
        suppressTimer = window.setTimeout(() => {
          suppressClick = false;
        }, 350);
      }
      // A tap (anywhere in the section) opens the size picker.
      if (!d.moved) return;

      // The row goes on with the speed the finger had when it let go (none, if it
      // had stopped), the way the finger was moving: the row goes the other way.
      const first = d.samples[0];
      const last = d.samples[d.samples.length - 1];
      const elapsed = last.t - first.t;
      const stillFor = e.timeStamp - last.t;
      const fingerSpeed =
        cancelled || stillFor > 80 || elapsed <= 0
          ? 0
          : (last.x - first.x) / elapsed; // px per ms, positive towards the right
      glide(Math.max(-MAX_SPEED, Math.min(MAX_SPEED, -fingerSpeed / d.scale)));
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
        startStrip: stripRef.current,
        scale: packScale(),
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
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // the page scrolls
      e.preventDefault();
      stop();
      show(
        stripRef.current + (e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX) / packScale(),
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
          // Sideways is ours, up and down still scrolls the page.
          touchAction: "pan-y",
          cursor: "grab",
        }}
      >
        {/* The packs, each with its name (and the "3 versions" under it) beneath,
            all standing on the same line. The turns before and after the real one
            are only there to fill the sides (see TURNS). */}
        {TURNS.flatMap((turn, turnIndex) =>
          ITEMS.map((item, index) => {
            const width = PHONE_WIDTHS[index];
            const height = Math.round(item.image.height * ART_SCALE * PHONE_ICON_SCALE);
            const real = turn === 0;
            return (
              <div
                key={`${turn}-${item.name}`}
                ref={(el) => {
                  itemRefs.current[turnIndex * COUNT + index] = el;
                }}
                aria-hidden={real ? undefined : true}
                className="absolute flex flex-col items-center font-montserrat"
                style={
                  {
                    top: 0,
                    left: "50%",
                    width: `calc(${K} * ${width}px)`,
                    height: ROW_H,
                    marginLeft: `calc(${K} * ${-width / 2}px)`,
                    willChange: "transform",
                    // Server-rendered with the starting places; after that the drag
                    // code owns this.
                    transform: transformFor(index, turn, START_STRIP),
                  } as CSSProperties
                }
              >
                <div className="flex w-full items-end justify-center" style={{ height: PACK_H }}>
                  <Image
                    src={item.image}
                    alt={real ? item.name : ""}
                    width={width}
                    height={height}
                    // Only six small pictures, fetched as soon as the page loads,
                    // so a pack is never empty when it slides into view.
                    loading="eager"
                    draggable={false}
                    className="block max-w-none"
                    style={{
                      width: `calc(${K} * ${width}px)`,
                      height: `calc(${K} * ${height}px)`,
                    }}
                  />
                </div>
                {/* (A name can be wider than a small pack: it is centred on the
                    pack and goes out of it on both sides.) */}
                <div
                  className="flex w-full justify-center whitespace-nowrap text-center"
                  style={{ height: LABEL_H, marginTop: LABEL_GAP_PX }}
                >
                  <div className="flex-none">
                    <Name item={item} compact />
                  </div>
                </div>
              </div>
            );
          }),
        )}

        {/* Fades the packs out towards both edges (white, as the section is): 75%
            white at the very edge, and gone 48% of the width in from it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 48%, rgba(255, 255, 255, 0) 52%, rgba(255, 255, 255, 0.75) 100%)",
          }}
        />
      </div>

      {/* A tablet and larger (see `.popular-sizes-static` in globals.css) has no
          slider: all the packs stand in one row, each with its name under it. */}
      <div
        role="list"
        aria-label="Popular sizes"
        className="popular-sizes-static hidden font-montserrat"
      >
        {ITEMS.map((item, index) => (
          <div
            key={item.name}
            role="listitem"
            className="popular-sizes-static-item"
            // The pack's own width is what it is when the row has room; when the
            // row is narrower the packs all get narrower together.
            style={{ flexBasis: WIDTHS[index] }}
          >
            <div className="popular-sizes-static-art">
              <Image
                src={item.image}
                alt={item.name}
                width={WIDTHS[index]}
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
