import { isAdminMutation, unauthorizedResponse } from "@/lib/admin-auth";
import { CATEGORIAS_JUDIS } from "@/lib/carga-masiva-judis";

export const runtime = "nodejs";

const frases: Record<string, string> = {
  "Perfumes": "Una fragancia para complementar tu estilo y añadir un toque especial a tu día.",
  "Belleza": "Una opción para complementar tu rutina de belleza y cuidado personal.",
  "Calzado": "Una opción práctica para combinar con tus looks de todos los días.",
  "Bolsas y Carteras": "Un accesorio para complementar tus outfits con estilo.",
  "Accesorios": "Un detalle para complementar tus accesorios y darle personalidad a tu estilo.",
  "Ropa": "Una prenda para crear nuevas combinaciones y expresar tu estilo.",
  "Artículos para Caballero": "Una opción versátil para complementar el estilo personal.",
  "Hogar": "Un artículo para complementar los espacios y necesidades de tu hogar.",
  "Joyería, Bisutería y Relojes": "Un detalle para añadir un toque especial a tus combinaciones.",
  "Salud y Bienestar": "Un producto para complementar tu rutina de cuidado personal.",
  "Cómputo y Videojuegos": "Una opción para complementar tus accesorios de tecnología.",
  "Bebés": "Un artículo para complementar las necesidades del día a día.",
  "Juguetes": "Una opción para disfrutar momentos de juego y diversión.",
  "Deportes": "Un artículo para acompañarte en tus actividades deportivas.",
};

function textoAlternativo(nombre: string, marca: string, categoria: string) {
  const etiqueta = marca.toLocaleLowerCase("es") === "sin marca" || nombre.toLocaleLowerCase("es").includes(marca.toLocaleLowerCase("es"))
    ? nombre : nombre + " de " + marca;
  return "✨ " + etiqueta + ". " +
    (frases[categoria] ?? "Una opción para tus actividades de cada día.") +
    "\n🛍️ Disponible en Judi’s Shop.";
}

export async function POST(request: Request) {
  if (!isAdminMutation(request)) return unauthorizedResponse();
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ error: "Datos inválidos." }, { status: 400 });
    const datos = body as Record<string, unknown>;
    const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
    const marca = typeof datos.marca === "string" && datos.marca.trim() ? datos.marca.trim() : "Sin marca";
    const categoria = typeof datos.categoria === "string" ? datos.categoria.trim() : "";
    if (!nombre || nombre.length > 180 || marca.length > 100 ||
        (categoria && !CATEGORIAS_JUDIS.some(x => x === categoria))) {
      return Response.json({ error: "Escribe un nombre de producto válido para crear la descripción." }, { status: 400 });
    }
    const alternativa = textoAlternativo(nombre, marca, categoria);
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ descripcion: alternativa, origen: "plantilla" });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 13000);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: "Bearer " + process.env.OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.45,
          max_tokens: 190,
          messages: [
            {
              role: "system",
              content: "Eres redactor de catálogo para Judi's Shop en México. Escribe solamente una descripción comercial atractiva de 2 o 3 frases, máximo 350 caracteres, en español. Incluye uno o dos emojis de forma natural. Usa únicamente nombre, marca y categoría proporcionados. No inventes características físicas, aroma específico, materiales, tamaño, efectos, beneficios médicos, precio, certificaciones, disponibilidad ni autenticidad. Evita afirmaciones no verificadas. No devuelvas comillas ni introducciones.",
            },
            { role: "user", content: JSON.stringify({ nombre, marca, categoria: categoria || "No especificada" }) },
          ],
        }),
      });
      if (!response.ok) throw new Error("No disponible");
      const result = await response.json();
      const descripcion = String(result.choices?.[0]?.message?.content ?? "").trim();
      if (!descripcion || descripcion.length > 650) throw new Error("Respuesta inválida");
      return Response.json({ descripcion, origen: "ia" });
    } catch {
      return Response.json({ descripcion: alternativa, origen: "plantilla" });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return Response.json({ error: "No se pudo crear la descripción." }, { status: 400 });
  }
}
