import fs from "node:fs";

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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
}

const respuesta = await fetch(
  "https://www.judisshop.com.mx/api/productos"
);

if (!respuesta.ok) {
  throw new Error("No se pudieron obtener los productos de Judi's");
}

const productos = await respuesta.json();

const pendientes = productos.filter(
  (producto) =>
    typeof producto.imagen === "string" &&
    producto.imagen.startsWith("data:image/")
);

console.log(`Productos totales: ${productos.length}`);
console.log(`Imágenes pendientes de migrar: ${pendientes.length}`);
console.log("");

let correctos = 0;
let errores = 0;

for (const producto of pendientes) {
  try {
    const coincidencia = producto.imagen.match(
      /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s
    );

    if (!coincidencia) {
      console.log(
        `⚠️ ID ${producto.id} - formato no compatible, omitido`
      );
      errores++;
      continue;
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

    const ruta =
      `productos/${producto.id}/principal.${extension}`;

    const uploadUrl =
      `${supabaseUrl}/storage/v1/object/product-images/${ruta}`;

    const subida = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": mime,
        "x-upsert": "true",
      },
      body: archivo,
    });

    if (!subida.ok) {
      const detalle = await subida.text();
      throw new Error(`Storage: ${detalle}`);
    }

    const publicUrl =
      `${supabaseUrl}/storage/v1/object/public/product-images/${ruta}`;

    const actualizar = await fetch(
      "https://www.judisshop.com.mx/api/productos",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...producto,
          imagen: publicUrl,
        }),
      }
    );

    if (!actualizar.ok) {
      const detalle = await actualizar.text();
      throw new Error(`API Judi's: ${detalle}`);
    }

    correctos++;

    console.log(
      `✅ ${correctos}/${pendientes.length} - ID ${producto.id} - ${producto.nombre}`
    );
  } catch (error) {
    errores++;

    console.log(
      `❌ ID ${producto.id} - ${producto.nombre}: ${error.message}`
    );
  }
}

console.log("");
console.log("====================================");
console.log("MIGRACIÓN TERMINADA");
console.log(`✅ Correctos: ${correctos}`);
console.log(`❌ Errores: ${errores}`);
console.log("====================================");