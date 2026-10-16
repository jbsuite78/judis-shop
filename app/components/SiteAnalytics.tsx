"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Solo mide páginas públicas de Judi's Shop.
 * Las rutas privadas y sus posibles parámetros nunca se envían a Analytics.
 */
export default function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        try {
          const url = new URL(event.url);
          if (
            url.pathname.startsWith("/admin") ||
            url.pathname.startsWith("/acceso") ||
            url.pathname.startsWith("/api/")
          ) {
            return null;
          }
          // Omitimos los parámetros de búsqueda para no enviar
          // búsquedas, referencias o datos posiblemente personales.
          url.search = "";
          url.hash = "";
          return { ...event, url: url.toString() };
        } catch {
          return null;
        }
      }}
    />
  );
}
