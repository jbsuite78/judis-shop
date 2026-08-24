"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function PruebaSupabase() {
  const [mensaje, setMensaje] = useState("Probando conexión...");

  useEffect(() => {
    async function probarConexion() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock")
        .limit(1);

      if (error) {
        setMensaje(`❌ Error: ${error.message}`);
        return;
      }

      setMensaje(
        `✅ Conexión correcta. Productos encontrados: ${data?.length ?? 0}`
      );
    }

    probarConexion();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Judi&apos;s Shop - Prueba Supabase</h1>
      <p>{mensaje}</p>
    </main>
  );
}