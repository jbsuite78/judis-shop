import { NextResponse } from "next/server";
import sharp from "sharp";
const GRAPH_VERSION = "v26.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
async function convertirBase64AUrlPublica(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Imagen base64 inválida");
  }

  const mimeType = match[1];
  const contenidoBase64 = match[2];

  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
      ? "webp"
      : "jpg";

  const buffer = Buffer.from(contenidoBase64, "base64");

  const nombreArchivo = `redes/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const respuesta = await fetch(
    `${SUPABASE_URL}/storage/v1/object/product-images/${nombreArchivo}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: buffer,
    }
  );

  if (!respuesta.ok) {
    const error = await respuesta.text();
    throw new Error(`Error subiendo imagen a Supabase: ${error}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${nombreArchivo}`;
}
export async function POST(request: Request) {
  try {
   const { imageUrl, caption, productoId } = await request.json();

const publicImageUrl = await convertirBase64AUrlPublica(imageUrl);
let instagramImageUrl = publicImageUrl;
    const pageId = process.env.META_PAGE_ID;
    const instagramId = process.env.META_INSTAGRAM_ID;
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;

    if (!pageId || !instagramId || !accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan variables de Meta en .env.local",
        },
        { status: 500 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta imageUrl",
        },
        { status: 400 }
      );
    }

    const texto =
      caption?.trim() || "Disponible en Judi's Shop 🛍️";

    // FACEBOOK
    const facebookBody = new URLSearchParams();
  facebookBody.append("url", publicImageUrl);
    facebookBody.append("caption", texto);
    facebookBody.append("access_token", accessToken);

    const facebookResponse = await fetch(
      `${GRAPH_URL}/${pageId}/photos`,
      {
        method: "POST",
        body: facebookBody,
      }
    );

    const facebookData = await facebookResponse.json();
    console.log("ERROR FACEBOOK:", JSON.stringify(facebookData, null, 2));

    if (!facebookResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          platform: "facebook",
          error: facebookData,
        },
        { status: facebookResponse.status }
      );
    }
try {
  const imagenResponse = await fetch(imageUrl);

  if (imagenResponse.ok) {
    const imagenBuffer = Buffer.from(await imagenResponse.arrayBuffer());
    const metadata = await sharp(imagenBuffer).metadata();

    if (metadata.width && metadata.height) {
      const proporcion = metadata.width / metadata.height;

      // Instagram acepta aproximadamente desde 4:5 hasta 1.91:1
      if (proporcion < 0.8 || proporcion > 1.91) {
        const imagenCorregida = await sharp(imagenBuffer)
          .resize(1080, 1350, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255 },
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        const nombreArchivo = `social-ready/${productoId ?? Date.now()}-${Date.now()}.jpg`;

        const uploadResponse = await fetch(
          `${SUPABASE_URL}/storage/v1/object/product-images/${nombreArchivo}`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "image/jpeg",
              "x-upsert": "true",
            },
            body: new Uint8Array(imagenCorregida),
          }
        );

        if (uploadResponse.ok) {
          instagramImageUrl =
            `${SUPABASE_URL}/storage/v1/object/public/product-images/${nombreArchivo}`;
        } else {
          console.error(
            "ERROR SUBIENDO IMAGEN CORREGIDA:",
            await uploadResponse.text()
          );
        }
      }
    }
  }
} catch (error) {
  console.error("ERROR PREPARANDO IMAGEN PARA INSTAGRAM:", error);
}

    // INSTAGRAM - CREAR CONTENEDOR
    const instagramBody = new URLSearchParams();
    instagramBody.append("image_url", instagramImageUrl);
    instagramBody.append("caption", texto);
    instagramBody.append("access_token", accessToken);

    const containerResponse = await fetch(
      `${GRAPH_URL}/${instagramId}/media`,
      {
        method: "POST",
        body: instagramBody,
      }
    );

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || !containerData.id) {
      console.log("ERROR INSTAGRAM CONTAINER:", JSON.stringify(containerData, null, 2));
      return NextResponse.json(
        {
          ok: false,
          platform: "instagram-container",
          error: containerData,
        },
        { status: containerResponse.status }
      );
    }

    // INSTAGRAM - PUBLICAR
    let listo = false;

for (let intento = 0; intento < 10; intento++) {
  const statusResponse = await fetch(
    `${GRAPH_URL}/${containerData.id}?fields=status_code&access_token=${accessToken}`
  );

  const statusData = await statusResponse.json();

  console.log("ESTADO INSTAGRAM:", statusData);

  if (statusData.status_code === "FINISHED") {
    listo = true;
    break;
  }

  if (statusData.status_code === "ERROR") {
    return NextResponse.json(
      {
        ok: false,
        platform: "instagram-processing",
        error: statusData,
      },
      { status: 400 }
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
}

if (!listo) {
  return NextResponse.json(
    {
      ok: false,
      platform: "instagram-processing",
      error: "Instagram tardó demasiado en procesar la imagen",
    },
    { status: 408 }
  );
}
    const publishBody = new URLSearchParams();
    publishBody.append("creation_id", containerData.id);
    publishBody.append("access_token", accessToken);

    const publishResponse = await fetch(
      `${GRAPH_URL}/${instagramId}/media_publish`,
      {
        method: "POST",
        body: publishBody,
      }
    );

    const publishData = await publishResponse.json();
    console.log("ERROR INSTAGRAM PUBLISH:", JSON.stringify(publishData, null, 2));

    if (!publishResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          platform: "instagram-publish",
          error: publishData,
        },
        { status: publishResponse.status }
      );
    }
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (productoId && supabaseUrl && supabaseKey) {
  const registroResponse = await fetch(
    `${supabaseUrl}/rest/v1/publicaciones_redes`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        producto_id: String(productoId),
        estado: "publicado",
      }),
    }
  );

  if (!registroResponse.ok) {
    const registroError = await registroResponse.text();
    console.error("ERROR REGISTRO SUPABASE:", registroError);
  }
}

    return NextResponse.json({
      ok: true,
      facebook: facebookData,
      instagram: publishData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido",
      },
      { status: 500 }
    );
  }
}