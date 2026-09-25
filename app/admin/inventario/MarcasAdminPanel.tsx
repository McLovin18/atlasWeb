import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

const COLLECTION = "marcas";

export default function MarcasAdminPanel() {
  const [marcas, setMarcas] = useState([]);
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTION), snap => {
      setMarcas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const agregarMarca = async () => {
    if (!nuevaMarca.trim()) return;
    setLoading(true);
    await setDoc(doc(db, COLLECTION, nuevaMarca.toLowerCase().replace(/\s+/g, "_")), {
      nombre: nuevaMarca
    });
    setNuevaMarca("");
    setLoading(false);
  };

  const eliminarMarca = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-green-700">Gestión de Marcas</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700"
          placeholder="Nueva marca..."
          value={nuevaMarca}
          onChange={e => setNuevaMarca(e.target.value)}
        />
        <button
          className="bg-green-700 text-white px-4 py-2 rounded font-bold"
          onClick={agregarMarca}
          disabled={loading}
        >
          Agregar marca
        </button>
      </div>
      <ul className="divide-y">
        {marcas.map(marca => (
          <li key={marca.id} className="py-2 flex items-center justify-between">
            <span className="font-semibold text-green-700">{marca.nombre}</span>
            <button
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              onClick={() => eliminarMarca(marca.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

