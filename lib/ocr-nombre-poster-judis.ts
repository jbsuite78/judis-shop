/**
 * Lectura local del texto de pósteres. La fotografía no se envía a terceros:
 * únicamente se descarga el motor OCR y los idiomas al navegador.
 * Se utiliza cuando la identificación visual configurada no está disponible.
 * Todos los nombres detectados son sugerencias que requieren revisión.
 */
type Caja = { x0: number; x1: number; y0: number; y1: number };
type Linea = { text: string; confidence?: number; bbox?: Caja };
type SalidaOCR = { data: { text: string; lines?: Linea[] } };
type TrabajadorOCR = {
  recognize: (imagen: Blob) => Promise<SalidaOCR>;
  terminate: () => Promise<void>;
};
type MotorOCR = {
  createWorker: (lang: string, oem?: number) => Promise<TrabajadorOCR>;
};

const URL_LIBRERIA = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let motorPendiente: Promise<MotorOCR> | null = null;
let trabajadorPendiente: Promise<TrabajadorOCR> | null = null;

function cargarMotor(): Promise<MotorOCR> {
  if (motorPendiente) return motorPendiente;
  motorPendiente = new Promise<MotorOCR>((resolve, reject) => {
    const actual = (window as unknown as { Tesseract?: MotorOCR }).Tesseract;
    if (actual) { resolve(actual); return; }
    const script = document.createElement("script");
    script.src = URL_LIBRERIA;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    const limite = window.setTimeout(() => {
      script.remove();
      reject(new Error("El reconocimiento de texto tardó demasiado."));
    }, 25000);
    script.onload = () => {
      window.clearTimeout(limite);
      const cargado = (window as unknown as { Tesseract?: MotorOCR }).Tesseract;
      if (cargado) resolve(cargado);
      else reject(new Error("No se pudo cargar el lector de texto."));
    };
    script.onerror = () => {
      window.clearTimeout(limite);
      script.remove();
      reject(new Error("El lector de texto no está disponible en este momento."));
    };
    document.head.appendChild(script);
  }).catch(error => { motorPendiente = null; throw error; });
  return motorPendiente;
}

async function trabajador() {
  if (!trabajadorPendiente) {
    trabajadorPendiente = cargarMotor().then(motor => motor.createWorker("spa+eng", 1))
      .catch(error => { trabajadorPendiente = null; throw error; });
  }
  return trabajadorPendiente;
}

