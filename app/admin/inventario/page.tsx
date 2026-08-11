"use client";

import { useEffect, useState } from "react";

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  costo?: number;
  existencia?: number;
  utilidad?: number;
  imagen: string;
  marca: string;
  categoria: string;
};

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);

 useEffect(() => {
  async function cargarProductos() {
    const respuesta = await fetch("/api/productos");
    const datos = await respuesta.json();
    setProductos(datos);
  }

  cargarProductos();
}, []);
 async  function eliminarProducto(id: number) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este producto?"
    );

    if (!confirmar) return;
await fetch("/api/productos", {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ id }),
});
    const productosActualizados = productos.filter(
      (producto) => producto.id !== id
    );

    setProductos(productosActualizados);

    localStorage.setItem(
      "productosJudi",
      JSON.stringify(productosActualizados)
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold uppercase tracking-widest text-pink-600">
              Panel de administración
            </p>

            <h1 className="text-4xl font-black text-slate-900">
              Inventario
            </h1>

            <p className="mt-2 text-slate-600">
              Productos registrados: {productos.length}
            </p>
          </div>

          <a
            href="/admin/productos"
            className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white"
          >
            Agregar producto
          </a>
        </div>

        {productos.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-lg font-bold text-slate-700">
              No hay productos registrados.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => (
              <article
                key={producto.id}
                className="overflow-hidden rounded-2xl bg-white shadow"
              >
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="h-64 w-full object-cover"
                />

                <div className="p-5">
                  <p className="text-sm font-bold uppercase text-pink-600">
                    {producto.marca}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {producto.nombre}
                  </h2>

                  <p className="mt-1 text-slate-600">
                    {producto.categoria}
                  </p>

                  <div className="mt-4 space-y-1 text-slate-900">
                    <p>
                      <strong>Precio:</strong> $
                      {producto.precio.toLocaleString("es-MX")}
                    </p>

                    <p>
                      <strong>Costo:</strong> $
                      {(producto.costo ?? 0).toLocaleString("es-MX")}
                    </p>

                    <p>
                      <strong>Existencia:</strong>{" "}
                      {producto.existencia ?? 0}
                    </p>

                    <p>
                      <strong>Utilidad:</strong> $
                     {((producto.precio ?? 0) - (producto.costo ?? 0)).toLocaleString("es-MX")}
                    </p>
                  </div>
<a
  href={`/admin/inventario/${producto.id}`}
  className="mt-5 block w-full rounded-xl bg-amber-500 px-4 py-3 text-center font-bold text-white"
>
  Editar producto
</a>
                  <button
                    type="button"
                    onClick={() => eliminarProducto(producto.id)}
                    className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white"
                  >
                    Eliminar producto
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}