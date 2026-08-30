import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.judisshop.com.mx"),

  title: "Judi's Shop | Productos originales de Estados Unidos",

  description:
    "Tienda oficial Judi's Shop. Bolsas, perfumes, maquillaje, ropa, calzado y productos originales de Estados Unidos.",

  applicationName: "Judi's Shop",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "Judi's Shop",
    title: "Judi's Shop | Productos originales de Estados Unidos",
    description:
      "Tienda oficial Judi's Shop. Productos originales de Estados Unidos.",
  },

  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Judi's Shop",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
