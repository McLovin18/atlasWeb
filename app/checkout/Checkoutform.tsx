"use client";

import { useState } from "react";
import DatafastWidget from "./DatafastWidget";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio?: number;
  precioBase?: number;
  precioUnitario?: number;
  imagen?: string;
  cartKey?: string;
  selectedTalla?: string;
  selectedColor?: string;
  selectedVariations?: Record<string, string>;
  variationAttributeIds?: string[];
}

interface CheckoutFormProps {
  items: Producto[];
  subtotal: number;
  costoEnvio: number;
  total: number;
}

interface DatosCliente {
  nombre: string;
  apellido: string;
  identificacion: string;
  email: string;
  telefono: string;
  provincia: string;
  ciudad: string;
  direccion: string;
}

// ── Provincias Ecuador ────────────────────────────────────────────────────────

const PROVINCIAS = [
  "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi",
  "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja",
  "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana",
  "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas",
  "Sucumbíos", "Tungurahua", "Zamora Chinchipe"
];

// ── Componente ────────────────────────────────────────────────────────────────

export default function CheckoutForm({ items, subtotal, costoEnvio, total }: CheckoutFormProps) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [pedidoId, setPedidoId] = useState<string>("");
  const [pedidoDocId, setPedidoDocId] = useState<string>("");
  const [checkoutId, setCheckoutId] = useState<string>("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Partial<DatosCliente>>({});
  const [checkoutError, setCheckoutError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [shippingPolicyAccepted, setShippingPolicyAccepted] = useState(false);
  const [forceRetry, setForceRetry] = useState(false);

  const [datos, setDatos] = useState<DatosCliente>({
    nombre: "",
    apellido: "",
    identificacion: "",
    email: "",
    telefono: "",
    provincia: "Guayas",
    ciudad: "",
    direccion: "",
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setDatos(prev => ({ ...prev, [name]: value }));
    setCheckoutError("");
    if (errores[name as keyof DatosCliente]) {
      setErrores(prev => ({ ...prev, [name]: undefined }));
    }
  }

  function validar(): boolean {
    const nuevosErrores: Partial<DatosCliente> = {};
    if (!datos.nombre.trim()) nuevosErrores.nombre = "Campo requerido";
    if (!datos.apellido.trim()) nuevosErrores.apellido = "Campo requerido";
    if (!datos.identificacion.trim()) nuevosErrores.identificacion = "Campo requerido";
    // Valida que sea cédula (10 dígitos) o RUC (13 dígitos)
    if (!/^\d{10}$|^\d{13}$/.test(datos.identificacion)) {
      nuevosErrores.identificacion = "Cédula (10 dígitos) o RUC (13 dígitos)";
    }
    if (!datos.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) nuevosErrores.email = "Email inválido";
    if (!datos.telefono.match(/^0\d{9}$/)) nuevosErrores.telefono = "Ej: 0999999999";
    if (!datos.ciudad.trim()) nuevosErrores.ciudad = "Campo requerido";
    if (!datos.direccion.trim()) nuevosErrores.direccion = "Campo requerido";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

async function handleProcederAlPago() {
    if (!validar()) return;
    if (!privacyAccepted) {
      setCheckoutError("Debes aceptar la Política de Privacidad y los Términos para continuar.");
      return;
    }
    if (!shippingPolicyAccepted) {
      setCheckoutError("Debes aceptar las Políticas de Envío para continuar.");
      return;
    }

    setCheckoutError("");
    setCargando(true);
    try {
      const res = await fetch("/api/datafast/iniciar-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: {
            nombre: `${datos.nombre} ${datos.apellido}`.trim(),
            nombreSolo: datos.nombre.trim(),
            apellido: datos.apellido.trim(),
            identificacion: (datos.identificacion || "").trim(),
            email: datos.email.trim(),
            telefono: datos.telefono.trim(),
          },
          direccion: {
            provincia: datos.provincia,
            ciudad: datos.ciudad.trim(),
            direccion: datos.direccion.trim(),
          },
          productos: items.map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
            cartKey: item.cartKey,
            selectedTalla: item.selectedTalla,
            selectedColor: item.selectedColor,
            selectedVariations: item.selectedVariations,
            variationAttributeIds: item.variationAttributeIds,
            nombre: item.nombre,
            precio: item.precioUnitario || item.precioBase || item.precio,
          })),
          subtotal,
          costoEnvio,
          total,
          forceRetry,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.checkoutId || !json.pedidoId || !json.orderId) {
        if (json.error === "Request is already being processed") {
          setCheckoutError("Por favor espera unos segundos e intenta nuevamente");
          setForceRetry(true);
          setCargando(false);
          return;
        }
        throw new Error(json.error || "Error al iniciar pago");
      }

      setPedidoDocId(json.pedidoId);
      setPedidoId(json.orderId);
      setCheckoutId(json.checkoutId);
      setPaso(3);
      setForceRetry(false);
    } catch (err) {
      console.error(err);
      setCheckoutError(err instanceof Error ? err.message : "Ocurrió un error al procesar tu pedido.");
    } finally {
      setCargando(false);
    }
  }

  function getVariantSummary(item: Producto) {
    if (item.selectedVariations && Array.isArray(item.variationAttributeIds)) {
      return item.variationAttributeIds
        .map((attrId) => item.selectedVariations?.[attrId])
        .filter(Boolean)
        .join(" · ");
    }

    const parts = [];
    if (item.selectedTalla) parts.push(`Talla: ${item.selectedTalla}`);
    if (item.selectedColor) parts.push(`Color: ${item.selectedColor}`);
    return parts.join(" · ");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="checkout-wrapper">
      {/* Indicador de pasos */}
      <div className="stepper">
        {[
          { num: 1, label: "Mis datos" },
          { num: 2, label: "Resumen" },
          { num: 3, label: "Pago" },
        ].map((s, i) => (
          <div key={s.num} className="step-item">
            <div className={`step-circle ${paso === s.num ? "active" : paso > s.num ? "done" : ""}`}>
              {paso > s.num ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : s.num}
            </div>
            <span className={`step-label ${paso === s.num ? "active" : ""}`}>{s.label}</span>
            {i < 2 && <div className={`step-line ${paso > s.num ? "done" : ""}`} />}
          </div>
        ))}
      </div>

      <div className="checkout-content">
        {checkoutError && (
          <div className="error-banner">
            {checkoutError}
          </div>
        )}

        {/* ─── PASO 1: Datos del cliente ─── */}
        {paso === 1 && (
          <div className="form-section">
            <h2 className="section-title">Datos de envío</h2>

            <div className="form-grid">
              <Field label="Nombre" name="nombre" value={datos.nombre} onChange={handleChange} error={errores.nombre} placeholder="Juan" />
              <Field label="Apellido" name="apellido" value={datos.apellido} onChange={handleChange} error={errores.apellido} placeholder="Pérez" />
            </div>

            <div className="form-grid">
              <Field label="Identificación (Cédula/RUC)" name="identificacion" value={datos.identificacion} onChange={handleChange} error={errores.identificacion} placeholder="0999999999" />
            </div>

            <div className="form-grid">
              <Field label="Correo electrónico" name="email" type="email" value={datos.email} onChange={handleChange} error={errores.email} placeholder="juan@gmail.com" fullWidth />
            </div>

            <div className="form-grid">
              <Field label="Teléfono" name="telefono" type="tel" value={datos.telefono} onChange={handleChange} error={errores.telefono} placeholder="0999999999" />
            </div>

            <div className="form-divider">
              <span>Dirección de entrega</span>
            </div>

            <div className="form-grid">
              <div className="field-group">
                <label className="field-label">Provincia</label>
                <select name="provincia" value={datos.provincia} onChange={handleChange} className="field-select">
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <Field label="Ciudad" name="ciudad" value={datos.ciudad} onChange={handleChange} error={errores.ciudad} placeholder="Guayaquil" />
            </div>

            <div className="form-grid">
              <Field label="Dirección completa" name="direccion" value={datos.direccion} onChange={handleChange} error={errores.direccion} placeholder="Av. Principal 123, Urb. Las Palmas" fullWidth />
            </div>

            <button className="btn-primary" onClick={() => { if (validar()) setPaso(2); }}>
              Ver resumen del pedido
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ─── PASO 2: Resumen del pedido ─── */}
        {paso === 2 && (
          <div className="form-section">
            <h2 className="section-title">Resumen del pedido</h2>

            <div className="resumen-cliente">
              <p className="resumen-nombre">{datos.nombre} {datos.apellido}</p>
              <p className="resumen-info">{datos.email} · {datos.telefono}</p>
              <p className="resumen-info">{datos.direccion}, {datos.ciudad}, {datos.provincia}</p>
              <button className="btn-edit" onClick={() => setPaso(1)}>Editar datos</button>
            </div>

            <div className="productos-lista">
              {items.map(item => (
                <div key={item.cartKey || item.id} className="producto-row">
                  {item.imagen && (
                    <div className="producto-img-wrap">
                      <img src={item.imagen} alt={item.nombre} className="producto-img" />
                    </div>
                  )}
                  <div className="producto-info">
                    <p className="producto-nombre">{item.nombre}</p>
                    <p className="producto-qty">Cantidad: {item.cantidad}</p>
                    {getVariantSummary(item) && (
                      <p className="producto-variant">{getVariantSummary(item)}</p>
                    )}
                  </div>
                  <p className="producto-precio">${((item.precioUnitario || item.precioBase || item.precio || 0) * item.cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="totales-section">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Envío</span>
                <span>${costoEnvio.toFixed(2)}</span>
              </div>
              <div className="total-row total-bold">
                <span>Total a pagar</span>
                <span className="total-amount">${total.toFixed(2)}</span>
              </div>
            </div>

                    <label className="privacy-check">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      />
                      <span>
                        Confirmo que he leído y acepto la <a href="/politicas/privacidad" target="_blank" rel="noreferrer">Política de Privacidad</a> y haber leído los <a href="/politicas/terminos-y-condiciones" target="_blank" rel="noreferrer">términos y condiciones</a>.
                      </span>
                    </label>

                    <label className="privacy-check">
                      <input
                        type="checkbox"
                        checked={shippingPolicyAccepted}
                        onChange={(e) => setShippingPolicyAccepted(e.target.checked)}
                      />
                      <span>
                        Confirmo que he leído y acepto las <a href="/politicas/politicasEnvio" target="_blank" rel="noreferrer">Políticas de Envío</a>.
                      </span>
                    </label>

                    <button className="btn-primary" onClick={handleProcederAlPago} disabled={cargando || !privacyAccepted || !shippingPolicyAccepted}>
              {cargando ? (
                <>
                  <span className="spinner" />
                  Procesando...
                </>
              ) : (
                <>
                  Proceder al pago
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── PASO 3: Widget Datafast ─── */}
        {paso === 3 && checkoutId && pedidoDocId && (
          <div className="form-section">
            <h2 className="section-title">Pago seguro</h2>
            <p className="pago-info">
              Pedido <strong className="pedido-id">#{pedidoId}</strong> · Total:{" "}
              <strong className="total-highlight">${total.toFixed(2)}</strong>
            </p>
            <DatafastWidget key={checkoutId} checkoutId={checkoutId} pedidoId={pedidoDocId} />
          </div>
        )}
      </div>

      {/* ─── Estilos ─── */}
      <style jsx>{`
        .checkout-wrapper {
          max-width: 640px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        /* Stepper */
        .stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 48px;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #555;
          background: #111;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-circle.active {
          border-color: #dcb432;
          color: #dcb432;
          background: rgba(220, 180, 50, 0.08);
          box-shadow: 0 0 16px rgba(220, 180, 50, 0.2);
        }
        .step-circle.done {
          border-color: #dcb432;
          background: #dcb432;
          color: #080808;
        }
        .step-label {
          font-size: 12px;
          color: #555;
          margin-left: 8px;
          white-space: nowrap;
          transition: color 0.3s;
        }
        .step-label.active { color: #dcb432; }
        .step-line {
          width: 48px;
          height: 2px;
          background: #222;
          margin: 0 12px;
          transition: background 0.3s;
        }
        .step-line.done { background: #dcb432; }

        /* Form */
        .checkout-content { width: 100%; }
        .error-banner {
          margin-bottom: 20px;
          border: 1px solid rgba(224, 85, 85, 0.4);
          background: rgba(224, 85, 85, 0.08);
          color: #f5b4b4;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.5;
        }
        .form-section {
          animation: fadeSlide 0.4s ease both;
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          letter-spacing: 3px;
          color: #f0ece0;
          margin: 0 0 28px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px;
          color: #555;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .form-divider::before,
        .form-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #222;
        }
        .field-select {
          width: 100%;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 12px 14px;
          color: #f0ece0;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .field-select:focus { border-color: #dcb432; }

        /* Resumen */
        .resumen-cliente {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          position: relative;
        }
        .resumen-nombre {
          font-weight: 600;
          font-size: 17px;
          margin: 0 0 6px;
        }
        .resumen-info {
          font-size: 14px;
          color: #888;
          margin: 2px 0;
        }
        .btn-edit {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: 1px solid #333;
          color: #888;
          padding: 4px 12px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-edit:hover { border-color: #dcb432; color: #dcb432; }

        .productos-lista {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .producto-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
        }
        .producto-img-wrap {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: #1a1a1a;
        }
        .producto-img { width: 100%; height: 100%; object-fit: cover; }
        .producto-info { flex: 1; }
        .producto-nombre { font-weight: 500; font-size: 15px; margin: 0 0 4px; }
        .producto-qty { font-size: 13px; color: #666; margin: 0; }
        .producto-variant { font-size: 12px; color: #777; margin: 4px 0 0; }
        .producto-precio { font-weight: 600; font-size: 16px; color: #dcb432; flex-shrink: 0; }

        .totales-section {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-top: 1px solid #1e1e1e;
        }
        .total-row:first-child {
          border-top: none;
          padding-top: 0;
        }
        .total-bold {
          font-weight: 600;
          color: #dcb432;
          border-top: 2px solid #2a2a2a;
          padding-top: 16px;
          margin-top: 8px;
        }
          margin-bottom: 28px;
          font-size: 18px;
          font-weight: 500;
        }
        .total-amount {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 2px;
          color: #dcb432;
        }

        /* Pago step */
        .pago-info {
          font-size: 15px;
          color: #888;
          margin-bottom: 28px;
        }
        .pedido-id { color: #f0ece0; }
        .total-highlight { color: #dcb432; }

        .privacy-check {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.5;
        }
        .privacy-check input {
          margin-top: 2px;
        }
        .privacy-check a {
          color: #dcb432;
          text-decoration: none;
        }
        .privacy-check a:hover {
          text-decoration: underline;
        }

        /* Botón principal */
        .btn-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          background: #dcb432;
          color: #080808;
          border: none;
          border-radius: 10px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #e8c43e;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(220, 180, 50, 0.3);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #080808;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 520px) {
          .form-grid { grid-template-columns: 1fr; }
          .step-label { display: none; }
          .step-line { width: 32px; margin: 0 8px; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-componente Field ──────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, error, placeholder, type = "text", fullWidth = false
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`field-group ${fullWidth ? "full-width" : ""}`}>
      <label className="field-label">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`field-input ${error ? "error" : ""}`}
        autoComplete="on"
      />
      {error && <span className="field-error">{error}</span>}
      <style jsx>{`
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .full-width { grid-column: 1 / -1; }
        .field-label { font-size: 13px; font-weight: 500; color: #888; letter-spacing: 0.5px; }
        .field-input {
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 12px 14px;
          color: #f0ece0;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: #3a3a3a; }
        .field-input:focus {
          border-color: #dcb432;
          box-shadow: 0 0 0 3px rgba(220, 180, 50, 0.1);
        }
        .field-input.error { border-color: #e05555; }
        .field-error { font-size: 12px; color: #e05555; }
      `}</style>
    </div>
  );
}
