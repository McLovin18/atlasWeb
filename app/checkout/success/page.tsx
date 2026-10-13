"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../context/UserContext";

interface OrderProduct {
  nombre: string;
  cantidad: number;
  precioFinal?: number;
  precioBase?: number;
  precio?: number;
  subtotal?: number;
}

interface Order {
  orderId?: string;
  productos?: OrderProduct[];
  subtotal?: number;
  costoEnvio?: number;
  total?: number;
  cliente?: {
    nombre: string;
    email: string;
    telefono: string;
    direccion?: string;
  };
  direccion?: {
    direccion: string;
    ciudad: string;
    provincia: string;
  };
  createdAt?: any;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams?.get("pedidoId");
  const { clearCarrito } = useUser();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!pedidoId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/ordenes/${pedidoId}`);
        if (!response.ok) {
          throw new Error("Error al cargar el pedido");
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("No se pudo cargar la información del pedido");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Limpiar carrito usando el contexto (maneja tanto guest como user cart)
    clearCarrito();
  }, [pedidoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-pulse text-slate-900 dark:text-white text-xl">Procesando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">¡Pago exitoso!</h1>
          <p className="text-gray-600 dark:text-gray-400">Tu pedido ha sido procesado correctamente.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {pedidoId && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Número de pedido:</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{order?.orderId || pedidoId}</p>
          </div>
        )}

        {order && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Productos */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Productos comprados</h2>
              {order.productos && order.productos.length > 0 ? (
                <div className="space-y-4">
                  {order.productos.map((producto, index) => {
                    const precio = producto.precioFinal || producto.precioBase || producto.precio || 0;
                    const cantidad = producto.cantidad || 1;
                    const subtotal = producto.subtotal || (precio * cantidad);
                    return (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700 last:border-0">
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-white font-medium">{producto.nombre}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Cantidad: {cantidad} × ${precio.toFixed(2)}</p>
                        </div>
                        <p className="text-slate-900 dark:text-white font-semibold">${subtotal.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No hay productos en el pedido</p>
              )}
            </div>

            {/* Resumen */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Resumen del pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal:</span>
                  <span>${(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Envío:</span>
                  <span>${(order.costoEnvio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white font-bold text-lg pt-3 border-t border-gray-200 dark:border-slate-700">
                  <span>Total:</span>
                  <span className="text-green-600 dark:text-green-400">${(order.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {order.direccion && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Dirección de envío</h3>
                  <p className="text-gray-600 dark:text-gray-300">{order.direccion.direccion}</p>
                  <p className="text-gray-600 dark:text-gray-300">{order.direccion.ciudad}, {order.direccion.provincia}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-[#dcb432] text-black font-semibold py-3 px-6 rounded-lg hover:bg-[#c9a32d] transition-colors text-center"
          >
            Volver a la tienda
          </Link>
          <Link
            href="/productos"
            className="bg-transparent border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-center"
          >
            Ver más productos
          </Link>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm mt-8 text-center">
          Recibirás un correo de confirmación con los detalles de tu pedido.
        </p>
      </div>
    </main>
  );
}
