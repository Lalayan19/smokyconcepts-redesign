"use client";

import { useEffect, useState } from "react";

// Only with `?videodebug=1` in the address (for a tester whose animations do not play: open
// the page with it and send a screenshot): a small box with one line for every video of the
// page and what it is doing (see src/lib/videoReport.ts). Nothing is shown without it.
export default function VideoDebug() {
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("videodebug")) return;
    const read = () => {
      const states = window.__videoStates ?? {};
      const info = [
        `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
        `cache ${typeof caches !== "undefined" ? "yes" : "no"}`,
        `hover ${window.matchMedia("(hover: none)").matches ? "none" : "yes"}`,
        `reduce ${window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "yes" : "no"}`,
      ].join(" | ");
      setLines([info, ...Object.entries(states).map(([name, text]) => `${name}: ${text}`)]);
    };
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);

  if (!lines) return null;
  return (
    <pre
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 left-0 z-[2147483600] m-0 max-w-full overflow-hidden bg-black/85 p-2 text-[10px] leading-snug whitespace-pre-wrap text-[#9fe870]"
    >
      {lines.join("\n")}
    </pre>
  );
}
