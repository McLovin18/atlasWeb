"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import { useTracking } from "../lib/useAnalytics";
import { getCatalogPricing } from "../lib/pricing";



const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Barlow:wght@400;500;600;700&display=swap');

  @keyframes pc-fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── wrapper ── */
  .pc-link {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
  }

  /* ── card ── */
  .pc-card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #000000;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid black;
    transition: border-color 0.25s, box-shadow 0.25s;
  }

  .pc-card:hover {
    border-color: #7B9BC0;
    box-shadow: 0 8px 40px rgba(212,175,55,0.18);
  }

  /* ── imagen ── */
  /* Wide/landscape: más ancho que alto, para que no sobre espacio
     vertical alrededor de la imagen del producto. */
  .pc-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 4;
    background: #0a0a0a;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Altura siempre llena el contenedor; el ancho se ajusta de forma
     proporcional (sin recorte ni estiramiento). max-width evita que
     una imagen muy ancha se salga del contenedor. */
  .pc-img-wrap img {
    height: 100% !important;
    width: auto !important;
    max-width: 100% !important;
    object-fit: contain !important;
    padding: 0 !important;
    transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94) !important;
  }

  .pc-card:hover .pc-img-wrap img {
    transform: scale(1.06) !important;
  }

  /* ── badge descuento ── */
  .pc-badge-discount {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    background: #7B9BC0;
    color: #000000;
    font-family: 'Barlow', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 2px;
  }

  /* ── sin stock overlay ── */
  .pc-no-stock {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pc-no-stock span {
    font-family: 'Barlow', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ffffff;
    background: #000000;
    border: 1px solid #7B9BC0;
    padding: 5px 12px;
    border-radius: 2px;
  }

  /* ── fav btn ── */
  .pc-fav {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 20;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(0,0,0,0.6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.85);
    transition: opacity 0.2s, transform 0.2s, background 0.2s;
    backdrop-filter: blur(4px);
  }

  .pc-fav.is-fav {
    opacity: 1;
    transform: scale(1);
    background: #7B9BC0;
    color: #000000;
  }

  .pc-card:hover .pc-fav {
    opacity: 1;
    transform: scale(1);
  }

  /* ── info ── */
  /* min-height fijo: así todas las cards miden lo mismo aunque
     el producto "visual only" no muestre precio */
  .pc-info {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-height: 40px;
  }

  @media (min-width: 640px) {
    .pc-info {
      padding: 14px 16px 16px;
      min-height: 52px;
    }
  }

  /* nombre */
  .pc-name {
    color: #ffffff;
    transition: color 0.25s ease;
    font-size: 12px;
    font-weight: 700;
  }

  @media (min-width: 640px) {
    .pc-name {
    font-size: 22px;
    }
  }

  /* precio */
  .pc-prices {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 2px;
    flex-wrap: wrap;
  }

  .pc-price-final {
    font-family: 'Barlow', sans-serif;
    font-weight: 700;
    font-size: 13px;
    color: #ffffff;
    letter-spacing: 0.02em;
    transition: color 0.25s ease;
  }

  @media (min-width: 640px) {
    .pc-price-final {
      font-size: 15px;
    }
  }

  .pc-price-old {
    font-family: 'Barlow', sans-serif;
    font-weight: 400;
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    text-decoration: line-through;
    transition: color 0.25s ease;
  }

  .pc-price-currency {
    font-size: 0.8em;
    font-weight: 400;
    opacity: 0.6;
  }

  /* ── hover: todo el texto a dorado ── */
  .pc-card:hover .pc-name,
  .pc-card:hover .pc-price-final,
  .pc-card:hover .pc-price-old {
    color: #7B9BC0;
  }
`;

function ProductoCard({
  producto,
  onClick,
  showFav = false,
  isCompact = true,
  index = 0,
}: {
  producto?: any;
  onClick?: any;
  showFav?: boolean;
  index?: number;
  isCompact?: boolean;
} = {}): JSX.Element | null {
  if (!producto || !producto.id) return null;

  const { isLogged, isAdmin, favoritos, addFavorito, removeFavorito } = useUser();
  const router = useRouter();
  const { trackProductClick } = useTracking();
  const primeraImagenTieneWatermark = Boolean(producto.imagenesWatermark?.[0]);
  const isFav = favoritos?.some((p) => p.id === producto.id);


  const isVisualOnlyProduct =
  producto.categoria === "1785564342207";

  const hasVariations =
    producto?.hasVariations || producto?.isCamiseta || false;
  const stockVariants = producto?.stockVariants || [];

  const totalStock = hasVariations
    ? stockVariants.reduce((sum: number, v: any) => sum + (v?.cantidad || 0), 0) || 0
    : producto?.stock || 0;
  const sinStock = totalStock === 0;

  const { discount, hasDiscount, fakeOldPrice, finalPrice } =
    getCatalogPricing(producto);

  const getDetailUrl = () => {
    let detailUrl = `/product-detail?id=${producto.id}`;
    try {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        detailUrl = `/admin/product-detail?id=${producto.id}`;
      } else {
        if (isAdmin) detailUrl = `/admin/product-detail?id=${producto.id}`;
      }
    } catch {
      if (isAdmin) detailUrl = `/admin/product-detail?id=${producto.id}`;
    }
    return detailUrl;
  };

  const detailUrl = getDetailUrl();

  const goToDetail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    trackProductClick().catch(console.error);
    router.push(detailUrl);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isFav ? removeFavorito(producto.id) : addFavorito(producto);
  };

  return (
    <>
      <style>{cardStyles}</style>
      <Link
        href={detailUrl}
        className="pc-link"
        style={{
          opacity: 0,
          animation: "pc-fadeIn 0.4s ease forwards",
          animationDelay: `${index * 80}ms`,
        }}
      >
        <div className="pc-card" onClick={onClick || goToDetail}>
          {/* ── IMAGEN ── */}
          <div className="pc-img-wrap">
            {/* Imagen del producto */}
            {producto.imagenes && producto.imagenes.length > 0 && (
              <img
                src={producto.imagenes[0]}
                alt={producto.nombre}
                loading="lazy"
              />
            )}

            {/* Badge descuento */}
            {hasDiscount && (
              <div className="pc-badge-discount">-{discount}%</div>
            )}

            {/* Sin stock */}
            {sinStock && (
              <div className="pc-no-stock">
                <span>Sin stock</span>
              </div>
            )}

            {/* Favorito */}
            {isLogged && showFav && (
              <button
                onClick={handleFav}
                className={`pc-fav${isFav ? " is-fav" : ""}`}
                title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <span className="material-icons-round" style={{ fontSize: 15 }}>
                  {isFav ? "favorite" : "favorite_border"}
                </span>
              </button>
            )}
          </div>

          {/* ── INFO ── */}
          <div className="pc-info">
            <span className="pc-name">{producto.nombre}</span>

            {!isVisualOnlyProduct && (
              <div className="pc-prices">
                {hasDiscount && (
                  <span className="pc-price-old">
                    ${fakeOldPrice.toFixed(2)}
                  </span>
                )}

                <span className="pc-price-final">
                  ${finalPrice.toFixed(2)}{" "}
                  <span className="pc-price-currency">USD</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </>
  );
}

export default React.memo(ProductoCard, (prevProps, nextProps) => {
  return (
    prevProps.producto.id === nextProps.producto.id &&
    prevProps.showFav === nextProps.showFav
  );
});