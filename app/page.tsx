"use client";

import { useEffect, useMemo, useState, Suspense } from "react";

import BottomBarPublic from "./components/BottomBarPublic";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import { SectionRenderer } from "./landing/sectionRegistry";
import { getLandingPage } from "./lib/landing-db";
import { obtenerProductos } from "./lib/productos-db";
import type { LandingSection } from "./lib/landing-types";
import { useUser } from "./context/UserContext";

export default function Home() {
  const { isLogged } = useUser();
  const [landing, setLanding] = useState<{
    hero?: Record<string, any> | null;
    sections?: LandingSection[];
    featuredProducts?: string[];
  } | null>(null);
  const [featuredProductsResolved, setFeaturedProductsResolved] = useState<any[]>([]);
  const [loadingLanding, setLoadingLanding] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Cargar landing primero (rápido)
  useEffect(() => {
    let mounted = true;

    const loadLanding = async () => {
      try {
        const data = await getLandingPage();

        if (mounted) {
          setLanding(data);
          setLoadingLanding(false);
        }
      } catch (error) {
        console.error("Error cargando landing publicada:", error);
        if (mounted) {
          setLanding(null);
          setLoadingLanding(false);
        }
      }
    };

    loadLanding();

    return () => {
      mounted = false;
    };
  }, []);

  // Cargar productos en paralelo sin bloquear
  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        // Usar requestIdleCallback para cargar productos cuando el navegador esté inactivo
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(async () => {
            const products = await obtenerProductos({ incluirSinStock: true });

            // Get all products, sort by newest first, take top 40
            const recentProducts = (products || [])
              .filter((p: any) => p?.id)
              .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
              .slice(0, 40);

            if (mounted) {
              setFeaturedProductsResolved(recentProducts);
              setLoadingProducts(false);
            }
          }, { timeout: 1000 });
        } else {
          // Fallback para navegadores que no soportan requestIdleCallback
          setTimeout(async () => {
            const products = await obtenerProductos({ incluirSinStock: true });

            const recentProducts = (products || [])
              .filter((p: any) => p?.id)
              .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
              .slice(0, 40);

            if (mounted) {
              setFeaturedProductsResolved(recentProducts);
              setLoadingProducts(false);
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        if (mounted) {
          setFeaturedProductsResolved([]);
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);





  const landingSections = useMemo(() => {
    const sections = landing?.sections ?? [];
    const heroSection = landing?.hero
      ? [
          {
            id: "landing-hero",
            type: "hero",
            props: landing.hero,
            order: -1,
            hidden: false,
          } as LandingSection,
        ]
      : [];

    return [...heroSection, ...sections]
      .filter((section) => !section.hidden)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [landing]);

  const renderedSections = useMemo(() => {
    const featuredCategoryItemsFromProducts = featuredProductsResolved
      .map((product: any) => {
        const catId = String(product?.categoria || "").trim();
        if (!catId) return null;

        return {
          id: catId,
          title: catId,
          image: product?.imagenes?.[0] || product?.imagen || null,
          link: `/products-by-category?cat=${encodeURIComponent(catId)}`,
        };
      })
      .filter(Boolean)
      .filter(
        (item: any, index: number, arr: any[]) =>
          arr.findIndex((x: any) => x.id === item.id) === index
      );

    return landingSections.map((section) => {
      // Si los productos aún no están cargados, mostrar skeleton o sección vacía
      if (section.type === "featuredProducts") {
        if (loadingProducts) {
          // Mostrar skeleton mientras carga
          return {
            ...section,
            props: {
              ...(section.props || {}),
              products: [],
              loading: true,
            },
          } as LandingSection;
        }
        return {
          ...section,
          props: {
            ...(section.props || {}),
            products: featuredProductsResolved,
            loading: false,
          },
        } as LandingSection;
      }

      if (section.type === "featuredCategories") {
        const existingItems = Array.isArray((section.props as any)?.items)
          ? (section.props as any).items
          : [];

        const finalItems =
          existingItems.length > 0
            ? existingItems
            : (loadingProducts ? [] : featuredCategoryItemsFromProducts);

        return {
          ...section,
          props: {
            ...(section.props || {}),
            items: finalItems,
            loading: loadingProducts,
          },
        } as LandingSection;
      }

      return section;
    });
  }, [landingSections, featuredProductsResolved, loadingProducts]);


    // Detecta el índice del último hero
const lastHeroIndex = useMemo(() => {
  let last = -1;
  landingSections.forEach((s, i) => {
    if (s.type === "hero") last = i;
  });
  return last;
}, [landingSections]);

  return (
    <>
      <main className="min-h-screen w-full" style={{ background: "var(--bg)", color: "var(--text)" }}>
        {loadingLanding ? (
        <div
            className="w-full relative overflow-hidden"
            style={{ aspectRatio: "2400 / 1000", minHeight: "300px", background: "var(--bgSecondary)" }}
        >
            <div className="absolute inset-0" style={{ background: "var(--bg)" }} />
            <div
            className="absolute inset-0"
            style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(252, 211, 77, 0.1) 50%, transparent 100%)",
                animation: "shimmer 1.8s infinite",
                backgroundSize: "200% 100%",
            }}
            />
            <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            `}</style>
        </div>
        ) : renderedSections.length > 0 ? (
          <div className="flex flex-col">
            {renderedSections.map((section, index) => (
            <SectionRenderer
                key={section.id}
                section={section}
                isLastHero={section.type === "hero" && index === lastHeroIndex}
            />
            ))}
          </div>
        ) : (
          <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-slate-500">
            No hay secciones publicadas para mostrar.
          </div>
        )}
      </main>
      {!isLogged && <BottomBarPublic />}
    </>
  );
}
