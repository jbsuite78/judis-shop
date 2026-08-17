"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type ProductoGuardado = {
  id: number;
  nombre: string;
  precio: number;
  costo: number;
existencia: number;
utilidad: number;
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
  "Nike",
  "Adidas",
  "Puma",
  "Under Armour",
  "Reebok",
  "Maybelline",
  "L'Oréal",
  "Otra",
];

export default function AgregarProducto() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
const [existencia, setExistencia] = useState("");
 const [imagen, setImagen] = useState("");
 const [imagenesExtra, setImagenesExtra] = useState<string[]>([]);
  const [marca, setMarca] = useState("Sin marca");
  const [categoria, setCategoria] = useState("Bolsas y Carteras");
  const [mensaje, setMensaje] = useState("");

  function seleccionarImagen(evento: ChangeEvent<HTMLInputElement>) {
  const archivos = Array.from(evento.target.files ?? []);

  if (archivos.length === 0) {
    return;
  }

  const lectores = archivos.map(
    (archivo) =>
      new Promise<string>((resolve) => {
        const lector = new FileReader();

        lector.onload = () => {
          resolve(lector.result as string);
        };

        lector.readAsDataURL(archivo);
      })
  );

  Promise.all(lectores).then((resultados) => {
    setImagen(resultados[0]);
    setImagenesExtra(resultados.slice(1));
  });
}
 async function guardarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

 if (!imagen || !nombre.trim() || !costo || !existencia) {
  setMensaje("Completa la fotografía, el nombre, el costo y la existencia.");
  return;
}

  const precioNumero = Number(precio);
const costoNumero = Number(costo);
const existenciaNumero = Number(existencia);
const utilidadCalculada = precioNumero - costoNumero;
    if (Number.isNaN(precioNumero) || precioNumero < 0) {
      setMensaje("Escribe un precio válido.");
      return;
    }

  

    

    const respuesta = await fetch("/api/productos", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  nombre: nombre.trim(),
  descripcion: descripcion.trim(),
  precio: precioNumero,
  costo: costoNumero,
  existencia: existenciaNumero,
  utilidad: utilidadCalculada,
  imagen,
  imagenesExtra,
  marca,
  categoria,
}),
});

if (!respuesta.ok) {
  setMensaje("Error al guardar el producto.");
  return;
}
    setNombre("");
    setDescripcion("");
   setCosto("");
setExistencia("");
setImagen("");
    setMarca("Sin marca");
    setCategoria("Bolsas y Carteras");
    setMensaje("✅ Producto guardado correctamente.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl">
        <p className="font-bold uppercase tracking-widest text-pink-600">
          Judi&apos;s Shop
        </p>

        <h1 className="mt-2 text-4xl font-black">Agregar producto</h1>

        <p className="mt-2 text-slate-500">
          Captura los datos del producto y selecciona su categoría y marca.
        </p>

        <form className="mt-8 space-y-6" onSubmit={guardarProducto}>
          <div>
            <label className="mb-2 block font-bold">Fotografía</label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={seleccionarImagen}
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          {imagen && (
            <div className="flex justify-center rounded-2xl bg-pink-50 p-4">
              <img
                src={imagen}
                alt="Vista previa del producto"
                className="max-h-64 rounded-xl object-contain"
              />
            </div>
          )}
{imagenesExtra.length > 0 && (
  <div className="flex flex-wrap justify-center gap-3">
    {imagenesExtra.map((foto, index) => (
      <img
        key={index}
        src={foto}
        alt={`Foto adicional ${index + 1}`}
        className="h-24 w-24 rounded-xl border object-cover"
      />
    ))}
  </div>
)}
          <div>
            <label className="mb-2 block font-bold">
              Nombre del producto
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ejemplo: Bolsa Guess"
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          <div>
  <label className="mb-2 block font-bold">
    Descripción
  </label>

  <textarea
    value={descripcion}
    onChange={(evento) => setDescripcion(evento.target.value)}
    placeholder="Ejemplo: Bolsa para dama en color negro, cadena dorada y diseño elegante."
    rows={3}
    className="w-full rounded-xl border border-slate-300 p-4"
  />
</div>

          <div>
            <label className="mb-2 block font-bold">Categoría</label>

            <select
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-4"
            >
              {categorias.map((categoriaOpcion) => (
                <option key={categoriaOpcion} value={categoriaOpcion}>
                  {categoriaOpcion}
                </option>
              ))}
            </select>
          </div>

          

          <div>
            <label className="mb-2 block font-bold">Precio</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
             onChange={(evento) => setPrecio(evento.target.value)}
              placeholder="1000"
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>
          <div>
  <label className="mb-2 block font-bold">Costo</label>
  <input
    type="number"
    min="0"
    step="0.01"
    value={costo}
    onChange={(evento) => setCosto(evento.target.value)}
    placeholder="Ejemplo: 300"
    className="w-full rounded-xl border border-slate-300 p-4"
  />
</div>
          <div className="hidden">
  <label className="mb-2 block font-bold">Utilidad</label>

  <input
    type="number"
    value={precio && costo ? Number(precio) - Number(costo) : ""}
    readOnly
    placeholder="Se calcula automáticamente"
    className="w-full rounded-xl border border-slate-300 bg-slate-100 p-4"
  />
</div>
<div>
  <label className="mb-2 block font-bold">Existencia</label>

  <input
    type="number"
    min="0"
    step="1"
    value={existencia}
    onChange={(evento) => setExistencia(evento.target.value)}
    placeholder="Ejemplo: 10"
    className="w-full rounded-xl border border-slate-300 p-4"
  />
</div>
          <button
            type="submit"
            className="w-full rounded-xl bg-pink-600 px-6 py-4 font-bold text-white"
          >
            Guardar producto
          </button>
        </form>

        {mensaje && (
          <p className="mt-6 text-center font-bold text-pink-600">
            {mensaje}
          </p>
        )}

        <a
          href="/catalogo"
          className="mt-6 block text-center font-bold text-pink-600"
        >
          Ver catálogo
        </a>
      </div>
    </main>
  );
}