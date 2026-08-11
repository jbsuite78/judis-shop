import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function GET() {
  const productos = await prisma.producto.findMany({
    orderBy: {
      id: "desc",
    },
  });

  return Response.json(productos);
}
export async function POST(request: Request) {
  const datos = await request.json();

  const producto = await prisma.producto.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion || "",
      precio: Number(datos.precio),
      costo: Number(datos.costo),
      existencia: Number(datos.existencia),
      imagen: datos.imagen || null,
      imagenes: datos.imagenesExtra || [],
      marca: datos.marca,
      categoria: datos.categoria,
    },
  });

  return Response.json(producto);
}

export async function DELETE(request: Request) {
  const datos = await request.json();

  await prisma.producto.delete({
    where: {
      id: Number(datos.id),
    },
  });

  return Response.json({ ok: true });
}

export async function PUT(request: Request) {
  const datos = await request.json();

  const producto = await prisma.producto.update({
    where: {
      id: Number(datos.id),
    },
    data: {
      nombre: datos.nombre,
      precio: Number(datos.precio),
      costo: Number(datos.costo),
      existencia: Number(datos.existencia),
      imagen: datos.imagen || null,
      marca: datos.marca,
      categoria: datos.categoria,
    },
  });

  return Response.json(producto);
}