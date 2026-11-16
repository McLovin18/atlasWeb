"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
  VIPProductItem,
} from "../../lib/landing-types";
import { themeManager } from "../../components/themeManager";

/**
 * Sección de testimonios (carrusel de una sola fila).
 *
 * Mapeo de campos de cada item (se reutiliza VIPProductItem, no cambia tu tipo):
 *  - subtitle   -> texto del testimonio
 *  - title      -> nombre del cliente
 *  - badge      -> etiqueta bajo el nombre (ej. "Cliente verificado", "Guayaquil")
 *  - image      -> foto/avatar del cliente
 *  - buttonText + buttonLink -> botón opcional al pie de la tarjeta
 */

export type VIPProductsSectionProps = {
  title?: string;
  items?: VIPProductItem[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "mobile" | "desktop";
};

const GOLD = "#E0A11A";
const DESKTOP_VISIBLE = 3;
const MOBILE_BREAKPOINT = 768;
const SWIPE_THRESHOLD = 50;

// Componente para mostrar estrellas de calificación
const StarRating = ({ rating }: { rating?: number }) => {
  const r = Math.max(1, Math.min(5, rating || 5));
  return (
    <div className="flex gap-0.5" aria-label={`Calificación de ${r} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill={star <= r ? GOLD : "none"}
          stroke={star <= r ? GOLD : "currentColor"}
          strokeWidth={star <= r ? 0 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
};

export default function VIPProductsSection({
  title,
  items = [],
  styles,
  fieldStyles,
  device,
}: VIPProductsSectionProps) {
  const [theme, setTheme] = useState("dark");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [index, setIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  // Tema
  useEffect(() => {
    const checkTheme = () => setTheme(themeManager.getTheme());
    checkTheme();
    window.addEventListener("theme-changed", checkTheme);
    return () => window.removeEventListener("theme-changed", checkTheme);
  }, []);

  // Viewport
  useEffect(() => {
    const onResize = () =>
      setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isLight = theme === "light";
  const isMobile = device === "mobile" || (device !== "desktop" && isMobileViewport);
  const perView = isMobile ? 1 : DESKTOP_VISIBLE;

  const total = items.length;
  const maxIndex = Math.max(0, total - perView);
  const canNavigate = total > perView;

  // Si cambia el layout, evita quedarse en una posición inválida
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(maxIndex, i + 1)),
    [maxIndex]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  if (!total) return null;

  const paddingTop = styles?.paddingTop || (isMobile ? "3rem" : "5rem");
  const paddingBottom = styles?.paddingBottom || (isMobile ? "3rem" : "5rem");

  const textStrong = isLight ? "#0f172a" : "#ffffff";
  const textSoft = isLight ? "#475569" : "rgba(255, 255, 255, 0.78)";
  const textMuted = isLight ? "#64748b" : "rgba(255, 255, 255, 0.55)";
  const cardBg = isLight ? "#ffffff" : "rgba(255, 255, 255, 0.04)";
  const cardBorder = isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.10)";
  const cardShadow = isLight
    ? "0 10px 30px -12px rgba(15, 23, 42, 0.18)"
    : "0 10px 30px -12px rgba(0, 0, 0, 0.6)";
  const arrowBg = isLight ? "#ffffff" : "rgba(255, 255, 255, 0.06)";
  const arrowBorder = isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.18)";

  const arrowStyle = (disabled: boolean): React.CSSProperties => ({
    backgroundColor: arrowBg,
    borderColor: arrowBorder,
    borderWidth: "1px",
    borderStyle: "solid",
    color: textStrong,
    opacity: disabled ? 0.35 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <section
      style={{ paddingTop, paddingBottom, background: "var(--bg)" }}
      className="w-full max-w-full px-4 md:px-8 flex flex-col items-center m-0 overflow-x-hidden"
    >
      <style>{`
        .vip-track { transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1); }
        .vip-arrow { transition: transform 200ms ease, border-color 200ms ease, background-color 200ms ease; }
        .vip-arrow:not(:disabled):hover { transform: scale(1.08); border-color: ${GOLD} !important; }
        .vip-arrow:focus-visible,
        .vip-dot:focus-visible,
        .vip-viewport:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .vip-track, .vip-arrow, .vip-dot { transition: none !important; }
        }
      `}</style>

      <div className="w-full max-w-7xl mx-auto">
        {title && (
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8 md:mb-14 text-center"
            style={{
              ...(fieldStyles?.title || {}),
              ...(isMobile ? fieldStyles?.titleMobile || {} : {}),
              color: textStrong,
            }}
          >
            {title}
          </h2>
        )}

        {/* Carrusel */}
        <div
          className="vip-viewport -mx-3 overflow-hidden py-3"
          style={{ touchAction: "pan-y" }}
          role="region"
          aria-roledescription="carrusel"
          aria-label={title || "Testimonios"}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointerStartX.current = null)}
        >
          <div
            className="vip-track flex items-stretch"
            style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
          >
            {items.map((item, i) => {
              const visible = i >= index && i < index + perView;

              return (
                <div
                  key={item.id || i}
                  className="px-3 box-border"
                  style={{ flex: `0 0 ${100 / perView}%`, maxWidth: `${100 / perView}%` }}
                  aria-hidden={!visible}
                  role="group"
                  aria-roledescription="testimonio"
                  aria-label={`${i + 1} de ${total}`}
                >
                  <article
                    className="relative h-full flex flex-col rounded-3xl p-6 md:p-8 overflow-hidden"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      borderWidth: "1px",
                      borderStyle: "solid",
                      boxShadow: cardShadow,
                    }}
                  >
                    {/* Acento superior */}
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{
                        background: `linear-gradient(90deg, ${GOLD}, rgba(224, 161, 26, 0))`,
                      }}
                    />

                    {/* Calificación con estrellas */}
                    <div className="mb-3">
                      <StarRating rating={item.rating} />
                    </div>

                    {/* Testimonio */}
                    {item.subtitle && (
                      <p
                        className="text-base md:text-[1.05rem] leading-relaxed flex-1 mt-2"
                        style={{
                          ...(fieldStyles?.subtitle || {}),
                          color: textSoft,
                        }}
                      >
                        {item.subtitle}
                      </p>
                    )}

                    {/* Autor */}
                    <div
                      className="flex items-center gap-4 mt-6 pt-6"
                      style={{
                        borderTopWidth: "1px",
                        borderTopStyle: "solid",
                        borderTopColor: cardBorder,
                      }}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title || "Cliente"}
                          draggable={false}
                          loading="lazy"
                          className="w-14 h-14 rounded-full object-cover shrink-0"
                          style={{
                            boxShadow: `0 0 0 2px ${isLight ? "#ffffff" : "#0b0b14"}, 0 0 0 4px ${GOLD}`,
                            backgroundColor: isLight ? "#f1f5f9" : "#1a1a2e",
                          }}
                        />
                      )}

                      <div className="min-w-0 flex flex-col gap-1">
                        {item.title && (
                          <h3
                            className="text-base md:text-lg font-bold leading-tight truncate"
                            style={{
                              ...(fieldStyles?.title || {}),
                              fontSize: undefined,
                              color: textStrong,
                            }}
                          >
                            {item.title}
                          </h3>
                        )}
                        {item.badge && (
                          <span
                            className="inline-block self-start px-3 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              ...(fieldStyles?.badge || {}),
                              color: isLight ? "#92400e" : GOLD,
                              backgroundColor: isLight
                                ? "rgba(224, 161, 26, 0.15)"
                                : "rgba(224, 161, 26, 0.12)",
                              borderColor: "rgba(224, 161, 26, 0.35)",
                              borderWidth: "1px",
                              borderStyle: "solid",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón opcional */}
                    {item.buttonText && item.buttonLink && (
                      <Link
                        href={item.buttonLink}
                        tabIndex={visible ? 0 : -1}
                        className="inline-flex items-center justify-center mt-5 px-6 py-3 rounded-xl font-semibold text-sm transition-transform duration-200 hover:scale-105"
                        style={{
                          ...(fieldStyles?.button || {}),
                          backgroundColor: GOLD,
                          color: "#000000",
                        }}
                      >
                        {item.buttonText}
                      </Link>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles: flechas + indicadores */}
        {canNavigate && (
          <div className="flex items-center justify-center gap-5 mt-8 md:mt-10">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              aria-label="Testimonio anterior"
              className="vip-arrow w-12 h-12 rounded-full flex items-center justify-center"
              style={arrowStyle(index === 0)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Posición del carrusel">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ir al testimonio ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="vip-dot h-2 rounded-full"
                  style={{
                    width: i === index ? "1.75rem" : "0.5rem",
                    backgroundColor: i === index ? GOLD : isLight ? "#cbd5e1" : "rgba(255,255,255,0.25)",
                    transition: "width 300ms ease, background-color 300ms ease",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={index === maxIndex}
              aria-label="Testimonio siguiente"
              className="vip-arrow w-12 h-12 rounded-full flex items-center justify-center"
              style={arrowStyle(index === maxIndex)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}