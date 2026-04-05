import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  onDemandEntries: {
    // Increase the period, in ms, before inactive pages are discarded from the build
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously in memory
    pagesBufferLength: 5,
  },
};

export default nextConfig;
