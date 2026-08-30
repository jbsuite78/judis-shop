"use client";

import { useMemo, useState } from "react";

type Participante = {
  id: number;
  nombre: string;
  oportunidades: number;
};

export default function RifasPage() {
  const [nombreRifa, setNombreRifa] = useState("");
  const [premio, setPremio] = useState("");
  const [nombreParticipante, setNombreParticipante] = useState("");
  const [oportunidades, setOportunidades] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const totalBoletos = useMemo(
    () =>
      participantes.reduce(
        (total, participante) => total + participante.oportunidades,
        0
      ),
    [participantes]
  );

  const agregarParticipante = () => {
    const nombre = nombreParticipante.trim();

    if (!nombre) return;

    setParticipantes((actuales) => [
      ...actuales,
      {
        id: Date.now(),
        nombre,
        oportunidades: Math.max(1, oportunidades),
      },
    ]);

    setNombreParticipante("");
    setOportunidades(1);
  };

  const eliminarParticipante = (id: number) => {
    setParticipantes((actuales) =>
      actuales.filter((participante) => participante.id !== id)
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="font-bold uppercase tracking-[0.25em] text-pink-600">
            Judi&apos;s Shop
          </p>

          <h1 className="mt-2 text-4xl font-black">
            🎟️ Rifas en vivo
          </h1>

          <p className="mt-2 text-slate-600">
            Crea la rifa, registra participantes y prepara el sorteo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold">
              1. Datos de la rifa
            </h2>

            <label className="mb-2 block font-semibold">
              Nombre de la rifa
            </label>

            <input
              value={nombreRifa}
              onChange={(e) => setNombreRifa(e.target.value)}
              placeholder="Ej. Rifa de la Independencia 🇲🇽"
              className="mb-5 w-full rounded-xl border p-3"
            />

            <label className="mb-2 block font-semibold">
              Premio
            </label>

            <input
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              placeholder="Ej. Bolsa Guess + Perfume"
              className="w-full rounded-xl border p-3"
            />
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold">
              2. Agregar participante
            </h2>

            <label className="mb-2 block font-semibold">
              Nombre
            </label>

            <input
              value={nombreParticipante}
              onChange={(e) => setNombreParticipante(e.target.value)}
              placeholder="Nombre del participante"
              className="mb-5 w-full rounded-xl border p-3"
            />

            <label className="mb-2 block font-semibold">
              Oportunidades
            </label>

            <input
              type="number"
              min={1}
              value={oportunidades}
              onChange={(e) =>
                setOportunidades(Math.max(1, Number(e.target.value)))
              }
              className="mb-5 w-full rounded-xl border p-3"
            />

            <button
              onClick={agregarParticipante}
              className="w-full rounded-xl bg-pink-600 px-5 py-3 font-bold text-white"
            >
              + Agregar participante
            </button>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                3. Participantes
              </h2>

              <p className="text-slate-500">
                {participantes.length} participantes · {totalBoletos} oportunidades
              </p>
            </div>

            <button
              disabled={
                participantes.length < 2 ||
                !nombreRifa.trim() ||
                !premio.trim()
              }
              className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              🎬 Preparar sorteo en vivo
            </button>
          </div>

          {participantes.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
              Todavía no hay participantes.
            </div>
          ) : (
            <div className="space-y-3">
              {participantes.map((participante, indice) => (
                <div
                  key={participante.id}
                  className="flex items-center justify-between rounded-2xl border p-4"
                >
                  <div>
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

                  <button
                    onClick={() =>
                      eliminarParticipante(participante.id)
                    }
                    className="rounded-lg border px-3 py-2 text-sm font-semibold"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}