"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

const categorias = [
  "Bolsas y Carteras",
  "Perfumes",
  "Calzado",
  "Belleza",
  "Salud y Bienestar",
  "Ropa",
  "Accesorios",
  "Artículos para Caballero",
  "Joyería, Bisutería y Relojes",
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

async function cargarImagen(
  archivo: File
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();

    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagen);
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "No se pudo procesar la imagen."
        )
      );
    };

    imagen.src = url;
  });
}

async function comprimirImagen(
  archivo: File
): Promise<File> {
  const imagen =
    await cargarImagen(archivo);

  const maximo = 1600;

  let ancho = imagen.width;
  let alto = imagen.height;

  if (
    ancho > maximo ||
    alto > maximo
  ) {
    const escala = Math.min(
      maximo / ancho,
      maximo / alto
    );

    ancho = Math.round(
      ancho * escala
    );

    alto = Math.round(
      alto * escala
    );
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = ancho;
  canvas.height = alto;

  const contexto =
    canvas.getContext("2d");

  if (!contexto) {
    throw new Error(
      "No se pudo preparar la fotografía."
    );
  }

  contexto.fillStyle = "#ffffff";

  contexto.fillRect(
    0,
    0,
    ancho,
    alto
  );

  contexto.drawImage(
    imagen,
    0,
    0,
    ancho,
    alto
  );

  const blob =
    await new Promise<Blob>(
      (resolve, reject) => {
        canvas.toBlob(
          (resultado) => {
            if (!resultado) {
              reject(
                new Error(
                  "No se pudo comprimir la fotografía."
                )
              );

              return;
            }

            resolve(resultado);
          },
          "image/jpeg",
          0.8
        );
      }
    );

  const nombre =
    archivo.name.replace(
      /\.[^/.]+$/,
      ""
    );

  return new File(
    [blob],
    `${nombre}.jpg`,
    {
      type: "image/jpeg",
    }
  );
}

async function subirImagen(
  archivo: File
): Promise<string> {
  const archivoComprimido =
    await comprimirImagen(
      archivo
    );

  const formulario =
    new FormData();

  formulario.append(
    "archivo",
    archivoComprimido
  );

  const respuesta =
    await fetch(
      "/api/upload-producto",
      {
        method: "POST",
        body: formulario,
      }
    );

  const datos =
    await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error ||
        "No se pudo subir la fotografía."
    );
  }

  return datos.url;
}

