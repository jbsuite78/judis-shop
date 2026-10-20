"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIAS_JUDIS, nombreDesdeArchivo, sugerirCategoria } from "@/lib/carga-masiva-judis";
import { crearPosterJudi } from "@/lib/crear-poster-judis";

type Articulo = {
  id: string; archivo: File; fotoUrl: string; nombre: string; marca: string;
  categoria: string; descripcion: string; precio: string; costo: string; existencia: string;
  incluir: boolean; poster?: File; posterUrl?: string; analizando?: boolean; aviso?: string;
};
const borde = "mt-1 w-full rounded-xl border border-pink-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-pink-500";
const lista: string[] = [...CATEGORIAS_JUDIS];

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
  const [mensaje,setMensaje]=useState("");
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
      if(!invalidar)return {...a,...cambios};
      if(a.posterUrl)URL.revokeObjectURL(a.posterUrl);
      return {...a,...cambios,poster:undefined,posterUrl:undefined};
    }));
  }
  async function identificar(a:Articulo) {
    try {
      const pequeña=await convertirJpeg(a.archivo,720,.68);
      const dataUrl=await new Promise<string>((resolve,reject)=>{
        const lector=new FileReader();lector.onload=()=>resolve(String(lector.result));
        lector.onerror=()=>reject(new Error("Error al leer la imagen."));lector.readAsDataURL(pequeña);
      });
      const res=await fetch("/api/carga-masiva/identificar",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imagen:dataUrl})
      });
      if(!res.ok)throw new Error("No se pudo identificar");
      const d=await res.json();
      setArticulos(actual=>actual.map(item=>{
        if(item.id!==a.id)return item;
        const nombre=item.nombre || String(d.nombre||"");
        const categoria=item.categoria || String(d.categoria||"") || sugerirCategoria(nombre);
        return {...item,nombre,categoria,
          marca:item.marca==="Sin marca"?String(d.marca||"Sin marca"):item.marca,
          descripcion:item.descripcion || String(d.descripcion||""),
          analizando:false,aviso:d.seguro?"Identificado; revisa los datos.":"Verifica nombre y categoría."
        };
      }));
    }catch{
      cambiar(a.id,{analizando:false,aviso:"Identificación no disponible. Completa los campos."},false);
    }
  }
  function seleccionar(evento:ChangeEvent<HTMLInputElement>) {
    const archivos=Array.from(evento.target.files||[]);
    evento.target.value="";
    if(!archivos.length)return;
    const permitidos=archivos.filter(f=>["image/jpeg","image/png","image/webp"].includes(f.type));
    if(permitidos.length!==archivos.length){setMensaje("Se omitieron archivos que no son JPG, PNG o WebP.");}
    if(articulos.length+permitidos.length>20) {
      setMensaje("Puedes preparar máximo 20 artículos por lote.");
      return;
    }
    const nuevos:Articulo[]=permitidos.map(archivo=>{
      const nombre=nombreDesdeArchivo(archivo.name);
      return {id:crypto.randomUUID(),archivo,fotoUrl:URL.createObjectURL(archivo),
        nombre,marca:"Sin marca",categoria:sugerirCategoria(nombre),descripcion:"",
        precio:"",costo:"0",existencia:"1",incluir:true,analizando:ia,
        aviso:ia?"Identificando fotografía…":""};
    });
    setArticulos(actual=>[...actual,...nuevos]);
    if(ia)void (async()=>{for(const articulo of nuevos){await identificar(articulo);}})();
  }
  function quitar(a:Articulo) {
    URL.revokeObjectURL(a.fotoUrl);if(a.posterUrl)URL.revokeObjectURL(a.posterUrl);
    setArticulos(actual=>actual.filter(x=>x.id!==a.id));
  }
  async function generar() {
    const elegidos=articulos.filter(a=>a.incluir);
    if(!elegidos.length){setMensaje("Selecciona al menos un artículo.");return;}
    if(elegidos.some(a=>!a.nombre.trim() || !a.categoria || !a.precio.trim() ||
      !Number.isFinite(Number(a.precio)) || Number(a.precio)<0)) {
      setMensaje("Completa nombre, categoría y precio de todos los artículos seleccionados.");
      return;
    }
    setOcupado(true);setMensaje("");
    try {
      for(let i=0;i<elegidos.length;i++){
        const a=elegidos[i];setProgreso("Creando póster "+(i+1)+" de "+elegidos.length+"…");
        const archivo=await crearPosterJudi(a.archivo,a.nombre,a.categoria,Number(a.precio));
        cambiar(a.id,{poster:archivo,posterUrl:URL.createObjectURL(archivo)},false);
      }
      setMensaje("✅ Pósteres listos. Revisa las vistas previas, los datos y las categorías antes de publicar.");
    }catch(error){setMensaje(error instanceof Error?error.message:"No se pudieron crear los pósteres.");}
    finally{setOcupado(false);setProgreso("");}
  }
  async function publicar() {
    const elegidos=articulos.filter(a=>a.incluir);
    if(!elegidos.length){setMensaje("Selecciona los productos que vas a publicar.");return;}
    const incorrectos=elegidos.filter(a=>!a.poster || !a.nombre.trim() || !a.categoria ||
      a.precio.trim()==="" || Number(a.precio)<0 || !Number.isFinite(Number(a.precio)) ||
      a.costo.trim()==="" || Number(a.costo)<0 || !Number.isFinite(Number(a.costo)) ||
      !Number.isSafeInteger(Number(a.existencia)) || Number(a.existencia)<0);
    if(incorrectos.length){
      setMensaje("Revisa los datos y genera de nuevo los pósteres de los "+incorrectos.length+" artículos pendientes.");
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
        const original=await convertirJpeg(a.archivo,1600,.82);
        const urlOriginal=await subir(original);
        const urlPoster=await subir(a.poster!);
        registros.push({nombre:a.nombre.trim(),descripcion:a.descripcion.trim() ||
          a.nombre.trim()+". Disponible en Judi’s Shop.",marca:a.marca.trim()||"Sin marca",
          categoria:a.categoria,precio:Number(a.precio),costo:Number(a.costo),
          existencia:Number(a.existencia),imagen:urlPoster,imagenes:[urlOriginal]});
      }
      setProgreso("Publicando todo el lote…");
      const respuesta=await fetch("/api/productos/lote",{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({productos:registros})});
      const data=await respuesta.json();
      if(!respuesta.ok)throw new Error(data.error||"No se pudo publicar el lote.");
      elegidos.forEach(a=>{URL.revokeObjectURL(a.fotoUrl);if(a.posterUrl)URL.revokeObjectURL(a.posterUrl);});
      const ids=new Set(elegidos.map(a=>a.id));
      setArticulos(actual=>actual.filter(a=>!ids.has(a.id)));
      setMensaje("✅ Se publicaron "+data.publicados+" productos en la web. Ya están disponibles por categoría.");
    }catch(error) {
      setMensaje("❌ "+(error instanceof Error?error.message:"No se pudo publicar.")+
        " Revisa el error antes de volver a intentarlo.");
    }finally{setOcupado(false);setProgreso("");}
  }
  const elegidos=articulos.filter(a=>a.incluir);
  const listos=elegidos.filter(a=>!!a.poster).length;
  return (
    <main className="min-h-screen bg-pink-50 px-3 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-bold uppercase tracking-widest text-pink-600">Judi’s Shop / Administración</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Carga masiva y pósteres</h1>
            <p className="mt-2 text-sm text-slate-600">Carga fotos, revisa los datos y publica todos los aprobados en un solo botón.</p>
          </div>
          <Link href="/admin" className="rounded-xl border border-pink-200 bg-white px-4 py-3 font-bold">← Administración</Link>
        </div>
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black">1. Seleccionar fotografías</h2>
          <p className="mt-2 text-sm text-slate-600">Una foto por producto, máximo 20. Se guardará también la foto original. Las fotos no se publican hasta tu aprobación.</p>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={ocupado}
            onChange={seleccionar} className="mt-4 block w-full rounded-xl border-2 border-dashed border-pink-300 bg-pink-50 p-5 text-sm"/>
          <p className="mt-3 text-xs text-slate-500">{ia?
            "La IA propone nombre, marca y categoría a partir de cada foto; confirma que sean correctos.":
            "El reconocimiento visual por IA aún no está configurado. Puedes escribir los datos; si el nombre del archivo es descriptivo, se propondrá su categoría."}</p>
        </section>
        {articulos.length>0 && <>
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-white p-4">
            <div><strong>{articulos.length} artículos cargados</strong>
              <p className="text-sm text-slate-500">{elegidos.length} seleccionados · {listos} pósteres listos</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={ocupado} onClick={generar}
                className="rounded-xl bg-purple-700 px-4 py-3 font-bold text-white disabled:opacity-50">✨ Crear pósteres</button>
              <button type="button" disabled={ocupado||!elegidos.length||listos!==elegidos.length} onClick={publicar}
                className="rounded-xl bg-pink-600 px-4 py-3 font-bold text-white disabled:opacity-50">✅ Publicar {elegidos.length} revisados</button>
            </div>
          </section>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {articulos.map((a,i)=>(
              <section key={a.id} className="rounded-3xl border border-pink-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 font-bold">
                    <input type="checkbox" checked={a.incluir} disabled={ocupado}
                      onChange={e=>cambiar(a.id,{incluir:e.target.checked},false)}
                      className="h-5 w-5 accent-pink-600"/> Producto {i+1}
                  </label>
                  <button type="button" disabled={ocupado} onClick={()=>quitar(a)}
                    className="text-sm font-bold text-red-600 disabled:opacity-50">Quitar</button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.fotoUrl} alt="Fotografía original" className="h-full w-full object-contain"/>
                  </div>
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-pink-50">
                    {a.posterUrl?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.posterUrl} alt={"Póster de "+a.nombre} className="h-full w-full object-contain"/>:
                      <p className="p-3 text-center text-sm font-medium text-pink-700">Póster pendiente</p>}
                  </div>
                </div>
                {a.analizando&&<p className="mt-3 text-sm text-purple-700">🔎 Identificando producto…</p>}
                {a.aviso&&<p className="mt-3 text-xs text-slate-500">{a.aviso}</p>}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-sm font-semibold">Nombre del producto
                    <input value={a.nombre} disabled={ocupado} maxLength={180} className={borde} placeholder="Nombre y variante exactos"
                      onChange={e=>{
                        const nombre=e.target.value;
                        cambiar(a.id,{nombre,categoria:a.categoria||sugerirCategoria(nombre)});
                      }}/>
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
                  <label className="text-sm font-semibold">Costo ($) (0 si aún no lo sabes)
                    <input type="number" inputMode="decimal" min="0" step=".01" disabled={ocupado}
                      value={a.costo} className={borde}
                      onChange={e=>cambiar(a.id,{costo:e.target.value})}/>
                  </label>
                  <label className="text-sm font-semibold">Existencia
                    <input type="number" inputMode="numeric" min="0" step="1" disabled={ocupado}
                      value={a.existencia} className={borde}
                      onChange={e=>cambiar(a.id,{existencia:e.target.value})}/>
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">Descripción para la web
                    <textarea rows={2} value={a.descripcion} disabled={ocupado} maxLength={2500}
                      placeholder="Descripción breve, opcional" className={borde}
                      onChange={e=>cambiar(a.id,{descripcion:e.target.value},false)}/>
                  </label>
                </div>
                {a.poster&&<p className="mt-3 text-xs font-bold text-green-700">✓ Póster generado. Si cambias nombre, categoría o precio deberás regenerarlo.</p>}
              </section>
            ))}
          </div>
          <section className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-600">
            <strong className="text-slate-900">2. Revisión y publicación.</strong> Comprueba que la foto, presentación,
            categoría y precio correspondan a cada artículo. Pulsa «Crear pósteres» después de completar los datos;
            después «Publicar revisados» para agregar el lote al catálogo. Los costos no aparecen en la web.
          </section>
        </>}
        {(mensaje||progreso)&&<p role="status" className="mt-5 rounded-2xl border border-pink-200 bg-white p-4 text-sm font-semibold text-slate-800">{progreso||mensaje}</p>}
      </div>
    </main>
  );
}
