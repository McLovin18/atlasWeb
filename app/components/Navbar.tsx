"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import InfoSlider from "./InfoSlider";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
} from "../lib/categorias-db";
import { obtenerProductos } from "../lib/productos-db";
import { useUser } from "../context/UserContext";
import { productMatches } from "../lib/search-utils";

// ─────────────────────────────────────────────
// Acordeón de categorías para el drawer móvil
// ─────────────────────────────────────────────
function MobileCategoriesAccordion({ basePath }: { basePath: string }) {
  const [categorias, setCategorias] = React.useState<any[]>([]);
  const [openCat, setOpenCat] = React.useState<string | null>(null);
  const [openSub, setOpenSub] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "categorias"), (snap) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snap.docs)));
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col gap-1 my-3">
      <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1"
        style={{ color: "rgba(255,255,255,0.7)" }}>
        Categorías
      </p>
      {categorias.map((cat) => (
        <div key={cat.id}>
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "#ffffff" }}
            onClick={() =>
              setOpenCat(openCat === cat.id ? null : cat.id)
            }
          >
            <span className="flex items-center gap-2">
              {cat.icono && (
                <span className="material-icons-round text-base"
                  style={{ color: "#E0A11A" }}>
                  {cat.icono}
                </span>
              )}
              {cat.nombre}
            </span>
            {cat.subcategorias?.length > 0 && (
              <span
                className="material-icons-round text-sm transition-transform duration-200"
                style={{
                  color: "#ffffff",
                  transform: openCat === cat.id ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                arrow_drop_down
              </span>
            )}
          </button>

          {cat.subcategorias?.length > 0 && openCat === cat.id && (
            <div className="ml-4 mb-1 rounded-xl overflow-hidden border"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}>
              {cat.subcategorias.map((sub: any) => (
                <div key={sub.id}>
                  {sub.subcategorias?.length > 0 ? (
                    <>
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 text-sm transition-shadow hover:shadow-sm rounded-md"
                        style={{ color: "#ffffff" }}
                        onClick={() =>
                          setOpenSub(openSub === sub.id ? null : sub.id)
                        }
                      >
                        <span>{sub.nombre}</span>
                        <span
                          className="material-icons-round text-sm transition-transform duration-200"
                          style={{
                            color: "#ffffff",
                            transform:
                              openSub === sub.id
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                          }}
                        >
                          arrow_drop_down
                        </span>
                      </button>
                      {openSub === sub.id && (
                        <div className="ml-3 border-l"
                          style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                          {sub.subcategorias.map((subsub: any) => (
                            <a
                              key={subsub.id}
                              href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
                              className="block px-4 py-2 text-xs transition-colors"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              {subsub.nombre}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
                      className="block px-3 py-2 text-sm transition-shadow hover:shadow-sm rounded-md"
                      style={{ color: "#ffffff" }}
                    >
                      {sub.nombre}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {!cat.subcategorias?.length && openCat === cat.id && (
            <a
              href={`${basePath}?cat=${cat.id}`}
              className="block px-3 py-2 text-sm"
              style={{ color: "#ffffff" }}
            >
              {cat.nombre}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Navbar principal
// ─────────────────────────────────────────────
export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null); // Para dropdown nivel 1 en tablet/desktop
  const [openSubId, setOpenSubId] = useState<string | null>(null); // Para dropdown nivel 2 en tablet/desktop
  const { user, carrito } = useUser();
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  

  // Barra de búsqueda
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Categorías integradas
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    obtenerProductos().then((prods) => setAllProducts(prods));
  }, []);

  // Escuchar categorías desde Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categorias"), (snap) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snap.docs)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Close search when clicking outside the search container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Escuchar evento para activar el buscador desde home
  useEffect(() => {
    const handleActivateSearch = () => {
      setSearchOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    };
    window.addEventListener("activateNavbarSearch", handleActivateSearch);
    return () => window.removeEventListener("activateNavbarSearch", handleActivateSearch);
  }, [windowWidth]);

  // Sugerencias de búsqueda
  useEffect(() => {
    if (!searchValue.trim()) { setSuggestions([]); return; }
    setSearchLoading(true);
    const filtered = allProducts.filter((p) => productMatches(p, searchValue));
    setSuggestions(filtered.slice(0, 6));
    setSearchLoading(false);
  }, [searchValue, allProducts]);

  if (!mounted) return null;

  const isAdmin = user?.role === "admin";
  const basePath = isAdmin
    ? "/admin/products-by-category"
    : "/products-by-category";

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/productos", label: "Ver Catalogo" },
    { href: "/blogs", label: "Blogs" },
  ];

  const infoSliderItems = [
    { text: "¡Haz clic y obtén 15% de descuento en prendas seleccionadas! →", href: "https://marca-estilo-41im.vercel.app/ofertas" },
    "🚛 Envíos a todo el Ecuador incluyendo las Islas Galápagos",
  ];

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    let target = `/search-results?query=${encodeURIComponent(searchValue.trim())}`;
    if (isAdmin) target = `/admin/search-results?query=${encodeURIComponent(searchValue.trim())}`;
    window.location.href = target;
    setSearchValue("");
    setSuggestions([]);
  };

  return (
    <>
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        className="sticky top-0 z-40 border-b py-3 shadow-sm backdrop-blur-md"
        style={{ background: "#111827", backgroundColor: "black", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* ── Header principal ── */}
        <div
          className="relative flex items-center justify-between gap-4 px-4 py-2 lg:px-6 lg:py-2"
          style={{ color: "#ffffff" }}
        >
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="lg:hidden p-2 rounded-xl transition-colors text-white hover:bg-white/10"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <span className="material-icons-round text-2xl">menu</span>
            </button>

            <div className="hidden lg:flex items-center">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:bg-white/10 whitespace-nowrap text-body"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Brand: absolutely centered horizontally */}
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex items-center pointer-events-none">
            <a
              href={user ? "/admin" : "/"}
              className="flex items-center gap-2 shrink-0 text-white pointer-events-auto"
            >
              <span className="font-heading font-bold tracking-tight whitespace-nowrap text-3xl sm:text-4xl">
                ATLAS
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="relative" ref={searchContainerRef}>
              {!searchOpen ? (
                <button
                  type="button"
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white transition-colors hover:bg-white/10"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Buscar"
                >
                  <span className="material-icons-round text-2xl">search</span>
                </button>
              ) : (
                // Wrapper centrado verticalmente: SOLO contiene el buscador (altura fija).
                // Las sugerencias van fuera de este cálculo de altura, ancladas por top-full,
                // así el buscador nunca se mueve al aparecer/desaparecer resultados.
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[min(75vw,300px)] md:w-[min(92vw,420px)]">
                  <form
                    className="rounded-2xl border shadow-2xl z-50 overflow-hidden text-body"
                    style={{ background: "#ffffff", borderColor: "rgba(17,24,39,0.12)" }}
                    onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ background: "#f8fafc" }}
                    >
                      <span className="material-icons-round text-lg" style={{ color: "#64748b" }}>
                        search
                      </span>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar un producto..."
                        className="bg-transparent outline-none text-sm flex-1 text-body"
                        style={{ color: "#0f172a", minWidth: 140 }}
                        autoComplete="off"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchValue("");
                          setSuggestions([]);
                          setSearchOpen(false);
                        }}
                        className="rounded-full p-1 transition-colors"
                        style={{ color: "#64748b" }}
                        aria-label="Cerrar búsqueda"
                      >
                        <span className="material-icons-round text-base">close</span>
                      </button>
                    </div>
                  </form>

                  {/* Sugerencias: posicionadas fuera del form, ancladas debajo del buscador. 
                      No afecta el centrado vertical del wrapper padre porque es position:absolute. */}
                  {searchValue.trim() && (
                    <div
                      className="absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-2xl overflow-hidden text-body max-h-75 overflow-y-auto"
                      style={{ background: "#ffffff", borderColor: "rgba(17,24,39,0.12)" }}
                    >
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm" style={{ color: "#64748b" }}>
                          Buscando...
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((prod) => {
                          let href = `/product-detail/${String(prod.nombre || prod.id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
                          if (isAdmin) href = `/admin/product-detail?id=${prod.id}`;
                          return (
                            <a
                              key={prod.id}
                              href={href}
                              className="flex items-center gap-3 px-4 py-2.5 transition-colors text-sm hover:bg-slate-50 text-body"
                              style={{ color: "#0f172a" }}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchValue("");
                              }}
                            >
                              {prod.imagen && (
                                <img
                                  src={prod.imagen}
                                  alt={prod.nombre}
                                  className="w-8 h-8 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <span className="truncate flex-1">{prod.nombre}</span>
                              {prod.marca && (
                                <span className="text-xs shrink-0" style={{ color: "#64748b" }}>
                                  {prod.marca}
                                </span>
                              )}
                            </a>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-sm" style={{ color: "#64748b" }}>
                          Sin resultados
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative flex flex-col items-center">
              <a
                href={user ? "/admin/cart" : "/cart"}
                className="flex items-center justify-center px-1 rounded-xl transition-colors text-white hover:bg-white/10"
                aria-label="Carrito"
                data-onboarding="carrito"
              >
                <span className="material-icons-round text-xl">shopping_cart</span>
                {carrito && carrito.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#111827] z-10">
                    {carrito.length}
                  </span>
                )}
              </a>
            </div>

            {user ? (
              <div className="relative">
                <button
                  className="rounded-full transition-opacity hover:opacity-80"
                  onClick={() => setUserMenu(!userMenu)}
                  title="Opciones de usuario"
                  data-onboarding="usuario"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Foto de perfil"
                      className="w-9 h-9 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <span className="material-icons-round text-3xl text-white">
                      account_circle
                    </span>
                  )}
                </button>

                {userMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl overflow-hidden z-50"
                    style={{ background: "#ffffff", borderColor: "rgba(17,24,39,0.12)" }}
                  >
                    <a
                      href="/admin/perfil"
                      className="flex items-center gap-2 px-4 py-3 text-sm transition-colors text-slate-900 hover:bg-slate-50 text-body"
                    >
                      <span className="material-icons-round text-base">person_outline</span>
                      Perfil
                    </a>
                    <a
                      href="/admin/config"
                      className="flex items-center gap-2 px-4 py-3 text-sm transition-colors text-slate-900 hover:bg-slate-50 text-body"
                    >
                      <span className="material-icons-round text-base">tune</span>
                      Configuración
                    </a>
                    <div className="border-t" style={{ borderColor: "rgba(17,24,39,0.12)" }} />
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-red-500 font-medium transition-colors hover:bg-slate-50 text-body"
                      onClick={async () => {
                        const { logoutUser } = await import("../lib/firebase-auth");
                        await logoutUser();
                        try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
                        window.location.href = "/";
                      }}
                    >
                      <span className="material-icons-round text-base">logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

            ) : null}

            
          </div>
        </div>

        <div className="hidden items-center justify-center gap-1 px-6 border-t flex-wrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Categorías dinámicas */}
          {/* Categorías dinámicas */}
          {categorias.map((cat) => (
            <div 
              key={cat.id} 
              className="relative group shrink-0"
              onMouseEnter={() => windowWidth !== null && windowWidth >= 1024 && setOpenCatId(cat.id)}
              onMouseLeave={() => windowWidth !== null && windowWidth >= 1024 && setOpenCatId(null)}
            >
              {cat.subcategorias?.length > 0 ? (
                <button
                  onClick={() => setOpenCatId(openCatId === cat.id ? null : cat.id)}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm text-black dark:text-white"
                >
                  {cat.icono && (
                    <span className="material-icons-round dark:text-white" style={{ fontSize: 15 }}>{cat.icono}</span>
                  )}
                  <span className="dark:text-white">{cat.nombre}</span>
                  <span
                    className="material-icons-round dark:text-white transition-transform duration-200"
                    style={{ fontSize: 14, transform: openCatId === cat.id ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    arrow_drop_down
                  </span>
                </button>
              ) : (
                <Link
                  href={`${basePath}?cat=${cat.id}`}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm text-black dark:text-white"
                >
                  {cat.icono && (
                    <span className="material-icons-round dark:text-white" style={{ fontSize: 15 }}>{cat.icono}</span>
                  )}
                  <span className="dark:text-white">{cat.nombre}</span>
                </Link>
              )}

              {/* Dropdown nivel 1 */}
              {cat.subcategorias?.length > 0 && (
                <div
                  className="absolute left-0 top-full min-w-52 rounded-2xl border hover:text-black shadow-xl py-1.5 z-50 bg-white dark:bg-[#181028]"
                  style={{
                    borderColor: "var(--border)",
                    opacity: openCatId === cat.id ? "1" : "0",
                    pointerEvents: openCatId === cat.id ? "auto" : "none",
                    transform: openCatId === cat.id ? "translateY(0)" : "translateY(-10px)",
                    transition: "all 150ms",
                  }}
                >
                  {cat.subcategorias.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      className="relative group/sub"
                      onMouseEnter={() => windowWidth !== null && windowWidth >= 1024 && setOpenSubId(sub.id)}
                      onMouseLeave={() => windowWidth !== null && windowWidth >= 1024 && setOpenSubId(null)}
                    >
                      {sub.subcategorias?.length > 0 ? (
                        <button
                          onClick={() => setOpenSubId(openSubId === sub.id ? null : sub.id)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-shadow text-slate-900 hover:shadow-sm rounded-md"
                        >
                          <span className="text-slate-900 group-hover/sub:text-black transition-colors">{sub.nombre}</span>
                          <span 
                            className="material-icons-round text-sm text-slate-500 hover:text-black transition-transform duration-200"
                            style={{ transform: openSubId === sub.id ? "rotate(90deg)" : "rotate(0deg)" }}
                          >
                            chevron_right
                          </span>

                          {/* Dropdown nivel 2 */}
                          <div
                            className="absolute left-full top-0 ml-1 min-w-44 rounded-2xl border shadow-xl py-1.5 z-60 bg-white hover:text-black"
                            style={{
                              borderColor: "var(--border)",
                              opacity: openSubId === sub.id ? "1" : "0",
                              pointerEvents: openSubId === sub.id ? "auto" : "none",
                              transform: openSubId === sub.id ? "translateX(0)" : "translateX(-10px)",
                              transition: "all 150ms",
                            }}
                          >
                            {sub.subcategorias.map((subsub: any) => (
                              <Link
                                key={subsub.id}
                                href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
                                className="block px-4 py-2.5 text-sm hover:text-black transition-colors text-slate-900"
                              >
                                <span className="hover:text-black">{subsub.nombre}</span>
                              </Link>
                            ))}
                          </div>
                        </button>
                      ) : (
                        <Link
                          href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
                          className="block px-4 py-2.5 text-sm transition-shadow text-slate-900 hover:shadow-sm rounded-md"
                        >
                          <span className="group-hover/sub:text-black transition-colors">{sub.nombre}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ══════════════════ MOBILE DRAWER ══════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm mb-12"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 w-[85vw] max-w-xs max-h-[calc(100vh-80px)] overflow-y-auto shadow-2xl flex flex-col"
            style={{ background: "#000000", color: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
                              <span className="font-bold text-base" style={{ color: "#ffffff" }}>
                Importadora Atlas
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl transition-colors"
                style={{ color: "#ffffff" }}
              >
                <span className="material-icons-round text-xl">close</span>
              </button>
            </div>

            <div className="flex-1 px-4 py-4 flex flex-col gap-1">
              {/* Búsqueda móvil */}
              <form
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl border mb-3"
                style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchValue.trim()) {
                    handleSearch();
                    setMobileOpen(false);
                  }
                }}
              >
                                  <span className="material-icons-round text-lg" style={{ color: "#ffffff" }}>
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar productos..."
                  className="bg-transparent outline-none text-sm flex-1"
                  style={{ color: "#ffffff" }}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoComplete="off"
                />

                {/* Dropdown sugerencias móvil */}
                {searchValue.trim() && (
                  <div
                    className="absolute left-0 top-full mt-1 w-full rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{
                      background: "#000000",
                      borderColor: "rgba(255,255,255,0.2)",
                      maxHeight: 300,
                      overflowY: "auto",
                    }}
                  >
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm" style={{ color: "#ffffff" }}>
                        Buscando...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((prod) => {
                        let href = `/product-detail/${String(prod.nombre || prod.id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
                        if (isAdmin) href = `/admin/product-detail?id=${prod.id}`;
                        return (
                          <a
                            key={prod.id}
                            href={href}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors text-sm"
                            style={{ color: "#ffffff" }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setMobileOpen(false);
                              setSearchValue("");
                            }}
                          >
                            {prod.imagen && (
                              <img
                                src={prod.imagen}
                                alt={prod.nombre}
                                className="w-8 h-8 object-cover rounded-lg shrink-0"
                              />
                            )}
                            <span className="truncate flex-1">{prod.nombre}</span>
                            {prod.marca && (
                              <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>
                                {prod.marca}
                              </span>
                            )}
                          </a>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm" style={{ color: "#ffffff" }}>
                        Sin resultados
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Links */}
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: "#ffffff" }}
                >
                  {link.label}
                </a>
              ))}

              {/* Categorías en acordeón */}
              <MobileCategoriesAccordion basePath={basePath} />

              {/* Divisor */}
              <div className="border-t my-2" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
              <div className="border-t my-2" style={{ borderColor: "rgba(255,255,255,0.1)" }} />

              {/* Usuario - Opciones si está autenticado */}
              {user && (
                <>
                  <a
                    href="/admin/perfil"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: "#ffffff" }}
                  >
                    <span className="material-icons-round text-base">person</span>
                    Perfil
                  </a>
                  <a
                    href="/admin/config"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: "#ffffff" }}
                  >
                    <span className="material-icons-round text-base">settings</span>
                    Configuración
                  </a>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-red-500 font-medium transition-colors"
                    onClick={async () => {
                      const { logoutUser } = await import("../lib/firebase-auth");
                      await logoutUser();
                      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
                      window.location.href = "/";
                    }}
                  >
                    <span className="material-icons-round text-base">logout</span>
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Navbar;