export default function AgregarProducto() {
  const [nombre, setNombre] =
    useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  const [precio, setPrecio] =
    useState("");

  const [costo, setCosto] =
    useState("");

  const [
    existencia,
    setExistencia,
  ] = useState("");

  const [
    archivos,
    setArchivos,
  ] = useState<File[]>([]);

  const [
    vistasPrevias,
    setVistasPrevias,
  ] = useState<string[]>([]);

  const [marca, setMarca] =
    useState("Sin marca");

  const [
    categoria,
    setCategoria,
  ] = useState(
    "Bolsas y Carteras"
  );

  const [mensaje, setMensaje] =
    useState("");

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  function seleccionarImagen(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const nuevosArchivos =
      Array.from(
        evento.target.files ?? []
      );

    if (
      nuevosArchivos.length === 0
    ) {
      return;
    }

    vistasPrevias.forEach(
      (url) =>
        URL.revokeObjectURL(url)
    );

    setArchivos(
      nuevosArchivos
    );

    const nuevasVistas =
      nuevosArchivos.map(
        (archivo) =>
          URL.createObjectURL(
            archivo
          )
      );

    setVistasPrevias(
      nuevasVistas
    );
  }

  async function guardarProducto(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (
      archivos.length === 0 ||
      !nombre.trim() ||
      !costo ||
      !existencia
    ) {
      setMensaje(
        "Completa la fotografía, el nombre, el costo y la existencia."
      );

      return;
    }

    const precioNumero =
      Number(precio);

    const costoNumero =
      Number(costo);

    const existenciaNumero =
      Number(existencia);

    const utilidadCalculada =
      precioNumero -
      costoNumero;

    if (
      Number.isNaN(precioNumero) ||
      precioNumero < 0
    ) {
      setMensaje(
        "Escribe un precio válido."
      );

      return;
    }

    if (
      Number.isNaN(costoNumero) ||
      costoNumero < 0
    ) {
      setMensaje(
        "Escribe un costo válido."
      );

      return;
    }

    if (
      Number.isNaN(
        existenciaNumero
      ) ||
      existenciaNumero < 0
    ) {
      setMensaje(
        "Escribe una existencia válida."
      );

      return;
    }

    try {
      setGuardando(true);

      setMensaje(
        "Subiendo fotografías..."
      );

      const urls =
        await Promise.all(
          archivos.map(
            (archivo) =>
              subirImagen(
                archivo
              )
          )
        );

      const imagen =
        urls[0];

      const imagenesExtra =
        urls.slice(1);

      setMensaje(
        "Guardando producto..."
      );

      const respuesta =
        await fetch(
          "/api/productos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nombre:
                nombre.trim(),

              descripcion:
                descripcion.trim(),

              precio:
                precioNumero,

              costo:
                costoNumero,

              existencia:
                existenciaNumero,

              utilidad:
                utilidadCalculada,

              imagen,

              imagenesExtra,

              marca,

              categoria,
            }),
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "Error al guardar el producto."
        );
      }

      vistasPrevias.forEach(
        (url) =>
          URL.revokeObjectURL(
            url
          )
      );

      setNombre("");
      setDescripcion("");
      setPrecio("");
      setCosto("");
      setExistencia("");
      setArchivos([]);
      setVistasPrevias([]);
      setMarca("Sin marca");

      setCategoria(
        "Bolsas y Carteras"
      );

      setMensaje(
        "✅ Producto guardado correctamente."
      );
    } catch (error) {
      console.error(error);

      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al guardar el producto."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl">
        <p className="font-bold uppercase tracking-widest text-pink-600">
          Judi&apos;s Shop
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Agregar producto
        </h1>

        <p className="mt-2 text-slate-500">
          Captura los datos del producto y selecciona su categoría y marca.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={
            guardarProducto
          }
        >
          <div>
            <label className="mb-2 block font-bold">
              Fotografía
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={
                seleccionarImagen
              }
              className="w-full rounded-xl border border-slate-300 p-4"
            />

            <p className="mt-2 text-sm text-slate-500">
              La primera fotografía será la imagen principal.
            </p>
          </div>

          {vistasPrevias.length >
            0 && (
            <div>
              <div className="flex justify-center rounded-2xl bg-pink-50 p-4">
                <img
                  src={
                    vistasPrevias[0]
                  }
                  alt="Vista previa del producto"
                  className="max-h-64 rounded-xl object-contain"
                />
              </div>

              {vistasPrevias.length >
                1 && (
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  {vistasPrevias
                    .slice(1)
                    .map(
                      (
                        foto,
                        index
                      ) => (
                        <img
                          key={
                            index
                          }
                          src={
                            foto
                          }
                          alt={`Foto adicional ${
                            index +
                            1
                          }`}
                          className="h-24 w-24 rounded-xl border object-cover"
                        />
                      )
                    )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block font-bold">
              Nombre del producto
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(
                evento
              ) =>
                setNombre(
                  evento.target
                    .value
                )
              }
              placeholder="Ejemplo: Bolsa Guess"
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Descripción
            </label>

            <textarea
              value={
                descripcion
              }
              onChange={(
                evento
              ) =>
                setDescripcion(
                  evento.target
                    .value
                )
              }
              placeholder="Ejemplo: Bolsa para dama en color negro, cadena dorada y diseño elegante."
              rows={3}
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Categoría
            </label>

            <select
              value={
                categoria
              }
              onChange={(
                evento
              ) =>
                setCategoria(
                  evento.target
                    .value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-4"
            >
              {categorias.map(
                (
                  categoriaOpcion
                ) => (
                  <option
                    key={
                      categoriaOpcion
                    }
                    value={
                      categoriaOpcion
                    }
                  >
                    {
                      categoriaOpcion
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Marca
            </label>

            <select
              value={marca}
              onChange={(
                evento
              ) =>
                setMarca(
                  evento.target
                    .value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-4"
            >
              {marcas.map(
                (marcaOpcion) => (
                  <option
                    key={
                      marcaOpcion
                    }
                    value={
                      marcaOpcion
                    }
                  >
                    {
                      marcaOpcion
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Precio
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(
                evento
              ) =>
                setPrecio(
                  evento.target
                    .value
                )
              }
              placeholder="1000"
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Costo
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={costo}
              onChange={(
                evento
              ) =>
                setCosto(
                  evento.target
                    .value
                )
              }
              placeholder="Ejemplo: 300"
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          <div className="hidden">
            <label className="mb-2 block font-bold">
              Utilidad
            </label>

            <input
              type="number"
              value={
                precio &&
                costo
                  ? Number(
                      precio
                    ) -
                    Number(
                      costo
                    )
                  : ""
              }
              readOnly
              placeholder="Se calcula automáticamente"
              className="w-full rounded-xl border border-slate-300 bg-slate-100 p-4"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Existencia
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={
                existencia
              }
              onChange={(
                evento
              ) =>
                setExistencia(
                  evento.target
                    .value
                )
              }
              placeholder="Ejemplo: 10"
              className="w-full rounded-xl border border-slate-300 p-4"
            />
          </div>

          <button
            type="submit"
            disabled={
              guardando
            }
            className="w-full rounded-xl bg-pink-600 px-6 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : "Guardar producto"}
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