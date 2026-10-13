"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutFailedPage() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams?.get("pedidoId");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pago fallido</h1>
          <p className="text-gray-600 dark:text-gray-400">Hubo un problema al procesar tu pago. Por favor intenta nuevamente.</p>
        </div>

        {pedidoId && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Número de pedido:</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{pedidoId}</p>
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/cart"
            className="block w-full bg-[#dcb432] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#c9a32d] transition-colors"
          >
            Intentar nuevamente
          </Link>
          <Link
            href="/"
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm mt-8">
          Si el problema persiste, contáctanos para asistencia.
        </p>
      </div>
    </main>
  );
}
