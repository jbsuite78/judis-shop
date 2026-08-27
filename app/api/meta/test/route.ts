import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:3000/api/meta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl:
          "https://jejmlqupzzkabxhtnotk.supabase.co/storage/v1/object/public/product-images/prueba/producto-59-1787674711566.jpg",
        caption: "Prueba automatica desde Judis Shop",
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}