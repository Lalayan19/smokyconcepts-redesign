"use client";

import { useEffect, useRef } from "react";

import { loadVideo } from "@/lib/homeVideos";

// A video, one second long, that takes the place of a picture in a section of the home
// page and is played by the scroll (where there is no video the picture stays, and this
// has no file; see the rules of the section in globals.css):
//  - the Atelier section: the left one (the case that comes in from the left) on a phone
//    and on a laptop or a desktop, and the mirrored one on the right (the silver case)
//    on a laptop or a desktop only (`.atelier-case-video`);
//  - the Personalization section: the picture of the case, on a phone and on a laptop or
//    a desktop (`.personalization-art-video`).
//
// The scroll plays it: the video is one second of the case coming in, turning and
// settling, and it is as far along as the section is far up the window. It starts
// (the first frame, which is empty) when the top of the section is a little above the
// bottom of the window, and has played to its last frame a little before the section
// is in the middle of the window under the header (HOLD). From there, going on down
// (past the middle, and out at the top, towards Collections), it stays on its last
// frame: it is never played backwards by scrolling down. Scrolling back up it stays on
// its last frame until the section is back at that place, and then plays backwards,
// to the first frame, over the same distance of scroll as coming in (as the section
// goes out at the bottom, towards Unlock). Every frame of the file is a key frame
// (`public/videos/*.mp4`), so jumping to any time is as quick backwards as it is
// forwards.
//
// The file is fetched only in the windows that have this video, and only when the
// section is within a window's height of the screen.

// The windows that get each video (the same tests as in globals.css: a tablet, from
// 744px wide and 500px tall to 1023px wide, keeps the pictures; a laptop is from 1024px
// wide, and a phone is anything narrower or shorter than a tablet).
const WINDOWS = {
  phoneAndLaptop: "(max-width: 743px), (max-height: 499px), (min-width: 1024px)",
  laptop: "(min-width: 1024px) and (min-height: 500px)",
  // Every screen.
  all: "all",
};
// The header, which the section is in the middle of the window under.
const HEADER_PX = 64;
// How far short of the middle of the window the section is when the video has played to
// its last frame (and, scrolling up, where it starts to play backwards), as a share of
// the window's height (45%: 360px in a window 800px tall); but never so far that the
// video's second has less than MIN_RUN_PX of scroll to play in (a short window).
const HOLD = 0.45;
const MIN_RUN_PX = 300;
// How the video catches up with where the scroll has got to: in this many ms it has
// gone about two thirds of the way there (and nine tenths in about 2.3 times as long),
// the same on a screen of any refresh rate. So a notch of a mouse wheel, or a flick of
// a trackpad, plays on over a moment and is not a jump of several frames at once.
const GLIDE_MS = 120;

type ScrollVideoProps = {
  // The file, under public.
  src: string;
  // The section it is in, as the selector of the element that is the section for the
  // scroll (how far up the window it is decides how far the video has played); the
  // video must be inside it.
  sectionSelector: string;
  // The windows it is in: a phone and a laptop or bigger, or a laptop or bigger only.
  windows: keyof typeof WINDOWS;
  // Its classes, which place and size it (see globals.css).
  className: string;
  // How long it takes to catch up with the scroll, in ms (see GLIDE_MS, which it is
  // unless said otherwise): the shorter, the closer it stays to the scroll; 0 is always
  // exactly where the scroll says it should be.
  glideMs?: number;
  // How much later the video starts to play when the page is scrolled down, as a share of
  // the window's height (0: it starts where it ends when the page is scrolled back up).
  // Only the start is later: scrolling back up it plays backwards over the same
  // distance of scroll as ever, and in between (turning round half way) it stays where
  // it is until the scroll has got to where it should be on the way it is going.
  startDelay?: number;
  // If given, the video plays with no hold and no `startDelay`: it has played to its last
  // frame exactly when the section is in the middle of the window (under the header), and
  // it starts when the top of the section is this share of the window's height further
  // down than that. Scrolling on down it stays on its last frame; scrolling up it plays
  // backwards at once, from the middle of the window, over the same distance (it is the
  // same way up and down: where the scroll is says where the video is).
  ramp?: number;
  // With `ramp`: the video has played to its last frame when the top of the section is this
  // share of the window's height further down than in the middle of the window (0: exactly in
  // the middle; below 0: after the section has gone up past the middle). The start stays
  // where `ramp` puts it, so the video plays over `ramp - rampEnd` of the window's height of
  // scroll: to start later at the same speed, make `ramp` smaller and `rampEnd` the same
  // amount smaller.
  rampEnd?: number;
  // How many frames the file has. If given, the video is only asked to jump when the frame
  // it should show changes (and to the middle of that frame's time), not at every small
  // step of the glide between two frames: the same frames are shown at the same places of
  // the scroll, but with no seek that goes to the frame it is already on (each of those
  // keeps the video busy for a moment, and the next real jump waits for it).
  frames?: number;
  // With `frames`: the frame (counted from 0) the video starts from: the frames before it are
  // never shown, and the rest are spread over the whole way (the same as a file that had been
  // cut there).
  firstFrame?: number;
};

