import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev: éviter le double-mount (React StrictMode) qui peut déclencher
  // "Map container is already initialized" côté Leaflet.
  reactStrictMode: false,
};

export default nextConfig;
