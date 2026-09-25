"use client";
import { useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { useEffect, useState, useMemo } from "react";
import type { Producto } from "../lib/productos-db";
import { obtenerProductos } from "../lib/productos-db";
import BottomBarPublic from "../components/BottomBarPublic";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
  productMatchesCategoria,
  productMatchesSubcategoria,
  productMatchesSubsubcategoria,
} from "../lib/categorias-db";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProductosPage() {
  const searchParams = useSearchParams();

  const categoria = (
    searchParams?.get("cat") ||
    searchParams?.get("category") ||
    ""
  ).trim();
  const subcategoria = (
    searchParams?.get("subcat") ||
    searchParams?.get("subcategory") ||
    searchParams?.get("sub") ||
    ""
  ).trim();
  const subsubcategoria = (
    searchParams?.get("subsubcat") ||
    searchParams?.get("subsubcategory") ||
    searchParams?.get("subsub") ||
    ""
  ).trim();

  const [currentPage, setCurrentPage] = useState(1);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const unsubscribe = onSnapshot(query(categoriasRef), (snapshot) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      try {
        const all = await obtenerProductos();
        let prods = all;

        // Solo aplicar filtros si se especifica una categoría
        if (categoria && categorias.length > 0) {
          prods = prods.filter((p) =>
            productMatchesCategoria(p, categoria, categorias)
          );
          if (subcategoria) {
            prods = prods.filter((p) =>
              productMatchesSubcategoria(
                p,
                categoria,
                subcategoria,
                categorias
              )
            );
          }
          if (subsubcategoria) {
            prods = prods.filter((p) =>
              productMatchesSubsubcategoria(
                p,
                categoria,
                subcategoria,
                subsubcategoria,
                categorias
              )
            );
          }
        } else if (categoria) {
          const needle = categoria.trim().toLowerCase();
          prods = all.filter(
            (p) =>
              String(p.categoria || "").trim().toLowerCase() === needle
          );
        }

        setProductos(prods);
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProductos();
  }, [categoria, subcategoria, subsubcategoria, categorias]);

  useEffect(() => {
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p: any) => {
        // Solo aplicar filtros si se especifica una categoría
        if (categoria && categorias.length > 0) {
          if (!productMatchesCategoria(p, categoria, categorias)) return false;
        } else if (categoria && !sameCategoryId(p.categoria, categoria)) {
          return false;
        }

        if (subcategoria && categorias.length > 0) {
          if (
            !productMatchesSubcategoria(
              p,
              categoria,
              subcategoria,
              categorias
            )
          ) {
            return false;
          }
        } else if (subcategoria && !sameCategoryId(p.subcategoria, subcategoria)) {
          return false;
        }

        if (subsubcategoria && categorias.length > 0) {
          if (
            !productMatchesSubsubcategoria(
              p,
              categoria,
              subcategoria,
              subsubcategoria,
              categorias
            )
          ) {
            return false;
          }
        } else if (
          subsubcategoria &&
          !sameCategoryId(p.subsubcategoria, subsubcategoria)
        ) {
          return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
      });
  }, [productos, categoria, subcategoria, subsubcategoria, categorias]);

  const getProductsPerPage = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 10;
      if (window.innerWidth >= 1024) return 12;
      if (window.innerWidth >= 768) return 9;
      if (window.innerWidth >= 640) return 6;
    }
    return 10;
  };
  const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());

  useEffect(() => {
    function handleResize() {
      setProductsPerPage(getProductsPerPage());
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
  const paginatedProducts = productosFiltrados.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [productosFiltrados.length, categoria, subcategoria, subsubcategoria]);

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">

        {loading ? (
  <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="rounded-xl overflow-hidden bg-white dark:bg-white/4 border border-slate-100 dark:border-white/10 shadow-sm animate-pulse">
        {/* Imagen placeholder */}
        <div className="w-full h-32 sm:h-48 bg-slate-200 dark:bg-white/10" />
        {/* Contenido placeholder */}
        <div className="p-1.5 sm:p-4 flex flex-col gap-2">
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
          <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/3 mt-1" />
        </div>
      </div>
    ))}
  </div>
  ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <span className="material-icons-round text-3xl text-slate-300 dark:text-white/20">
                local_florist
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-white/80">Sin resultados</p>
              <p className="text-sm text-slate-400 dark:text-white/30 mt-1 max-w-60">
                Por el momento no hay ramos disponibles.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 animate-in fade-in duration-700">
              {paginatedProducts.map((p: any, index: number) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  index={index}
                  showCart
                  showEye
                  showFav={isAuthenticated}
                  isCompact={false}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-8 select-none w-full">
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white border-slate-300 text-slate-900 hover:border-black/60 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${currentPage === n ? "bg-black border-black text-white shadow-sm" : "bg-white border-slate-300 text-slate-900 hover:border-black/60"}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white border-slate-300 text-slate-900 hover:border-black/60 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </main>
        {<BottomBarPublic />}
      
    </div>
  );
}