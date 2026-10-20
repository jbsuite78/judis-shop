import { isAdminMutation, unauthorizedResponse } from "@/lib/admin-auth";
import { CATEGORIAS_JUDIS } from "@/lib/carga-masiva-judis";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const categorias = new Set<string>(CATEGORIAS_JUDIS);

type Entrada = { nombre: string; descripcion: string; marca: string; categoria: string;
  precio: number; costo: number; existencia: number; imagen: string; imagenes: string[] };

function urlDeProducto(valor: unknown): valor is string {
  if (typeof valor !== "string" || valor.length > 2000) return false;
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!base) return false;
    const candidata = new URL(valor);
    const servidor = new URL(base);
    return candidata.protocol === "https:" && candidata.origin === servidor.origin &&
      candidata.pathname.startsWith("/storage/v1/object/public/productos/");
  } catch { return false; }
}
function dinero(valor: unknown): number | null {
  const n = typeof valor === "number" || typeof valor === "string" && valor.trim() ? Number(valor) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 && Math.abs(n * 100 - Math.round(n * 100)) < 0.000001
    ? n : null;
}
function normal(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const cuerpo: unknown = await request.json();
    if (!cuerpo || typeof cuerpo !== "object" || !("productos" in cuerpo)) {
      return Response.json({ error: "La solicitud no contiene productos." }, { status: 400 });
    }
    const datos = (cuerpo as { productos: unknown }).productos;
    if (!Array.isArray(datos) || datos.length < 1 || datos.length > 20) {
      return Response.json({ error: "Selecciona entre 1 y 20 productos por lote." }, { status: 400 });
    }
    const registros: Entrada[] = [];
    for (let i = 0; i < datos.length; i++) {
      const d = datos[i] as Record<string, unknown> | null;
      if (!d || typeof d !== "object") {
        return Response.json({ error: `Producto ${i + 1}: datos inválidos.` }, { status: 400 });
      }
      const nombre = typeof d.nombre === "string" ? d.nombre.trim() : "";
      const descripcion = typeof d.descripcion === "string" ? d.descripcion.trim() : "";
      const marca = typeof d.marca === "string" ? d.marca.trim() : "";
      const categoria = typeof d.categoria === "string" ? d.categoria.trim() : "";
      const precio = dinero(d.precio);
      const costo = dinero(d.costo);
      const existencia = Number(d.existencia);
      const imagen = d.imagen;
      const imagenes = d.imagenes;
      if (!nombre || nombre.length > 180 || descripcion.length > 2500 || !marca || marca.length > 100 ||
          !categorias.has(categoria) || precio === null || costo === null ||
          !Number.isSafeInteger(existencia) || existencia < 0 || existencia > 1_000_000 ||
          !urlDeProducto(imagen) || !Array.isArray(imagenes) || imagenes.length !== 1 ||
          !urlDeProducto(imagenes[0])) {
        return Response.json({ error: `Revisa nombre, categoría, precio, costo, existencia e imágenes del producto ${i + 1}.` }, { status: 400 });
      }
      registros.push({ nombre, descripcion, marca, categoria, precio, costo, existencia, imagen, imagenes });
    }
    const claves = registros.map((p) => [p.nombre, p.marca, p.categoria].map(normal).join("|"));
    if (new Set(claves).size !== claves.length || new Set(registros.map((p) => p.imagen)).size !== registros.length) {
      return Response.json({ error: "Hay productos repetidos dentro del lote. Revísalos antes de publicar." }, { status: 409 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const posibles = await tx.producto.findMany({
        where: { OR: registros.map((p) => ({
          nombre: { equals: p.nombre, mode: "insensitive" as const },
          marca: { equals: p.marca, mode: "insensitive" as const },
          categoria: p.categoria,
        })) },
        select: { nombre: true, marca: true, categoria: true, imagen: true },
      });
      const duplicados = registros.filter((p) => posibles.some((q) =>
        (normal(q.nombre) === normal(p.nombre) && normal(q.marca) === normal(p.marca) && q.categoria === p.categoria)
        || q.imagen === p.imagen
      ));
      if (duplicados.length) {
        throw new Error("DUPLICADOS: " + duplicados.map((p) => p.nombre).join(", "));
      }
      return tx.producto.createMany({
        data: registros.map((p) => ({ ...p, visible: true })),
      });
    });
    return Response.json({ ok: true, publicados: resultado.count }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "";
    if (detalle.startsWith("DUPLICADOS:")) {
      return Response.json({ error: "Ya existe uno de estos artículos en el catálogo. No se publicó el lote. " + detalle.slice(11) }, { status: 409 });
    }
    console.error("ERROR PUBLICANDO LOTE:", error);
    return Response.json({ error: "No se pudo publicar el lote; los productos no se han publicado." }, { status: 500 });
  }
}
