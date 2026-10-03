"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { StaticImageData } from "next/image";

type HeroVideoBannerProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  bottomHeading?: ReactNode;
  bottomText?: ReactNode;
  image: StaticImageData;
  video: string;
  buttonLabel: string;
  buttonHref: string;
};

export default function HeroVideoBanner({
  title,
  subtitle,
  bottomHeading,
  bottomText,
  image,
  video,
  buttonLabel,
  buttonHref,
}: HeroVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const tryPlay = () => el.play().catch(() => { });
    tryPlay();
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("loadeddata", tryPlay);
    return () => {
      el.removeEventListener("canplay", tryPlay);
      el.removeEventListener("loadeddata", tryPlay);
    };
  }, [video]);

  return (
    <section className="bg-white relative left-1/2 w-screen -mx-[50vw] overflow-hidden bg-black">
      <Link href={buttonHref}>
        <video
          ref={videoRef}
          src={video}
          poster={image.src}
          autoPlay
          muted
          loop
          playsInline
          className="block h-auto w-full rounded-b-[1.5rem]"
        />
     </Link>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[30%]"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-brand-dark) 0%, transparent 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 z-20 px-6 pt-3 text-center">
          <h2
            className="font-montserrat tracking-[-0.01em] text-white"
            style={{ lineHeight: "30px", fontSize: "24px", fontWeight: 530 }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-white/80" style={{ marginTop: "-4px", fontSize: "12px" }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* The bottom heading + text and the button all sit 124px above the
            bottom edge. */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-start gap-4 px-6"
          style={{ paddingBottom: "124px", display: 'flex', justifyContent: "center" }}
        >
          <div className="min-w-0" style={{ maxWidth: "65%" }}>
            {bottomHeading && (
              <h3 className="text-xl font-extrabold tracking-[-0.01em] text-white sm:text-2xl">
                {bottomHeading}
              </h3>
            )}
            {bottomText && (
              <p className="mt-1.5 text-[8px] leading-snug text-white sm:text-xs">
                {bottomText}
              </p>
            )}
          </div>

          <Link
            href={buttonHref}
            style={{
              width: "80px",
              height: "42px",
              border: "1px solid #ffffff",
              fontWeight: 500,
              textTransform: "uppercase",
              fontSize: "17px"
            }}
            className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[#dcc090] font-montserrat text-[20px] text-[#122a26] transition-colors hover:bg-[#d3b57c]"
          >
            {buttonLabel}
          </Link>
        </div>
    </section>
  );
}
