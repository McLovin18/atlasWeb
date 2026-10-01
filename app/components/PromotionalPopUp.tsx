"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import type { Producto } from "../lib/productos-db";

type PromocionalPopupProps = {
  productos: Producto[];
  onClose: () => void;
};

export default function PromocionalPopup({ productos, onClose }: PromocionalPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const pauseRef = useRef(false);
  const productosPromocionales = productos.filter(p => p.promocionar);

  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (productosPromocionales.length <= 1) return;

    console.log('Iniciando intervalo de 8 segundos');
    const interval = window.setInterval(() => {
      console.log('Ejecutando intervalo, pauseRef.current:', pauseRef.current);
      if (!pauseRef.current) {
        setCurrentIndex((prev) => (prev + 1) % productosPromocionales.length);
      }
    }, 8000);

    intervalRef.current = interval;

    return () => {
      console.log('Limpiando intervalo');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Sin dependencias para que solo se ejecute una vez

  const prevSlide = () => {
    pauseRef.current = true;
    setIsPaused(true);
    setCurrentIndex((prev) => (prev - 1 + productosPromocionales.length) % productosPromocionales.length);
    setTimeout(() => { pauseRef.current = false; setIsPaused(false); }, 8000);
  };

  const nextSlide = () => {
    pauseRef.current = true;
    setIsPaused(true);
    setCurrentIndex((prev) => (prev + 1) % productosPromocionales.length);
    setTimeout(() => { pauseRef.current = false; setIsPaused(false); }, 8000);
  };

  if (productosPromocionales.length === 0) return null;

  const currentProduct = productosPromocionales[currentIndex];
  const imagen = currentProduct.imagenes?.[0] || currentProduct.imagen || "/no-image.png";
  
  // Calcular precio con descuento promocional si existe
  const precioBase = Number(currentProduct.precio || 0);
  const descuentoBase = Number(currentProduct.descuento || 0);
  const descuentoPromocional = Number(currentProduct.promocionarDescuento || 0);
  const descuentoTotal = descuentoBase + descuentoPromocional;
  const precioFinal = descuentoTotal > 0 ? precioBase * (1 - descuentoTotal / 100) : precioBase;

  const tituloPromocional = currentProduct.promocionarTitulo || "¡OFERTA ESPECIAL!";
  const descripcionPromocional = currentProduct.promocionarDescripcion || "Aprovecha este descuento exclusivo";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-3">
      <div 
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto relative overflow-hidden"
        onMouseEnter={() => { pauseRef.current = true; setIsPaused(true); }}
        onMouseLeave={() => { pauseRef.current = false; setIsPaused(false); }}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-1.5 shadow-lg transition-all"
          aria-label="Cerrar popup"
        >
          <span className="material-icons-round text-xl">close</span>
        </button>

        {/* Indicadores de slide */}
        {productosPromocionales.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {productosPromocionales.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? "bg-black w-6" : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Contenido del slider */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px] md:min-h-[400px]">
          {/* Imagen */}
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-3 sm:p-4 md:p-6 min-h-[180px] md:min-h-auto">
            <img
              src={imagen}
              alt={currentProduct.nombre}
              className="max-w-full max-h-[180px] sm:max-h-[250px] md:max-h-[350px] object-contain rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg"
            />
            
            {/* Flechas de navegación */}
            {productosPromocionales.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-3 shadow-lg transition-all"
                  aria-label="Anterior"
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-3 shadow-lg transition-all"
                  aria-label="Siguiente"
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </>
            )}
          </div>

          {/* Información del producto */}
          <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-center bg-white">
            {/* Badge promocional */}
            <div className="inline-flex items-center gap-1.5 bg-black text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 self-start">
              <span className="material-icons-round text-sm sm:text-base">local_offer</span>
              {tituloPromocional}
            </div>

            {/* Nombre del producto */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
              {currentProduct.nombre}
            </h2>

            {/* Descripción promocional */}
            <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
              {descripcionPromocional}
            </p>

            {/* Precios */}
            <div className="mb-3 sm:mb-4">
              {descuentoTotal > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
                  <span className="text-base sm:text-lg md:text-xl text-gray-400 line-through">
                    ${precioBase.toFixed(2)}
                  </span>
                  <span className="bg-black text-white px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                    -{descuentoTotal}% OFF
                  </span>
                </div>
              )}
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
                ${precioFinal.toFixed(2)}
              </div>
            </div>

            {/* Información adicional del producto */}
            <div className="space-y-1.5 mb-3 sm:mb-4 text-[10px] sm:text-xs md:text-sm text-gray-500">
              {currentProduct.descripcion && (
                <p className="line-clamp-2">{currentProduct.descripcion}</p>
              )}
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-xs sm:text-sm">inventory_2</span>
                <span>Stock disponible</span>
              </div>
            </div>

            {/* Botón de acción */}
            <a
              href={`/product-detail?id=${currentProduct.id}`}
              className="inline-flex items-center justify-center gap-1.5 bg-black hover:bg-gray-800 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm md:text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={onClose}
            >
              <span>Ver detalle</span>
              <span className="material-icons-round text-xs sm:text-sm md:text-base">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}