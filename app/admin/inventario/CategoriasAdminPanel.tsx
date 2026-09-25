import { useEffect, useState } from "react";
import { obtenerCategorias, guardarCategoria, eliminarCategoria } from "../../lib/categorias-db";

export type Categoria = {
  id: string;
  nombre: string;
  icono?: string;
  orden?: number;
  subcategorias?: Categoria[];
};

// Utilidad para agregar una categoría anidada en el path correcto
function addNestedCategoria(categorias: Categoria[], path: number[], nueva: Categoria): Categoria[] {
  if (path.length === 0) return categorias;
  const [idx, ...rest] = path;
  const copy = categorias.map(cat => ({ ...cat, subcategorias: cat.subcategorias ? [...cat.subcategorias] : [] }));
  if (rest.length === 0) {
    copy[idx].subcategorias = [...(copy[idx].subcategorias || []), nueva];
  } else {
    copy[idx].subcategorias = addNestedCategoria(copy[idx].subcategorias || [], rest, nueva);
  }
  return copy;
}

// Regenerar números de orden en un array
function regenerateOrder(items: Categoria[]): Categoria[] {
  return items.map((item, idx) => ({
    ...item,
    orden: idx,
    subcategorias: item.subcategorias ? regenerateOrder(item.subcategorias) : undefined
  }));
}

// Obtener un elemento por path
function getByPath(categorias: Categoria[], path: number[]): Categoria[] | null {
  let current: any = { subcategorias: categorias };
  for (const idx of path) {
    if (!current.subcategorias || !current.subcategorias[idx]) return null;
    current = current.subcategorias[idx];
  }
  return current?.subcategorias || null;
}

// Mover elemento dentro de la estructura jerárquica
function moveCategoria(categorias: Categoria[], sourcePath: number[], destPath: number[], destLevel: number): Categoria[] | null {
  // Validaciones
  const sourceLevel = sourcePath.length;
  if (sourceLevel !== destLevel) return null; // No se puede mover a diferente nivel
  if (JSON.stringify(sourcePath) === JSON.stringify(destPath)) return null; // Mismo lugar

  // Debe estar en el mismo padre
  const sourceParent = sourcePath.slice(0, -1);
  const destParent = destPath.slice(0, -1);
  if (JSON.stringify(sourceParent) !== JSON.stringify(destParent)) return null;

  const copy = JSON.parse(JSON.stringify(categorias)) as Categoria[];
  
  // Si es nivel 1, manejamos array raíz
  if (sourceLevel === 1) {
    const element = copy[sourcePath[0]];
    copy.splice(sourcePath[0], 1);
    copy.splice(destPath[0], 0, element);
    return regenerateOrder(copy);
  }

  // Si es nivel > 1, navegar al array padre y reordenar
  let pointer: Categoria[] = copy;
  for (const idx of sourceParent) {
    pointer = pointer[idx].subcategorias || [];
  }

  const element = pointer[sourcePath[sourcePath.length - 1]];
  pointer.splice(sourcePath[sourcePath.length - 1], 1);
  pointer.splice(destPath[destPath.length - 1], 0, element);

  // Regenerar órdenes solo en el array modificado
  const parent = sourceParent.length === 0 ? copy : getByPath(copy, sourceParent);
  if (sourceLevel === 1) {
    return regenerateOrder(copy);
  } else if (parent) {
    for (let i = 0; i < pointer.length; i++) {
      pointer[i].orden = i;
    }
  }

  return copy;
}

