"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";

import { BUTTON_EDGE } from "@/components/buttonEdge";

// The film of the Personalization page. The scroll is not tied to any frame: it
// only starts the film. Scrolling down plays it (at the speed it was made at) to
// the next stop, where it stays; scrolling up plays it backwards to the one
// before. The places the film can be at: the start (a black frame), the four
// stops, and the last frame. The film is as tall as the window (under the
// header) and stays in place; after the last frame the page scrolls on: the
// contact form rises from below over the film, and once it covers it, that is the
// end of the page (there is no footer). Scrolling up goes back the same way, to the
// film.
//
// Scrolling is a wheel or a trackpad (a laptop, a desktop), the arrow keys, Page
// Up and Down and Space, or a swipe of a finger (a phone, a tablet).
//
// It is the same film, in two shapes, and it fills the whole window in both:
//  - for a window wider than tall (a laptop, a desktop, a tablet on its side):
//    a video (16:9), in which every frame is a key frame
//    (`public/videos/personalization-scrub-v2.mp4`), so jumping to any time is as
//    fast going backwards as forwards;
//  - for a window taller than wide (a phone, a tablet upright): the 233 frames
//    as pictures (the same film as the wide one, made as its own vertical version, 9:16,
//    `public/videos/personalization-mobile-frames-v5/`), drawn
//    on a canvas. A phone's video decoder is slow to jump to a frame (a jump is
//    a hold-up of 50 to 150 ms there), so playing a video backwards, or
//    scrubbing it, is jerky on a phone; a picture is drawn at once.
// Nothing is fetched until the page is open, and then only the shape that fits
// the window (and the other one if the window changes to it).
//
// The film is fetched whole before it can be played: a black screen with a bar
// shows how much has come, and scrolling waits (the film would otherwise run
// ahead of what has arrived, and stop and jerk). The video is fetched as one file
// and played from memory; the pictures one by one. The browser keeps both, so the
// next visit does not wait: the pictures by what the server says (a year,
// next.config.ts), the video in Cache Storage (see `openFilmCache`).

// Raise it when a file of the film is changed (see next.config.ts): the new
// address is not in the browser's keeping.
const FILM_VERSION = 7;
const SRC_LARGE = `/videos/personalization-scrub-v2.mp4?v=${FILM_VERSION}`;
// The size of the video, for the bar if the server does not say (bytes).
const FALLBACK_LARGE_BYTES = 11_100_000;
// Where the video is kept in the browser once it has come. (The browser's own
// keeping, which the server's headers ask for, does not hold a file this big in
// some browsers, Safari among them, so the video is also put in Cache Storage,
// which holds it for as long as the browser has room. The pictures are small and
// need nothing more than the headers.) One for each version of the film.
const FILM_CACHE_PREFIX = "personalization-film-";
const FILM_CACHE = `${FILM_CACHE_PREFIX}${FILM_VERSION}`;

// The place for the video in Cache Storage, or null where there is none (a page
// that is not on https, or a private window). The films of older versions are
// thrown out.
const openFilmCache = async (): Promise<Cache | null> => {
  try {
    if (typeof caches === "undefined") return null;
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(FILM_CACHE_PREFIX) && name !== FILM_CACHE)
        .map((name) => caches.delete(name)),
    );
    return await caches.open(FILM_CACHE);
  } catch {
    return null;
  }
};
const FRAMES_DIR = "/videos/personalization-mobile-frames-v5";
const frameUrl = (index: number) =>
  `${FRAMES_DIR}/f${String(index).padStart(3, "0")}.webp?v=${FILM_VERSION}`;
const FPS = 24;
// The length of each shape, in frames. The wide one is the second version of
// "Personalize_Tower_Update_V2" (250 frames, all of it: its words have settled at frame 243, and
// the film ends 7 frames after that); the vertical one is its own film, whose words settle at
// frame 223, so it ends at 233. The two have different stops (below).
const FRAMES_LARGE = 250;
const FRAMES_PHONE = 233;
// The windows that get the video: wider than tall (the same test as in
// globals.css).
const LARGE_SCREEN = "(min-aspect-ratio: 1/1)";

