"use client";

import { useEffect, useMemo, useState } from "react";

type Venta = {
  id: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  utilidad: number;
  fecha: string;
};

export default function HistorialPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);

 useEffect(() => {
  async function cargarVentas() {
    const respuesta = await fetch("/api/ventas");

    if (!respuesta.ok) {
      return;
    }

    const ventasDB: Venta[] = await respuesta.json();
    setVentas(ventasDB);
  }

  cargarVentas();
}, []);
async function vaciarHistorial() {
  const confirmar = window.confirm(
    "¿Seguro que deseas borrar todo el historial de ventas?"
  );

  if (!confirmar) return;

  const respuesta = await fetch("/api/ventas", {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    alert("No se pudo borrar el historial");
    return;
  }

  setVentas([]);
  alert("Historial eliminado correctamente");
}
  const totalVendido = useMemo(
    () => ventas.reduce((acumulado, venta) => acumulado + venta.total, 0),
    [ventas]
  );

  const utilidadTotal = useMemo(
    () =>
      ventas.reduce(
        (acumulado, venta) => acumulado + venta.utilidad,
        0
      ),
    [ventas]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold uppercase tracking-widest text-pink-600">
          Panel de administración
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900">
          Historial de ventas
        </h1>

        <p className="mt-2 text-slate-700">
          Consulta las ventas registradas en Judi&apos;s Shop.
        </p>
<div className="mt-6">
  <button
    onClick={vaciarHistorial}
    className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
  >
    🗑️ Vaciar historial
  </button>
</div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-500">
              Ventas registradas
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {ventas.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-500">
              Total vendido
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              ${totalVendido.toLocaleString("es-MX")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-500">
              Utilidad total
            </p>
            <p className="mt-2 text-3xl font-black text-green-700">
              ${utilidadTotal.toLocaleString("es-MX")}
            </p>
          </div>
        </div>

        {ventas.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow">
            <p className="font-bold text-slate-900">
              Todavía no hay ventas registradas.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow">
            <table className="min-w-full text-left">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Producto</th>
                  <th className="px-5 py-4">Cantidad</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Utilidad</th>
                </tr>
              </thead>

              <tbody>
                {[...ventas].reverse().map((venta) => (
                  <tr
                    key={venta.id}
                    className="border-b border-slate-200 text-slate-900"
                  >
                    <td className="px-5 py-4">{venta.fecha}</td>
                    <td className="px-5 py-4 font-bold">
                      {venta.nombre}
                    </td>
                    <td className="px-5 py-4">{venta.cantidad}</td>
                    <td className="px-5 py-4">
                      ${venta.total.toLocaleString("es-MX")}
                    </td>
                    <td className="px-5 py-4 font-bold text-black">
                      ${venta.utilidad.toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <a
          href="/admin/ventas"
          className="mt-8 inline-block rounded-xl bg-pink-600 px-6 py-3 font-bold text-white"
        >
          Volver al punto de venta
        </a>
      </div>
    </main>
  );
}