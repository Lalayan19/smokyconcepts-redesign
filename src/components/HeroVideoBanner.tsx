"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { StaticImageData } from "next/image";

import { keepPlaying } from "@/lib/keepPlaying";

type HeroVideoBannerProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  bottomHeading?: ReactNode;
  bottomText?: ReactNode;
  image: StaticImageData;
  video: string;
  // The video for a tablet, a laptop and a desktop (a horizontal one, 16:9): it fills
  // the width of the section, with the texts and the button over it (see `.hero-banner`
  // in globals.css). A phone keeps `video` (the portrait one). Only the one that is
  // shown is fetched.
  wideVideo?: string;
  buttonLabel: string;
  buttonHref: string;
  // How wide the longer row of the title is, in times its font size (see `--hero-block` in
  // globals.css): 7.52 for "New Accessory"; other languages have other widths.
  titleWidth?: number;
};

// The windows that get the horizontal video (the same test as in globals.css: a tablet
// and larger).
const WIDE_WINDOW = "(min-width: 744px) and (min-height: 500px)";

export default function HeroVideoBanner({
  title,
  subtitle,
  bottomHeading,
  bottomText,
  image,
  video,
  wideVideo,
  buttonLabel,
  buttonHref,
  titleWidth,
}: HeroVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wideRef = useRef<HTMLVideoElement>(null);

  // Which video is played: on a tablet, a laptop or a desktop the horizontal one (the portrait
  // one is let go of: its file is not wanted there); on a phone it is the other way round. (The
  // portrait one has its file from the first paint, so a phone does not wait for the script.)
  // Whichever is played is kept playing (see keepPlaying): started again when a browser stops
  // it, and at the visitor's first touch where the browser will not start it by itself. Until it
  // plays, its first picture (`poster`) is what is shown, so the section is never an empty
  // black box.
  useEffect(() => {
    const portrait = videoRef.current;
    const wideEl = wideRef.current;
    if (!portrait) return;
    const wide = wideEl && wideVideo ? window.matchMedia(WIDE_WINDOW) : null;
    let stop: (() => void) | null = null;
    const apply = () => {
      stop?.();
      stop = null;
      if (wide?.matches && wideEl && wideVideo) {
        if (portrait.getAttribute("src")) {
          portrait.pause();
          portrait.removeAttribute("src");
          portrait.load();
        }
        if (wideEl.getAttribute("src") !== wideVideo) {
          wideEl.src = wideVideo;
          wideEl.load();
        }
        stop = keepPlaying(wideEl, "unlock-wide", "/videos/unlock-fallback-wide-v5.webp");
      } else {
        wideEl?.pause();
        if (!portrait.getAttribute("src")) {
          portrait.src = video;
          portrait.load();
        }
        stop = keepPlaying(portrait, "unlock-phone", "/videos/unlock-fallback-phone-v4.webp");
      }
    };
    apply();
    wide?.addEventListener("change", apply);
    return () => {
      wide?.removeEventListener("change", apply);
      stop?.();
    };
  }, [video, wideVideo]);


  return (
    <section
      className="hero-banner bg-white relative left-1/2 w-screen -mx-[50vw] overflow-hidden bg-black"
      style={titleWidth ? ({ "--hero-title-em": titleWidth } as React.CSSProperties) : undefined}
    >
      <Link href={buttonHref} className="hero-banner-link">
        <video
          ref={videoRef}
          src={video}
          poster="/videos/unlock-poster-phone-v4.webp"
          autoPlay
          muted
          loop
          playsInline
          className="hero-banner-video block h-auto w-full rounded-b-[1.5rem]"
          // A video has no size until its file starts to load, so the section
          // used to shrink to almost nothing for a moment on every refresh and
          // the page below jumped down when it arrived. The box has the video's
          // own proportions (720 x 1280) from the first paint, and is black until
          // the first picture is there.
          style={{ aspectRatio: "720 / 1280", backgroundColor: "#000" }}
        />
     </Link>
        {/* The horizontal video, for a tablet, a laptop and a desktop only (it is not
            shown, and has no file, on a phone). */}
        {wideVideo && (
          <Link href={buttonHref} className="hero-banner-wide-link" tabIndex={-1}>
            <video
              ref={wideRef}
              muted
              loop
              playsInline
              preload="none"
              poster="/videos/unlock-poster-wide-v5.webp"
              aria-hidden="true"
              className="hero-banner-wide"
              style={{ aspectRatio: "16 / 9", backgroundColor: "#000" }}
            />
          </Link>
        )}
        <div
          className="hero-banner-gradient pointer-events-none absolute inset-x-0 top-0 z-10 h-[30%]"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-brand-dark) 0%, transparent 100%)",
          }}
        />

        <div className="hero-banner-fit hero-banner-top absolute inset-x-0 top-0 z-20 px-6 pt-3 text-center">
          <h2
            className="hero-banner-title font-montserrat tracking-[-0.01em] text-white"
            style={{ lineHeight: "30px", fontSize: "24px", fontWeight: 500 }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="hero-banner-subtitle mt-[6px] text-white/80 font-montserrat"
              style={{ fontSize: "14px" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* The bottom heading + text, and the button under them (on the right), sit 55px above the
            bottom edge (the text is as wide as the screen allows). */}
        <div
          className="hero-banner-fit hero-banner-bottom absolute inset-x-0 bottom-0 z-20 flex flex-col items-stretch justify-start gap-3 px-6"
          style={{ paddingBottom: "55px", display: 'flex', justifyContent: "center" }}
        >
          <div className="hero-banner-copy min-w-0" style={{ maxWidth: "100%" }}>
            {bottomHeading && (
              <h3 className="hero-banner-heading text-[22px] font-extrabold tracking-[-0.01em] text-white">
                {bottomHeading}
              </h3>
            )}
            {bottomText && (
              <p className="hero-banner-text mt-1.5 text-[14px] leading-snug text-white">
                {bottomText}
              </p>
            )}
          </div>

          <Link
            href={buttonHref}
            style={{
              // 80px wide for "SHOP"; a longer word in another language makes it wider.
              minWidth: "80px",
              paddingInline: "12px",
              whiteSpace: "nowrap",
              height: "42px",
              border: "1px solid #ffffff",
              fontWeight: 500,
              textTransform: "uppercase",
              fontSize: "17px"
            }}
            className="hero-banner-button -mt-[27px] max-[340px]:mt-0 inline-flex shrink-0 items-center justify-center self-end rounded-[8px] bg-[#dcc090] font-montserrat text-[20px] text-[#122a26] transition-colors hover:bg-[#d3b57c]"
          >
            {buttonLabel}
          </Link>
        </div>
    </section>
  );
}
