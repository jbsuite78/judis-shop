"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Inicio", icon: "⌂" },
  { href: "/catalogo", label: "Catálogo", icon: "▦" },
  { href: "/#categorias-movil", label: "Categorías", icon: "◈" },
  { href: "/carrito", label: "Carrito", icon: "🛒" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación de Judi's Shop"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-pink-100 bg-white/95 px-2 pt-2 shadow-[0_-8px_30px_rgba(69,18,61,0.09)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
    >
      {items.map((item) => {
        const active = item.href === "/"
          ? pathname === "/"
          : item.href === "/catalogo"
            ? pathname.startsWith("/catalogo") || pathname.startsWith("/producto")
            : item.href === "/carrito"
              ? pathname.startsWith("/carrito")
              : false;
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined}
            className={"flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold " +
              (active ? "bg-pink-50 text-pink-600" : "text-slate-500 hover:text-pink-600")}>
            <span aria-hidden="true" className="text-[24px] leading-6">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
