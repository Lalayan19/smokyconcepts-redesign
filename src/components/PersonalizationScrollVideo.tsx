"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { BUTTON_EDGE } from "@/components/buttonEdge";

// The film of the Personalization page. The scroll is not tied to any frame: it
// only starts the film. Scrolling down plays it (at the speed it was made at) to
// the next stop, where it stays; scrolling up plays it backwards to the one
// before. The places the film can be at: the start (a black frame), the four
// stops, and the last frame. The film is as tall as the window (under the
// header), so the footer is not in sight; after the last frame the page goes on
// to the footer, and back.
//
// Scrolling is a wheel or a trackpad (a laptop, a desktop), the arrow keys, Page
// Up and Down and Space, or a swipe of a finger (a phone, a tablet).
//
// It is the same film, in two shapes, and it fills the whole window in both:
//  - for a window wider than tall (a laptop, a desktop, a tablet on its side):
//    a video (16:9), in which every frame is a key frame
//    (`public/videos/personalization-scrub.mp4`), so jumping to any time is as
//    fast going backwards as forwards;
//  - for a window taller than wide (a phone, a tablet upright): the 200 frames
//    as pictures (9:16, `public/videos/personalization-mobile-frames/`), drawn
//    on a canvas. A phone's video decoder is slow to jump to a frame (a jump is
//    a hold-up of 50 to 150 ms there), so playing a video backwards, or
//    scrubbing it, is jerky on a phone; a picture is drawn at once.
// Nothing is fetched until the page is open, and then only the shape that fits
// the window (and the other one if the window changes to it).

const SRC_LARGE = "/videos/personalization-scrub.mp4";
const FRAMES_DIR = "/videos/personalization-mobile-frames";
const frameUrl = (index: number) =>
  `${FRAMES_DIR}/f${String(index).padStart(3, "0")}.webp`;
const FPS = 24;
// The length of each shape, in frames.
const FRAMES_LARGE = 199;
const FRAMES_PHONE = 200;
// The windows that get the video: wider than tall (the same test as in
// globals.css).
const LARGE_SCREEN = "(min-aspect-ratio: 1/1)";

// The stops, as the frame (counting from 0) the film stays on. They are the
// moments where the picture comes to rest (the knight, the empty frame, the
// blue case, the three shields): the frames at the middle of each rest, which
// last 4 to 8 frames. They are the same frames in both shapes.
const STOP_FRAMES = [37, 75, 117, 157];
const STOP_TIMES = STOP_FRAMES.map((frame) => (frame + 0.5) / FPS);
const placesFor = (frames: number) => [0, ...STOP_TIMES, (frames - 0.5) / FPS];
const PLACES_LARGE = placesFor(FRAMES_LARGE);
const PLACES_PHONE = placesFor(FRAMES_PHONE);
// How fast the film plays between two places (1 is the speed it was made at).
const PLAY_SPEED = 1;

// A flick of the wheel or the trackpad is many events in a row (and a trackpad
// goes on for a second or more after the fingers have left, dying away), a click
// of a wheel is one. Which events start a new scroll is decided in `isNewScroll`
// with these numbers: a pause of GESTURE_GAP ms is where a new scroll may start,
// of LONG_PAUSE ms it always does; a push of PUSH_PX px (or one FLICK_RATIO times
// bigger than the tail of the scroll before, looked at over TAIL_MS ms) is a new
// scroll; two scrolls are at least MIN_BETWEEN ms apart. One that comes while the
// film is playing counts (it sends the film on, or turns it round); one that
// comes in the first moment after the film has stopped (SETTLE_MS) does not.
const GESTURE_GAP = 70;
const LONG_PAUSE = 350;
const PUSH_PX = 40;
const FLICK_RATIO = 4;
const TAIL_MS = 150;
const MIN_BETWEEN = 350;
const SETTLE_MS = 150;
// A swipe of a finger: how far (px) it has to go up or down to count.
const SWIPE_PX = 28;
// A finger dragging on the film, at a stop, moves the picture and the cards: this
// far (px) from where it went down is as much as the mouse at the edge.
const DRAG_PX = 90;
// At a stop a slow drag only moves the picture and the cards (that is what the
// finger is there to try); the film goes on to the next place when the finger
// goes this far (px) up or down, or, on lifting, when it was a quick flick: at
// least FLICK_PX px, at FLICK_SPEED px per ms at the end.
const PULL_PX = 120;
const FLICK_PX = 40;
const FLICK_SPEED = 0.5;

