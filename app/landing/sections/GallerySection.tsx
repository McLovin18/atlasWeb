"use client";

import React, { useEffect, useState, useCallback } from "react";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";

export type GallerySectionProps = {
  title?: string;
  images?: string[];
  items?: { title?: string; image?: string }[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
};

// Cuántas columnas mostrar según breakpoint
function getColumns(width: number, total: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return Math.min(4, total); // máximo 4 en desktop
}

export default function GallerySection({
  title,
  images = [],
  items,
  styles,
  fieldStyles,
}: GallerySectionProps) {
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "1rem" : "3rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "1rem" : "3rem");

  const galleryItems = (
    items && items.length
      ? items
      : images.map((src) => ({ title: "", image: src }))
  ) as { title?: string; image?: string }[];

  // ── State ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cols, setCols] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  // ── Responsive columns ──
  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setCols(getColumns(window.innerWidth, galleryItems.length));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [galleryItems.length]);

  const effectiveCols = Math.min(cols, galleryItems.length);
  const needsCarousel = galleryItems.length > effectiveCols;
  const totalSlides = needsCarousel ? galleryItems.length : 1;

  // ── Autoplay ──
  useEffect(() => {
    if (!needsCarousel || isPaused) return;
    const id = setInterval(() => {
      setAnimDir("right");
      setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
    }, 3500);
    return () => clearInterval(id);
  }, [needsCarousel, galleryItems.length, isPaused]);

  // ── Navegación con animación ──
  const navigate = useCallback(
    (dir: "left" | "right") => {
      if (!needsCarousel || isAnimating) return;
      setAnimDir(dir);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
      setCurrentIndex((prev) =>
        dir === "right"
          ? (prev + 1) % galleryItems.length
          : (prev - 1 + galleryItems.length) % galleryItems.length
      );
    },
    [needsCarousel, isAnimating, galleryItems.length]
  );

  if (!galleryItems.length) return null;

  // ── Items visibles ──
  const visibleItems: typeof galleryItems = [];
  for (let i = 0; i < effectiveCols; i++) {
    visibleItems.push(galleryItems[(currentIndex + i) % galleryItems.length]);
  }

  const itemTitleStyle = fieldStyles?.itemTitle;

  return (
    <section
      style={{ paddingTop, paddingBottom, background: "var(--bg)" }}
      className="w-full py-3 flex flex-col items-center m-0"
    >
      {/* ── Título ── */}
      {title && (
        <div className="mb-6 text-center">
          <h2
            className="section-title"
            style={fieldStyles?.title || { color: "var(--text)" }}
          >
            {title}
          </h2>
          {/* Línea decorativa bajo el título */}

        </div>
      )}

      {/* ── Contenedor principal ── */}
      <div
        className="w-full max-w-7xl mx-auto relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Flecha izquierda */}
        {needsCarousel && (
          <button
            type="button"
            onClick={() => navigate("left")}
            aria-label="Anterior"
            className="
              absolute left-0 top-[35%] md:top-[40%] -translate-y-1/2 -translate-x-4 lg:-translate-x-6
              z-20 h-10 w-10 rounded-full flex items-center justify-center
              shadow-lg border transition-all duration-200
              hover:scale-110 active:scale-95
            "
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            <span className="material-icons-round" style={{ fontSize: 20 }}>chevron_left</span>
          </button>
        )}

        {/* Flecha derecha */}
        {needsCarousel && (
          <button
            type="button"
            onClick={() => navigate("right")}
            aria-label="Siguiente"
            className="
              absolute right-0 top-[35%] md:top-[40%] -translate-y-1/2 translate-x-4 lg:translate-x-6
              z-20 h-10 w-10 rounded-full flex items-center justify-center
              shadow-lg border transition-all duration-200
              hover:scale-110 active:scale-95
            "
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            <span className="material-icons-round" style={{ fontSize: 20 }}>chevron_right</span>
          </button>
        )}

        {/* ── Grid de cards ── */}
        <div
          className="grid gap-4 sm:gap-5 lg:gap-6 w-full"
          style={{
            gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`,
            // Animación de entrada según dirección
            animation: isAnimating
              ? `slideIn${animDir === "right" ? "Right" : "Left"} 0.28s ease`
              : undefined,
          }}
        >
          {visibleItems.map((item, idx) => (
            <GalleryCard
              key={`${currentIndex}-${idx}`}
              item={item}
              index={idx}
              titleStyle={itemTitleStyle}
            />
          ))}
        </div>

        {/* ── Dots ── */}
        {needsCarousel && totalSlides > 1 && (
          <div className="flex justify-center gap-2 mb-4 mt-7">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                aria-label={`Ir a slide ${i + 1}`}
                onClick={() => {
                  setAnimDir(i > currentIndex ? "right" : "left");
                  setCurrentIndex(i);
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  background:
                    i === currentIndex
                      ? "var(--accent, #AAA396)"
                      : "var(--border, #CEC1A8)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Keyframes de animación */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}

// ────────────────────────────────────────────────
// Card individual
// ────────────────────────────────────────────────
function GalleryCard({
  item,
  index,
  titleStyle,
}: {
  item: { title?: string; image?: string };
  index: number;
  titleStyle?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col items-center group cursor-pointer w-full max-w-full sm:max-w-[550px] lg:max-w-[550px] mx-auto"
      style={{
        // Entrada escalonada por índice
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen */}
      <div
        className="w-full relative overflow-hidden  transition-all duration-300"
        style={{
          aspectRatio: "1 / 1",
          background: "var(--card)",
          borderColor: hovered ? "var(--accent, #AAA396)" : "var(--border, #CEC1A8)",
          boxShadow: hovered
            ? "0 8px 32px 0 rgba(88,71,56,0.18)"
            : "0 1px 4px 0 rgba(88,71,56,0.08)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title || "Imagen"}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-500"
            style={{
              transform: hovered ? "scale(1.07)" : "scale(1)",
            }}
          />
        ) : (
          // Placeholder si no hay imagen
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="material-icons-round"
              style={{ fontSize: 40, color: "var(--border, #CEC1A8)" }}
            >
              image
            </span>
          </div>
        )}

        {/* Shimmer overlay en hover */}
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: hovered ? 1 : 0,
            background:
              "linear-gradient(135deg, rgba(241,234,218,0.18) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Título del item */}
      {item.title && (
        <p
          className="mt-3 text-center text-xs sm:text-sm font-semibold leading-tight transition-colors duration-200 px-1"
          style={{
            ...(titleStyle || {}),
            color: hovered ? "var(--accent, #AAA396)" : (titleStyle?.color || "var(--text, #584738)"),
          }}
        >
          {item.title}
        </p>
      )}
    </div>
  );
}