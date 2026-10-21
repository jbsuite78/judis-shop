"use client";

import Link from "next/link";
import type { PointerEvent } from "react";

type Props = { mode: "desktop" | "mobile" };

export default function ImmersiveHero({ mode }: Props) {
  function moveScene(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 11;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * -9;
    event.currentTarget.style.setProperty("--judis-ry", horizontal.toFixed(2) + "deg");
    event.currentTarget.style.setProperty("--judis-rx", vertical.toFixed(2) + "deg");
  }

  function resetScene(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--judis-ry", "0deg");
    event.currentTarget.style.setProperty("--judis-rx", "0deg");
  }

  return (
    <section
      aria-label="Bienvenida a la experiencia de Judi's Shop"
      className={"judis-immersive judis-immersive--" + mode}
      onPointerMove={moveScene}
      onPointerLeave={resetScene}
    >
      <div className="judis-immersive-grain" aria-hidden="true" />
      <div className="judis-immersive-glow" aria-hidden="true" />
      <div className="judis-immersive-copy">
        <span className="judis-immersive-eyebrow"><span aria-hidden="true">✦</span> JUDI&apos;S SHOP · ESTILO SIN LÍMITES</span>
        <h1>Tu estilo, <span>en otra dimensión.</span></h1>
        <p>Descubre piezas que enamoran: belleza, moda, perfumes y tus marcas favoritas seleccionadas en Estados Unidos.</p>
        <div className="judis-immersive-actions">
          <Link href="/catalogo" className="judis-immersive-primary">
            Explorar la tienda <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/#categorias" className="judis-immersive-secondary judis-immersive-secondary-desktop">
            Ver categorías <span aria-hidden="true">→</span>
          </Link>
          <Link href="/#categorias-movil" className="judis-immersive-secondary judis-immersive-secondary-mobile">
            Ver categorías <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="judis-immersive-footnote"><span aria-hidden="true">✧</span> Originales de USA <span aria-hidden="true">·</span> Entregas en Monterrey</div>
      </div>
      <div className="judis-3d-stage" aria-hidden="true">
        <div className="judis-3d-world">
          <div className="judis-3d-halo judis-3d-halo-one" />
          <div className="judis-3d-halo judis-3d-halo-two" />
          <div className="judis-3d-backplate" />
          <div className="judis-3d-brand-card">
            <div className="judis-3d-brand-top"><span>JUDI&apos;S</span><span>✦</span></div>
            <div className="judis-3d-photo"><img src="/marcas-judis.jpeg" alt="" draggable={false} /></div>
            <div className="judis-3d-brand-bottom"><span>THE STYLE EDIT</span><span>USA · MX</span></div>
          </div>
          <div className="judis-3d-float judis-3d-float-top"><span className="judis-3d-float-star">✦</span><span>NUEVA<br/>COLECCIÓN</span></div>
          <div className="judis-3d-float judis-3d-float-bottom"><span aria-hidden="true">♡</span> Especial para ti</div>
          <div className="judis-3d-spark judis-3d-spark-one">✧</div>
          <div className="judis-3d-spark judis-3d-spark-two">✦</div>
        </div>
      </div>
      <div className="judis-immersive-index" aria-hidden="true">01 / JUDI&apos;S COLLECTION</div>
    </section>
  );
}
