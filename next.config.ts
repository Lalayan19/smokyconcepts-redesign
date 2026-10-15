import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Dev only: the devices on the local network, and Cloudflare quick tunnels
  // (their address changes every time, hence the wildcard). Without them the dev
  // server blocks the page's scripts from those addresses and the page never
  // comes alive (the sliders stay as the server drew them).
  allowedDevOrigins: [
    "192.168.10.19",
    "192.168.11.176",
    "192.168.20.156",
    // Any other address on a home or office network (the PC's address changes
    // with the Wi-Fi it is on), and a phone's hotspot.
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.trycloudflare.com",
  ],
  // The film of the Personalization page (the video, and the pictures a phone
  // draws): the browser keeps it for a year and does not ask the server whether it
  // has changed (the default, `max-age=0`, made every visit ask once for each of
  // the 200 pictures). If a file is changed, raise FILM_VERSION in
  // PersonalizationScrollVideo.tsx, so the new file has a new address.
  async headers() {
    const keepForAYear = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/videos/personalization-scrub.mp4", headers: keepForAYear },
      // The three videos of the home page (see src/lib/homeVideos.ts, which has the version
      // that is in their addresses).
      { source: "/videos/atelier.mp4", headers: keepForAYear },
      { source: "/videos/atelier-silver.mp4", headers: keepForAYear },
      { source: "/videos/personalized.mp4", headers: keepForAYear },
      { source: "/videos/personalization-mobile-frames/:file", headers: keepForAYear },
    ];
  },
};

export default nextConfig;
