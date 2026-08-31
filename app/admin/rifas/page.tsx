"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Participante = {
  id: number;
  nombre: string;
  oportunidades: number;
};

type Premio = {
  lugar: 1 | 2 | 3;
  premio: string;
};

type Ganador = Premio & {
  participante: Participante;
};

type FacingMode = "user" | "environment";

export default function RifasPage() {
  const [nombreRifa, setNombreRifa] = useState("");
  const [premios, setPremios] = useState(["", "", ""]);

  const [nombreParticipante, setNombreParticipante] =
    useState("");

  const [oportunidades, setOportunidades] = useState(1);

  const [participantes, setParticipantes] = useState<
    Participante[]
  >([]);

  const [estudioActivo, setEstudioActivo] =
    useState(false);

  const [ganadores, setGanadores] = useState<
    Ganador[]
  >([]);

  const [ganadorRevelado, setGanadorRevelado] =
    useState<Ganador | null>(null);

  const [revelando, setRevelando] = useState(false);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [camaraActiva, setCamaraActiva] =
    useState(false);

  const [microfonoActivo, setMicrofonoActivo] =
    useState(true);

  const [facingMode, setFacingMode] =
    useState<FacingMode>("user");

  const [errorCamara, setErrorCamara] =
    useState("");

  const totalBoletos = useMemo(() => {
    return participantes.reduce(
      (total, participante) =>
        total +
        Math.max(1, participante.oportunidades),
      0
    );
  }, [participantes]);

  const premiosActivos = useMemo<Premio[]>(() => {
    const activos: Premio[] = [];

    if (premios[0].trim()) {
      activos.push({
        lugar: 1,
        premio: premios[0].trim(),
      });
    }

    if (premios[1].trim()) {
      activos.push({
        lugar: 2,
        premio: premios[1].trim(),
      });
    }

    if (premios[2].trim()) {
      activos.push({
        lugar: 3,
        premio: premios[2].trim(),
      });
    }

    return activos.sort(
      (a, b) => b.lugar - a.lugar
    );
  }, [premios]);

  const siguientePremio =
    premiosActivos.find(
      (premio) =>
        !ganadores.some(
          (ganador) =>
            ganador.lugar === premio.lugar
        )
    ) ?? null;

  const participantesDisponibles = useMemo(() => {
    const ganadoresIds = new Set(
      ganadores.map(
        (ganador) =>
          ganador.participante.id
      )
    );

    return participantes.filter(
      (participante) =>
        !ganadoresIds.has(participante.id)
    );
  }, [participantes, ganadores]);

  /*
   * Solo limitamos la REPRESENTACIÓN VISUAL.
   * El sorteo real utiliza a todos los participantes.
   */
  const bolasVisuales = useMemo(() => {
    if (
      participantesDisponibles.length === 0
    ) {
      return [];
    }

    const limite = 34;

    const seleccionados =
      participantesDisponibles.length <= limite
        ? participantesDisponibles
        : Array.from(
            { length: limite },
            (_, indice) => {
              const posicion = Math.floor(
                (indice *
                  participantesDisponibles.length) /
                  limite
              );

              return participantesDisponibles[
                posicion
              ];
            }
          );

    return seleccionados.map(
      (participante, indice) => {
        const columna = indice % 7;
        const fila = Math.floor(indice / 7);

        return {
          ...participante,

          visualKey: `${participante.id}-${indice}`,

          left:
            8 +
            columna * 13 +
            ((indice * 7) % 6),

          top:
            13 +
            fila * 15 +
            ((indice * 11) % 8),

          delay:
            -((indice * 0.17) % 3),

          duration:
            2.4 +
            (indice % 7) * 0.16,

          variante: indice % 4,

          escala:
            0.84 +
            (indice % 5) * 0.045,
        };
      }
    );
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
          Math.floor(
            Math.random() * 100000
          ),

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

  /*
   * Sorteo ponderado eficiente.
   * NO crea una copia por cada oportunidad.
   */
  const elegirGanadorPonderado = (
    disponibles: Participante[]
  ): Participante | null => {
    if (disponibles.length === 0) {
      return null;
    }

    const totalOportunidades =
      disponibles.reduce(
        (total, participante) =>
          total +
          Math.max(
            1,
            participante.oportunidades
          ),
        0
      );

    let numeroAleatorio =
      Math.random() *
      totalOportunidades;

    for (const participante of disponibles) {
      numeroAleatorio -= Math.max(
        1,
        participante.oportunidades
      );

      if (numeroAleatorio < 0) {
        return participante;
      }
    }

    return disponibles[
      disponibles.length - 1
    ];
  };

  const abrirEstudio = () => {
    if (
      !nombreRifa.trim() ||
      !premios[0].trim() ||
      premiosActivos.length === 0 ||
      participantes.length <
        premiosActivos.length
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
        !siguientePremio ||
        revelando
      ) {
        return;
      }

      setGanadorRevelado(null);
      setRevelando(true);

      /*
       * Durante este tiempo el tambor acelera.
       */
      const tiempo =
        siguientePremio.lugar === 1
          ? 5200
          : 3600;

      await esperar(tiempo);

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
        lugar: siguientePremio.lugar,
        premio: siguientePremio.premio,
      };

      setGanadores((actuales) => [
        ...actuales,
        nuevoGanador,
      ]);

      setGanadorRevelado(
        nuevoGanador
      );

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

              width: {
                ideal: 1920,
              },

              height: {
                ideal: 1080,
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
    if (lugar === 1) {
      return "1.er lugar";
    }

    if (lugar === 2) {
      return "2.º lugar";
    }

    return "3.er lugar";
  };

  const textoBoton = () => {
    if (!siguientePremio) {
      return "Rifa finalizada";
    }

    if (
      siguientePremio.lugar === 1
    ) {
      return "🥇 Sacar 1.er lugar";
    }

    if (
      siguientePremio.lugar === 2
    ) {
      return "🥈 Sacar 2.º lugar";
    }

    return "🥉 Sacar 3.er lugar";
  };

  const salirEstudio = () => {
    detenerCamara();

    setEstudioActivo(false);
    setGanadores([]);
    setGanadorRevelado(null);
    setRevelando(false);
  };

  const rifaTerminada =
    premiosActivos.length > 0 &&
    ganadores.length ===
      premiosActivos.length;

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
              Cámara, tómbola y ganadores
              en una sola pantalla.
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
                placeholder="Premio principal"
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
                placeholder="Opcional"
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
                placeholder="Opcional"
                className="w-full rounded-xl border p-3"
              />

              <p className="mt-4 text-sm text-slate-500">
                {premiosActivos.length ===
                0
                  ? "Agrega al menos el premio de 1.er lugar."
                  : premiosActivos.length ===
                    1
                  ? "Se sorteará únicamente 1.er lugar."
                  : premiosActivos.length ===
                    2
                  ? "Secuencia: 2.º lugar → 1.er lugar."
                  : "Secuencia: 3.er lugar → 2.º lugar → 1.er lugar."}
              </p>
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
                  !premios[0].trim() ||
                  participantes.length <
                    premiosActivos.length
                }
                className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                🎬 Abrir estudio de rifa
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
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-[#04050a] text-white">
          <div className="mx-auto min-h-screen max-w-[1800px] p-3 md:p-6">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.34em] text-pink-400 md:text-sm">
                  ✦ JUDI&apos;S SHOP ·
                  ESTUDIO DE RIFA
                </p>

                <h1 className="mt-1 text-2xl font-black md:text-4xl">
                  {nombreRifa}
                </h1>
              </div>

              <button
                onClick={salirEstudio}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-bold"
              >
                ✕ Salir
              </button>
            </header>

            <div className="grid items-stretch gap-4 lg:grid-cols-2">
              {/* CÁMARA */}
              <section className="flex min-h-[650px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b17]">
                <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />

                  {!camaraActiva && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_center,#171a30_0%,#080a12_60%,#020307_100%)]">
                      <div className="flex w-full max-w-lg flex-col items-center justify-center px-6 text-center">
                        <div className="text-7xl">
                          🎥
                        </div>

                        <h2 className="mt-4 text-2xl font-black">
                          Cámara del
                          conductor
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                          Tu imagen aparecerá
                          centrada.
                        </p>

                        <button
                          onClick={() =>
                            iniciarCamara()
                          }
                          className="mt-6 rounded-2xl bg-pink-600 px-7 py-4 font-black shadow-lg"
                        >
                          🎥 Activar cámara y
                          micrófono
                        </button>

                        {errorCamara && (
                          <p className="mt-4 max-w-md text-sm text-red-300">
                            {errorCamara}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {camaraActiva && (
                    <>
                      <div className="absolute left-4 top-4 z-20 rounded-full bg-red-600 px-4 py-2 text-sm font-black shadow-lg">
                        ● CÁMARA ACTIVA
                      </div>

                      <div className="pointer-events-none absolute inset-0 z-10 border-[5px] border-white/[0.04]" />
                    </>
                  )}
                </div>

                <div className="flex min-h-[72px] flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#090b17] p-3">
                  {!camaraActiva && (
                    <span className="text-sm text-slate-500">
                      Cámara lista para
                      activarse
                    </span>
                  )}

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

              {/* TÓMBOLA NUEVA */}
              <section className="relative flex min-h-[650px] flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,#202744_0%,#0b0e18_48%,#030409_100%)] px-3 pb-4 pt-4 text-center">
                <div className="absolute left-1/2 top-[-100px] h-[280px] w-[520px] -translate-x-1/2 rounded-full bg-pink-500/10 blur-[90px]" />

                <div className="relative z-20">
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-pink-400 md:text-sm">
                    ✦ TÓMBOLA JUDI&apos;S ✦
                  </p>

                  <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Sorteo en proceso
                  </p>
                </div>

                <div
                  className={`lottery-machine ${
                    revelando
                      ? "lottery-machine-shake"
                      : ""
                  }`}
                >
                  {/* LUZ SUPERIOR */}
                  <div className="machine-light-bar">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  {/* SOPORTE IZQUIERDO */}
                  <div className="machine-leg machine-leg-left" />

                  {/* SOPORTE DERECHO */}
                  <div className="machine-leg machine-leg-right" />

                  {/* EJE */}
                  <div className="machine-axis machine-axis-left" />
                  <div className="machine-axis machine-axis-right" />

                  {/* TAMBOR */}
                  <div className="lottery-drum">
                    <div
                      className={`drum-ribs ${
                        revelando
                          ? "drum-ribs-fast"
                          : ""
                      }`}
                    >
                      <div className="rib rib-1" />
                      <div className="rib rib-2" />
                      <div className="rib rib-3" />
                      <div className="rib rib-4" />
                      <div className="rib rib-5" />
                      <div className="rib rib-6" />
                    </div>

                    <div className="drum-inner-shadow" />

                    <div className="drum-center-axis">
                      <div className="axis-core" />
                    </div>

                    {/* BOLAS */}
                    <div
                      className={`balls-zone ${
                        revelando
                          ? "balls-zone-fast"
                          : ""
                      }`}
                    >
                      {bolasVisuales.map(
                        (bola) => {
                          const style = {
                            left: `${bola.left}%`,
                            top: `${bola.top}%`,
                            "--delay": `${bola.delay}s`,
                            "--duration": `${bola.duration}s`,
                            "--scale":
                              bola.escala,
                          } as CSSProperties;

                          return (
                            <div
                              key={
                                bola.visualKey
                              }
                              className={`raffle-ball raffle-ball-${bola.variante}`}
                              style={style}
                            >
                              <div className="raffle-ball-shine" />

                              <span className="raffle-ball-name">
                                {bola.nombre}
                              </span>

                              {bola.oportunidades >
                                1 && (
                                <span className="raffle-ball-chances">
                                  ×
                                  {
                                    bola.oportunidades
                                  }
                                </span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="drum-glass-highlight" />
                    <div className="drum-glass-highlight-two" />
                  </div>

                  {/* SALIDA */}
                  <div className="winner-chute">
                    <div className="winner-chute-neck" />

                    <div className="winner-chute-track">
                      <span className="winner-chute-label">
                        GANADOR
                      </span>
                    </div>
                  </div>

                  {/* BASE */}
                  <div className="machine-base">
                    <div className="machine-base-top" />

                    <div className="machine-logo">
                      JUDI&apos;S
                    </div>

                    <div className="machine-base-bottom" />
                  </div>
                </div>

                <div className="relative z-30 mt-1 min-h-[155px] w-full">
                  {revelando &&
                    siguientePremio && (
                      <div className="drawing-status">
                        <div className="drawing-pulse">
                          <span />
                          <span />
                          <span />
                        </div>

                        <p className="mt-3 text-xl font-black uppercase tracking-wide text-pink-400 md:text-2xl">
                          {iconoLugar(
                            siguientePremio.lugar
                          )}{" "}
                          Mezclando participantes...
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Buscando{" "}
                          {textoLugar(
                            siguientePremio.lugar
                          )}
                        </p>
                      </div>
                    )}

                  {!revelando &&
                    ganadorRevelado && (
                      <div className="extracted-winner">
                        <div className="extracted-ball">
                          <div className="extracted-ball-shine" />

                          <div className="text-3xl">
                            {iconoLugar(
                              ganadorRevelado.lugar
                            )}
                          </div>

                          <div className="extracted-name">
                            {
                              ganadorRevelado
                                .participante
                                .nombre
                            }
                          </div>
                        </div>

                        <div
                          className={`winner-card ${
                            ganadorRevelado.lugar ===
                            1
                              ? "winner-card-first"
                              : ""
                          }`}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-600">
                            {textoLugar(
                              ganadorRevelado.lugar
                            )}
                          </p>

                          <p className="mt-1 text-xl font-black text-slate-950 md:text-2xl">
                            {
                              ganadorRevelado
                                .participante
                                .nombre
                            }
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            🎁{" "}
                            {
                              ganadorRevelado.premio
                            }
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {!rifaTerminada &&
                  siguientePremio && (
                    <button
                      onClick={
                        sacarSiguienteGanador
                      }
                      disabled={revelando}
                      className="relative z-30 mt-2 w-full max-w-md rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 px-6 py-4 text-xl font-black shadow-[0_15px_40px_rgba(236,72,153,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {revelando
                        ? "🎰 MEZCLANDO..."
                        : textoBoton()}
                    </button>
                  )}

                {rifaTerminada &&
                  !revelando && (
                    <div className="relative z-30 mt-3 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-7 py-4">
                      <p className="text-2xl font-black text-pink-400">
                        🎉 ¡RIFA FINALIZADA! 🎉
                      </p>
                    </div>
                  )}

                <p className="relative z-30 mt-3 text-xs text-slate-500">
                  {
                    participantesDisponibles.length
                  }{" "}
                  participantes disponibles ·{" "}
                  {totalBoletos} oportunidades
                  totales
                </p>
              </section>
            </div>

            {ganadores.length > 0 && (
              <section className="mt-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
                <h2 className="mb-4 text-center text-xl font-black">
                  🏆 Resultados de la rifa
                </h2>

                <div
                  className={`grid gap-3 ${
                    premiosActivos.length ===
                    1
                      ? "mx-auto max-w-md"
                      : premiosActivos.length ===
                        2
                      ? "md:grid-cols-2"
                      : "md:grid-cols-3"
                  }`}
                >
                  {[...ganadores]
                    .sort(
                      (a, b) =>
                        a.lugar -
                        b.lugar
                    )
                    .map((ganador) => (
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

                        <p className="font-black uppercase text-pink-600">
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
                          {ganador.premio}
                        </p>
                      </div>
                    ))}
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
        @keyframes drumRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ballChaos0 {
          0%,
          100% {
            transform: translate(0, 0)
              rotate(0deg)
              scale(var(--scale));
          }

          25% {
            transform: translate(
                34px,
                -25px
              )
              rotate(95deg)
              scale(var(--scale));
          }

          50% {
            transform: translate(
                -24px,
                25px
              )
              rotate(180deg)
              scale(var(--scale));
          }

          75% {
            transform: translate(
                22px,
                17px
              )
              rotate(270deg)
              scale(var(--scale));
          }
        }

        @keyframes ballChaos1 {
          0%,
          100% {
            transform: translate(0, 0)
              rotate(0deg)
              scale(var(--scale));
          }

          25% {
            transform: translate(
                -30px,
                22px
              )
              rotate(-100deg)
              scale(var(--scale));
          }

          50% {
            transform: translate(
                28px,
                -22px
              )
              rotate(-190deg)
              scale(var(--scale));
          }

          75% {
            transform: translate(
                -18px,
                -28px
              )
              rotate(-280deg)
              scale(var(--scale));
          }
        }

        @keyframes ballChaos2 {
          0%,
          100% {
            transform: translate(0, 0)
              rotate(0deg)
              scale(var(--scale));
          }

          30% {
            transform: translate(
                17px,
                34px
              )
              rotate(120deg)
              scale(var(--scale));
          }

          60% {
            transform: translate(
                -32px,
                -16px
              )
              rotate(230deg)
              scale(var(--scale));
          }

          85% {
            transform: translate(
                30px,
                -18px
              )
              rotate(320deg)
              scale(var(--scale));
          }
        }

        @keyframes ballChaos3 {
          0%,
          100% {
            transform: translate(0, 0)
              rotate(0deg)
              scale(var(--scale));
          }

          20% {
            transform: translate(
                -22px,
                -32px
              )
              rotate(-90deg)
              scale(var(--scale));
          }

          55% {
            transform: translate(
                35px,
                14px
              )
              rotate(-210deg)
              scale(var(--scale));
          }

          80% {
            transform: translate(
                -14px,
                28px
              )
              rotate(-310deg)
              scale(var(--scale));
          }
        }

        @keyframes machineShake {
          0%,
          100% {
            transform: translateX(0);
          }

          25% {
            transform: translateX(-2px);
          }

          75% {
            transform: translateX(2px);
          }
        }

        @keyframes extraction {
          0% {
            opacity: 0;
            transform: translateY(-80px)
              scale(0.45)
              rotate(-140deg);
          }

          60% {
            opacity: 1;
            transform: translateY(7px)
              scale(1.08)
              rotate(8deg);
          }

          100% {
            opacity: 1;
            transform: translateY(0)
              scale(1)
              rotate(0);
          }
        }

        @keyframes winnerCard {
          from {
            opacity: 0;
            transform: translateY(12px)
              scale(0.92);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes winnerGlow {
          0%,
          100% {
            box-shadow:
              0 0 20px
                rgba(
                  236,
                  72,
                  153,
                  0.3
                ),
              0 15px 35px
                rgba(
                  0,
                  0,
                  0,
                  0.35
                );
          }

          50% {
            box-shadow:
              0 0 45px
                rgba(
                  236,
                  72,
                  153,
                  0.75
                ),
              0 0 75px
                rgba(
                  168,
                  85,
                  247,
                  0.35
                );
          }
        }

        @keyframes pulseDot {
          0%,
          100% {
            transform: translateY(0)
              scale(0.8);
            opacity: 0.45;
          }

          50% {
            transform: translateY(-7px)
              scale(1.15);
            opacity: 1;
          }
        }

        @keyframes lightBar {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        .lottery-machine {
          position: relative;
          width: min(96%, 610px);
          height: 445px;
          margin-top: 12px;
        }

        .lottery-machine-shake {
          animation: machineShake
            0.11s linear infinite;
        }

        .machine-light-bar {
          position: absolute;
          left: 50%;
          top: 0;
          z-index: 20;
          display: flex;
          transform: translateX(-50%);
          gap: 9px;
          border-radius: 999px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.18
            );
          background: linear-gradient(
            180deg,
            #374151,
            #111827
          );
          padding: 7px 18px;
          box-shadow:
            0 8px 20px
              rgba(
                0,
                0,
                0,
                0.45
              ),
            inset 0 1px 1px
              rgba(
                255,
                255,
                255,
                0.3
              );
        }

        .machine-light-bar span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #ec4899;
          box-shadow: 0 0 10px
            rgba(
              236,
              72,
              153,
              0.8
            );
          animation: lightBar
            1.2s ease-in-out
            infinite;
        }

        .machine-light-bar
          span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .machine-light-bar
          span:nth-child(3) {
          animation-delay: 0.3s;
        }

        .machine-light-bar
          span:nth-child(4) {
          animation-delay: 0.45s;
        }

        .machine-light-bar
          span:nth-child(5) {
          animation-delay: 0.6s;
        }

        .lottery-drum {
          position: absolute;
          left: 50%;
          top: 33px;
          z-index: 10;
          width: 88%;
          height: 325px;
          transform: translateX(-50%);
          overflow: hidden;
          border: 9px solid
            rgba(
              203,
              213,
              225,
              0.9
            );
          border-radius: 44% 44%
            42% 42% / 48% 48%
            43% 43%;
          background:
            radial-gradient(
              ellipse at 50% 40%,
              rgba(
                255,
                255,
                255,
                0.1
              ),
              transparent 55%
            ),
            linear-gradient(
              180deg,
              rgba(
                30,
                41,
                59,
                0.42
              ),
              rgba(
                2,
                6,
                23,
                0.88
              )
            );
          box-shadow:
            inset 0 0 35px
              rgba(
                255,
                255,
                255,
                0.1
              ),
            inset 0 -30px 50px
              rgba(
                0,
                0,
                0,
                0.55
              ),
            0 28px 45px
              rgba(
                0,
                0,
                0,
                0.48
              ),
            0 0 25px
              rgba(
                236,
                72,
                153,
                0.1
              );
        }

        .drum-ribs {
          position: absolute;
          inset: -20%;
          animation: drumRotate
            11s linear infinite;
          opacity: 0.35;
        }

        .drum-ribs-fast {
          animation-duration: 1.35s;
        }

        .rib {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 120%;
          height: 3px;
          transform-origin: center;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(
              226,
              232,
              240,
              0.65
            ),
            transparent
          );
        }

        .rib-1 {
          transform: translate(
              -50%,
              -50%
            )
            rotate(0deg);
        }

        .rib-2 {
          transform: translate(
              -50%,
              -50%
            )
            rotate(30deg);
        }

        .rib-3 {
          transform: translate(
              -50%,
              -50%
            )
            rotate(60deg);
        }

        .rib-4 {
          transform: translate(
              -50%,
              -50%
            )
            rotate(90deg);
        }

        .rib-5 {
          transform: translate(
              -50%,
              -50%
            )
            rotate(120deg);
        }

        .rib-6 {
          transform: translate(
              -50%,
              -50%
            )
            rotate(150deg);
        }

        .drum-center-axis {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 4;
          width: 64px;
          height: 64px;
          transform: translate(
            -50%,
            -50%
          );
          border-radius: 50%;
          border: 7px solid
            rgba(
              226,
              232,
              240,
              0.65
            );
          background: radial-gradient(
            circle,
            #f8fafc 0%,
            #64748b 42%,
            #1e293b 74%
          );
          box-shadow:
            0 0 18px
              rgba(
                255,
                255,
                255,
                0.25
              ),
            0 8px 16px
              rgba(
                0,
                0,
                0,
                0.55
              );
        }

        .axis-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 17px;
          height: 17px;
          transform: translate(
            -50%,
            -50%
          );
          border-radius: 50%;
          background: #ec4899;
          box-shadow: 0 0 14px
            rgba(
              236,
              72,
              153,
              0.75
            );
        }

        .balls-zone {
          position: absolute;
          inset: 5%;
          z-index: 6;
        }

        .raffle-ball {
          position: absolute;
          display: flex;
          width: 68px;
          height: 68px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 2px solid
            rgba(
              255,
              255,
              255,
              0.72
            );
          padding: 5px;
          box-shadow:
            inset -8px -10px 14px
              rgba(
                0,
                0,
                0,
                0.3
              ),
            inset 6px 7px 12px
              rgba(
                255,
                255,
                255,
                0.24
              ),
            0 8px 14px
              rgba(
                0,
                0,
                0,
                0.45
              );
          color: white;
          font-size: 9px;
          font-weight: 950;
          line-height: 1.05;
          text-align: center;
          transform-origin: center;
          animation-duration:
            var(--duration);
          animation-delay:
            var(--delay);
          animation-timing-function:
            ease-in-out;
          animation-iteration-count:
            infinite;
        }

        .raffle-ball-0 {
          background: radial-gradient(
            circle at 28% 24%,
            #f9a8d4,
            #ec4899 40%,
            #9d174d 100%
          );
          animation-name: ballChaos0;
        }

        .raffle-ball-1 {
          background: radial-gradient(
            circle at 28% 24%,
            #d8b4fe,
            #9333ea 42%,
            #581c87 100%
          );
          animation-name: ballChaos1;
        }

        .raffle-ball-2 {
          background: radial-gradient(
            circle at 28% 24%,
            #bae6fd,
            #0ea5e9 42%,
            #075985 100%
          );
          animation-name: ballChaos2;
        }

        .raffle-ball-3 {
          background: radial-gradient(
            circle at 28% 24%,
            #fde68a,
            #f59e0b 42%,
            #92400e 100%
          );
          animation-name: ballChaos3;
        }

        .balls-zone-fast
          .raffle-ball {
          animation-duration:
            0.72s;
        }

        .raffle-ball-shine {
          position: absolute;
          left: 12px;
          top: 9px;
          width: 15px;
          height: 9px;
          transform: rotate(
            -30deg
          );
          border-radius: 50%;
          background: rgba(
            255,
            255,
            255,
            0.55
          );
          filter: blur(1px);
        }

        .raffle-ball-name {
          position: relative;
          z-index: 3;
          display: -webkit-box;
          max-width: 56px;
          overflow: hidden;
          -webkit-box-orient:
            vertical;
          -webkit-line-clamp: 3;
        }

        .raffle-ball-chances {
          position: absolute;
          right: -3px;
          bottom: -3px;
          z-index: 4;
          min-width: 22px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.65
            );
          border-radius: 999px;
          background: #111827;
          padding: 2px 5px;
          font-size: 8px;
          font-weight: 950;
        }

        .drum-glass-highlight {
          position: absolute;
          left: 8%;
          top: 7%;
          z-index: 15;
          width: 20%;
          height: 62%;
          transform: rotate(
            13deg
          );
          border-radius: 50%;
          background: linear-gradient(
            90deg,
            rgba(
              255,
              255,
              255,
              0.19
            ),
            transparent
          );
          filter: blur(4px);
          pointer-events: none;
        }

        .drum-glass-highlight-two {
          position: absolute;
          right: 8%;
          bottom: 9%;
          z-index: 15;
          width: 12%;
          height: 35%;
          border-radius: 50%;
          background: rgba(
            255,
            255,
            255,
            0.06
          );
          filter: blur(6px);
          pointer-events: none;
        }

        .drum-inner-shadow {
          position: absolute;
          inset: 0;
          z-index: 14;
          border-radius: inherit;
          box-shadow: inset 0 0
            35px
            rgba(
              0,
              0,
              0,
              0.55
            );
          pointer-events: none;
        }

        .machine-leg {
          position: absolute;
          top: 150px;
          z-index: 3;
          width: 34px;
          height: 215px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #334155,
            #f8fafc 38%,
            #94a3b8 58%,
            #334155
          );
          box-shadow: 0 10px 20px
            rgba(
              0,
              0,
              0,
              0.45
            );
        }

        .machine-leg-left {
          left: 1%;
        }

        .machine-leg-right {
          right: 1%;
        }

        .machine-axis {
          position: absolute;
          top: 180px;
          z-index: 16;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 5px solid
            #cbd5e1;
          background: radial-gradient(
            circle,
            #f8fafc,
            #64748b
          );
          box-shadow: 0 6px 12px
            rgba(
              0,
              0,
              0,
              0.55
            );
        }

        .machine-axis-left {
          left: 0;
        }

        .machine-axis-right {
          right: 0;
        }

        .winner-chute {
          position: absolute;
          right: 13%;
          top: 325px;
          z-index: 18;
        }

        .winner-chute-neck {
          width: 42px;
          height: 42px;
          margin: 0 auto;
          border-left: 5px solid
            #94a3b8;
          border-right: 5px solid
            #94a3b8;
          background: linear-gradient(
            90deg,
            #334155,
            #f8fafc,
            #475569
          );
        }

        .winner-chute-track {
          width: 105px;
          height: 34px;
          transform: rotate(
            -7deg
          );
          border: 4px solid
            #94a3b8;
          border-radius: 7px
            20px 20px 7px;
          background: linear-gradient(
            180deg,
            #1e293b,
            #020617
          );
          box-shadow: 0 8px 14px
            rgba(
              0,
              0,
              0,
              0.45
            );
        }

        .winner-chute-label {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.14em;
          color: #f9a8d4;
        }

        .machine-base {
          position: absolute;
          left: 50%;
          bottom: 0;
          z-index: 4;
          width: 72%;
          transform: translateX(
            -50%
          );
        }

        .machine-base-top {
          height: 18px;
          border-radius: 999px
            999px 4px 4px;
          background: linear-gradient(
            180deg,
            #f8fafc,
            #64748b
          );
        }

        .machine-logo {
          display: flex;
          height: 48px;
          align-items: center;
          justify-content: center;
          border-left: 5px solid
            #64748b;
          border-right: 5px solid
            #64748b;
          background: linear-gradient(
            180deg,
            #111827,
            #030712
          );
          color: #f472b6;
          font-size: 16px;
          font-weight: 950;
          letter-spacing: 0.35em;
          text-shadow: 0 0 12px
            rgba(
              236,
              72,
              153,
              0.6
            );
        }

        .machine-base-bottom {
          height: 16px;
          border-radius: 4px 4px
            999px 999px;
          background: linear-gradient(
            180deg,
            #64748b,
            #1e293b
          );
          box-shadow: 0 15px 25px
            rgba(
              0,
              0,
              0,
              0.55
            );
        }

        .drawing-pulse {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .drawing-pulse span {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #ec4899;
          animation: pulseDot
            0.75s ease-in-out
            infinite;
        }

        .drawing-pulse
          span:nth-child(2) {
          animation-delay: 0.13s;
        }

        .drawing-pulse
          span:nth-child(3) {
          animation-delay: 0.26s;
        }

        .extracted-winner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 5px 10px;
        }

        .extracted-ball {
          position: relative;
          display: flex;
          width: 108px;
          height: 108px;
          flex-shrink: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 4px solid
            rgba(
              255,
              255,
              255,
              0.8
            );
          border-radius: 50%;
          background: radial-gradient(
            circle at 28% 22%,
            #f9a8d4,
            #ec4899 40%,
            #831843 100%
          );
          box-shadow:
            inset -12px -15px
              20px
              rgba(
                0,
                0,
                0,
                0.32
              ),
            0 15px 30px
              rgba(
                0,
                0,
                0,
                0.45
              );
          animation: extraction
            0.85s
            cubic-bezier(
              0.2,
              0.85,
              0.25,
              1.2
            );
        }

        .extracted-ball-shine {
          position: absolute;
          left: 20px;
          top: 14px;
          width: 26px;
          height: 13px;
          transform: rotate(
            -30deg
          );
          border-radius: 50%;
          background: rgba(
            255,
            255,
            255,
            0.5
          );
        }

        .extracted-name {
          position: relative;
          z-index: 2;
          max-width: 86px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 11px;
          font-weight: 950;
          line-height: 1.05;
        }

        .winner-card {
          min-width: 190px;
          max-width: 310px;
          border: 1px solid
            rgba(
              244,
              114,
              182,
              0.3
            );
          border-radius: 20px;
          background: white;
          padding: 14px 18px;
          text-align: left;
          box-shadow: 0 15px 35px
            rgba(
              0,
              0,
              0,
              0.35
            );
          animation: winnerCard
            0.55s ease-out
            0.25s both;
        }

        .winner-card-first {
          animation:
            winnerCard 0.55s
              ease-out 0.25s both,
            winnerGlow 1.5s
              ease-in-out 0.8s
              infinite;
        }

        @media (max-width: 640px) {
          .lottery-machine {
            width: 100%;
            height: 390px;
          }

          .lottery-drum {
            top: 35px;
            width: 92%;
            height: 275px;
          }

          .raffle-ball {
            width: 55px;
            height: 55px;
            font-size: 8px;
          }

          .raffle-ball-name {
            max-width: 44px;
          }

          .machine-leg {
            top: 130px;
            height: 180px;
            width: 27px;
          }

          .machine-axis {
            top: 158px;
            width: 38px;
            height: 38px;
          }

          .winner-chute {
            right: 8%;
            top: 280px;
          }

          .winner-chute-track {
            width: 85px;
          }

          .machine-base {
            width: 70%;
          }

          .extracted-winner {
            gap: 8px;
          }

          .extracted-ball {
            width: 86px;
            height: 86px;
          }

          .winner-card {
            min-width: 0;
            flex: 1;
            padding: 12px;
          }
        }
      `}</style>
    </>
  );
}