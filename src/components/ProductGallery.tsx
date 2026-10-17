"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

import ProductLightbox from "@/components/ProductLightbox";

function ChevronIcon({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={direction === "left" ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SWIPE_THRESHOLD = 40;

export default function ProductGallery({
  images,
  alt,
  title,
  fill = false,
}: {
  images: StaticImageData[];
  alt: string;
  title: string;
  // Photos (not cut-out pictures of the case on white): each fills the whole block, cropped
  // to fit (a soft shade at the top keeps the name readable).
  fill?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const thumbRowRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const goTo = (index: number) => {
    setActive((index + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (touchDeltaX.current > SWIPE_THRESHOLD) {
      goTo(active - 1);
    } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
      goTo(active + 1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  useEffect(() => {
    const thumb = thumbRefs.current[active];
    const row = thumbRowRef.current;
    if (!thumb || !row) return;
    const RING_PADDING = 4;
    const thumbRect = thumb.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setIndicator({
      left: thumbRect.left - rowRect.left - RING_PADDING,
      top: thumbRect.top - rowRect.top - RING_PADDING,
      width: thumbRect.width + RING_PADDING * 2,
      height: thumbRect.height + RING_PADDING * 2,
    });
  }, [active, images.length]);

  return (
    <div className="product-gallery relative flex flex-col">
      {/* With `fill` the picture goes down behind the row of small ones (which is over it, at
          the bottom), so the block is as tall as the two were together (24rem + 6rem). */}
      <div
        className={`product-gallery-main relative flex touch-pan-y items-center justify-center overflow-hidden rounded-t-[1.5rem] bg-white ${
          fill ? "h-[30rem] sm:h-[35rem]" : "h-[24rem] sm:h-[29rem]"
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {fill && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-gradient-to-b from-black/45 to-transparent" />
        )}
        <h1
          // A tablet and larger hide the name here (`.product-gallery-title`, it is in the card
          // beside); over a photo it stays, in the top left corner, on every screen.
          className={`${fill ? "" : "product-gallery-title "}absolute top-3 left-3 z-10 max-w-[60%] text-[1.375rem] leading-tight font-extrabold ${
            fill ? "text-white" : "text-[#414141]"
          }`}
        >
          {title}
        </h1>

        {images.length > 1 && (
          <span className="absolute top-3 right-3 z-10 rounded-full bg-[#122a26]/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {active + 1} / {images.length}
          </span>
        )}

        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label="Previous image"
          className="absolute top-[68%] left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#414141] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all active:scale-90"
        >
          <ChevronIcon direction="left" className="h-5 w-5" />
        </button>

        {/* Tapping the picture opens it large, in the middle of the screen. */}
        <button
          key={active}
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Enlarge image"
          className={`animate-gallery-fade-in cursor-zoom-in ${
            fill
              ? "absolute inset-0 h-full w-full"
              : "relative h-[17rem] w-[13rem] sm:h-[22rem] sm:w-[16.5rem]"
          }`}
        >
          <Image
            src={images[active]}
            alt={alt}
            fill
            priority
            sizes={fill ? "(min-width: 1024px) 50vw, 100vw" : undefined}
            className={fill ? "object-cover object-center" : "object-contain object-bottom"}
          />
        </button>

        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="Next image"
          className="absolute top-[68%] right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#414141] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all active:scale-90"
        >
          <ChevronIcon direction="right" className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={thumbRowRef}
        className={`flex items-center justify-center gap-2.5 px-5 pb-5 ${
          fill
            ? "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/35 to-transparent pt-10"
            : "relative bg-white pt-4"
        }`}
      >
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-[#dcc090] transition-all duration-300 ease-out"
          style={{
            left: indicator.left,
            top: indicator.top,
            width: indicator.width,
            height: indicator.height,
          }}
        />

        {images.map((image, index) => (
          <button
            key={index}
            ref={(el) => {
              thumbRefs.current[index] = el;
            }}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`View image ${index + 1}`}
            className="relative flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f4f1] shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-transform active:scale-95"
          >
            <span className="relative h-[2.75rem] w-[2.25rem]">
              <Image
                src={image}
                alt=""
                fill
                className={`object-contain ${fill ? "object-center" : "object-bottom"}`}
              />
            </span>
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <ProductLightbox
          images={images}
          alt={alt}
          title={title}
          active={active}
          onSelect={setActive}
          onClose={() => setLightboxOpen(false)}
          centered={fill}
        />
      )}
    </div>
  );
}
