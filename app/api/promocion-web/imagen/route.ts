import {
  NextRequest,
  NextResponse,
} from "next/server";

import sharp from "sharp";

import { readFile } from "fs/promises";

import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Producto = {
  id: string | number;
  nombre?: string | null;
  existencia?: string | number | null;
  imagen?: string | null;
  imagenes?: string[] | null;
};

function obtenerImagen(
  producto: Producto
) {
  if (
    Array.isArray(
      producto.imagenes
    ) &&
    producto.imagenes.length > 0
  ) {
    return producto.imagenes[0];
  }

  return producto.imagen || "";
}

async function obtenerProductos(
  origin: string
) {
  const respuesta =
    await fetch(
      `${origin}/api/productos`,
      {
        cache: "no-store",
      }
    );

  if (!respuesta.ok) {
    throw new Error(
      "No se pudieron obtener los productos."
    );
  }

  const data =
    await respuesta.json();

  const productos: Producto[] =
    Array.isArray(data)
      ? data
      : Array.isArray(
          data?.productos
        )
        ? data.productos
        : [];

  return productos;
}

async function descargarImagen(
  url: string
) {
  if (
    url.startsWith(
      "data:image/"
    )
  ) {
    const posicion =
      url.indexOf(",");

    if (
      posicion === -1
    ) {
      throw new Error(
        "Imagen base64 inválida."
      );
    }

    return Buffer.from(
      url.slice(
        posicion + 1
      ),
      "base64"
    );
  }

  const respuesta =
    await fetch(
      url,
      {
        cache:
          "force-cache",
      }
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      `No fue posible descargar una imagen: ${respuesta.status}`
    );
  }

  return Buffer.from(
    await respuesta.arrayBuffer()
  );
}

async function prepararImagen(
  producto: Producto
) {
  const url =
    obtenerImagen(
      producto
    );

  const ancho = 390;
  const alto = 270;

  if (!url) {
    return sharp({
      create: {
        width: ancho,
        height: alto,
        channels: 4,
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 0,
        },
      },
    })
      .png()
      .toBuffer();
  }

  const buffer =
    await descargarImagen(
      url
    );

  return sharp(
    buffer
  )
    .rotate()
    .resize(
      ancho,
      alto,
      {
        fit: "contain",

        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 0,
        },
      }
    )
    .png()
    .toBuffer();
}

async function cargarPlantilla(
  tema: number
) {
  const numero =
    (Math.abs(tema) % 5) + 1;

  const ruta =
    path.join(
      process.cwd(),
      "public",
      `base-${numero}.jpg`
    );

  try {
    return await readFile(
      ruta
    );
  } catch {
    const respaldo =
      path.join(
        process.cwd(),
        "public",
        "base-1.jpg"
      );

    return await readFile(
      respaldo
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const url =
      new URL(
        request.url
      );

    const ids =
      (
        url.searchParams.get(
          "ids"
        ) || ""
      )
        .split(",")
        .map(
          (id) =>
            id.trim()
        )
        .filter(Boolean)
        .slice(0, 4);

    const tema =
      Number(
        url.searchParams.get(
          "tema"
        ) || 0
      );

    if (
      ids.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Faltan IDs de productos.",
        },
        {
          status: 400,
        }
      );
    }

    const origin =
      url.origin;

    const productos =
      await obtenerProductos(
        origin
      );

    const seleccionados =
      ids
        .map(
          (id) =>
            productos.find(
              (
                producto
              ) =>
                String(
                  producto.id
                ) === id
            )
        )
        .filter(
          Boolean
        ) as Producto[];

    if (
      seleccionados.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "No se encontraron los productos.",
        },
        {
          status: 404,
        }
      );
    }

    const imagenes =
      await Promise.all(
        seleccionados.map(
          (
            producto
          ) =>
            prepararImagen(
              producto
            )
        )
      );

    const plantilla =
      await cargarPlantilla(
        tema
      );

    const posiciones = [
      {
        left: 99,
        top: 385,
      },

      {
        left: 591,
        top: 385,
      },

      {
        left: 99,
        top: 755,
      },

      {
        left: 591,
        top: 755,
      },
    ];

    const capas =
      imagenes.map(
        (
          input,
          index
        ) => ({
          input,

          left:
            posiciones[
              index
            ].left,

          top:
            posiciones[
              index
            ].top,
        })
      );

    const resultado =
      await sharp(
        plantilla
      )
        .resize(
          1080,
          1350,
          {
            fit: "fill",
          }
        )
        .composite(
          capas
        )
        .jpeg({
          quality: 92,
          mozjpeg: true,
        })
        .toBuffer();

    return new NextResponse(
      new Uint8Array(
        resultado
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "image/jpeg",

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error creando banner automático:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Error creando banner.",
      },
      {
        status: 500,
      }
    );
  }
}