"use client";

import { useMemo, useState } from "react";

type Participante = {
  id: number;
  nombre: string;
  oportunidades: number;
};

type Ganador = {
  participante: Participante;
  lugar: number;
  premio: string;
};

export default function RifasPage() {
  const [nombreRifa, setNombreRifa] = useState("");

  const [premios, setPremios] = useState([
    "",
    "",
    "",
  ]);

  const [nombreParticipante, setNombreParticipante] = useState("");
  const [oportunidades, setOportunidades] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [sorteoActivo, setSorteoActivo] = useState(false);
  const [cuenta, setCuenta] = useState(5);
  const [girando, setGirando] = useState(false);
  const [ganadores, setGanadores] = useState<Ganador[]>([]);

  const totalBoletos = useMemo(
    () =>
      participantes.reduce(
        (total, participante) => total + participante.oportunidades,
        0
      ),
    [participantes]
  );

  const premiosActivos = premios
    .map((premio, indice) => ({
      lugar: indice + 1,
      premio: premio.trim(),
    }))
    .filter((item) => item.premio !== "");

  const cambiarPremio = (indice: number, valor: string) => {
    setPremios((actuales) =>
      actuales.map((premio, i) =>
        i === indice ? valor : premio
      )
    );
  };

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

  const esperar = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const elegirUnGanador = (
    disponibles: Participante[]
  ): Participante | null => {
    const boletos: Participante[] = [];

    disponibles.forEach((participante) => {
      for (let i = 0; i < participante.oportunidades; i++) {
        boletos.push(participante);
      }
    });

    if (boletos.length === 0) return null;

    const indice = Math.floor(Math.random() * boletos.length);

    return boletos[indice];
  };

  const elegirGanadores = () => {
    let disponibles = [...participantes];
    const resultados: Ganador[] = [];

    for (const premioInfo of premiosActivos) {
      const ganador = elegirUnGanador(disponibles);

      if (!ganador) break;

      resultados.push({
        participante: ganador,
        lugar: premioInfo.lugar,
        premio: premioInfo.premio,
      });

      disponibles = disponibles.filter(
        (participante) => participante.id !== ganador.id
      );
    }

    return resultados;
  };

  const iniciarSorteo = async () => {
    if (
      !nombreRifa.trim() ||
      premiosActivos.length === 0 ||
      participantes.length < premiosActivos.length
    ) {
      return;
    }

    setSorteoActivo(true);
    setGanadores([]);
    setGirando(true);

    for (let numero = 5; numero >= 1; numero--) {
      setCuenta(numero);
      await esperar(1000);
    }

    setCuenta(0);

    await esperar(1500);

    const resultados = elegirGanadores();

    setGanadores(resultados);
    setGirando(false);
  };

  const pantallaCompleta = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  };

  const iconoLugar = (lugar: number) => {
    if (lugar === 1) return "🥇";
    if (lugar === 2) return "🥈";
    return "🥉";
  };

  return (
    <>
      <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
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
                🥇 Premio 1.er lugar
              </label>

              <input
                value={premios[0]}
                onChange={(e) =>
                  cambiarPremio(0, e.target.value)
                }
                placeholder="Ej. Bolsa Guess"
                className="mb-4 w-full rounded-xl border p-3"
              />

              <label className="mb-2 block font-semibold">
                🥈 Premio 2.º lugar
              </label>

              <input
                value={premios[1]}
                onChange={(e) =>
                  cambiarPremio(1, e.target.value)
                }
                placeholder="Opcional"
                className="mb-4 w-full rounded-xl border p-3"
              />

              <label className="mb-2 block font-semibold">
                🥉 Premio 3.er lugar
              </label>

              <input
                value={premios[2]}
                onChange={(e) =>
                  cambiarPremio(2, e.target.value)
                }
                placeholder="Opcional"
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
                onChange={(e) =>
                  setNombreParticipante(e.target.value)
                }
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
                  setOportunidades(
                    Math.max(1, Number(e.target.value))
                  )
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
                  {participantes.length} participantes ·{" "}
                  {totalBoletos} oportunidades
                </p>
              </div>

              <button
                onClick={iniciarSorteo}
                disabled={
                  !nombreRifa.trim() ||
                  premiosActivos.length === 0 ||
                  participantes.length < premiosActivos.length
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

      {sorteoActivo && (
        <div className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950 p-6 text-white">
          <div className="w-full max-w-5xl text-center">
            <p className="mb-4 text-xl font-bold uppercase tracking-[0.35em] text-pink-400">
              Judi&apos;s Shop
            </p>

            <h1 className="text-4xl font-black md:text-6xl">
              {nombreRifa}
            </h1>

            {girando && cuenta > 0 && (
              <div className="my-12">
                <p className="mb-6 text-2xl font-bold">
                  El sorteo comienza en...
                </p>

                <div className="text-[9rem] font-black leading-none text-pink-500 md:text-[14rem]">
                  {cuenta}
                </div>
              </div>
            )}

            {girando && cuenta === 0 && (
              <div className="my-16">
                <div className="animate-pulse text-5xl font-black md:text-7xl">
                  🎟️ ELIGIENDO GANADORES...
                </div>

                <p className="mt-8 text-2xl text-slate-300">
                  {totalBoletos} oportunidades participando
                </p>
              </div>
            )}

            {!girando && ganadores.length > 0 && (
              <div className="my-10 grid gap-5 md:grid-cols-3">
                {ganadores.map((ganador) => (
                  <div
                    key={ganador.lugar}
                    className="rounded-[2rem] bg-white p-7 text-slate-950 shadow-2xl"
                  >
                    <div className="text-6xl">
                      {iconoLugar(ganador.lugar)}
                    </div>

                    <p className="mt-4 text-xl font-black text-pink-600">
                      {ganador.lugar}.º LUGAR
                    </p>

                    <h2 className="mt-4 text-3xl font-black md:text-4xl">
                      {ganador.participante.nombre}
                    </h2>

                    <div className="my-5 border-t" />

                    <p className="text-sm font-semibold uppercase text-slate-500">
                      Premio
                    </p>

                    <p className="mt-2 text-xl font-bold">
                      🎁 {ganador.premio}
                    </p>

                    <p className="mt-4 text-sm text-slate-500">
                      🎟️ {ganador.participante.oportunidades}{" "}
                      {ganador.participante.oportunidades === 1
                        ? "oportunidad"
                        : "oportunidades"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={pantallaCompleta}
                className="rounded-xl bg-pink-600 px-6 py-3 font-bold"
              >
                ⛶ Pantalla completa
              </button>

              {!girando && ganadores.length > 0 && (
                <button
                  onClick={iniciarSorteo}
                  className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
                >
                  🔄 Nueva ronda
                </button>
              )}

              <button
                onClick={() => {
                  setSorteoActivo(false);
                  setGanadores([]);
                }}
                className="rounded-xl border border-white/30 px-6 py-3 font-bold"
              >
                ✕ Salir del sorteo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}