import { NextResponse } from "next/server";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLICACIONES_TABLE = "publicaciones_redes";

export async function GET(request: Request) {
  try {
const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }
    const origin = new URL(request.url).origin;

    const response = await fetch(`${origin}/api/productos`, {
      cache: "no-store",
    });

    const data = await response.json();

    const productos = Array.isArray(data)
      ? data
      : Array.isArray(data.productos)
        ? data.productos
        : [];
        const publicadosResponse = await fetch(
  `${SUPABASE_URL}/rest/v1/${PUBLICACIONES_TABLE}?select=producto_id`,
  {
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  }
);

const publicaciones = await publicadosResponse.json();
console.log("PUBLICACIONES SUPABASE:", publicaciones);
const idsPublicados = Array.isArray(publicaciones)
  ? publicaciones.map((item: any) => String(item.producto_id))
  : [];
        const disponibles = productos.filter(
  (producto: any) =>
    Number(producto.existencia ?? 0) > 0 &&
    !idsPublicados.includes(String(producto.id))
);

   const primerProducto = disponibles[0] ?? null;

const ejecutar =
  new URL(request.url).searchParams.get("ejecutar") === "1";

if (!ejecutar || !primerProducto) {
  return NextResponse.json({
    ok: true,
    totalProductos: productos.length,
    disponibles: disponibles.length,
    primerProducto,
  });
}

const metaResponse = await fetch(`${origin}/api/meta`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    imageUrl: primerProducto.imagen,
    caption: primerProducto.descripcion || primerProducto.nombre,
    productoId: primerProducto.id,
  }),
});

const metaData = await metaResponse.json();

return NextResponse.json({
  ok: metaResponse.ok && metaData.ok,
  productoPublicado: primerProducto,
  meta: metaData,
});
 } catch (error) {
  console.error("ERROR AUTOMATIZAR REDES:", error);

  return NextResponse.json(
    {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido en automatizar redes",
    },
    { status: 500 }
  );
}
}