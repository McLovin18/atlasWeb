"use client";

import { useEffect } from "react";
import { useUser } from "../context/UserContext";
import { getSnapshotPricing } from "../lib/pricing";
import CheckoutForm from "./Checkoutform";
import Link from "next/link";

export default function CheckoutPage() {
  const { carrito, loading: contextLoading, cartReady } = useUser();

  const items = Array.isArray(carrito) ? carrito : [];
  const subtotal = items.reduce((sum, item: any) => {
    const { finalPrice } = getSnapshotPricing(item);
    console.log("🛒 Checkout item:", item, "finalPrice:", finalPrice);
    return sum + finalPrice * Number(item?.cantidad || 1);
  }, 0);
  const costoEnvio = 5; // $5 costo de envío
  const total = subtotal + costoEnvio;
  
  console.log("[CheckoutPage] costoEnvio:", costoEnvio, "subtotal:", subtotal, "total:", total);

  console.log('🛒 CheckoutPage state:', { contextLoading, cartReady, itemsLength: items.length, total });

  // Show loading if cart isn't ready yet
  const loading = !cartReady || (contextLoading && items.length === 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-header">
          <Link href="/cart" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al carrito
          </Link>
          <div className="logo-checkout">
            <span className="logo-text">MARCA</span>
            <span className="logo-accent">ESTILO</span>
          </div>
        </div>
        
        <div className="empty-cart-message flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-2xl font-medium mb-4">Tu carrito está vacío</p>
          <Link href="/" className="text-[#dcb432] hover:underline">
            Ir a la tienda
          </Link>
        </div>

        <style jsx>{`
          .checkout-page {
            min-height: 100vh;
            background-color: #080808;
            color: #f0ece0;
            font-family: 'Outfit', sans-serif;
          }

          .checkout-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px 40px;
            border-bottom: 1px solid rgba(220, 180, 50, 0.15);
          }

          .back-link {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #888;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.2s;
          }

          .back-link:hover {
            color: #dcb432;
          }

          .logo-text {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 28px;
            letter-spacing: 4px;
            color: #f0ece0;
          }

          .logo-accent {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 28px;
            letter-spacing: 4px;
            color: #dcb432;
          }

          @media (max-width: 640px) {
            .checkout-header {
              padding: 16px 20px;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-header">
        <Link href="/cart" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Volver al carrito
        </Link>
        <div className="logo-checkout">
          <span className="logo-text">MARCA</span>
          <span className="logo-accent">ESTILO</span>
        </div>
      </div>

      <CheckoutForm items={items} subtotal={subtotal} costoEnvio={costoEnvio} total={total} />

      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          background-color: #080808;
          color: #f0ece0;
          font-family: 'Outfit', sans-serif;
        }

        .checkout-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 40px;
          border-bottom: 1px solid rgba(220, 180, 50, 0.15);
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #dcb432;
        }

        .logo-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 4px;
          color: #f0ece0;
        }

        .logo-accent {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 4px;
          color: #dcb432;
        }

        @media (max-width: 640px) {
          .checkout-header {
            padding: 16px 20px;
          }
        }
      `}</style>
    </main>
  );
}
