import { isAdminMutation, unauthorizedResponse } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = "productos";

function obtenerSupabase() {
  if (!SUPABASE_URL) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function asegurarBucket() {
  const supabase = obtenerSupabase();

  const { data, error } =
    await supabase.storage.listBuckets();

  if (error) {
    throw error;
  }

  const existe = data?.some(
    (bucket) =>
      bucket.name === BUCKET
  );

  if (!existe) {
    const { error: errorCrear } =
      await supabase.storage.createBucket(
        BUCKET,
        {
          public: true,
        }
      );

    if (errorCrear) {
      throw errorCrear;
    }
  }
}

export async function POST(
  request: Request
) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {

    const formulario =
      await request.formData();

    const archivo =
      formulario.get("archivo");

    if (!(archivo instanceof File)) {
      return Response.json(
        {
          error:
            "No se recibió una imagen.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      archivo.size >
      3_500_000
    ) {
      return Response.json(
        {
          error:
            "La imagen todavía es demasiado grande.",
        },
        {
          status: 413,
        }
      );
    }

    const permitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!permitidos.includes(archivo.type)) {
      return Response.json({ error: "Formato de imagen no permitido. Usa JPG, PNG o WebP." }, { status: 400 });
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const jpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const webp = buffer.length > 12 && buffer.toString("ascii",0,4) === "RIFF" && buffer.toString("ascii",8,12) === "WEBP";
    if (!((archivo.type === "image/jpeg" && jpeg) || (archivo.type === "image/png" && png) || (archivo.type === "image/webp" && webp))) {
      return Response.json({ error: "El archivo no contiene una imagen válida." }, { status: 400 });
    }
    await asegurarBucket();

    let extension = "jpg";

    if (
      archivo.type ===
      "image/png"
    ) {
      extension = "png";
    }

    if (
      archivo.type ===
      "image/webp"
    ) {
      extension = "webp";
    }

    const nombreArchivo =
      `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const ruta =
      `productos/${nombreArchivo}`;

    const supabase =
      obtenerSupabase();

    const { error } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          ruta,
          buffer,
          {
            contentType:
              archivo.type ||
              "image/jpeg",

            cacheControl:
              "31536000",

            upsert: false,
          }
        );

    if (error) {
      throw error;
    }

    const {
      data: datosPublicos,
    } =
      supabase.storage
        .from(BUCKET)
        .getPublicUrl(ruta);

    return Response.json({
      ok: true,
      url:
        datosPublicos.publicUrl,
    });
  } catch (error) {
    console.error(
      "ERROR SUBIENDO IMAGEN:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}