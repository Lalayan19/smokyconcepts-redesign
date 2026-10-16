import { describeVideo, reportVideo, setVideoState } from "@/lib/videoReport";

// A muted video that loops by itself (the Unlock section's) is started and kept going, whatever
// stops it:
//  - it is started again when it has data to play, when it stops by itself (some browsers
//    pause a video that is off the screen, or when the tab was in the background), when the tab
//    or the page (the back button) comes back, when it comes into view;
//  - and at the first touch, key or scroll of the visitor (a browser in a power-saving mode that
//    will not start a video by itself starts it then).
// It stops asking when it is paused again and again, in a row (a browser that does not want it
// to play must not be fought with), and if it has not played 4 seconds after it was asked to, a
// note goes to the server (see videoReport.ts). Until it plays, its `poster` (the first picture)
// is what is shown. Returns what stops all this.
const NOT_PLAYING_MS = 4000;
// With `fallbackImage` (an animated picture of the same video): if the video is not playing this
// long after it was asked to, the picture is shown in its place (a browser plays an animated
// picture whatever its rules for video: an iPhone in Low Power Mode, with its video previews off,
// loads no video until it is tapped). If the video starts later (at a tap), the video takes over
// again.
const SHOW_IMAGE_MS = 2500;

export function keepPlaying(
  video: HTMLVideoElement,
  name: string,
  fallbackImage?: string,
): () => void {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.playsInline = true;

  let stopped = false;
  let pausedInARow = 0;
  let lastPause = 0;
  let visible = true;

  const play = () => {
    if (stopped || document.hidden || !video.getAttribute("src")) return;
    const started = video.play();
    if (started) started.catch(() => undefined);
  };

  const onPause = () => {
    if (stopped || video.ended || document.hidden || !visible) return;
    const now = Date.now();
    pausedInARow = now - lastPause < 1500 ? pausedInARow + 1 : 1;
    lastPause = now;
    if (pausedInARow <= 4) play();
  };
  const onGesture = () => {
    pausedInARow = 0;
    if (video.paused) play();
  };
  const onVisible = () => {
    if (!document.hidden) play();
  };
  // A failed file is asked for once more.
  let reloaded = false;
  const onError = () => {
    if (reloaded || !video.getAttribute("src")) return;
    reloaded = true;
    video.load();
    play();
  };

  const watcher =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible && video.paused) play();
        })
      : null;
  watcher?.observe(video);

  video.addEventListener("canplay", play);
  video.addEventListener("loadeddata", play);
  video.addEventListener("pause", onPause);
  video.addEventListener("error", onError);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pageshow", onVisible);
  // (touchend, pointerup and click are the ones an iPhone counts as a tap that may start a video.)
  const gestures = ["touchstart", "touchend", "pointerdown", "pointerup", "click", "keydown", "scroll", "wheel"] as const;
  gestures.forEach((type) => window.addEventListener(type, onGesture, { passive: true }));

  // The animated picture standing in for a video that is not playing.
  let picture: HTMLImageElement | null = null;
  const showPicture = () => {
    if (stopped || picture || !fallbackImage) return;
    if (!(video.paused || video.readyState < 2 || video.currentTime === 0)) return;
    picture = document.createElement("img");
    picture.alt = "";
    picture.setAttribute("aria-hidden", "true");
    picture.className = video.className;
    picture.setAttribute("style", video.getAttribute("style") ?? "");
    picture.src = fallbackImage;
    video.parentNode?.insertBefore(picture, video.nextSibling);
    video.style.display = "none";
    reportVideo(name, "animated-picture", video);
  };
  const hidePicture = () => {
    if (!picture) return;
    picture.remove();
    picture = null;
    video.style.display = "";
  };
  // Playing for real (a tap started it): the video takes over from the picture.
  const onPlaying = () => {
    if (video.currentTime > 0) hidePicture();
  };
  video.addEventListener("playing", onPlaying);
  const showWatch = window.setTimeout(showPicture, SHOW_IMAGE_MS);

  const check = window.setTimeout(() => {
    if (stopped) return;
    if (video.paused || video.readyState < 2 || video.currentTime === 0) {
      reportVideo(name, "not-playing", video);
    }
  }, NOT_PLAYING_MS);
  const heartbeat = window.setInterval(() => {
    setVideoState(name, `${video.paused ? "paused" : "playing"} t=${video.currentTime.toFixed(1)} (${describeVideo(video)})`);
    if (!stopped && video.paused && !document.hidden && visible && video.readyState >= 2 && pausedInARow <= 4) play();
    if (picture && !video.paused && video.currentTime > 0.3) hidePicture();
  }, 1000);

  play();

  return () => {
    stopped = true;
    window.clearTimeout(check);
    window.clearTimeout(showWatch);
    video.removeEventListener("playing", onPlaying);
    hidePicture();
    window.clearInterval(heartbeat);
    watcher?.disconnect();
    video.removeEventListener("canplay", play);
    video.removeEventListener("loadeddata", play);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("error", onError);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("pageshow", onVisible);
    gestures.forEach((type) => window.removeEventListener(type, onGesture));
  };
}
