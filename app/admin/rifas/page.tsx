"use client";

import { useMemo, useRef, useState } from "react";

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

type FacingMode = "user" | "environment";

const ORDEN_LUGARES: Array<1 | 2 | 3> = [3, 2, 1];

export default function RifasPage() {
  const [nombreRifa, setNombreRifa] = useState("");
  const [premios, setPremios] = useState(["", "", ""]);

  const [nombreParticipante, setNombreParticipante] = useState("");
  const [oportunidades, setOportunidades] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [estudioActivo, setEstudioActivo] = useState(false);
  const [ganadores, setGanadores] = useState<Ganador[]>([]);
  const [ganadorRevelado, setGanadorRevelado] =
    useState<Ganador | null>(null);
  const [revelando, setRevelando] = useState(false);

  // Cámara
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [facingMode, setFacingMode] =
    useState<FacingMode>("user");
  const [errorCamara, setErrorCamara] = useState("");

  const totalBoletos = useMemo(
    () =>
      participantes.reduce(
        (total, participante) =>
          total + participante.oportunidades,
        0
      ),
    [participantes]
  );

  const todosLosPremiosListos =
    premios[0].trim() !== "" &&
    premios[1].trim() !== "" &&
    premios[2].trim() !== "";

  const siguienteLugar = ORDEN_LUGARES[ganadores.length];

  // Participantes que todavía pueden ganar
  const participantesDisponibles = useMemo(() => {
    const idsGanadores = new Set(
      ganadores.map(
        (ganador) => ganador.participante.id
      )
    );

    return participantes.filter(
      (participante) =>
        !idsGanadores.has(participante.id)
    );
  }, [participantes, ganadores]);

  // Nombres que aparecen físicamente dentro de la tómbola.
  // Más oportunidades = mayor presencia visual.
  const nombresTombola = useMemo(() => {
    const entradas: {
      key: string;
      nombre: string;
    }[] = [];

    participantesDisponibles.forEach(
      (participante) => {
        for (
          let i = 0;
          i < participante.oportunidades;
          i++
        ) {
          entradas.push({
            key: `${participante.id}-${i}`,
            nombre: participante.nombre,
          });
        }
      }
    );

    if (entradas.length === 0) return [];

    const limite = 30;

    const visibles =
      entradas.length <= limite
        ? entradas
        : Array.from(
            { length: limite },
            (_, indice) =>
              entradas[
                Math.floor(
                  (indice * entradas.length) /
                    limite
                )
              ]
          );

    return visibles.map((entrada, indice) => {
      const angulo = indice * 137.5;
      const anillo = indice % 4;

      const radio =
        anillo === 0
          ? 15
          : anillo === 1
          ? 25
          : anillo === 2
          ? 34
          : 40;

      const radianes =
        (angulo * Math.PI) / 180;

      return {
        ...entrada,
        left:
          50 +
          Math.cos(radianes) * radio,
        top:
          50 +
          Math.sin(radianes) * radio,
        delay: (indice % 8) * 0.1,
      };
    });
  }, [participantesDisponibles]);

  const cambiarPremio = (
    indice: number,
    valor: string
  ) => {
    setPremios((actuales) =>
      actuales.map((premio, i) =>
        i === indice ? valor : premio
      )
    );
  };

  const agregarParticipante = () => {
    const nombre =
      nombreParticipante.trim();

    if (!nombre) return;

    setParticipantes((actuales) => [
      ...actuales,
      {
        id:
          Date.now() +
          Math.floor(Math.random() * 1000),
        nombre,
        oportunidades: Math.max(
          1,
          oportunidades
        ),
      },
    ]);

    setNombreParticipante("");
    setOportunidades(1);
  };

  const eliminarParticipante = (
    id: number
  ) => {
    setParticipantes((actuales) =>
      actuales.filter(
        (participante) =>
          participante.id !== id
      )
    );
  };

  const esperar = (ms: number) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  // Sorteo real ponderado
 const elegirGanadorPonderado = (
  disponibles: Participante[]
): Participante | null => {
  if (disponibles.length === 0) return null;

  const totalOportunidades = disponibles.reduce(
    (total, participante) =>
      total + Math.max(1, participante.oportunidades),
    0
  );

  let numeroAleatorio = Math.random() * totalOportunidades;

  for (const participante of disponibles) {
    numeroAleatorio -= Math.max(1, participante.oportunidades);

    if (numeroAleatorio < 0) {
      return participante;
    }
  }

  return disponibles[disponibles.length - 1];
};

  const abrirEstudio = () => {
    if (
      !nombreRifa.trim() ||
      !todosLosPremiosListos ||
      participantes.length < 3
    ) {
      return;
    }

    setGanadores([]);
    setGanadorRevelado(null);
    setRevelando(false);
    setEstudioActivo(true);
  };

  const sacarSiguienteGanador =
    async () => {
      if (
        !siguienteLugar ||
        revelando
      ) {
        return;
      }

      setGanadorRevelado(null);
      setRevelando(true);

      // El 1.er lugar tiene mayor suspenso.
      const tiempoSuspenso =
        siguienteLugar === 1
          ? 4500
          : 3000;

      await esperar(tiempoSuspenso);

      const participante =
        elegirGanadorPonderado(
          participantesDisponibles
        );

      if (!participante) {
        setRevelando(false);
        return;
      }

      const nuevoGanador: Ganador = {
        participante,
        lugar: siguienteLugar,
        premio:
          premios[
            siguienteLugar - 1
          ].trim(),
      };

      setGanadores((actuales) => [
        ...actuales,
        nuevoGanador,
      ]);

      setGanadorRevelado(nuevoGanador);
      setRevelando(false);
    };

  const iniciarCamara = async (
    modo: FacingMode = facingMode
  ) => {
    try {
      setErrorCamara("");

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: {
                ideal: modo,
              },
            },
            audio: true,
          }
        );

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;
      }

      setCamaraActiva(true);
      setMicrofonoActivo(true);
      setFacingMode(modo);
    } catch {
      setCamaraActiva(false);
      setErrorCamara(
        "No fue posible activar la cámara. Revisa los permisos del navegador."
      );
    }
  };

  const detenerCamara = () => {
    streamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCamaraActiva(false);
  };

  const cambiarCamara = async () => {
    const nueva: FacingMode =
      facingMode === "user"
        ? "environment"
        : "user";

    await iniciarCamara(nueva);
  };

  const alternarMicrofono = () => {
    const tracks =
      streamRef.current?.getAudioTracks() ??
      [];

    tracks.forEach((track) => {
      track.enabled =
        !microfonoActivo;
    });

    setMicrofonoActivo(
      (actual) => !actual
    );
  };

  const pantallaCompleta =
    async () => {
      try {
        if (
          !document.fullscreenElement
        ) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    };

  const iconoLugar = (
    lugar: number
  ) => {
    if (lugar === 1) return "🥇";
    if (lugar === 2) return "🥈";
    return "🥉";
  };

  const textoLugar = (
    lugar: number
  ) => {
    if (lugar === 1)
      return "1.er lugar";

    if (lugar === 2)
      return "2.º lugar";

    return "3.er lugar";
  };

  const salirEstudio = () => {
    detenerCamara();
    setEstudioActivo(false);
    setGanadores([]);
    setGanadorRevelado(null);
    setRevelando(false);
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
              Cámara, tómbola y ganadores en una sola pantalla.
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
                onChange={(e) =>
                  setNombreRifa(
                    e.target.value
                  )
                }
                placeholder="Ej. Rifa de la Independencia 🇲🇽"
                className="mb-5 w-full rounded-xl border p-3"
              />

              <label className="mb-2 block font-semibold">
                🥇 Premio 1.er lugar
              </label>

              <input
                value={premios[0]}
                onChange={(e) =>
                  cambiarPremio(
                    0,
                    e.target.value
                  )
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
                  cambiarPremio(
                    1,
                    e.target.value
                  )
                }
                placeholder="Ej. Cartera Steve Madden"
                className="mb-4 w-full rounded-xl border p-3"
              />

              <label className="mb-2 block font-semibold">
                🥉 Premio 3.er lugar
              </label>

              <input
                value={premios[2]}
                onChange={(e) =>
                  cambiarPremio(
                    2,
                    e.target.value
                  )
                }
                placeholder="Ej. Perfume"
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
                value={
                  nombreParticipante
                }
                onChange={(e) =>
                  setNombreParticipante(
                    e.target.value
                  )
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
                    Math.max(
                      1,
                      Number(
                        e.target.value
                      )
                    )
                  )
                }
                className="mb-5 w-full rounded-xl border p-3"
              />

              <button
                onClick={
                  agregarParticipante
                }
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
                  {participantes.length}{" "}
                  participantes ·{" "}
                  {totalBoletos}{" "}
                  oportunidades
                </p>
              </div>

              <button
                onClick={abrirEstudio}
                disabled={
                  !nombreRifa.trim() ||
                  !todosLosPremiosListos ||
                  participantes.length <
                    3
                }
                className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                🎬 Abrir estudio de
                rifa
              </button>
            </div>

            {participantes.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
                Todavía no hay
                participantes.
              </div>
            ) : (
              <div className="space-y-3">
                {participantes.map(
                  (
                    participante,
                    indice
                  ) => (
                    <div
                      key={
                        participante.id
                      }
                      className="flex items-center justify-between rounded-2xl border p-4"
                    >
                      <div>
                        <p className="font-bold">
                          {indice + 1}.{" "}
                          {
                            participante.nombre
                          }
                        </p>

                        <p className="text-sm text-slate-500">
                          🎟️{" "}
                          {
                            participante.oportunidades
                          }{" "}
                          {participante.oportunidades ===
                          1
                            ? "oportunidad"
                            : "oportunidades"}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          eliminarParticipante(
                            participante.id
                          )
                        }
                        className="rounded-lg border px-3 py-2 text-sm font-semibold"
                      >
                        Eliminar
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {estudioActivo && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950 text-white">
          <div className="mx-auto min-h-screen max-w-[1600px] p-3 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black uppercase tracking-[0.3em] text-pink-400">
                  🔴 Judi&apos;s Shop ·
                  Estudio de rifa
                </p>

                <h1 className="mt-1 text-2xl font-black md:text-4xl">
                  {nombreRifa}
                </h1>
              </div>

              <button
                onClick={
                  salirEstudio
                }
                className="rounded-xl border border-white/30 px-4 py-2 font-bold"
              >
                ✕ Salir
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* CÁMARA */}
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                <div className="relative aspect-video min-h-[260px] bg-black md:min-h-[520px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />

                  {!camaraActiva && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-7xl">
                        🎥
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        Cámara del
                        conductor
                      </h2>

                      <button
                        onClick={() =>
                          iniciarCamara()
                        }
                        className="mt-6 rounded-xl bg-pink-600 px-6 py-3 font-bold"
                      >
                        🎥 Activar cámara
                        y micrófono
                      </button>

                      {errorCamara && (
                        <p className="mt-4 max-w-md text-sm text-red-300">
                          {
                            errorCamara
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {camaraActiva && (
                    <div className="absolute left-3 top-3 rounded-full bg-red-600 px-4 py-2 text-sm font-black">
                      ● CÁMARA ACTIVA
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2 p-3">
                  {camaraActiva && (
                    <>
                      <button
                        onClick={
                          cambiarCamara
                        }
                        className="rounded-xl bg-white/10 px-4 py-2 font-bold"
                      >
                        🔄 Cambiar cámara
                      </button>

                      <button
                        onClick={
                          alternarMicrofono
                        }
                        className="rounded-xl bg-white/10 px-4 py-2 font-bold"
                      >
                        {microfonoActivo
                          ? "🎙️ Micrófono"
                          : "🔇 Silenciado"}
                      </button>

                      <button
                        onClick={
                          detenerCamara
                        }
                        className="rounded-xl bg-white/10 px-4 py-2 font-bold"
                      >
                        ⏹ Cámara
                      </button>
                    </>
                  )}
                </div>
              </section>

              {/* TÓMBOLA DE NOMBRES */}
              <section className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900 p-4 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-400">
                  🎟️ Tómbola
                  Judi&apos;s
                </p>

                <div className="relative mt-5">
                  <div className="judis-drum relative h-[300px] w-[300px] overflow-hidden rounded-full border-[10px] border-pink-500/80 bg-gradient-to-br from-slate-700 via-slate-900 to-black shadow-2xl md:h-[390px] md:w-[390px]">
                    <div className="absolute inset-3 rounded-full border-4 border-white/20" />

                    <div
                      className={`judis-wheel absolute inset-5 ${
                        revelando
                          ? "judis-wheel-fast"
                          : ""
                      }`}
                    >
                      {nombresTombola.map(
                        (
                          boleto,
                          indice
                        ) => (
                          <div
                            key={`${boleto.key}-${indice}`}
                            className="absolute"
                            style={{
                              left: `${boleto.left}%`,
                              top: `${boleto.top}%`,
                            }}
                          >
                            <div
                              className={`judis-name-counter ${
                                revelando
                                  ? "judis-name-counter-fast"
                                  : ""
                              }`}
                            >
                              <div
                                className="judis-name-ball whitespace-nowrap rounded-full border-2 border-white/70 bg-pink-500 px-3 py-2 text-xs font-black text-white shadow-lg md:px-4 md:py-2.5 md:text-sm"
                                style={{
                                  animationDelay: `${boleto.delay}s`,
                                }}
                              >
                                {
                                  boleto.nombre
                                }
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30" />

                    <div className="pointer-events-none absolute left-[14%] top-[10%] h-[35%] w-[18%] rotate-[25deg] rounded-full bg-white/10 blur-md" />
                  </div>

                  <div className="mx-auto h-16 w-5 bg-pink-500" />

                  <div className="mx-auto h-5 w-44 rounded-full bg-pink-500" />
                </div>

                <div className="mt-4 min-h-[135px] w-full">
                  {revelando && (
                    <div className="animate-pulse">
                      <p className="text-xl font-black text-pink-400 md:text-2xl">
                        🎰 SACANDO{" "}
                        {textoLugar(
                          siguienteLugar
                        ).toUpperCase()}
                        ...
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        Los nombres siguen
                        girando...
                      </p>
                    </div>
                  )}

                  {!revelando &&
                    ganadorRevelado && (
                      <div className="mx-auto max-w-md rounded-2xl bg-white p-4 text-slate-950 shadow-2xl">
                        <div className="text-5xl">
                          {iconoLugar(
                            ganadorRevelado.lugar
                          )}
                        </div>

                        <p className="mt-2 font-black uppercase text-pink-600">
                          {textoLugar(
                            ganadorRevelado.lugar
                          )}
                        </p>

                        <p className="mt-2 text-3xl font-black">
                          {
                            ganadorRevelado
                              .participante
                              .nombre
                          }
                        </p>

                        <p className="mt-3 text-sm text-slate-600">
                          🎁{" "}
                          {
                            ganadorRevelado.premio
                          }
                        </p>
                      </div>
                    )}
                </div>

                {ganadores.length <
                  3 && (
                  <button
                    onClick={
                      sacarSiguienteGanador
                    }
                    disabled={
                      revelando
                    }
                    className="mt-3 w-full max-w-md rounded-2xl bg-pink-600 px-6 py-4 text-xl font-black text-white disabled:opacity-50"
                  >
                    {revelando
                      ? "🎰 Girando..."
                      : siguienteLugar ===
                        3
                      ? "🥉 Sacar 3.er lugar"
                      : siguienteLugar ===
                        2
                      ? "🥈 Sacar 2.º lugar"
                      : "🥇 Sacar 1.er lugar"}
                  </button>
                )}

                {ganadores.length ===
                  3 &&
                  !revelando && (
                    <div className="mt-4 w-full">
                      <p className="text-3xl font-black text-pink-400">
                        🎉 ¡RIFA
                        FINALIZADA! 🎉
                      </p>
                    </div>
                  )}
              </section>
            </div>

            {ganadores.length >
              0 && (
              <section className="mt-4 rounded-3xl border border-white/10 bg-slate-900 p-4">
                <h2 className="mb-4 text-center text-xl font-black">
                  🏆 Resultados
                </h2>

                <div className="grid gap-3 md:grid-cols-3">
                  {[...ganadores]
                    .sort(
                      (a, b) =>
                        a.lugar -
                        b.lugar
                    )
                    .map(
                      (ganador) => (
                        <div
                          key={
                            ganador.lugar
                          }
                          className="rounded-2xl bg-white p-4 text-center text-slate-950"
                        >
                          <div className="text-4xl">
                            {iconoLugar(
                              ganador.lugar
                            )}
                          </div>

                          <p className="font-black text-pink-600">
                            {textoLugar(
                              ganador.lugar
                            )}
                          </p>

                          <p className="mt-1 text-xl font-black">
                            {
                              ganador
                                .participante
                                .nombre
                            }
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            🎁{" "}
                            {
                              ganador.premio
                            }
                          </p>
                        </div>
                      )
                    )}
                </div>
              </section>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={
                  pantallaCompleta
                }
                className="rounded-xl bg-pink-600 px-5 py-3 font-bold"
              >
                ⛶ Pantalla completa
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes judisWheelSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes judisCounterSpin {
          from {
            transform: translate(-50%, -50%)
              rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%)
              rotate(-360deg);
          }
        }

        @keyframes judisNameBounce {
          0%,
          100% {
            transform: translateY(0)
              scale(1);
          }
          50% {
            transform: translateY(-8px)
              scale(1.05);
          }
        }

        .judis-wheel {
          animation: judisWheelSpin 5s linear
            infinite;
          transition: animation-duration 0.3s ease;
        }

        .judis-wheel-fast {
          animation-duration: 1.25s;
        }

        .judis-name-counter {
          animation: judisCounterSpin 5s linear
            infinite;
          transition: animation-duration 0.3s ease;
        }

        .judis-name-counter-fast {
          animation-duration: 1.25s;
        }

        .judis-name-ball {
          animation: judisNameBounce 0.9s
            ease-in-out infinite;
        }

        .judis-drum {
          box-shadow:
            inset 0 0 35px rgba(255, 255, 255, 0.08),
            inset 0 0 70px rgba(236, 72, 153, 0.08),
            0 18px 45px rgba(0, 0, 0, 0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .judis-wheel,
          .judis-name-counter,
          .judis-name-ball {
            animation-duration: 8s;
          }
        }
      `}</style>
    </>
  );
}