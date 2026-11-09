"use client";

import React from "react";
import { BenefitsSectionData } from "../../lib/productos-db";

interface BenefitsSectionProps {
  data: BenefitsSectionData;
}

export default function BenefitsSection({ data }: BenefitsSectionProps) {
  if (!data.enabled || !data.items || data.items.length === 0) {
    return null;
  }

  const items = data.items || [];

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Title */}
        {data.titulo && (
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {data.titulo}
            </h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full shadow-lg shadow-purple-500/30" />
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-slate-700"
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />

              {/* Icon/Image container */}
              {item.imagen ? (
                <div className="w-20 h-20 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 p-0.5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={item.imagen}
                    alt={item.titulo || `Beneficio ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-icons-round text-white text-4xl">star</span>
                </div>
              )}

              {/* Title */}
              {item.titulo && (
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                  {item.titulo}
                </h3>
              )}

              {/* Description */}
              {item.descripcion && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                  {item.descripcion}
                </p>
              )}

              {/* Decorative glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
