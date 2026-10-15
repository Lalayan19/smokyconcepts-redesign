"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";


// The coin of a passport page: a disc with two faces (the collection's knight on both, as
// on a real coin) that is turned round its vertical axis by dragging it sideways, with
// a mouse or a finger. It carries on turning after a flick, slowing down, and then settles on
// the nearest face-forward position. (From the landing's hero medallion.) Up and down still
// scrolls the page on a touch screen (`touch-action: pan-y`).
export default function PassportCoin({ coin, alt }: { coin: StaticImageData; alt: string }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const disc = discRef.current;
    if (!zone || !disc) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let angle = 0; // degrees round the vertical axis
    let speed = 0; // degrees per frame while it carries on
    let drag: { last: number; t: number; v: number } | null = null;
    let frame: number | null = null;

    const draw = () => {
      disc.style.transform = `rotateY(${angle}deg)`;
    };

    const step = () => {
      frame = null;
      if (drag) return;
      angle += speed;
      speed *= 0.955;
      if (Math.abs(speed) < 0.6) {
        // settle face-forward: pulled to the nearest whole turn
        const target = Math.round(angle / 360) * 360;
        speed += (target - angle) * 0.02;
        speed *= 0.85;
        if (Math.abs(target - angle) < 0.05 && Math.abs(speed) < 0.05) {
          angle = target;
          speed = 0;
          draw();
          return;
        }
      }
      draw();
      frame = requestAnimationFrame(step);
    };
    const run = () => {
      if (frame === null) frame = requestAnimationFrame(step);
    };

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      drag = { last: e.clientX, t: e.timeStamp, v: 0 };
      speed = 0;
      zone.setPointerCapture(e.pointerId);
      zone.classList.add("passport-coin-held");
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.last;
      angle += dx * 0.9;
      drag.v = (dx / Math.max(8, e.timeStamp - drag.t)) * 16 * 0.9;
      drag.last = e.clientX;
      drag.t = e.timeStamp;
      draw();
    };
    const onUp = () => {
      if (!drag) return;
      speed = reduce.matches ? 0 : drag.v * 1.4;
      drag = null;
      zone.classList.remove("passport-coin-held");
      if (reduce.matches) {
        angle = Math.round(angle / 360) * 360;
        draw();
      } else {
        run();
      }
    };
    const noDrag = (e: Event) => e.preventDefault();

    zone.addEventListener("pointerdown", onDown);
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerup", onUp);
    zone.addEventListener("pointercancel", onUp);
    zone.addEventListener("dragstart", noDrag);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      zone.removeEventListener("pointerdown", onDown);
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerup", onUp);
      zone.removeEventListener("pointercancel", onUp);
      zone.removeEventListener("dragstart", noDrag);
    };
  }, []);

  return (
    <div ref={zoneRef} className="passport-coin" role="img" aria-label={`${alt}. Drag sideways to spin it.`}>
      <div ref={discRef} className="passport-coin-disc">
        <div className="passport-coin-edge" />
        <div className="passport-coin-face">
          <Image
            src={coin}
            alt=""
            priority
            draggable={false}
            sizes="(min-width: 1536px) 300px, 260px"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="passport-coin-face passport-coin-back">
          <Image
            src={coin}
            alt=""
            draggable={false}
            sizes="(min-width: 1536px) 300px, 260px"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
