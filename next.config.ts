import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Desk pages use PGlite + Date.now() per request. Cache Components prerendered
  // a static error shell on Vercel (x-nextjs-prerender + digest) for /d/* and /demo.
  cacheComponents: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "*": ["./node_modules/@electric-sql/pglite/**/*", "./src/lib/db/migrations/**/*"],
    "/*": ["./node_modules/@electric-sql/pglite/**/*", "./src/lib/db/migrations/**/*"],
    "/api/*": ["./node_modules/@electric-sql/pglite/**/*", "./src/lib/db/migrations/**/*"],
    "/d/*": ["./node_modules/@electric-sql/pglite/**/*", "./src/lib/db/migrations/**/*"],
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
