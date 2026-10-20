"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIAS_JUDIS, nombreDesdeArchivo, sugerirCategoria } from "@/lib/carga-masiva-judis";
import { crearPosterJudi } from "@/lib/crear-poster-judis";
import { leerDatosDePoster, nombrePareceValido } from "@/lib/ocr-nombre-poster-judis";

type Articulo = {
  id: string; archivo: File; fotoUrl: string; nombre: string; marca: string;
  categoria: string; descripcion: string; precio: string; costo: string; existencia: string;
  incluir: boolean; poster?: File; posterUrl?: string; analizando?: boolean; aviso?: string;
  nombreEditado?: boolean;
};
const borde = "mt-1 w-full rounded-xl border border-pink-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-pink-500";
const lista: string[] = [...CATEGORIAS_JUDIS];
type ErrorValidacion = { id: string; campo: string; detalle: string };
function monedaValida(valor: string): boolean {
  if (!valor.trim()) return false;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 && numero <= 10_000_000 &&
    Math.abs(numero * 100 - Math.round(numero * 100)) < 0.000001;
}
function claveProducto(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}
function validarParaPublicar(articulos: Articulo[]): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  const vistos = new Map<string, number>();
  articulos.forEach((a, indice) => {
    if (!a.incluir) return;
    const anotar = (campo: string, detalle: string) => errores.push({ id: a.id, campo, detalle });
    if (!a.nombre.trim() || a.nombre.trim().length > 180) anotar("nombre", "Escribe el nombre completo del producto.");
    if (!lista.includes(a.categoria)) anotar("categoria", "Selecciona una categoría válida.");
    if (!monedaValida(a.precio)) anotar("precio", "Captura un precio válido (máximo 2 decimales).");
    if (!monedaValida(a.costo)) anotar("costo", "Captura el costo; puedes dejar 0 si aún lo desconoces.");
    if (!a.marca.trim() || a.marca.trim().length > 100) anotar("marca", "Revisa la marca del producto.");
    if (!Number.isSafeInteger(Number(a.existencia)) || a.existencia.trim() === "" ||
        Number(a.existencia) < 0 || Number(a.existencia) > 1_000_000) {
      anotar("existencia", "Indica una existencia válida en piezas.");
    }
    if (a.nombre.trim() && a.marca.trim() && lista.includes(a.categoria)) {
      const clave = [a.nombre, a.marca, a.categoria].map(claveProducto).join("|");
      const anterior = vistos.get(clave);
      if (anterior !== undefined) {
        anotar("repetido", "Coincide con el producto " + (anterior + 1) +
          ". Distingue la marca, modelo o variante; si es el mismo artículo, captura las unidades en existencia.");
      } else {
        vistos.set(clave, indice);
      }
    }
  });
  return errores;
}

async function convertirJpeg(archivo: File, maximo: number, calidad: number): Promise<File> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {img.onload=()=>resolve();img.onerror=()=>reject(new Error("No se pudo abrir la foto."));img.src=url;});
    const factor=Math.min(1,maximo/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo preparar la fotografía.");
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("No se pudo convertir la foto.")),"image/jpeg",calidad));
    return new File([blob],"fotografia-judis.jpg",{type:"image/jpeg"});
  } finally { URL.revokeObjectURL(url); }
}
async function prepararImagenParaPublicar(archivo: File): Promise<File> {
  // Conserva la resolución y tipografía de pósteres terminados siempre que el servidor los admita.
  if (["image/jpeg", "image/png", "image/webp"].includes(archivo.type) && archivo.size <= 3_400_000) {
    return archivo;
  }
  return convertirJpeg(archivo,2000,.91);
}
async function subir(archivo: File) {
  const formulario=new FormData();formulario.append("archivo",archivo);
  const res=await fetch("/api/upload-producto",{method:"POST",body:formulario});
  const data=await res.json();
  if(!res.ok || !data.url)throw new Error(data.error||"No se pudo subir una fotografía.");
  return String(data.url);
}

