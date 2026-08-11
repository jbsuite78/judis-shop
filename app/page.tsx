"use client";
import { useEffect, useState } from "react";
const categorias = [
  {
    nombre: "Bolsas y Carteras",
    icono: "👜",
    descripcion: "Modelos originales para dama y caballero.",
  },
  {
    nombre: "Perfumes",
    icono: "🌸",
    descripcion: "Fragancias originales de marcas reconocidas.",
  },
  {
    nombre: "Calzado",
    icono: "👟",
    descripcion: "Tenis, sandalias y calzado para toda la familia.",
  },
  {
    nombre: "Belleza",
    icono: "💄",
    descripcion: "Maquillaje, cuidado personal y accesorios.",
  },
 {
  nombre: "Ropa",
  icono: "👕",
  descripcion: "Ropa casual y deportiva para dama, caballero y niños.",
},
{
  nombre: "Hogar",
  icono: "🏠",
  descripcion: "Artículos para cocina, decoración, recámara y más.",
},
{
  nombre: "Cómputo y Videojuegos",
  icono: "💻🎮",
  descripcion: "Laptops, impresoras, accesorios, consolas, videojuegos y tecnología.",
},
{
  nombre: "Bebés",
  icono: "👶",
  descripcion: "Ropa, accesorios, carriolas, pañaleras y artículos para bebé.",.
},
{
  nombre: "Juguetes",
  icono: "🧸",
  descripcion: "Juguetes, muñecas, figuras, juegos de mesa y entretenimiento infantil.",
},
{
  nombre: "Deportes",
  icono: "🏀",
  descripcion: "Ropa deportiva, accesorios, suplementos y equipo para entrenamiento.",
},
{
  nombre: "Salud y bienestar",
  icono: "🧴",
  descripcion: "Vitaminas, suplementos y productos para el bienestar.",
},
];


export default function Home() {
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

useEffect(() => {
  const carrito = JSON.parse(
    localStorage.getItem("carritoJudi") || "[]"
  );

  const total = carrito.reduce(
    (acumulado: number, producto: { cantidad?: number }) =>
      acumulado + (producto.cantidad || 1),
    0
  );

  setCantidadCarrito(total);
}, []);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
     <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/95 backdrop-blur">
  <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-2">
    <div>
      <a href="/" className="flex items-center gap-3">
  <img
    src="/judis-logo.jpeg"
    alt="Judi's Shop"
    className="h-40 w-40 rounded-full object-cover"
  />
  <div>
    <p className="text-xl font-black text-pink-600">Judi&apos;s Shop</p>
    <p className="text-sm text-slate-500">
      Productos originales traídos de Estados Unidos
    </p>
  </div>
</a>
    </div>

    <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-slate-700">
      <a href="/" className="transition hover:text-pink-600">
        Inicio
      </a>

      <a href="/catalogo" className="transition hover:text-pink-600">
        Catálogo
      </a>

      <a href="#categorias" className="transition hover:text-pink-600">
        Categorías
      </a>

      <a href="#contacto" className="transition hover:text-pink-600">
        Contacto
      </a>
    </nav>

    <a
      href="/carrito"
      className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-pink-700"
    >
     🛒 Carrito ({cantidadCarrito})
    </a>
  </div>
</header>
     <section className="overflow-hidden bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-700">
  <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-start lg:py-4">
    
    <div className="text-white">
      <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
        Tus marcas favoritas, más cerca de ti
      </h2>

      <p className="mt-6 max-w-xl text-lg leading-8 text-pink-50">
        Bolsas, perfumes, maquillaje, ropa, calzado y mucho más.
        Productos originales traídos de Estados Unidos.
      </p>

      <div className="mt-8">
  <p className="mb-3 text-base font-semibold font-bold uppercase tracking-[0.2em] text-pink-100">
    Tiendas que visitamos
  </p>

  <div className="grid grid-cols-[120px_120px_160px] gap-x-4 gap-y-2 text-sm font-semibold text-white">
    <span>Ross</span>
    <span>Burlington</span>
    <span>TJ Maxx</span>

    <span>Marshalls</span>
    <span>Walmart</span>
    <span>Target</span>

    <span>Sephora</span>
    <span>Ulta</span>
    <span>Costco</span>

    <span>Primark</span>
    <span>Bath & Body Works</span>
    <span>Academy</span>

    <span>JD Sports</span>
    <span>Foot Locker</span>
    <span>Dick&apos;s Sporting Goods</span>
  </div>
</div>
    </div>

   <div className="rounded-3xl border border-white/20 bg-white/15 p-8 text-white shadow-2xl backdrop-blur">
  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-100">
    
  </p>

  <h2 className="mt-3 text-3xl font-black">
      </h2>

 <div className="relative mt-4 overflow-hidden rounded-3xl">
  <img
   src="/marcas-judis.jpeg"
    alt="Marcas disponibles en Judi's Shop"
   className="h-auto w-full rounded-3xl object-cover"
  />
</div>
</div>

  </div>
</section>
      

      <section id="categorias" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="font-bold uppercase tracking-widest text-pink-600">
            Nuestro catálogo
          </p>

          <h2 className="mt-2 text-4xl font-black">
            Encuentra lo que buscas
          </h2>

          <p className="mt-3 text-slate-500">
            Próximamente podrás consultar aquí todos los productos disponibles.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
  {categorias.map((categoria) => (
    <a
      key={categoria.nombre}
      href={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm transition hover:-translate-y-1 hover:border-pink-300 hover:shadow-lg"
    >
      <div className="text-5xl">{categoria.icono}</div>

      <h3 className="mt-5 text-xl font-black">
        {categoria.nombre}
      </h3>

      <p className="mt-2 leading-6 text-slate-500">
        {categoria.descripcion}
      </p>

      <p className="mt-6 font-bold text-pink-600">
        Ver productos →
      </p>
    </a>
  ))}
</div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 text-center text-white md:grid-cols-3">
          <div>
            <p className="text-3xl">🇺🇸</p>
            <h3 className="mt-3 text-xl font-black">Compras en USA</h3>
            <p className="mt-2 text-slate-300">
              Seleccionamos productos en tiendas reconocidas.
            </p>
          </div>

          <div>
            <p className="text-3xl">📦</p>
            <h3 className="mt-3 text-xl font-black">Pedidos especiales</h3>
            <p className="mt-2 text-slate-300">
              Buscamos por ti el producto que necesitas.
            </p>
          </div>

          <div>
            <p className="text-3xl">🚚</p>
            <h3 className="mt-3 text-xl font-black">Entrega local</h3>
            <p className="mt-2 text-slate-300">
              Entregas disponibles en Monterrey y su área metropolitana.
            </p>
          </div>
        </div>
      </section>

      <section id="contacto" className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-4xl font-black">¿Buscas algún producto?</h2>

        <p className="mt-4 text-lg text-slate-500">
          Envíanos un mensaje con la fotografía o descripción del producto y lo
          buscamos para ti.
        </p>

        <a
  href="https://wa.me/528181697776"
  target="_blank"
  className="mt-10 inline-block rounded-xl bg-green-600 px-7 py-4 text-lg font-bold text-white transition ..."
>
  Contactar por WhatsApp
</a>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-500">
          © 2026 Judi&apos;s Shop. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  );
}