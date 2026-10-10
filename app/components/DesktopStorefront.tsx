"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DesktopHeader from "./DesktopHeader";

type Producto = {
  id?: number;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  precio: number;
  existencia?: number;
  imagen?: string | null;
};

const departamentos = [
  { titulo: "Bolsas y Carteras", breve: "Bolsas y carteras", icono: "👜", tono: "from-[#ffe4f1] to-[#fff3f9]" },
  { titulo: "Perfumes", breve: "Perfumes", icono: "🌸", tono: "from-[#fce5ff] to-[#fdf5ff]" },
  { titulo: "Calzado", breve: "Calzado", icono: "👟", tono: "from-[#e6eafa] to-[#f3f6ff]" },
  { titulo: "Belleza", breve: "Belleza", icono: "💄", tono: "from-[#ffe4ed] to-[#fff3f7]" },
  { titulo: "Ropa", breve: "Moda", icono: "👗", tono: "from-[#fcebdc] to-[#fff7ef]" },
  { titulo: "Artículos para Caballero", breve: "Caballero", icono: "⌚", tono: "from-[#e2f2f3] to-[#f4fcfc]" },
  { titulo: "Joyería, Bisutería y Relojes", breve: "Accesorios", icono: "💎", tono: "from-[#e7e7ff] to-[#f5f4ff]" },
  { titulo: "Hogar", breve: "Hogar", icono: "🏠", tono: "from-[#e8f5e5] to-[#f6fff3]" },
  { titulo: "Juguetes", breve: "Juguetes", icono: "🧸", tono: "from-[#fff0d9] to-[#fff9f1]" },
  { titulo: "Artículos de Temporada", breve: "Temporada", icono: "🎁", tono: "from-[#f8e2ef] to-[#fff5fa]" },
];

