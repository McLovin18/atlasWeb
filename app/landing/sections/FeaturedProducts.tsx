"use client";

import React, { useEffect, useState, useRef } from "react";
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
  loading?: boolean;
};

export default function FeaturedProductsSection({
  title = "Productos destacados",
  products = [],
  styles,
  fieldStyles,
  device,
  loading = false,
}: FeaturedProductsSectionProps) {
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "0.5rem");

  // ── Todos los hooks ANTES de cualquier return condicional ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (device === "mobile") {
      // show 2 on mobile if desired elsewhere; here keep 1 for compatibility
      setItemsPerView(1);
      return;
    }
    const updateItemsPerView = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 640) setItemsPerView(1);
      else if (width < 1024) setItemsPerView(3);
      else setItemsPerView(4);
    };
    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, [device]);

  // IntersectionObserver: track if section is visible in viewport so autoplay restarts when user returns
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setIsVisible(e.isIntersecting);
      },
      { threshold: 0.25 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [containerRef.current]);

  const effectiveItemsPerView = Math.min(itemsPerView, products.length);
  const hasCarousel = products.length > effectiveItemsPerView;

  useEffect(() => {
    if (!hasCarousel || isHovered || !isVisible) return;
    const id = setInterval(() => {
      setAnimDir("right");
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % products.length);
      setTimeout(() => setIsAnimating(false), 300);
    }, 4000);
    return () => clearInterval(id);
  }, [hasCarousel, isHovered, products.length]);

  // ── Return condicional DESPUÉS de todos los hooks ──
  if (loading) {
    // Mostrar skeleton mientras carga
    return (
      <section
        style={{ paddingTop, paddingBottom }}
        className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
      >
        {/* Título skeleton */}
        {title && (
          <div
            className="text-3xl text-center sm:text-2xl lg:text-4xl py-2 font-extrabold tracking-tight"
            style={{ height: "40px", width: "300px", margin: "0 auto" }}
          >
            <div
              className="animate-pulse rounded"
              style={{
                height: "100%",
                width: "100%",
                background: "var(--bgSecondary)"
              }}
            />
          </div>
        )}

        {/* Contenedor skeleton */}
        <div className="w-full max-w-7xl mx-auto relative px-2 sm:px-6 md:px-12">
          {/* Skeleton grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bgSecondary)" }}
              >
                <div
                  className="animate-pulse"
                  style={{
                    aspectRatio: "1",
                    background: "var(--bg)",
                    margin: "8px",
                    borderRadius: "16px"
                  }}
                />
                <div className="p-4 space-y-3">
                  <div
                    className="animate-pulse rounded"
                    style={{
                      height: "20px",
                      width: "80%",
                      background: "var(--bg)"
                    }}
                  />
                  <div
                    className="animate-pulse rounded"
                    style={{
                      height: "16px",
                      width: "60%",
                      background: "var(--bg)"
                    }}
                  />
                  <div
                    className="animate-pulse rounded"
                    style={{
                      height: "24px",
                      width: "40%",
                      background: "var(--bg)",
                      marginTop: "12px"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  const getVisibleProducts = () => {
    const count = hasCarousel ? effectiveItemsPerView : products.length;
    const slice: any[] = [];
    for (let i = 0; i < count; i++) {
      const idx = (currentIndex + i) % products.length;
      slice.push(products[idx]);
    }
    return slice;
  };

  const visibleProducts = getVisibleProducts();
  const isSingleVisible = effectiveItemsPerView === 1;

  const handlePrev = () => {
    if (!hasCarousel || isAnimating) return;
    setAnimDir("left");
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNext = () => {
    if (!hasCarousel || isAnimating) return;
    setAnimDir("right");
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Forzar 4 columnas en desktop para que solo se vean 4 productos por vista
  const gridCols =
    effectiveItemsPerView === 1
      ? "grid-cols-1"
      : effectiveItemsPerView === 2
      ? "grid-cols-2"
      : effectiveItemsPerView === 3
      ? "grid-cols-3"
      : "grid-cols-4";

  return (
    <section
      style={{ paddingTop, paddingBottom }}
      className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
    >
      {/* Título */}
      {title && (
        <h2
          className="text-3xl text-center sm:text-2xl lg:text-4xl py-2 font-extrabold tracking-tight"
          style={fieldStyles?.title || { color: "var(--text)" }}
        >
          {title}
        </h2>
      )}

      {/* Wrapper móvil con flechas ARRIBA */}
      <div className="w-full">
        {/* Contenedor carrusel - Responsive con flechas laterales centradas */}
        <div
          className="w-full max-w-7xl mx-auto relative px-2 sm:px-6 md:px-12"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Flecha izquierda - Móvil y Desktop */}
          {hasCarousel && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Anterior"
              className="absolute left-0 md:left-2 top-[35%] -translate-y-1/2 z-20 h-9 w-9 md:h-10 md:w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-md hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:border-purple-300 hover:scale-105 transition-all"
            >
              <span className="material-icons-round text-[18px] md:text-[20px]">chevron_left</span>
            </button>
          )}

          {/* Flecha derecha - Móvil y Desktop */}
          {hasCarousel && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente"
              className="absolute right-0 md:right-2 top-[35%] -translate-y-1/2 z-20 h-9 w-9 md:h-10 md:w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-md hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:border-purple-300 hover:scale-105 transition-all"
            >
              <span className="material-icons-round text-[18px] md:text-[20px]">chevron_right</span>
            </button>
          )}

          {/* Grid de productos - Full width en móvil */}
          <div
            className={
              isSingleVisible
                ? "flex justify-center w-full max-w-full mx-auto"
                : `grid w-full ${itemsPerView === 1 ? "place-items-center gap-2 md:gap-0" : "place-items-center gap-2 md:gap-6"} ${gridCols} md:auto-rows-[360px]`
            }
            style={{
              minWidth: 0,
              animation: isAnimating
                ? `slideIn${animDir === "right" ? "Right" : "Left"} 0.28s ease`
                : undefined,
            }}
          >
            {visibleProducts.map((prod: any, idx: number) => (
              <div
                key={`${prod.id}-${currentIndex}-${idx}`}
                className={`transition-all duration-300 flex flex-col items-stretch justify-stretch h-full ${
                  isSingleVisible ? "w-full px-2 md:px-0" : "w-full max-w-[320px]"
                }`}
                style={{ width: "100%", minWidth: 0 }}
              >
                <ProductoCard producto={prod} />
              </div>
            ))}
          </div>

          {/* Dots indicadores */}
          {hasCarousel && products.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-6">
              {Array.from({ length: products.length }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir a producto ${i + 1}`}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "w-6 h-2 bg-purple-600 dark:bg-purple-400"
                      : "w-2 h-2 bg-white dark:bg-slate-600 hover:bg-purple-300 dark:hover:bg-purple-600"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Botón Ver todos los productos */}
          <div className="flex justify-center mt-7 md:mt-8 w-full">
            <Link
              href="/productos"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700"
            >
              Ver todos los productos
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframes for slide animation */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
