"use client";
import {useState} from "react";
export default function AdminLayout({children}:{children:React.ReactNode}){
 const [saliendo,setSaliendo]=useState(false);
 async function cerrarSesion(){setSaliendo(true);try{
  const res=await fetch("/api/admin/logout",{method:"POST"});if(!res.ok)throw Error("No se pudo cerrar sesión.");
  window.location.assign("/acceso");
 }catch{alert("No se pudo cerrar sesión. Vuelve a intentarlo.");setSaliendo(false);}}
 return <><div className="fixed top-4 right-4 z-50">
  <button onClick={cerrarSesion} disabled={saliendo} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-lg disabled:opacity-50">
  🔒 {saliendo?"Cerrando...":"Cerrar sesión"}</button></div>{children}</>;
}
