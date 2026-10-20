import { isAdminMutation, unauthorizedResponse } from "@/lib/admin-auth";
import { CATEGORIAS_JUDIS, sugerirCategoria } from "@/lib/carga-masiva-judis";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  return Response.json({ disponible: Boolean(process.env.OPENAI_API_KEY) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return Response.json({error:"El reconocimiento por imagen requiere configurar OPENAI_API_KEY en Judi's Shop."},{status:503});
  try {
    const body:unknown=await request.json();
    const foto=body && typeof body==="object" && "imagen" in body ? (body as {imagen:unknown}).imagen : null;
    if(typeof foto!=="string" || foto.length>1_600_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(foto)) {
      return Response.json({error:"Fotografía inválida o demasiado grande."},{status:400});
    }
    const control=new AbortController();
    const timeout=setTimeout(()=>control.abort(),18000);
    let respuesta:Response;
    try {
      respuesta=await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",signal:control.signal,
        headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"gpt-4o-mini",temperature:0.1,max_tokens:320,
          response_format:{type:"json_object"},
          messages:[
            {role:"system",content:
              "Analiza la fotografía de un producto para una tienda mexicana. Regresa solo JSON con nombre, marca, categoria, descripcion, seguro. Usa únicamente detalles claramente visibles. Nunca inventes marca, variantes ni certificaciones. Categoría debe ser una de: "+
              CATEGORIAS_JUDIS.join(", ")+". Si no puedes identificar el tipo de producto, categoría vacía y seguro false. Si no se ve marca devuelve Sin marca. Nombre específico cuando sea legible. Descripción breve factual sin afirmaciones clínicas ni autenticidad. seguro booleano indica si los datos son confiables."},
            {role:"user",content:[{type:"text",text:"Identifica producto, marca, categoría y descripción. Sin precio ni cantidades."},
              {type:"image_url",image_url:{url:foto,detail:"low"}}]},
          ],
        })
      });
    } finally {clearTimeout(timeout);}
    if(!respuesta.ok)throw new Error("El servicio de reconocimiento no respondió.");
    const data=await respuesta.json();
    const raw=String(data.choices?.[0]?.message?.content||"{}");
    const d=JSON.parse(raw) as Record<string,unknown>;
    const nombre=typeof d.nombre==="string"?d.nombre.trim().slice(0,180):"";
    const marca=typeof d.marca==="string"&&d.marca.trim()?d.marca.trim().slice(0,100):"Sin marca";
    const descripcion=typeof d.descripcion==="string"?d.descripcion.trim().slice(0,900):"";
    const categoria=typeof d.categoria==="string"&& CATEGORIAS_JUDIS.includes(d.categoria as (typeof CATEGORIAS_JUDIS)[number])
      ? d.categoria : sugerirCategoria(nombre);
    return Response.json({nombre,marca,descripcion,categoria,seguro:d.seguro===true && !!categoria && !!nombre});
  } catch(error){
    console.error("No se pudo analizar una foto de la carga masiva:",error);
    return Response.json({error:"No se pudo identificar la fotografía. Captura el nombre y la categoría manualmente."},{status:502});
  }
}