export default function ScrollVideo({
  src,
  sectionSelector,
  windows,
  className,
  glideMs = GLIDE_MS,
  startDelay = 0,
  ramp,
  rampEnd = 0,
  frames,
  firstFrame = 0,
}: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = video?.closest(sectionSelector);
    if (!video || !section) return;
    const active = window.matchMedia(WINDOWS[windows]);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let target = 0; // how far along the scroll says it should be (0 to 1)
    let shown = -1; // how far along it is on the screen (-1: not yet)
    let last = 0; // when it was last moved on (0: it is at rest)
    let frame: number | null = null;
    let near = false;
    const timers: number[] = [];
    let held = -1; // where the video stands between the two ways (see `progress`); -1: not yet
    let askedFor = -1; // with `frames`: the frame the video was last asked to show; -1: none

    // Where the scroll has got to: 0 while the section is still below the window; 1
    // (the last frame) once it is a little way short of the middle of the window (under
    // the header), and it stays 1 from there on, however far down the page goes (the
    // section out at the top). Only when the section is on its way down the window
    // again (scrolling up) it goes back to 0, over the same distance of scroll as coming
    // in. (With a `startDelay` the way down is that much further down the page than the
    // way back up: the video is held between the two, so it never jumps when the scroll
    // turns round.)
    const progress = () => {
      const box = section.getBoundingClientRect();
      const height = window.innerHeight;
      const start = height * 0.9;
      const middle = (height + HEADER_PX - box.height) / 2;
      if (ramp !== undefined) {
        const end = height * rampEnd;
        const length = Math.max(1, height * ramp - end);
        return Math.min(1, Math.max(0, 1 - Math.max(0, box.top - middle - end) / length));
      }
      const hold = Math.max(0, Math.min(height * HOLD, start - middle - MIN_RUN_PX));
      const run = start - middle - hold;
      if (run <= 0) return 1;
      const at = (top: number) =>
        Math.min(1, Math.max(0, 1 - Math.max(0, top - middle - hold) / run));
      const back = at(box.top);
      const down = startDelay > 0 ? at(box.top + height * startDelay) : back;
      held = held < 0 ? back : Math.min(back, Math.max(down, held));
      return held;
    };

    const apply = (now: number) => {
      frame = null;
      if (!active.matches || video.readyState < 2) {
        last = 0;
        return; // `loadeddata` starts it again
      }
      const goal = still.matches ? 1 : target;
      if (shown < 0 || still.matches || glideMs <= 0) {
        shown = goal;
      } else {
        // The way it goes depends on the time that has passed, not on how many frames
        // there have been (a long wait counts as 50ms at most).
        const passed = last ? Math.min(50, now - last) : 1000 / 60;
        shown += (goal - shown) * (1 - Math.exp(-passed / glideMs));
        if (Math.abs(goal - shown) < 0.002) shown = goal;
      }
      last = now;
      // A new jump waits for the one before it (`seeked` starts this again).
      if (video.seeking) return;
      const length = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      // The last frame is a little before the end of the file.
      const time = shown * Math.max(0, length - 0.02);
      if (frames) {
        // The frames are spread evenly over the way: the first at the start, the last
        // (frames - 1) at the end, whatever the file's length.
        const rate = frames / length;
        const first = Math.min(Math.max(0, firstFrame), frames - 1);
        const index = Math.min(
          frames - 1,
          first + Math.floor(shown * (frames - first) + 1e-6),
        );
        if (index !== askedFor) {
          askedFor = index;
          video.currentTime = (index + 0.5) / rate;
        }
      } else if (Math.abs(video.currentTime - time) > 0.001) {
        video.currentTime = time;
      }
      if (shown !== goal) kick();
      else last = 0;
    };
    const kick = () => {
      if (frame === null) frame = requestAnimationFrame(apply);
    };

    const update = () => {
      target = progress();
      kick();
    };

    // A phone's browser may not fetch the pictures of a video until it is asked to play
    // (and it lets a muted one play by itself): so, unseen, it plays for a moment and is
    // stopped, and then the scroll takes over.
    const prime = () => {
      if (!window.matchMedia("(hover: none)").matches) return;
      video.style.visibility = "hidden";
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(giveUp);
        video.pause();
        video.style.visibility = "";
        shown = -1;
        askedFor = -1; // the play moved the video on
        update();
      };
      // A phone in a power-saving or data-saving mode can leave the play unanswered:
      // the video must not stay hidden for ever, so after a moment it is shown anyway.
      const giveUp = window.setTimeout(done, 1500);
      timers.push(giveUp);
      const started = video.play();
      if (started) started.then(done, done);
      else done();
    };

    // The file comes from the shared loader (see homeVideos.ts), which has most likely
    // fetched it already (or has it from the last visit); if it could not, the video is
    // given its own address and loads by itself.
    let requested = false;
    let gone = false;
    const load = () => {
      if (!active.matches || !near || requested || video.getAttribute("src")) return;
      requested = true;
      loadVideo(src).then((url) => {
        if (gone) return;
        video.src = url ?? src;
        video.load();
        prime();
      });
    };

    // Fetch the file when the section is about a window's height from the screen.
    const watcher = new IntersectionObserver(
      (entries) => {
        near = entries.some((entry) => entry.isIntersecting);
        if (near) load();
      },
      { rootMargin: "0px 0px 100% 0px" },
    );
    watcher.observe(section);

    const onWindowChange = () => {
      load();
      update();
    };

    video.addEventListener("loadeddata", update);
    video.addEventListener("seeked", kick);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onWindowChange);
    active.addEventListener("change", onWindowChange);
    update();
    return () => {
      gone = true;
      if (frame !== null) cancelAnimationFrame(frame);
      watcher.disconnect();
      video.removeEventListener("loadeddata", update);
      timers.forEach((id) => window.clearTimeout(id));
      video.removeEventListener("seeked", kick);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onWindowChange);
      active.removeEventListener("change", onWindowChange);
    };
  }, [src, sectionSelector, windows, glideMs, startDelay, ramp, rampEnd, frames, firstFrame]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
      className={className}
    />
  );
}
