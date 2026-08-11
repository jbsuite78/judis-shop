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

export default function CortePage() {
  const [ventas, setVentas] = useState<Venta[]>([]);

 useEffect(() => {
  fetch("/api/ventas")
    .then((respuesta) => respuesta.json())
    .then((datos) => {
      setVentas(datos);
    })
    .catch((error) => {
      console.error("Error al cargar ventas:", error);
    });
}, []);

  const ventasDeHoy = useMemo(() => {
    const hoy = new Date().toLocaleDateString("es-MX");

    return ventas.filter((venta) => {
      const fechaVenta = new Date(venta.fecha).toLocaleDateString("es-MX");
      return fechaVenta === hoy;
    });
  }, [ventas]);

  const totalVendido = useMemo(
    () =>
      ventasDeHoy.reduce(
        (acumulado, venta) => acumulado + venta.total,
        0
      ),
    [ventasDeHoy]
  );

  const utilidadTotal = useMemo(
    () =>
      ventasDeHoy.reduce(
        (acumulado, venta) => acumulado + venta.utilidad,
        0
      ),
    [ventasDeHoy]
  );

  const productosVendidos = useMemo(
    () =>
      ventasDeHoy.reduce(
        (acumulado, venta) => acumulado + venta.cantidad,
        0
      ),
    [ventasDeHoy]
  );

  const costoTotal = totalVendido - utilidadTotal;

  function imprimirCorte() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold uppercase tracking-widest text-pink-600">
              Panel de administración
            </p>

            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Corte de caja
            </h1>

            <p className="mt-2 text-slate-700">
              Resumen de ventas del día.
            </p>
          </div>

          <button
            type="button"
            onClick={imprimirCorte}
            className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white print:hidden"
          >
            Imprimir corte
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-600">
              Ventas registradas
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {ventasDeHoy.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-600">
              Total vendido
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              ${totalVendido.toLocaleString("es-MX")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-600">
              Costo de ventas
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              ${costoTotal.toLocaleString("es-MX")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm font-bold uppercase text-slate-600">
              Utilidad obtenida
            </p>

            <p className="mt-2 text-3xl font-black text-green-900">
              ${utilidadTotal.toLocaleString("es-MX")}
            </p>
          </div>
        </section>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow">
          <p className="text-sm font-bold uppercase text-slate-600">
            Productos vendidos
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {productosVendidos}
          </p>
        </div>

        {ventasDeHoy.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow">
            <p className="font-bold text-slate-900">
              No hay ventas registradas hoy.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow">
            <table className="min-w-full text-left">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-5 py-4">Hora</th>
                  <th className="px-5 py-4">Producto</th>
                  <th className="px-5 py-4">Cantidad</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Utilidad</th>
                </tr>
              </thead>

              <tbody>
                {[...ventasDeHoy].reverse().map((venta) => (
                  <tr
                    key={venta.id}
                    className="border-b border-slate-200 text-slate-900"
                  >
                    <td className="px-5 py-4">
                      {new Date(venta.fecha).toLocaleTimeString("es-MX")}
                    </td>

                    <td className="px-5 py-4 font-bold">
                      {venta.nombre}
                    </td>

                    <td className="px-5 py-4">{venta.cantidad}</td>

                    <td className="px-5 py-4">
                      ${venta.total.toLocaleString("es-MX")}
                    </td>

                    <td className="px-5 py-4 font-bold text-green-900">
                      ${venta.utilidad.toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <a
            href="/admin/ventas"
            className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white"
          >
            Volver al punto de venta
          </a>

          <a
            href="/admin/historial"
            className="rounded-xl border border-slate-900 px-6 py-3 font-bold text-slate-900"
          >
            Ver historial completo
          </a>
        </div>
      </div>
    </main>
  );
}