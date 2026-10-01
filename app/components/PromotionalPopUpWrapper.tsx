"use client";

import { useEffect, useState } from "react";
import PromotionalPopUp from "./PromotionalPopUp";
import { obtenerProductos } from "../lib/productos-db";

export default function PromotionalPopUpWrapper() {
  const [showPopup, setShowPopup] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFirstVisitOfDay = () => {
      const today = new Date().toDateString();
      const lastVisit = localStorage.getItem('promotionalPopupLastVisit');

      if (lastVisit !== today) {
        // Es primera visita del día, cargar productos promocionales
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
          localStorage.setItem('promotionalPopupLastVisit', today);
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
        checkFirstVisitOfDay();
      }, { timeout: 2000 });
    } else {
      // Fallback para navegadores que no soportan requestIdleCallback
      setTimeout(() => {
        checkFirstVisitOfDay();
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
