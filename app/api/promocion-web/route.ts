import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH_VERSION = "v26.0";
const GRAPH_URL =
  `https://graph.facebook.com/${GRAPH_VERSION}`;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CRON_SECRET =
  process.env.CRON_SECRET!;

const META_PAGE_ID =
  process.env.META_PAGE_ID!;

const META_PAGE_ACCESS_TOKEN =
  process.env.META_PAGE_ACCESS_TOKEN!;

const PUBLIC_URL =
  "https://www.judisshop.com.mx";

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

function fechaMonterrey() {
  const partes =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Monterrey",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    partes.find(
      (p) =>
        p.type === "year"
    )?.value || "";

  const month =
    partes.find(
      (p) =>
        p.type === "month"
    )?.value || "";

  const day =
    partes.find(
      (p) =>
        p.type === "day"
    )?.value || "";

  return `${year}-${month}-${day}`;
}

function numeroSemana() {
  const ahora =
    new Date();

  const inicio =
    new Date(
      Date.UTC(
        ahora.getUTCFullYear(),
        0,
        1
      )
    );

  const dias =
    Math.floor(
      (
        ahora.getTime() -
        inicio.getTime()
      ) /
        86400000
    );

  return Math.ceil(
    (
      dias +
      inicio.getUTCDay() +
      1
    ) /
      7
  );
}

function textoPromocional(
  numero: number
) {
  const textos = [
    `🛍️✨ ¡Visita nuestra tienda en línea!

Encuentra productos originales de Estados Unidos 🇺🇸 y opciones para toda la familia.

💳 Tarjeta
🏦 Transferencia
💵 Efectivo
🛍️ Sistema de separado

🚚 Entrega local

🌐 www.judisshop.com.mx`,

    `🇺🇸🛍️ ¡Tus productos favoritos más cerca de ti!

Descubre productos disponibles en Judi’s Shop y compra fácilmente desde nuestra tienda en línea.

💳 Tarjeta | 🏦 Transferencia
💵 Efectivo | 🛍️ Sistema de separado

🌐 www.judisshop.com.mx`,

    `💖 Comprar en Judi’s Shop es muy fácil.

Explora nuestra tienda en línea y descubre productos originales de Estados Unidos.

💳 Aceptamos pago con tarjeta
🏦 Transferencia
💵 Efectivo
🛍️ Sistema de separado

🌐 www.judisshop.com.mx`,

    `✨🛍️ ¿Ya conoces nuestra tienda en línea?

Encuentra diferentes categorías, marcas y productos originales de Estados Unidos 🇺🇸.

🚚 Entrega local en Monterrey y área metropolitana.

🌐 www.judisshop.com.mx`,

    `📦🇺🇸 De Estados Unidos hasta ti.

En Judi’s Shop encontrarás productos originales y opciones para toda la familia.

💳 Tarjeta
🏦 Transferencia
💵 Efectivo
🛍️ Sistema de separado

🌐 www.judisshop.com.mx`,

    `🛍️💗 ¡Siempre hay algo que descubrir en Judi’s Shop!

Conoce nuestros productos disponibles y compra desde donde estés.

✨ Productos originales
🚚 Entrega local
💳 Diferentes formas de pago

🌐 www.judisshop.com.mx`,
  ];

  return textos[
    numero %
      textos.length
  ];
}

function mezclar<T>(
  lista: T[]
) {
  const copia =
    [...lista];

  for (
    let i =
      copia.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1)
      );

    [
      copia[i],
      copia[j],
    ] = [
      copia[j],
      copia[i],
    ];
  }

  return copia;
}

async function obtenerProductos() {
  const respuesta =
    await fetch(
      `${PUBLIC_URL}/api/productos`,
      {
        cache:
          "no-store",
      }
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      "No fue posible obtener productos."
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

  return productos.filter(
    (producto) =>
      Number(
        producto.existencia ||
          0
      ) > 0 &&
      Boolean(
        obtenerImagen(
          producto
        )
      )
  );
}

async function productosRecientes() {
  const respuesta =
    await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones_promocion_web?select=productos_ids&estado=eq.publicado&order=created_at.desc&limit=3`,
      {
        headers: {
          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${SUPABASE_KEY}`,
        },

        cache:
          "no-store",
      }
    );

  if (
    !respuesta.ok
  ) {
    return new Set<string>();
  }

  const filas =
    await respuesta.json();

  const usados =
    new Set<string>();

  for (
    const fila of
      filas || []
  ) {
    const ids =
      String(
        fila?.productos_ids ||
          ""
      )
        .split(",")
        .map(
          (id) =>
            id.trim()
        )
        .filter(Boolean);

    for (
      const id of ids
    ) {
      usados.add(id);
    }
  }

  return usados;
}

