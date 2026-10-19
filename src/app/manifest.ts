import type { MetadataRoute } from "next";

export const PWA_VIEWPORT = { width: 360, height: 740 } as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saathi",
    short_name: "Saathi",
    description: "A morning call for Maa. Two lines for you on WhatsApp.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#F7F5F0",
    orientation: "portrait",
    icons: [
      { src: "/brand/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/splash-mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    screenshots: [
      { src: "/brand/screens/after-today-en.png", sizes: "390x844", type: "image/png", form_factor: "narrow" },
      { src: "/brand/screens/after-home-en.png", sizes: "390x844", type: "image/png", form_factor: "narrow" },
    ],
  };
}