function normalizar(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}
function limpiarLinea(t: string) {
  return t.replace(/[|~^*_=]+/g, " ").replace(/[^\p{L}\p{N} &'°-]/gu, " ")
    .replace(/\s+/g, " ").trim().slice(0, 110);
}
const textoNoProducto = [
  /^judi'?s?\s*shop/, /bath\s*(?:&|and|y)\s*body\s*works/,
  /victoria'?s?\s*secret/, /^by\s+bath/, /p[ií]delo\s+por\s+mensaje/,
  /original(?:es)?$/, /^disponible$/, /disponible\s+en/,
  /www\.|\.com\b/, /c[oó]digo|promoci[oó]n/,
  /set ideal para/, /un aroma que/, /tu aroma favorito/,
  /hidrataci[oó]n|humectaci[oó]n|p[ií]el\s+suave/,
  /suavidad y|frescura y|brillo y aroma/,
  /fragrance mist for|body lotion$|crema corporal hidratante/,
  /\b\d+\s*(?:ml|mL|oz|g|kg|fl)\b/i,
  /^fragrance mist$/, /^fine fragrance mist$/, /^eau de toilette$/,
  /^original\s*100%/, /regalo|para tu d[ií]a/,
  /dise[nñ]o con|^aroma |^cuidado |^el accesorio/,
];
const colecciones = ["everyday luxuries", "fruit fusion", "victoria's secret", "bath & body works"];
const marcas = [
  { patron: /bath\s*(?:&|and|y)\s*body\s*works/i, nombre: "Bath & Body Works" },
  { patron: /victoria'?s?\s*secret/i, nombre: "Victoria's Secret" },
  { patron: /\bcrocs\b/i, nombre: "Crocs" },
  { patron: /\blattafa\b/i, nombre: "Lattafa" },
  { patron: /\bperry\s+ellis\b/i, nombre: "Perry Ellis" },
  { patron: /\bdermasil\b/i, nombre: "Dermasil" },
];

function rechazar(t: string) {
  const limpio = limpiarLinea(t);
  const norm = normalizar(limpio);
  if (!limpio || norm.length < 4 || norm.length > 74 || /^\d/.test(norm)) return true;
  if (/^(?:\d+|[a-z])$/.test(norm) || /(?:\$|#|@|https?:\/\/)/.test(t)) return true;
  if (textoNoProducto.some(r => r.test(norm))) return true;
  if (norm.split(" ").length > 9) return true;
  return /^[\d\s\W]+$/.test(norm);
}

function puntuar(linea: Linea, alto: number) {
  if (rechazar(linea.text)) return -100;
  const t = normalizar(linea.text);
  const palabras = t.split(" ").length;
  const h = linea.bbox ? linea.bbox.y1 - linea.bbox.y0 : 0;
  const y = linea.bbox ? linea.bbox.y0 / Math.max(1, alto) : .45;
  const tam = Math.min(33, h / 2);
  const confianza = Math.max(-12, Math.min(10, (linea.confidence ?? 60) / 6 - 7));
  let puntos = 15 + tam + confianza + (y < .52 ? 12 : y > .86 ? -35 : 0);
  if (palabras >= 2 && palabras <= 5) puntos += 12;
  if (palabras > 7) puntos -= 16;
  if (/\b(shampoo|serum|crocs|clog|crema|perfume|lotion|mist|bolsa|monedero|portagel|llavero|jabon)\b/.test(t)) puntos += 5;
  if (/^everyday luxuries$|^fruit fusion$/.test(t)) puntos -= 18;
  if (/(?:disponible|especial|perfecto|femenina|adorable|descubre|calidad|original)/.test(t)) puntos -= 28;
  return puntos;
}

function titular(texto: string) {
  const palabras = limpiarLinea(texto).toLocaleLowerCase("es").split(" ");
  return palabras.map(p => {
    if (/^(de|la|las|el|en|para|por|the|and|of|y|con|to)$/.test(p)) return p;
    return p ? p[0].toLocaleUpperCase("es") + p.slice(1) : "";
  }).join(" ").replace(/\bK\b/g, "K").trim();
}

export function nombreEnTextoOCR(datos: SalidaOCR["data"], altoImagen: number): string {
  const lineas = (datos.lines?.length ? datos.lines : datos.text.split("\n").map(text => ({ text })))
    .map(linea => ({ ...linea, text: limpiarLinea(linea.text) }))
    .filter(linea => linea.text);
  const candidatos = lineas.map((linea, idx) => ({ texto: linea.text, puntos: puntuar(linea, altoImagen), idx }));
  // Reconoce nombres grandes divididos en dos renglones: «Japanese / Cherry Blossom».
  for (let i = 0; i < lineas.length - 1; i++) {
    const uno = lineas[i], dos = lineas[i + 1];
    if (rechazar(uno.text) || rechazar(dos.text) || !uno.bbox || !dos.bbox) continue;
    const h1 = uno.bbox.y1 - uno.bbox.y0, h2 = dos.bbox.y1 - dos.bbox.y0;
    const separacion = dos.bbox.y0 - uno.bbox.y1;
    const pareja = uno.text + " " + dos.text;
    if (h1 > 8 && h2 > 8 && h2 / h1 > .53 && h2 / h1 < 1.85 &&
      separacion > -10 && separacion < Math.max(h1,h2)*1.05 &&
      pareja.length <= 65 && pareja.split(" ").length <= 8 && !rechazar(pareja)) {
      candidatos.push({texto: pareja,
        puntos: Math.max(puntuar(uno,altoImagen),puntuar(dos,altoImagen)) + 13,idx:i});
    }
  }
  candidatos.sort((a,b)=>b.puntos-a.puntos);
  const mejor = candidatos[0];
  if (!mejor || mejor.puntos < 37) return "";
  let nombre = titular(mejor.texto);
  const textoCompleto = lineas.map(l=>l.text).join(" ");
  const marca = marcas.find(m=>m.patron.test(textoCompleto));
  if (marca && !normalizar(nombre).includes(normalizar(marca.nombre))) {
    nombre = marca.nombre + " " + nombre;
  }
  // Añade colección únicamente si aparece literalmente en el póster y no forma ya parte del nombre.
  for (const coleccion of colecciones.slice(0,2)) {
    if (normalizar(textoCompleto).includes(coleccion) && !normalizar(nombre).includes(coleccion)) {
      const tieneVariante = /pink obsessed|all eyes on her|berry bliss|cherry crush/.test(normalizar(nombre));
      if (tieneVariante) nombre = (marca ? marca.nombre + " " : "") + titular(coleccion) + " " +
        (marca ? nombre.slice(marca.nombre.length + 1) : nombre);
      break;
    }
  }
  return nombre.replace(/\s+/g, " ").trim().slice(0, 140);
}

export async function leerNombreDePoster(archivo: File): Promise<string> {
  const worker = await trabajador();
  const resultado = await worker.recognize(archivo);
  // Las imágenes promocionales de Judi's Shop suelen ser verticales y el ancho puede variar.
  // La caja OCR utiliza las coordenadas reales, por lo que tomamos su altura máxima.
  const alto = Math.max(1, ...(resultado.data.lines ?? []).map(l => l.bbox?.y1 ?? 0));
  return nombreEnTextoOCR(resultado.data, alto);
}
