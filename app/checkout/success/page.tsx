"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Limpiar carrito del localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("carrito");
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Procesando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">¡Pago exitoso!</h1>
          <p className="text-gray-400">Tu pedido ha sido procesado correctamente.</p>
        </div>

        {pedidoId && (
          <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Número de pedido:</p>
            <p className="text-lg font-semibold text-white">{pedidoId}</p>
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-[#dcb432] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#c9a32d] transition-colors"
          >
            Volver a la tienda
          </Link>
          <Link
            href="/productos"
            className="block w-full bg-transparent border border-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            Ver más productos
          </Link>
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Recibirás un correo de confirmación con los detalles de tu pedido.
        </p>
      </div>
    </main>
  );
}
