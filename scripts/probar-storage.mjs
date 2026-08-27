import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function leerEnv(ruta) {
  const contenido = fs.readFileSync(ruta, "utf8");
  const env = {};

  for (const linea of contenido.split(/\r?\n/)) {
    const texto = linea.trim();

    if (!texto || texto.startsWith("#")) continue;

    const posicion = texto.indexOf("=");
    if (posicion === -1) continue;

    const clave = texto.slice(0, posicion).trim();
    let valor = texto.slice(posicion + 1).trim();

    valor = valor.replace(/^["']|["']$/g, "");
    env[clave] = valor;
  }

  return env;
}

const env = leerEnv(".env.local");

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local"
  );
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const respuesta = await fetch(
  "https://www.judisshop.com.mx/api/productos"
);

if (!respuesta.ok) {
  throw new Error("No se pudieron obtener los productos de Judi's");
}

const productos = await respuesta.json();

const producto = productos.find(
  (p) =>
    typeof p.imagen === "string" &&
    p.imagen.startsWith("data:image/")
);

if (!producto) {
  throw new Error("No encontré ningún producto con imagen Base64");
}

const coincidencia = producto.imagen.match(
  /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s
);

if (!coincidencia) {
  throw new Error("El formato de la imagen no es compatible");
}

const mime = coincidencia[1];
const base64 = coincidencia[2];

const extension =
  mime === "image/png"
    ? "png"
    : mime === "image/webp"
    ? "webp"
    : "jpg";

const archivo = Buffer.from(base64, "base64");

const ruta = `prueba/producto-${producto.id}-${Date.now()}.${extension}`;

const uploadUrl =
  `${supabaseUrl}/storage/v1/object/product-images/${ruta}`;

const subida = await fetch(uploadUrl, {
  method: "POST",
  headers: {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  "Content-Type": mime,
  "x-upsert": "false",
},
  body: archivo,
});

if (!subida.ok) {
  const detalle = await subida.text();
  throw new Error(`Error al subir imagen: ${detalle}`);
}

const data = {
  publicUrl:
    `${supabaseUrl}/storage/v1/object/public/product-images/${ruta}`,
};
const actualizar = await fetch(
  "https://www.judisshop.com.mx/api/productos",
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...producto,
      imagen: data.publicUrl,
    }),
  }
);

if (!actualizar.ok) {
  const detalle = await actualizar.text();
  throw new Error(`No se pudo actualizar el producto: ${detalle}`);
}

console.log("✅ PRODUCTO ACTUALIZADO");
console.log("ID:", producto.id);
console.log("Nombre:", producto.nombre);
console.log("Nueva imagen:", data.publicUrl);
console.log("✅ PRUEBA CORRECTA");
console.log("Producto:", producto.id, "-", producto.nombre);
console.log("URL:", data.publicUrl);
console.log("La base de datos de Judi's NO fue modificada.");