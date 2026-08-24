"use client";

import { useEffect, useMemo, useState } from "react";
import { productos as productosBase } from "@/data/productos";

type Producto = {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  existencia?: number;
  imagen: string;
  imagenes?: string[];
  marca: string;
  categoria: string;
};

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>(productosBase);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todas");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("Todas");
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
const [fotoSeleccionada, setFotoSeleccionada] = useState<Record<string, string>>({});
  useEffect(() => {
    cargarProductos();

    const parametros = new URLSearchParams(window.location.search);
    const categoriaDesdeInicio = parametros.get("categoria");

    if (categoriaDesdeInicio) {
      setCategoriaSeleccionada(categoriaDesdeInicio);
    }
  }, []);

 async function cargarProductos() {
  const respuesta = await fetch("/api/productos");

  if (!respuesta.ok) {
    return;
  }

  const productosDB: Producto[] = await respuesta.json();

  setProductos(productosDB);
}
async function venderUnaPieza(producto: Producto) {
  const existenciaActual = producto.existencia ?? 0;

  if (existenciaActual <= 0) return;

  const nuevaExistencia = existenciaActual - 1;

  const respuesta = await fetch("/api/productos", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...producto,
      existencia: nuevaExistencia,
    }),
  });

  if (!respuesta.ok) {
    return;
  }

  setProductos((productosActuales) =>
    productosActuales.map((p) =>
      p.id === producto.id
        ? { ...p, existencia: nuevaExistencia }
        : p
    )
  );
}
   function eliminarProducto(id: number, nombre: string) {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${nombre}"?`
    );

    if (!confirmar) {
      return;
    }
fetch("/api/productos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const productosGuardados: Producto[] = JSON.parse(
      localStorage.getItem("productosJudi") || "[]"
    );

    const productosActualizados = productosGuardados.filter(
      (producto) => producto.id !== id
    );

    localStorage.setItem(
      "productosJudi",
      JSON.stringify(productosActualizados)
    );

    setProductos([...productosBase, ...productosActualizados]);

    window.alert("✅ Producto eliminado correctamente.");
  }

  function editarProducto(productoEditar: Producto) {
    if (!productoEditar.id) {
      return;
    }

    const nuevoNombre = window.prompt(
      "Escribe el nuevo nombre:",
      productoEditar.nombre
    );
    if (nuevoNombre === null || nuevoNombre.trim() === "") {
      return;
    }

    const nuevoPrecioTexto = window.prompt(
      "Escribe el nuevo precio:",
      productoEditar.precio.toString()
    );

    if (nuevoPrecioTexto === null) {
      return;
    }

    const nuevoPrecio = Number(nuevoPrecioTexto);

    if (Number.isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      window.alert("El precio no es válido.");
      return;
    }

    const nuevaMarca = window.prompt(
      "Escribe la marca:",
      productoEditar.marca
    );

    if (nuevaMarca === null || nuevaMarca.trim() === "") {
      return;
    }

    const nuevaCategoria = window.prompt(
      "Escribe la categoría:",
      productoEditar.categoria
    );

    if (nuevaCategoria === null || nuevaCategoria.trim() === "") {
      return;
    }

    const productosGuardados: Producto[] = JSON.parse(
      localStorage.getItem("productosJudi") || "[]"
    );

    const productosActualizados = productosGuardados.map((producto) =>
      producto.id === productoEditar.id
        ? {
            ...producto,
            nombre: nuevoNombre.trim(),
            precio: nuevoPrecio,
            marca: nuevaMarca.trim(),
            categoria: nuevaCategoria.trim(),
          }
        : producto
    );

    localStorage.setItem(
      "productosJudi",
      JSON.stringify(productosActualizados)
    );

    setProductos([...productosBase, ...productosActualizados]);

    window.alert("✅ Producto editado correctamente.");
  }

 const categorias = useMemo(() => {
  const fijas = [
    "Bolsas y Carteras",
    "Perfumes",
    "Calzado",
    "Belleza",
    "Ropa",
    "Hogar",
    "Cómputo y Videojuegos",
    "Bebés",
    "Juguetes",
    "Deportes",
    "Artículos de Temporada",
  ];

  const existentes = productos.map((producto) => producto.categoria);

  return ["Todas", ...Array.from(new Set([...fijas, ...existentes])).sort()];
}, [productos]);