export default function CargaMasiva() {
  const [articulos,setArticulos]=useState<Articulo[]>([]);
  const [ia,setIa]=useState(false);
  const [ocupado,setOcupado]=useState(false);
  const [generandoDescripcionId,setGenerandoDescripcionId]=useState<string|null>(null);
  const [mensaje,setMensaje]=useState("");
  const [mostrarErrores,setMostrarErrores]=useState(false);
  const [progreso,setProgreso]=useState("");
  useEffect(()=>{
    fetch("/api/carga-masiva/identificar",{cache:"no-store"})
      .then(r=>r.ok?r.json():{disponible:false})
      .then(d=>setIa(d.disponible===true))
      .catch(()=>setIa(false));
  },[]);
  function cambiar(id:string, cambios:Partial<Articulo>, invalidar=true) {
    setArticulos(actual=>actual.map(a=>{
      if(a.id!==id)return a;
      if(!invalidar){
        if(a.posterUrl && Object.prototype.hasOwnProperty.call(cambios,"posterUrl") && a.posterUrl !== cambios.posterUrl){ URL.revokeObjectURL(a.posterUrl); }
        return {...a,...cambios};
      }
      if(a.posterUrl)URL.revokeObjectURL(a.posterUrl);
      return {...a,...cambios,poster:undefined,posterUrl:undefined};
    }));
  }
  async function identificar(a:Articulo) {
    let resultado:{nombre?:string;marca?:string;categoria?:string;descripcion?:string;seguro?:boolean}|null=null;
    let modo:"ia"|"ocr"|"archivo"="archivo";
    let errorOCR=false;
    try {
      // Prioriza la identificación visual cuando la tienda tiene un servicio de IA configurado.
      if(ia) {
        try {
          const pequeña=await convertirJpeg(a.archivo,1000,.75);
          const dataUrl=await new Promise<string>((resolve,reject)=>{
            const lector=new FileReader();lector.onload=()=>resolve(String(lector.result));
            lector.onerror=()=>reject(new Error("No se pudo leer la fotografía."));lector.readAsDataURL(pequeña);
          });
          const res=await fetch("/api/carga-masiva/identificar",{
            method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imagen:dataUrl})
          });
          if(res.ok) {
            const d=await res.json();
            if(typeof d.nombre==="string" && nombrePareceValido(d.nombre) && d.seguro===true) {
              resultado=d;modo="ia";
            }
          }
        } catch { /* El lector local seguirá funcionando aunque falle el servicio de IA. */ }
      }
      // Lee las palabras impresas en el póster directamente en el navegador, sin API de pago.
      if(!resultado) {
        try {
          const jpeg=await convertirJpeg(a.archivo,1600,.92);
          const datos=await leerDatosDePoster(jpeg);
          if(datos.nombre && nombrePareceValido(datos.nombre)) {
            resultado={nombre:datos.nombre,marca:datos.marca,categoria:datos.categoria};
            modo="ocr";
          } else if(datos.marca || datos.categoria) {
            // La marca y categoría también son útiles aunque el nombre no sea legible.
            resultado={marca:datos.marca,categoria:datos.categoria};
            modo="ocr";
          }
        }catch {errorOCR=true;}
      }
      setArticulos(actual=>actual.map(item=>{
        if(item.id!==a.id)return item;
        const propuesto=String(resultado?.nombre??"").trim();
        const nombre=item.nombreEditado?item.nombre:propuesto||item.nombre;
        const categoria=item.categoria||String(resultado?.categoria||"")||sugerirCategoria(nombre);
        const marca=item.marca==="Sin marca"&&resultado?.marca?String(resultado.marca):item.marca;
        return {
          ...item,nombre,categoria,marca,analizando:false,
          // No reemplazar descripciones escritas por el dueño sin su permiso.
          aviso:propuesto
            ? "✅ Nombre propuesto del póster. Verifica que coincida con el título antes de publicar."+(modo==="ocr"?" (Lectura del texto).":"")
            : item.nombre
              ? "⚠️ Se utilizó el nombre del archivo. Confirma que sea correcto."
              : errorOCR
                ? "⚠️ No se pudo leer el texto del póster. Escribe el nombre o toca «Volver a leer»."
                : "⚠️ No se identificó un nombre confiable; no se llenará con letras sueltas. Puedes escribirlo o volver a leer.",
        };
      }));
    }catch {
      cambiar(a.id,{analizando:false,aviso:"⚠️ No se pudo detectar el nombre. Puedes escribirlo manualmente."},false);
    }
  }
  async function reintentarNombre(a:Articulo) {
    cambiar(a.id,{analizando:true,nombreEditado:false,aviso:"🔎 Volviendo a leer el nombre del póster…"},false);
    await identificar({...a,nombreEditado:false});
  }
  function seleccionar(evento:ChangeEvent<HTMLInputElement>) {
    const archivos=Array.from(evento.target.files||[]);
    setMostrarErrores(false);
    evento.target.value="";
    if(!archivos.length)return;
    const permitidos=archivos.filter(f=>["image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(f.type));
    if(permitidos.length!==archivos.length){setMensaje("Se omitieron archivos que no son imágenes compatibles.");}
    if(articulos.length+permitidos.length>20) {
      setMensaje("Puedes preparar máximo 20 artículos por lote.");
      return;
    }
    const nuevos:Articulo[]=permitidos.map(archivo=>{
      const nombre=nombreDesdeArchivo(archivo.name);
      return {id:crypto.randomUUID(),archivo,fotoUrl:URL.createObjectURL(archivo),
         nombre,marca:"Sin marca",categoria:sugerirCategoria(nombre),descripcion:"",
        precio:"",costo:"0",existencia:"1",incluir:true,analizando:true,nombreEditado:false,
        aviso:"🔎 Leyendo el nombre escrito en el póster…"};
    });
    setArticulos(actual=>[...actual,...nuevos]);
    void (async()=>{for(const articulo of nuevos){await identificar(articulo);}})();
  }
  function quitar(a:Articulo) {
    URL.revokeObjectURL(a.fotoUrl);if(a.posterUrl)URL.revokeObjectURL(a.posterUrl);
    setArticulos(actual=>actual.filter(x=>x.id!==a.id));
  }
  async function crearPosterUno(a:Articulo) {
    if(!a.nombre.trim() || !a.categoria || a.precio.trim()==="" ||
       !Number.isFinite(Number(a.precio)) || Number(a.precio)<0) {
      setMensaje("Completa nombre, categoría y precio antes de crear el póster.");
      return;
    }
    setOcupado(true);setMensaje("");setProgreso("Creando póster de "+a.nombre+"…");
    try {
      const poster=await crearPosterJudi(a.archivo,a.nombre,a.categoria,Number(a.precio));
      cambiar(a.id,{poster,posterUrl:URL.createObjectURL(poster)},false);
      setMensaje("✅ Póster creado. Revisa la vista previa. Puedes volver a usar la imagen que subiste.");
    }catch(error) {
      setMensaje(error instanceof Error?error.message:"No se pudo crear el póster.");
    }finally {setOcupado(false);setProgreso("");}
  }
  async function crearDescripcionUno(a:Articulo) {
    // Una categoría ayuda a personalizar el texto, pero no es requisito para escribirlo.
    if(!a.nombre.trim()) {
      cambiar(a.id,{aviso:"⚠️ Escribe primero el nombre del producto. Después pulsa Crear descripción."},false);
      document.getElementById("nombre-"+a.id)?.focus();
      return;
    }
    if(a.descripcion.trim() &&
        !window.confirm("¿Quieres reemplazar la descripción actual de este producto?")) return;
    setOcupado(true);
    setGenerandoDescripcionId(a.id);
    cambiar(a.id,{aviso:"📝 Generando descripción…"},false);
    setMensaje("");
    try {
      const res=await fetch("/api/carga-masiva/descripcion",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nombre:a.nombre,marca:a.marca,categoria:a.categoria})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok || typeof data.descripcion!=="string" || !data.descripcion.trim()) {
        if(res.status===401) throw new Error("Tu sesión terminó. Vuelve a iniciar sesión y prueba de nuevo.");
        throw new Error(data.error || "No se pudo generar la descripción. Intenta nuevamente.");
      }
      cambiar(a.id,{
        descripcion:data.descripcion,
        aviso:data.origen==="plantilla"
          ? "✅ Descripción creada con texto base editable. Revísala antes de publicar."
          : "✅ Descripción creada. Puedes corregirla antes de publicar."
      },false);
    }catch(error) {
      cambiar(a.id,{aviso:"❌ "+(error instanceof Error?error.message:"No se pudo crear la descripción.")},false);
    }finally {
      setGenerandoDescripcionId(null);
      setOcupado(false);
    }
  }
  function usarImagenSubida(a:Articulo) {
    cambiar(a.id,{poster:undefined,posterUrl:undefined},false);
    setMensaje("✅ Se utilizará la imagen que subiste, sin crear otro póster.");
  }
  async function publicar() {
    const elegidos=articulos.filter(a=>a.incluir);
    if(!elegidos.length){setMensaje("Selecciona los productos que vas a publicar.");return;}
    setMostrarErrores(true);
    const errores=validarParaPublicar(articulos);
    if(errores.length) {
      const afectados=new Set(errores.map(error=>error.id)).size;
      setMensaje("⚠️ Faltan corregir " + errores.length + " datos en " + afectados +
        " producto(s). Revisa los avisos junto a cada artículo; ninguno fue publicado.");
      const primero=errores[0];
      window.setTimeout(()=>document.getElementById("producto-"+primero.id)?.scrollIntoView({
        behavior:"smooth",block:"center"
      }),60);
      return;
    }
    if(!window.confirm("¿Confirmas que deseas publicar "+elegidos.length+" productos en Judi’s Shop?")){
      return;
    }
    setOcupado(true);setMensaje("");
    try {
      const registros=[];
      for(let i=0;i<elegidos.length;i++){
        const a=elegidos[i];
        setProgreso("Subiendo imágenes del artículo "+(i+1)+" de "+elegidos.length+"…");
        const principal=await prepararImagenParaPublicar(a.poster ?? a.archivo);
        let urlPrincipal: string;
        try { urlPrincipal=await subir(principal); }
        catch(error) {
          throw new Error("No se pudo subir la imagen del producto "+(i+1)+" ("+a.nombre+"): "+
            (error instanceof Error?error.message:"Error desconocido"));
        }
        const extras:string[]=[];
        if(a.poster) {
          const original=await convertirJpeg(a.archivo,1600,.82);
          extras.push(await subir(original));
        }
        registros.push({nombre:a.nombre.trim(),descripcion:a.descripcion.trim() ||
          a.nombre.trim()+". Disponible en Judi’s Shop.",marca:a.marca.trim()||"Sin marca",
          categoria:a.categoria,precio:Number(a.precio),costo:Number(a.costo),
          existencia:Number(a.existencia),imagen:urlPrincipal,imagenes:extras});
      }
      setProgreso("Publicando todo el lote…");
      const respuesta=await fetch("/api/productos/lote",{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({productos:registros})});
      const data=await respuesta.json().catch(()=>({error:"El servidor no devolvió una respuesta válida."}));
      if(!respuesta.ok) {
        if(respuesta.status===401) throw new Error("La sesión de administración terminó. Inicia sesión otra vez; no se publicó el lote.");
        throw new Error(data.error||"No se pudo publicar el lote (código "+respuesta.status+").");
      }
      elegidos.forEach(a=>{URL.revokeObjectURL(a.fotoUrl);if(a.posterUrl)URL.revokeObjectURL(a.posterUrl);});
      const ids=new Set(elegidos.map(a=>a.id));
      setArticulos(actual=>actual.filter(a=>!ids.has(a.id)));
      setMensaje("✅ Se publicaron "+data.publicados+" productos en la web. Ya están disponibles por categoría.");
    }catch(error) {
      setMensaje("❌ "+(error instanceof Error?error.message:"No se pudo publicar.")+
        " Revisa el error antes de volver a intentarlo.");
      window.scrollTo({top:0,behavior:"smooth"});
    }finally{setOcupado(false);setProgreso("");}
  }
  const elegidos=articulos.filter(a=>a.incluir);
  const postersGenerados=elegidos.filter(a=>!!a.poster).length;
  const erroresActuales=mostrarErrores?validarParaPublicar(articulos):[];
  return (
    <main className="min-h-screen bg-pink-50 px-3 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-bold uppercase tracking-widest text-pink-600">Judi’s Shop / Administración</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Carga masiva y pósteres</h1>
            <p className="mt-2 text-sm text-slate-600">Carga tus pósteres ya terminados o crea uno nuevo si lo necesitas. Revisa todo antes de publicar.</p>
          </div>
          <Link href="/admin" className="rounded-xl border border-pink-200 bg-white px-4 py-3 font-bold">← Administración</Link>
        </div>
        {(mensaje||progreso)&&<p role="alert" aria-live="assertive"
          className="mt-5 rounded-2xl border border-pink-300 bg-white p-4 text-sm font-semibold text-slate-900">
          {progreso||mensaje}
        </p>}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black">1. Subir fotos o pósteres ya elaborados</h2>
          <p className="mt-2 text-sm text-slate-600">Una imagen por producto, máximo 20. Si ya hiciste tu póster, súbelo directamente: intentaremos leer su nombre del texto impreso. Crear un póster nuevo es opcional. Nada se publica sin tu aprobación.</p>
          <input type="file" accept="image/*" multiple disabled={ocupado}
            onChange={seleccionar} className="mt-4 block w-full rounded-xl border-2 border-dashed border-pink-300 bg-pink-50 p-5 text-sm"/>
          <p className="mt-3 text-xs text-slate-500">El nombre se propone automáticamente leyendo el texto del póster.
            {ia?" Además, se intentará identificar marca y categoría con IA.": " El lector de texto funciona sin una API de IA configurada."}
            {" "}La primera lectura puede tardar un poco; revisa siempre el resultado.</p>
        </section>
        {articulos.length>0 && <>
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-white p-4">
            <div><strong>{articulos.length} artículos cargados</strong>
              <p className="text-sm text-slate-500">{elegidos.length} seleccionados · {postersGenerados} pósteres nuevos creados</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={ocupado||!elegidos.length||elegidos.some(a=>a.analizando)} onClick={publicar}
                className="rounded-xl bg-pink-600 px-4 py-3 font-bold text-white disabled:opacity-50">
                {elegidos.some(a=>a.analizando)?"🔎 Esperando lectura de imágenes…": "✅ Publicar "+elegidos.length+" revisados"}
              </button>
            </div>
          </section>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {articulos.map((a,i)=>(
              <section id={"producto-"+a.id} key={a.id} className="min-w-0 overflow-hidden rounded-3xl border border-pink-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 font-bold">
                    <input type="checkbox" checked={a.incluir} disabled={ocupado}
                      onChange={e=>cambiar(a.id,{incluir:e.target.checked},false)}
                      className="h-5 w-5 accent-pink-600"/> Producto {i+1}
                  </label>
                  <button type="button" disabled={ocupado} onClick={()=>quitar(a)}
                    className="text-sm font-bold text-red-600 disabled:opacity-50">Quitar</button>
                </div>
                {erroresActuales.some(error=>error.id===a.id)&&<div role="alert"
                  className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
                  <p>⚠️ Corrige estos datos antes de publicar:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {erroresActuales.filter(error=>error.id===a.id).map(error=>
                      <li key={error.campo}>{error.detalle}</li>)}
                  </ul>
                </div>}
                <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.fotoUrl} alt="Imagen subida por ti" className="h-full w-full object-contain"/>
                  </div>
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-pink-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.posterUrl ?? a.fotoUrl} alt={"Imagen que se publicará: "+a.nombre} className="h-full w-full object-contain"/>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Izquierda: imagen subida · Derecha: imagen final para la web.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={ocupado||a.analizando} onClick={()=>crearPosterUno(a)}
                    className="rounded-xl bg-purple-700 px-3 py-2 font-bold text-white disabled:opacity-50">✨ Crear póster</button>
                  {a.poster&&<button type="button" disabled={ocupado} onClick={()=>usarImagenSubida(a)}
                    className="rounded-xl border border-purple-300 bg-white px-3 py-2 font-bold text-purple-800 disabled:opacity-50">↩ Usar imagen que subí</button>}
                </div>
                {a.analizando&&<p className="mt-3 text-sm text-purple-700">🔎 Identificando producto…</p>}
                <p className="mt-2 text-xs text-slate-500">Para crear la descripción basta con el nombre; puedes completar la categoría después.</p>
                
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-sm font-semibold">Nombre del producto
                    <input id={"nombre-"+a.id} value={a.nombre} disabled={ocupado} maxLength={180} className={borde} placeholder="Nombre y variante del producto (del póster)"
                      onChange={e=>{
                        const nombre=e.target.value;
                        cambiar(a.id,{nombre,nombreEditado:true,categoria:a.categoria||sugerirCategoria(nombre)});
                      }}/>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-normal text-slate-500">Sugerencia automática: confirma la marca y presentación.</span>
                      <button type="button" disabled={ocupado||a.analizando} onClick={()=>reintentarNombre(a)}
                        className="shrink-0 rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-800 disabled:opacity-50">
                        {a.analizando?"Leyendo…":"🔎 Volver a leer"}
                      </button>
                    </div>
                  </label>
                  <label className="text-sm font-semibold">Categoría
                    <select value={a.categoria} disabled={ocupado} className={borde}
                      onChange={e=>cambiar(a.id,{categoria:e.target.value})}>
                      <option value="">Selecciona una categoría</option>
                      {lista.map(x=><option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Marca
                    <input value={a.marca} disabled={ocupado} className={borde} maxLength={100}
                      onChange={e=>cambiar(a.id,{marca:e.target.value})}/>
                  </label>
                  <label className="text-sm font-semibold">Precio de venta ($)
                    <input type="number" inputMode="decimal" min="0" step=".01" disabled={ocupado}
                      value={a.precio} className={borde} placeholder="Ej. 450"
                      onChange={e=>cambiar(a.id,{precio:e.target.value})}/>
                  </label>
                  <label className="text-sm font-semibold">Costo ($) (0 si todavía es desconocido)
                    <input type="number" inputMode="decimal" min="0" step=".01" disabled={ocupado}
                      value={a.costo} className={borde}
                      onChange={e=>cambiar(a.id,{costo:e.target.value})}/>
                  </label>
                  <label className="text-sm font-semibold">Existencia
                    <input type="number" inputMode="numeric" min="0" step="1" disabled={ocupado}
                      value={a.existencia} className={borde}
                      onChange={e=>cambiar(a.id,{existencia:e.target.value})}/>
                  </label>
                  <div className="text-sm font-semibold sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={"desc-"+a.id}>Descripción para la web</label>
                      <button type="button" disabled={ocupado||a.analizando} onClick={()=>crearDescripcionUno(a)}
                        className="rounded-xl bg-pink-100 px-3 py-2 font-bold text-pink-800 disabled:opacity-50">{generandoDescripcionId===a.id?"⌛ Creando…":"📝 Crear descripción"}</button>
                    </div>
                    <textarea id={"desc-"+a.id} rows={3} value={a.descripcion} disabled={ocupado} maxLength={2500}
                      placeholder="Escribe una descripción o pulsa Crear descripción" className={borde}
                      onChange={e=>cambiar(a.id,{descripcion:e.target.value},false)}/>
                    {a.aviso&&<p role="status" aria-live="polite" className="mt-2 rounded-xl bg-pink-50 px-3 py-2 text-sm font-medium text-slate-700">{a.aviso}</p>}
                  </div>
                </div>
                {a.poster&&<p className="mt-3 text-xs font-bold text-green-700">✓ Póster nuevo generado. Si cambias nombre, categoría o precio deberás regenerarlo.</p>}
              </section>
            ))}
          </div>
          <section className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-600">
            <strong className="text-slate-900">2. Revisión y publicación.</strong> Comprueba que la foto, presentación,
            categoría y precio correspondan a cada artículo. Si ya subiste un póster terminado,
            no es necesario pulsar «Crear póster»; la foto subida se publicará directamente. «Crear descripción» es opcional.
            Pulsa «Publicar revisados» cuando termines. Si tus pósteres incluyen precio,
            comprueba que coincida con el precio capturado. Los costos no aparecen en la web. Si capturas costo 0, la utilidad del inventario no será exacta hasta que lo actualices.
          </section>
        </>}

      </div>
    </main>
  );
}
