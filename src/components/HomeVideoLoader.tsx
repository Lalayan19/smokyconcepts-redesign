"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { getProgress, preloadHomeVideos, subscribe } from "@/lib/homeVideos";

// The home page's three videos (see src/lib/homeVideos.ts) are fetched in the background as
// soon as the page opens, and kept for the next visit. A visitor who starts to scroll before
// they are all here gets a loading screen, with the scroll held still, until they are (so the
// page never scrolls past a case that is not there yet). A visitor whose videos are already
// kept (the next visit) never sees it.
const SCROLL_KEYS = new Set([" ", "PageDown", "ArrowDown", "End", "Spacebar"]);

export default function HomeVideoLoader() {
  const progress = useSyncExternalStore(subscribe, getProgress, getProgress);
  // Has the visitor started to scroll?
  const [started, setStarted] = useState(false);

  useEffect(() => {
    preloadHomeVideos();
  }, []);

  useEffect(() => {
    if (progress.ready || started) return;
    const start = () => setStarted(true);
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) start();
    };
    const onScroll = () => {
      if (window.scrollY > 8) start();
    };
    window.addEventListener("wheel", start, { passive: true });
    window.addEventListener("touchmove", start, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", start);
      window.removeEventListener("touchmove", start);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [progress.ready, started]);

  const showing = started && !progress.ready;

  // The page is held still while the screen is up.
  useEffect(() => {
    if (!showing) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [showing]);

  if (!showing) return null;

  const percent = Math.round(progress.fraction * 100);
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[2147483000] flex touch-none flex-col items-center justify-center gap-5 bg-[#0a1916] px-8 text-center"
    >
      <p className="font-montserrat text-[13px] font-bold uppercase tracking-[0.2em] text-[#dcc090]">
        Loading
      </p>
      <div className="h-[3px] w-full max-w-[16rem] overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-[#dcc090] transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="font-montserrat text-xs font-medium text-white/60">{percent}%</p>
    </div>
  );
}
