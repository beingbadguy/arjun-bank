import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
