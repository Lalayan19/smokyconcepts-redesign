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
}: {
  images: StaticImageData[];
  alt: string;
  title: string;
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
    <div className="product-gallery flex flex-col">
      <div
        className="product-gallery-main relative flex h-[24rem] touch-pan-y items-center justify-center overflow-hidden rounded-t-[1.5rem] bg-white sm:h-[29rem]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <h1 className="product-gallery-title absolute top-3 left-3 z-10 max-w-[60%] text-[1.375rem] leading-tight font-extrabold text-[#414141]">
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
          className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#414141] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all active:scale-90"
        >
          <ChevronIcon direction="left" className="h-5 w-5" />
        </button>

        {/* Tapping the picture opens it large, in the middle of the screen. */}
        <button
          key={active}
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Enlarge image"
          className="animate-gallery-fade-in relative h-[17rem] w-[13rem] cursor-zoom-in sm:h-[22rem] sm:w-[16.5rem]"
        >
          <Image
            src={images[active]}
            alt={alt}
            fill
            priority
            className="object-contain object-bottom"
          />
        </button>

        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="Next image"
          className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#414141] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all active:scale-90"
        >
          <ChevronIcon direction="right" className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={thumbRowRef}
        className="relative flex items-center justify-center gap-2.5 bg-white px-5 pt-4 pb-5"
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
              <Image src={image} alt="" fill className="object-contain object-bottom" />
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
        />
      )}
    </div>
  );
}