async function reservarFecha(
  fecha: string,
  tema: number,
  productosIds: string,
  texto: string,
  imageUrl: string
) {
  const consulta =
    await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones_promocion_web?fecha=eq.${fecha}&select=id,estado`,
      {
        headers: {
          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${SUPABASE_KEY}`,
        },

        cache:
          "no-store",
      }
    );

  if (!consulta.ok) {
    throw new Error(
      "No fue posible revisar la promoción."
    );
  }

  const existentes =
    await consulta.json();

  if (
    Array.isArray(
      existentes
    ) &&
    existentes.length > 0
  ) {
    const existente =
      existentes[0];

    if (
      existente.estado ===
        "publicado" ||
      existente.estado ===
        "procesando"
    ) {
      return false;
    }

    const reintento =
      await fetch(
        `${SUPABASE_URL}/rest/v1/publicaciones_promocion_web?fecha=eq.${fecha}`,
        {
          method: "PATCH",

          headers: {
            apikey:
              SUPABASE_KEY,

            Authorization:
              `Bearer ${SUPABASE_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal",
          },

          body:
            JSON.stringify({
              estado:
                "procesando",

              tema,

              productos_ids:
                productosIds,

              texto,

              imagen_url:
                imageUrl,

              error: null,

              updated_at:
                new Date().toISOString(),
            }),
        }
      );

    if (!reintento.ok) {
      throw new Error(
        "No fue posible preparar el reintento."
      );
    }

    return true;
  }

  const respuesta =
    await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones_promocion_web`,
      {
        method: "POST",

        headers: {
          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${SUPABASE_KEY}`,

          "Content-Type":
            "application/json",

          Prefer:
            "return=minimal",
        },

        body:
          JSON.stringify({
            fecha,

            estado:
              "procesando",

            tema,

            productos_ids:
              productosIds,

            texto,

            imagen_url:
              imageUrl,
          }),
      }
    );

  if (!respuesta.ok) {
    const detalle =
      await respuesta.text();

    throw new Error(
      `No fue posible reservar la promoción: ${detalle}`
    );
  }

  return true;
}

async function actualizarRegistro(
  fecha: string,
  datos: Record<
    string,
    unknown
  >
) {
  const respuesta =
    await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones_promocion_web?fecha=eq.${fecha}`,
      {
        method: "PATCH",

        headers: {
          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${SUPABASE_KEY}`,

          "Content-Type":
            "application/json",

          Prefer:
            "return=minimal",
        },

        body:
          JSON.stringify({
            ...datos,

            updated_at:
              new Date().toISOString(),
          }),
      }
    );

  if (!respuesta.ok) {
    const detalle =
      await respuesta.text();

    throw new Error(
      `No fue posible actualizar el registro: ${detalle}`
    );
  }
}

async function publicarFacebook(
  imageUrl: string,
  texto: string
) {
  if (
    !META_PAGE_ID ||
    !META_PAGE_ACCESS_TOKEN
  ) {
    throw new Error(
      "Faltan variables de Facebook."
    );
  }

  const body =
    new URLSearchParams();

  body.append(
    "url",
    imageUrl
  );

  body.append(
    "caption",
    texto
  );

  body.append(
    "access_token",
    META_PAGE_ACCESS_TOKEN
  );

  const respuesta =
    await fetch(
      `${GRAPH_URL}/${META_PAGE_ID}/photos`,
      {
        method: "POST",
        body,
      }
    );

  const data =
    await respuesta.json();

  if (!respuesta.ok) {
    console.error(
      "ERROR FACEBOOK PROMOCIÓN:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      data?.error?.message ||
        "Facebook rechazó la publicación."
    );
  }

  return data;
}

async function prepararPromocion() {
  const productos =
    await obtenerProductos();

  if (
    productos.length ===
    0
  ) {
    throw new Error(
      "No hay productos disponibles con imagen."
    );
  }

  const recientes =
    await productosRecientes();

  let candidatos =
    productos.filter(
      (producto) =>
        !recientes.has(
          String(
            producto.id
          )
        )
    );

  if (
    candidatos.length <
    Math.min(
      4,
      productos.length
    )
  ) {
    candidatos =
      productos;
  }

  const seleccionados =
    mezclar(
      candidatos
    ).slice(
      0,
      Math.min(
        4,
        candidatos.length
      )
    );

  const ids =
    seleccionados.map(
      (producto) =>
        String(
          producto.id
        )
    );

  const tema =
    numeroSemana() % 5;

  const texto =
    textoPromocional(
      tema
    );

  const imageUrl =
    `${PUBLIC_URL}/api/promocion-web/imagen` +
    `?ids=${encodeURIComponent(
      ids.join(",")
    )}` +
    `&tema=${tema}`;

  return {
    seleccionados,
    ids,
    tema,
    texto,
    imageUrl,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const url =
      new URL(
        request.url
      );

    const preview =
      url.searchParams.get(
        "preview"
      ) === "1";

    const promocion =
      await prepararPromocion();

    if (preview) {
      return NextResponse.json({
        ok: true,

        preview: true,

        productos:
          promocion.seleccionados.map(
            (producto) => ({
              id:
                producto.id,

              nombre:
                producto.nombre,
            })
          ),

        texto:
          promocion.texto,

        imageUrl:
          promocion.imageUrl,
      });
    }

    const authorization =
      request.headers.get(
        "authorization"
      ) || "";

    if (
      !CRON_SECRET ||
      authorization !==
        `Bearer ${CRON_SECRET}`
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const fecha =
      fechaMonterrey();

    const reservado =
      await reservarFecha(
        fecha,
        promocion.tema,
        promocion.ids.join(
          ","
        ),
        promocion.texto,
        promocion.imageUrl
      );

    if (!reservado) {
      return NextResponse.json({
        ok: true,

        publicado: false,

        mensaje:
          "La promoción de hoy ya fue publicada o está en proceso.",
      });
    }

    try {
      const facebook =
        await publicarFacebook(
          promocion.imageUrl,
          promocion.texto
        );

      await actualizarRegistro(
        fecha,
        {
          estado:
            "publicado",

          facebook_post_id:
            facebook?.post_id ||
            facebook?.id ||
            null,

          error:
            null,
        }
      );

      return NextResponse.json({
        ok: true,

        publicado: true,

        plataforma:
          "facebook",

        productos:
          promocion.ids,

        imageUrl:
          promocion.imageUrl,

        facebook,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      await actualizarRegistro(
        fecha,
        {
          estado:
            "error",

          error:
            mensaje,
        }
      );

      throw error;
    }
  } catch (error) {
    console.error(
      "ERROR PROMOCIÓN AUTOMÁTICA:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Error interno.",
      },
      {
        status: 500,
      }
    );
  }
}