export default function DesktopStorefront() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [recienAgregado, setRecienAgregado] = useState<number | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const controlador = new AbortController();

    fetch("/api/productos", { signal: controlador.signal })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudieron obtener los productos");
        return respuesta.json();
      })
      .then((datos: unknown) => {
        if (!Array.isArray(datos)) throw new Error("Datos no válidos");
        const lista = (datos as Producto[]).filter((producto) => (producto.existencia ?? 0) > 0);
        setProductos(lista.slice(0, 10));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setErrorCarga(true);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return () => controlador.abort();
  }, []);

  function agregarAlCarrito(producto: Producto) {
    if (producto.id == null || (producto.existencia ?? 0) < 1) return;

    try {
      const guardado: unknown = JSON.parse(localStorage.getItem("carritoJudi") || "[]");
      const carrito = Array.isArray(guardado) ? guardado : [];
      const existente = carrito.find((item: { id?: number }) => item.id === producto.id);

      if (existente && (Number(existente.cantidad) || 1) >= (producto.existencia ?? 0)) {
        window.alert("Ya agregaste todas las piezas disponibles de este producto.");
        return;
      }

      const carritoNuevo = existente
        ? carrito.map((item: { id?: number; cantidad?: number }) =>
            item.id === producto.id
              ? { ...item, cantidad: (Number(item.cantidad) || 1) + 1 }
              : item)
        : [...carrito, {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen ?? "",
            cantidad: 1,
          }];

      localStorage.setItem("carritoJudi", JSON.stringify(carritoNuevo));
      window.dispatchEvent(new Event("judis-carrito-actualizado"));
      setRecienAgregado(producto.id);
    } catch {
      window.alert("No pudimos agregar este producto. Intenta nuevamente.");
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfafd] text-[#2d2230]">
      <DesktopHeader />

      <main className="mx-auto max-w-[1400px] px-6 pb-20 xl:px-10">
        <section aria-label="Destacados de Judi's Shop" className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="relative min-h-[360px] overflow-hidden rounded-[27px] bg-gradient-to-br from-[#f7e1ee] via-[#fcecf6] to-[#eae0ff] shadow-[0_14px_38px_rgba(91,28,70,0.09)] lg:col-span-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[42px] border-white/25" />
            <div className="pointer-events-none absolute -bottom-28 right-28 h-48 w-48 rounded-full bg-white/20" />
            <div className="relative grid h-full min-h-[360px] grid-cols-[1.1fr_0.9fr] items-center gap-3 px-8 py-8 xl:px-11">
              <div className="z-10">
                <div className="inline-flex items-center rounded-full border border-[#e9b7d4] bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#ae155e]">
                  🛍️ Bienvenidos a Judi&apos;s Shop
                </div>
                <h1 className="mt-5 max-w-[440px] text-[34px] font-black leading-[1.1] tracking-[-0.045em] text-[#41132f] xl:text-[46px]">
                  Tus marcas favoritas, más cerca de ti.
                </h1>
                <p className="mt-4 max-w-[360px] text-sm font-medium leading-7 text-[#6f5063] xl:text-base">
                  Bolsas, perfumes, ropa, calzado y mucho más. Productos originales seleccionados en Estados Unidos.
                </p>
                <Link href="/catalogo" className="mt-6 inline-flex items-center gap-3 rounded-[14px] bg-[#b7146c] px-6 py-3.5 text-sm font-black text-white shadow-[0_7px_20px_rgba(183,20,108,0.2)] transition hover:-translate-y-0.5 hover:bg-[#8d0f50]">
                  Explorar productos <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="relative flex min-w-0 items-center justify-center">
                <div className="absolute h-[260px] w-[260px] rounded-full bg-gradient-to-br from-white/90 to-[#eec7e1]/65 blur-[1px] xl:h-[300px] xl:w-[300px]" />
                <img
                  src="/marcas-judis.jpeg"
                  alt="Selección de marcas de Judi's Shop"
                  className="relative z-10 max-h-[272px] w-full max-w-[340px] rounded-[22px] border-[7px] border-white/80 bg-white object-contain shadow-[0_22px_48px_rgba(108,30,75,0.16)] [transform:rotate(3deg)]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <div className="relative flex min-h-[166px] flex-col justify-center overflow-hidden rounded-[25px] bg-[#661343] px-7 py-6 text-white shadow-[0_12px_28px_rgba(78,16,51,0.12)]">
              <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full border-[28px] border-white/10" />
              <p className="relative text-[11px] font-black uppercase tracking-[0.2em] text-[#ffcade]">Servicio personal shopper</p>
              <h2 className="relative mt-2 text-2xl font-black leading-tight">¿Buscas algo especial?</h2>
              <p className="relative mt-2 text-[13px] text-white/80">Te ayudamos a conseguirlo en USA.</p>
              <a href="https://wa.me/528181697776" target="_blank" rel="noopener noreferrer" className="relative mt-4 self-start rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#7d164d] transition hover:bg-[#ffe2ee]">Solicitar por WhatsApp ↗</a>
            </div>
            <div className="relative flex min-h-[166px] flex-col justify-center overflow-hidden rounded-[25px] border border-[#f1d4e3] bg-[#fff1f7] px-7 py-6">
              <div className="pointer-events-none absolute -bottom-10 -right-6 text-[100px] opacity-10">🎁</div>
              <p className="relative text-[11px] font-black uppercase tracking-[0.2em] text-[#c03a82]">Tu tienda, tu estilo</p>
              <h2 className="relative mt-2 text-2xl font-black text-[#42182d]">Compra fácil y segura</h2>
              <p className="relative mt-2 text-sm text-[#805a6e]">Efectivo, transferencia o tarjeta.</p>
              <Link href="/catalogo" className="relative mt-4 self-start text-xs font-black text-[#a91360] hover:underline">Descubre el catálogo →</Link>
            </div>
          </div>
        </section>

        <section aria-label="Beneficios de comprar en Judi's Shop" className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-[#f3e0ec] bg-white px-6 py-5 shadow-sm xl:grid-cols-4">
          {[
            ["🇺🇸", "Productos originales", "Seleccionados en USA"],
            ["🚚", "Entrega a domicilio", "En Monterrey y alrededores"],
            ["💳", "Opciones de pago", "Tarjeta, efectivo y transferencia"],
            ["💬", "Atención personalizada", "Te ayudamos por WhatsApp"],
          ].map(([icono, titulo, detalle]) => (
            <div key={titulo} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff2f8] text-[23px]">{icono}</span>
              <div>
                <p className="text-[13px] font-extrabold text-[#352532]">{titulo}</p>
                <p className="mt-0.5 text-xs text-slate-500">{detalle}</p>
              </div>
            </div>
          ))}
        </section>

        <section id="categorias" className="scroll-mt-48 pt-15">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[#c12c80]">Compra por departamento</p>
              <h2 className="mt-2 text-[30px] font-black tracking-tight text-[#2d2330]">Encuentra lo que buscas</h2>
            </div>
            <Link href="/catalogo" className="rounded-full border border-[#eac9db] bg-white px-5 py-2.5 text-sm font-bold text-[#a61562] transition hover:bg-pink-50">Ver todas las categorías ↗</Link>
          </div>
          <div className="grid grid-cols-5 gap-4 xl:grid-cols-10">
            {departamentos.map((categoria) => (
              <Link
                key={categoria.titulo}
                href={"/catalogo?categoria=" + encodeURIComponent(categoria.titulo)}
                className="group flex min-w-0 flex-col items-center gap-2.5 text-center"
              >
                <span className={"flex aspect-square w-full items-center justify-center rounded-[24px] border border-white bg-gradient-to-br text-[36px] shadow-[0_5px_18px_rgba(73,28,59,0.06)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg " + categoria.tono}>
                  {categoria.icono}
                </span>
                <span className="text-[12px] font-extrabold leading-4 text-[#594555] transition group-hover:text-[#bd1e70]">{categoria.breve}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="pt-16" aria-label="Últimos productos disponibles">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[#c12c80]">Seleccionados para ti</p>
              <h2 className="mt-2 text-[30px] font-black tracking-tight">Novedades en Judi&apos;s Shop</h2>
              <p className="mt-1 text-sm text-slate-500">Explora los productos disponibles en nuestra tienda.</p>
            </div>
            <Link href="/catalogo" className="rounded-full border border-[#eac9db] bg-white px-5 py-2.5 text-sm font-bold text-[#a61562] hover:bg-pink-50">
              Ver catálogo completo →
            </Link>
          </div>

          {cargando && <div role="status" className="rounded-2xl border border-[#f3e0ec] bg-white p-12 text-center text-sm text-slate-500">Cargando novedades...</div>}
          {errorCarga && !cargando && <div className="rounded-2xl border border-[#f3e0ec] bg-white p-10 text-center text-sm text-slate-600">No pudimos cargar las novedades por el momento. <Link href="/catalogo" className="font-extrabold text-[#b7146c] underline">Ir al catálogo</Link></div>}
          {!cargando && !errorCarga && productos.length === 0 && <div className="rounded-2xl border border-[#f3e0ec] bg-white p-10 text-center text-sm text-slate-600">En este momento no hay productos disponibles en esta sección. <Link href="/catalogo" className="font-extrabold text-[#b7146c] underline">Ver catálogo</Link></div>}

          {productos.length > 0 && (
            <div className="grid grid-cols-3 gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {productos.map((producto) => (
                <article key={producto.id ?? producto.nombre} className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#f1e3eb] bg-white shadow-[0_5px_19px_rgba(52,27,48,0.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(88,31,67,0.1)]">
                  <Link href={producto.id != null ? "/producto/" + producto.id : "/catalogo"} className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#fff8fc]">
                    {producto.imagen
                      ? <img src={producto.imagen} alt={producto.nombre} loading="lazy" className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.04]" />
                      : <span className="text-5xl" role="img" aria-label="Producto sin foto">🛍️</span>}
                    {producto.existencia === 1 && <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">Última pieza</span>}
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#b7146c]">{producto.marca && producto.marca.toLowerCase() !== "sin marca" ? producto.marca : producto.categoria || "Judi's Shop"}</p>
                    <Link href={producto.id != null ? "/producto/" + producto.id : "/catalogo"} className="mt-2 line-clamp-2 min-h-11 text-sm font-bold leading-[22px] text-[#30252e] transition hover:text-[#b7146c]">{producto.nombre}</Link>
                    <p className="mt-3 text-2xl font-black text-[#9f1159]">{"$" + Number(producto.precio).toLocaleString("es-MX")}</p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">● Disponible</p>
                    <button
                      type="button"
                      disabled={producto.id == null}
                      onClick={() => agregarAlCarrito(producto)}
                      className="mt-auto w-full rounded-xl bg-[#b7146c] px-3 py-3 text-xs font-extrabold text-white transition hover:bg-[#8d0f50] disabled:cursor-not-allowed disabled:bg-slate-400"
                      style={{ marginTop: 15 }}
                    >
                      {recienAgregado === producto.id ? "✓ Agregado al carrito" : "🛒 Agregar al carrito"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {productos.length > 0 && <div className="mt-8 text-center"><Link href="/catalogo" className="inline-flex rounded-2xl border-2 border-[#b7146c] bg-white px-9 py-3.5 text-sm font-black text-[#a31560] transition hover:bg-[#fff0f7]">Descubrir todos los productos →</Link></div>}
        </section>

        <section className="mt-18 grid grid-cols-1 overflow-hidden rounded-[28px] border border-[#f1deea] bg-[#fff1f8] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center px-10 py-11 xl:px-15">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#bd347e]">De McAllen a Monterrey</p>
            <h2 className="mt-3 max-w-[570px] text-3xl font-black leading-tight tracking-tight text-[#461634] xl:text-4xl">¿Viste algo que te encantó en Estados Unidos?</h2>
            <p className="mt-4 max-w-[530px] text-base leading-7 text-[#7b5a70]">Envíanos la foto o el nombre del producto y te ayudamos a buscarlo durante nuestras compras.</p>
            <a href="https://wa.me/528181697776" target="_blank" rel="noopener noreferrer" className="mt-6 self-start rounded-xl bg-[#b7146c] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#911051]">
              Cotiza por WhatsApp ↗
            </a>
          </div>
          <div className="flex min-h-[290px] items-center justify-center bg-gradient-to-br from-[#e8c4df] via-[#deb5e3] to-[#aea9e7] p-6">
            <div className="rounded-[28px] border border-white/70 bg-white/55 px-10 py-7 text-center shadow-xl backdrop-blur">
              <p className="text-7xl">🛍️</p>
              <p className="mt-3 text-xl font-black text-[#551c46]">Tu personal shopper de confianza</p>
              <p className="mt-2 text-sm font-semibold text-[#75516a]">Judi&apos;s Shop · Monterrey, NL</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#ecdbe6] bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-12 md:grid-cols-3 xl:px-10">
          <div>
            <div className="flex items-center gap-3">
              <img src="/judis-logo.jpeg" alt="" className="h-12 w-12 rounded-full object-cover" />
              <span className="text-xl font-black text-[#a51361]">Judi&apos;s Shop</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Productos originales seleccionados en Estados Unidos para ti. Entregas en Monterrey y su área metropolitana.</p>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#3c2835]">Explora nuestra tienda</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/catalogo" className="hover:text-[#b7146c]">Todos los productos</Link>
              <Link href="/#categorias" className="hover:text-[#b7146c]">Categorías</Link>
              <Link href="/carrito" className="hover:text-[#b7146c]">Mi carrito</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#3c2835]">¿Podemos ayudarte?</h3>
            <p className="mt-4 text-sm text-slate-600">Escríbenos por WhatsApp para consultas y pedidos especiales.</p>
            <a href="https://wa.me/528181697776" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-black text-[#b7146c] hover:underline">Contactar a Judi&apos;s Shop ↗</a>
          </div>
        </div>
        <div className="border-t border-[#f0e3eb] px-6 py-5 text-center text-xs text-slate-500">© 2026 Judi&apos;s Shop. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
}
