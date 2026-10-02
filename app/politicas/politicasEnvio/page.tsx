"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BottomBarPublic from "../../components/BottomBarPublic";
import { themeManager } from "../../components/themeManager";

const sections = [
  {
    number: "01",
    title: "Cobertura",
    body: "Realizamos envíos a todo Ecuador continental a través de Servientrega u otros couriers autorizados. Por el momento no realizamos envíos a Galápagos ni fuera del país.",
  },
  {
    number: "02",
    title: "Costo de Envío y Recargos",
    body: "El costo de envío es de $5.00 USD a cualquier ciudad de Ecuador continental. Los pagos con tarjeta de crédito o débito tienen un recargo del 7% sobre el valor total de los productos. El valor final — incluyendo envío y recargo — se muestra en el checkout antes de confirmar la compra. Promociones de envío gratis aplican únicamente cuando se indique expresamente en el sitio web o campañas oficiales de Importadora Atlas.",
  },
  {
    number: "03",
    title: "Tiempos de Entrega",
    body: "Guayaquil: 1 a 2 días hábiles desde la confirmación del pago. Otras ciudades principales: 2 a 5 días hábiles. Ciudades secundarias: 3 a 7 días hábiles. Los tiempos se cuentan desde que Datafast confirma el pago. Pedidos realizados en fines de semana o feriados se procesan el siguiente día hábil.",
    hasTable: true,
  },
  {
    number: "04",
    title: "Proceso de Despacho",
    body: "Una vez aprobado tu pago recibirás un correo de confirmación de pedido. Cuando tu pedido sea despachado, recibirás un segundo correo con el número de guía para rastreo. Es responsabilidad del cliente proporcionar una dirección correcta y completa — Importadora Atlas no se responsabiliza por retrasos o pérdidas por dirección incorrecta.",
  },
  {
    number: "05",
    title: "Entrega",
    body: "El courier realizará hasta 2 intentos de entrega en la dirección registrada. Si no hay quien reciba, el paquete retornará a nuestra bodega y se coordinará el reenvío — el costo del segundo envío corre por cuenta del cliente. Al recibir tu pedido, verifica que el empaque esté sellado. Si notas adulteración, no recibas el paquete y repórtanos de inmediato.",
  },
  {
    number: "06",
    title: "Retrasos",
    body: "Importadora Atlas no se responsabiliza por retrasos ocasionados por el courier, eventos de fuerza mayor, feriados, desastres naturales, o problemas de orden público que impidan la entrega en el tiempo estimado.",
  },
  {
    number: "07",
    title: "Retiro en Bodega",
    body: "Importadora Atlas es una tienda 100% virtual. No contamos con tienda física ni opción de retiro en bodega. Todos los pedidos se envían por courier a la dirección que indiques en el checkout.",
  },
  {
    number: "08",
    title: "Contacto",
    body: null,
    isContact: true,
  },
];

const tiempos = [
  { ciudad: "Guayaquil", tiempo: "1 – 2 días hábiles" },
  { ciudad: "Ciudades principales", tiempo: "2 – 5 días hábiles" },
  { ciudad: "Ciudades secundarias", tiempo: "3 – 7 días hábiles" },
];

