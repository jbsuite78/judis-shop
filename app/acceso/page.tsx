"use client";
import {FormEvent,useState} from "react";
export default function AccesoAdmin(){
 const [password,setPassword]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 async function ingresar(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setLoading(true);
  try{
   const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password}),cache:"no-store"});
   const result=await r.json();
   if(!r.ok||!result.ok){setError(r.status===429?"Demasiados intentos. Espera unos minutos.":"Contraseña incorrecta.");setPassword("");return;}
   const next=new URLSearchParams(window.location.search).get("next")??"";
   window.location.replace(next.startsWith("/admin")&&!next.startsWith("//")?next:"/admin");
  }catch{setError("No se pudo iniciar sesión. Inténtalo nuevamente.");}
  finally{setLoading(false);}
 }
 return <main className="min-h-screen flex items-center justify-center bg-pink-50 px-6 text-slate-900">
  <form onSubmit={ingresar} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
   <h1 className="text-3xl font-bold text-center">Judi&apos;s Shop</h1>
   <p className="text-center text-gray-500 my-5">🔐 Acceso administrativo seguro</p>
   <label htmlFor="admin-password" className="block mb-2 font-semibold">Contraseña</label>
   <input id="admin-password" autoFocus required type="password" value={password} onChange={e=>setPassword(e.target.value)}
    autoComplete="current-password" className="w-full border rounded-xl px-4 py-3 mb-4 bg-white text-black"/>
   {error&&<p role="alert" className="text-red-600 text-center mb-4">{error}</p>}
   <button disabled={loading} type="submit" className="w-full bg-pink-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl">
    {loading?"Verificando...":"Entrar"}
   </button>
   <a href="/catalogo" className="block text-center text-pink-700 mt-5">← Volver al catálogo</a>
  </form>
 </main>;
}
