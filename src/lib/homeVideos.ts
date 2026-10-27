// The videos the home page plays by the scroll (the Atelier cases, the Personalization case and
// the About bag). They are fetched whole, in the background, as soon as the home page
// opens, and kept: in the browser's Cache Storage (where there is one: https and localhost),
// and by the browser's own cache (the files are sent with a one-year cache header, see
// next.config.ts). The next visit finds them there and does not download them again.
//
// If a video file is changed, raise HOME_VIDEO_VERSION: the new files then have new
// addresses, so a visitor does not get the old ones from the cache.
export const HOME_VIDEO_VERSION = "5";

const withVersion = (path: string) => `${path}?v=${HOME_VIDEO_VERSION}`;

export const ATELIER_VIDEO = withVersion("/videos/atelier.mp4");
export const ATELIER_SILVER_VIDEO = withVersion("/videos/atelier-silver.mp4");
export const PERSONALIZED_VIDEO = withVersion("/videos/personalized.mp4");
// The Atelier case on a phone (a square video, 48 frames, the gold case): a phone plays this one
// where a tablet, a laptop and a desktop play ATELIER_VIDEO.
export const ATELIER_MOBILE_VIDEO = withVersion("/videos/atelier-mobile-v2.mp4");
// The About bag (it turns and settles facing the front, on white; every frame a key frame): the
// phone's is 1080 x 1794 (52 frames), the tablet's and larger 1280 x 960 (50 frames).
export const ABOUT_VIDEO = withVersion("/videos/about-v4.mp4");
export const ABOUT_MOBILE_VIDEO = withVersion("/videos/about-mobile-v3.mp4");

// The videos this window plays (a phone does not need the two Atelier cases of the larger
// screens, nor they the phone's): fetched in the background when the home page opens, and
// what the loading screen waits for. It is decided once, on the first call in the browser.
const PHONE_WINDOW = "(max-width: 743px), (max-height: 499px)";
let chosen: string[] | null = null;

function homeVideos(): string[] {
  if (chosen) return chosen;
  const list =
    typeof window !== "undefined" && window.matchMedia(PHONE_WINDOW).matches
      ? [ATELIER_MOBILE_VIDEO, PERSONALIZED_VIDEO, ABOUT_MOBILE_VIDEO]
      : [ATELIER_VIDEO, ATELIER_SILVER_VIDEO, PERSONALIZED_VIDEO, ABOUT_VIDEO];
  if (typeof window !== "undefined") chosen = list;
  return list;
}

// About how big each file is (bytes), for the loading bar when the server does not say.
const APPROX_BYTES: Record<string, number> = {
  [ATELIER_VIDEO]: 1_420_000,
  [ATELIER_SILVER_VIDEO]: 1_180_000,
  [PERSONALIZED_VIDEO]: 1_400_000,
  [ATELIER_MOBILE_VIDEO]: 1_270_000,
  [ABOUT_VIDEO]: 2_000_000,
  [ABOUT_MOBILE_VIDEO]: 1_790_000,
};

const CACHE_NAME = "home-videos";

type Entry = {
  // The address of the video in this page (a blob), or null if it could not be had (the
  // video is then given its normal address and loads by itself).
  promise: Promise<string | null>;
  loaded: number;
  total: number;
  settled: boolean;
};

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();

const changed = () => listeners.forEach((listener) => listener());

// A download that makes no progress for this long, or takes this long in all, is given up on:
// the video is then given its own address (the browser fetches it by itself) and the loading
// screen does not wait for it.
const IDLE_MS = 10_000;
const TOTAL_MS = 45_000;
// A file smaller than this is not a video (an error page, an empty answer).
const MIN_BYTES = 20_000;

