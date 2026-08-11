export default function AdminPage() {
  const opciones = [
    {
      titulo: "📦 Inventario",
      descripcion: "Ver existencias, precios, costos y utilidad",
      href: "/admin/inventario",
    },
    {
      titulo: "➕ Agregar producto",
      descripcion: "Registrar productos, descripción y fotografías",
      href: "/admin/productos",
    },
    
    {
      titulo: "🧾 Corte de caja",
      descripcion: "Revisar totales, ingresos y movimientos",
      href: "/admin/corte",
    },
    {
      titulo: "📋 Historial",
      descripcion: "Consultar movimientos y operaciones anteriores",
      href: "/admin/historial",
    },
    {
      titulo: "🌐 Ver catálogo",
      descripcion: "Abrir Judi's Shop como la ve el cliente",
      href: "/catalogo",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">
            Panel de administración
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900">
                Judi&apos;s Shop
              </h1>

              <p className="mt-2 text-slate-500">
                Control general de tu tienda desde un solo lugar.
              </p>
            </div>

            <a
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ← Ir a la tienda
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section>
          <h2 className="text-2xl font-black text-slate-900">
            Administración
          </h2>

          <p className="mt-1 text-slate-500">
            Selecciona la sección que quieres administrar.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opciones.map((opcion) => (
              <a
                key={opcion.href}
                href={opcion.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-xl font-black text-slate-900">
                  {opcion.titulo}
                </h3>

                <p className="mt-2 leading-6 text-slate-500">
                  {opcion.descripcion}
                </p>

                <p className="mt-5 font-bold text-pink-600">
                  Abrir →
                </p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}