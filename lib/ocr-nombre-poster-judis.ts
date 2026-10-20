/**
 * Lee nombres escritos en pósteres. OCR en el dispositivo, con control
 * conservador de calidad: nunca inventa un nombre si el texto no es legible.
 */
type Caja = { x0: number; x1: number; y0: number; y1: number };
type Linea = { text: string; confidence?: number; bbox?: Caja };
type Parrafo = { lines?: Linea[] };
type Bloque = { paragraphs?: Parrafo[] };
type DatosOCR = { text: string; lines?: Linea[]; blocks?: Bloque[] };
type ResultadoOCR = { data: DatosOCR };
type TrabajadorOCR = {
  recognize: (imagen: Blob, options?: object, output?: { text?: boolean; blocks?: boolean; tsv?: boolean }) => Promise<ResultadoOCR>;
};
type MotorOCR = { createWorker: (lang: string, oem?: number) => Promise<TrabajadorOCR> };

export type ProductoLeido = { nombre: string; marca: string; categoria: string };

const LIBRERIA = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let motor: Promise<MotorOCR> | null = null;
let lector: Promise<TrabajadorOCR> | null = null;

async function cargarMotor(): Promise<MotorOCR> {
  if (motor) return motor;
  motor = new Promise<MotorOCR>((resolve, reject) => {
    const actual = (window as unknown as { Tesseract?: MotorOCR }).Tesseract;
    if (actual) return resolve(actual);
    const script = document.createElement("script");
    script.src = LIBRERIA;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    const limite = window.setTimeout(() => {
      script.remove();
      reject(new Error("Tiempo de espera agotado al cargar OCR."));
    }, 25000);
    script.onload = () => {
      window.clearTimeout(limite);
      const instalado = (window as unknown as { Tesseract?: MotorOCR }).Tesseract;
      if (instalado) resolve(instalado);
      else reject(new Error("El lector de texto no se cargó."));
    };
    script.onerror = () => {
      window.clearTimeout(limite);
      reject(new Error("Sin acceso al lector de texto."));
    };
    document.head.appendChild(script);
  }).catch(err => { motor = null; throw err; });
  return motor;
}
async function trabajador(): Promise<TrabajadorOCR> {
  if (!lector) {
    lector = cargarMotor().then(m => m.createWorker("spa+eng",1))
      .catch(err => { lector = null; throw err; });
  }
  return lector;
}
function normal(t:string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'").toLowerCase().replace(/\s+/g," ").trim();
}
function limpia(t:string) {
  return t.replace(/[’‘]/g,"'").replace(/[|~^*_=]+/g," ")
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 &'°.,-]/g," ")
    .replace(/\s+/g," ").trim().slice(0,110);
}
const marcas = [
  { rx:/bath\s*(?:&|and|y)\s*body\s*works/i, nombre:"Bath & Body Works", categoria:"Belleza" },
  { rx:/victoria'?s?\s*secret/i, nombre:"Victoria's Secret", categoria:"Belleza" },
  { rx:/\bcrocs\b/i, nombre:"Crocs", categoria:"Calzado" },
  { rx:/\blattafa\b/i, nombre:"Lattafa", categoria:"Perfumes" },
  { rx:/\bperry\s+ellis\b/i, nombre:"Perry Ellis", categoria:"Perfumes" },
  { rx:/\bdermasil\b/i, nombre:"Dermasil", categoria:"Belleza" },
];
const frasesExcluidas = [
  /^judi\s*'?s?\s*shop\b/, /^bath\s*(?:&|and|y)\s*body\s*works\b/,
  /^victoria'?s?\s*secret$/, /^(?:crocs|dermasil|lattafa|perry ellis)$/,
  /^colec(?:cion|cion completa)\b/, /coleccion completa/, /disponible/,
  /p[ií]delo\s+por\s+mensaje/, /original/, /autentico/,
  /set ideal|dulce y deliciosa|para consentirte|hidrataci[oó]n|humectaci[oó]n/,
  /elegancia que enamora|lleva tu|accesorio perfecto|frescura y/,
  /brillo y aroma|toca las estrellas|piel seca/,
  /^mist\s*\+|body cream|body wash|perfume mist for body/,
  /fragrance mist|locion corporal|jab[oó]n espumoso|^crema corporal/,
  /\b\d+\s*(?:ml|oz|g|kg|fl)\b/, /^talla\s*\d+$/,
  /everyday luxuries|^fruit fusion$|^into the night set de/,
  /^un aroma|^tu aroma|^cuida tu|^aroma|^dise[nñ]o/,
  /\bshop\b|^belleza original|^nuevo|pocketbac con mucho estilo/
];
function valido(raw:string):boolean {
  const s=limpia(raw), n=normal(s);
  if((n.length<7 && n!=="yara") || n.length>65 || (/^\d/.test(n)&&!/^360\s/.test(n)))return false;
  const palabras=n.split(/\s+/);
  if(palabras.length>7 || (!palabras.some(w=>w.replace(/[^a-z]/g,"").length>=5) && n!=="yara"))return false;
  if(frasesExcluidas.some(rx=>rx.test(n)))return false;
  if(/[<>$@#]/.test(raw))return false;
  return true;
}
function lineaOCR(data:DatosOCR):Linea[] {
  if(data.lines?.length)return data.lines;
  const nested=(data.blocks||[]).flatMap(block=>(block.paragraphs||[]).flatMap(p=>p.lines||[]));
  if(nested.length)return nested;
  return data.text.split("\n").map(text=>({text}));
}
function titulo(texto:string):string {
  return limpia(texto).toLocaleLowerCase("es").split(" ").map(p=>{
    if(/^(?:de|la|el|con|y|the|of|for|para|and)$/.test(p))return p;
    return p?p[0].toLocaleUpperCase("es")+p.slice(1):"";
  }).join(" ").trim();
}
export function nombrePareceValido(t:string):boolean {return valido(t);}
function puntuar(l:Linea, alto:number):number {
  if(!valido(l.text))return -1e3;
  const n=normal(l.text),words=n.split(" ").length;
  const bbox=l.bbox;
  const h=bbox?bbox.y1-bbox.y0:0;
  const y=bbox?bbox.y0/Math.max(1,alto):.35;
  const confidence=l.confidence;
  if(typeof confidence==="number" && confidence<22)return -1e3;
  let puntos=10+Math.min(40,h/2);
  puntos+=(words>=2 && words<=4)?22:words===1?7:0;
  puntos+=Math.min(16,Math.max(0,n.length-6));
  if(y<.68)puntos+=12;else puntos-=12;
  if(typeof confidence==="number")puntos+=Math.max(-12,(confidence-55)/3);
  if(/pound cake|cherry blossom|cherry crush|berry bliss|baya clog|velvet petals|champagne toast/.test(n))puntos+=35;
  return puntos;
}
// Los pósteres tienen texto extra (marca, slogan, botón). Usa el tamaño,
// confianza y orden visual para distinguir el título comercial.
export function nombreEnTextoOCR(datos: DatosOCR, altoImagen:number):string {
  const lineas=lineaOCR(datos).map(l=>({...l,text:limpia(l.text)})).filter(l=>l.text);
  const opciones:{nombre:string;puntos:number}[]=[];
  for(const l of lineas)opciones.push({nombre:l.text,puntos:puntuar(l,altoImagen)});
  for(let i=0;i<lineas.length-1;i++){
    const a=lineas[i],b=lineas[i+1];
    const texto=a.text+" "+b.text;
    if(!valido(texto) || !valido(a.text) || !valido(b.text))continue;
    const h1=a.bbox?a.bbox.y1-a.bbox.y0:0,h2=b.bbox?b.bbox.y1-b.bbox.y0:0;
    if(a.bbox && b.bbox){
      const distancia=b.bbox.y0-a.bbox.y1;
      if(distancia < -12 || distancia > Math.max(10,h1,h2)*1.15)continue;
      if(h1>0&&h2>0&&(h1/h2>2 || h2/h1>2))continue;
    }else if(a.text.split(" ").length+b.text.split(" ").length>5)continue;
    opciones.push({nombre:texto,puntos:Math.max(puntuar(a,altoImagen),puntuar(b,altoImagen))+20});
  }
  opciones.sort((a,b)=>b.puntos-a.puntos);
  const mejor=opciones.find(o=>o.puntos>=51 && valido(o.nombre));
  return mejor?titulo(mejor.nombre):"";
}

async function recorteTitulo(archivo:File):Promise<Blob> {
  const url=URL.createObjectURL(archivo);
  try {
    const imagen=new Image();
    await new Promise<void>((ok,fail)=>{imagen.onload=()=>ok();imagen.onerror=()=>fail(new Error("Imagen no válida"));imagen.src=url;});
    const ancho=imagen.naturalWidth,alto=imagen.naturalHeight;
    // Los títulos ocupan la parte superior de los pósteres de la tienda.
    const origen=Math.round(alto*.045),altoRecorte=Math.round(alto*.43);
    const anchoFinal=Math.min(2000,Math.max(1350,ancho*1.5));
    const escala=anchoFinal/ancho;
    const canvas=document.createElement("canvas");
    canvas.width=Math.round(ancho*escala);canvas.height=Math.round(altoRecorte*escala);
    const context=canvas.getContext("2d");
    if(!context)throw new Error("No se pudo preparar la lectura");
    context.fillStyle="white";context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(imagen,0,origen,ancho,altoRecorte,0,0,canvas.width,canvas.height);
    return await new Promise<Blob>((ok,fail)=>canvas.toBlob(blob=>blob?ok(blob):fail(new Error("No se pudo crear el recorte")),"image/png"));
  } finally {URL.revokeObjectURL(url);}
}

export async function leerDatosDePoster(archivo:File):Promise<ProductoLeido> {
  const worker=await trabajador();
  const imagen=await recorteTitulo(archivo);
  const opciones={text:true,blocks:true,tsv:true};
  const resultado=await worker.recognize(imagen,{},opciones);
  const lineas=lineaOCR(resultado.data);
  const altura=Math.max(1,...lineas.map(l=>l.bbox?.y1??0));
  let nombre=nombreEnTextoOCR(resultado.data,altura);
  let texto=resultado.data.text;
  if(!nombre) {
    // Un segundo intento con la imagen completa solo si la primera lectura falla.
    const segundo=await worker.recognize(archivo,{},opciones);
    texto+=" "+segundo.data.text;
    nombre=nombreEnTextoOCR(segundo.data,Math.max(1,...lineaOCR(segundo.data).map(l=>l.bbox?.y1??0)));
  }
  const marca=marcas.find(m=>m.rx.test(texto));
  let categoria=marca?.categoria??"";
  if(!categoria && /\b(?:crema|locion|lotion|mist|body wash|body cream|jab[oó]n|soap|skincare|bruma)\b/i.test(texto))categoria="Belleza";
  if(!categoria && /\b(?:clog|tenis|sandalias|zapato|crocs)\b/i.test(texto))categoria="Calzado";
  if(!categoria && /\b(?:eau de parfum|eau de toilette|perfume)\b/i.test(texto))categoria="Perfumes";
  return {nombre,marca:marca?.nombre??"",categoria};
}
