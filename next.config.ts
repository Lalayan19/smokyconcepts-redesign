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
};

export default nextConfig;