// The pictures of a phone: how many are fetched at once, how many decoded ones
// are kept (a decoded 810 x 1440 picture takes 4.7 MB), how many frames ahead,
// the way the film is going, are decoded before they are needed, and how many
// frames ahead of the film must have arrived before it plays on.
const FETCH_AT_ONCE = 6;
const KEEP_DECODED = 16;
const DECODE_AHEAD = 5;
const BUFFER_AHEAD = 3;

// At each stop there are cards, and the picture and the cards move a little: with
// the mouse (a laptop or a desktop, this test, the same as in globals.css), or
// with a finger dragging on the film (a phone or a tablet).
const DESKTOP_POINTER =
  "(min-width: 1024px) and (min-height: 500px) and (hover: hover) and (pointer: fine)";

type StopCard = {
  title: string;
  text: string;
  button: string;
  // Where the card is on the wide picture (a laptop, a desktop, a tablet on its
  // side): its edges, in % of the picture. On a tall picture (a phone) the first
  // card is at the top left and the second at the bottom right (globals.css).
  place: { left?: string; right?: string; top?: string; bottom?: string };
  // How much the card moves with the mouse: 1 is a little, 1.6 is more (so the
  // cards seem to be at different distances from the picture).
  depth: number;
};

// The cards of each stop, in the order of the stops (the knight, the frame, the
// case, the shields). The texts are only to be going on with, and the buttons do
// not go anywhere yet. The places are in the empty parts of each picture.
const STOP_CARDS: StopCard[][] = [
  [
    {
      title: "Your sign",
      text: "Every Smoky piece begins with a mark. Choose yours and we build around it.",
      button: "Start designing",
      place: { left: "6%", top: "24%" },
      depth: 1,
    },
    {
      title: "Made to order",
      text: "Hand-finished leather, cut to the exact size of your pack.",
      button: "How it works",
      place: { right: "6%", top: "54%" },
      depth: 1.6,
    },
  ],
  [
    {
      title: "Pick the size",
      text: "From ultra slims to king size: tell us the pack, we draw the frame.",
      button: "Select size",
      place: { left: "5%", bottom: "9%" },
      depth: 1,
    },
    {
      title: "A precise fit",
      text: "Pack names are standard. Dimensions aren\u2019t. We match yours.",
      button: "See all sizes",
      place: { right: "5%", top: "12%" },
      depth: 1.6,
    },
  ],
  [
    {
      title: "Choose the leather",
      text: "Classic, Premium or Atelier. Every colour is finished by hand.",
      button: "Explore leathers",
      place: { left: "6%", top: "30%" },
      depth: 1,
    },
    {
      title: "Feels right",
      text: "Soft grain, firm edges: a case that keeps its place in your hand.",
      button: "View collection",
      place: { right: "6%", bottom: "8%" },
      depth: 1.6,
    },
  ],
  [
    {
      title: "Add your emblem",
      text: "Gold foil, engraved initials or a crest of your own.",
      button: "Personalize",
      place: { left: "4%", top: "8%" },
      depth: 1,
    },
    {
      title: "Placed by hand",
      text: "Each emblem is set and checked by hand before it leaves the atelier.",
      button: "Order now",
      place: { right: "4%", top: "8%" },
      depth: 1.6,
    },
  ],
];

export default function PersonalizationScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Which stop the film is resting on (0 to 3), or none while it plays.
  const [active, setActive] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !video || !canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    context.imageSmoothingQuality = "high";

    const media = window.matchMedia(LARGE_SCREEN);
    const large = () => media.matches;
    const places = () => (large() ? PLACES_LARGE : PLACES_PHONE);

    // ---- A tablet, a laptop, a desktop: the video ----

    let loaded = false; // the video has been given its file
    let firstFrame = false; // and has its first frame (it stays so: `readyState`
    // goes down for a moment each time the browser jumps to another frame)

    const duration = () =>
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : FRAMES_LARGE / FPS;

    // Show the frame whose time is `time`; asking for the middle of the frame's
    // slot keeps the browser from picking the one before.
    const showVideoFrame = (at: number) => {
      const last = Math.max(0, Math.round(duration() * FPS) - 1);
      const index = Math.min(last, Math.max(0, Math.floor(at * FPS)));
      const target = (index + 0.5) / FPS;
      if (Math.abs(video.currentTime - target) > 1 / (FPS * 2)) {
        video.currentTime = target;
      }
    };

    const onFirstFrame = () => {
      firstFrame = true;
      showAt(time);
    };
    // Some browsers (iPad) only draw the frames of a video that has been played
    // once: play it for a moment, then stop it and put it back where it was.
    const onLoadedData = () => {
      video
        .play()
        .then(() => {
          video.pause();
          showVideoFrame(time);
        })
        .catch(() => undefined);
    };

    // ---- A phone: the pictures on a canvas ----

    const fetched = new Map<number, Promise<Blob>>(); // the files, as they come
    const arrived = new Set<number>(); // the ones that have come
    const decoded = new Map<number, ImageBitmap>(); // oldest used first
    const decoding = new Map<number, Promise<ImageBitmap | null>>();
    let fetching = false; // the pictures are being fetched, in order
    let wantedIndex = 0; // the frame the film is at
    let drawnIndex = -1; // the frame on the canvas
    let direction = 1; // which way the film is going

    const fetchFrame = (index: number) => {
      let file = fetched.get(index);
      if (!file) {
        file = fetch(frameUrl(index)).then((response) => {
          if (!response.ok) throw new Error(`frame ${index}: ${response.status}`);
          return response.blob();
        });
        fetched.set(index, file);
        file.then(
          () => arrived.add(index),
          () => fetched.delete(index),
        );
      }
      return file;
    };

    // All the pictures, in order, a few at a time (one that the film needs
    // sooner is fetched at once, by `decodeFrame`).
    const fetchAll = () => {
      if (fetching) return;
      fetching = true;
      let next = 0;
      const worker = async () => {
        while (next < FRAMES_PHONE) {
          const index = next++;
          try {
            await fetchFrame(index);
          } catch {
            // It is tried again when the film gets to it.
          }
        }
      };
      for (let i = 0; i < FETCH_AT_ONCE; i++) void worker();
    };

    const decodeFrame = (index: number): Promise<ImageBitmap | null> => {
      const ready = decoded.get(index);
      if (ready) {
        decoded.delete(index); // now the newest
        decoded.set(index, ready);
        return Promise.resolve(ready);
      }
      let pending = decoding.get(index);
      if (!pending) {
        pending = fetchFrame(index)
          .then((file) => createImageBitmap(file))
          .then((bitmap) => {
            decoding.delete(index);
            decoded.set(index, bitmap);
            while (decoded.size > KEEP_DECODED) {
              const oldest = decoded.keys().next().value as number;
              decoded.get(oldest)?.close();
              decoded.delete(oldest);
            }
            return bitmap;
          })
          .catch(() => {
            decoding.delete(index);
            return null;
          });
        decoding.set(index, pending);
      }
      return pending;
    };

    // The picture fills the canvas, from edge to edge (a little of the sides is
    // cut off, as the picture is a little wider than a phone), centred.
    const paint = (bitmap: ImageBitmap, index: number) => {
      const width = canvas.width;
      const height = canvas.height;
      if (!width || !height) return;
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      try {
        context.fillStyle = "#000";
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
        drawnIndex = index;
      } catch {
        // The picture was let go of just now; the next frame draws.
      }
    };

    const drawFrame = (index: number) => {
      wantedIndex = index;
      const ready = decoded.get(index);
      if (ready) {
        void decodeFrame(index); // marks it as the newest
        paint(ready, index);
      } else {
        // Until its own picture is ready, the canvas keeps the one it has (or,
        // if it has none yet, the nearest one that is decoded).
        let nearest = -1;
        for (const key of decoded.keys()) {
          if (nearest < 0 || Math.abs(key - index) < Math.abs(nearest - index)) {
            nearest = key;
          }
        }
        if (nearest >= 0 && drawnIndex < 0) {
          paint(decoded.get(nearest)!, nearest);
        }
        void decodeFrame(index).then((bitmap) => {
          if (bitmap && wantedIndex === index) paint(bitmap, index);
        });
      }
      for (let ahead = 1; ahead <= DECODE_AHEAD; ahead++) {
        const next = index + direction * ahead;
        if (next >= 0 && next < FRAMES_PHONE) void decodeFrame(next);
      }
    };

    // The canvas has as many pixels as it shows (at most 2 per CSS pixel).
    const sizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const box = canvas.getBoundingClientRect();
      const width = Math.round(box.width * ratio);
      const height = Math.round(box.height * ratio);
      if (!width || !height) return;
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width; // this clears it
      canvas.height = height;
      context.imageSmoothingQuality = "high";
      const again = decoded.get(wantedIndex);
      if (again) paint(again, wantedIndex);
      else drawnIndex = -1;
      showAt(time);
    };

    // ---- Both: show the film at a time ----

    let place = 0; // the index in places() the film is at (or heading for)
    let time = 0; // the time (s) the film is at now (it moves while it plays)

    const showAt = (at: number) => {
      if (large()) {
        if (loaded && firstFrame && !video.seeking) showVideoFrame(at);
        return;
      }
      const index = Math.min(FRAMES_PHONE - 1, Math.max(0, Math.floor(at * FPS)));
      if (index !== wantedIndex || drawnIndex < 0) {
        if (index !== wantedIndex) direction = index > wantedIndex ? 1 : -1;
        drawFrame(index);
      }
    };

    // Whether the film can be played: its first frame is there.
    const ready = () => (large() ? loaded && firstFrame : arrived.has(0));

    // ---- The film plays towards the place it is sent to ----

    let moving = 0; // 1 playing forwards, -1 backwards, 0 at rest
    let moveAt = 0; // when the film last moved
    let moveFrame: number | null = null;
    let lockedUntil = 0; // no new scroll is taken before this (after a stop)

    // The film plays, in real time, towards places()[place] (forwards, or
    // backwards: the video has every frame as a key frame, so it is a jump to
    // each frame in turn), and stops there. On a phone it waits for the pictures
    // ahead of it, if they have not come yet.
    const playTick = (now: number) => {
      moveFrame = null;
      let passed = Math.min(0.1, (now - moveAt) / 1000);
      moveAt = now;
      if (moving !== 0) {
        if (!large() && moving > 0) {
          const ahead = Math.min(
            FRAMES_PHONE - 1,
            Math.floor((time + passed) * FPS) + BUFFER_AHEAD,
          );
          if (!arrived.has(ahead)) passed = 0;
        }
        const goal = places()[place];
        time += moving * PLAY_SPEED * passed;
        if ((moving > 0 && time >= goal) || (moving < 0 && time <= goal)) {
          time = goal;
          moving = 0;
          lockedUntil = performance.now() + SETTLE_MS;
          settle();
        }
      }
      showAt(time);
      // On a tablet or larger, while the browser is still getting to the last
      // frame, wait for it.
      if (moving !== 0 || (large() && video.seeking)) {
        moveFrame = requestAnimationFrame(playTick);
      }
    };

    // A scroll in this direction. At rest: to the next place that way. While the
    // film is playing: another scroll the same way sends it on past the place it
    // was heading for (so scrolling three times goes three places), and one the
    // other way turns it round to the nearest place behind it.
    const go = (way: 1 | -1) => {
      const list = places();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        place = Math.min(list.length - 1, Math.max(0, place + way));
        time = list[place];
        showAt(time);
        settle();
        return;
      }
      if (moving === 0) {
        const next = place + way;
        if (next < 0 || next >= list.length) return;
        place = next;
        moving = way;
        moveAt = performance.now();
        setStop(null);
        if (moveFrame === null) moveFrame = requestAnimationFrame(playTick);
      } else if (way === moving) {
        place = Math.min(list.length - 1, Math.max(0, place + way));
      } else {
        let next = -1;
        if (way > 0) {
          next = list.findIndex((at) => at > time + 0.001);
        } else {
          for (let i = list.length - 1; i >= 0 && next < 0; i--) {
            if (list[i] < time - 0.001) next = i;
          }
        }
        if (next < 0) return;
        place = next;
        moving = way;
        setStop(null);
      }
    };

    // ---- What starts the film: a scroll ----

    let lastWheel = 0; // when the last wheel event was
    let lastDirection = 0; // which way it went (1 down, -1 up), 0 if none yet
    let lastSize = 0; // how big it was (px)
    let recentSizes: { at: number; size: number }[] = []; // the last ones
    let scrollStartedAt = -Infinity; // when the last scroll that played the film began
    let snapUntil = 0; // the page is on its way somewhere until this

    // Whether a scroll in this direction is the film's (and not the page's): the
    // page is at its top, the film can be played, and there is a place to go to
    // that way; after the last place the page scrolls on to the footer.
    const takesInput = (way: 1 | -1) => {
      if (!ready() || window.scrollY >= 2) return false;
      if (moving !== 0) return true;
      const next = place + way;
      return next >= 0 && next < places().length;
    };

    // The page is down in the footer (or on its way there).
    const inFooter = () => ready() && window.scrollY >= 2;

    // Down in the footer, one scroll up takes the page straight back up to the
    // film (not a few lines at a time); the next scroll up plays the film back.
    const backToFilm = () => {
      const now = performance.now();
      if (now < snapUntil) return;
      snapUntil = now + 700;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    // After the last place, a scroll down (a swipe up) takes the page on down to
    // the footer.
    const onToFooter = () => {
      const now = performance.now();
      if (now < snapUntil) return;
      snapUntil = now + 700;
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    };

    // Is this wheel event the start of a new scroll, or still the one before? A
    // trackpad's flick is many events (growing, then dying away for a second or
    // more after the fingers have left), a wheel's click is one. So:
    //  - the other way than the last event, and not a bounce: new;
    //  - right after the last scroll started: not new;
    //  - a long pause since the last event: new;
    //  - a short pause (the tail of a flick can have one): new only if it is a
    //    push (big, or much bigger than the tail was), not the tail going on;
    //  - no pause (the tail goes on): new only if it is a clear new push on top
    //    of the tail, much bigger than the smallest the tail has been just before.
    const isNewScroll = (way: number, size: number, now: number, idle: number) => {
      const tail = Math.min(
        lastSize,
        ...recentSizes.filter((entry) => now - entry.at <= TAIL_MS).map((entry) => entry.size),
      );
      if (lastDirection === 0) return true;
      if (way !== lastDirection) return size >= 8;
      if (now - scrollStartedAt < MIN_BETWEEN) return false;
      if (idle >= LONG_PAUSE) return true;
      if (idle >= GESTURE_GAP) {
        return size >= PUSH_PX || (size >= 12 && size >= FLICK_RATIO * tail);
      }
      return size >= PUSH_PX && size >= FLICK_RATIO * tail;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0) return; // (ctrl: zooming)
      const way = event.deltaY > 0 ? 1 : -1;
      // In pixels, whatever the browser counts in (lines, pages).
      const size =
        Math.abs(event.deltaY) *
        (event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? window.innerHeight : 1);
      const now = performance.now();
      const idle = now - lastWheel;
      lastWheel = now;
      if (way < 0 && inFooter()) {
        event.preventDefault();
        backToFilm();
        return;
      }
      if (!takesInput(way)) return;
      event.preventDefault();
      const fresh = isNewScroll(way, size, now, idle);
      lastDirection = way;
      lastSize = size;
      recentSizes = recentSizes.filter((entry) => now - entry.at <= TAIL_MS);
      recentSizes.push({ at: now, size });
      if (!fresh || (moving === 0 && now < lockedUntil)) return;
      scrollStartedAt = now;
      go(way);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) {
        return;
      }
      let way = 0;
      if (event.key === "ArrowDown" || event.key === "PageDown") way = 1;
      else if (event.key === "ArrowUp" || event.key === "PageUp") way = -1;
      else if (event.key === " " && (target === document.body || target === null)) {
        way = event.shiftKey ? -1 : 1;
      }
      if (!way) return;
      if (way < 0 && inFooter()) {
        event.preventDefault();
        backToFilm();
        return;
      }
      if (!takesInput(way as 1 | -1)) {
        // After the last place the page goes on to the footer by itself (a wheel
        // does it natively; the arrow keys and Space too).
        return;
      }
      event.preventDefault();
      if (event.repeat || (moving === 0 && performance.now() < lockedUntil)) return;
      go(way as 1 | -1);
    };

    // A swipe on the film: one finger, up or down (a finger going up is a scroll
    // down). The page does not scroll under the finger (the film is
    // `touch-action: none`, see globals.css); where there is no place to go on
    // to, the page goes to the footer or back, by itself.
    let touch: {
      x: number;
      y: number;
      fired: boolean;
      last: { x: number; y: number }; // where the finger is now
      samples: { at: number; y: number }[]; // the last ~100 ms, for its speed
    } | null = null;

    const swipe = (way: 1 | -1) => {
      if (!ready()) return;
      if (inFooter()) {
        if (way < 0) backToFilm();
        else onToFooter();
        return;
      }
      if (!takesInput(way)) {
        if (way > 0) onToFooter();
        return;
      }
      const now = performance.now();
      if (moving === 0 && now < lockedUntil) return;
      if (now - scrollStartedAt < MIN_BETWEEN) return;
      scrollStartedAt = now;
      go(way);
    };

    const onTouchStart = (event: TouchEvent) => {
      const first = event.touches[0];
      const onFilm = (event.target as Element | null)?.closest?.(".personalization-scrub");
      touch =
        event.touches.length === 1 && first && onFilm
          ? {
              x: first.clientX,
              y: first.clientY,
              fired: false,
              last: { x: first.clientX, y: first.clientY },
              samples: [{ at: event.timeStamp, y: first.clientY }],
            }
          : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      const first = event.touches[0];
      // At a stop, the picture and the cards follow the finger a little.
      if (first && atStop) {
        mouseX = -Math.max(-1, Math.min(1, (first.clientX - touch.x) / DRAG_PX));
        mouseY = -Math.max(-1, Math.min(1, (first.clientY - touch.y) / DRAG_PX));
        kickShift();
      }
      if (!first) return;
      touch.last = { x: first.clientX, y: first.clientY };
      touch.samples.push({ at: event.timeStamp, y: first.clientY });
      while (touch.samples.length > 2 && event.timeStamp - touch.samples[0].at > 100) {
        touch.samples.shift();
      }
      if (touch.fired) return;
      const up = touch.y - first.clientY;
      const across = touch.x - first.clientX;
      // Where the finger can move the picture, a slow drag does only that; where
      // it cannot (the start, the end, the film playing) a short swipe is enough.
      const limit = atStop && moving === 0 ? PULL_PX : SWIPE_PX;
      if (Math.abs(up) < limit || Math.abs(up) < Math.abs(across)) return;
      touch.fired = true;
      swipe(up > 0 ? 1 : -1);
    };
    const onTouchEnd = (event: TouchEvent) => {
      // Lifting the finger after a quick flick (not a slow drag, nor a finger that
      // stopped before it was lifted) goes on too.
      if (touch && !touch.fired && atStop && moving === 0 && touch.samples.length > 1) {
        const up = touch.y - touch.last.y;
        const across = touch.x - touch.last.x;
        const first = touch.samples[0];
        const last = touch.samples[touch.samples.length - 1];
        const elapsed = last.at - first.at;
        const speed = elapsed > 0 ? Math.abs(last.y - first.y) / elapsed : 0;
        const stillMoving = event.timeStamp - last.at <= 80;
        if (
          stillMoving &&
          Math.abs(up) >= FLICK_PX &&
          Math.abs(up) >= Math.abs(across) &&
          speed >= FLICK_SPEED
        ) {
          touch.fired = true;
          swipe(up > 0 ? 1 : -1);
        }
      }
      touch = null;
      // The finger is up: the picture and the cards go back to the middle.
      mouseX = 0;
      mouseY = 0;
      kickShift();
    };

    const onSeeked = () => showAt(time);

    // ---- The cards, and the picture and cards follow the mouse or a finger ----

    const desktop = window.matchMedia(DESKTOP_POINTER);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let atStop = false; // the film is resting on a stop
    let mouseX = 0; // where the mouse is on the film: -1 (left) to 1 (right)
    let mouseY = 0; // -1 (top) to 1 (bottom)
    // (A finger sets the same two numbers, the other way round: it drags the
    // picture along with it, 90 px being the edge.)
    let shiftX = 0; // what is shown, which follows the mouse a little behind it
    let shiftY = 0;
    let depth = 0; // 0 while the film plays, 1 while it rests on a stop
    let shiftFrame: number | null = null;

    // The picture and the cards are moved by the three numbers set on the stage,
    // which the styles in globals.css use: --px and --py (where the mouse is, as
    // above, once it has caught up) and --ps (how much of the effect is on).
    const shiftTick = () => {
      shiftFrame = null;
      const on = atStop && !still.matches;
      const wantX = on ? mouseX : 0;
      const wantY = on ? mouseY : 0;
      const wantDepth = on ? 1 : 0;
      shiftX += (wantX - shiftX) * 0.08;
      shiftY += (wantY - shiftY) * 0.08;
      depth += (wantDepth - depth) * 0.06;
      stage.style.setProperty("--px", shiftX.toFixed(4));
      stage.style.setProperty("--py", shiftY.toFixed(4));
      stage.style.setProperty("--ps", depth.toFixed(4));
      if (
        Math.abs(wantX - shiftX) > 0.002 ||
        Math.abs(wantY - shiftY) > 0.002 ||
        Math.abs(wantDepth - depth) > 0.002
      ) {
        shiftFrame = requestAnimationFrame(shiftTick);
      }
    };
    const kickShift = () => {
      if (shiftFrame === null) shiftFrame = requestAnimationFrame(shiftTick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !desktop.matches) return;
      const box = stage.getBoundingClientRect();
      if (!box.width || !box.height) return;
      mouseX = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      mouseY = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      kickShift();
    };
    const onMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
      kickShift();
    };

    // The cards of a stop are shown while the film rests on it.
    const setStop = (stop: number | null) => {
      setActive(stop);
      atStop = stop !== null;
      kickShift();
    };
    const settle = () => {
      const stop = place - 1; // places 1 to 4 are the stops
      setStop(stop >= 0 && stop < STOP_FRAMES.length ? stop : null);
    };

    // ---- Getting what the window needs ----

    // Give the video its file (a tablet or larger), or start fetching the
    // pictures (a phone), and show the film where it is.
    const attach = () => {
      if (large()) {
        if (!loaded) {
          loaded = true;
          video.preload = "auto";
          video.src = SRC_LARGE;
          video.addEventListener("loadeddata", onLoadedData, { once: true });
          video.load();
        }
      } else {
        fetchAll();
        sizeCanvas();
        void fetchFrame(0).then(() => showAt(time));
      }
      if (moving === 0) {
        time = places()[place];
        showAt(time);
      }
    };

    video.addEventListener("loadeddata", onFirstFrame, { once: true });
    video.addEventListener("seeked", onSeeked);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("resize", attach);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    media.addEventListener("change", attach);
    const sizeWatcher =
      typeof ResizeObserver === "function" ? new ResizeObserver(sizeCanvas) : null;
    sizeWatcher?.observe(canvas);
    attach();

    return () => {
      if (moveFrame !== null) cancelAnimationFrame(moveFrame);
      if (shiftFrame !== null) cancelAnimationFrame(shiftFrame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      video.removeEventListener("loadeddata", onFirstFrame);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", attach);
      media.removeEventListener("change", attach);
      sizeWatcher?.disconnect();
      decoded.forEach((bitmap) => bitmap.close());
      decoded.clear();
    };
  }, []);

  return (
    <section ref={sectionRef} className="personalization-scrub bg-black">
      <div ref={stageRef} className="personalization-scrub-stage">
        {/* One of the two is shown (see globals.css): the canvas on a phone, the
            video on anything larger. */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="personalization-scrub-canvas"
        />
        <video
          ref={videoRef}
          aria-hidden="true"
          muted
          playsInline
          preload="none"
          tabIndex={-1}
          className="personalization-scrub-video"
        />

        {/* The cards (a laptop or a desktop only, see globals.css): the ones of
            the stop the film is resting on come in, the others are out of sight. */}
        <div className="stop-cards">
          {STOP_CARDS.map((cards, stop) => (
            <div
              key={stop}
              className="stop-group"
              data-active={active === stop}
              aria-hidden={active !== stop}
            >
              {cards.map((card, index) => (
                <div
                  key={card.title}
                  className="stop-card"
                  style={
                    {
                      "--dl": card.place.left,
                      "--dr": card.place.right,
                      "--dt": card.place.top,
                      "--db": card.place.bottom,
                      "--depth": card.depth,
                      "--delay": `${index * 140}ms`,
                    } as CSSProperties
                  }
                >
                  <div className="stop-card-body font-montserrat">
                    <h3 className="stop-card-title">{card.title}</h3>
                    <p className="stop-card-text">{card.text}</p>
                    <button
                      type="button"
                      style={BUTTON_EDGE}
                      className="stop-card-button"
                    >
                      {card.button}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
