"use client";

import React, { useState } from "react";
import { OffersSectionData } from "../../lib/productos-db";

interface OffersSectionProps {
  data: OffersSectionData;
  basePrice: number;
  onOfferSelect: (cantidad: number, precioOferta: number) => void;
  selectedCantidad?: number;
}

export default function OffersSection({ data, basePrice, onOfferSelect, selectedCantidad }: OffersSectionProps) {
  if (!data.enabled || !data.ofertas || data.ofertas.length === 0) {
    return null;
  }

  const ofertas = data.ofertas || [];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        {data.titulo && (
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {data.titulo}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ofertas.map((oferta, idx) => {
            const isSelected = selectedCantidad === oferta.cantidad;
            const ahorro = basePrice * oferta.cantidad - oferta.precio;
            const ahorroPorcentaje = ((ahorro / (basePrice * oferta.cantidad)) * 100).toFixed(0);

            return (
              <button
                key={idx}
                onClick={() => onOfferSelect(oferta.cantidad, oferta.precio)}
                className={`relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 dark:bg-blue-600 text-white shadow-2xl"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-blue-300 dark:hover:border-blue-500 shadow-lg"
                }`}
              >
                {/* Popular Badge */}
                {idx === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    MÁS POPULAR
                  </div>
                )}

                {/* Quantity */}
                <div className="text-3xl sm:text-4xl font-bold mb-2">
                  {oferta.cantidad} {oferta.cantidad === 1 ? "unidad" : "unidades"}
                </div>

                {/* Price */}
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  ${oferta.precio.toFixed(2)}
                </div>

                {/* Original Price */}
                <div className={`text-sm line-through mb-2 ${
                  isSelected ? "text-white/70" : "text-slate-400 dark:text-slate-500"
                }`}>
                  ${(basePrice * oferta.cantidad).toFixed(2)}
                </div>

                {/* Savings */}
                {ahorro > 0 && (
                  <div className={`text-sm font-semibold ${
                    isSelected ? "text-white" : "text-green-600 dark:text-green-400"
                  }`}>
                    Ahorras ${ahorro.toFixed(2)} ({ahorroPorcentaje}% OFF)
                  </div>
                )}

                {/* Checkmark indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="material-icons-round text-blue-500 text-xl">check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