// The stops, as the frame (counting from 0) the film stays on. They are the
// moments where the picture comes to rest (the knight, the empty frame, the
// blue case, the three shields): the frames at the middle of each rest.
// The wide film rests (the picture does not change) at frames 36-39, 87-95 and 182-186; the
// blue case has no rest in it: its stop is frame 139, the picture of the old film's rest (140 is the next frame, already moving on).
// The vertical film rests at frames 36-39, 88-91, 135-139 and 178-183 (the picture does not
// change), and its stops are the middles of them.
const STOP_FRAMES_LARGE = [37, 91, 139, 184];
const STOP_FRAMES_PHONE = [38, 90, 137, 180];
const placesFor = (stops: number[], frames: number) => [
  0,
  ...stops.map((frame) => (frame + 0.5) / FPS),
  (frames - 0.5) / FPS,
];
const PLACES_LARGE = placesFor(STOP_FRAMES_LARGE, FRAMES_LARGE);
const PLACES_PHONE = placesFor(STOP_FRAMES_PHONE, FRAMES_PHONE);
// How fast the film plays between two places (1 is the speed it was made at):
// the speed of each stretch of the film, in the order of the places (the start to
// the first stop, the first stop to the second, and so on to the last frame). The
// stretches from the second stop to the third and from the third to the fourth
// are a little slower. (Going back plays the same stretch at the same speed.)
const PLAY_SPEED = 1.6;
const SLOWER_SPEED = 1.25;
const STRETCH_SPEEDS = [PLAY_SPEED, PLAY_SPEED, SLOWER_SPEED, SLOWER_SPEED, PLAY_SPEED];
// Leaving a stop, the film is still, or almost, for a few frames before the picture goes
// on: that looked like a short stop. Within a zone (a place, and the frame it starts to
// move at, going back and going on) the film goes through the frames EASE_BOOST times as
// fast, leaving (arriving, it eases as it was made).
const EASE_BOOST = 3;
type EaseZone = { place: number; back: number; forward: number };
const EASE_ZONES_LARGE: EaseZone[] = [
  { place: 1, back: 35, forward: 40 },
  { place: 2, back: 84, forward: 97 },
  { place: 4, back: 181, forward: 188 },
];
const EASE_ZONES_PHONE: EaseZone[] = [
  { place: 1, back: 35, forward: 41 },
  { place: 2, back: 84, forward: 93 },
  { place: 3, back: 133, forward: 141 },
  { place: 4, back: 177, forward: 185 },
];
// A tablet or larger: within this many frames of the place it is going to, the film waits
// for the video to have jumped to a frame before it asks for the next; and it comes to
// rest only once the video shows the frame it stops on (at most ARRIVE_WAIT_MS ms).
const APPROACH_FRAMES = 4;
const ARRIVE_WAIT_MS = 400;

// A finger's swipe takes the page on to the contact form (and back) by itself, not
// all at once: this many ms for each px it has to go (but at least, and at most,
// the other two), and it eases in and out.
const SCROLL_MS_PER_PX = 1.3;
const SCROLL_MS_LEAST = 600;
const SCROLL_MS_MOST = 1500;

// A flick of the wheel or the trackpad is many events in a row (and a trackpad
// goes on for a second or more after the fingers have left, dying away), a click
// of a wheel is one. Which events start a new scroll is decided in `isNewScroll`
// with these numbers: a pause of GESTURE_GAP ms is where a new scroll may start (if
// what comes after it is a push FLICK_RATIO times bigger than the tail of the
// scroll before, looked at over TAIL_MS ms), a pause of LONG_PAUSE ms is where it
// always does; a push of PUSH_PX px with no pause, as much bigger than the tail, is
// a new scroll too; two scrolls are at least MIN_BETWEEN ms apart. However long or
// big a scroll is, it is one scroll: it moves the film one place, and the rest of
// it (a wheel turned on and on, a trackpad's tail) does nothing. A scroll the same
// way while the film is playing does nothing either; one the other way turns the
// film round. One that comes in the first moment after the film has stopped
// (SETTLE_MS) does not count.
const GESTURE_GAP = 70;
const LONG_PAUSE = 350;
const PUSH_PX = 40;
const FLICK_RATIO = 4;
const TAIL_MS = 150;
const MIN_BETWEEN = 350;
const SETTLE_MS = 300;
// A swipe of a finger: how far (px) it has to go up or down to count.
const SWIPE_PX = 28;

// The pictures of a phone: how many are fetched at once (each one waits a good
// while for the server when the connection is slow, so a few at a time is far
// slower than many), how many decoded ones are kept (a decoded 810 x 1440 picture
// takes 4.7 MB), how many frames ahead, the way the film is going, are decoded
// before they are needed, and how many frames ahead of the film must have arrived
// before it plays on. How many times the pictures that did not come are tried
// again before the film gives up.
const FETCH_AT_ONCE = 20;
const KEEP_DECODED = 16;
const DECODE_AHEAD = 8;
const BUFFER_AHEAD = 3;
const FETCH_ROUNDS = 4;

// On a laptop or a desktop (this test, the same as in globals.css) the picture moves
// a little with the mouse while the film rests on a stop. (A phone and a tablet do
// not have the moving.)
const DESKTOP_POINTER =
  "(min-width: 1024px) and (min-height: 500px) and (hover: hover) and (pointer: fine)";

