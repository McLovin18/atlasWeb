"use client";

import React from "react";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
  FieldPosition,
} from "../../lib/landing-types";

export type BannerSectionProps = {
  title?: string;
  subtitle?: string;
  subtitle2?: string;
  subtitle3?: string;
  backgroundImage?: string | null;
  image?: string | null; // compat legacy
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  fieldPositions?: Record<string, { desktop?: FieldPosition; mobile?: FieldPosition }>;
};

export default function BannerSection({
  title,
  subtitle,
  subtitle2,
  subtitle3,
  backgroundImage,
  image,
  styles,
  fieldStyles,
  fieldPositions,
}: BannerSectionProps) {
  const bg = styles?.backgroundColor;
  const color = styles?.textColor;
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "1rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "1rem" : "2rem");
  const borderRadius = styles?.borderRadius || "1rem";

  const finalBackgroundImage = backgroundImage || image || null;

  // ── Helper para obtener posicionamiento según device ────────────────────
  const getPositioningStyle = (fieldName: string, isDesktop: boolean): React.CSSProperties => {
    if (!fieldPositions?.[fieldName]) return {};
    
    const position = isDesktop 
      ? fieldPositions[fieldName].desktop 
      : fieldPositions[fieldName].mobile;
    
    if (!position) return {};
    
    return {
      ...(position.left !== undefined && { left: `${position.left}px` }),
      ...(position.top !== undefined && { top: `${position.top}px` }),
      ...(position.width !== undefined && { width: `${position.width}px` }),
      ...(position.height !== undefined && { height: `${position.height}px` }),
      ...(position.zIndex !== undefined && { zIndex: position.zIndex }),
    };
  };

  // ── Hook personalizado para detectar device (mobile/desktop) ──────────────
  const [isDesktop, setIsDesktop] = React.useState(true);
  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768); // md breakpoint
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <section
      style={{
        ...(bg ? { backgroundColor: bg } : { backgroundColor: "var(--bg)" }),
        ...(color ? { color } : {}),
        paddingTop,
        paddingBottom,
      }}
      className="py-20 overflow-hidden m-0"
    >
      <div
        className="overflow-hidden flex flex-col justify-center items-center"
        style={{ borderRadius, background: "var(--bgSecondary)" }}
      >
        {finalBackgroundImage && (
          <div className="w-full aspect-[7/3] min-h-[220px] relative">
            <img
              src={finalBackgroundImage}
              alt={title || "Banner"}
              width={1400}
              height={600}
              className="absolute inset-0 w-full h-full object-cover transition-none"
              draggable={false}
              decoding="async"
              loading="lazy" // <--- AÑADE ESTO
              style={{ display: 'block', borderRadius }}
            />
          </div>
        )}
        <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-center items-center px-6 py-6 md:px-10 md:py-8 max-w-3xl w-full h-full pointer-events-none">
          {title && (
            <h2
              className="section-title mb-1 drop-shadow-lg"
              style={{
                ...(fieldStyles?.title || {}),
                ...(typeof window !== 'undefined' && window.innerWidth < 640 ? (fieldStyles?.titleMobile || {}) : {}),
                ...getPositioningStyle("title", isDesktop),
                ...(fieldPositions?.title ? { position: "absolute" } : {}),
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="section-subtitle page-lead opacity-90 drop-shadow"
              style={{
                ...(fieldStyles?.subtitle || {}),
                ...(typeof window !== 'undefined' && window.innerWidth < 640 ? (fieldStyles?.subtitleMobile || {}) : {}),
                ...getPositioningStyle("subtitle", isDesktop),
                ...(fieldPositions?.subtitle ? { position: "absolute" } : {}),
              }}
            >
              {subtitle}
            </p>
          )}
          {subtitle2 && (
            <p
              className="section-subtitle page-lead opacity-90 drop-shadow"
              style={{
                ...(fieldStyles?.subtitle2 || {}),
                ...(typeof window !== 'undefined' && window.innerWidth < 640 ? (fieldStyles?.subtitle2Mobile || {}) : {}),
                ...getPositioningStyle("subtitle2", isDesktop),
                ...(fieldPositions?.subtitle2 ? { position: "absolute" } : {}),
              }}
            >
              {subtitle2}
            </p>
          )}
          {subtitle3 && (
            <p
              className="section-subtitle page-lead opacity-90 drop-shadow"
              style={{
                ...(fieldStyles?.subtitle3 || {}),
                ...(typeof window !== 'undefined' && window.innerWidth < 640 ? (fieldStyles?.subtitle3Mobile || {}) : {}),
                ...getPositioningStyle("subtitle3", isDesktop),
                ...(fieldPositions?.subtitle3 ? { position: "absolute" } : {}),
              }}
            >
              {subtitle3}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

