import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   CARGAR VARIABLES DE ENTORNO
========================================================= */

function cargarEnv(nombreArchivo: string) {
  const ruta = path.join(
    process.cwd(),
    nombreArchivo
  );

  if (!fs.existsSync(ruta)) {
    return;
  }

  const contenido =
    fs.readFileSync(ruta, "utf8");

  const lineas =
    contenido.split(/\r?\n/);

  for (const lineaOriginal of lineas) {
    const linea =
      lineaOriginal.trim();

    if (
      !linea ||
      linea.startsWith("#")
    ) {
      continue;
    }

    const posicionIgual =
      linea.indexOf("=");

    if (posicionIgual === -1) {
      continue;
    }

    const clave =
      linea
        .slice(
          0,
          posicionIgual
        )
        .trim();

    let valor =
      linea
        .slice(
          posicionIgual + 1
        )
        .trim();

    if (
      (
        valor.startsWith('"') &&
        valor.endsWith('"')
      ) ||
      (
        valor.startsWith("'") &&
        valor.endsWith("'")
      )
    ) {
      valor =
        valor.slice(1, -1);
    }

    if (!process.env[clave]) {
      process.env[clave] =
        valor;
    }
  }
}

cargarEnv(".env");
cargarEnv(".env.local");
cargarEnv(
  ".env-vercel-production"
);

/* =========================================================
   VARIABLES
========================================================= */

const DATABASE_URL =
  process.env.DATABASE_URL;

const SUPABASE_URL =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL."
  );
}

if (!SUPABASE_URL) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_URL."
  );
}

if (
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    "Falta SUPABASE_SERVICE_ROLE_KEY."
  );
}

/* =========================================================
   PRISMA
========================================================= */

