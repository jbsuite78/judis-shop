import Link from "next/link";

export default function HalloweenHero() {
  return (
    <section aria-label="Halloween Shopping en Judi's Shop" className="halloween-hero">
      <div className="halloween-hero-content">
        <p className="halloween-eyebrow">Judi&apos;s Shop · Halloween Shopping</p>
        <h1>¡Nos vamos de <em>shopping!</em></h1>
        <p className="halloween-date">McAllen · 17 y 18 de octubre</p>
        <p className="halloween-description">Mándanos tus pedidos desde ahora.<br />Compramos por encargo para ti.</p>
        <div className="halloween-actions">
          <a className="halloween-primary" href="https://wa.me/528181697776" target="_blank" rel="noopener noreferrer">Envía tu pedido ↗</a>
          <Link className="halloween-secondary" href="/catalogo">Ver catálogo →</Link>
        </div>
      </div>
    </section>
  );
}
