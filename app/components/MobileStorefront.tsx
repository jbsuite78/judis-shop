"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileNav from "./MobileNav";

type Producto = {
  id?: number;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  precio: number;
  existencia?: number;
  imagen?: string | null;
};

const categorias = [
  ["Bolsas y Carteras", "👜", "Bolsas"],
  ["Perfumes", "🌸", "Perfumes"],
  ["Calzado", "👟", "Calzado"],
  ["Belleza", "💄", "Belleza"],
  ["Ropa", "👗", "Ropa"],
  ["Hogar", "🏠", "Hogar"],
  ["Juguetes", "🧸", "Juguetes"],
  ["Deportes", "🏀", "Deportes"],
  ["Artículos de Temporada", "🎁", "Temporada"],
] as const;

function contarCarrito() {
  try {
    const contenido: unknown = JSON.parse(localStorage.getItem("carritoJudi") || "[]");
    if (!Array.isArray(contenido)) return 0;
    return contenido.reduce((suma: number, item: { cantidad?: number }) => suma + (Number(item.cantidad) || 1), 0);
  } catch {
    return 0;
  }
}

export default function MobileStorefront() {
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  useEffect(() => {
    setCantidadCarrito(contarCarrito());
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const controller = new AbortController();
    fetch("/api/productos", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el catálogo");
        return res.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error("Datos inválidos");
        const lista = data as Producto[];
        const disponibles = lista.filter((p) => (p.existencia ?? 0) > 0);
        setProductos((disponibles.length ? disponibles : lista).slice(0, 12));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setErrorCarga(true);
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  function agregar(producto: Producto) {
    if (producto.id == null || (producto.existencia ?? 0) < 1) return;
    try {
      const guardado: unknown = JSON.parse(localStorage.getItem("carritoJudi") || "[]");
      const carrito = Array.isArray(guardado) ? guardado : [];
      const existente = carrito.find((item: { id?: number }) => item.id === producto.id);
      if (existente && (Number(existente.cantidad) || 1) >= (producto.existencia ?? 0)) {
        alert("Ya agregaste todas las piezas disponibles de este producto.");
        return;
      }
      const siguiente = existente
        ? carrito.map((item: { id?: number; cantidad?: number }) => item.id === producto.id
            ? { ...item, cantidad: (Number(item.cantidad) || 1) + 1 } : item)
        : [...carrito, { id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen ?? "", cantidad: 1 }];
      localStorage.setItem("carritoJudi", JSON.stringify(siguiente));
      setCantidadCarrito(contarCarrito());
      window.location.assign("/carrito");
    } catch {
      alert("No se pudo agregar al carrito. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-[#fff9fc] pb-28 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/judis-logo.jpeg" alt="Logotipo Judi's Shop" className="h-12 w-12 shrink-0 rounded-full border-2 border-pink-200 object-cover" />
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-[#c21871]">Judi&apos;s Shop</p>
              <p className="truncate text-[11px] font-medium text-slate-500">Tus marcas favoritas de USA 🇺🇸</p>
            </div>
          </Link>
          <Link href="/carrito" aria-label="Ver carrito" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-2xl">
            🛒
            {cantidadCarrito > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-black text-white">{cantidadCarrito}</span>}
          </Link>
        </div>
        <form role="search" onSubmit={(e) => {
          e.preventDefault();
          window.location.assign("/catalogo?buscar=" + encodeURIComponent(busqueda.trim()));
        }} className="mx-auto mt-3 flex max-w-lg items-center gap-2 rounded-2xl border border-pink-100 bg-[#fff7fb] px-3 py-2 shadow-inner">
          <span aria-hidden="true" className="text-xl text-pink-500">⌕</span>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar productos" placeholder="Buscar bolsas, perfumes, tenis..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          <button type="submit" className="rounded-xl bg-pink-600 px-3 py-2 text-xs font-bold text-white">Buscar</button>
        </form>
      </header>

      <main className="mx-auto max-w-lg px-4">
        <section aria-label="Bienvenida a Judi's Shop" className="relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#e42e91] via-[#b425b3] to-[#5034ad] px-5 py-6 text-white shadow-[0_12px_26px_rgba(181,37,147,0.2)]">
          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-12 h-28 w-28 rounded-full bg-white/10" />
          <span className="relative inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide">Shopping en Estados Unidos 🇺🇸</span>
          <h1 className="relative mt-3 max-w-[250px] text-[29px] font-black leading-[1.1]">Lo que te encanta, más cerca de ti 💖</h1>
          <p className="relative mt-2 max-w-[245px] text-[13px] leading-5 text-pink-50">Productos originales, novedades y entrega en Monterrey.</p>
          <Link href="/catalogo" className="relative mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-pink-700 shadow-md">Comprar ahora →</Link>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-4 rotate-12 text-[70px] drop-shadow-md">🛍️</div>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-pink-100 bg-white px-2 py-3 text-center text-[11px] font-extrabold text-pink-800 shadow-sm">✨ 100% originales</div>
          <div className="rounded-2xl border border-pink-100 bg-white px-2 py-3 text-center text-[11px] font-extrabold text-pink-800 shadow-sm">🚚 Entrega a domicilio</div>
        </div>

        <section id="categorias-movil" className="scroll-mt-36 pt-6">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600">Explora Judi&apos;s</p><h2 className="mt-1 text-xl font-black">Categorías</h2></div>
            <Link href="/catalogo" className="text-xs font-extrabold text-pink-600">Ver todas →</Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {categorias.map(([nombre, icono, texto]) => (
              <Link key={nombre} href={"/catalogo?categoria=" + encodeURIComponent(nombre)} className="flex w-[72px] shrink-0 snap-start flex-col items-center gap-2 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-pink-100 bg-white text-3xl shadow-sm">{icono}</span>
                <span className="text-[10px] font-bold leading-[13px] text-slate-700">{texto}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="pt-5">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600">Descubre tu favorito</p><h2 className="mt-1 text-xl font-black">Recién llegados</h2></div>
            <Link href="/catalogo" className="text-xs font-extrabold text-pink-600">Ver catálogo →</Link>
          </div>
          {cargando && <p role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Cargando novedades...</p>}
          {errorCarga && <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600">No pudimos cargar las novedades ahora. <Link href="/catalogo" className="font-bold text-pink-600 underline">Abrir catálogo</Link></div>}
          {!cargando && !errorCarga && productos.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600">Pronto habrá novedades. <Link href="/catalogo" className="font-bold text-pink-600 underline">Consultar catálogo</Link></p>}
          <div className="grid grid-cols-2 gap-3">
            {productos.map((producto) => (
              <article key={producto.id ?? producto.nombre} className="flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-pink-100 bg-white shadow-sm">
                <Link href={producto.id != null ? "/producto/" + producto.id : "/catalogo"} className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-[#fff3f8] to-[#f8f0ff]">
                  {producto.imagen ? <img src={producto.imagen} alt={producto.nombre} loading="lazy" className="h-full w-full object-contain p-2" /> : <span role="img" aria-label="Producto sin fotografía" className="text-5xl">🛍️</span>}
                  {producto.existencia === 1 && <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">Última pieza</span>}
                </Link>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                  <p className="truncate text-[10px] font-black uppercase tracking-wide text-pink-600">{producto.marca && producto.marca !== "Sin marca" ? producto.marca : producto.categoria || "Judi's Shop"}</p>
                  <Link href={producto.id != null ? "/producto/" + producto.id : "/catalogo"} className="mt-1 line-clamp-2 min-h-9 text-[13px] font-extrabold leading-[18px]">{producto.nombre}</Link>
                  <p className="mt-2 text-lg font-black text-[#c21871]">{"$" + Number(producto.precio).toLocaleString("es-MX")}</p>
                  <button type="button" onClick={() => agregar(producto)} disabled={producto.id == null || (producto.existencia ?? 0) < 1}
                    className="mt-2.5 w-full rounded-xl bg-pink-600 px-2 py-2.5 text-xs font-extrabold text-white active:scale-[0.98] disabled:bg-slate-400">
                    {(producto.existencia ?? 0) > 0 ? "🛒 Agregar" : "Agotado"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!cargando && productos.length > 0 && <Link href="/catalogo" className="mt-5 block rounded-2xl border-2 border-pink-200 bg-white px-5 py-4 text-center text-sm font-black text-pink-700">Ver todos los productos →</Link>}
        </section>

        <section className="mt-7 rounded-[24px] bg-[#24103d] px-5 py-6 text-center text-white">
          <p className="text-2xl">💬</p><h2 className="mt-2 text-lg font-black">¿Buscas algo especial?</h2>
          <p className="mt-2 text-xs leading-5 text-purple-100">Mándanos una foto o tu lista y te ayudamos a encontrarlo en USA.</p>
          <a href="https://wa.me/528181697776" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-xl bg-[#25d366] px-5 py-3 text-xs font-black text-white">Pedir por WhatsApp</a>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
