import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan variables de Supabase");
  }

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

export async function GET() {
  try {
    if (!supabaseUrl) {
      throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
    }

    const respuesta = await fetch(
      `${supabaseUrl}/rest/v1/rifas?select=*&order=created_at.desc&limit=100`,
      {
        headers: headers(),
        cache: "no-store",
      }
    );

    if (!respuesta.ok) {
      const error = await respuesta.text();

      return NextResponse.json(
        {
          ok: false,
          error,
        },
        {
          status: respuesta.status,
        }
      );
    }

    const rifas = await respuesta.json();

    return NextResponse.json({
      ok: true,
      rifas,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al consultar rifas",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl) {
      throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
    }

    const body = await request.json();

    if (!body.nombre?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta el nombre de la rifa",
        },
        {
          status: 400,
        }
      );
    }

    const nuevaRifa = {
      nombre: body.nombre.trim(),
      premios: body.premios ?? [],
      participantes: body.participantes ?? [],
      ganadores: body.ganadores ?? [],
      total_participantes:
        body.total_participantes ?? 0,
      total_oportunidades:
        body.total_oportunidades ?? 0,
      estado: body.estado ?? "preparada",
      finalizada_at: body.finalizada_at ?? null,
    };

    const respuesta = await fetch(
      `${supabaseUrl}/rest/v1/rifas`,
      {
        method: "POST",
        headers: {
          ...headers(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(nuevaRifa),
      }
    );

    if (!respuesta.ok) {
      const error = await respuesta.text();

      return NextResponse.json(
        {
          ok: false,
          error,
        },
        {
          status: respuesta.status,
        }
      );
    }

    const datos = await respuesta.json();

    return NextResponse.json({
      ok: true,
      rifa: datos[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al guardar rifa",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseUrl) {
      throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta el ID de la rifa",
        },
        {
          status: 400,
        }
      );
    }

    const cambios: Record<string, unknown> = {};

    if (body.ganadores !== undefined) {
      cambios.ganadores = body.ganadores;
    }

    if (body.estado !== undefined) {
      cambios.estado = body.estado;
    }

    if (body.participantes !== undefined) {
      cambios.participantes = body.participantes;
    }

    if (body.premios !== undefined) {
      cambios.premios = body.premios;
    }

    if (body.total_participantes !== undefined) {
      cambios.total_participantes =
        body.total_participantes;
    }

    if (body.total_oportunidades !== undefined) {
      cambios.total_oportunidades =
        body.total_oportunidades;
    }

    if (body.finalizada_at !== undefined) {
      cambios.finalizada_at = body.finalizada_at;
    }

    const respuesta = await fetch(
      `${supabaseUrl}/rest/v1/rifas?id=eq.${encodeURIComponent(
        String(body.id)
      )}`,
      {
        method: "PATCH",
        headers: {
          ...headers(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(cambios),
      }
    );

    if (!respuesta.ok) {
      const error = await respuesta.text();

      return NextResponse.json(
        {
          ok: false,
          error,
        },
        {
          status: respuesta.status,
        }
      );
    }

    const datos = await respuesta.json();

    return NextResponse.json({
      ok: true,
      rifa: datos[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar rifa",
      },
      {
        status: 500,
      }
    );
  }
}