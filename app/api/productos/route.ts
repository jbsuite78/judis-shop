import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

function limpiarImagen(
  imagen: string | null
) {
  if (!imagen) {
    return null;
  }

  // Las fotos nuevas serán URLs de Supabase.
  // Las antiguas Base64 se omiten temporalmente
  // para evitar el error 413 de Vercel.
  if (
    imagen.startsWith(
      "data:image/"
    )
  ) {
    return null;
  }

  return imagen;
}

export async function GET() {
  try {
    const productos =
      await prisma.producto.findMany({
        orderBy: {
          id: "desc",
        },
      });

    const productosLigeros =
      productos.map(
        (producto) => ({
          ...producto,

          imagen:
            limpiarImagen(
              producto.imagen
            ),

          imagenes:
            producto.imagenes.filter(
              (imagen) =>
                typeof imagen ===
                  "string" &&
                !imagen.startsWith(
                  "data:image/"
                )
            ),
        })
      );

    return Response.json(
      productosLigeros,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
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
    const datos =
      await request.json();

    const producto =
      await prisma.producto.create({
        data: {
          nombre:
            datos.nombre,

          descripcion:
            datos.descripcion ||
            "",

          precio: Number(
            datos.precio
          ),

          costo: Number(
            datos.costo
          ),

          existencia: Number(
            datos.existencia
          ),

          imagen:
            datos.imagen ||
            null,

          imagenes:
            datos.imagenesExtra ||
            [],

          marca:
            datos.marca,

          categoria:
            datos.categoria,
        },
      });

    return Response.json(
      producto
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

    await prisma.producto.delete({
      where: {
        id: Number(
          datos.id
        ),
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

export async function PUT(
  request: Request
) {
  try {
    const datos =
      await request.json();

    const producto =
      await prisma.producto.update({
        where: {
          id: Number(
            datos.id
          ),
        },

        data: {
          nombre:
            datos.nombre,

          precio: Number(
            datos.precio
          ),

          costo: Number(
            datos.costo
          ),

          existencia: Number(
            datos.existencia
          ),

          imagen:
            datos.imagen ||
            null,

          imagenes:
            datos.imagenes ??
            [],

          marca:
            datos.marca,

          categoria:
            datos.categoria,
        },
      });

    return Response.json(
      producto
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