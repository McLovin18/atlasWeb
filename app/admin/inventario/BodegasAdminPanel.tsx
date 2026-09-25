"use client";

import React, { useState, useEffect } from "react";
import {
  obtenerBodegas,
  crearBodega,
  actualizarBodega,
  eliminarBodega,
  escucharBodegas,
  setNuevaColeccion,
  type Bodega
} from "../../lib/bodegas-db";

export default function BodegasAdminPanel() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: "", tiempoEntrega: 24 });
  const [error, setError] = useState("");
  const [settingNuevaColeccion, setSettingNuevaColeccion] = useState(false);

  // Cargar bodegas con listener en tiempo real
  useEffect(() => {
    setLoading(true);
    const unsub = escucharBodegas((data) => {
      setBodegas(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    try {
      if (editingId) {
        await actualizarBodega(editingId, formData.nombre, formData.tiempoEntrega);
      } else {
        await crearBodega(formData.nombre, formData.tiempoEntrega);
      }
      setFormData({ nombre: "", tiempoEntrega: 24 });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError("Error al guardar la bodega");
      console.error(err);
    }
  };

  const handleEdit = (bodega: Bodega) => {
    setFormData({ nombre: bodega.nombre, tiempoEntrega: bodega.tiempoEntrega });
    setEditingId(bodega.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta bodega?")) {
      try {
        await eliminarBodega(id);
      } catch (err) {
        setError("Error al eliminar la bodega");
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nombre: "", tiempoEntrega: 24 });
    setError("");
  };

  const handleSetNuevaColeccion = async (bodegaId: string) => {
    try {
      setSettingNuevaColeccion(true);
      await setNuevaColeccion(bodegaId);
    } catch (err) {
      setError("Error al actualizar Nueva Colección");
      console.error(err);
    } finally {
      setSettingNuevaColeccion(false);
    }
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestión de Bodegas
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            + Nueva Bodega
          </button>
        )}
      </div>

      {/* Selector de Nueva Colección */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
          Bodega para "Nueva Colección"
        </h3>
        <div className="grid gap-2">
          {loading ? (
            <p className="text-slate-500">Cargando bodegas...</p>
          ) : bodegas.length === 0 ? (
            <p className="text-slate-500">No hay bodegas disponibles</p>
          ) : (
            bodegas.map((bodega) => (
              <button
                key={bodega.id}
                onClick={() => handleSetNuevaColeccion(bodega.id)}
                disabled={settingNuevaColeccion}
                className={`p-3 rounded-lg text-left font-medium transition-all ${
                  bodega.esNuevaColeccion
                    ? "bg-blue-600 text-white border-2 border-blue-700"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400"
                } ${settingNuevaColeccion ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <span>{bodega.nombre}</span>
                  {bodega.esNuevaColeccion && (
                    <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded font-bold">
                      ✓ Seleccionada
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            {editingId ? "Editar Bodega" : "Nueva Bodega"}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre de la Bodega
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="ej: Bodega Central"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tiempo de Entrega (horas laborales)
              </label>
              <select
                value={formData.tiempoEntrega}
                onChange={(e) => setFormData({ ...formData, tiempoEntrega: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={24}>24 horas (Rápida)</option>
                <option value={72}>72 horas (Estándar)</option>
              </select>
              {editingId === "MarcaEstilo" && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  La bodega MarcaEstilo siempre tiene entrega de 24 horas
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                {editingId ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de bodegas */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando bodegas...</div>
      ) : bodegas.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No hay bodegas creadas</div>
      ) : (
        <div className="grid gap-4">
          {bodegas.map((bodega) => (
            <div
              key={bodega.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center"
            >
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {bodega.nombre}
                  {bodega.id === "MarcaEstilo" && (
                    <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Entrega: {bodega.tiempoEntrega} horas laborales
                </p>
              </div>
              <div className="flex gap-2">
                {bodega.id !== "MarcaEstilo" && (
                  <>
                    <button
                      onClick={() => handleEdit(bodega)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(bodega.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </>
                )}
                {bodega.id === "MarcaEstilo" && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    No se puede eliminar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

