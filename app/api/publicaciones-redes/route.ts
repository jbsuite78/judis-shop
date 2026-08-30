import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const response = await fetch(
      `${url}/rest/v1/publicaciones_redes?select=producto_id`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}