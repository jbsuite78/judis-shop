import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function csv(valor: unknown) {
  const texto = String(valor ?? "")
    .replace(/\r?\n|\r/g, " ")
    .trim();

  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const imagenId = url.searchParams.get("imagen");

    // SI PIDEN UNA IMAGEN
    if (imagenId) {
      const producto = await prisma.producto.findFirst({
        where: {
          id: Number(imagenId),
          visible: true,
        },
      });

      if (!producto) {
        return new Response("Producto no encontrado", {
          status: 404,
        });
      }

      const imagen =
        producto.imagen ||
        producto.imagenes?.[0] ||
        "";

      if (!imagen) {
        return new Response("Imagen no encontrada", {
          status: 404,
        });
      }

      if (
        imagen.startsWith("http://") ||
        imagen.startsWith("https://")
      ) {
        return Response.redirect(imagen, 302);
      }

      const match = imagen.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
      );

      if (!match) {
        return new Response("Imagen inválida", {
          status: 400,
        });
      }

      const buffer = Buffer.from(match[2], "base64");

      return new Response(buffer, {
        headers: {
          "Content-Type": match[1],
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // SI PIDEN EL CATÁLOGO
    const productos = await prisma.producto.findMany({
      where: { visible: true },
      orderBy: {
        id: "desc",
      },
    });

    const encabezados = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
    ].join(",");

    const filas = productos
      .filter(
        (producto) =>
          producto.imagen ||
          producto.imagenes?.length > 0
      )
      .map((producto) => {
        return [
          csv(producto.id),
          csv(producto.nombre),
          csv(producto.descripcion || producto.nombre),
          csv(
            producto.existencia > 0
              ? "in stock"
              : "out of stock"
          ),
          csv("new"),
          csv(`${producto.precio.toFixed(2)} MXN`),
          csv("https://www.judisshop.com.mx"),
          csv(
            `https://www.judisshop.com.mx/api/catalogo-meta?imagen=${producto.id}`
          ),
          csv(producto.marca || "Judi's Shop"),
        ].join(",");
      })
      .join("\n");

    return new Response(
      `${encabezados}\n${filas}`,
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response("Error", {
      status: 500,
    });
  }
}