const PoliticasEnvio: React.FC = () => {
  const lineRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const checkTheme = () => setTheme(themeManager.getTheme());
    checkTheme();
    const handler = () => checkTheme();
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const isLight = theme === "light";

  useEffect(() => {
    const handleScroll = () => {
      if (!lineRef.current) return;
      const el = lineRef.current;
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const progress = Math.min(Math.max((windowH - rect.top) / (rect.height + windowH), 0), 1);
      el.style.setProperty("--progress", String(progress));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((_, i) => {
      const el = document.getElementById(`env-section-${i}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisible((prev) => new Set(prev).add(i)); },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      <BottomBarPublic />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }
        body { background: #080808; }

        .env-root {
          background: ${isLight ? '#ffffff' : '#080808'};
          color: ${isLight ? '#1e293b' : '#e8e4f0'};
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
        }

        .env-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        /* ── HERO ── */
        .env-hero {
          position: relative;
          padding: 80px 24px 60px;
          text-align: center;
          overflow: hidden;
        }

        .env-glow {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220,180,50,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .env-glow2 {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220,180,50,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .env-badge {
          display: inline-block;
          border: 1px solid rgba(220,180,50,0.4);
          color: #dcb432;
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 2px;
          margin-bottom: 24px;
        }

        .env-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(52px, 10vw, 100px);
          letter-spacing: 0.04em;
          line-height: 0.9;
          color: ${isLight ? '#1e293b' : '#ffffff'};
          margin: 0 0 20px;
        }

        .env-title span { color: #dcb432; }

        .env-subtitle {
          color: ${isLight ? '#64748b' : '#6b6480'};
          font-size: 14px;
          font-weight: 300;
          max-width: 480px;
          margin: 0 auto 12px;
          line-height: 1.6;
        }

        .env-date {
          color: ${isLight ? '#94a3b8' : '#3d3a4a'};
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .env-divider {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #dcb432, transparent);
          margin: 32px auto;
        }

        /* ── HIGHLIGHTS (costo + recargo) ── */
        .env-highlights {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin: 0 auto 48px;
          max-width: 860px;
          padding: 0 24px;
        }

        .env-highlight-card {
          flex: 1;
          min-width: 160px;
          border: 1px solid rgba(220,180,50,0.2);
          border-radius: 10px;
          background: #0e0e12;
          padding: 18px 20px;
          text-align: center;
        }

        .env-highlight-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #dcb432;
          letter-spacing: 0.05em;
          line-height: 1;
          margin-bottom: 4px;
        }

        .env-highlight-label {
          font-size: 11px;
          color: ${isLight ? '#64748b' : '#5a5570'};
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ── BODY ── */
        .env-body {
          position: relative;
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px 100px;
        }

        /* ── TIMELINE LINE ── */
        .env-line {
          position: absolute;
          left: 43px;
          top: 0;
          bottom: 80px;
          width: 1px;
          background: rgba(220,180,50,0.08);
        }

        .env-line::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 1px;
          background: linear-gradient(180deg, #dcb432 0%, rgba(220,180,50,0.3) 100%);
          height: calc(var(--progress, 0) * 100%);
          transition: height 0.1s linear;
        }

        @media (max-width: 640px) {
          .env-line { display: none; }
        }

        /* ── ROW ── */
        .env-row {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .env-row.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── NUMBER ── */
        .env-num {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(220,180,50,0.25);
          background: rgba(220,180,50,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: #dcb432;
          letter-spacing: 0.05em;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 640px) {
          .env-num { display: none; }
        }

        /* ── CARD ── */
        .env-card {
          flex: 1;
          border: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'};
          border-radius: 12px;
          padding: 22px 26px;
          background: ${isLight ? '#ffffff' : '#0e0e12'};
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
          margin-bottom: 8px;
        }

        .env-card:hover {
          border-color: rgba(220,180,50,0.2);
          box-shadow: ${isLight ? '0 0 0 1px rgba(220,180,50,0.08), 0 20px 50px rgba(0,0,0,0.08)' : '0 0 0 1px rgba(220,180,50,0.08), 0 20px 50px rgba(0,0,0,0.6)'};
          transform: translateY(-1px);
        }

        .env-card-title {
          font-weight: 600;
          font-size: 14px;
          color: ${isLight ? '#1e293b' : '#ffffff'};
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }

        .env-card-body {
          font-size: 13px;
          line-height: 1.75;
          color: ${isLight ? '#475569' : '#e8e4f0'};
          font-weight: 300;
        }

        /* ── TABLA TIEMPOS ── */
        .env-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
        }

        .env-table tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .env-table tr:last-child {
          border-bottom: none;
        }

        .env-table td {
          padding: 9px 0;
          font-size: 12px;
          font-weight: 300;
        }

        .env-table td:first-child {
          color: ${isLight ? '#64748b' : '#7a7490'};
          width: 55%;
        }

        .env-table td:last-child {
          color: #dcb432;
          font-weight: 600;
          text-align: right;
          letter-spacing: 0.02em;
        }

        /* ── CONTACT CARD ── */
        .env-contact-card {
          flex: 1;
          border: 1px solid rgba(220,180,50,0.2);
          border-radius: 12px;
          padding: 26px 30px;
          background: linear-gradient(135deg, #0e0e12, #121018);
          box-shadow: 0 0 0 1px rgba(220,180,50,0.06), 0 20px 60px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .env-contact-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #dcb432;
          margin-bottom: 6px;
        }

        .env-contact-desc {
          font-size: 13px;
          color: ${isLight ? '#64748b' : '#5a5570'};
          margin-bottom: 14px;
          font-weight: 300;
        }

        .env-btn {
          display: inline-block;
          background: #dcb432;
          color: #080808;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.05em;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s;
        }

        .env-btn:hover {
          background: #f0ca50;
          transform: translateY(-1px);
        }

        /* ── CONSENT ── */
        .env-consent {
          border: 1px solid rgba(220,180,50,0.1);
          border-radius: 10px;
          background: ${isLight ? '#f8fafc' : '#0c0c10'};
          padding: 18px 24px;
          font-size: 12px;
          color: ${isLight ? '#64748b' : '#5a5570'};
          text-align: center;
          margin-bottom: 40px;
          font-weight: 300;
          line-height: 1.6;
        }

        .env-consent strong { color: #dcb432; font-weight: 600; }

        /* ── FOOTER ── */
        .env-footer {
          text-align: center;
          border-top: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.04)'};
          padding-top: 40px;
          margin-top: 20px;
        }

        .env-footer p {
          font-size: 12px;
          color: ${isLight ? '#64748b' : '#3a3750'};
          margin-bottom: 16px;
          font-weight: 300;
        }

        .env-footer a {
          color: #dcb432;
          font-size: 12px;
          text-decoration: none;
          letter-spacing: 0.05em;
        }

        .env-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="env-root">

        {/* ── HERO ── */}
        <div className="env-hero" style={{ position: "relative", zIndex: 1 }}>
          <div className="env-glow" />
          <div className="env-glow2" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="env-badge">Documento Legal · Ecuador</div>
            <h1 className="env-title">
              POLÍTICAS DE<br /><span>ENVÍO</span>
            </h1>
            <p className="env-subtitle">
              Todo lo que necesitas saber sobre cómo despachamos y entregamos tu pedido en Ecuador.
            </p>
            <p className="env-date">Última actualización: 01 de Octubre de 2026</p>
            <div className="env-divider" />
          </div>
        </div>

        {/* ── HIGHLIGHTS ── */}
        <div className="env-highlights" style={{ zIndex: 1, position: "relative" }}>
          <div className="env-highlight-card">
            <div className="env-highlight-value">$5.00</div>
            <div className="env-highlight-label">Costo de envío fijo</div>
          </div>
          <div className="env-highlight-card">
            <div className="env-highlight-value">+7%</div>
            <div className="env-highlight-label">Recargo pago con tarjeta</div>
          </div>
          <div className="env-highlight-card">
            <div className="env-highlight-value">1–7</div>
            <div className="env-highlight-label">Días hábiles de entrega</div>
          </div>
          <div className="env-highlight-card">
            <div className="env-highlight-value">100%</div>
            <div className="env-highlight-label">Ecuador continental</div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="env-body" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="env-line"
            ref={lineRef}
            style={{ "--progress": "0" } as React.CSSProperties}
          />

          {sections.map((s, i) =>
            s.isContact ? (
              <div
                key={s.number}
                id={`env-section-${i}`}
                className={`env-row${visible.has(i) ? " visible" : ""}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="env-num">{s.number}</div>
                <div className="env-contact-card">
                  <div>
                    <p className="env-contact-label">Contacto</p>
                    <p className="env-contact-desc">
                      Consultas sobre tu envío — escríbenos con tu número de pedido.
                    </p>
                    <a href="mailto:importaciones.Atlas@hotmail.com" className="env-btn">
                      importaciones.Atlas@hotmail.com
                    </a>
                  </div>
                  <div style={{ fontSize: "12px", color: isLight ? "#64748b" : "#3a3750", textAlign: "right", lineHeight: 1.8 }}>
                    <div style={{ color: isLight ? "#64748b" : "#5a5570", marginBottom: 4 }}>WhatsApp</div>
                    <div style={{ color: "#dcb432", fontWeight: 600 }}>+593 98 280 4800</div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={s.number}
                id={`env-section-${i}`}
                className={`env-row${visible.has(i) ? " visible" : ""}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="env-num">{s.number}</div>
                <div className="env-card">
                  <p className="env-card-title">{s.title}</p>
                  <p className="env-card-body">{s.body}</p>

                  {/* Tabla de tiempos en sección 03 */}
                  {s.hasTable && (
                    <table className="env-table">
                      <tbody>
                        {tiempos.map((row) => (
                          <tr key={row.ciudad}>
                            <td>{row.ciudad}</td>
                            <td>{row.tiempo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          )}

          {/* NOTA FINAL */}
          <div className="env-consent">
            <strong>Importadora Atlas</strong> — RUC: [TU RUC] · Domicilio: Guayaquil, Ecuador.<br />
            Los tiempos de entrega son estimados y pueden variar por factores externos al control de Importadora Atlas.
          </div>

          {/* FOOTER */}
          <div className="env-footer">
            <p>¿Tienes dudas sobre tu pedido? Estamos aquí para ayudarte.</p>
            <Link href="/">← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoliticasEnvio;