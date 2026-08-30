"use client";

import { useMemo, useRef, useState } from "react";

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

type FacingMode = "user" | "environment";

export default function RifasPage() {
  const [nombreRifa, setNombreRifa] = useState("");
  const [premios, setPremios] = useState(["", "", ""]);

  const [nombreParticipante, setNombreParticipante] = useState("");
  const [oportunidades, setOportunidades] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [sorteoActivo, setSorteoActivo] = useState(false);
  const [cuenta, setCuenta] = useState(5);
  const [girando, setGirando] = useState(false);
  const [ganadores, setGanadores] = useState<Ganador[]>([]);

  // Cámara
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [errorCamara, setErrorCamara] = useState("");

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
      actuales.map((premio, i) => (i === indice ? valor : premio))
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

  const iniciarCamara = async (modo: FacingMode = facingMode) => {
    try {
      setErrorCamara("");

      streamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: modo,
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
    streamRef.current?.getTracks().forEach((track) => track.stop());
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
    const tracks = streamRef.current?.getAudioTracks() ?? [];

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

  const salirSorteo = () => {
    detenerCamara();
    setSorteoActivo(false);
    setGanadores([]);
  };

  return (
    <>
      <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="font-bold uppercase tracking-[0.25em] text-pink-600">
              Judi&apos;s Shop
            </p>

            <h1 className="mt-2 text-4xl font-black">🎟️ Rifas en vivo</h1>

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
                onChange={(e) => cambiarPremio(0, e.target.value)}
                placeholder="Ej. Bolsa Guess"
                className="mb-4 w-full rounded-xl border p-3"
              />

              <label className="mb-2 block font-semibold">
                🥈 Premio 2.º lugar
              </label>

              <input
                value={premios[1]}
                onChange={(e) => cambiarPremio(1, e.target.value)}
                placeholder="Opcional"
                className="mb-4 w-full rounded-xl border p-3"
              />

              <label className="mb-2 block font-semibold">
                🥉 Premio 3.er lugar
              </label>

              <input
                value={premios[2]}
                onChange={(e) => cambiarPremio(2, e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-xl border p-3"
              />
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">
                2. Agregar participante
              </h2>

              <label className="mb-2 block font-semibold">Nombre</label>

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
                <h2 className="text-2xl font-bold">3. Participantes</h2>

                <p className="text-slate-500">
                  {participantes.length} participantes · {totalBoletos} oportunidades
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
                      onClick={() => eliminarParticipante(participante.id)}
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
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950 text-white">
          <div className="mx-auto min-h-screen max-w-[1600px] p-3 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black uppercase tracking-[0.3em] text-pink-400">
                  🔴 Judi&apos;s Shop · Estudio en vivo
                </p>

                <h1 className="mt-1 text-2xl font-black md:text-4xl">
                  {nombreRifa}
                </h1>
              </div>

              <button
                onClick={salirSorteo}
                className="rounded-xl border border-white/30 px-4 py-2 font-bold"
              >
                ✕ Salir
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* CÁMARA */}
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                <div className="relative aspect-video min-h-[260px] bg-black md:min-h-[500px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />

                  {!camaraActiva && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-7xl">🎥</div>

                      <h2 className="mt-4 text-2xl font-black">
                        Cámara del conductor
                      </h2>

                      <button
                        onClick={() => iniciarCamara()}
                        className="mt-6 rounded-xl bg-pink-600 px-6 py-3 font-bold"
                      >
                        🎥 Activar cámara y micrófono
                      </button>

                      {errorCamara && (
                        <p className="mt-4 max-w-md text-sm text-red-300">
                          {errorCamara}
                        </p>
                      )}
                    </div>
                  )}

                  {camaraActiva && (
                    <div className="absolute left-3 top-3 rounded-full bg-red-600 px-4 py-2 text-sm font-black">
                      🔴 EN VIVO
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2 p-3">
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

              {/* TÓMBOLA / SORTEO */}
              <section className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900 p-5 text-center md:min-h-[500px]">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-400">
                  🎟️ Tómbola Judi&apos;s
                </p>

                {girando && cuenta > 0 && (
                  <>
                    <p className="mt-6 text-xl font-bold">
                      El sorteo comienza en...
                    </p>

                    <div className="mt-5 text-[8rem] font-black leading-none text-pink-500 md:text-[12rem]">
                      {cuenta}
                    </div>
                  </>
                )}

                {girando && cuenta === 0 && (
                  <>
                    <div className="animate-pulse text-4xl font-black md:text-6xl">
                      🎟️
                      <br />
                      GIRANDO...
                    </div>

                    <div className="mt-8 flex max-w-xl flex-wrap justify-center gap-2">
                      {participantes.slice(0, 18).map((participante) => (
                        <span
                          key={participante.id}
                          className="animate-pulse rounded-full bg-white/10 px-3 py-2 text-sm"
                        >
                          {participante.nombre}
                        </span>
                      ))}
                    </div>

                    <p className="mt-8 text-slate-400">
                      {totalBoletos} oportunidades
                    </p>
                  </>
                )}

                {!girando && ganadores.length > 0 && (
                  <div className="w-full space-y-3">
                    <p className="mb-4 text-3xl font-black">
                      🎉 GANADORES 🎉
                    </p>

                    {ganadores.map((ganador) => (
                      <div
                        key={ganador.lugar}
                        className="rounded-2xl bg-white p-4 text-slate-950"
                      >
                        <div className="text-4xl">
                          {iconoLugar(ganador.lugar)}
                        </div>

                        <p className="font-black text-pink-600">
                          {ganador.lugar}.º LUGAR
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          {ganador.participante.nombre}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          🎁 {ganador.premio}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={pantallaCompleta}
                className="rounded-xl bg-pink-600 px-5 py-3 font-bold"
              >
                ⛶ Pantalla completa
              </button>

              {!girando && ganadores.length > 0 && (
                <button
                  onClick={iniciarSorteo}
                  className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950"
                >
                  🔄 Nueva ronda
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}