// The text of each place the film rests on, in order: the four stops (the knight,
// the empty frame, the case, the shields) and the last frame. Each is one or two
// big lines in italic, a heading and a paragraph. A place that has none is null.
// On a laptop or a desktop the block is placed by `left` (its left edge) and `top`
// (its middle), in % of the picture; if `note` is given, the heading and the
// paragraph are a block of their own there, and the big lines are alone at `left`
// and `top`. On a phone every block is at the top left (the note, at the bottom
// left), see globals.css. Each line has its size in px on the design for a window
// 1920px wide: the heading is 40px and the paragraph 16px there. All are smaller on
// a smaller window. On a laptop or a desktop the blocks also move a little with the
// mouse (`DEPTH`).
type StopText = {
  lines: [text: string, size: number][];
  heading: string;
  body: string;
  left: string;
  top: string;
  note?: { left: string; top: string };
  // The whole block (the big lines, the heading and the paragraph) is at the bottom left on
  // a phone, instead of the top left; a wide window has it at `left` and `top` as usual.
  phoneBottom?: boolean;
};

// How much a block moves with the mouse (a laptop, a desktop): 1 is a little, more
// is more (so the blocks seem to be at different distances from the picture, as the
// cards were). The big lines (and the heading and paragraph under them) are 1; a
// note, apart from them, is further.
const DEPTH = 1;
const NOTE_DEPTH = 1.6;

const STOP_TEXTS: (StopText | null)[] = [
  // stop 1, the knight
  {
    lines: [
      ["START", 110],
      ["DESIGNING", 78],
    ],
    heading: "Make it yours",
    body: "Choose your cigarette size, then shape every detail of your Smoky Cover, from the leather to the finish.",
    // On a wide window the text is in the empty dark left of the picture, at one left edge
    // for every stop (the knight starts at 35%).
    left: "13%",
    top: "50%",
  },
  // stop 2, the empty frame
  {
    lines: [
      ["High class", 91],
      ["Leather", 110],
    ],
    heading: "Choose your leather",
    body: "Premium leathers in a range of colours and textures, picked for how well they feel and how beautifully they age.",
    // At the bottom left, under the dark corner before the frame and the leathers (they
    // start at 31%).
    left: "13%",
    top: "74%",
  },
  // stop 3, the blue case
  {
    lines: [["Body Color", 98]],
    heading: "Pick your colour",
    body: "A wide palette for the body of your cover, from quiet neutrals to bold statements. Your cover, your shade.",
    // At the bottom left, before the colour wall and its floor (they start at 27-32%).
    left: "13%",
    top: "74%",
  },
  // stop 4, the three shields
  {
    // Two lines (one line of this is wider than a phone): "White Gold, Gold, Rose Gold".
    lines: [
      ["White Gold,", 98],
      ["Gold, Rose Gold", 98],
    ],
    heading: "Finish in metal",
    body: "Put your emblem or monogram on the leather in white gold, gold or rose gold, whichever suits your style.",
    // At the bottom right, in the dark under the steps (the cushions are at 16-69% across
    // and end at 67% of the height).
    left: "72%",
    top: "78%",
    // On a phone the cushions are at the top of the picture, so the text goes to the bottom.
    phoneBottom: true,
  },
  // the last frame, "Your Sign": the big lines top left, the note bottom right
  {
    lines: [
      ["More", 113],
      ["Free Zones", 72],
    ],
    heading: "Leave your mark",
    body: "A name, initials or a short line in the free zones: the last detail that makes it unmistakably yours.",
    // "Your Sign" is in the middle (33-67% across, 31-63% down): the big lines are at the
    // top left and the note at the bottom right, away from it.
    left: "7%",
    top: "16%",
    note: { left: "72%", top: "76%" },
  },
];

