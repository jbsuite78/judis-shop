import { hasAdminSession, isAdminMutation, unauthorizedResponse } from "@/lib/admin-auth";
import { imagenVisibleProducto } from "@/lib/imagenes-posters-judis";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

// Pósters aprobados para las fotografías principales de SKALA.
// Se aplican solo a productos identificados sin ambigüedad y no modifican
// precio, costo, existencias, descripciones ni registros en la base de datos.
const postersSkala = {
  lisos: "https://static.metricool.com/planner/202610/7322149-file-13469355690424613940.png",
  cachos: "https://static.metricool.com/planner/202610/7322149-file-9308543703604189571.png",
  setCachos: "https://static.metricool.com/planner/202610/7322149-file-11805395001845497530.png",
} as const;

function posterSkala(nombre: string, marca: string): string | null {
  const normalizar = (texto: string) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const nombreNorm = normalizar(nombre);
  const etiqueta = normalizar(nombre + " " + marca);
  if (!/(^| )skala( |$)/.test(etiqueta)) return null;

  const lisos = /(^| )mais lisos( |$)/.test(nombreNorm);
  const cachos = /(^| )mais cachos( |$)/.test(nombreNorm);
  if (lisos === cachos) return null;

  const set = /(^| )(set|kit|combo|paquete|trio)( |$)/.test(nombreNorm)
    || (nombreNorm.includes("shampoo") && nombreNorm.includes("acondicionador"));
  if (set) return cachos ? postersSkala.setCachos : null;

  // Evita atribuir el póster de la crema 1000 g a un shampoo
  // o acondicionador individual.
  if (/(^| )(shampoo|champu|acondicionador|conditioner)( |$)/.test(nombreNorm)
      || /(^| )(325ml|325 ml|250ml|250 ml)( |$)/.test(nombreNorm)) return null;

  return lisos ? postersSkala.lisos : postersSkala.cachos;
}

function imagenSegura(imagen: string | null) {
  if (!imagen) {
    return null;
  }

  // No enviamos imágenes antiguas Base64.
  if (imagen.startsWith("data:image/")) {
    return null;
  }

  // Las nuevas URLs de Supabase sí se conservan.
  return imagen;
}

function imagenesSeguras(imagenes: string[]) {
  return imagenes.filter(
    (foto: string) =>
      typeof foto === "string" &&
      foto.length > 0 &&
      !foto.startsWith("data:image/")
  );
}

