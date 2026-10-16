import Link from "next/link";

export const metadata = {
  title: "Estadísticas de visitas | Judi's Shop",
  robots: { index: false, follow: false },
};

const panelVercel = "https://vercel.com/judis-shop/judis-shop/analytics";

const indicadores = [
  { icono: "👥", titulo: "Visitantes", texto: "Personas que entran a la tienda y sus visitas." },
  { icono: "📅", titulo: "Por día", texto: "Evolución del tráfico según la fecha seleccionada." },
  { icono: "📱", titulo: "Dispositivos", texto: "Accesos desde celulares, tablets y computadoras." },
  { icono: "🛍️", titulo: "Productos y páginas", texto: "Qué secciones del catálogo reciben más visitas." },
  { icono: "📣", titulo: "Origen del tráfico", texto: "Desde qué sitios llegan los compradores, cuando se conoce." },
  { icono: "🌎", titulo: "Ubicación general", texto: "Distribución geográfica agregada de los visitantes." },
];

export default function EstadisticasPage() {
  return (
    <main className="min-h-screen bg-[#fff9fc] px-4 pb-16 pt-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-bold text-[#a61663] hover:underline">
          ← Volver a administración
        </Link>
        <div className="mt-7 rounded-[26px] border border-pink-100 bg-white p-6 shadow-sm sm:p-9">
          <span className="inline-block rounded-full bg-pink-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-pink-700">
            Solo administradores
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">📊 Visitas a Judi&apos;s Shop</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Conoce cuántas personas entran a tu tienda y qué productos despiertan más interés.
            Los reportes se consultan de forma segura desde el panel de Vercel Web Analytics.
          </p>
          <a
            href={panelVercel}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#b7146c] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#870e4c]"
          >
            Abrir estadísticas en Vercel ↗
          </a>
          <p className="mt-3 max-w-xl text-xs leading-5 text-slate-500">
            Vercel solicita acceso a la cuenta o equipo propietario de Judi&apos;s Shop.
            Tu sesión de la tienda no da acceso automático a Vercel.
          </p>
        </div>

        <h2 className="mt-9 text-xl font-black">Información que podrás consultar</h2>
        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {indicadores.map((indicador) => (
            <div key={indicador.titulo} className="rounded-[20px] border border-[#f3e0eb] bg-white p-5 shadow-sm">
              <span aria-hidden="true" className="text-3xl">{indicador.icono}</span>
              <h3 className="mt-3 text-base font-black">{indicador.titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{indicador.texto}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[24px] border border-pink-200 bg-[#fff3f9] p-6">
          <h2 className="text-lg font-black text-[#7e154b]">Primera activación</h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            En el proyecto <strong>judis-shop</strong>, abre la sección <strong>Analytics</strong> de Vercel
            y selecciona <strong>Enable</strong> si aparece. Después publica de nuevo el proyecto
            para que comience a recopilar visitas. Las estadísticas no muestran visitas anteriores
            a la activación.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            La medición está configurada para excluir las páginas administrativas y no enviar
            parámetros de búsqueda. Tus clientes no verán esta sección.
          </p>
        </section>
      </div>
    </main>
  );
}
