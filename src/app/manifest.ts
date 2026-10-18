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
    background_color: "#fbf7f2",
    theme_color: "#fbf7f2",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