export async function GET(request: Request) {
  try {
    const admin = hasAdminSession(request);
    const productos = await prisma.producto.findMany({
      where: admin ? undefined : { visible: true },
      orderBy: {
        id: "desc",
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        costo: true,
        existencia: true,
        visible: true,
        imagen: true,
        imagenes: true,
        marca: true,
        categoria: true,
      },
    });

    const productosFinales = productos.map((producto) => {
      const posterPrincipal = posterSkala(producto.nombre, producto.marca);
      const precio = Number(producto.precio);
      const costo = Number(producto.costo);

      return {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio,
        costo,
        existencia: Number(producto.existencia),
        visible: producto.visible,
        utilidad: precio - costo,
        marca: producto.marca,
        categoria: producto.categoria,

        // URL nueva = se muestra.
        // Base64 antigua = temporalmente se oculta.
        imagen: posterPrincipal ?? imagenSegura(producto.imagen),

        imagenes: imagenesSeguras(
          producto.imagenes
        ),
      };
    });

    const visibles = productosFinales.map(imagenVisibleProducto);
    // Nunca publicar costos ni utilidades a los visitantes; solo el admin autenticado los recibe.
    const seguros = admin ? visibles : visibles.map(({ costo: _c, utilidad: _u, visible: _v, ...publico }) => publico);
    return Response.json(seguros, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error(
      "ERROR GET PRODUCTOS:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudieron cargar los productos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const datos = await request.json();

    const nombre = String(
      datos.nombre ?? ""
    ).trim();

    const descripcion = String(
      datos.descripcion ?? ""
    ).trim();

    const precio = Number(datos.precio);
    const costo = Number(datos.costo);
    const existencia = Number(
      datos.existencia
    );

    const marca = String(
      datos.marca ?? "Sin marca"
    ).trim();

    const categoria = String(
      datos.categoria ?? ""
    ).trim();

    const imagen =
      typeof datos.imagen === "string" &&
      datos.imagen.trim().length > 0
        ? datos.imagen.trim()
        : null;

    const imagenesExtra: string[] =
      Array.isArray(datos.imagenesExtra)
        ? datos.imagenesExtra.filter(
            (
              foto: unknown
            ): foto is string =>
              typeof foto === "string" &&
              foto.trim().length > 0
          )
        : [];

    if (!nombre) {
      return Response.json(
        {
          error:
            "Falta el nombre del producto.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(precio) ||
      precio < 0
    ) {
      return Response.json(
        {
          error:
            "El precio no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(costo) ||
      costo < 0
    ) {
      return Response.json(
        {
          error:
            "El costo no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(existencia) ||
      existencia < 0
    ) {
      return Response.json(
        {
          error:
            "La existencia no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      imagen &&
      imagen.startsWith("data:image/")
    ) {
      return Response.json(
        {
          error:
            "La fotografía debe subirse a Supabase antes de guardar.",
        },
        {
          status: 400,
        }
      );
    }

    const tieneBase64 =
      imagenesExtra.some(
        (foto: string) =>
          foto.startsWith("data:image/")
      );

    if (tieneBase64) {
      return Response.json(
        {
          error:
            "Una fotografía adicional todavía está en Base64.",
        },
        {
          status: 400,
        }
      );
    }

    const producto =
      await prisma.producto.create({
        data: {
          nombre,
          descripcion,
          precio,
          costo,
          existencia,
          imagen,
          imagenes: imagenesExtra,
          marca,
          categoria,
        },
      });

    return Response.json(
      {
        ok: true,
        id: producto.id,
        nombre: producto.nombre,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ERROR POST PRODUCTO:",
      error
    );

    return Response.json(
      {
        error:
          "Error al guardar el producto.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const datos = await request.json();

    const id = Number(datos.id);

    if (
      Number.isNaN(id) ||
      id <= 0
    ) {
      return Response.json(
        {
          error:
            "ID de producto inválido.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.producto.delete({
      where: {
        id,
      },
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "ERROR DELETE PRODUCTO:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo eliminar el producto.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const datos = await request.json();

    const id = Number(datos.id);

    const nombre = String(
      datos.nombre ?? ""
    ).trim();

    const descripcion = String(
      datos.descripcion ?? ""
    ).trim();

    const precio = Number(datos.precio);
    const costo = Number(datos.costo);
    const existencia = Number(
      datos.existencia
    );

    const marca = String(
      datos.marca ?? "Sin marca"
    ).trim();

    const categoria = String(
      datos.categoria ?? ""
    ).trim();

    const imagen =
      typeof datos.imagen === "string" &&
      datos.imagen.trim().length > 0
        ? datos.imagen.trim()
        : null;

    const imagenes: string[] =
      Array.isArray(datos.imagenes)
        ? datos.imagenes.filter(
            (
              foto: unknown
            ): foto is string =>
              typeof foto === "string" &&
              foto.trim().length > 0
          )
        : [];

    if (
      Number.isNaN(id) ||
      id <= 0
    ) {
      return Response.json(
        {
          error:
            "ID de producto inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nombre) {
      return Response.json(
        {
          error:
            "Falta el nombre del producto.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(precio) ||
      precio < 0
    ) {
      return Response.json(
        {
          error:
            "El precio no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(costo) ||
      costo < 0
    ) {
      return Response.json(
        {
          error:
            "El costo no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(existencia) ||
      existencia < 0
    ) {
      return Response.json(
        {
          error:
            "La existencia no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      imagen &&
      imagen.startsWith("data:image/")
    ) {
      return Response.json(
        {
          error:
            "La fotografía debe ser una URL.",
        },
        {
          status: 400,
        }
      );
    }

    const tieneBase64 =
      imagenes.some(
        (foto: string) =>
          foto.startsWith("data:image/")
      );

    if (tieneBase64) {
      return Response.json(
        {
          error:
            "Las fotografías deben ser URLs.",
        },
        {
          status: 400,
        }
      );
    }

    const producto =
      await prisma.producto.update({
        where: {
          id,
        },

        data: {
          nombre,
          descripcion,
          precio,
          costo,
          existencia,
          imagen,
          imagenes,
          marca,
          categoria,
        },
      });

    return Response.json({
      ok: true,
      id: producto.id,
    });
  } catch (error) {
    console.error(
      "ERROR PUT PRODUCTO:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo actualizar el producto.",
      },
      {
        status: 500,
      }
    );
  }
}
/**
 * Oculta o reactiva un producto sin borrar datos, fotos ni inventario.
 * El endpoint está protegido por la sesión administrativa y origen válido.
 */
export async function PATCH(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const datos: unknown = await request.json();
    if (!datos || typeof datos !== "object") {
      return Response.json({ error: "Datos inválidos." }, { status: 400 });
    }
    const cuerpo = datos as { id?: unknown; visible?: unknown };
    const id = Number(cuerpo.id);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof cuerpo.visible !== "boolean") {
      return Response.json({ error: "Proporciona un producto y un estado de visibilidad válidos." }, { status: 400 });
    }

    const resultado = await prisma.producto.updateMany({
      where: { id },
      data: { visible: cuerpo.visible },
    });
    if (resultado.count === 0) {
      return Response.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return Response.json(
      { ok: true, id, visible: cuerpo.visible },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("ERROR VISIBILIDAD PRODUCTO:", error);
    return Response.json({ error: "No se pudo actualizar la visibilidad del producto." }, { status: 500 });
  }
}
