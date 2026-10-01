"use client";

import { useEffect, useState } from "react";
import PromotionalPopUp from "./PromotionalPopUp";
import { obtenerProductos } from "../lib/productos-db";

const MIN_TIME_BETWEEN_POPUPS = 20 * 60 * 1000; // 20 minutos en milisegundos

export default function PromotionalPopUpWrapper() {
  const [showPopup, setShowPopup] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkShouldShowPopup = () => {
      const now = Date.now();
      const lastPopupTimestamp = localStorage.getItem('promotionalPopupLastTimestamp');

      // Si nunca se ha mostrado o han pasado 20 minutos desde la última vez
      if (!lastPopupTimestamp || (now - Number(lastPopupTimestamp)) >= MIN_TIME_BETWEEN_POPUPS) {
        loadPromotionalProducts();
      }
    };

    const loadPromotionalProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await obtenerProductos({ incluirSinStock: true });
        const promotionalProducts = allProducts.filter((p: any) => p.promocionar);

        if (promotionalProducts.length > 0) {
          setProducts(promotionalProducts);
          setShowPopup(true);
          // Guardar el timestamp actual cuando se muestra el popup
          localStorage.setItem('promotionalPopupLastTimestamp', String(Date.now()));
        }
      } catch (error) {
        console.error("Error cargando productos promocionales:", error);
      } finally {
        setLoading(false);
      }
    };

    // Usar requestIdleCallback para cargar los productos cuando el navegador esté inactivo
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        checkShouldShowPopup();
      }, { timeout: 2000 });
    } else {
      // Fallback para navegadores que no soportan requestIdleCallback
      setTimeout(() => {
        checkShouldShowPopup();
      }, 100);
    }
  }, []);

  if (loading || !showPopup || products.length === 0) {
    return null;
  }

  return (
    <PromotionalPopUp
      productos={products}
      onClose={() => setShowPopup(false)}
    />
  );
}
