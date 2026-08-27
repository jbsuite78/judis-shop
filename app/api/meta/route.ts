import { NextResponse } from "next/server";

const GRAPH_VERSION = "v26.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export async function POST(request: Request) {
  try {
    const { imageUrl, caption } = await request.json();

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
    facebookBody.append("url", imageUrl);
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

    // INSTAGRAM - CREAR CONTENEDOR
    const instagramBody = new URLSearchParams();
    instagramBody.append("image_url", imageUrl);
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