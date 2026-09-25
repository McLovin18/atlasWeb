"use client";

import React from "react";
import Link from "next/link";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";
import ProductoCard from "../../components/ProductoCard";

export type FeaturedProductsSectionProps = {
  title?: string;
  products?: any[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "mobile" | "desktop";
};

const MAX_PRODUCTS = 40;

// Extrae la fecha de creación de un producto en milisegundos,
// soportando Firestore Timestamp, Date, string ISO o number.
function getCreatedAtMillis(prod: any): number {
  const raw = prod?.createdAt ?? prod?.fechaCreacion ?? prod?.created_at ?? prod?.creadoEn;

  if (!raw) return 0;

  // Firestore Timestamp (tiene .seconds) o { _seconds }
  if (typeof raw === "object") {
    if (typeof raw.toMillis === "function") return raw.toMillis();
    if (typeof raw.seconds === "number") return raw.seconds * 1000;
    if (typeof raw._seconds === "number") return raw._seconds * 1000;
  }

  // Date, string ISO o number (epoch)
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function FeaturedProductsSection({
  title = "Productos recientes",
  products = [],
  styles,
  fieldStyles,
}: FeaturedProductsSectionProps) {
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "0.5rem");

  // Filtra productos válidos, ordena por fecha de creación (más nuevo primero) y limita a MAX_PRODUCTS
  const recentProducts = React.useMemo(() => {
    return products
      .filter((prod: any) => prod && prod.id)
      .sort((a: any, b: any) => getCreatedAtMillis(b) - getCreatedAtMillis(a))
      .slice(0, MAX_PRODUCTS);
  }, [products]);

  // ── Return condicional DESPUÉS de todos los hooks ──
  if (!recentProducts.length) return null;

  return (
    <section
      style={{ paddingTop, paddingBottom }}
      className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
    >
      {/* Título */}
      {title && (
        <h2
          className="section-title text-center py-2"
          style={fieldStyles?.title || { color: "var(--text)" }}
        >
          {title}
        </h2>
      )}

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-12">
        {/* ── Grid: 1 columna en móvil, 3 desde sm ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {recentProducts.map((prod: any, idx: number) => (
            <div
              key={prod.id}
              className="transition-all duration-300 flex flex-col items-stretch justify-stretch h-full"
            >
              <ProductoCard producto={prod} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}