export default function CategoriasAdminPanel({ onCategoriasChange }: { onCategoriasChange?: (cats: Categoria[]) => void }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevoIcono, setNuevoIcono] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<{[key: string]: boolean}>({});
  const [draggedPath, setDraggedPath] = useState<{ path: number[]; level: number } | null>(null);
  const [dragOverPath, setDragOverPath] = useState<number[] | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Cargar categorías desde Firestore
  useEffect(() => {
    obtenerCategorias().then(cats => setCategorias(cats || []));
  }, []);

  // Notificar cambios
  useEffect(() => {
    if (onCategoriasChange) onCategoriasChange(categorias);
  }, [categorias, onCategoriasChange]);

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    const nueva: Categoria = { id: Date.now().toString(), nombre: nuevaCategoria, icono: nuevoIcono.trim() || undefined, orden: categorias.length, subcategorias: [] };
    await guardarCategoria(nueva);
    setCategorias(prev => [...prev, nueva]);
    setNuevaCategoria("");
    setNuevoIcono("");
  };

  const handleEliminarCategoria = async (cat: Categoria, nivel: number, parentPath: number[] = []) => {
    if (nivel === 1) {
      await eliminarCategoria(cat.id);
      setCategorias(prev => prev.filter(c => c.id !== cat.id));
    } else {
      setCategorias(prev => {
        const copy = JSON.parse(JSON.stringify(prev));
        let pointer = copy;
        for (let i = 0; i < parentPath.length - 1; i++) {
          pointer = pointer[parentPath[i]].subcategorias;
        }
        pointer.splice(parentPath[parentPath.length - 1], 1);
        guardarCategoria(copy[parentPath[0]]);
        return copy;
      });
    }
  };

  const handleDragStart = (path: number[], level: number) => {
    setDraggedPath({ path, level });
  };

  const handleDragOver = (path: number[], level: number) => {
    if (!draggedPath || draggedPath.level !== level) return;
    const sourceParent = draggedPath.path.slice(0, -1);
    const destParent = path.slice(0, -1);
    if (JSON.stringify(sourceParent) === JSON.stringify(destParent)) {
      setDragOverPath(path);
    }
  };

  const handleDrop = async (path: number[], level: number) => {
    if (!draggedPath) return;
    
    const newCategorias = moveCategoria(categorias, draggedPath.path, path, level);
    if (newCategorias) {
      setCategorias(newCategorias);
      // Guardar las categorías afectadas
      if (level === 1) {
        // Si reordena nivel 1, guardar ambos elementos movidos
        await Promise.all([
          guardarCategoria(newCategorias[draggedPath.path[0]]),
          guardarCategoria(newCategorias[path[0]])
        ]);
      } else {
        // Si reordena nivel 2 o superior, guardar la categoría raíz con toda la estructura
        await guardarCategoria(newCategorias[path[0]]);
      }
    }

    setDraggedPath(null);
    setDragOverPath(null);
  };

  const handleEditarNombre = async (path: number[], newName: string, level: number) => {
    if (!newName.trim()) return;

    setCategorias(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as Categoria[];

      if (level === 1) {
        copy[path[0]].nombre = newName.trim();
      } else {
        let pointer = copy;
        for (let i = 0; i < path.length - 1; i++) {
          pointer = pointer[path[i]].subcategorias || [];
        }
        pointer[path[path.length - 1]].nombre = newName.trim();
      }

      // Guardar en Firestore
      if (level === 1) {
        guardarCategoria(copy[path[0]]);
      } else {
        guardarCategoria(copy[path[0]]);
      }

      return copy;
    });

    setEditingPath(null);
    setEditingName("");
  };

  const renderCategorias = (cats: Categoria[], nivel = 1, parentPath: number[] = []): JSX.Element => (
    <ul className={nivel === 1 ? "mb-4 space-y-1" : "mt-2 space-y-1"} style={{ marginLeft: nivel > 1 ? `${(nivel - 1) * 1.5}rem` : 0 }}>
      {cats.map((cat, idx) => {
        const path = [...parentPath, idx];
        const key = path.join("-");
        const isOpen = !!expanded[key];
        const isDragging = draggedPath && JSON.stringify(draggedPath.path) === JSON.stringify(path);
        const isDragOver = dragOverPath && JSON.stringify(dragOverPath) === JSON.stringify(path);
        const isEditing = editingPath === key;

        return (
          <li key={cat.id} className="mb-1">
            <div
              draggable={!isEditing && nivel < 3}
              onDragStart={() => handleDragStart(path, nivel)}
              onDragOver={(e) => {
                e.preventDefault();
                handleDragOver(path, nivel);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(path, nivel);
              }}
              onDragLeave={() => JSON.stringify(dragOverPath) === JSON.stringify(path) && setDragOverPath(null)}
              className={`flex items-center gap-2 p-2 rounded transition-colors ${
                isDragging ? 'opacity-50 bg-gray-200' : ''
              } ${isDragOver ? 'bg-blue-200 border-2 border-blue-500' : 'bg-white'} ${
                !isEditing && nivel < 3 ? 'cursor-move hover:bg-gray-50' : ''
              }`}
              style={{
                borderRadius: '0.375rem',
                border: isDragOver ? '2px solid rgb(59, 130, 246)' : '1px solid rgb(229, 231, 235)',
              }}
            >
              {cat.subcategorias && cat.subcategorias.length > 0 && (
                <button
                  className="mr-1 text-blue-700 focus:outline-none flex-shrink-0"
                  onClick={() => setExpanded(exp => ({ ...exp, [key]: !exp[key] }))}
                  type="button"
                  disabled={isEditing}
                >
                  <span className="material-icons-round text-base">
                    {isOpen ? "expand_more" : "chevron_right"}
                  </span>
                </button>
              )}
              {nivel < 3 && !isEditing && (
                <span className="material-icons-round text-sm text-gray-400 flex-shrink-0">drag_handle</span>
              )}
              
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleEditarNombre(path, editingName, nivel);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex-shrink-0"
                    onClick={() => handleEditarNombre(path, editingName, nivel)}
                    type="button"
                  >
                    ✓
                  </button>
                  <button
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 flex-shrink-0"
                    onClick={() => {
                      setEditingPath(null);
                      setEditingName("");
                    }}
                    type="button"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="font-semibold text-black flex-1">{cat.nombre}</span>
                  <button
                    className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 flex-shrink-0"
                    onClick={() => {
                      setEditingPath(key);
                      setEditingName(cat.nombre);
                    }}
                    type="button"
                    title="Editar nombre"
                  >
                    ✎
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                    onClick={() => handleEliminarCategoria(cat, nivel, path)}
                    type="button"
                  >
                    ×
                  </button>
                  {nivel < 3 && (
                    <button
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex-shrink-0"
                      onClick={async () => {
                        const nombre = prompt(`Nombre de la ${nivel === 1 ? "subcategoría" : "subsubcategoría"} para ${cat.nombre}`);
                        if (nombre && nombre.trim()) {
                          const newCat = addNestedCategoria(categorias, path, { 
                            id: Date.now().toString(), 
                            nombre, 
                            subcategorias: nivel === 1 ? [] : undefined 
                          });
                          setCategorias(newCat);
                          await guardarCategoria(newCat[path[0]]);
                        }
                      }}
                    >
                      + {nivel === 1 ? "Sub" : "SubSub"}
                    </button>
                  )}
                </>
              )}
            </div>
            {cat.subcategorias && cat.subcategorias.length > 0 && isOpen && (
              renderCategorias(cat.subcategorias, nivel + 1, path)
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-2 text-blue-700">Gestión de Categorías</h2>
      <p className="text-sm text-gray-600 mb-4">Arrastra las categorías para reordenarlas. Las subcategorías solo pueden moverse dentro de su categoría padre. Haz clic en el botón ✎ para editar nombres.</p>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 min-w-[200px] text-slate-900 dark:text-white bg-white dark:bg-slate-700"
          placeholder="Nueva categoría..."
          value={nuevaCategoria}
          onChange={e => setNuevaCategoria(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && agregarCategoria()}
        />
        <input
          type="text"
          className="w-32 border rounded px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700"
          placeholder="Icono (opcional)"
          value={nuevoIcono}
          onChange={e => setNuevoIcono(e.target.value)}
          maxLength={30}
          title="Nombre del icono de Material Icons"
        />
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded font-bold hover:bg-blue-800"
          onClick={agregarCategoria}
        >
          Agregar
        </button>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        {categorias.length > 0 ? renderCategorias(categorias) : <p className="text-gray-500">No hay categorías. Agrega una nueva.</p>}
      </div>
    </div>
  );
}

