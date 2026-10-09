import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { hasAdminSession, isAdminMutation, unauthorizedResponse } from "@/lib/admin-auth";
export const runtime = "nodejs";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

export async function GET(request: Request) {
  if (!hasAdminSession(request)) return unauthorizedResponse();
  try {
    const ventas = await prisma.venta.findMany({ orderBy: { id: "desc" } });
    return Response.json(ventas, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Error al cargar ventas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const datos = await request.json();
    const productoId = Number(datos.productoId);
    const cantidad = Number(datos.cantidad);
    if (!Number.isSafeInteger(productoId) || productoId <= 0 ||
        !Number.isSafeInteger(cantidad) || cantidad <= 0 || cantidad > 1000) {
      return Response.json({ error: "ID o cantidad inválidos" }, { status: 400 });
    }
    const venta = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({ where: { id: productoId } });
      if (!producto) throw new Error("PRODUCTO_NO_EXISTE");
      const reservada = await tx.producto.updateMany({
        where: { id: productoId, existencia: { gte: cantidad } },
        data: { existencia: { decrement: cantidad } },
      });
      if (reservada.count !== 1) throw new Error("SIN_EXISTENCIAS");
      const total = Math.round(producto.precio * cantidad * 100) / 100;
      const utilidad = Math.round((producto.precio - producto.costo) * cantidad * 100) / 100;
      return tx.venta.create({ data: {
        productoId, nombre: producto.nombre, cantidad,
        precioUnitario: producto.precio, total, utilidad,
      } });
    });
    return Response.json(venta);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "PRODUCTO_NO_EXISTE") return Response.json({ error: "Producto no encontrado" }, { status: 404 });
    if (reason === "SIN_EXISTENCIAS") return Response.json({ error: "Existencia insuficiente" }, { status: 400 });
    console.error("Error registrando venta:", error);
    return Response.json({ error: "No se pudo registrar la venta" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    await prisma.venta.deleteMany();
    return Response.json({ mensaje: "Historial eliminado correctamente" });
  } catch {
    return Response.json({ error: "No se pudo eliminar el historial" }, { status: 500 });
  }
}
