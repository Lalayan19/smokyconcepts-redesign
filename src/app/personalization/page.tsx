"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/smoky-unlock.mp4";

type Stop = {
  progress: number; // 0 - 1 fraction of video duration
  heading?: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
};

// Placeholder copy — swap in real text/buttons once content is ready. The
// first and last stops are bare frames (no overlay), matching how the video
// opens and closes.
const STOPS: Stop[] = [
  { progress: 0 },
  {
    progress: 0.25,
    heading: "Choose Your Leather",
    body: "From deep espresso to forest green — pick a hide that feels like yours.",
    buttonLabel: "Explore Leathers",
    buttonHref: "/shop",
  },
  {
    progress: 0.5,
    heading: "Engrave Your Initials",
    body: "A personal mark, lasered into the leather with precision.",
  },
  {
    progress: 0.75,
    heading: "Make It Yours",
    body: "Customize text, font, and style — see it before you buy.",
    buttonLabel: "Start Personalizing",
    buttonHref: "/shop",
  },
  { progress: 1 },
];

const SWIPE_THRESHOLD_PX = 40;
const WHEEL_THRESHOLD = 15;
const TRANSITION_MS = 2400;

export default function PersonalizationPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [stopIndex, setStopIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const durationRef = useRef(0);
  const stopIndexRef = useRef(0);
  const animatingRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    stopIndexRef.current = stopIndex;
  }, [stopIndex]);

  // Scrub the video from its current time to the target stop's time, then
  // settle exactly on it.
  const animateToStop = useCallback((targetIndex: number) => {
    const video = videoRef.current;
    const duration = durationRef.current;
    if (!video || !duration || animatingRef.current) return;

    const clamped = Math.min(Math.max(targetIndex, 0), STOPS.length - 1);
    if (clamped === stopIndexRef.current) return;

    const startTime = video.currentTime;
    const endTime = STOPS[clamped].progress * duration;

    animatingRef.current = true;
    setAnimating(true);
    cancelAnimationFrame(rafRef.current);

    const finish = () => {
      video.currentTime = endTime;
      video.playbackRate = 1;
      animatingRef.current = false;
      setAnimating(false);
      stopIndexRef.current = clamped;
      setStopIndex(clamped);
    };

    if (endTime > startTime) {
      // Forward: use real decoded playback, sped up to land in roughly
      // TRANSITION_MS, instead of repeated currentTime seeks. Some mobile
      // decoders (notably Android's) can't keep up with arbitrary seeks no
      // matter how throttled, and end up skipping straight to whichever
      // frame they land on once they catch up — but sequential playback is
      // exactly what video hardware decoding is built for, so it stays
      // smooth everywhere. Driven by 'timeupdate' (tied to actual playback
      // progress), not rAF polling — rAF gets throttled whenever the tab is
      // backgrounded, but video.play() keeps running regardless, so an
      // rAF-only stop check could leave it playing uncontrolled. A hard
      // timeout is a failsafe in case timeupdate itself never fires.
      const rate = Math.min(16, Math.max(1, ((endTime - startTime) * 1000) / TRANSITION_MS));
      video.playbackRate = rate;

      let settled = false;
      let safetyTimer: number;
      const settle = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener("timeupdate", onTimeUpdate);
        window.clearTimeout(safetyTimer);
        video.pause();
        finish();
      };
      const onTimeUpdate = () => {
        if (video.currentTime >= endTime - 0.02 || video.ended) settle();
      };
      video.addEventListener("timeupdate", onTimeUpdate);
      safetyTimer = window.setTimeout(settle, TRANSITION_MS * 3 + 500);
      video.play().catch(settle);
    } else {
      // Backward: no browser supports smooth reverse playback, so this has
      // to seek. Throttled well below animation-frame rate, and gated on
      // !video.seeking, so a slower decoder still gets to finish and render
      // each one instead of being flooded.
      const startTs = performance.now();
      const SEEK_INTERVAL_MS = 90;
      let lastSeekTs = 0;

      const step = (now: number) => {
        const t = Math.min(1, (now - startTs) / TRANSITION_MS);
        if (!video.seeking && now - lastSeekTs >= SEEK_INTERVAL_MS) {
          video.currentTime = startTime + (endTime - startTime) * t;
          lastSeekTs = now;
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          finish();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }
  }, []);

  // Gesture-driven step navigation: swiping (touch) or scrolling (wheel)
  // advances/retreats one stop at a time, fully independent of the page's
  // own scroll — nothing here relies on native scroll/touch-action behavior,
  // which is exactly what made this unreliable across browsers before. At
  // the very first/last stop, the matching gesture is let through so the
  // user can scroll normally to/from the rest of the page.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let touchStartY = 0;
    let touchDecided = false;
    let touchRelease = false;
    let wheelCooldown = false;
    let wheelTimer: number | undefined;

    const atEnd = () => stopIndexRef.current === STOPS.length - 1;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchDecided = false;
      touchRelease = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      // Once the page has scrolled past this section (into the footer),
      // every gesture is plain page scrolling — never step the video, even
      // if the touch happens to start back on the still-partly-visible
      // section while scrolling back up.
      if (window.scrollY > 0) return;
      if (animatingRef.current) {
        e.preventDefault();
        return;
      }
      if (touchRelease) return; // let this gesture scroll the real page

      const deltaY = touchStartY - e.touches[0].clientY; // positive = swiped up

      if (!touchDecided) {
        // Only the end stop ever releases to native scrolling (to reach the
        // footer) — the start never does, so swiping down there stays fully
        // trapped (no scroll, no bounce) rather than handing off to a page
        // that has nothing above it to scroll to anyway. Don't preventDefault
        // yet for small, pre-threshold movement AT the end stop specifically:
        // many mobile browsers "lock in" a gesture as JS-handled the moment
        // preventDefault is called even once, so a later release wouldn't
        // actually hand native scrolling back for this same swipe.
        if (Math.abs(deltaY) < SWIPE_THRESHOLD_PX) {
          if (!atEnd()) e.preventDefault();
          return;
        }
        touchDecided = true;
        const swipingUp = deltaY > 0;
        if (swipingUp && atEnd()) {
          touchRelease = true;
          return;
        }
        e.preventDefault();
        animateToStop(stopIndexRef.current + (swipingUp ? 1 : -1));
        return;
      }

      e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 0) return; // page has scrolled past this section
      if (animatingRef.current) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      const scrollingDown = e.deltaY > 0;
      if (scrollingDown && atEnd()) return; // let the real page scroll on
      if (wheelCooldown) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      wheelCooldown = true;
      animateToStop(stopIndexRef.current + (scrollingDown ? 1 : -1));
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelCooldown = false;
      }, TRANSITION_MS + 100);
    };

    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [animateToStop]);

  // Prime metadata/decoder once the video is available.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let primed = false;
    // iOS WebKit (Safari + Chrome-on-iOS, both WebKit under the hood) can
    // stop compositing new frames for a <video> that has only ever been
    // seeked and never actually played, which shows up as a blank/white
    // video mid-scrub. A silent muted play() -> pause() "primes" the
    // decoder so subsequent currentTime seeks keep rendering. Android is
    // unaffected, so this is a no-op there.
    const primeIOSDecoder = () => {
      if (primed) return;
      primed = true;
      video.play().then(() => video.pause()).catch(() => {});
    };

    const handleLoadedMetadata = () => {
      durationRef.current = video.duration;
      primeIOSDecoder();
    };
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    if (video.readyState >= 1) {
      durationRef.current = video.duration;
      primeIOSDecoder();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Prefetch the whole file in the background with visible progress, then
  // swap the <video> onto an in-memory blob so scrubbing no longer depends
  // on the network at all.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let objectUrl = "";
    let cancelled = false;

    (async () => {
      const res = await fetch(VIDEO_SRC);
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total) setProgress(Math.round((received / total) * 100));
        }
      }

      if (cancelled) return;
      const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
      const keepTime = video.currentTime;
      objectUrl = URL.createObjectURL(blob);
      video.src = objectUrl;
      video.currentTime = keepTime;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const current = STOPS[stopIndex];
  const hasOverlay = !animating && (current.heading || current.body);

  return (
    <main className="bg-[#f5f4f1]">
      <div
        ref={sectionRef}
        className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-black"
      >
        {!ready && (
          <p className="absolute z-10 text-sm font-semibold tracking-wide text-white">
            Loading... {progress}%
          </p>
        )}
        <video
          ref={videoRef}
          poster="/videos/personalization-poster.jpg"
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 transition-opacity duration-300 ${
            hasOverlay ? "opacity-100" : "opacity-0"
          }`}
        >
          {hasOverlay && (
            <div className="pointer-events-auto max-w-sm rounded-[1.5rem] bg-black/55 px-7 py-8 text-center backdrop-blur-sm">
              {current.heading && (
                <h2 className="font-montserrat text-2xl font-extrabold text-white">
                  {current.heading}
                </h2>
              )}
              {current.body && (
                <p className="mt-3 text-sm text-white/80">{current.body}</p>
              )}
              {current.buttonLabel && (
                <Link
                  href={current.buttonHref ?? "#"}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-[#dcc090] px-6 text-sm font-extrabold tracking-[0.1em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
                >
                  {current.buttonLabel}
                </Link>
              )}
            </div>
          )}
        </div>

        {stopIndex === 0 && !animating && (
          <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-bounce">
              <path
                d="M12 5v14m0 0l-6-6m6 6l6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase">
              Swipe up
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
