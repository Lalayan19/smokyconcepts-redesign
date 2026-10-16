// The three videos the home page plays by the scroll (the two Atelier cases and the
// Personalization case). They are fetched whole, in the background, as soon as the home page
// opens, and kept: in the browser's Cache Storage (where there is one: https and localhost),
// and by the browser's own cache (the files are sent with a one-year cache header, see
// next.config.ts). The next visit finds them there and does not download them again.
//
// If a video file is changed, raise HOME_VIDEO_VERSION: the new files then have new
// addresses, so a visitor does not get the old ones from the cache.
export const HOME_VIDEO_VERSION = "3";

const withVersion = (path: string) => `${path}?v=${HOME_VIDEO_VERSION}`;

export const ATELIER_VIDEO = withVersion("/videos/atelier.mp4");
export const ATELIER_SILVER_VIDEO = withVersion("/videos/atelier-silver.mp4");
export const PERSONALIZED_VIDEO = withVersion("/videos/personalized.mp4");
// The Atelier case on a phone (a square video, 24 frames, the gold case): a phone plays this one
// where a tablet, a laptop and a desktop play ATELIER_VIDEO.
export const ATELIER_MOBILE_VIDEO = withVersion("/videos/atelier-mobile.mp4");

// The videos this window plays (a phone does not need the two Atelier cases of the larger
// screens, nor they the phone's): fetched in the background when the home page opens, and
// what the loading screen waits for. It is decided once, on the first call in the browser.
const PHONE_WINDOW = "(max-width: 743px), (max-height: 499px)";
let chosen: string[] | null = null;

function homeVideos(): string[] {
  if (chosen) return chosen;
  const list =
    typeof window !== "undefined" && window.matchMedia(PHONE_WINDOW).matches
      ? [ATELIER_MOBILE_VIDEO, PERSONALIZED_VIDEO]
      : [ATELIER_VIDEO, ATELIER_SILVER_VIDEO, PERSONALIZED_VIDEO];
  if (typeof window !== "undefined") chosen = list;
  return list;
}

// About how big each file is (bytes), for the loading bar when the server does not say.
const APPROX_BYTES: Record<string, number> = {
  [ATELIER_VIDEO]: 1_420_000,
  [ATELIER_SILVER_VIDEO]: 1_180_000,
  [PERSONALIZED_VIDEO]: 1_400_000,
  [ATELIER_MOBILE_VIDEO]: 880_000,
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

async function fetchVideo(src: string, entry: Entry): Promise<string | null> {
  try {
    const store = typeof caches !== "undefined" ? await caches.open(CACHE_NAME) : null;

    const kept = store ? await store.match(src) : undefined;
    if (kept) {
      const blob = await kept.blob();
      entry.loaded = entry.total = blob.size;
      return URL.createObjectURL(blob);
    }

    const response = await fetch(src);
    if (!response.ok || !response.body) return null;
    entry.total = Number(response.headers.get("content-length")) || APPROX_BYTES[src] || 0;

    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as Uint8Array<ArrayBuffer>);
      entry.loaded += value.length;
      changed();
    }
    const blob = new Blob(chunks, { type: "video/mp4" });
    entry.total = entry.loaded = blob.size;
    changed();

    if (store) {
      // Keep it for next time, and drop the same video of an older version.
      const path = src.split("?")[0];
      await store.put(src, new Response(blob, { headers: { "Content-Type": "video/mp4" } }));
      const old = (await store.keys()).filter(
        (request) => request.url !== new URL(src, location.href).href && new URL(request.url).pathname === path,
      );
      await Promise.all(old.map((request) => store.delete(request)));
    }
    return URL.createObjectURL(blob);
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
  const ready = settled === videos.length;
  const fraction = ready ? 1 : total > 0 ? Math.min(0.99, loaded / total) : 0;
  return { fraction, ready };
}

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
}