const adapter =
  new PrismaPg({
    connectionString:
      DATABASE_URL,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

/* =========================================================
   SUPABASE
========================================================= */

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

const BUCKET = "productos";

/* =========================================================
   UTILIDADES
========================================================= */

function esBase64(
  valor: unknown
): valor is string {
  return (
    typeof valor ===
      "string" &&
    valor.startsWith(
      "data:image/"
    )
  );
}

function obtenerExtension(
  mime: string
) {
  switch (mime) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    case "image/heic":
      return "heic";

    case "image/heif":
      return "heif";

    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}

function convertirBase64(
  dataUrl: string
) {
  /*
    Evitamos usar la bandera /s
    para que funcione con tu
    configuración actual de TypeScript.
  */
  const coincidencia =
    dataUrl.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/
    );

  if (!coincidencia) {
    throw new Error(
      "Formato Base64 inválido."
    );
  }

  const mime =
    coincidencia[1];

  const contenido =
    coincidencia[2];

  const buffer =
    Buffer.from(
      contenido,
      "base64"
    );

  return {
    mime,
    buffer,
  };
}

/* =========================================================
   BUCKET
========================================================= */

async function asegurarBucket() {
  const {
    data,
    error,
  } =
    await supabase.storage
      .listBuckets();

  if (error) {
    throw new Error(
      `Error consultando Storage: ${error.message}`
    );
  }

  const existe =
    data?.some(
      (bucket) =>
        bucket.name ===
        BUCKET
    ) ?? false;

  if (!existe) {
    const {
      error: errorCrear,
    } =
      await supabase.storage
        .createBucket(
          BUCKET,
          {
            public: true,
          }
        );

    if (errorCrear) {
      throw new Error(
        `No se pudo crear el bucket: ${errorCrear.message}`
      );
    }

    console.log(
      `✅ Bucket "${BUCKET}" creado.`
    );

    return;
  }

  console.log(
    `✅ Bucket "${BUCKET}" encontrado.`
  );
}

/* =========================================================
   SUBIR UNA FOTO
========================================================= */

async function subirFoto(
  dataUrl: string,
  productoId: number,
  tipo: string
): Promise<string> {
  const {
    mime,
    buffer,
  } =
    convertirBase64(
      dataUrl
    );

  const extension =
    obtenerExtension(mime);

  /*
    Ruta fija.
    Si ejecutamos nuevamente
    la migración, reemplazamos
    el mismo archivo.
  */
  const ruta =
    `migracion/${productoId}/${tipo}.${extension}`;

  const {
    error,
  } =
    await supabase.storage
      .from(BUCKET)
      .upload(
        ruta,
        buffer,
        {
          contentType: mime,
          cacheControl:
            "31536000",
          upsert: true,
        }
      );

  if (error) {
    throw new Error(
      `Error subiendo ${ruta}: ${error.message}`
    );
  }

  const {
    data,
  } =
    supabase.storage
      .from(BUCKET)
      .getPublicUrl(ruta);

  if (!data.publicUrl) {
    throw new Error(
      `No se obtuvo URL pública para ${ruta}`
    );
  }

  return data.publicUrl;
}

/* =========================================================
   MIGRAR
========================================================= */

async function migrar() {
  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "   MIGRACIÓN DE FOTOS - JUDI'S SHOP"
  );
  console.log(
    "=============================================="
  );
  console.log("");

  await asegurarBucket();

  /*
    Primero obtenemos SOLO los IDs.
    Así no cargamos todas las
    imágenes Base64 en memoria.
  */
  const lista =
    await prisma.producto
      .findMany({
        select: {
          id: true,
        },
        orderBy: {
          id: "asc",
        },
      });

  console.log(
    `📦 Productos encontrados: ${lista.length}`
  );

  console.log("");

  let productosMigrados = 0;
  let productosSinCambios =
    0;
  let fotosMigradas = 0;
  let errores = 0;

  for (
    let indice = 0;
    indice < lista.length;
    indice++
  ) {
    const id =
      lista[indice].id;

    console.log(
      `[${indice + 1}/${lista.length}] Producto ID ${id}`
    );

    try {
      /*
        Cargamos únicamente
        un producto cada vez.
      */
      const producto =
        await prisma.producto
          .findUnique({
            where: {
              id,
            },

            select: {
              id: true,
              nombre: true,
              imagen: true,
              imagenes: true,
            },
          });

      if (!producto) {
        console.log(
          "   ⚠️ Producto no encontrado."
        );

        continue;
      }

      let nuevaImagen:
        string | null =
        producto.imagen;

      const nuevasImagenes:
        string[] =
        Array.isArray(
          producto.imagenes
        )
          ? [
              ...producto.imagenes,
            ]
          : [];

      let huboCambio = false;

      /* ========================
         FOTO PRINCIPAL
      ======================== */

      if (
        esBase64(
          producto.imagen
        )
      ) {
        console.log(
          "   ⬆️ Subiendo foto principal..."
        );

        nuevaImagen =
          await subirFoto(
            producto.imagen,
            producto.id,
            "principal"
          );

        huboCambio = true;
        fotosMigradas++;

        console.log(
          "   ✅ Foto principal subida."
        );
      }

      /* ========================
         FOTOS ADICIONALES
      ======================== */

      for (
        let fotoIndice = 0;
        fotoIndice <
        nuevasImagenes.length;
        fotoIndice++
      ) {
        const foto =
          nuevasImagenes[
            fotoIndice
          ];

        if (
          !esBase64(foto)
        ) {
          continue;
        }

        console.log(
          `   ⬆️ Subiendo foto adicional ${
            fotoIndice + 1
          }...`
        );

        const nuevaUrl =
          await subirFoto(
            foto,
            producto.id,
            `extra-${
              fotoIndice + 1
            }`
          );

        nuevasImagenes[
          fotoIndice
        ] = nuevaUrl;

        huboCambio = true;
        fotosMigradas++;

        console.log(
          `   ✅ Foto adicional ${
            fotoIndice + 1
          } subida.`
        );
      }

      /* ========================
         ACTUALIZAR PRODUCTO
      ======================== */

      if (huboCambio) {
        /*
          Primero subimos las fotos.

          Solamente después
          sustituimos Base64
          por URLs en Prisma.
        */
        await prisma.producto
          .update({
            where: {
              id:
                producto.id,
            },

            data: {
              imagen:
                nuevaImagen,

              imagenes:
                nuevasImagenes,
            },
          });

        productosMigrados++;

        console.log(
          `   ✅ ${producto.nombre} migrado correctamente.`
        );
      } else {
        productosSinCambios++;

        console.log(
          "   ✓ No necesita migración."
        );
      }
    } catch (error) {
      errores++;

      console.error(
        `   ❌ ERROR producto ${id}:`
      );

      if (
        error instanceof Error
      ) {
        console.error(
          `   ${error.message}`
        );
      } else {
        console.error(
          error
        );
      }
    }

    console.log("");
  }

  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "          MIGRACIÓN TERMINADA"
  );
  console.log(
    "=============================================="
  );
  console.log("");

  console.log(
    `📦 Productos revisados: ${lista.length}`
  );

  console.log(
    `✅ Productos migrados: ${productosMigrados}`
  );

  console.log(
    `🖼️ Fotos migradas: ${fotosMigradas}`
  );

  console.log(
    `✓ Sin cambios: ${productosSinCambios}`
  );

  console.log(
    `❌ Errores: ${errores}`
  );

  console.log("");
}

/* =========================================================
   INICIO
========================================================= */

async function main() {
  try {
    await migrar();
  } catch (error) {
    console.error("");
    console.error(
      "❌ ERROR GENERAL:"
    );

    if (
      error instanceof Error
    ) {
      console.error(
        error.message
      );
    } else {
      console.error(
        error
      );
    }

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();