const marcas = useMemo(() => {
  const fijas = [
    "Guess",
    "Coach",
    "Michael Kors",
    "Steve Madden",
    "Tommy Hilfiger",
    "Nike",
    "Adidas",
    "Puma",
    "Victoria's Secret",
    "Magellan",
    "Columbia",
    "Crocs",
    "Paris Hilton",
    "Ariana Grande",
    "Perry Ellis",
    "Reebok",
    "Aldo",
    "Levi's",
  ];

  const existentes = productos.map((producto) => producto.marca);

  return ["Todas", ...Array.from(new Set([...fijas, ...existentes])).sort()];
}, [productos]);
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return productos.filter((producto) => {
      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(texto) ||
        producto.marca.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto);

      const coincideCategoria =
        categoriaSeleccionada === "Todas" ||
        producto.categoria === categoriaSeleccionada;

      const coincideMarca =
        marcaSeleccionada === "Todas" ||
        producto.marca === marcaSeleccionada;

      return coincideBusqueda && coincideCategoria && coincideMarca;
    });
  }, [
    productos,
    busqueda,
    categoriaSeleccionada,
    marcaSeleccionada,
  ]);

  function limpiarFiltros() {
    setBusqueda("");
    setCategoriaSeleccionada("Todas");
    setMarcaSeleccionada("Todas");

    window.history.replaceState({}, "", "/catalogo");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-3xl font-black text-pink-600">
              Judi&apos;s Shop
            </h1>

            <p className="text-sm text-slate-500">
              Catálogo de productos originales
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-pink-600 px-5 py-3 font-bold text-pink-600"
          >
            ← Volver al inicio
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="font-bold uppercase tracking-widest text-pink-600">
            Catálogo
          </p>

          <h2 className="mt-2 text-4xl font-black">
            Productos disponibles
          </h2>

          <p className="mt-2 text-slate-500">
            Busca productos por nombre, marca o categoría.
          </p>
        </div>

        <div className="mb-10 grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-4">
          <input
            type="text"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar producto..."
            className="rounded-xl border border-slate-300 p-4"
          />

          <select
            value={categoriaSeleccionada}
            onChange={(evento) =>
              setCategoriaSeleccionada(evento.target.value)
            }
            className="rounded-xl border border-slate-300 bg-white p-4"
          >
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria === "Todas"
                  ? "Todas las categorías"
                  : categoria}
              </option>
            ))}
          </select>

          

          <button
            type="button"
            onClick={limpiarFiltros}
            className="rounded-xl border border-pink-600 px-4 py-3 font-bold text-pink-600"
          >
            Limpiar filtros
          </button>
        </div>

        <p className="mb-6 font-bold text-slate-600">
          Productos encontrados: {productosFiltrados.length}
        </p>

        {productosFiltrados.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-2xl font-black">
              No encontramos productos
            </p>

            <p className="mt-2 text-slate-500">
              Todavía no hay productos registrados en esta categoría.
            </p>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-6 rounded-xl bg-pink-600 px-6 py-3 font-bold text-white"
            >
              Mostrar todos
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map((producto, indice) => (
              
 <div key={producto.id ?? `${producto.nombre}-${indice}`}>
<article
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex h-64 items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
                  {producto.imagen ? (
                    <img
                     src={producto.imagen}
                      alt={producto.nombre}
                     onClick={() => setImagenAmpliada(producto.imagen)}
                    className="w-full h-full object-contain p-2"
                    />
                  ) : null}
                </div>
{producto.imagenes && producto.imagenes.length > 0 && (
  <div className="flex gap-2 overflow-x-auto px-4 pb-3">
    {producto.imagenes.map((foto, index) => (
      <img
        key={index}
        src={foto}
       onClick={() => {
  setFotoSeleccionada((prev) => ({
    ...prev,
    [String(producto.id)]: foto,
  }));
  setImagenAmpliada(foto);
}}
        alt={`${producto.nombre} ${index + 2}`}
        className="h-16 w-16 shrink-0 rounded-lg border object-cover"
      />
    ))}
  </div>
)}
                <div className="p-6">
                  {producto.marca && producto.marca.toLowerCase() !== "sin marca" && (
  <p className="text-sm font-bold uppercase tracking-wider text-pink-600">
    {producto.marca}
  </p>
)}

                  <h3 className="mt-2 text-xl font-black">
                    {producto.nombre}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {producto.categoria}
                  </p>
                  {producto.descripcion && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                   {producto.descripcion}
                   </p>
                   )}
                  <p className="mt-5 text-2xl font-black">
                    ${producto.precio.toLocaleString("es-MX")}
                  </p>
<p
  className={`mt-2 text-sm font-bold ${
    (producto.existencia ?? 0) === 0
      ? "text-red-600"
      : (producto.existencia ?? 0) <= 4
      ? "text-amber-600"
      : "text-green-600"
  }`}
>
  {(producto.existencia ?? 0) === 0
    ? "🔴 Agotado"
    : (producto.existencia ?? 0) === 1
    ? "🟡 Última pieza"
    : (producto.existencia ?? 0) <= 4
    ? `🟡 Pocas piezas: ${producto.existencia}`
    : `🟢 Disponible: ${producto.existencia} piezas`}
</p>
              {(producto.existencia ?? 0) > 0 ? (
<>
<div className="mt-5">
  <label className="mb-2 block text-sm font-bold text-slate-700">
    Cantidad
  </label>

  <select
  id={`cantidad-${producto.id}`}
    defaultValue="1"
    onClick={(evento) => evento.stopPropagation()}
onMouseDown={(evento) => evento.stopPropagation()}
onChange={(evento) => evento.stopPropagation()}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900"
  >
    {Array.from(
      { length: producto.existencia ?? 0 },
      (_, index) => index + 1
    ).map((cantidad) => (
      <option key={cantidad} value={cantidad}>
        {cantidad}
      </option>
    ))}
  </select>
</div>
  
  <button
  type="button"
  onClick={(evento) => {
    evento.preventDefault();
    evento.stopPropagation();
const selector = document.getElementById(
  `cantidad-${producto.id}`
) as HTMLSelectElement | null;

const cantidadSeleccionada = Number(selector?.value || 1);
    const carrito = JSON.parse(
      localStorage.getItem("carritoJudi") || "[]"
    );

    const existente = carrito.find(
      (item: { id?: number }) => item.id === producto.id
    );

    const carritoActualizado = existente
      ? carrito.map((item: { id?: number; cantidad?: number }) =>
          item.id === producto.id
            ? {
                ...item,
               cantidad: (item.cantidad || 1) + cantidadSeleccionada,
              }
            : item
        )
      : [
          ...carrito,
         {
 
  id: producto.id,
  nombre: producto.nombre,
  precio: producto.precio,
  imagen: producto.imagen,
  cantidad: cantidadSeleccionada,
},
        ];

    localStorage.setItem(
      "carritoJudi",
      JSON.stringify(carritoActualizado)
    );

   window.location.href = "/carrito";
  }}
  className="mt-3 block w-full rounded-xl bg-slate-900 px-6 py-4 text-center text-lg font-bold text-white transition hover:bg-slate-800"
>
  🛒 Agregar al carrito
</button>
</>
) : (
  <div className="mt-5 block w-full rounded-xl bg-slate-400 px-6 py-4 text-center text-lg font-bold text-white">
    🔴 AGOTADO
  </div>
)}
                </div>

              </article>
            </div>
            ))}
          </div>
        )}
        {imagenAmpliada && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    onClick={() => setImagenAmpliada(null)}
  >
    <img
      src={imagenAmpliada}
      alt="Imagen ampliada"
      className="max-h-[95vh] max-w-[95vw] object-contain"
    />
  </div>
)}
      </section>
    </main>
  );
}