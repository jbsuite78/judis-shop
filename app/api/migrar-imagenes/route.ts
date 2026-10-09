import { hasAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "productos";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

function obtenerSupabase() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function esBase64(
  valor: unknown
): valor is string {
  return (
    typeof valor === "string" &&
    valor.startsWith("data:image/")
  );
}

function convertirBase64(
  dataUrl: string
) {
  const coma =
    dataUrl.indexOf(",");

  if (coma === -1) {
    throw new Error(
      "Imagen Base64 inválida."
    );
  }

  const encabezado =
    dataUrl.slice(5, coma);

  if (
    !encabezado.includes(
      ";base64"
    )
  ) {
    throw new Error(
      "La imagen no contiene Base64 válido."
    );
  }

  const mime =
    encabezado
      .split(";")[0];

  const contenido =
    dataUrl.slice(
      coma + 1
    );

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

function extensionMime(
  mime: string
) {
  if (
    mime === "image/png"
  ) {
    return "png";
  }

  if (
    mime === "image/webp"
  ) {
    return "webp";
  }

  if (
    mime === "image/gif"
  ) {
    return "gif";
  }

  if (
    mime === "image/heic"
  ) {
    return "heic";
  }

  if (
    mime === "image/heif"
  ) {
    return "heif";
  }

  return "jpg";
}

async function asegurarBucket() {
  const supabase =
    obtenerSupabase();

  const {
    data,
    error,
  } =
    await supabase.storage
      .listBuckets();

  if (error) {
    throw new Error(
      error.message
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
      error: crearError,
    } =
      await supabase.storage
        .createBucket(
          BUCKET,
          {
            public: true,
          }
        );

    if (crearError) {
      throw new Error(
        crearError.message
      );
    }
  } else {
    const {
      error: actualizarError,
    } =
      await supabase.storage
        .updateBucket(
          BUCKET,
          {
            public: true,
          }
        );

    if (
      actualizarError
    ) {
      throw new Error(
        actualizarError
          .message
      );
    }
  }
}

async function subirFoto(
  dataUrl: string,
  productoId: number,
  nombre: string
) {
  const {
    mime,
    buffer,
  } =
    convertirBase64(
      dataUrl
    );

  const extension =
    extensionMime(mime);

  const ruta =
    `migracion/${productoId}/${nombre}.${extension}`;

  const supabase =
    obtenerSupabase();

  const {
    error,
  } =
    await supabase.storage
      .from(BUCKET)
      .upload(
        ruta,
        buffer,
        {
          contentType:
            mime,
          cacheControl:
            "31536000",
          upsert: true,
        }
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const {
    data,
  } =
    supabase.storage
      .from(BUCKET)
      .getPublicUrl(
        ruta
      );

  return data.publicUrl;
}

function paginaHtml(
  contenido: string,
  siguiente:
    | string
    | null
) {
  const recarga =
    siguiente
      ? `<meta http-equiv="refresh" content="1;url=${siguiente}">`
      : "";

  return new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${recarga}
<title>Migración Judi's Shop</title>
</head>

<body style="
font-family:Arial,sans-serif;
padding:30px;
background:#f8fafc;
color:#0f172a;
">

<h1>
Migración de fotos Judi's Shop
</h1>

<div style="
white-space:pre-wrap;
font-size:18px;
line-height:1.6;
">
${contenido}
</div>

</body>
</html>`,
    {
      status: 200,

      headers: {
        "Content-Type":
          "text/html; charset=utf-8",

        "Cache-Control":
          "no-store",
      },
    }
  );
}

export async function GET(
  request: Request
) {
  if (!hasAdminSession(request)) return unauthorizedResponse();
  const url = new URL(request.url);

  const after =
    Number(
      url.searchParams.get(
        "after"
      ) ?? "0"
    );

  try {
    await asegurarBucket();

    /*
      Procesamos solamente
      5 productos por llamada.
      El navegador irá avanzando
      automáticamente.
    */
    const lista =
      await prisma.producto
        .findMany({
          where: {
            id: {
              gt:
                Number.isNaN(
                  after
                )
                  ? 0
                  : after,
            },
          },

          orderBy: {
            id: "asc",
          },

          take: 5,

          select: {
            id: true,
          },
        });

    if (
      lista.length === 0
    ) {
      return paginaHtml(
        "✅ MIGRACIÓN TERMINADA\n\nYa se revisaron todos los productos.\n\nAhora podemos restaurar las fotografías en el catálogo.",
        null
      );
    }

    const mensajes:
      string[] = [];

    for (
      const item of lista
    ) {
      try {
        const producto =
          await prisma.producto
            .findUnique({
              where: {
                id:
                  item.id,
              },

              select: {
                id: true,
                nombre: true,
                imagen: true,
                imagenes:
                  true,
              },
            });

        if (!producto) {
          continue;
        }

        let imagen =
          producto.imagen;

        const imagenes:
          string[] =
          Array.isArray(
            producto.imagenes
          )
            ? [
                ...producto.imagenes,
              ]
            : [];

        let cambio =
          false;

        let fotos =
          0;

        if (
          esBase64(
            imagen
          )
        ) {
          imagen =
            await subirFoto(
              imagen,
              producto.id,
              "principal"
            );

          cambio = true;
          fotos++;
        }

        for (
          let i = 0;
          i <
          imagenes.length;
          i++
        ) {
          if (
            !esBase64(
              imagenes[i]
            )
          ) {
            continue;
          }

          imagenes[i] =
            await subirFoto(
              imagenes[i],
              producto.id,
              `extra-${i + 1}`
            );

          cambio = true;
          fotos++;
        }

        if (cambio) {
          await prisma.producto
            .update({
              where: {
                id:
                  producto.id,
              },

              data: {
                imagen,
                imagenes,
              },
            });

          mensajes.push(
            `✅ ${producto.id} - ${producto.nombre}: ${fotos} foto(s) migrada(s)`
          );
        } else {
          mensajes.push(
            `✓ ${producto.id} - ${producto.nombre}: sin cambios`
          );
        }
      } catch (error) {
        mensajes.push(
          `❌ Producto ${item.id}: ${
            error instanceof
            Error
              ? error.message
              : "Error desconocido"
          }`
        );
      }
    }

    const ultimoId =
      lista[
        lista.length - 1
      ].id;

    const siguienteProducto =
      await prisma.producto
        .findFirst({
          where: {
            id: {
              gt:
                ultimoId,
            },
          },

          select: {
            id: true,
          },
        });

    if (
      !siguienteProducto
    ) {
      mensajes.push("");
      mensajes.push(
        "✅ MIGRACIÓN TERMINADA"
      );

      mensajes.push(
        "Todas las fotografías fueron revisadas."
      );

      return paginaHtml(
        mensajes.join(
          "\n"
        ),
        null
      );
    }

    mensajes.push("");
    mensajes.push(
      "⏳ Continuando automáticamente..."
    );

    const siguiente = `/api/migrar-imagenes?after=${ultimoId}`;

    return paginaHtml(
      mensajes.join("\n"),
      siguiente
    );
  } catch (error) {
    console.error(
      "ERROR MIGRACIÓN:",
      error
    );

    return paginaHtml(
      `❌ ERROR\n\n${
        error instanceof Error
          ? error.message
          : "Error desconocido"
      }`,
      null
    );
  }
}