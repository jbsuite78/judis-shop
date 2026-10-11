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
        src: "/judis-halloween-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/judis-halloween-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}