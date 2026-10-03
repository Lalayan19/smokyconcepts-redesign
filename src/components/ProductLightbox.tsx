"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 40;

type ProductLightboxProps = {
  images: StaticImageData[];
  alt: string;
  title: string;
  active: number;
  // The picture in the middle changes only through the small ones underneath.
  onSelect: (index: number) => void;
  onClose: () => void;
};

type Point = { x: number; y: number };

// The picture of a product in the middle of the screen on a dark background,
// with the small pictures underneath and no way to move on by swiping. The one
// in the middle can be zoomed (pinch, mouse wheel, double tap or double click)
// and, once zoomed, dragged around.
export default function ProductLightbox({
  images,
  alt,
  title,
  active,
  onSelect,
  onClose,
}: ProductLightboxProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  // No scrolling of the page behind, Escape closes.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Zooming. Starts again from "not zoomed" for every picture.
  useEffect(() => {
    const area = areaRef.current;
    const image = imageRef.current;
    const heading = titleRef.current;
    if (!area || !image || !heading) return;

    // How the picture is placed: `x`/`y` is how far its centre has been moved
    // from the centre of the area, `scale` how much it is enlarged.
    const view = { scale: 1, x: 0, y: 0 };

    const centreOf = (e: { clientX: number; clientY: number }): Point => {
      const r = area.getBoundingClientRect();
      return {
        x: e.clientX - (r.left + r.width / 2),
        y: e.clientY - (r.top + r.height / 2),
      };
    };

    // The enlarged picture may be moved only as far as it overhangs the area,
    // and sits in the middle while it is smaller than the area.
    const constrain = () => {
      if (view.scale <= 1) {
        view.scale = 1;
        view.x = 0;
        view.y = 0;
        return;
      }
      const maxX = Math.max(0, (image.offsetWidth * view.scale - area.clientWidth) / 2);
      const maxY = Math.max(0, (image.offsetHeight * view.scale - area.clientHeight) / 2);
      view.x = Math.min(maxX, Math.max(-maxX, view.x));
      view.y = Math.min(maxY, Math.max(-maxY, view.y));
    };

    const apply = (animate: boolean) => {
      image.style.transition = animate
        ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none";
      image.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
      area.style.cursor = view.scale > 1 ? "grab" : "zoom-in";
      // The name would sit unreadably on top of the enlarged picture.
      heading.style.opacity = view.scale > 1.05 ? "0" : "1";
    };

    // Zoom to `scale`, keeping the spot under `point` where it is.
    const zoomAt = (point: Point, scale: number, animate: boolean) => {
      const next = Math.min(MAX_SCALE, Math.max(1, scale));
      const k = next / view.scale;
      view.x = point.x - k * (point.x - view.x);
      view.y = point.y - k * (point.y - view.y);
      view.scale = next;
      constrain();
      apply(animate);
    };

    const pointers = new Map<number, Point>();
    let pan: { from: Point; x: number; y: number } | null = null;
    let pinch: { distance: number; scale: number; spot: Point } | null = null;
    // For telling a tap from a drag, and a double tap from a single one.
    let down: { at: Point; t: number; moved: boolean } | null = null;
    let lastTap: { at: Point; t: number } | null = null;

    const startPan = () => {
      const [only] = [...pointers.values()];
      pan = only ? { from: only, x: view.x, y: view.y } : null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const p = centreOf(e);
      pointers.set(e.pointerId, p);
      try {
        area.setPointerCapture(e.pointerId);
      } catch {
        // capture can fail for a pointer the browser no longer tracks
      }
      if (pointers.size === 1) {
        down = { at: p, t: e.timeStamp, moved: false };
        startPan();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pinch = {
          distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          scale: view.scale,
          // The spot of the picture that is under the fingers, measured on the
          // picture itself.
          spot: { x: (mid.x - view.x) / view.scale, y: (mid.y - view.y) / view.scale },
        };
        pan = null;
        if (down) down.moved = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const p = centreOf(e);
      pointers.set(e.pointerId, p);

      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const scale = Math.min(
          MAX_SCALE,
          Math.max(0.8, (pinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.distance),
        );
        view.scale = scale;
        view.x = mid.x - scale * pinch.spot.x;
        view.y = mid.y - scale * pinch.spot.y;
        if (scale >= 1) constrain();
        apply(false);
        return;
      }

      if (down && Math.hypot(p.x - down.at.x, p.y - down.at.y) > 6) down.moved = true;
      if (pan && view.scale > 1) {
        view.x = pan.x + (p.x - pan.from.x);
        view.y = pan.y + (p.y - pan.from.y);
        constrain();
        apply(false);
        area.style.cursor = "grabbing";
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const p = pointers.get(e.pointerId)!;
      pointers.delete(e.pointerId);

      if (pinch && pointers.size < 2) {
        pinch = null;
        // Let go of a pinch that left it smaller than the area: back to size.
        if (view.scale < 1.02) {
          view.scale = 1;
          constrain();
          apply(true);
        }
        startPan();
      }

      if (pointers.size > 0) return;

      pan = null;
      area.style.cursor = view.scale > 1 ? "grab" : "zoom-in";
      if (e.type === "pointercancel" || !down || down.moved) {
        down = null;
        return;
      }
      // A tap. Two close together zoom in (or back out).
      const tap = { at: p, t: e.timeStamp };
      down = null;
      if (
        lastTap &&
        tap.t - lastTap.t < DOUBLE_TAP_MS &&
        Math.hypot(tap.at.x - lastTap.at.x, tap.at.y - lastTap.at.y) < DOUBLE_TAP_PX
      ) {
        lastTap = null;
        zoomAt(tap.at, view.scale > 1.05 ? 1 : DOUBLE_TAP_SCALE, true);
      } else {
        lastTap = tap;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // A trackpad pinch arrives as a wheel with ctrl held, in smaller steps.
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
      zoomAt(centreOf(e), view.scale * k, false);
    };

    apply(false);
    area.addEventListener("pointerdown", onPointerDown);
    area.addEventListener("pointermove", onPointerMove);
    area.addEventListener("pointerup", onPointerEnd);
    area.addEventListener("pointercancel", onPointerEnd);
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      area.removeEventListener("pointerdown", onPointerDown);
      area.removeEventListener("pointermove", onPointerMove);
      area.removeEventListener("pointerup", onPointerEnd);
      area.removeEventListener("pointercancel", onPointerEnd);
      area.removeEventListener("wheel", onWheel);
    };
  }, [active]);

  return createPortal(
    <div
      className="animate-gallery-fade-in fixed inset-0 flex items-center justify-center bg-black/85 p-4"
      // Above the header, which has the highest stacking order there is.
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: pictures`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-modal-scale-in relative flex w-full max-w-[36rem] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <h2
          ref={titleRef}
          className="pointer-events-none absolute top-3 left-3 z-10 max-w-[60%] text-[1.375rem] leading-tight font-extrabold text-[#414141] transition-opacity duration-200"
        >
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#122a26]/70 text-white backdrop-blur-sm transition-transform active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
          </svg>
        </button>

        <div
          ref={areaRef}
          className="relative flex touch-none items-center justify-center overflow-hidden select-none"
          style={{ height: "min(26rem, 56dvh)", cursor: "zoom-in" }}
        >
          <span
            key={active}
            ref={imageRef}
            className="animate-gallery-fade-in relative h-[17rem] w-[13rem] sm:h-[22rem] sm:w-[16.5rem]"
            style={{ willChange: "transform" }}
          >
            <Image
              src={images[active]}
              alt={alt}
              fill
              priority
              // Drawn up to five times larger, so the file is picked for that.
              sizes="900px"
              draggable={false}
              className="object-contain object-bottom"
            />
          </span>
        </div>

        <div className="flex items-center justify-center gap-2.5 bg-white px-5 pt-4 pb-5">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
              className="relative flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f4f1] shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-transform active:scale-95"
              style={
                index === active
                  ? { boxShadow: "0 0 0 4px #ffffff, 0 0 0 6px #dcc090" }
                  : undefined
              }
            >
              <span className="relative h-[2.75rem] w-[2.25rem]">
                <Image src={image} alt="" fill sizes="40px" className="object-contain object-bottom" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
