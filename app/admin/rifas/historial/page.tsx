"use client";

import { useEffect, useState } from "react";

type Participante = {
  id: number;
  nombre: string;
  oportunidades: number;
};

type Ganador = {
  participante: Participante;
  lugar: 1 | 2 | 3;
  premio: string;
};

type Premio = {
  lugar: 1 | 2 | 3;
  premio: string;
};

type Rifa = {
  id: number;
  nombre: string;
  premios: Premio[];
  participantes: Participante[];
  ganadores: Ganador[];
  total_participantes: number;
  total_oportunidades: number;
  estado: string;
  created_at: string;
  finalizada_at: string | null;
};

export default function HistorialRifasPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarRifas = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch("/api/rifas", {
        cache: "no-store",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.error || "No se pudo cargar el historial."
        );
      }

      setRifas(datos.rifas ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar las rifas."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRifas();
  }, []);

  const fecha = (valor: string | null) => {
    if (!valor) return "—";

    return new Date(valor).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const iconoLugar = (lugar: number) => {
    if (lugar === 1) return "🥇";
    if (lugar === 2) return "🥈";
    return "🥉";
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-pink-600">
              Judi&apos;s Shop
            </p>

            <h1 className="mt-2 text-4xl font-black">
              🏆 Historial de Rifas
            </h1>

            <p className="mt-2 text-slate-600">
              Rifas realizadas, participantes, premios y ganadores.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/rifas"
              className="rounded-xl border bg-white px-5 py-3 font-bold"
            >
              ← Volver a Rifas
            </a>

            <button
              onClick={cargarRifas}
              className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {cargando && (
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold">
              ⏳ Cargando historial...
            </p>
          </div>
        )}

        {!cargando && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">❌ {error}</p>
          </div>
        )}

        {!cargando && !error && rifas.length === 0 && (
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🎟️</div>

            <p className="mt-4 text-xl font-bold">
              Todavía no hay rifas guardadas.
            </p>
          </div>
        )}

        {!cargando && !error && rifas.length > 0 && (
          <div className="space-y-5">
            {rifas.map((rifa) => (
              <section
                key={rifa.id}
                className="overflow-hidden rounded-3xl border bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5 md:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black">
                        {rifa.nombre}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                          rifa.estado === "finalizada"
                            ? "bg-green-100 text-green-700"
                            : rifa.estado === "en_curso"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {rifa.estado === "finalizada"
                          ? "Finalizada"
                          : rifa.estado === "en_curso"
                          ? "En curso"
                          : "Preparada"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Creada: {fecha(rifa.created_at)}
                    </p>

                    {rifa.finalizada_at && (
                      <p className="text-sm text-slate-500">
                        Finalizada: {fecha(rifa.finalizada_at)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-slate-100 px-4 py-2">
                      <p className="text-xl font-black">
                        {rifa.total_participantes}
                      </p>
                      <p className="text-xs text-slate-500">
                        Participantes
                      </p>
                    </div>

                    <div className="rounded-xl bg-pink-50 px-4 py-2">
                      <p className="text-xl font-black text-pink-600">
                        {rifa.total_oportunidades}
                      </p>
                      <p className="text-xs text-slate-500">
                        Oportunidades
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
                  <div>
                    <h3 className="mb-3 text-lg font-black">
                      🎁 Premios
                    </h3>

                    {rifa.premios?.length ? (
                      <div className="space-y-2">
                        {[...rifa.premios]
                          .sort((a, b) => a.lugar - b.lugar)
                          .map((premio) => (
                            <div
                              key={premio.lugar}
                              className="rounded-xl bg-slate-50 p-3"
                            >
                              <span className="font-black">
                                {iconoLugar(premio.lugar)}{" "}
                                {premio.lugar}.º lugar:
                              </span>{" "}
                              {premio.premio}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        Sin premios registrados.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-black">
                      🏆 Ganadores
                    </h3>

                    {rifa.ganadores?.length ? (
                      <div className="space-y-2">
                        {[...rifa.ganadores]
                          .sort((a, b) => a.lugar - b.lugar)
                          .map((ganador) => (
                            <div
                              key={`${rifa.id}-${ganador.lugar}`}
                              className="rounded-xl border border-pink-100 bg-pink-50 p-3"
                            >
                              <p className="font-black text-pink-700">
                                {iconoLugar(ganador.lugar)}{" "}
                                {ganador.participante.nombre}
                              </p>

                              <p className="text-sm text-slate-600">
                                🎁 {ganador.premio}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        Aún no hay ganadores.
                      </p>
                    )}
                  </div>
                </div>

                <details className="border-t">
                  <summary className="cursor-pointer p-5 font-bold md:px-6">
                    👥 Ver participantes
                  </summary>

                  <div className="max-h-72 overflow-y-auto border-t bg-slate-50 p-4 md:px-6">
                    {rifa.participantes?.length ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {rifa.participantes.map(
                          (participante, indice) => (
                            <div
                              key={`${rifa.id}-${participante.id}`}
                              className="rounded-xl bg-white p-3"
                            >
                              <p className="font-bold">
                                {indice + 1}. {participante.nombre}
                              </p>

                              <p className="text-sm text-slate-500">
                                🎟️ {participante.oportunidades}{" "}
                                {participante.oportunidades === 1
                                  ? "oportunidad"
                                  : "oportunidades"}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        Sin participantes registrados.
                      </p>
                    )}
                  </div>
                </details>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}