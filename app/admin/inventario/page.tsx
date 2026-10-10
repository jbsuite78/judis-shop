"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  costo?: number;
  existencia?: number;
  utilidad?: number;
  imagen?: string | null;
  marca: string;
  categoria: string;
  visible: boolean;
};

type Filtro = "todos" | "visibles" | "ocultos";

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarProductos() {
      try {
        const respuesta = await fetch("/api/productos", {
          cache: "no-store",
          signal: controller.signal,
        });
        const datos: unknown = await respuesta.json();
        if (!respuesta.ok || !Array.isArray(datos)) {
          throw new Error(
            respuesta.status === 401
              ? "Tu sesión terminó. Inicia sesión nuevamente."
              : "No pudimos cargar el inventario."
          );
        }
        setProductos(datos as Producto[]);
      } catch (fallo) {
        if (controller.signal.aborted) return;
        setError(fallo instanceof Error ? fallo.message : "No se pudo cargar el inventario.");
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    cargarProductos();
    return () => controller.abort();
  }, []);

  const visibles = useMemo(
    () => productos.filter((producto) => producto.visible !== false).length,
    [productos]
  );
  const ocultos = productos.length - visibles;

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return productos.filter((producto) => {
      if (filtro === "visibles" && producto.visible === false) return false;
      if (filtro === "ocultos" && producto.visible !== false) return false;
      return (
        producto.nombre.toLowerCase().includes(texto) ||
        (producto.marca || "").toLowerCase().includes(texto) ||
        (producto.categoria || "").toLowerCase().includes(texto)
      );
    });
  }, [productos, filtro, busqueda]);

  async function cambiarVisibilidad(producto: Producto) {
    if (accionando !== null) return;
    const nuevaVisibilidad = producto.visible === false;
    setAccionando(producto.id);
    setError("");
    try {
      const respuesta = await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: producto.id, visible: nuevaVisibilidad }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.error || "No se pudo actualizar el producto.");
      }
      setProductos((actuales) =>
        actuales.map((item) =>
          item.id === producto.id ? { ...item, visible: nuevaVisibilidad } : item
        )
      );
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo cambiar la visibilidad.");
    } finally {
      setAccionando(null);
    }
  }

  async function eliminarProducto(producto: Producto) {
    if (accionando !== null) return;
    if (!window.confirm(
      "¿Eliminar definitivamente \"" + producto.nombre + "\"?\n\nSi solo quieres que no aparezca en la tienda, usa el botón Ocultar producto."
    )) return;

    setAccionando(producto.id);
    setError("");
    try {
      const respuesta = await fetch("/api/productos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: producto.id }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.error || "No se pudo eliminar el producto.");
      }
      setProductos((actuales) => actuales.filter((item) => item.id !== producto.id));
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo eliminar el producto.");
    } finally {
      setAccionando(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff9fc] px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-pink-600">Panel de administración</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">Inventario</h1>
            <p className="mt-2 text-sm text-slate-600">
              Oculta productos sin eliminarlos y actívalos de nuevo cuando quieras.
            </p>
          </div>
          <Link href="/admin/productos" className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white hover:bg-pink-700">
            + Agregar producto
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Registrados", value: productos.length },
            { label: "En la tienda", value: visibles },
            { label: "Ocultos", value: ocultos },
          ].map((dato) => (
            <div key={dato.label} className="rounded-2xl border border-pink-100 bg-white p-3 text-center shadow-sm sm:p-5">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">{dato.label}</p>
              <p className="mt-1 text-2xl font-black text-pink-700 sm:text-3xl">{dato.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div role="group" aria-label="Filtrar productos por visibilidad" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: "todos", label: "Todos" },
              { id: "visibles", label: "Visibles" },
              { id: "ocultos", label: "Ocultos" },
            ].map((item) => (
              <button key={item.id} type="button" onClick={() => setFiltro(item.id as Filtro)}
                aria-pressed={filtro === item.id}
                className={"rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm " +
                  (filtro === item.id ? "bg-white text-pink-700 shadow-sm" : "text-slate-600 hover:text-pink-700")}>
                {item.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            aria-label="Buscar en inventario"
            placeholder="Buscar producto o marca..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-pink-400 sm:w-80"
          />
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        {cargando ? (
          <p role="status" className="rounded-2xl bg-white p-10 text-center font-semibold text-slate-600">Cargando inventario...</p>
        ) : productosFiltrados.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              {productos.length === 0 ? "No hay productos registrados." : "No encontramos productos con estos filtros."}
            </p>
            {productos.length > 0 && (
              <button type="button" onClick={() => { setFiltro("todos"); setBusqueda(""); }}
                className="mt-4 rounded-xl border border-pink-300 px-5 py-2 font-bold text-pink-700">Mostrar todos</button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map((producto) => {
              const oculto = producto.visible === false;
              const esperando = accionando === producto.id;
              return (
                <article key={producto.id} className={"overflow-hidden rounded-2xl border bg-white shadow-sm " +
                  (oculto ? "border-amber-200" : "border-slate-100")}>
                  <div className="relative flex h-56 items-center justify-center bg-pink-50 sm:h-64">
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-5xl" role="img" aria-label="Sin imagen">🛍️</span>
                    )}
                    <span className={"absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-black shadow-sm " +
                      (oculto ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800")}>
                      {oculto ? "🙈 Oculto · Solo administración" : "● Visible en la tienda"}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-pink-600">{producto.marca}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">{producto.nombre}</h2>
                    <p className="mt-1 text-sm text-slate-600">{producto.categoria}</p>
                    <div className="mt-4 space-y-1 text-sm text-slate-900">
                      <p><strong>Precio:</strong> {"$" + Number(producto.precio).toLocaleString("es-MX")}</p>
                      <p><strong>Costo:</strong> {"$" + Number(producto.costo ?? 0).toLocaleString("es-MX")}</p>
                      <p><strong>Existencia:</strong> {producto.existencia ?? 0}</p>
                      <p><strong>Utilidad:</strong> {"$" + (Number(producto.precio) - Number(producto.costo ?? 0)).toLocaleString("es-MX")}</p>
                    </div>

                    <Link href={"/admin/inventario/" + producto.id} className="mt-5 block w-full rounded-xl bg-amber-500 px-4 py-3 text-center font-bold text-white transition hover:bg-amber-600">
                      ✏️ Editar producto
                    </Link>
                    <button type="button" onClick={() => cambiarVisibilidad(producto)}
                      disabled={accionando !== null} aria-pressed={oculto}
                      className={"mt-3 w-full rounded-xl px-4 py-3 font-bold transition disabled:cursor-wait disabled:opacity-60 " +
                        (oculto ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border-2 border-[#ab1b67] bg-pink-50 text-[#991b60] hover:bg-pink-100")}>
                      {esperando ? "Guardando..." : oculto ? "👁️ Activar producto" : "🙈 Ocultar producto"}
                    </button>
                    <button type="button" onClick={() => eliminarProducto(producto)}
                      disabled={accionando !== null}
                      className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60">
                      🗑️ Eliminar definitivamente
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