async function fetchVideo(src: string, entry: Entry): Promise<string | null> {
  try {
    // Where there is no Cache Storage (an in-app browser, a private window) or it cannot be
    // opened, the video is simply fetched each time.
    let store: Cache | null = null;
    try {
      store = typeof caches !== "undefined" ? await caches.open(CACHE_NAME) : null;
    } catch {
      store = null;
    }

    const kept = store ? await store.match(src).catch(() => undefined) : undefined;
    if (kept && store) {
      const blob = await kept.blob();
      if (blob.size >= MIN_BYTES) {
        entry.loaded = entry.total = blob.size;
        return URL.createObjectURL(blob);
      }
      await store.delete(src).catch(() => false); // a broken copy: fetched again below
    }

    const controller = new AbortController();
    let idle = window.setTimeout(() => controller.abort(), IDLE_MS);
    const overall = window.setTimeout(() => controller.abort(), TOTAL_MS);
    try {
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok || !response.body) return null;
      const announced = Number(response.headers.get("content-length")) || 0;
      entry.total = announced || APPROX_BYTES[src] || 0;

      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as Uint8Array<ArrayBuffer>);
        entry.loaded += value.length;
        window.clearTimeout(idle);
        idle = window.setTimeout(() => controller.abort(), IDLE_MS);
        changed();
      }
      const blob = new Blob(chunks, { type: "video/mp4" });
      // Cut short (the connection dropped), or not a video: not used, and not kept.
      const encoded = response.headers.get("content-encoding");
      if (blob.size < MIN_BYTES || (announced && !encoded && blob.size < announced)) return null;
      entry.total = entry.loaded = blob.size;
      changed();

      if (store) {
        // Keep it for next time, and drop the same video of an older version.
        try {
          const path = src.split("?")[0];
          await store.put(src, new Response(blob, { headers: { "Content-Type": "video/mp4" } }));
          const old = (await store.keys()).filter(
            (request) =>
              request.url !== new URL(src, location.href).href && new URL(request.url).pathname === path,
          );
          await Promise.all(old.map((request) => store.delete(request)));
        } catch {
          // Storage full or not allowed: the video is still used, it is just not kept.
        }
      }
      return URL.createObjectURL(blob);
    } finally {
      window.clearTimeout(idle);
      window.clearTimeout(overall);
    }
  } catch {
    return null;
  }
}

// The video's address in this page (see `Entry`); the same promise for every caller, so a
// video asked for by the preload and by the section that plays it is fetched once.
export function loadVideo(src: string): Promise<string | null> {
  let entry = entries.get(src);
  if (!entry) {
    const created: Entry = { promise: Promise.resolve(null), loaded: 0, total: 0, settled: false };
    created.promise = fetchVideo(src, created).then((url) => {
      created.settled = true;
      changed();
      return url;
    });
    entries.set(src, created);
    entry = created;
  }
  return entry.promise;
}

// How far the preload of all the home videos has got, 0 to 1, and whether it is over (each
// video either loaded or given up on).
export type HomeVideoProgress = { fraction: number; ready: boolean };

let snapshot: HomeVideoProgress = { fraction: 0, ready: false };

function measure(): HomeVideoProgress {
  let loaded = 0;
  let total = 0;
  let settled = 0;
  const videos = homeVideos();
  for (const src of videos) {
    const entry = entries.get(src);
    if (!entry) continue;
    loaded += entry.loaded;
    total += entry.total;
    if (entry.settled) settled += 1;
  }
  const ready = forced || settled === videos.length;
  const fraction = ready ? 1 : total > 0 ? Math.min(0.99, loaded / total) : 0;
  return { fraction, ready };
}

// The loading screen holds the page still only this long: a slow connection must not keep a
// visitor from the page (the sections whose video is not here yet show their pictures, see
// ScrollVideo, and the video takes over when it comes).
const MAX_HOLD_MS = 12_000;
let forced = false;
let holdTimer: number | undefined;

export function getProgress(): HomeVideoProgress {
  const next = measure();
  if (next.fraction !== snapshot.fraction || next.ready !== snapshot.ready) snapshot = next;
  return snapshot;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function preloadHomeVideos() {
  homeVideos().forEach((src) => {
    void loadVideo(src);
  });
  if (holdTimer === undefined) {
    holdTimer = window.setTimeout(() => {
      forced = true;
      changed();
    }, MAX_HOLD_MS);
  }
}

// The folder of the pictures that stand in for a video that cannot play (see ScrollVideo): one
// WebP of every frame the page uses, f000.webp and so on, the same frames as the video.
export function frameUrl(folder: string, index: number) {
  return `/videos/home-frames/${folder}/f${String(index).padStart(3, "0")}.webp?v=${HOME_VIDEO_VERSION}`;
}
