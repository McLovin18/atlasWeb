"use client";
import React, { useState, useEffect } from "react";
import type { Producto } from "../../lib/productos-db";
import CategoriasAdminPanel from "./CategoriasAdminPanel";
import MarcasAdminPanel from "./MarcasAdminPanel";
import BodegasAdminPanel from "./BodegasAdminPanel";
import VariationsAdminPanel from "./VariationsAdminPanel";
import ProductoFormModal from "./ProductoFormModal";
import ProductoCard from "../../components/ProductoCard";
import { obtenerCategorias } from "../../lib/categorias-db";
import {
  crearProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto
} from "../../lib/productos-db";
import { crearBodegaDefault } from "../../lib/bodegas-db";

type FiltroStock = "todos" | "con-stock" | "poco-stock" | "sin-stock";

export default function AdminInventario() {

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState("newest");
  const [vista, setVista] = useState("productos");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<string | null>(null);
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);

  function getStockTotal(producto: Producto) {
    const variantes = Array.isArray(producto.stockVariants) ? producto.stockVariants : [];
    if (variantes.length > 0) {
      return variantes.reduce((sum, variant) => sum + Number(variant?.cantidad || 0), 0);
    }

    return Number(producto.stock || 0);
  }

  // 📊 Resumen de inventario
  const resumen = React.useMemo(() => {
    const total = productos.length;
    let conStock = 0, pocoStock = 0, sinStock = 0;

    productos.forEach(p => {
      const stockTotal = getStockTotal(p);
      if (stockTotal === 0) sinStock++;
      else if (stockTotal <= 5) pocoStock++;
      else conStock++;
    });

    return { total, conStock, pocoStock, sinStock };
  }, [productos]);

  // 🔄 Cargar productos
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      const prods = await obtenerProductos({ incluirSinStock: true });
      setProductos(prods);
      setLoading(false);
    }
    
    // Crear bodega default si no existe
    crearBodegaDefault().catch(err => console.error("Error creando bodega default:", err));
    
    fetchProductos();
    obtenerCategorias().then(setCategoriasDb).catch(err => console.error("Error cargando categorías:", err));
  }, []);

  const categoriaLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    const walk = (items: any[]) => {
      items.forEach((cat) => {
        if (cat?.id) map.set(cat.id, cat.nombre || cat.id);
        if (Array.isArray(cat?.subcategorias)) walk(cat.subcategorias);
      });
    };
    walk(categoriasDb);
    return map;
  }, [categoriasDb]);

  // Categorías y subcategorías disponibles (extraídas de los productos cargados)
  const categoriasUnicas = React.useMemo(() => {
    return Array.from(new Set(productos.map(p => p.categoria).filter(Boolean as any)));
  }, [productos]);

  const subcategoriasDisponibles = React.useMemo(() => {
    if (selectedCategoria) {
      return Array.from(new Set(productos.filter(p => p.categoria === selectedCategoria).map(p => p.subcategoria).filter(Boolean as any)));
    }
    return Array.from(new Set(productos.map(p => p.subcategoria).filter(Boolean as any)));
  }, [productos, selectedCategoria]);

  const formatCategoria = (id?: string) => (id ? categoriaLabelMap.get(id) || id : "-");

  const getCreatedAtMs = (producto: Producto) => {
    if (typeof producto.createdAt === "number") return producto.createdAt;
    if (producto.createdAt instanceof Date) return producto.createdAt.getTime();
    return 0;
  };

  const productosFiltrados = productos
    .filter((p) => {
      const texto = search.trim().toLowerCase();
      const nombre = p.nombre?.toLowerCase() || "";
      const desc = p.descripcion?.toLowerCase() || "";
      if (texto && !nombre.includes(texto) && !desc.includes(texto)) return false;
      if (selectedCategoria && p.categoria !== selectedCategoria) return false;
      if (selectedSubcategoria && p.subcategoria !== selectedSubcategoria) return false;
      const stockTotal = getStockTotal(p);
      if (filtroStock === "sin-stock") return stockTotal === 0;
      if (filtroStock === "poco-stock") return stockTotal > 0 && stockTotal <= 5;
      if (filtroStock === "con-stock") return stockTotal > 5;
      return true;
    })
    .sort((a, b) => {
      const aPrecio = Number(a.precio || 0);
      const bPrecio = Number(b.precio || 0);
      if (orden === "price-low") return aPrecio - bPrecio;
      if (orden === "price-high") return bPrecio - aPrecio;
      // Por defecto: ordenar por más nuevos (createdAt descendente)
      const aCreated = getCreatedAtMs(a);
      const bCreated = getCreatedAtMs(b);
      return bCreated - aCreated;
    });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      <div className="flex-1 w-full py-6 sm:py-15 px-4 pt-4 pb-24">

        {/* NAV ADMIN */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "productos"
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-purple-700 border-purple-700"
            }`}
            onClick={() => setVista("productos")}
          >
            Productos
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "variaciones"
                ? "bg-indigo-700 text-white border-indigo-700"
                : "bg-white text-indigo-700 border-indigo-700"
            }`}
            onClick={() => setVista("variaciones")}
          >
            Variaciones
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "marcas"
                ? "bg-green-700 text-white border-green-700"
                : "bg-white text-green-700 border-green-700"
            }`}
            onClick={() => setVista("marcas")}
          >
            Marcas
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "categorias"
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-blue-700 border-blue-700"
            }`}
            onClick={() => setVista("categorias")}
          >
            Categorías
          </button>

          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "bodegas"
                ? "bg-red-700 text-white border-red-700"
                : "bg-white text-red-700 border-red-700"
            }`}
            onClick={() => setVista("bodegas")}
          >
            Bodegas
          </button>
        </div>

        {/* ================== VISTA PRODUCTOS ================== */}
        {vista === "productos" && (
          <>
            {/* RESUMEN */}
            <div className="flex gap-8 items-center mb-4 text-base text-slate-700 dark:text-slate-200">
              <div>Total: <b>{resumen.total}</b></div>
              <div>Stock: <b>{resumen.conStock}</b></div>
              <div>Poco: <b>{resumen.pocoStock}</b></div>
              <div>Sin stock: <b>{resumen.sinStock}</b></div>
            </div>

            {/* FILTRO STOCK */}
            <div className="flex gap-2 mb-4 flex-wrap text-black">
              <button
                onClick={() => setFiltroStock("todos")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "todos"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black hover:bg-slate-100"
                }`}
              >
                Todos ({resumen.total})
              </button>
              <button
                onClick={() => setFiltroStock("con-stock")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "con-stock"
                    ? "bg-green-600 text-white border-black"
                    : "bg-white text-black border-black hover:bg-green-50"
                }`}
              >
                Con stock ({resumen.conStock})
              </button>
              <button
                onClick={() => setFiltroStock("poco-stock")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "poco-stock"
                    ? "bg-amber-500 text-white border-black"
                    : "bg-white text-black border-black hover:bg-amber-50"
                }`}
              >
                Poco stock ({resumen.pocoStock})
              </button>
              <button
                onClick={() => setFiltroStock("sin-stock")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  filtroStock === "sin-stock"
                    ? "bg-red-600 text-white border-black"
                    : "bg-white text-black border-black hover:bg-red-50"
                }`}
              >
                Sin stock ({resumen.sinStock})
              </button>
            </div>

            {/* BARRA DE FILTROS PRINCIPAL */}
            <div className="flex items-center gap-3 mb-4 flex-wrap text-black">
              <div className="flex-1 min-w-55">
                <div className="relative">
                  <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-lg text-black">search</span>
                  <input
                    type="text"
                    placeholder="Título, cód. de barras o SKU"
                    className="pl-10 pr-4 py-2 rounded-lg border border-black text-black placeholder:text-black w-full"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-48 min-w-40">
                <select className="px-3 py-2 rounded-lg border border-black text-black w-full" value={selectedCategoria ?? ""} onChange={e => { setSelectedCategoria(e.target.value || null); setSelectedSubcategoria(null); }}>
                  <option value="">Categoría</option>
                  {categoriasUnicas.map(c => (
                    <option key={c} value={c}>{formatCategoria(c)}</option>
                  ))}
                </select>
              </div>

              <div className="w-48 min-w-40">
                <select className="px-3 py-2 rounded-lg border border-black text-black w-full" value={selectedSubcategoria ?? ""} onChange={e => setSelectedSubcategoria(e.target.value || null)}>
                  <option value="">Subcategoría</option>
                  {subcategoriasDisponibles.map(s => (
                    <option key={s} value={s}>{formatCategoria(s)}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button className="px-4 py-2 rounded-full bg-rose-600 text-white" onClick={() => setShowForm(true)}>Registrar un producto</button>
              </div>
            </div>

            {/* MODAL */}
            <ProductoFormModal
              show={showForm}
              initialData={editData}
              onClose={() => {
                setShowForm(false);
                setEditData(null);
              }}
              onSave={async (data: Producto) => {
                if (editData) {
                  await actualizarProducto(editData.id, data);
                } else {
                  await crearProducto({ ...data, destacado: false });
                }
                const prods = await obtenerProductos({ incluirSinStock: true });
                setProductos(prods);
                setShowForm(false);
                setEditData(null);
              }}
            />

            {/* LISTA DE PRODUCTOS (estilo inventario) */}
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <div className="max-h-[65vh] overflow-auto">
                {loading ? (
                  <div className="p-6 text-center">Cargando productos...</div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="p-6 text-center">No hay productos</div>
                ) : (
                  <table className="w-full min-w-245 table-fixed">
                    <thead className="bg-slate-50 text-slate-700 border-b">
                      <tr>
                        <th className="text-left font-semibold px-6 py-4 w-[48%]">Producto</th>
                        <th className="text-left font-semibold px-4 py-4 w-[24%]">Fecha actualización</th>
                        <th className="text-center font-semibold px-4 py-4 w-[10%]">Destacado</th>
                        <th className="text-right font-semibold px-4 py-4 w-[9%]">Precio</th>
                        <th className="text-right font-semibold px-6 py-4 w-[9%]">Existencias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((p) => {
                        const thumb = p.imagenes?.[0] || p.imagen || "/no-image.png";
                        const fecha = p.createdAt ? new Date(p.createdAt).toLocaleString() : "-";
                        const stockTotal = getStockTotal(p);

                        return (
                          <tr key={p.id} className="border-b last:border-b-0 hover:bg-slate-50/60 transition-colors align-middle">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                                  <img src={thumb} alt={p.nombre} className="object-contain w-full h-full" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-800 truncate">{p.nombre}</div>
                                  <div className="text-xs text-slate-500 truncate">SKU: {p.sku || p.id}</div>
                                  <div className="mt-1 flex items-center gap-2 text-xs whitespace-nowrap">
                                    <button className="text-rose-600 font-medium" onClick={() => { setEditData(p); setShowForm(true); }}>Editar</button>
                                    <span className="text-slate-300">|</span>
                                    <button className="text-slate-600 hover:text-slate-900" onClick={async () => { if (confirm("¿Eliminar producto?")) { await eliminarProducto(p.id); const prods = await obtenerProductos({ incluirSinStock: true }); setProductos(prods); } }}>Eliminar</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{fecha}</td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(p.destacado)}
                                  className="h-5 w-5 accent-purple-600 cursor-pointer"
                                  onChange={async (e) => {
                                    const isChecked = e.target.checked;
                                    setProductos((prev) =>
                                      prev.map((item) =>
                                        item.id === p.id ? { ...item, destacado: isChecked } : item
                                      )
                                    );
                                    try {
                                      await actualizarProducto(p.id, { destacado: isChecked });
                                    } catch (error) {
                                      console.error("Error actualizando destacado:", error);
                                      setProductos((prev) =>
                                        prev.map((item) =>
                                          item.id === p.id ? { ...item, destacado: !isChecked } : item
                                        )
                                      );
                                    }
                                  }}
                                  aria-label={`Marcar ${p.nombre || "producto"} como destacado`}
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-600 whitespace-nowrap">${Number(p.precio || 0).toFixed(2)}</td>
                            <td className="px-6 py-3 text-right font-bold text-black whitespace-nowrap">{stockTotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================== OTRAS VISTAS ================== */}
        {vista === "variaciones" && <VariationsAdminPanel />}
        {vista === "marcas" && <MarcasAdminPanel />}
        {vista === "categorias" && <CategoriasAdminPanel />}
        {vista === "bodegas" && <BodegasAdminPanel />}

      </div>
    </div>
  );
}
