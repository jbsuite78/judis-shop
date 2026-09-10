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

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
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
      .map((producto) => {
        const imagen =
          producto.imagen ||
          producto.imagenes?.[0] ||
          "";

        const disponibilidad =
          producto.existencia > 0
            ? "in stock"
            : "out of stock";

        return [
          csv(producto.id),
          csv(producto.nombre),
          csv(
            producto.descripcion ||
              `${producto.nombre} disponible en Judi's Shop`
          ),
          csv(disponibilidad),
          csv("new"),
          csv(`${producto.precio.toFixed(2)} MXN`),

          // Por ahora apunta a la tienda.
          // Después podemos colocar el enlace individual del producto.
          csv("https://www.judisshop.com.mx"),

          csv(imagen),
          csv(producto.marca || "Judi's Shop"),
        ].join(",");
      })
      .join("\n");

    const contenido = `${encabezados}\n${filas}`;

    return new Response(contenido, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'inline; filename="judis-shop-meta.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando catálogo Meta:", error);

    return new Response(
      "Error generando catálogo de productos",
      {
        status: 500,
      }
    );
  }
}