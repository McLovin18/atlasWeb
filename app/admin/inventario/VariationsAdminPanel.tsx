"use client";
import React, { useEffect, useState } from "react";
import { obtenerAtributos, crearAtributo, agregarValorAtributo, actualizarAtributo, eliminarAtributo, eliminarValorAtributo, renombrarValorAtributo } from "../../lib/atributos-db";

export default function VariationsAdminPanel() {
  const [atributos, setAtributos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAttrName, setNewAttrName] = useState("");
  const [newValuesMap, setNewValuesMap] = useState<Record<string, string>>({});
  const [editingValue, setEditingValue] = useState<Record<string, string | null>>({});

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const list = await obtenerAtributos();
      setAtributos(list);
    } catch (err) {
      console.error(err);
      alert("Error cargando variables");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const nombre = newAttrName.trim();
    if (!nombre) return alert('Ingresa un nombre para la variable');
    // evitar duplicados
    if (atributos.some(a => (a.nombre || '').toLowerCase() === nombre.toLowerCase())) {
      return alert('Ya existe una variable con ese nombre');
    }
    try {
      await crearAtributo(nombre);
      setNewAttrName("");
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Error creando variable");
    }
  }

  async function handleAddValue(attrId: string, nombre: string) {
    const val = (newValuesMap[attrId] || "").trim();
    if (!val) return alert('Ingresa un valor');
    const attr = atributos.find(a => a.id === attrId);
    if (attr && Array.isArray(attr.valores) && attr.valores.some((v: string) => v.toLowerCase() === val.toLowerCase())) {
      return alert('Ese valor ya existe');
    }
    try {
      await agregarValorAtributo(attrId, val);
      setNewValuesMap({ ...newValuesMap, [attrId]: "" });
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Error agregando valor");
    }
  }

  async function handleDeleteValue(attrId: string, valor: string) {
    if (!confirm(`Eliminar el valor '${valor}'?`)) return;
    try {
      await eliminarValorAtributo(attrId, valor);
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Error eliminando valor");
    }
  }

  async function handleRenameValue(attrId: string, current: string) {
    const nuevo = window.prompt("Renombrar valor", current);
    if (!nuevo || nuevo === current) return;
    try {
      await renombrarValorAtributo(attrId, current, nuevo);
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Error renombrando valor");
    }
  }

  async function handleEditName(attrId: string, current: string) {
    const nuevo = window.prompt("Renombrar variable", current);
    if (!nuevo || nuevo === current) return;
    try {
      await actualizarAtributo(attrId, { nombre: nuevo });
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Error renombrando");
    }
  }

  async function handleDelete(attrId: string) {
    if (!confirm("Eliminar variable y todos sus valores? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarAtributo(attrId);
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Error eliminando");
    }
  }

  function onNewValueChange(attrId: string, val: string) {
    setNewValuesMap({ ...newValuesMap, [attrId]: val });
  }

  function startEditValue(attrId: string, val: string) {
    setEditingValue({ ...editingValue, [attrId]: val });
  }

  function cancelEditValue(attrId: string) {
    setEditingValue({ ...editingValue, [attrId]: null });
  }

  async function saveEditValue(attrId: string, oldVal: string) {
    const nuevo = (editingValue[attrId] || "").trim();
    if (!nuevo) return alert('Valor vacío');
    const attr = atributos.find(a => a.id === attrId);
    if (attr && Array.isArray(attr.valores) && attr.valores.some((v: string) => v.toLowerCase() === nuevo.toLowerCase() && v !== oldVal)) {
      return alert('Ya existe ese valor');
    }
    try {
      await renombrarValorAtributo(attrId, oldVal, nuevo);
      setEditingValue({ ...editingValue, [attrId]: null });
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Error renombrando valor');
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 text-black shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Variaciones (Atributos)</h2>
        <div className="flex items-center gap-2">
          <input value={newAttrName} onChange={e => setNewAttrName(e.target.value)} placeholder="Nueva variable (ej: Color)" className="px-3 py-2 border border-slate-300 rounded bg-white text-black caret-black placeholder:text-black/60 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
          <button onClick={handleCreate} className="px-3 py-2 bg-rose-600 text-white rounded">Crear variable</button>
          <button onClick={refresh} className="ml-2 px-3 py-2 border rounded">Actualizar</button>
        </div>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : atributos.length === 0 ? (
        <div>No hay variables definidas</div>
      ) : (
        <div className="space-y-3">
          {atributos.map(attr => (
            <div key={attr.id} className="border rounded p-3 flex items-start justify-between">
              <div>
                <div className="font-semibold">{attr.nombre}</div>
                <div className="mt-2 text-sm text-black">Valores:</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.isArray(attr.valores) ? attr.valores.map((v: string) => (
                    <div key={v} className="px-3 py-1 rounded-full border border-slate-300 bg-white text-sm text-black flex items-center gap-2">
                      {editingValue[attr.id] === v ? (
                        <>
                          <input className="px-2 py-1 text-sm text-black caret-black bg-white border border-slate-300 rounded placeholder:text-black/60 focus:border-black focus:outline-none" value={editingValue[attr.id] || ""} onChange={e => setEditingValue({ ...editingValue, [attr.id]: e.target.value })} />
                          <button className="text-xs text-emerald-600" onClick={() => saveEditValue(attr.id, v)}>Guardar</button>
                          <button className="text-xs text-black" onClick={() => cancelEditValue(attr.id)}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <span>{v}</span>
                          <button className="text-xs text-black" onClick={() => startEditValue(attr.id, v)}>✏️</button>
                          <button className="text-xs text-red-500" onClick={() => handleDeleteValue(attr.id, v)}>🗑️</button>
                        </>
                      )}
                    </div>
                  )) : null}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input placeholder="Nuevo valor" value={newValuesMap[attr.id] || ""} onChange={e => onNewValueChange(attr.id, e.target.value)} className="px-2 py-1 border border-slate-300 rounded bg-white text-sm text-black caret-black placeholder:text-black/60 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                  <button className="px-3 py-1 bg-rose-500 text-white rounded text-sm" onClick={() => handleAddValue(attr.id, attr.nombre)}>Agregar</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded text-sm" onClick={() => handleEditName(attr.id, attr.nombre)}>Renombrar</button>
                <button className="px-3 py-1 border rounded text-sm" onClick={() => handleAddValue(attr.id, attr.nombre)}>Agregar valor</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded text-sm" onClick={() => handleDelete(attr.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
