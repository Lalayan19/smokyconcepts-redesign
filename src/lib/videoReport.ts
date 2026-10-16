// What the home page's videos are doing, for finding out why one does not play on a visitor's
// device (a tester's phone, an in-app browser, a power-saving mode):
//  - `window.__videoStates` has one line per video, shown by `?videodebug=1` (see VideoDebug);
//  - `reportVideo` sends one short note to the server (`/api/video-report`, which only writes it
//    to the server's log) when a video does not start or has to be replaced by its pictures.
//    It holds the browser's name, the window's size and what the video said, and nothing
//    about the visitor.

type States = Record<string, string>;

declare global {
  interface Window {
    __videoStates?: States;
  }
}

export function setVideoState(name: string, text: string) {
  if (typeof window === "undefined") return;
  (window.__videoStates ??= {})[name] = text;
}

const sent = new Set<string>();

type Connection = { effectiveType?: string; saveData?: boolean };

export function describeVideo(video: HTMLVideoElement | null) {
  if (!video) return "no element";
  const src = video.getAttribute("src") ?? "";
  return [
    `ready=${video.readyState}`,
    `net=${video.networkState}`,
    `err=${video.error ? video.error.code : "-"}`,
    `paused=${video.paused}`,
    `seeking=${video.seeking}`,
    `src=${src.startsWith("blob:") ? "blob" : src ? "url" : "none"}`,
  ].join(" ");
}

export function reportVideo(name: string, event: string, video: HTMLVideoElement | null = null) {
  if (typeof window === "undefined") return;
  const key = `${name}:${event}`;
  if (sent.has(key) || sent.size > 12) return;
  sent.add(key);
  setVideoState(name, `${event} (${describeVideo(video)})`);
  try {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const note = {
      name,
      event,
      video: describeVideo(video),
      page: location.pathname,
      ua: navigator.userAgent,
      window: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
      hover: window.matchMedia("(hover: none)").matches ? "none" : "hover",
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      cacheStorage: typeof caches !== "undefined",
      saveData: connection?.saveData ?? null,
      connection: connection?.effectiveType ?? null,
      standalone: window.matchMedia("(display-mode: standalone)").matches,
    };
    const body = JSON.stringify(note);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/video-report", new Blob([body], { type: "text/plain" }));
    } else {
      void fetch("/api/video-report", { method: "POST", body, keepalive: true });
    }
  } catch {
    // Reporting is never allowed to get in the way.
  }
}
