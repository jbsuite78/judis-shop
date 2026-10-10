"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const enlaces = [
  { nombre: "Bolsas y carteras", categoria: "Bolsas y Carteras" },
  { nombre: "Perfumes", categoria: "Perfumes" },
  { nombre: "Calzado", categoria: "Calzado" },
  { nombre: "Belleza", categoria: "Belleza" },
  { nombre: "Ropa", categoria: "Ropa" },
  { nombre: "Hogar", categoria: "Hogar" },
  { nombre: "Juguetes", categoria: "Juguetes" },
  { nombre: "Deportes", categoria: "Deportes" },
];

function cantidadEnCarrito(): number {
  try {
    const items: unknown = JSON.parse(localStorage.getItem("carritoJudi") || "[]");
    return Array.isArray(items)
      ? items.reduce((total: number, item: { cantidad?: number }) => total + (Number(item.cantidad) || 1), 0)
      : 0;
  } catch {
    return 0;
  }
}

export default function DesktopHeader() {
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    const refrescar = () => setCantidad(cantidadEnCarrito());
    refrescar();
    window.addEventListener("storage", refrescar);
    window.addEventListener("focus", refrescar);
    window.addEventListener("judis-carrito-actualizado", refrescar);
    return () => {
      window.removeEventListener("storage", refrescar);
      window.removeEventListener("focus", refrescar);
      window.removeEventListener("judis-carrito-actualizado", refrescar);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[#f2e2eb] bg-white/95 shadow-[0_4px_22px_rgba(60,22,46,0.06)] backdrop-blur-lg md:block">
      <div className="bg-[#781149] text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-2 text-[11px] font-semibold tracking-wide xl:px-10">
          <span>🇺🇸 Tus marcas favoritas de Estados Unidos, más cerca de ti</span>
          <span className="hidden lg:inline">📍 Entregas en Monterrey y su área metropolitana</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center gap-5 px-6 py-4 xl:gap-8 xl:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Judi's Shop - inicio">
          <img src="/judis-logo.jpeg" alt="" className="h-[62px] w-[62px] rounded-full border-2 border-pink-100 object-cover shadow-sm" />
          <div className="leading-tight">
            <span className="block text-2xl font-black tracking-[-0.045em] text-[#ae155e] xl:text-[28px]">Judi&apos;s Shop</span>
            <span className="block text-[11px] font-semibold tracking-wide text-slate-500">SHOPPING &amp; ORIGINALS</span>
          </div>
        </Link>

        <form action="/catalogo" method="get" role="search" className="flex min-w-0 flex-1 items-center overflow-hidden rounded-2xl border-2 border-[#f2d6e6] bg-[#fdf7fb] transition focus-within:border-[#c32177] focus-within:bg-white">
          <span aria-hidden="true" className="pl-5 text-2xl text-[#ba2674]">⌕</span>
          <input
            name="buscar"
            type="search"
            aria-label="Buscar en Judi's Shop"
            placeholder="¿Qué estás buscando? Bolsas, perfumes, tenis y más..."
            className="h-[52px] w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button type="submit" className="mr-1.5 rounded-xl bg-[#b7146c] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#890d4e]">Buscar</button>
        </form>

        <a href="https://wa.me/528181697776" target="_blank" rel="noopener noreferrer" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-slate-700 transition hover:text-[#ae155e] lg:flex">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eafaf1] text-xl">💬</span>
          <span className="hidden xl:block">WhatsApp</span>
        </a>
        <Link href="/carrito" className="flex shrink-0 items-center gap-2 rounded-2xl border border-pink-100 bg-[#fff5fa] px-3 py-2.5 font-black text-[#981355] transition hover:bg-pink-100" aria-label={"Ver carrito de compras, " + cantidad + " productos"}>
          <span aria-hidden="true" className="text-2xl">🛒</span>
          <span className="hidden lg:inline">Mi carrito</span>
          <span className="flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[#b7146c] px-1.5 text-xs font-black text-white">{cantidad}</span>
        </Link>
      </div>

      <nav aria-label="Categorías principales" className="border-t border-[#f6edf2]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 overflow-x-auto px-6 py-3 [scrollbar-width:none] xl:gap-8 xl:px-10">
          <Link href="/catalogo" className="shrink-0 text-[13px] font-black text-[#b7146c] hover:underline">☰ Todo el catálogo</Link>
          {enlaces.map((enlace) => (
            <Link
              href={"/catalogo?categoria=" + encodeURIComponent(enlace.categoria)}
              key={enlace.categoria}
              className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-slate-650 transition hover:text-[#b7146c]"
            >
              {enlace.nombre}
            </Link>
          ))}
          <Link href="/#categorias" className="shrink-0 text-[13px] font-semibold text-slate-650 hover:text-[#b7146c]">Más categorías</Link>
        </div>
      </nav>
    </header>
  );
}
