import { hasAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Vista previa administrativa del catálogo para construir la integración
 * autorizada con TikTok Shop. No publica, envía ni modifica productos.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esImagenPublica(url: string | null | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function advertenciasCategoria(categoria: string) {
  const categoriaNormalizada = categoria.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();

  return /perfume|fragancia|belleza|cosmetic|cuidado personal|cabello|skala/.test(categoriaNormalizada)
    ? ["Verificar la autorización y documentación exigida por TikTok Shop México para belleza y cuidado personal."]
    : [];
}

export async function GET(request: Request) {
  if (!hasAdminSession(request)) return unauthorizedResponse();

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Base de datos no configurada." }, { status: 503 });
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const productos = await prisma.producto.findMany({
      where: { visible: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        marca: true,
        categoria: true,
        precio: true,
        existencia: true,
        imagen: true,
        imagenes: true,
      },
    });

    const vistaPrevia = productos.map((producto) => {
      const incidencias: string[] = [];
      if (!producto.nombre.trim()) incidencias.push("Falta el nombre.");
      if (!Number.isFinite(producto.precio) || producto.precio <= 0) {
        incidencias.push("El precio no es válido.");
      }
      if (producto.existencia <= 0) incidencias.push("No hay existencias.");
      if (!esImagenPublica(producto.imagen)) {
        incidencias.push("Falta una imagen principal pública HTTPS del producto real.");
      }

      const fotos = [producto.imagen, ...producto.imagenes]
        .filter((foto): foto is string => esImagenPublica(foto));

      const pendientesTikTok = [
        "Asignar categoría y atributos de TikTok Shop.",
        "Confirmar peso, dimensiones, almacén y logística.",
        "Validar fotografías sin textos promocionales y comprobantes de marca cuando corresponda.",
        ...advertenciasCategoria(producto.categoria),
      ];

      return {
        productoId: producto.id,
        skuOrigen: `JUDIS-${producto.id}`,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        marca: producto.marca,
        categoriaOrigen: producto.categoria,
        precioMXN: producto.precio,
        existencia: producto.existencia,
        imagenes: [...new Set(fotos)],
        datosBasicosCompletos: incidencias.length === 0,
        incidencias,
        pendientesTikTok,
      };
    });

    return Response.json({
      origen: "Judi's Shop",
      estadoConexion: "pendiente_autorizacion_tiktok",
      modo: "vista_previa_solo_lectura",
      totalVisibles: vistaPrevia.length,
      aptosParaRevision: vistaPrevia.filter(p => p.datosBasicosCompletos).length,
      conIncidencias: vistaPrevia.filter(p => !p.datosBasicosCompletos).length,
      productos: vistaPrevia,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error en vista previa TikTok Shop:", error);
    return Response.json({ error: "No se pudo preparar el catálogo." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
