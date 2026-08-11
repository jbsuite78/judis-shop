import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function GET() {
  const ventas = await prisma.venta.findMany({
    orderBy: {
      id: "desc",
    },
  });

  return Response.json(ventas);
}

export async function POST(request: Request) {
  const datos = await request.json();
const producto = await prisma.producto.findUnique({
  where: {
    id: Number(datos.productoId),
  },
});

if (!producto) {
  return Response.json(
    { error: "Producto no encontrado" },
    { status: 404 }
  );
}

const cantidadVendida = Number(datos.cantidad);

if (producto.existencia < cantidadVendida) {
  return Response.json(
    { error: "Existencia insuficiente" },
    { status: 400 }
  );
}

await prisma.producto.update({
  where: {
    id: Number(datos.productoId),
  },
  data: {
    existencia: producto.existencia - cantidadVendida,
  },
});
  const venta = await prisma.venta.create({
    data: {
      productoId: Number(datos.productoId),
      nombre: datos.nombre,
      cantidad: Number(datos.cantidad),
      precioUnitario: Number(datos.precioUnitario),
      total: Number(datos.total),
      utilidad: Number(datos.utilidad),
    },
  });

  return Response.json(venta);
}
export async function DELETE() {
  await prisma.venta.deleteMany();

  return Response.json({
    mensaje: "Historial eliminado correctamente",
  });
}