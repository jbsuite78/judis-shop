import {
  NextRequest,
  NextResponse,
} from "next/server";

import sharp from "sharp";

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
  const respuesta = await fetch(
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

    if (posicion === -1) {
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
    await fetch(url, {
      cache:
        "force-cache",
    });

  if (!respuesta.ok) {
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
        background:
          "#ffffff",
      },
    })
      .png()
      .toBuffer();
  }

  const buffer =
    await descargarImagen(
      url
    );

  return sharp(buffer)
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
          alpha: 1,
        },
      }
    )
    .png()
    .toBuffer();
}

function fondoSvg(
  tema: number
) {
  const paletas = [
    {
      inicio: "#ff5f9e",
      final: "#a66cff",
      claro: "#fff1f7",
      titulo: "#d91f72",
    },
    {
      inicio: "#ff986a",
      final: "#ffc85a",
      claro: "#fff6df",
      titulo: "#d96b24",
    },
    {
      inicio: "#665cff",
      final: "#45c8e8",
      claro: "#eefaff",
      titulo: "#5141c8",
    },
    {
      inicio: "#ed62ad",
      final: "#8b63e8",
      claro: "#fff0fa",
      titulo: "#c52583",
    },
    {
      inicio: "#3dc8ad",
      final: "#69b8ff",
      claro: "#efffff",
      titulo: "#198e79",
    },
    {
      inicio: "#ff6c89",
      final: "#ba77f5",
      claro: "#fff0f5",
      titulo: "#d92968",
    },
  ];

  const colores =
    paletas[
      tema %
        paletas.length
    ];

  return `
  <svg
    width="1080"
    height="1350"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="fondo"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0%"
          stop-color="${colores.inicio}"
        />

        <stop
          offset="100%"
          stop-color="${colores.final}"
        />
      </linearGradient>

      <filter id="sombra">
        <feDropShadow
          dx="0"
          dy="10"
          stdDeviation="16"
          flood-opacity="0.15"
        />
      </filter>
    </defs>

    <rect
      width="1080"
      height="1350"
      fill="url(#fondo)"
    />

    <circle
      cx="70"
      cy="110"
      r="130"
      fill="#ffffff"
      opacity="0.10"
    />

    <circle
      cx="1000"
      cy="230"
      r="170"
      fill="#ffffff"
      opacity="0.10"
    />

    <circle
      cx="940"
      cy="1220"
      r="210"
      fill="#ffffff"
      opacity="0.08"
    />

    <rect
      x="42"
      y="42"
      width="996"
      height="1266"
      rx="55"
      fill="${colores.claro}"
      filter="url(#sombra)"
    />

    <text
      x="540"
      y="145"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="72"
      font-weight="700"
      fill="${colores.titulo}"
    >
      Judi&apos;s Shop
    </text>

    <text
      x="540"
      y="225"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="50"
      font-weight="800"
      fill="#4b286f"
    >
      ¡Visita nuestra tienda en línea!
    </text>

    <text
      x="540"
      y="285"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="31"
      font-weight="600"
      fill="#6f5689"
    >
      Productos originales de Estados Unidos
    </text>

    <rect
      x="72"
      y="350"
      width="444"
      height="330"
      rx="34"
      fill="#ffffff"
      stroke="#ffd1e4"
      stroke-width="5"
    />

    <rect
      x="564"
      y="350"
      width="444"
      height="330"
      rx="34"
      fill="#ffffff"
      stroke="#d7c9ff"
      stroke-width="5"
    />

    <rect
      x="72"
      y="720"
      width="444"
      height="330"
      rx="34"
      fill="#ffffff"
      stroke="#ccecff"
      stroke-width="5"
    />

    <rect
      x="564"
      y="720"
      width="444"
      height="330"
      rx="34"
      fill="#ffffff"
      stroke="#ffe0ad"
      stroke-width="5"
    />

    <text
      x="540"
      y="1100"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="29"
      font-weight="700"
      fill="#5b367a"
    >
      💵 Efectivo • 🏦 Transferencia • 💳 Tarjeta
    </text>

    <text
      x="540"
      y="1150"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="29"
      font-weight="700"
      fill="#5b367a"
    >
      🛍️ Sistema de separado
    </text>

    <rect
      x="175"
      y="1200"
      width="730"
      height="82"
      rx="41"
      fill="${colores.titulo}"
    />

    <text
      x="540"
      y="1253"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="39"
      font-weight="800"
      fill="#ffffff"
    >
      www.judisshop.com.mx
    </text>
  </svg>
  `;
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
              (producto) =>
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
          (producto) =>
            prepararImagen(
              producto
            )
        )
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

    const composiciones =
      imagenes.map(
        (
          input,
          index
        ) => ({
          input,
          left:
            posiciones[index]
              .left,
          top:
            posiciones[index]
              .top,
        })
      );

    const resultado =
      await sharp(
        Buffer.from(
          fondoSvg(
            tema
          )
        )
      )
        .composite(
          composiciones
        )
        .jpeg({
          quality: 90,
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
            "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error creando banner:",
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