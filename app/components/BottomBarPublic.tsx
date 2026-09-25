"use client";
import React from "react";
import { useUser } from "../context/UserContext";

const publicItems = [
  { name: "Inicio", path: "/", icon: "home" },
  { name: "Productos", path: "/productos", icon: "store" },
  { name: "Carrito", path: "/cart", icon: "shopping_bag" },
  { name: "Buscar", path: "/search-results", icon: "search" },
];

export default function BottomBarPublic() {
  const { carrito } = useUser();
  const cartCount = carrito?.length ?? 0;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 w-full border-t flex z-50"
      style={{ background: "#000000", borderColor: "var(--border)" }}
    >
      <ul className="flex w-full justify-between items-center" style={{ color: "#ffffff" }}>
        {publicItems.map((item) => {
          const isCart = item.icon === "shopping_bag" || item.icon === "shopping_cart";
          const showBadge = isCart && cartCount > 0;

          return (
            <li key={item.path} className="flex-1">
              <a
                href={item.path}
                className="flex flex-col items-center py-2 px-2 transition-colors relative"
                style={{ color: "#ffffff" }}
              >
                {/* Ícono + badge */}
                <span className="relative inline-flex items-center justify-center">
                  <span className="material-icons-round text-lg">{item.icon}</span>

                  {showBadge && (
                    <span
                      className="absolute flex items-center justify-center font-bold"
                      style={{
                        // Posición: esquina superior derecha del ícono
                        top: "-6px",
                        right: "-8px",
                        // Tamaño mínimo para 1–2 dígitos, crece para 3+
                        minWidth: cartCount > 9 ? 18 : 16,
                        height: cartCount > 9 ? 18 : 16,
                        paddingLeft: cartCount > 9 ? 4 : 0,
                        paddingRight: cartCount > 9 ? 4 : 0,
                        fontSize: cartCount > 99 ? 8 : 10,
                        lineHeight: 1,
                        borderRadius: 999,
                        background: "var(--secondary)",
                        color: "var(--secondaryForeground)",
                        // Borde que separa del ícono
                        outline: "2px solid #000000",
                        // Pulso sutil cuando hay items
                        animation: "badgePop 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
                        zIndex: 10,
                      }}
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>

                <span className="text-xs font-medium mt-0">{item.name}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          70%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}