/**
 * Fotografías promocionales autorizadas para productos existentes de Judi's Shop.
 *
 * Únicamente cambia la foto principal presentada en el catálogo, nunca
 * nombre, descripción, categoría, precio, costo, existencias ni datos de compra.
 *
 * Las fotos originales permanecen en la base de datos para poder revertirlas.
 * Si el producto no coincide con una variante inequívoca, no se cambia.
 */
type ProductoConImagen = {
  id?: number;
  nombre: string;
  marca?: string | null;
  imagen?: string | null;
};

const fotos = {
  skalaBabosa: "https://static.metricool.com/planner/202610/7322149-file-17731786581353276702.png",
  dermasilScrub: "https://static.metricool.com/planner/202610/7322149-file-253740552878772035.png",
  strawberryPoundCake: "https://static.metricool.com/planner/202610/7322149-file-8950698130886880834.png",
  cozyVanillaAlmond: "https://static.metricool.com/planner/202610/7322149-file-18139247417502347596.png",
  costaRicaPinkPineapple: "https://static.metricool.com/planner/202610/7322149-file-639706872502854137.png",
  pinkSuperBerry: "https://static.metricool.com/planner/202610/7322149-file-1265246959963060339.png",
  skalaGrapeCrema: "https://static.metricool.com/planner/202610/7322149-file-16512492478406728299.png",
  skalaMaracujaKit: "https://static.metricool.com/planner/202610/7322149-file-15481122552991495016.png",
  skalaGrapeKit: "https://static.metricool.com/planner/202610/7322149-file-4941761766824811558.png",
  dermasilTonic: "https://static.metricool.com/planner/202610/7322149-file-14127246768407426775.png",
} as const;

// Nuevos pósters (9/oct/2026). Vincular por ID y por nombre evita
// reemplazar otra variante por accidente. Las imágenes originales no se borran.
const postersIndividuales: Record<number, { nombre: string; url: string }> = {
  136: { nombre: "Guess Seductive Red", url: "https://static.metricool.com/planner/202610/7322149-file-10236667208351142097.png" },
  158: { nombre: "Steve Madden Billfold Wallet", url: "https://static.metricool.com/planner/202610/7322149-file-16772486144027881581.png" },
  140: { nombre: "Cartera Steve Madden Passcase", url: "https://static.metricool.com/planner/202610/7322149-file-15837339901418004469.png" },
  110: { nombre: "Timberland Cartera Trifold", url: "https://static.metricool.com/planner/202610/7322149-file-8050970878241834590.png" },
  191: { nombre: "Cartera Steve Madden para dama", url: "https://static.metricool.com/planner/202610/7322149-file-17940626417091160405.png" },
  129: { nombre: "Fruit Fusion Watermelon Whirl", url: "https://static.metricool.com/planner/202610/7322149-file-17378242748663783680.png" },
};

function normal(texto?: string | null) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const tiene = (s: string, r: RegExp) => r.test(s);

export function posterParaProducto(producto: ProductoConImagen): string | null {
  const nombre = normal(producto.nombre);
  const porId = typeof producto.id === "number" ? postersIndividuales[producto.id] : undefined;
  if (porId && nombre.includes(normal(porId.nombre))) return porId.url;

  const texto = `${nombre} ${normal(producto.marca)}`;
  const kit = tiene(nombre, /\b(set|kit|combo|pack|paquete|trio)\b|\b3 (piezas|pzas|productos|pcs)\b/);
  const soloCrema = !tiene(nombre, /\b(shampoo|champu|acondicionador|conditioner)\b/);

  if (tiene(texto, /\bskala\b/)) {
    if (tiene(texto, /\b(maracuja|maracuya)\b/) && kit) return fotos.skalaMaracujaKit;
    if (tiene(texto, /\b(grape|uva)\b/) && kit) return fotos.skalaGrapeKit;
    if (!kit && soloCrema && tiene(texto, /\b(babosa|aloe vera)\b/)) return fotos.skalaBabosa;
    if (!kit && soloCrema && tiene(texto, /\b(grape|uva)\b/)) return fotos.skalaGrapeCrema;
  }

  if (tiene(texto, /\bdermasil\b/)) {
    if (tiene(nombre, /\b(aha|tonic|tonico|toning|glycolic|glicolico)\b/)) return fotos.dermasilTonic;
    if (tiene(nombre, /\b(exfoliating|exfoliante|exfoliador|scrub)\b/)) return fotos.dermasilScrub;
  }

  if (tiene(texto, /\bstrawberry pound cake\b/) &&
    tiene(nombre, /\b(body wash|gel de bano|gel corporal|jabon corporal)\b/)) {
    return fotos.strawberryPoundCake;
  }

  if (tiene(texto, /\bcozy vanilla almond\b/) &&
    tiene(nombre, /\b(jabon|soap|espumoso|foaming)\b/)) {
    return fotos.cozyVanillaAlmond;
  }

  if ((tiene(texto, /\bpink pineapple sunrise\b/) ||
      (tiene(texto, /\bcosta rica\b/) && tiene(texto, /\b(pina|pineapple)\b/))) &&
    tiene(nombre, /\b(body wash|gel de bano|gel corporal|jabon corporal)\b/)) {
    return fotos.costaRicaPinkPineapple;
  }

  if (tiene(texto, /\bsuper berry\b/) &&
    tiene(nombre, /\b(lotion|locion|crema corporal|body lotion)\b/)) {
    return fotos.pinkSuperBerry;
  }

  return null;
}

export function imagenVisibleProducto<T extends ProductoConImagen>(producto: T): T {
  const nuevaImagen = posterParaProducto(producto);
  return nuevaImagen ? { ...producto, imagen: nuevaImagen } : producto;
}
