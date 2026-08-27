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

let imagenesMigradas = 0;
let productosActualizados = 0;
let errores = 0;

for (const producto of productos) {
  const imagenesActuales = Array.isArray(producto.imagenes)
    ? producto.imagenes
    : [];

  const tieneBase64 = imagenesActuales.some(
    (imagen) =>
      typeof imagen === "string" &&
      imagen.startsWith("data:image/")
  );

  if (!tieneBase64) continue;

  try {
    const nuevasImagenes = [];

    for (let i = 0; i < imagenesActuales.length; i++) {
      const imagen = imagenesActuales[i];

      if (
        typeof imagen !== "string" ||
        !imagen.startsWith("data:image/")
      ) {
        nuevasImagenes.push(imagen);
        continue;
      }

      const coincidencia = imagen.match(
        /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s
      );

      if (!coincidencia) {
        throw new Error(
          `Formato no compatible en imagen adicional ${i + 1}`
        );
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
        `productos/${producto.id}/adicional-${i + 1}.${extension}`;

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

      nuevasImagenes.push(publicUrl);
      imagenesMigradas++;
    }

    const actualizar = await fetch(
  "http://localhost:3000/api/productos",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...producto,
          imagenes: nuevasImagenes,
        }),
      }
    );

    if (!actualizar.ok) {
      const detalle = await actualizar.text();
      throw new Error(`API Judi's: ${detalle}`);
    }

    productosActualizados++;

    console.log(
      `✅ ID ${producto.id} - ${producto.nombre}`
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
console.log("MIGRACIÓN DE ADICIONALES TERMINADA");
console.log(`✅ Imágenes migradas: ${imagenesMigradas}`);
console.log(`✅ Productos actualizados: ${productosActualizados}`);
console.log(`❌ Errores: ${errores}`);
console.log("====================================");