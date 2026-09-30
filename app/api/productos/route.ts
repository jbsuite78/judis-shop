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

export async function GET() {
  try {
    /*
      IMPORTANTE:
      No solicitamos imagen ni imagenes.

      Las imágenes antiguas guardadas como Base64
      estaban haciendo demasiado pesada la respuesta
      de /api/productos y provocaban el error 413.
    */
    const productos = await prisma.producto.findMany({
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
        marca: true,
        categoria: true,
      },
    });

    const productosLigeros = productos.map((producto) => {
      const precio = Number(producto.precio);
      const costo = Number(producto.costo);

      return {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio,
        costo,
        existencia: Number(producto.existencia),
        utilidad: precio - costo,
        marca: producto.marca,
        categoria: producto.categoria,

        /*
          Temporalmente las imágenes antiguas
          no se envían por esta ruta.
        */
        imagen: null,
        imagenes: [] as string[],
      };
    });

    return Response.json(productosLigeros, {
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

export async function POST(
  request: Request
) {
  try {
    const datos = await request.json();

    const nombre = String(
      datos.nombre ?? ""
    ).trim();

    const descripcion = String(
      datos.descripcion ?? ""
    ).trim();

    const precio = Number(
      datos.precio
    );

    const costo = Number(
      datos.costo
    );

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

    /*
      Una imagen nueva debe llegar como URL
      de Supabase, nunca como Base64.
    */
    if (
      imagen &&
      imagen.startsWith(
        "data:image/"
      )
    ) {
      return Response.json(
        {
          error:
            "La imagen llegó en Base64. Debe subirse primero a Supabase.",
        },
        {
          status: 400,
        }
      );
    }

    const tieneBase64Extra =
      imagenesExtra.some(
        (foto: string) =>
          foto.startsWith(
            "data:image/"
          )
      );

    if (tieneBase64Extra) {
      return Response.json(
        {
          error:
            "Una fotografía adicional llegó en Base64.",
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
          imagenes:
            imagenesExtra,
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

export async function DELETE(
  request: Request
) {
  try {
    const datos =
      await request.json();

    const id = Number(
      datos.id
    );

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

    return Response.json(
      {
        ok: true,
      },
      {
        status: 200,
      }
    );
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

export async function PUT(
  request: Request
) {
  try {
    const datos =
      await request.json();

    const id = Number(
      datos.id
    );

    const nombre = String(
      datos.nombre ?? ""
    ).trim();

    const descripcion = String(
      datos.descripcion ?? ""
    ).trim();

    const precio = Number(
      datos.precio
    );

    const costo = Number(
      datos.costo
    );

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
      imagen.startsWith(
        "data:image/"
      )
    ) {
      return Response.json(
        {
          error:
            "La imagen debe ser una URL y no Base64.",
        },
        {
          status: 400,
        }
      );
    }

    const tieneBase64 =
      imagenes.some(
        (foto: string) =>
          foto.startsWith(
            "data:image/"
          )
      );

    if (tieneBase64) {
      return Response.json(
        {
          error:
            "Las fotografías deben ser URLs y no Base64.",
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

    return Response.json(
      {
        ok: true,
        id: producto.id,
      },
      {
        status: 200,
      }
    );
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