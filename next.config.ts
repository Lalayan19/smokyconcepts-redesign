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
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
