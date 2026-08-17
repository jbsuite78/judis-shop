"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

const categorias = [
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
  "Artículos de Temporada 📒🧛🏻‍♂️🎅🏼",
];

const marcas = [
  "Sin marca",
  "Guess",
  "Coach",
  "Michael Kors",
  "Steve Madden",
  "Tommy Hilfiger",
  "Nike",
  "Adidas",
  "Puma",
  "Victoria's Secret",
];

export default function EditarProductoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [existencia, setExistencia] = useState("");
  const [imagen, setImagen] = useState("");
  const [marca, setMarca] = useState("Sin marca");
  const [categoria, setCategoria] = useState("Bolsas y Carteras");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

 
useEffect(() => {
  async function cargarProducto() {
    const respuesta = await fetch("/api/productos");
    const productos: Producto[] = await respuesta.json();

    const idProducto = Number(params.id);
    const productoEncontrado = productos.find(
      (producto) => producto.id === idProducto
    );

    if (!productoEncontrado) {
      setMensaje("Producto no encontrado.");
      setCargando(false);
      return;
    }

    setNombre(productoEncontrado.nombre);
    setPrecio(String(productoEncontrado.precio));
    setCosto(String(productoEncontrado.costo ?? 0));
    setExistencia(String(productoEncontrado.existencia ?? 0));
    setImagen(productoEncontrado.imagen ?? "");
    setMarca(productoEncontrado.marca);
    setCategoria(productoEncontrado.categoria);
    setCargando(false);
  }

  cargarProducto();
}, [params.id]);
  function seleccionarImagen(
    evento: React.ChangeEvent<HTMLInputElement>
  ) {
    const archivo = evento.target.files?.[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = () => {
      if (typeof lector.result === "string") {
        setImagen(lector.result);
      }
    };

    lector.readAsDataURL(archivo);
  }

  function guardarCambios(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!nombre.trim() || !precio || !costo || !existencia) {
      setMensaje("Completa nombre, precio, costo y existencia.");
      return;
    }

    const precioNumero = Number(precio);
    const costoNumero = Number(costo);
    const existenciaNumero = Number(existencia);

    if (
      Number.isNaN(precioNumero) ||
      Number.isNaN(costoNumero) ||
      Number.isNaN(existenciaNumero) ||
      precioNumero < 0 ||
      costoNumero < 0 ||
      existenciaNumero < 0
    ) {
      setMensaje("Revisa los valores numéricos.");
      return;
    }

   

   
fetch("/api/productos", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: Number(params.id),
    nombre: nombre.trim(),
    precio: precioNumero,
    costo: costoNumero,
    existencia: existenciaNumero,
    imagen,
    marca,
    categoria,
  }),
});
    setMensaje("Producto actualizado correctamente.");

    setTimeout(() => {
      router.push("/admin/inventario");
    }, 700);
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-center text-lg font-bold">
          Cargando producto...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
        <p className="font-bold uppercase tracking-widest text-pink-600">
          Panel de administración
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900">
          Editar producto
        </h1>

        <form onSubmit={guardarCambios} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block font-bold">
              Fotografía
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={seleccionarImagen}
              className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
            />
          </div>

          {imagen && (
            <img
              src={imagen}
              alt="Vista previa"
              className="mx-auto h-64 w-64 rounded-2xl object-cover"
            />
          )}

          <div>
            <label className="mb-2 block font-bold text-slate-900">
              Nombre del producto
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-slate-900"></label>

            <select
              value={marca}
              onChange={(evento) => setMarca(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
            >
              {marcas.map((marcaOpcion) => (
                <option key={marcaOpcion} value={marcaOpcion}>
                  {marcaOpcion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold text-slate-900">
            </label>

            <select
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
            >
              {categorias.map((categoriaOpcion) => (
                <option
                  key={categoriaOpcion}
                  value={categoriaOpcion}
                >
                  {categoriaOpcion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold text-slate-900">Precio</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(evento) => setPrecio(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
            />
          </div>
<div>
  <label className="mb-2 block font-bold text-slate-900">Existencia</label>
  <input
    type="number"
    min="0"
    step="1"
    value={existencia}
    onChange={(evento) => setExistencia(evento.target.value)}
    className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
  />
</div>
          <div>
            <label className="mb-2 block font-bold text-slate-900">
                 Costo
                 </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={costo}
              onChange={(evento) => setCosto(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 p-4 bg-white text-slate-900"
            />
          </div>

       

          <div>
            <label className="mb-2 block font-bold text-slate-900">
              Utilidad
            </label>

            <input
  type="number"
  value={Number(precio || 0) - Number(costo || 0)}
  readOnly
  className="w-full rounded-xl border border-slate-300 bg-slate-100 p-4 text-slate-900"
/>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-pink-600 px-6 py-4 font-bold text-white"
          >
            Guardar cambios
          </button>
        </form>

        {mensaje && (
          <p className="mt-6 text-center font-bold text-pink-600">
            {mensaje}
          </p>
        )}

        <a
          href="/admin/inventario"
          className="mt-6 block text-center font-bold text-slate-700"
        >
          Volver al inventario
        </a>
      </div>
    </main>
  );
}