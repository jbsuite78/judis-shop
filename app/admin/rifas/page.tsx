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

  const [nombreParticipante, setNombreParticipante] = useState("");
  const [oportunidades, setOportunidades] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [estudioActivo, setEstudioActivo] = useState(false);
  const [ganadores, setGanadores] = useState<Ganador[]>([]);
  const [ganadorRevelado, setGanadorRevelado] =
    useState<Ganador | null>(null);
  const [revelando, setRevelando] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [errorCamara, setErrorCamara] = useState("");

  const totalBoletos = useMemo(
    () =>
      participantes.reduce(
        (total, participante) =>
          total + Math.max(1, participante.oportunidades),
        0
      ),
    [participantes]
  );

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

    return activos.sort((a, b) => b.lugar - a.lugar);
  }, [premios]);

  const siguientePremio =
    premiosActivos.find(
      (premio) =>
        !ganadores.some(
          (ganador) => ganador.lugar === premio.lugar
        )
    ) ?? null;

  const participantesDisponibles = useMemo(() => {
    const idsGanadores = new Set(
      ganadores.map((ganador) => ganador.participante.id)
    );

    return participantes.filter(
      (participante) => !idsGanadores.has(participante.id)
    );
  }, [participantes, ganadores]);

  const nombresVisuales = useMemo(() => {
    if (participantesDisponibles.length === 0) return [];

    const limite = 28;

    const seleccionados =
      participantesDisponibles.length <= limite
        ? participantesDisponibles
        : Array.from({ length: limite }, (_, indice) => {
            const posicion = Math.floor(
              (indice * participantesDisponibles.length) /
                limite
            );

            return participantesDisponibles[posicion];
          });

    return seleccionados.map((participante, indice) => {
      const angulo =
        (indice * 360) / Math.max(1, seleccionados.length);

      const radio =
        indice % 3 === 0
          ? 27
          : indice % 3 === 1
          ? 35
          : 42;

      const radianes = (angulo * Math.PI) / 180;

      return {
        ...participante,
        visualKey: `${participante.id}-${indice}`,
        left: 50 + Math.cos(radianes) * radio,
        top: 50 + Math.sin(radianes) * radio,
        delay: (indice % 9) * 0.09,
        escala:
          indice % 4 === 0
            ? 0.88
            : indice % 4 === 1
            ? 1
            : indice % 4 === 2
            ? 0.94
            : 1.06,
        capa: indice % 2,
      };
    });
  }, [participantesDisponibles]);

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
        id: Date.now() + Math.floor(Math.random() * 100000),
        nombre,
        oportunidades: Math.max(1, oportunidades),
      },
    ]);

    setNombreParticipante("");
    setOportunidades(1);
  };

  const eliminarParticipante = (id: number) => {
    setParticipantes((actuales) =>
      actuales.filter(
        (participante) => participante.id !== id
      )
    );
  };

  const esperar = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const elegirGanadorPonderado = (
    disponibles: Participante[]
  ): Participante | null => {
    if (disponibles.length === 0) return null;

    const totalOportunidades = disponibles.reduce(
      (total, participante) =>
        total + Math.max(1, participante.oportunidades),
      0
    );

    let numeroAleatorio =
      Math.random() * totalOportunidades;

    for (const participante of disponibles) {
      numeroAleatorio -= Math.max(
        1,
        participante.oportunidades
      );

      if (numeroAleatorio < 0) {
        return participante;
      }
    }

    return disponibles[disponibles.length - 1];
  };

  const abrirEstudio = () => {
    if (
      !nombreRifa.trim() ||
      !premios[0].trim() ||
      premiosActivos.length === 0 ||
      participantes.length < premiosActivos.length
    ) {
      return;
    }

    setGanadores([]);
    setGanadorRevelado(null);
    setRevelando(false);
    setEstudioActivo(true);
  };

  const sacarSiguienteGanador = async () => {
    if (!siguientePremio || revelando) return;

    setGanadorRevelado(null);
    setRevelando(true);

    const tiempo =
      siguientePremio.lugar === 1 ? 5000 : 3200;

    await esperar(tiempo);

    const participante = elegirGanadorPonderado(
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
        .forEach((track) => track.stop());

      const stream =
        await navigator.mediaDevices.getUserMedia({
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
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
      .forEach((track) => track.stop());

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamaraActiva(false);
  };

  const cambiarCamara = async () => {
    const nueva: FacingMode =
      facingMode === "user" ? "environment" : "user";

    await iniciarCamara(nueva);
  };

  const alternarMicrofono = () => {
    const tracks =
      streamRef.current?.getAudioTracks() ?? [];

    tracks.forEach((track) => {
      track.enabled = !microfonoActivo;
    });

    setMicrofonoActivo((actual) => !actual);
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

  const textoLugar = (lugar: number) => {
    if (lugar === 1) return "1.er lugar";
    if (lugar === 2) return "2.º lugar";
    return "3.er lugar";
  };

  const textoBoton = () => {
    if (!siguientePremio) return "Rifa finalizada";

    if (siguientePremio.lugar === 1) {
      return "🥇 Sacar 1.er lugar";
    }

    if (siguientePremio.lugar === 2) {
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
    ganadores.length === premiosActivos.length;

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
                  setNombreRifa(e.target.value)
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
                  cambiarPremio(0, e.target.value)
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

              <p className="mt-4 text-sm text-slate-500">
                {premiosActivos.length === 0
                  ? "Agrega al menos el premio de 1.er lugar."
                  : premiosActivos.length === 1
                  ? "Se sorteará únicamente 1.er lugar."
                  : premiosActivos.length === 2
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
                onClick={abrirEstudio}
                disabled={
                  !nombreRifa.trim() ||
                  !premios[0].trim() ||
                  participantes.length < premiosActivos.length
                }
                className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                🎬 Abrir estudio de rifa
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

      {estudioActivo && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-[#060814] text-white">
          <div className="mx-auto min-h-screen max-w-[1700px] p-3 md:p-6">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.32em] text-pink-400">
                  ✦ JUDI&apos;S SHOP · ESTUDIO DE RIFA
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
              <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b17]">
                <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />

                  {!camaraActiva && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_center,#151936_0%,#090b17_58%,#03040a_100%)]">
                      <div className="flex w-full max-w-lg flex-col items-center justify-center px-6 text-center">
                        <div className="text-7xl">
                          🎥
                        </div>

                        <h2 className="mt-4 text-2xl font-black">
                          Cámara del conductor
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                          Tu imagen aparecerá centrada en este espacio.
                        </p>

                        <button
                          onClick={() => iniciarCamara()}
                          className="mt-6 rounded-2xl bg-pink-600 px-7 py-4 font-black shadow-lg"
                        >
                          🎥 Activar cámara y micrófono
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
                      Cámara lista para activarse
                    </span>
                  )}

                  {camaraActiva && (
                    <>
                      <button
                        onClick={cambiarCamara}
                        className="rounded-xl bg-white/10 px-4 py-2 font-bold"
                      >
                        🔄 Cambiar cámara
                      </button>

                      <button
                        onClick={alternarMicrofono}
                        className="rounded-xl bg-white/10 px-4 py-2 font-bold"
                      >
                        {microfonoActivo
                          ? "🎙️ Micrófono"
                          : "🔇 Silenciado"}
                      </button>

                      <button
                        onClick={detenerCamara}
                        className="rounded-xl bg-white/10 px-4 py-2 font-bold"
                      >
                        ⏹ Cámara
                      </button>
                    </>
                  )}
                </div>
              </section>

              {/* TÓMBOLA */}
              <section className="relative flex min-h-[620px] flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#24284c_0%,#0b0d1d_46%,#05060d_100%)] p-4 text-center">
                <div className="absolute left-1/2 top-[-140px] h-[320px] w-[520px] -translate-x-1/2 rounded-full bg-pink-500/15 blur-[90px]" />

                <p className="relative z-10 text-xs font-black uppercase tracking-[0.38em] text-pink-400 md:text-sm">
                  ✦ TÓMBOLA PREMIUM JUDI&apos;S ✦
                </p>

                <div
                  className={`premium-machine relative mt-4 ${
                    revelando ? "premium-machine-active" : ""
                  }`}
                >
                  <div className="premium-top" />

                  <div className="premium-glass">
                    <div className="premium-rim premium-rim-one" />
                    <div className="premium-rim premium-rim-two" />

                    <div
                      className={`premium-orbit ${
                        revelando
                          ? "premium-orbit-fast"
                          : ""
                      }`}
                    >
                      {nombresVisuales
                        .filter((item) => item.capa === 0)
                        .map((item) => {
                          const style = {
                            left: `${item.left}%`,
                            top: `${item.top}%`,
                            "--scale": item.escala,
                            "--delay": `${item.delay}s`,
                          } as CSSProperties;

                          return (
                            <div
                              key={item.visualKey}
                              className="premium-name-wrap"
                              style={style}
                            >
                              <div
                                className={`premium-counter ${
                                  revelando
                                    ? "premium-counter-fast"
                                    : ""
                                }`}
                              >
                                <span className="premium-name">
                                  {item.nombre}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div
                      className={`premium-orbit premium-orbit-reverse ${
                        revelando
                          ? "premium-orbit-fast-reverse"
                          : ""
                      }`}
                    >
                      {nombresVisuales
                        .filter((item) => item.capa === 1)
                        .map((item) => {
                          const style = {
                            left: `${item.left}%`,
                            top: `${item.top}%`,
                            "--scale": item.escala,
                            "--delay": `${item.delay}s`,
                          } as CSSProperties;

                          return (
                            <div
                              key={item.visualKey}
                              className="premium-name-wrap"
                              style={style}
                            >
                              <div
                                className={`premium-counter-reverse ${
                                  revelando
                                    ? "premium-counter-fast-reverse"
                                    : ""
                                }`}
                              >
                                <span className="premium-name premium-name-alt">
                                  {item.nombre}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="premium-reflection-one" />
                    <div className="premium-reflection-two" />
                    <div className="premium-glow" />
                  </div>

                  <div className="premium-neck" />

                  <div className="premium-base">
                    <span>JUDI&apos;S SHOP</span>
                  </div>
                </div>

                <div className="relative z-20 mt-3 min-h-[155px] w-full">
                  {revelando && siguientePremio && (
                    <div className="winner-loading">
                      <p className="text-xl font-black uppercase text-pink-400 md:text-2xl">
                        {iconoLugar(
                          siguientePremio.lugar
                        )}{" "}
                        Buscando{" "}
                        {textoLugar(
                          siguientePremio.lugar
                        ).toUpperCase()}
                        ...
                      </p>

                      <div className="mx-auto mt-4 flex w-fit gap-2">
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                      </div>
                    </div>
                  )}

                  {!revelando && ganadorRevelado && (
                    <div
                      className={`winner-reveal mx-auto max-w-lg rounded-[2rem] border border-pink-300/30 bg-white p-5 text-slate-950 shadow-2xl ${
                        ganadorRevelado.lugar === 1
                          ? "winner-first"
                          : ""
                      }`}
                    >
                      <div className="text-5xl">
                        {iconoLugar(
                          ganadorRevelado.lugar
                        )}
                      </div>

                      <p className="mt-2 font-black uppercase tracking-[0.15em] text-pink-600">
                        {textoLugar(
                          ganadorRevelado.lugar
                        )}
                      </p>

                      <p className="mt-2 text-3xl font-black md:text-4xl">
                        {
                          ganadorRevelado.participante
                            .nombre
                        }
                      </p>

                      <p className="mt-3 text-base font-semibold text-slate-600">
                        🎁 {ganadorRevelado.premio}
                      </p>
                    </div>
                  )}
                </div>

                {!rifaTerminada && siguientePremio && (
                  <button
                    onClick={sacarSiguienteGanador}
                    disabled={revelando}
                    className="relative z-20 mt-2 w-full max-w-md rounded-2xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-6 py-4 text-xl font-black shadow-xl transition disabled:opacity-50"
                  >
                    {revelando
                      ? "🎰 Tómbola girando..."
                      : textoBoton()}
                  </button>
                )}

                {rifaTerminada && !revelando && (
                  <div className="relative z-20 mt-3">
                    <p className="text-3xl font-black text-pink-400">
                      🎉 ¡RIFA FINALIZADA! 🎉
                    </p>
                  </div>
                )}

                <p className="relative z-20 mt-3 text-xs text-slate-500">
                  {participantesDisponibles.length}{" "}
                  participantes disponibles ·{" "}
                  {totalBoletos} oportunidades totales
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
                    premiosActivos.length === 1
                      ? "mx-auto max-w-md"
                      : premiosActivos.length === 2
                      ? "md:grid-cols-2"
                      : "md:grid-cols-3"
                  }`}
                >
                  {[...ganadores]
                    .sort((a, b) => a.lugar - b.lugar)
                    .map((ganador) => (
                      <div
                        key={ganador.lugar}
                        className="rounded-2xl bg-white p-4 text-center text-slate-950"
                      >
                        <div className="text-4xl">
                          {iconoLugar(ganador.lugar)}
                        </div>

                        <p className="font-black uppercase text-pink-600">
                          {textoLugar(ganador.lugar)}
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {ganador.participante.nombre}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          🎁 {ganador.premio}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={pantallaCompleta}
                className="rounded-xl bg-pink-600 px-5 py-3 font-bold"
              >
                ⛶ Pantalla completa
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes orbitClockwise {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbitCounterClockwise {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes counterClockwise {
          from {
            transform: translate(-50%, -50%)
              rotate(0deg) scale(var(--scale));
          }
          to {
            transform: translate(-50%, -50%)
              rotate(-360deg) scale(var(--scale));
          }
        }

        @keyframes counterReverse {
          from {
            transform: translate(-50%, -50%)
              rotate(-360deg) scale(var(--scale));
          }
          to {
            transform: translate(-50%, -50%)
              rotate(0deg) scale(var(--scale));
          }
        }

        @keyframes nameFloat {
          0%,
          100% {
            margin-top: 0;
          }

          50% {
            margin-top: -10px;
          }
        }

        @keyframes machineShake {
          0%,
          100% {
            transform: rotate(0deg);
          }

          25% {
            transform: rotate(-0.8deg);
          }

          75% {
            transform: rotate(0.8deg);
          }
        }

        @keyframes winnerReveal {
          0% {
            opacity: 0;
            transform: translateY(-30px)
              scale(0.75);
          }

          65% {
            transform: translateY(5px)
              scale(1.06);
          }

          100% {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes winnerFirst {
          0%,
          100% {
            box-shadow: 0 0 25px
              rgba(236, 72, 153, 0.35);
          }

          50% {
            box-shadow:
              0 0 45px
                rgba(236, 72, 153, 0.75),
              0 0 80px
                rgba(217, 70, 239, 0.35);
          }
        }

        @keyframes dotPulse {
          0%,
          100% {
            transform: scale(0.7);
            opacity: 0.45;
          }

          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .premium-machine {
          width: min(92vw, 500px);
          transition: transform 0.3s ease;
        }

        .premium-machine-active {
          animation: machineShake 0.18s
            ease-in-out infinite;
        }

        .premium-top {
          width: 38%;
          height: 18px;
          margin: 0 auto -7px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #6b7280,
            #f8fafc,
            #94a3b8,
            #f8fafc,
            #64748b
          );
          position: relative;
          z-index: 3;
        }

        .premium-glass {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 0.92;
          overflow: hidden;
          border-radius: 48% 48% 44% 44% /
            46% 46% 50% 50%;
          border: 9px solid
            rgba(226, 232, 240, 0.75);
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(236, 72, 153, 0.11),
              transparent 48%
            ),
            radial-gradient(
              circle at 30% 25%,
              rgba(255, 255, 255, 0.18),
              transparent 34%
            ),
            rgba(13, 18, 40, 0.72);
          box-shadow:
            inset 0 0 50px
              rgba(255, 255, 255, 0.08),
            inset 0 -35px 60px
              rgba(0, 0, 0, 0.45),
            0 25px 60px
              rgba(0, 0, 0, 0.5),
            0 0 30px
              rgba(236, 72, 153, 0.13);
          backdrop-filter: blur(5px);
        }

        .premium-rim {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .premium-rim-one {
          inset: 4%;
          border: 2px solid
            rgba(255, 255, 255, 0.13);
        }

        .premium-rim-two {
          inset: 9%;
          border: 1px solid
            rgba(236, 72, 153, 0.2);
        }

        .premium-orbit {
          position: absolute;
          inset: 7%;
          animation: orbitClockwise 6.5s
            linear infinite;
        }

        .premium-orbit-reverse {
          animation-name: orbitCounterClockwise;
          animation-duration: 8.5s;
        }

        .premium-orbit-fast {
          animation-duration: 1.05s;
        }

        .premium-orbit-fast-reverse {
          animation-duration: 1.3s;
        }

        .premium-name-wrap {
          position: absolute;
        }

        .premium-counter {
          animation: counterClockwise 6.5s
            linear infinite;
        }

        .premium-counter-reverse {
          animation: counterReverse 8.5s
            linear infinite;
        }

        .premium-counter-fast {
          animation-duration: 1.05s;
        }

        .premium-counter-fast-reverse {
          animation-duration: 1.3s;
        }

        .premium-name {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 145px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border: 1px solid
            rgba(255, 255, 255, 0.58);
          border-radius: 999px;
          padding: 8px 12px;
          background: linear-gradient(
            135deg,
            rgba(236, 72, 153, 0.95),
            rgba(190, 24, 93, 0.92)
          );
          box-shadow:
            0 7px 18px
              rgba(0, 0, 0, 0.35),
            inset 0 1px 0
              rgba(255, 255, 255, 0.38);
          color: white;
          font-size: 12px;
          font-weight: 900;
          animation: nameFloat 1.1s
            ease-in-out infinite;
          animation-delay: var(--delay);
        }

        .premium-name-alt {
          background: linear-gradient(
            135deg,
            rgba(192, 132, 252, 0.95),
            rgba(147, 51, 234, 0.92)
          );
        }

        .premium-reflection-one {
          position: absolute;
          left: 12%;
          top: 9%;
          width: 20%;
          height: 45%;
          border-radius: 50%;
          transform: rotate(22deg);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.24),
            transparent
          );
          filter: blur(6px);
          pointer-events: none;
        }

        .premium-reflection-two {
          position: absolute;
          right: 9%;
          bottom: 14%;
          width: 14%;
          height: 26%;
          border-radius: 50%;
          background: rgba(
            255,
            255,
            255,
            0.07
          );
          filter: blur(8px);
          pointer-events: none;
        }

        .premium-glow {
          position: absolute;
          left: 20%;
          right: 20%;
          bottom: -8%;
          height: 28%;
          border-radius: 50%;
          background: rgba(
            236,
            72,
            153,
            0.18
          );
          filter: blur(24px);
          pointer-events: none;
        }

        .premium-neck {
          width: 30px;
          height: 58px;
          margin: -2px auto 0;
          background: linear-gradient(
            90deg,
            #64748b,
            #f8fafc,
            #94a3b8,
            #f8fafc,
            #64748b
          );
          box-shadow: 0 8px 18px
            rgba(0, 0, 0, 0.35);
        }

        .premium-base {
          width: 62%;
          min-height: 42px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            #f8fafc,
            #94a3b8 55%,
            #475569
          );
          color: #111827;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.25em;
          box-shadow: 0 16px 30px
            rgba(0, 0, 0, 0.42);
        }

        .winner-reveal {
          animation: winnerReveal 0.65s
            cubic-bezier(
              0.2,
              0.9,
              0.3,
              1.25
            );
        }

        .winner-first {
          animation:
            winnerReveal 0.7s
              cubic-bezier(
                0.2,
                0.9,
                0.3,
                1.25
              ),
            winnerFirst 1.5s ease-in-out
              infinite 0.7s;
        }

        .loading-dot {
          width: 13px;
          height: 13px;
          border-radius: 999px;
          background: #ec4899;
          animation: dotPulse 0.8s
            ease-in-out infinite;
        }

        .loading-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .loading-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @media (max-width: 640px) {
          .premium-machine {
            width: min(88vw, 390px);
          }

          .premium-name {
            max-width: 105px;
            padding: 6px 9px;
            font-size: 10px;
          }

          .premium-neck {
            height: 42px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-orbit,
          .premium-counter,
          .premium-counter-reverse,
          .premium-name,
          .premium-machine-active {
            animation-duration: 12s;
          }
        }
      `}</style>
    </>
  );
}