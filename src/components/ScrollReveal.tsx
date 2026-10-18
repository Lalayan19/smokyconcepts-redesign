"use client";

import { useEffect } from "react";

// The home page's texts come in as the page is scrolled: a title and the text under it, one after
// the other, each coming down from 60px above and fading in (the rules are in globals.css,
// `[data-reveal]`). The elements to move are the ones with `data-reveal` ("title" or "text") in the
// sections of the home page, and only there (the buttons stay still).
//
// The page is complete without this (a browser that does not run the script, or that is asked
// for less motion, just shows every text where it is): the script hides an element only when it
// is below the window, and shows it again when it gets into the window. Whatever is in the
// window when the page opens is never hidden, so nothing flashes. An element is let go of
// (back to its own styles, so its hover and the like work as before) once it has come in.
const SHOW_AT = 0.88; // the top of the element is in the top 88% of the window
const LET_GO_MS = 2000;

export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const waiting = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
      const box = element.getBoundingClientRect();
      const inWindow = box.top < window.innerHeight * SHOW_AT && box.bottom > 0;
      if (inWindow) return; // in sight (or above it) when the page opens: left as it is
      element.classList.add("reveal-hidden");
      waiting.add(element);
    });
    if (waiting.size === 0) return;

    const timers: number[] = [];
    const reveal = (element: HTMLElement) => {
      waiting.delete(element);
      // One frame after the browser has drawn it hidden, so the change is animated.
      element.classList.add("is-in");
      timers.push(
        window.setTimeout(() => element.classList.remove("reveal-hidden", "is-in"), LET_GO_MS),
      );
    };

    // The check runs at most every 40ms while the page is scrolled (a timer, not a frame: it must
    // also run where frames are not drawn, which would leave a text hidden in the window).
    let pending: number | undefined;
    const check = () => {
      pending = undefined;
      const limit = window.innerHeight * SHOW_AT;
      waiting.forEach((element) => {
        const box = element.getBoundingClientRect();
        // In the window now, or already above it (scrolled past, e.g. a jump down the page).
        if (box.top < limit) reveal(element);
      });
      if (waiting.size === 0) {
        stop();
        window.clearInterval(heartbeat);
      }
    };
    const onScroll = () => {
      if (pending !== undefined) return;
      pending = window.setTimeout(check, 40);
    };
    const stop = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pageshow", onScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pageshow", onScroll);
    // A heartbeat as well, in case a scroll event is missed (the text must never stay hidden
    // in the window).
    const heartbeat = window.setInterval(onScroll, 1000);
    check();

    return () => {
      stop();
      window.clearTimeout(pending);
      window.clearInterval(heartbeat);
      timers.forEach((id) => window.clearTimeout(id));
      waiting.forEach((element) => element.classList.remove("reveal-hidden", "is-in"));
    };
  }, []);

  return null;
}
