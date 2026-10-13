"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ValidationErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || "Error en la validación de los datos de pago";
  const pedidoId = searchParams?.get("pedidoId");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-orange-500 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Error de validación</h1>
          <p className="text-gray-600 dark:text-gray-400">Hubo un error en los datos de la tarjeta.</p>
        </div>

        {pedidoId && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Número de pedido:</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{pedidoId}</p>
          </div>
        )}

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <p className="text-orange-800 dark:text-orange-300 font-medium">{error}</p>
        </div>

        <div className="space-y-4">
          {pedidoId ? (
            <Link
              href={`/checkout?retry=${pedidoId}`}
              className="block w-full bg-[#dcb432] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#c9a32d] transition-colors"
            >
              Volver al pago
            </Link>
          ) : (
            <Link
              href="/cart"
              className="block w-full bg-[#dcb432] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#c9a32d] transition-colors"
            >
              Volver al carrito
            </Link>
          )}
          <Link
            href="/"
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm mt-8">
          Por favor verifica los datos de tu tarjeta e intenta nuevamente.
        </p>
      </div>
    </main>
  );
}
