"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-yellow-500 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Pago en proceso</h1>
          <p className="text-gray-400">Tu pago está siendo verificado. Te notificaremos cuando se complete.</p>
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
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Si no recibes confirmación en los próximos minutos, contáctanos.
        </p>
      </div>
    </main>
  );
}
