import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1"],
  // Desk pages use PGlite + Date.now() per request. Cache Components prerendered
  // a static error shell on Vercel (x-nextjs-prerender + digest) for /d/* and /demo.
  cacheComponents: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@electric-sql/pglite/**/*"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 750, 828],
    imageSizes: [44, 72, 96, 128, 256],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
