/** Categorías vigentes de Judi's Shop. Sin categorías nuevas ni cambios al inventario. */
export const CATEGORIAS_JUDIS = [
  "Bolsas y Carteras", "Perfumes", "Calzado", "Belleza", "Salud y Bienestar",
  "Ropa", "Accesorios", "Artículos para Caballero",
  "Joyería, Bisutería y Relojes", "Hogar", "Cómputo y Videojuegos",
  "Bebés", "Juguetes", "Deportes", "Artículos de Temporada 📒🧛🏻‍♂️🎅🏼",
] as const;

export type CategoriaJudi = (typeof CATEGORIAS_JUDIS)[number];

function limpio(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}
export function sugerirCategoria(nombre: string): CategoriaJudi | "" {
  const t = limpio(nombre);
  if (/\b(crocs|clog|tenis|zapatos?|sandalias?|botas?|sneakers?|calzado|chanclas?)\b/.test(t)) return "Calzado";
  if (/\b(body mist|perfume mist|fine fragrance mist|bruma corporal|crema corporal)\b/.test(t)) return "Belleza";
  if (/\b(perfumes?|parfum|eau de toilette|eau de parfum|colonia|cologne)\b/.test(t)) return "Perfumes";
  if (/\b(crema|lotion|locion|mist|bruma|shimmer|body wash|jabon|soap|shampoo|skala|dermasil|exfoliante|serum|mascara|labial|maquillaje|gel antibacterial|pocketbac|bath body works)\b/.test(t)) return "Belleza";
  if (/\b(bolsa|bolso|cartera|wallet|backpack|mochila|tote|crossbody)\b/.test(t)) return "Bolsas y Carteras";
  if (/\b(collar|pulsera|aretes?|anillos?|reloj|watch|bisuteria)\b/.test(t)) return "Joyería, Bisutería y Relojes";
  if (/\b(llavero|porta gel|portagel|funda|lentes|gorra|sombrero|monedero)\b/.test(t)) return "Accesorios";
  if (/\b(vestido|blusa|pantalon|playera|camisa|falda|sueter|chamarra|ropa|shorts?)\b/.test(t)) return "Ropa";
  if (/\b(cobija|cocina|taza|vaso|termo|almohada|toalla|decoracion|hogar)\b/.test(t)) return "Hogar";
  if (/\b(mouse|teclado|audifonos|consola|videojuego|cargador|usb|laptop)\b/.test(t)) return "Cómputo y Videojuegos";
  if (/\b(juguete|muneca|peluche|rompecabezas|lego)\b/.test(t)) return "Juguetes";
  if (/\b(bebe|biberon|panal|sonaja)\b/.test(t)) return "Bebés";
  if (/\b(yoga|futbol|fitness|pesas|deportivo)\b/.test(t)) return "Deportes";
  if (/\b(vitamina|suplemento|bienestar)\b/.test(t)) return "Salud y Bienestar";
  return ""; // Sin evidencia no se adivina la categoría.
}
export function nombreDesdeArchivo(nombre: string) {
  const limpioNombre = nombre.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
    .replace(/^(img|dsc|photo|foto)\s*\d+$/i, "").trim();
  return limpioNombre && !/^\d+$/.test(limpioNombre) ? limpioNombre.slice(0, 100) : "";
}
