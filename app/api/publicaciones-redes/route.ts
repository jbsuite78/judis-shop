import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // SOLO se ejecuta una vez cuando abramos ?inicializar=1
    if (searchParams.get("inicializar") === "1") {
      const origin = new URL(request.url).origin;

      const productosResponse = await fetch(`${origin}/api/productos`, {
        cache: "no-store",
      });

      const productosData = await productosResponse.json();

      const productos = Array.isArray(productosData)
        ? productosData
        : Array.isArray(productosData.productos)
        ? productosData.productos
        : [];

      const registros = productos
        .filter((producto: any) => producto.id !== undefined && producto.id !== null)
        .map((producto: any) => ({
          producto_id: String(producto.id),
          nombre_producto: String(
            producto.nombre ?? producto.name ?? ""
          ),
          plataforma: "facebook_instagram",
          estado: "publicado",
        }));

      if (registros.length === 0) {
        return NextResponse.json(
          { ok: false, error: "No se encontraron productos" },
          { status: 400 }
        );
      }

      const guardar = await fetch(
        `${SUPABASE_URL}/rest/v1/publicaciones_redes?on_conflict=producto_id`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(registros),
        }
      );

      if (!guardar.ok) {
        const error = await guardar.text();
        return NextResponse.json(
          { ok: false, error },
          { status: guardar.status }
        );
      }

      return NextResponse.json({
        ok: true,
        mensaje: "Todos los productos actuales quedaron marcados como publicados",
        total: registros.length,
      });
    }

    // Uso normal: devuelve solamente los productos ya publicados
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones_redes?select=producto_id&producto_id=not.is.null`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("ERROR PUBLICACIONES REDES:", error);

    return NextResponse.json(
      { ok: false, error: "Error consultando publicaciones" },
      { status: 500 }
    );
  }
}