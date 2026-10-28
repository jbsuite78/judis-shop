import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Judi's Shop",
    short_name: "Judi's",
    description: "Compra tus productos favoritos en Judi's Shop",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ec4899",
    orientation: "portrait",
    icons: [
      {
        src: "/js-logo-3d.svg?v=1",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png?v=js3d2",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png?v=js3d2",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}