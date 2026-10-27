"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useTranslations } from "next-intl";

import descriptionImage from "@/assets/images/description-image.png";
import slider5 from "@/assets/images/slider5.jpg";
import slider6 from "@/assets/images/slider6.jpeg";

type StorySlide = {
  image: StaticImageData;
  alt: string;
  // Which part of the picture stays in view (the pictures are wider than the
  // card, so the rest is cropped).
  position: string;
  // How wide the picture is drawn once it fills the card's height (more than
  // the card's own width for the wide pictures): the image file is chosen by
  // this, so it stays sharp.
  drawnWidth: string;
  label: string;
  headline: string;
  paragraphs: string[];
};

const SLIDES: StorySlide[] = [
  {
    image: descriptionImage,
    alt: "Classic Brown leather cigarette case",
    position: "50% 0%",
    drawnWidth: "700px",
    label: "Classic Brown",
    headline: "Warm, familiar, and easy to live with.",
    paragraphs: [
      "Its rich brown leather gives the piece a grounded, timeless look, while the reinforced material Carbon Fiber structure adds everyday durability and a clean, dependable form.",
      "Simple, solid, and made to age well.",
    ],
  },
  {
    image: slider5,
    alt: "Black leather cigarette case on a table next to a cup of coffee",
    position: "53% 50%",
    drawnWidth: "2240px",
    label: "The Ritual",
    headline: "Made for the quiet moments.",
    paragraphs: [
      "A clean, dark silhouette that sits naturally beside your morning coffee. Soft-touch leather and precise lines keep it understated, on the table or in your pocket.",
      "Calm, composed, and always within reach.",
    ],
  },
  {
    image: slider6,
    alt: "Leather wallet, phone case, watch strap and a red cigarette case on dark stone",
    position: "74% 50%",
    drawnWidth: "1660px",
    label: "Beyond the Cover",
    headline: "Leather essentials, made to belong together.",
    paragraphs: [
      "Cut from the same natural leather as the pieces you already carry, the case joins your wallet, watch, and everyday tools as one refined set.",
      "Details that look better the longer you keep them.",
    ],
  },
];

const COUNT = SLIDES.length;
const MOVE_MS = 400;

const mod = (value: number, size: number) => ((value % size) + size) % size;

// How far, in cards, slide `index` is from the one showing when the row is at
// `pos` (slide `pos` is exactly in view), going the short way round the loop:
// from -1.5 up to just under 1.5 for three slides. A slide that leaves on one
// side is the same one that arrives on the other, and it changes sides while
// it is more than a whole card out of view.
function offsetFrom(index: number, pos: number) {
  return mod(index - pos + COUNT / 2, COUNT) - COUNT / 2;
}

function translateFor(index: number, pos: number) {
  return `translate3d(${(offsetFrom(index, pos) * 100).toFixed(3)}%, 0, 0)`;
}

