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

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
  async function cargarProductos() {
    const respuesta = await fetch("/api/productos");

    if (!respuesta.ok) {
      return;
    }

    const productosDB: Producto[] = await respuesta.json();
    setProductos(productosDB);
  }

  cargarProductos();
}, []);
function venderProducto(idProducto: number) {
  const productosActualizados = productos.map((producto) => {
    if (producto.id !== idProducto) {
      return producto;
    }

    const existenciaActual = producto.existencia ?? 0;

    if (existenciaActual <= 0) {
      alert("Este producto no tiene existencia disponible.");
      return producto;
    }

    return {
      ...producto,
      existencia: existenciaActual - 1,
    };
  });

  setProductos(productosActualizados);

  localStorage.setItem(
    "productosJudi",
    JSON.stringify(productosActualizados)
  );
  const productoVendido = productos.find(
  (producto) => producto.id === idProducto
);

if (!productoVendido) return;

const nuevaVenta = {
  productoId: productoVendido.id,
  nombre: productoVendido.nombre,
  cantidad: 1,
  precioUnitario: productoVendido.precio,
  total: productoVendido.precio,
  utilidad:
    productoVendido.precio - (productoVendido.costo ?? 0),
};

fetch("/api/ventas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(nuevaVenta),
});

alert("Venta registrada correctamente.");
}
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold uppercase tracking-widest text-pink-600">
          Panel de administración
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900">
          Punto de Venta
        </h1>

        <p className="mt-2 text-slate-700">
          Selecciona un producto para registrar una venta.
        </p>

        {productos.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow">
            <p className="font-bold text-slate-900">
              No hay productos registrados.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => (
              <article
                key={producto.id}
                className="overflow-hidden rounded-2xl bg-white shadow"
              >
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="h-56 w-full object-cover"
                />

                <div className="p-5">
                  <p className="text-sm font-bold uppercase text-pink-600">
                    {producto.marca}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {producto.nombre}
                  </h2>

                  <p className="mt-1 text-slate-700">
                    {producto.categoria}
                  </p>

                  <div className="mt-4 space-y-1 text-slate-900">
                    <p>
                      <strong>Precio:</strong> $
                      {producto.precio.toLocaleString("es-MX")}
                    </p>

                    <p>
                      <strong>Existencia:</strong>{" "}
                      {producto.existencia ?? 0}
                    </p>

                    <p>
                      <strong>Utilidad unitaria:</strong> $
                     {((producto.precio ?? 0) - (producto.costo ?? 0)).toLocaleString("es-MX")}
                    </p>
                    <button
  onClick={() => venderProducto(producto.id)}
  disabled={(producto.existencia ?? 0) <= 0}
  className="mt-4 w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
>
  Vender
</button>
                  </div>

                  
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}