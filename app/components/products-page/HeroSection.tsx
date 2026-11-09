"use client";

import React, { useState } from "react";
import { HeroSectionData } from "../../lib/productos-db";

interface HeroSectionProps {
  data: HeroSectionData;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const imagenes = data.imagenes || [];

  if (!data.enabled || imagenes.length === 0) {
    return null;
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % imagenes.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {imagenes.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentImage ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt={`Hero ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-2xl">
          {data.titulo && (
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {data.titulo}
            </h1>
          )}

          {data.subtitulo && (
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              {data.subtitulo}
            </p>
          )}

          {data.botonTexto && (
            <a
              href={data.botonLink || "#"}
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all hover:scale-105 shadow-2xl"
            >
              {data.botonTexto}
              <span className="material-icons-round">arrow_forward</span>
            </a>
          )}
        </div>
      </div>

      {/* Image Navigation Dots */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {imagenes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentImage ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Ir a imagen ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {imagenes.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all z-20"
            aria-label="Imagen anterior"
          >
            <span className="material-icons-round text-white">chevron_left</span>
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all z-20"
            aria-label="Siguiente imagen"
          >
            <span className="material-icons-round text-white">chevron_right</span>
          </button>
        </>
      )}
    </section>
  );
}
