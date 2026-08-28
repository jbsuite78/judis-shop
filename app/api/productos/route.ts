import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
async function subirImagenBase64(base64: string, nombreBase: string) {
  if (!base64.startsWith("data:image/")) {
    return base64;
  }

  const coincidencia = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!coincidencia) {
    return base64;
  }

  const mimeType = coincidencia[1];
  const contenidoBase64 = coincidencia[2];

  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
      ? "webp"
      : "jpg";

  const buffer = Buffer.from(contenidoBase64, "base64");

  const nombreArchivo = `productos/${nombreBase}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(nombreArchivo, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

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
const nombreSeguro = String(datos.nombre || "producto")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const imagenPublica = datos.imagen
  ? await subirImagenBase64(datos.imagen, `${nombreSeguro}-principal`)
  : null;

const imagenesPublicas = Array.isArray(datos.imagenesExtra)
  ? await Promise.all(
      datos.imagenesExtra.map((img: string, index: number) =>
        subirImagenBase64(img, `${nombreSeguro}-extra-${index + 1}`)
      )
    )
  : [];
  const producto = await prisma.producto.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion || "",
      precio: Number(datos.precio),
      costo: Number(datos.costo),
      existencia: Number(datos.existencia),
      imagen: imagenPublica,
imagenes: imagenesPublicas,
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
      imagenes: datos.imagenes ?? [],
      existencia: Number(datos.existencia),
      imagen: datos.imagen || null,
      marca: datos.marca,
      categoria: datos.categoria,
    },
  });

  return Response.json(producto);
}