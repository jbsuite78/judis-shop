"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type FacingMode = "user" | "environment";

export default function RifaLivePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamCamaraRef = useRef<MediaStream | null>(null);
  const streamFinalRef = useRef<MediaStream | null>(null);
  const animacionRef = useRef<number | null>(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [facingMode, setFacingMode] =
    useState<FacingMode>("environment");

  const [senalLista, setSenalLista] = useState(false);
  const [error, setError] = useState("");

  const detenerAnimacion = () => {
    if (animacionRef.current !== null) {
      cancelAnimationFrame(animacionRef.current);
      animacionRef.current = null;
    }
  };

  const detenerCamara = () => {
    detenerAnimacion();

    streamCamaraRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    streamFinalRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    streamCamaraRef.current = null;
    streamFinalRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamaraActiva(false);
    setSenalLista(false);
  };

  const iniciarCamara = async (
    modo: FacingMode = facingMode
  ) => {
    try {
      setError("");

      streamCamaraRef.current
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
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      streamCamaraRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setFacingMode(modo);
      setCamaraActiva(true);
      setMicrofonoActivo(true);
      setSenalLista(false);
    } catch {
      setError(
        "No fue posible activar cámara y micrófono. Revisa los permisos del navegador."
      );
    }
  };

  const cambiarCamara = async () => {
    const nueva: FacingMode =
      facingMode === "user"
        ? "environment"
        : "user";

    detenerAnimacion();
    setSenalLista(false);

    await iniciarCamara(nueva);
  };

  const alternarMicrofono = () => {
    const tracks =
      streamCamaraRef.current?.getAudioTracks() ?? [];

    tracks.forEach((track) => {
      track.enabled = !microfonoActivo;
    });

    setMicrofonoActivo((actual) => !actual);
  };

  const dibujarComposicion = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const contexto = canvas.getContext("2d");

    if (!contexto) return;

    const ancho = canvas.width;
    const alto = canvas.height;

    const anchoCamara = Math.round(ancho * 0.61);
    const anchoRifa = ancho - anchoCamara;

    const dibujar = () => {
      contexto.clearRect(0, 0, ancho, alto);

      // Fondo
      contexto.fillStyle = "#050712";
      contexto.fillRect(0, 0, ancho, alto);

      // Cámara
      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        const relacionVideo =
          video.videoWidth / video.videoHeight;

        const relacionDestino =
          anchoCamara / alto;

        let origenX = 0;
        let origenY = 0;
        let origenAncho = video.videoWidth;
        let origenAlto = video.videoHeight;

        if (relacionVideo > relacionDestino) {
          origenAncho =
            video.videoHeight * relacionDestino;

          origenX =
            (video.videoWidth - origenAncho) / 2;
        } else {
          origenAlto =
            video.videoWidth / relacionDestino;

          origenY =
            (video.videoHeight - origenAlto) / 2;
        }

        contexto.drawImage(
          video,
          origenX,
          origenY,
          origenAncho,
          origenAlto,
          0,
          0,
          anchoCamara,
          alto
        );
      }

      // Separador
      contexto.fillStyle = "#ec4899";
      contexto.fillRect(
        anchoCamara - 3,
        0,
        6,
        alto
      );

      // Panel de rifa
      const degradado =
        contexto.createLinearGradient(
          anchoCamara,
          0,
          ancho,
          alto
        );

      degradado.addColorStop(0, "#171b35");
      degradado.addColorStop(1, "#070814");

      contexto.fillStyle = degradado;

      contexto.fillRect(
        anchoCamara,
        0,
        anchoRifa,
        alto
      );

      // Encabezado Judi's
      contexto.textAlign = "center";

      contexto.fillStyle = "#f472b6";
      contexto.font = "900 30px Arial";

      contexto.fillText(
        "JUDI'S SHOP",
        anchoCamara + anchoRifa / 2,
        62
      );

      contexto.fillStyle = "#ffffff";
      contexto.font = "900 42px Arial";

      contexto.fillText(
        "RIFA EN VIVO",
        anchoCamara + anchoRifa / 2,
        115
      );

      // Tómbola provisional
      const centroX =
        anchoCamara + anchoRifa / 2;

      const centroY = 335;

      const radio = 160;

      const esfera =
        contexto.createRadialGradient(
          centroX - 50,
          centroY - 60,
          20,
          centroX,
          centroY,
          radio
        );

      esfera.addColorStop(
        0,
        "rgba(255,255,255,0.22)"
      );

      esfera.addColorStop(
        0.35,
        "rgba(236,72,153,0.18)"
      );

      esfera.addColorStop(
        1,
        "rgba(15,23,42,0.92)"
      );

      contexto.beginPath();

      contexto.arc(
        centroX,
        centroY,
        radio,
        0,
        Math.PI * 2
      );

      contexto.fillStyle = esfera;
      contexto.fill();

      contexto.lineWidth = 8;
      contexto.strokeStyle =
        "rgba(226,232,240,0.75)";
      contexto.stroke();

      // Bolas visuales de prueba del compositor
      const tiempo = Date.now() / 700;

      for (let i = 0; i < 14; i++) {
        const angulo =
          tiempo +
          (i * Math.PI * 2) / 14;

        const radioInterno =
          60 + (i % 3) * 35;

        const x =
          centroX +
          Math.cos(angulo * (i % 2 ? 1 : -1)) *
            radioInterno;

        const y =
          centroY +
          Math.sin(angulo + i) *
            radioInterno *
            0.65;

        contexto.beginPath();

        contexto.arc(
          x,
          y,
          22,
          0,
          Math.PI * 2
        );

        contexto.fillStyle =
          i % 2 === 0
            ? "#ec4899"
            : "#9333ea";

        contexto.fill();

        contexto.lineWidth = 2;
        contexto.strokeStyle =
          "rgba(255,255,255,0.7)";
        contexto.stroke();
      }

      contexto.fillStyle = "#ffffff";
      contexto.font = "700 22px Arial";

      contexto.fillText(
        "Tómbola Judi's",
        centroX,
        555
      );

      contexto.fillStyle = "#94a3b8";
      contexto.font = "18px Arial";

      contexto.fillText(
        "La rifa real se conectará en el siguiente paso",
        centroX,
        590
      );

      // Identificador Live
      contexto.fillStyle = "#dc2626";

      contexto.beginPath();

      contexto.roundRect(
        25,
        25,
        150,
        50,
        25
      );

      contexto.fill();

      contexto.fillStyle = "#ffffff";
      contexto.font = "900 21px Arial";

      contexto.textAlign = "center";

      contexto.fillText(
        "● EN VIVO",
        100,
        58
      );

      animacionRef.current =
        requestAnimationFrame(dibujar);
    };

    dibujar();
  };

  const prepararSenal = () => {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      !streamCamaraRef.current ||
      !camaraActiva
    ) {
      setError(
        "Primero activa la cámara."
      );
      return;
    }

    try {
      setError("");

      detenerAnimacion();

      dibujarComposicion();

      const streamCanvas =
        canvas.captureStream(30);

      const audioTracks =
        streamCamaraRef.current.getAudioTracks();

      const streamFinal =
        new MediaStream([
          ...streamCanvas.getVideoTracks(),
          ...audioTracks,
        ]);

      streamFinalRef.current =
        streamFinal;

      setSenalLista(true);
    } catch {
      setError(
        "Este navegador no pudo preparar la señal Live."
      );
    }
  };

  useEffect(() => {
    return () => {
      detenerAnimacion();

      streamCamaraRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      streamFinalRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#050712] p-3 text-white md:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-400">
            ✦ JUDI&apos;S SHOP
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            🔴 Estudio Live
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Preparación de señal en tiempo real desde móvil.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* CÁMARA */}
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
            <div className="relative aspect-[9/12] min-h-[420px] overflow-hidden md:aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover object-center"
              />

              {!camaraActiva && (
                <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#171a30,#050712)]">
                  <div className="px-5 text-center">
                    <div className="text-7xl">
                      📱
                    </div>

                    <h2 className="mt-4 text-2xl font-black">
                      Cámara del Live
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Utiliza la cámara y micrófono de este teléfono.
                    </p>

                    <button
                      onClick={() =>
                        iniciarCamara()
                      }
                      className="mt-6 rounded-2xl bg-pink-600 px-6 py-4 font-black"
                    >
                      🎥 Activar cámara y micrófono
                    </button>
                  </div>
                </div>
              )}

              {camaraActiva && (
                <div className="absolute left-4 top-4 rounded-full bg-red-600 px-4 py-2 text-sm font-black shadow-lg">
                  ● CÁMARA ACTIVA
                </div>
              )}
            </div>

            {camaraActiva && (
              <div className="flex flex-wrap justify-center gap-2 border-t border-white/10 p-3">
                <button
                  onClick={cambiarCamara}
                  className="rounded-xl bg-white/10 px-4 py-3 font-bold"
                >
                  🔄 Cambiar cámara
                </button>

                <button
                  onClick={alternarMicrofono}
                  className="rounded-xl bg-white/10 px-4 py-3 font-bold"
                >
                  {microfonoActivo
                    ? "🎙️ Micrófono"
                    : "🔇 Silenciado"}
                </button>

                <button
                  onClick={detenerCamara}
                  className="rounded-xl bg-white/10 px-4 py-3 font-bold"
                >
                  ⏹ Cámara
                </button>
              </div>
            )}
          </section>

          {/* SEÑAL FINAL */}
          <section className="rounded-[2rem] border border-white/10 bg-[#0b0e1c] p-4">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-400">
                SEÑAL FINAL
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Cámara + Rifa
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="block h-auto w-full"
              />
            </div>

            {!senalLista ? (
              <button
                onClick={prepararSenal}
                disabled={!camaraActiva}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 text-lg font-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                📡 Preparar señal en vivo
              </button>
            ) : (
              <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/10 p-4 text-center">
                <p className="text-xl font-black text-green-300">
                  ✅ SEÑAL LIVE LISTA
                </p>

                <p className="mt-1 text-sm text-green-100/70">
                  Video en tiempo real + micrófono preparados.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
                ❌ {error}
              </div>
            )}
          </section>
        </div>

        <section className="mt-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-black">
            Estado del Live
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/30 p-4">
              <p className="text-xs text-slate-400">
                Cámara
              </p>

              <p className="mt-1 font-black">
                {camaraActiva
                  ? "✅ Activa"
                  : "⚪ Inactiva"}
              </p>
            </div>

            <div className="rounded-xl bg-black/30 p-4">
              <p className="text-xs text-slate-400">
                Micrófono
              </p>

              <p className="mt-1 font-black">
                {camaraActiva &&
                microfonoActivo
                  ? "✅ Activo"
                  : "⚪ Inactivo"}
              </p>
            </div>

            <div className="rounded-xl bg-black/30 p-4">
              <p className="text-xs text-slate-400">
                Señal
              </p>

              <p className="mt-1 font-black">
                {senalLista
                  ? "🟢 Lista"
                  : "⚪ Pendiente"}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5 text-center">
          <a
            href="/admin/rifas"
            className="inline-flex rounded-xl border border-white/20 px-5 py-3 font-bold"
          >
            ← Volver a Rifas
          </a>
        </div>
      </div>
    </main>
  );
}