"use client";

import React from "react";
import { TestimonialsSectionData } from "../../lib/productos-db";

interface TestimonialsSectionProps {
  data: TestimonialsSectionData;
}

export default function TestimonialsSection({ data }: TestimonialsSectionProps) {
  if (!data.enabled || !data.items || data.items.length === 0) {
    return null;
  }

  const items = data.items || [];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        {data.titulo && (
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {data.titulo}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full" />
          </div>
        )}

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Rating Stars */}
              {item.calificacion && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${
                        i < item.calificacion ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {item.descripcion && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 italic">
                  "{item.descripcion}"
                </p>
              )}

              {/* Author Info */}
              <div className="flex items-center gap-4">
                {item.imagen && (
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 p-0.5 flex-shrink-0">
                    <img
                      src={item.imagen}
                      alt={item.nombre || `Testimonio ${idx + 1}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                )}
                {item.nombre && (
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.nombre}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
