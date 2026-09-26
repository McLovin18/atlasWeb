"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
  VIPProductItem,
} from "../../lib/landing-types";
import { themeManager } from "../../components/themeManager";

export type VIPProductsSectionProps = {
  items?: VIPProductItem[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "mobile" | "desktop";
};

export default function VIPProductsSection({
  items = [],
  styles,
  fieldStyles,
  device,
}: VIPProductsSectionProps) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const checkTheme = () => setTheme(themeManager.getTheme());
    checkTheme();
    const handler = () => checkTheme();
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const isLight = theme === "light";
  const isMobile = device === "mobile" || (typeof window !== "undefined" && window.innerWidth < 768);

  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "3rem" : "5rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "3rem" : "5rem");

  if (!items.length) return null;

  return (
    <section
      style={{
        paddingTop,
        paddingBottom,
        background: "var(--bg)",
      }}
      className="w-full max-w-full px-4 md:px-8 flex flex-col items-center m-0 overflow-x-hidden"
    >
      <div className="w-full max-w-7xl mx-auto">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;
          const imageOnLeft = isMobile ? true : isEven;

          return (
            <div
              key={item.id || index}
              className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16 md:mb-24 last:mb-0"
              style={{
                flexDirection: isMobile ? "column" : (imageOnLeft ? "row" : "row-reverse"),
              }}
            >
              {/* Imagen */}
              {item.image && (
                <div className="w-full md:w-1/2 flex items-center justify-center">
                  <div
                    className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden"
                    style={{
                      background: isLight ? "#f1f5f9" : "#1a1a2e",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title || "Producto VIP"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Contenido */}
              <div className="w-full md:w-1/2 flex flex-col items-start gap-4 md:gap-6">
                {/* Badge */}
                {item.badge && (
                  <span
                    className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                    style={{
                      ...(fieldStyles?.badge || {}),
                      color: isLight ? "#0f172a" : "#ffffff",
                      backgroundColor: isLight ? "rgba(224, 161, 26, 0.15)" : "rgba(224, 161, 26, 0.2)",
                      borderColor: isLight ? "#e2e8f0" : "rgba(224, 161, 26, 0.3)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Título */}
                {item.title && (
                  <h2
                    className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                    style={{
                      ...(fieldStyles?.title || {}),
                      color: isLight ? "#0f172a" : "#ffffff",
                    }}
                  >
                    {item.title}
                  </h2>
                )}

                {/* Subtítulo/Descripción */}
                {item.subtitle && (
                  <p
                    className="text-base md:text-lg leading-relaxed"
                    style={{
                      ...(fieldStyles?.subtitle || {}),
                      color: isLight ? "#64748b" : "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    {item.subtitle}
                  </p>
                )}

                {/* Botón */}
                {item.buttonText && item.buttonLink && (
                  <Link
                    href={item.buttonLink}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-105"
                    style={{
                      ...(fieldStyles?.button || {}),
                      backgroundColor: "#E0A11A",
                      color: "#000000",
                    }}
                  >
                    {item.buttonText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
