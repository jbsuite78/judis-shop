"use client";

import { useEffect, useState } from "react";
type Producto = {
  id: string | number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  imageUrl?: string;
};


export default function PublicarPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
const [productoSeleccionado, setProductoSeleccionado] = useState("");
const [publicados, setPublicados] = useState<string[]>([]);

 useEffect(() => {
  const cargarPublicados = async () => {
    try {
      const response = await fetch("/api/publicaciones-redes");
      const data = await response.json();

      if (Array.isArray(data)) {
        setPublicados(data.map((item) => String(item.producto_id)));
      }
    } catch {
      setPublicados([]);
    }
  };

  cargarPublicados();
}, []);

useEffect(() => {
  const cargarProductos = async () => {
    try {
      const response = await fetch("/api/productos");
      const data = await response.json();

      if (Array.isArray(data)) {
        setProductos(data);
      } else if (Array.isArray(data.productos)) {
        setProductos(data.productos);
      }
    } catch {
      setProductos([]);
    }
  };

  cargarProductos();
}, []);
const seleccionarProducto = (id: string) => {
  setProductoSeleccionado(id);

  const producto = productos.find(
    (item) => String(item.id) === id
  );

  if (!producto) return;

  setImageUrl(producto.imagen || producto.imageUrl || "");
  setCaption(
    producto.descripcion?.trim() ||
      `${producto.nombre} disponible en Judi's Shop`
  );
};

  const publicar = async () => {
    try {
      setCargando(true);
      setMensaje("");

      const response = await fetch("/api/meta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          caption,
          productoId: productoSeleccionado,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
  console.error("ERROR API META:", data);
  setMensaje(
    `❌ No se pudo publicar. ${data?.platform ?? ""} ${data?.error?.error?.message ?? data?.error?.message ?? data?.error ?? ""}`
  );
  return;
}

      setMensaje("✅ Publicado correctamente en Facebook e Instagram.");
      if (productoSeleccionado) {
  const nuevosPublicados = [...publicados, productoSeleccionado];
  setPublicados(nuevosPublicados);
  localStorage.setItem(
    "productosPublicadosRedes",
    JSON.stringify(nuevosPublicados)
  );
}
      setImageUrl("");
setCaption("");
    } catch {
      setMensaje("❌ Ocurrió un error al publicar.");
    } finally {
      setCargando(false);
    }
  };

  return (
   <main className="relative z-[9999] min-h-screen bg-white p-6 pointer-events-auto text-black">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-xl border">
        <h1 className="mb-6 text-2xl font-bold">
          📣 Publicar en redes
        </h1>
<label className="mb-2 block font-semibold">
  Seleccionar producto
</label>

<select
  value={productoSeleccionado}
  onChange={(e) => seleccionarProducto(e.target.value)}
  className="relative z-50 mb-5 w-full rounded-lg border p-3 pointer-events-auto bg-white text-black"
>
  <option value="">Selecciona un producto</option>

 {productos.map((producto) => {
  const yaPublicado = publicados.includes(String(producto.id));

  return (
    <option
      key={producto.id}
      value={String(producto.id)}
      disabled={yaPublicado}
    >
      {producto.nombre}
      {yaPublicado ? " ✅ Ya publicado" : ""}
    </option>
  );
})}
</select>
        <label className="mb-2 block font-semibold">
          URL pública de la imagen
        </label>

        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="relative z-50 mb-5 w-full rounded-lg border p-3 pointer-events-auto bg-white text-black"
        />

        <label className="mb-2 block font-semibold">
          Texto de la publicación
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escribe el texto que aparecerá en Facebook e Instagram..."
          rows={6}
          className="relative z-50 mb-5 w-full rounded-lg border p-3 pointer-events-auto bg-white text-black"
        />

        <button
          onClick={publicar}
          disabled={cargando || !imageUrl}
          className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {cargando
            ? "Publicando..."
            : "Publicar en Facebook e Instagram"}
        </button>

        {mensaje && (
          <div className="mt-5 rounded-lg bg-gray-100 p-4">
            {mensaje}
          </div>
        )}
      </div>
    </main>
  );
}