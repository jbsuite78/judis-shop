"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { productos as productosBase } from "@/data/productos";

type Producto = {
  id?: number;
  nombre: string;
  precio: number;
  imagen: string;
  marca: string;
  categoria: string;
};

export default function PaginaProducto() {
  const parametros = useParams();
  const idRecibido = String(parametros.id);

  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
 useEffect(() => {
  async function cargarProducto() {
    const respuesta = await fetch("/api/productos");

    if (!respuesta.ok) {
      setProducto(null);
      setCargando(false);
      return;
    }

    const productosDB: Producto[] = await respuesta.json();

    const productoEncontrado = productosDB.find(
      (productoActual) => String(productoActual.id) === idRecibido
    );

    setProducto(productoEncontrado || null);
    setCargando(false);
  }

  cargarProducto();
}, [idRecibido]);
  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-slate-600">
          Cargando producto...
        </p>
      </main>
    );
  }

  if (!producto) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900">
            Producto no encontrado
          </h1>

          <p className="mt-3 text-slate-500">
            Este producto no existe o fue eliminado.
          </p>

          <a
            href="/catalogo"
            className="mt-6 inline-block rounded-xl bg-pink-600 px-6 py-3 font-bold text-white"
          >
            Volver al catálogo
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <a
          href="/catalogo"
          className="inline-block rounded-xl border border-pink-600 px-5 py-3 font-bold text-pink-600"
        >
          ← Volver al catálogo
        </a>

        <div className="mt-8 grid gap-10 rounded-3xl bg-white p-8 shadow-xl md:grid-cols-2">
          <div className="flex min-h-96 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 p-6">
            {producto.imagen ? (
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="max-h-[500px] max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="font-bold text-slate-500">
                Producto sin fotografía
              </p>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-bold uppercase tracking-widest text-pink-600">
              {producto.marca}
            </p>

            <h1 className="mt-3 text-4xl font-black">
              {producto.nombre}
            </h1>

            <p className="mt-4 text-lg text-slate-500">
              Categoría: {producto.categoria}
            </p>

            <p className="mt-8 text-4xl font-black text-slate-900">
              ${producto.precio.toLocaleString("es-MX")}
            </p>

            <div className="mt-8 rounded-2xl bg-pink-50 p-5">
              <p className="font-bold text-pink-700">
                Producto original disponible en Judi&apos;s Shop.
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Contáctanos para confirmar existencia, entrega y opciones de
                pago.
              </p>
              <div className="mt-6 space-y-3">

  <a
   href={`https://wa.me/528181697776?text=${encodeURIComponent(
  `Hola 👋 me interesa este producto de Judi's Shop.

🛍️ Producto: ${producto.nombre}
💵 Precio: $${producto.precio.toLocaleString("es-MX")}

¿Está disponible?`
)}`}
    className="block w-full rounded-xl bg-green-600 px-6 py-4 text-center font-bold text-white hover:bg-green-700"
  >
    🛍️ enviar mensaje de compra
  </a>

  
</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}