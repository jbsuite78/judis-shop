"use client";

import { useEffect, useState } from "react";

type ProductoCarrito = {
  id?: number;
  nombre: string;
  precio: number;
  imagen?: string;
  marca?: string;
  categoria?: string;
  cantidad: number;
};

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
  const [nombre, setNombre] = useState("");
const [telefono, setTelefono] = useState("");
const [direccion, setDireccion] = useState("");
const [formaPago, setFormaPago] = useState("");

  useEffect(() => {
    const carritoGuardado = JSON.parse(
      localStorage.getItem("carritoJudi") || "[]"
    );

    setCarrito(carritoGuardado);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
            Judi&apos;s Shop
          </p>

          <h1 className="mt-3 text-4xl font-black">🛒 Tu carrito</h1>

          <p className="mt-4 text-slate-500">
            Aquí aparecerán los productos que agregues para comprar.
          </p>

          {carrito.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-xl font-bold">Tu carrito está vacío</p>

              <p className="mt-2 text-slate-500">
                Explora nuestro catálogo y agrega los productos que te interesen.
              </p>

              <a
                href="/catalogo"
                className="mt-6 inline-block rounded-xl bg-pink-600 px-6 py-3 font-bold text-white transition hover:bg-pink-700"
              >
                Ver catálogo
              </a>
            </div>
          ) : (
           
            <div className="mt-8 space-y-4">
              <a
  href="/catalogo"
  className="mb-6 inline-block rounded-xl bg-pink-600 px-6 py-3 font-bold text-white transition hover:bg-pink-700"
>
  ← Seguir comprando
</a>
              {carrito.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="h-24 w-24 rounded-xl object-contain"
                    />
                  ) : null}

                  <div className="flex-1">
                    <p className="font-black">{producto.nombre}</p>

                   <p className="mt-1 text-sm">
  Precio unitario: ${producto.precio.toLocaleString("es-MX")}
</p>

<p className="mt-1 text-lg font-bold">
  Subtotal: ${(producto.precio * producto.cantidad).toLocaleString("es-MX")}
</p>
                    <button
  type="button"
 onClick={() => {
  const carritoActualizado = carrito
    .map((item) =>
      item.id === producto.id
        ? { ...item, cantidad: item.cantidad - 1 }
        : item
    )
    .filter((item) => item.cantidad > 0);

  localStorage.setItem(
    "carritoJudi",
    JSON.stringify(carritoActualizado)
  );

  setCarrito(carritoActualizado);
}}
  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
>
  Eliminar
</button>
                  </div>
                </div>
              ))}
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <span className="text-lg font-bold">Total del pedido</span>

    <span className="text-2xl font-black text-pink-600">
      $
      {carrito
        .reduce(
          (total, producto) =>
            total + producto.precio * producto.cantidad,
          0
        )
        .toLocaleString("es-MX")}
    </span>
  </div>
<div className="mt-6 grid gap-4">
  <input
    type="text"
    placeholder="Nombre del cliente"
    value={nombre}
    onChange={(e) => setNombre(e.target.value)}
    className="w-full rounded-xl border border-slate-300 px-4 py-3"
  />

  <input
    type="tel"
    placeholder="Teléfono"
    value={telefono}
    onChange={(e) => setTelefono(e.target.value)}
    className="w-full rounded-xl border border-slate-300 px-4 py-3"
  />

  <input
    type="text"
    placeholder="Dirección o zona de entrega"
    value={direccion}
    onChange={(e) => setDireccion(e.target.value)}
    className="w-full rounded-xl border border-slate-300 px-4 py-3"
  />

  <select
    value={formaPago}
    onChange={(e) => setFormaPago(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
  >
    <option value="">Selecciona forma de pago</option>
    <option value="Efectivo">Efectivo</option>
    <option value="Transferencia">Transferencia</option>
    <option value="Tarjeta">Tarjeta</option>
  </select>
</div>
  <button
    type="button"
    onClick={() => {
  const mensajeProductos = carrito
    .map(
      (producto) =>
        `${producto.nombre}
Cantidad: ${producto.cantidad}
Precio unitario: $${producto.precio.toLocaleString("es-MX")}
Subtotal: $${(
          producto.precio * producto.cantidad
        ).toLocaleString("es-MX")}`
    )
    .join("\n\n");

  const total = carrito.reduce(
    (suma, producto) =>
      suma + producto.precio * producto.cantidad,
    0
  );

  const mensaje = `Pedido Judi's Shop

Cliente: ${nombre}
Teléfono: ${telefono}
Dirección/Zona: ${direccion}
Forma de pago: ${formaPago}

${mensajeProductos}

Total del pedido: $${total.toLocaleString("es-MX")}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );
}}
    className="mt-6 w-full rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-700"
  >
    📲 Comprar por WhatsApp
  </button>
</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}