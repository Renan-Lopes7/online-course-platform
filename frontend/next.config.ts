import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep dev artifacts separate so running a production build does not break next dev.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  devIndicators: false,
};

export default nextConfig;
