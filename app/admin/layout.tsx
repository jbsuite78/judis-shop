"use client";

import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [autorizado, setAutorizado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const acceso = sessionStorage.getItem("judisAdmin");
    if (acceso === "ok") {
      setAutorizado(true);
    }
  }, []);

  function entrar() {
    if (clave === "Judis2026") {
      sessionStorage.setItem("judisAdmin", "ok");
      setAutorizado(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  }

  if (!autorizado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pink-50 px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Judi&apos;s Shop
          </h1>

          <p className="text-center text-gray-500 mb-6">
            Acceso administrativo
          </p>

         <input
  type="password"
  value={clave}
  onChange={(e) => setClave(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") entrar();
  }}
  placeholder="Contraseña"
  autoComplete="current-password"
  className="relative z-10 w-full border rounded-xl px-4 py-3 mb-4 bg-white text-black"
/>
          {error && (
            <p className="text-red-600 text-center mb-4">
              {error}
            </p>
          )}

          <button
            onClick={entrar}
            className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl"
          >
            🔐 Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
  <>
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => {
          sessionStorage.removeItem("judisAdmin");
          setAutorizado(false);
        }}
        className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-lg"
      >
        🔒 Cerrar sesión
      </button>
    </div>

    {children}
  </>
);
}