export default function PersonalizationScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // The film is at its first frame and at rest: the title is shown over it.
  const [atStart, setAtStart] = useState(true);
  // Which text is shown over the film: the one of the place it is resting on (the
  // stops 0 to 3, the last frame 4), or none while it plays.
  const [restText, setRestText] = useState<number | null>(null);
  // How much of the film has come (0 to 100), and whether it is still coming, has
  // all come (the bar goes away and the film can be played), or could not come.
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<"loading" | "done" | "failed">("loading");
  const retryRef = useRef<() => void>(() => undefined);
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

    let disposed = false; // the page has been left

    // ---- Getting the film: what has come, for the bar ----

    // Each shape has its own: how much has come (0 to 1), whether all of it has
    // come and can be played, and whether it could not be had.
    let largeProgress = 0;
    let phoneProgress = 0;
    let largeReady = false;
    let phoneReady = false;
    let largeFailed = false;
    let phoneFailed = false;

    // Whether the film of this window can be played (all of it has come).
    const ready = () => (large() ? largeReady : phoneReady);
    const failed = () => (large() ? largeFailed : phoneFailed);

    // Show the bar where the film of this window is.
    const report = () => {
      if (disposed) return;
      const done = ready();
      const progress = large() ? largeProgress : phoneProgress;
      setPercent(done ? 100 : Math.min(99, Math.floor(progress * 100)));
      setPhase(done ? "done" : failed() ? "failed" : "loading");
      syncLock();
    };

    // ---- A tablet, a laptop, a desktop: the video ----

    let videoStarted = false; // its file is being fetched, or has been
    let videoUrl: string | null = null; // the file, in memory
    let firstFrame = false; // the video has its first frame (it stays so:
    // `readyState` goes down for a moment each time the browser jumps to another
    // frame)

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

    // Whether the video is showing the frame whose time is `time` (and is not jumping).
    const videoShows = (at: number) => {
      const last = Math.max(0, Math.round(duration() * FPS) - 1);
      const index = Math.min(last, Math.max(0, Math.floor(at * FPS)));
      return !video.seeking && Math.abs(video.currentTime - (index + 0.5) / FPS) <= 0.75 / FPS;
    };

    // The video, all of it (it was fetched whole, see `loadVideo`), has its first
    // frame: the film can be played.
    const onFirstFrame = () => {
      firstFrame = true;
      largeReady = true;
      largeProgress = 1;
      showAt(time);
      report();
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
    const onVideoError = () => {
      if (!videoUrl) return;
      largeFailed = true;
      videoStarted = false;
      report();
    };

    // Fetch the whole video, with the bar following, and give it to the video
    // from memory: then jumping to a frame never has to wait for the network. (A
    // video given its address instead is fetched by the browser a piece at a
    // time, as it goes, and a jump to a piece that has not come waits for it.)
    const loadVideo = async () => {
      if (videoStarted || largeReady) return;
      videoStarted = true;
      largeFailed = false;
      largeProgress = 0;
      report();
      try {
        // From an earlier visit, if the browser has kept it.
        const cache = await openFilmCache();
        const kept = cache ? await cache.match(SRC_LARGE).catch(() => undefined) : undefined;
        const response = kept ?? (await fetch(SRC_LARGE));
        if (!response.ok) throw new Error(`video: ${response.status}`);
        let file: Blob;
        if (response.body) {
          const total = Number(response.headers.get("Content-Length")) || FALLBACK_LARGE_BYTES;
          const reader = response.body.getReader();
          const parts: BlobPart[] = [];
          let got = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (disposed) {
              void reader.cancel();
              return;
            }
            parts.push(value);
            got += value.length;
            largeProgress = Math.min(0.99, got / total);
            report();
          }
          file = new Blob(parts, { type: "video/mp4" });
        } else {
          file = await response.blob();
        }
        if (disposed) return;
        // Keep it for the next visit (only a whole file, as it came).
        if (cache && !kept) {
          void cache
            .put(
              SRC_LARGE,
              new Response(file, {
                headers: { "Content-Type": "video/mp4", "Content-Length": String(file.size) },
              }),
            )
            .catch(() => undefined);
        }
        videoUrl = URL.createObjectURL(file);
        video.preload = "auto";
        video.src = videoUrl;
        video.addEventListener("loadeddata", onLoadedData, { once: true });
        video.load();
      } catch {
        if (disposed) return;
        videoStarted = false;
        largeFailed = true;
        report();
      }
    };

    // ---- A phone: the pictures on a canvas ----

    const fetched = new Map<number, Promise<Blob>>(); // the files, as they come
    const arrived = new Set<number>(); // the ones that have come
    const decoded = new Map<number, ImageBitmap>(); // oldest used first
    const decoding = new Map<number, Promise<ImageBitmap | null>>();
    let phoneStarted = false; // the pictures are being fetched, or have been
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

    // All the pictures, in order, many at a time, with the bar following. The ones
    // that did not come are asked for again, a few times, a little later each time;
    // after that the film gives up (and the bar offers to try again).
    const loadPhone = async () => {
      if (phoneStarted || phoneReady) return;
      phoneStarted = true;
      phoneFailed = false;
      report();
      for (let round = 0; round < FETCH_ROUNDS && !disposed; round++) {
        const missing: number[] = [];
        for (let index = 0; index < FRAMES_PHONE; index++) {
          if (!arrived.has(index)) missing.push(index);
        }
        if (missing.length === 0) break;
        let next = 0;
        const worker = async () => {
          while (next < missing.length && !disposed) {
            try {
              await fetchFrame(missing[next++]);
            } catch {
              // The next round asks again.
            }
            phoneProgress = arrived.size / FRAMES_PHONE;
            report();
          }
        };
        await Promise.all(Array.from({ length: FETCH_AT_ONCE }, worker));
        if (arrived.size >= FRAMES_PHONE) break;
        await new Promise((resolve) => setTimeout(resolve, 800 * (round + 1)));
      }
      if (disposed) return;
      if (arrived.size >= FRAMES_PHONE) {
        phoneProgress = 1;
        phoneReady = true;
        showAt(time);
      } else {
        phoneFailed = true;
        phoneStarted = false;
      }
      report();
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
        if (firstFrame && !video.seeking) showVideoFrame(at);
        return;
      }
      const index = Math.min(FRAMES_PHONE - 1, Math.max(0, Math.floor(at * FPS)));
      if (index !== wantedIndex || drawnIndex < 0) {
        if (index !== wantedIndex) direction = index > wantedIndex ? 1 : -1;
        drawFrame(index);
      }
    };

    // ---- The film plays towards the place it is sent to ----

    // How fast the film plays at this time, going this way: the speed of the stretch
    // between two places it is in (at a place itself, the stretch it is leaving).
    const speedAt = (at: number, way: number) => {
      const list = places();
      for (let i = 0; i < list.length - 1; i++) {
        const inside = way > 0 ? at >= list[i] && at < list[i + 1] : at > list[i] && at <= list[i + 1];
        if (inside) return (STRETCH_SPEEDS[i] ?? PLAY_SPEED) * easeBoost(at, way);
      }
      return PLAY_SPEED;
    };

    // Leaving a stop (see EASE_ZONES_LARGE), the film goes through the frames where the
    // picture hardly moves EASE_BOOST times as fast, so it is on its way at once;
    // arriving, it eases as it was made.
    const easeBoost = (at: number, way: number) => {
      const list = places();
      const inside = (large() ? EASE_ZONES_LARGE : EASE_ZONES_PHONE).some((zone) => {
        const stop = list[zone.place];
        return way > 0
          ? at >= stop && at < zone.forward / FPS
          : at > zone.back / FPS && at <= stop;
      });
      return inside ? EASE_BOOST : 1;
    };

    let moving = 0; // 1 playing forwards, -1 backwards, 0 at rest
    let moveAt = 0; // when the film last moved
    let moveFrame: number | null = null;
    let lockedUntil = 0; // no new scroll is taken before this (after a stop)
    let arriveWaitSince: number | null = null; // the film is at its place, waiting for the picture

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
        // On a tablet or larger, near the place it is going to, the film waits for the
        // picture before it goes on: a frame asked for while the video is still jumping
        // to the one before is dropped, so the picture would stop on an earlier frame
        // and then jump to the right one.
        if (large() && video.seeking && Math.abs(goal - time) * FPS <= APPROACH_FRAMES) passed = 0;
        time += moving * speedAt(time, moving) * passed;
        if ((moving > 0 && time >= goal) || (moving < 0 && time <= goal)) {
          time = goal;
          // It comes to rest only when the picture shows the frame it stops on (or, if
          // the video does not get there, after ARRIVE_WAIT_MS).
          showAt(time);
          const shown = !large() || videoShows(goal);
          if (!shown && arriveWaitSince === null) arriveWaitSince = now;
          if (shown || (arriveWaitSince !== null && now - arriveWaitSince > ARRIVE_WAIT_MS)) {
            arriveWaitSince = null;
            moving = 0;
            lockedUntil = performance.now() + SETTLE_MS;
            settle();
          }
        }
      }
      showAt(time);
      // On a tablet or larger, while the browser is still getting to the last
      // frame, wait for it.
      if (moving !== 0 || (large() && video.seeking)) {
        moveFrame = requestAnimationFrame(playTick);
      }
    };

    // A scroll in this direction. At rest: to the next place that way, and no
    // further. While the film is playing: another scroll the same way does nothing
    // (the film stops at the place it was heading for), and one the other way turns
    // it round to the nearest place behind it.
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
        arriveWaitSince = null;
        moveAt = performance.now();
        setStop(null);
        if (moveFrame === null) moveFrame = requestAnimationFrame(playTick);
      } else if (way === moving) {
        // Already on its way that way: it stops at the next place.
        return;
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
        arriveWaitSince = null;
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
    // that way; after the last place the page scrolls on: the contact form rises
    // over the film, and that is the end of the page.
    const takesInput = (way: 1 | -1) => {
      if (!ready() || window.scrollY >= 2) return false;
      if (moving !== 0) return true;
      const next = place + way;
      return next >= 0 && next < places().length;
    };

    // The film is at rest on its last frame and the page is at the top: the next
    // scroll down raises the contact form over it by itself (see `revealContact`).
    const atEnd = () =>
      ready() && moving === 0 && place >= places().length - 1 && window.scrollY < 2;

    // The page has been scrolled down from the film: the contact form is rising
    // over it, or is over it. (Then the browser scrolls
    // the page, a wheel, a trackpad and the keys as they are; only a finger on the
    // part of the film still in sight is taken by `swipe` below.)
    const scrolledDown = () => window.scrollY >= 2;

    // The film is still coming (the bar is on): the page stays at the top, a scroll
    // does nothing. (If it could not come, the page is let go, so that the contact
    // form can still be reached.)
    const holding = () => !ready() && !failed() && !scrolledDown();

    // Whether the page may be scrolled past the film (by a scrollbar, End, the
    // wheel...): the film is at its last frame and at rest, or could not come, or
    // the page is down already. (With a mouse, the style in globals.css takes the
    // scrollbar away while this is not so: `data-film-open` is on the page when it
    // is.)
    const syncLock = () => {
      if (disposed) return;
      const open =
        failed() ||
        scrolledDown() ||
        (ready() && moving === 0 && place >= places().length - 1);
      document.documentElement.toggleAttribute("data-film-open", open);
    };

    // Take the page to this scroll position by itself, over a time that follows the
    // distance, easing in and out (the browser's own smooth scrolling is quicker
    // than the contact form should rise). A finger or a wheel on the page stops it
    // where it is.
    let scrollFrame: number | null = null;
    // Which way the page is being taken by itself (1 down, -1 up), 0 if it is not.
    let pageScrollWay = 0;
    // The wheel scroll (or trackpad flick) that raised the contact form is still going
    // on: what is left of it does nothing, it neither stops the page on its way nor
    // scrolls it on past the form.
    let swallowing = false;
    const stopPageScroll = () => {
      if (scrollFrame === null) return;
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
      pageScrollWay = 0;
      snapUntil = 0;
    };
    const scrollPageTo = (top: number) => {
      const from = window.scrollY;
      const distance = top - from;
      if (Math.abs(distance) < 1) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, top);
        return;
      }
      const duration = Math.min(
        SCROLL_MS_MOST,
        Math.max(SCROLL_MS_LEAST, Math.abs(distance) * SCROLL_MS_PER_PX),
      );
      snapUntil = performance.now() + duration + 100;
      pageScrollWay = distance > 0 ? 1 : -1;
      const startedAt = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / duration);
        // A gentle ease in and out (its quickest part is not much quicker than the
        // average, so the page does not rush through the middle).
        const eased = (1 - Math.cos(Math.PI * t)) / 2;
        window.scrollTo(0, from + distance * eased);
        scrollFrame = t < 1 ? requestAnimationFrame(step) : null;
        if (t >= 1) pageScrollWay = 0;
      };
      scrollFrame = requestAnimationFrame(step);
    };

    // A swipe on the film, with the page scrolled down, down: the page goes back
    // up to the film; the next swipe plays the film back.
    const backToFilm = () => {
      if (performance.now() < snapUntil) return;
      scrollPageTo(0);
    };
    // After the last place, a swipe up takes the page on, until the contact form
    // has risen all the way over the film (when its top is at the film's top: the
    // film's own height, and the black under it, scrolled, see `.personalization-
    // scrub` in globals.css); from there the finger scrolls the page itself.
    const revealContact = () => {
      if (performance.now() < snapUntil) return;
      const gap = parseFloat(getComputedStyle(section).marginBottom) || 0;
      scrollPageTo(section.offsetHeight + gap);
    };

    // Is this wheel event the start of a new scroll, or still the one before? A
    // trackpad's flick is many events (growing, then dying away for a second or
    // more after the fingers have left), a wheel's click is one. So:
    //  - the other way than the last event, and not a bounce: new;
    //  - right after the last scroll started: not new;
    //  - a long pause since the last event: new;
    //  - a short pause (the tail of a flick can have one, and a wheel turned on
    //    and on has one between its clicks): new only if it is much bigger than
    //    the tail was, not the tail going on, nor one more click of the same size;
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
        return size >= 12 && size >= FLICK_RATIO * tail;
      }
      return size >= PUSH_PX && size >= FLICK_RATIO * tail;
    };

    // Write down a wheel event, for `isNewScroll` to look back on.
    const remember = (way: number, size: number, now: number) => {
      lastDirection = way;
      lastSize = size;
      recentSizes = recentSizes.filter((entry) => now - entry.at <= TAIL_MS);
      recentSizes.push({ at: now, size });
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
      // The rest of the scroll that raised the contact form (a wheel turned on and on,
      // a trackpad's tail) does nothing. A new scroll, or one the other way, is the
      // page's own again (and stops the page if it is still on its way).
      if (swallowing) {
        if (way > 0 && !isNewScroll(way, size, now, idle)) {
          remember(way, size, now);
          event.preventDefault();
          return;
        }
        swallowing = false;
      }
      stopPageScroll();
      if (holding()) {
        event.preventDefault();
        return;
      }
      if (scrolledDown()) {
        // The browser scrolls the page. It is written down all the same: the
        // tail of a trackpad's flick that takes the page back up to the film
        // goes on after the page has got there, and must not play the film.
        remember(way, size, now);
        scrollStartedAt = now;
        return;
      }
      if (!takesInput(way)) {
        // After the last place a scroll down takes the page on by itself, to where the
        // contact form covers the film, the way a swipe does on a phone (a scroll
        // that is only the tail of the one that played the film to the end does
        // nothing).
        if (way > 0 && atEnd()) {
          event.preventDefault();
          const fresh = isNewScroll(way, size, now, idle);
          remember(way, size, now);
          if (fresh && now >= lockedUntil) {
            scrollStartedAt = now;
            swallowing = true;
            revealContact();
          }
        }
        return;
      }
      event.preventDefault();
      const fresh = isNewScroll(way, size, now, idle);
      remember(way, size, now);
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
      if (holding()) {
        event.preventDefault();
        return;
      }
      // The contact form is on its way up: a key down waits for it.
      if (way > 0 && pageScrollWay > 0) {
        event.preventDefault();
        return;
      }
      if (!takesInput(way as 1 | -1)) {
        // After the last place a key down takes the page on by itself, to where the
        // contact form covers the film, as a wheel does; from there, and back up,
        // the page scrolls as the browser does it.
        if (way > 0 && atEnd()) {
          event.preventDefault();
          if (!event.repeat && performance.now() >= lockedUntil) revealContact();
        }
        return;
      }
      event.preventDefault();
      if (event.repeat || (moving === 0 && performance.now() < lockedUntil)) return;
      go(way as 1 | -1);
    };

    // A swipe on the film: one finger, up or down (a finger going up is a scroll
    // down). The page does not scroll under the finger (the film is
    // `touch-action: none`, see globals.css); where there is no place to go on
    // to, the page goes on, to where the contact form covers the film, or back.
    // (A finger on the contact form scrolls the page by itself.)
    let touch: { x: number; y: number; fired: boolean } | null = null;

    const swipe = (way: 1 | -1) => {
      // (While the film is coming a swipe does nothing; if it could not come, the
      // page goes on, to the contact form.)
      if (!ready() && !failed()) return;
      if (scrolledDown()) {
        if (way < 0) backToFilm();
        else revealContact();
        return;
      }
      if (!takesInput(way)) {
        if (way > 0) revealContact();
        return;
      }
      const now = performance.now();
      if (moving === 0 && now < lockedUntil) return;
      if (now - scrollStartedAt < MIN_BETWEEN) return;
      scrollStartedAt = now;
      go(way);
    };

    const onTouchStart = (event: TouchEvent) => {
      stopPageScroll(); // a finger on the page stops it going on by itself
      const first = event.touches[0];
      const onFilm = (event.target as Element | null)?.closest?.(".personalization-scrub");
      touch =
        event.touches.length === 1 && first && onFilm
          ? { x: first.clientX, y: first.clientY, fired: false }
          : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      const first = event.touches[0];
      if (touch.fired || !first) return;
      const up = touch.y - first.clientY;
      const across = touch.x - first.clientX;
      if (Math.abs(up) < SWIPE_PX || Math.abs(up) < Math.abs(across)) return;
      touch.fired = true;
      swipe(up > 0 ? 1 : -1);
    };
    const onTouchEnd = () => {
      touch = null;
    };

    const onSeeked = () => showAt(time);

    // ---- The picture follows the mouse ----

    const desktop = window.matchMedia(DESKTOP_POINTER);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let atStop = false; // the film is resting on a stop
    let mouseX = 0; // where the mouse is on the film: -1 (left) to 1 (right)
    let mouseY = 0; // -1 (top) to 1 (bottom)
    let shiftX = 0; // what is shown, which follows the mouse a little behind it
    let shiftY = 0;
    let depth = 0; // 0 while the film plays, 1 while it rests on a stop
    let textShown = false; // a text is shown (on a stop, or on the last frame)
    let textX = 0; // what the texts show of the mouse (they move on the last frame too)
    let textY = 0;
    let shiftFrame: number | null = null;

    // The picture is moved by the three numbers set on the stage,
    // which the styles in globals.css use: --px and --py (where the mouse is, as
    // above, once it has caught up) and --ps (how much of the effect is on).
    const shiftTick = () => {
      shiftFrame = null;
      // Only with a mouse (a laptop, a desktop): a phone and a tablet do not move.
      const on = atStop && desktop.matches && !still.matches;
      const wantX = on ? mouseX : 0;
      const wantY = on ? mouseY : 0;
      const wantDepth = on ? 1 : 0;
      shiftX += (wantX - shiftX) * 0.08;
      shiftY += (wantY - shiftY) * 0.08;
      depth += (wantDepth - depth) * 0.06;
      stage.style.setProperty("--px", shiftX.toFixed(4));
      stage.style.setProperty("--py", shiftY.toFixed(4));
      stage.style.setProperty("--ps", depth.toFixed(4));
      // The texts follow the mouse the same way (--tx and --ty), on whichever place
      // they are shown, and settle back to the middle when they go.
      const onText = textShown && desktop.matches && !still.matches;
      const wantTX = onText ? mouseX : 0;
      const wantTY = onText ? mouseY : 0;
      textX += (wantTX - textX) * 0.08;
      textY += (wantTY - textY) * 0.08;
      stage.style.setProperty("--tx", textX.toFixed(4));
      stage.style.setProperty("--ty", textY.toFixed(4));
      if (
        Math.abs(wantX - shiftX) > 0.002 ||
        Math.abs(wantY - shiftY) > 0.002 ||
        Math.abs(wantDepth - depth) > 0.002 ||
        Math.abs(wantTX - textX) > 0.002 ||
        Math.abs(wantTY - textY) > 0.002
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

    // Whether the film is resting on a stop (the picture follows the mouse then).
    const setStop = (stop: number | null, text: number | null = stop) => {
      atStop = stop !== null;
      textShown = text !== null;
      setRestText(text);
      setAtStart(place === 0 && moving === 0);
      kickShift();
      syncLock(); // (the film has just started to move, or has come to rest)
    };
    const settle = () => {
      const index = place - 1; // places 1 to 4 are the stops, place 5 the last frame
      setStop(
        index >= 0 && index < STOP_FRAMES_PHONE.length ? index : null,
        index >= 0 && index < STOP_TEXTS.length ? index : null,
      );
    };

    // ---- Getting what the window needs ----

    // Start fetching the video (a tablet or larger) or the pictures (a phone), if
    // that has not been done, and show the film where it is.
    const attach = () => {
      if (large()) {
        void loadVideo();
      } else {
        void loadPhone();
        sizeCanvas();
        void fetchFrame(0)
          .then(() => showAt(time))
          .catch(() => undefined);
      }
      if (moving === 0) {
        time = places()[place];
        showAt(time);
      }
      report();
    };
    // The bar's button: ask for what did not come again.
    retryRef.current = attach;

    video.addEventListener("loadeddata", onFirstFrame, { once: true });
    video.addEventListener("error", onVideoError);
    video.addEventListener("seeked", onSeeked);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("resize", attach);
    window.addEventListener("scroll", syncLock, { passive: true });
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    media.addEventListener("change", attach);
    const sizeWatcher =
      typeof ResizeObserver === "function" ? new ResizeObserver(sizeCanvas) : null;
    sizeWatcher?.observe(canvas);
    attach();

    return () => {
      disposed = true;
      retryRef.current = () => undefined;
      if (moveFrame !== null) cancelAnimationFrame(moveFrame);
      if (shiftFrame !== null) cancelAnimationFrame(shiftFrame);
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      video.removeEventListener("loadeddata", onFirstFrame);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onVideoError);
      video.removeEventListener("seeked", onSeeked);
      if (videoUrl) {
        video.removeAttribute("src");
        video.load();
        URL.revokeObjectURL(videoUrl);
      }
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", attach);
      window.removeEventListener("scroll", syncLock);
      document.documentElement.removeAttribute("data-film-open");
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

        {/* The title on the first frame (see globals.css): it goes when the film
            starts to play, and comes back when the film is at its start again. */}
        <h1 className="personalization-intro font-montserrat" data-shown={atStart}>
          <span className="personalization-intro-row">
            <span className="personalization-intro-small personalization-intro-word">Build</span>
            <span className="personalization-intro-small personalization-intro-word">Your</span>
            <span className="personalization-intro-big personalization-intro-word">Design</span>
          </span>
          <svg
            className="personalization-intro-arrow"
            viewBox="0 0 24 14"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 2l10 10L22 2" vectorEffect="non-scaling-stroke" />
          </svg>
        </h1>

        {/* The text of each place the film rests on (see globals.css): it comes in
            when the film comes to rest there, and goes when the film plays on. */}
        {STOP_TEXTS.map(
          (text, index) =>
            text && (
              <Fragment key={index}>
                <div
                  className={`stop-text font-montserrat${text.phoneBottom ? " stop-text-phone-bottom" : ""}`}
                  data-shown={restText === index}
                  aria-hidden={restText !== index}
                  style={
                    {
                      "--left": text.left,
                      "--top": text.top,
                      "--depth": DEPTH,
                    } as CSSProperties
                  }
                >
                  <div className="stop-text-inner">
                    <h2 className="stop-text-title">
                      {text.lines.map(([line, size]) => (
                        <span
                          key={line}
                          className="stop-text-line"
                          style={{ "--n": size } as CSSProperties}
                        >
                          {line}
                        </span>
                      ))}
                    </h2>
                    {!text.note && (
                      <>
                        <h3 className="stop-text-heading">{text.heading}</h3>
                        <p className="stop-text-body">{text.body}</p>
                      </>
                    )}
                  </div>
                </div>
                {text.note && (
                  <div
                    className="stop-text stop-text-note font-montserrat"
                    data-shown={restText === index}
                    aria-hidden={restText !== index}
                    style={
                      {
                        "--left": text.note.left,
                        "--top": text.note.top,
                        "--depth": NOTE_DEPTH,
                      } as CSSProperties
                    }
                  >
                    <div className="stop-text-inner">
                      <h3 className="stop-text-heading">{text.heading}</h3>
                      <p className="stop-text-body">{text.body}</p>
                    </div>
                  </div>
                )}
              </Fragment>
            ),
        )}

        {/* The bar, on black over the film, until all of the film has come (see
            globals.css). It is there in the server's page too, so the film is
            never seen half there. */}
        <div
          className="personalization-loading font-montserrat"
          data-phase={phase}
          aria-hidden={phase === "done"}
        >
          <div className="personalization-loading-box" role="status" aria-live="polite">
            <p className="personalization-loading-label">
              {phase === "failed" ? "The film did not load" : "Loading"}
            </p>
            <div
              className="personalization-loading-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <span style={{ transform: `scaleX(${percent / 100})` }} />
            </div>
            {phase === "failed" ? (
              <button
                type="button"
                style={BUTTON_EDGE}
                className="personalization-loading-retry"
                onClick={() => retryRef.current()}
              >
                Try again
              </button>
            ) : (
              <p className="personalization-loading-percent">{percent}%</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
