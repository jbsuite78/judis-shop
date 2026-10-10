import pg from "pg";

// Migración pequeña e idempotente para añadir visibilidad al inventario.
// Se ejecuta antes del build para que la columna exista antes de que
// el código generado de Prisma la consulte en producción.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada; no se puede verificar visibilidad.");
}

const cliente = new pg.Client({ connectionString, connectionTimeoutMillis: 15000 });
try {
  await cliente.connect();
  const verificacion = await cliente.query(
    "SELECT to_regclass('public.\"Producto\"') AS tabla"
  );
  if (!verificacion.rows[0]?.tabla) {
    throw new Error('No se encontró la tabla public."Producto". No se aplicó ningún cambio.');
  }
  await cliente.query(
    'ALTER TABLE public."Producto" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT TRUE'
  );
  console.log("Visibilidad de productos verificada.");
} finally {
  await cliente.end();
}