export default function ProductDescription() {
  const t = useTranslations("Product");
  const [index, setIndex] = useState(0);
  const posRef = useRef(0); // which slide is showing, as a fraction while moving
  const shownRef = useRef(0); // the slide nearest to being in view
  const frameRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<{
    id: number;
    startX: number;
    startT: number;
    startPos: number;
    width: number;
    dx: number;
    moved: boolean;
  } | null>(null);

  // The slides loop: they are placed by one number (`pos`), the pictures and
  // their texts together, so swiping past the last one brings the first back
  // in from the same side. (Done by hand rather than with CSS transitions: a
  // slide that changes sides would otherwise be seen sliding across.)
  const show = (next: number) => {
    posRef.current = next;
    for (let i = 0; i < COUNT; i++) {
      const transform = translateFor(i, next);
      const image = imageRefs.current[i];
      const text = textRefs.current[i];
      if (image) image.style.transform = transform;
      if (text) text.style.transform = transform;
    }
    const nearest = mod(Math.round(next), COUNT);
    if (nearest !== shownRef.current) {
      shownRef.current = nearest;
      setIndex(nearest);
    }
  };

  const stop = () => {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const animateTo = (target: number) => {
    stop();
    const from = posRef.current;
    if (from === target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      show(mod(target, COUNT));
      return;
    }
    let startedAt: number | null = null; // the time of the first frame
    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const t = Math.min(1, (now - startedAt) / MOVE_MS);
      if (t < 1) {
        show(from + (target - from) * (1 - Math.pow(1 - t, 5)));
        frameRef.current = requestAnimationFrame(step);
      } else {
        // Looks identical, keeps the numbers small.
        frameRef.current = null;
        show(mod(target, COUNT));
      }
    };
    frameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    // A picture that has never been on screen is only decoded the first time
    // it is painted, which can leave a slide empty for a moment as it comes in.
    // Decode them all now instead.
    cardRef.current?.querySelectorAll("img").forEach((img) => {
      img.decode().catch(() => {});
    });
    return stop;
  }, []);

  // To a given slide the short way round: from the last one to the first is one
  // step forward, not two back.
  const goTo = (slide: number) => {
    const pos = posRef.current;
    animateTo(pos + offsetFrom(slide, pos));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as Element).closest("button")) return;
    stop();
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startT: e.timeStamp,
      startPos: posRef.current,
      width: e.currentTarget.clientWidth,
      dx: 0,
      moved: false,
    };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // capture can fail for a pointer the browser no longer tracks
      }
    }
    d.dx = dx;
    show(d.startPos - dx / d.width);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const rest = Math.round(d.startPos);
    if (!d.moved || cancelled) {
      animateTo(Math.round(posRef.current));
      return;
    }
    // A long enough drag, or a quick flick, moves one slide on (in either
    // direction, round and round); anything less springs back.
    const speed = Math.abs(d.dx) / Math.max(1, e.timeStamp - d.startT);
    const far = Math.abs(d.dx) > d.width * 0.2;
    const flick = speed > 0.4 && Math.abs(d.dx) > 30;
    animateTo(far || flick ? rest + (d.dx < 0 ? 1 : -1) : rest);
  };

  return (
    <section className="mt-10">
      <h2 className="text-[1.375rem] font-extrabold tracking-[-0.01em] text-[#414141]">
        {t("story")}
      </h2>

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
        className="relative mt-5 min-h-[36rem] touch-pan-y select-none overflow-hidden rounded-[1.5rem] shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] sm:min-h-[40rem]"
      >
        {/* The pictures: every slide fills the card, placed side by side. */}
        <div className="absolute inset-0">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.label}
              ref={(el) => {
                imageRefs.current[i] = el;
              }}
              className="absolute inset-0"
              style={{ willChange: "transform", transform: translateFor(i, 0) }}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                sizes={slide.drawnWidth}
                // All three pictures are fetched right away, so a swipe never
                // shows an empty card.
                loading={i === 0 ? undefined : "eager"}
                draggable={false}
                className="object-cover"
                style={{ objectPosition: slide.position }}
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/55 to-black/90" />

        <div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show: ${slide.label}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-3 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* The arrows: one slide back or on (round and round, like a swipe), in the middle
            of the slider, up and down. */}
        {(["previous", "next"] as const).map((way) => (
          <button
            key={way}
            type="button"
            onClick={() => animateTo(Math.round(posRef.current) + (way === "next" ? 1 : -1))}
            aria-label={way === "next" ? "Next slide" : "Previous slide"}
            className={`absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition-colors [-webkit-tap-highlight-color:transparent] hover:bg-black/55 ${
              way === "next" ? "right-3 sm:right-4" : "left-3 sm:left-4"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={way === "next" ? "" : "-scale-x-100"}
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}

        <div className="pointer-events-none relative z-10 flex flex-col gap-4 pt-[26.5rem] pb-8 sm:pt-[22.5rem] sm:pb-10">
          {/* The texts: each slide has its own, and they move with the
              pictures. They sit on top of each other in one grid cell, which
              gives the row the height of the tallest one. */}
          <div className="product-story-texts grid overflow-hidden" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            {SLIDES.map((slide, i) => (
              <div
                key={slide.label}
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                aria-hidden={i !== index}
                className="flex flex-col justify-end gap-4 px-5 sm:px-8"
                style={{
                  gridArea: "1 / 1",
                  willChange: "transform",
                  transform: translateFor(i, 0),
                }}
              >
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-[#dcc090] uppercase">
                    {slide.label}
                  </p>
                  <p className="mt-1 text-xl leading-snug font-extrabold text-white">
                    {slide.headline}
                  </p>
                </div>

                {slide.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-relaxed text-white/85"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* The note stays put whichever slide is showing. */}
          <div className="product-story-note mx-5 rounded-2xl border border-[#dcc090] bg-white/10 px-4 py-3.5 backdrop-blur-sm sm:mx-8">
            <p className="text-xs leading-relaxed text-white">
              <span className="font-bold text-white">{t("noteLabel")}</span> {t("noteText")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
