"use client";

import React from "react";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
  FieldPosition,
} from "../../lib/landing-types";

export type TitleSubtitleSectionProps = {
  title?: string;
  subtitle?: string;
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  fieldPositions?: Record<string, { desktop?: FieldPosition; mobile?: FieldPosition }>;
};

export default function TitleSubtitleSection({
  title,
  subtitle,
  styles,
  fieldStyles,
  fieldPositions,
}: TitleSubtitleSectionProps) {
  const bg = styles?.backgroundColor;
  const color = styles?.textColor;
  const paddingTop = styles?.paddingTop || "2rem";
  const paddingBottom = styles?.paddingBottom || "2rem";
  const borderRadius = styles?.borderRadius || "0";
  const textAlign = styles?.textAlign || "center";

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

  const [isDesktop, setIsDesktop] = React.useState(true);
  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
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
      className="py-12"
    >
      <div
        className="max-w-4xl mx-auto px-4"
        style={{ borderRadius }}
      >
        {title && (
          <h2
            className="section-title mb-4"
            style={{
              ...(fieldStyles?.title || {}),
              ...(typeof window !== 'undefined' && window.innerWidth < 640 ? (fieldStyles?.titleMobile || {}) : {}),
              ...getPositioningStyle("title", isDesktop),
              ...(fieldPositions?.title ? { position: "absolute" } : {}),
              textAlign,
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className="section-subtitle"
            style={{
              ...(fieldStyles?.subtitle || {}),
              ...(typeof window !== 'undefined' && window.innerWidth < 640 ? (fieldStyles?.subtitleMobile || {}) : {}),
              ...getPositioningStyle("subtitle", isDesktop),
              ...(fieldPositions?.subtitle ? { position: "absolute" } : {}),
              textAlign,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}