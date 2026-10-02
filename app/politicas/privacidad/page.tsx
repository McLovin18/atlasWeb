"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BottomBarPublic from "../../components/BottomBarPublic";
import { themeManager } from "../../components/themeManager";

const sections = [
  {
    number: "01",
    title: "Responsable del Tratamiento de Datos",
    body: "Importadora Atlas, Tienda de tecnología. Domiciliada en Ecuador. Correo para temas de privacidad: importaciones.Atlas@hotmail.com — WhatsApp: +593 98 280 4800.",
  },
  {
    number: "02",
    title: "Qué datos recolectamos y para qué",
    body: "Nombre, apellido y cédula/RUC para emitir factura electrónica SRI y verificar identidad. Dirección de envío y facturación para entregar tu pedido. Teléfono y correo para confirmar compra, envío y soporte post-venta. Datos de navegación (IP, cookies) para seguridad y mejorar la web. Número de WhatsApp para atender pedidos y soporte, con tu consentimiento.",
  },
  {
    number: "03",
    title: "Pagos con Tarjeta — Datafast",
    body: "Para tu seguridad, NO almacenamos los datos de tu tarjeta. Todos los pagos online son procesados directamente por Datafast S.A., pasarela certificada bajo estándar PCI DSS Nivel 1. Tus datos viajan cifrados hacia Datafast sin pasar por nuestros servidores. Solo recibimos confirmación de pago aprobado y los últimos 4 dígitos. Si eliges guardar tarjeta, Datafast usa tokenización segura.",
  },
  {
    number: "04",
    title: "Pedidos por WhatsApp",
    body: "Al escribirnos al +593 98 280 4800, nos autorizas a usar tu número, nombre y el contenido del chat únicamente para: cotizar y procesar tu pedido, enviarte el estado de tu compra y guía de envío, y darte soporte post-venta. No usaremos tu número para publicidad sin tu consentimiento. Puedes pedir que eliminemos la conversación cuando quieras.",
  },
  {
    number: "05",
    title: "Con quién compartimos tus datos",
    body: "Solo compartimos lo mínimo necesario con: Datafast S.A. para procesar pagos; empresas de courier como Servientrega o Tramaco para entregar tu pedido; el SRI para emitir tu factura electrónica; Meta/Facebook y Google solo si aceptas cookies para mostrarte anuncios relevantes; y nuestro proveedor de hosting para que la web funcione. No vendemos ni alquilamos tus datos personales a nadie.",
  },
  {
    number: "06",
    title: "Tus Derechos ARCO",
    body: "Tienes derecho a: Acceso (saber qué datos tenemos tuyos), Rectificación (corregir datos incorrectos), Cancelación (eliminar tu cuenta y datos) y Oposición (que no usemos tus datos para marketing). Escríbenos a importaciones.Atlas@hotmail.com con tu cédula y solicitud. Responderemos dentro de los plazos establecidos por la normativa ecuatoriana.",
  },
  {
    number: "07",
    title: "Cookies",
    body: "Usamos cookies esenciales para que la web y el carrito funcionen; cookies analíticas con Google Analytics para conocer qué productos gustan más; y cookies de publicidad con Píxel de Meta para mostrarte anuncios si dejaste el carrito abandonado. Al entrar por primera vez verás un banner para aceptar o rechazar cookies no esenciales.",
  },
  {
    number: "08",
    title: "Seguridad de tu Información",
    body: "Nuestra web usa certificado SSL: el candado en el navegador significa que la conexión es cifrada. Aplicamos medidas razonables de seguridad para proteger la información de nuestros clientes.",
  },
  {
    number: "09",
    title: "Menores de Edad",
    body: "Los servicios están dirigidos a personas con capacidad legal para contratar. Los menores deberán actuar a través de sus representantes legales.",
  },
  {
    number: "10",
    title: "Cambios a esta Política",
    body: "Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios serán publicados en esta misma página y entrarán en vigor desde su publicación.",
  },
  {
    number: "11",
    title: "Autoridad de Control",
    body: "En Ecuador, la autoridad competente es la Superintendencia de Protección de Datos. Si crees que vulneramos tus derechos, puedes reclamar ante ellos, pero primero escríbenos y lo solucionamos.",
  },
  {
    number: "12",
    title: "Contacto",
    body: null,
    isContact: true,
  },
];

const PoliticaPrivacidad: React.FC = () => {
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
      const el = document.getElementById(`section-${i}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible((prev) => new Set(prev).add(i));
          }
        },
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

        body {
          background: #080808;
        }

        .pp-root {
          background: ${isLight ? '#ffffff' : '#080808'};
          color: ${isLight ? '#1e293b' : '#e8e4f0'};
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
        }

        /* ── NOISE TEXTURE OVERLAY ── */
        .pp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        /* ── HERO ── */
        .pp-hero {
          position: relative;
          padding: 80px 24px 60px;
          text-align: center;
          overflow: hidden;
        }

        .pp-hero-glow {
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

        .pp-hero-glow2 {
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

        .pp-badge {
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

        .pp-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(52px, 10vw, 100px);
          letter-spacing: 0.04em;
          line-height: 0.9;
          color: ${isLight ? '#1e293b' : '#ffffff'};
          margin: 0 0 20px;
        }

        .pp-title span {
          color: #dcb432;
        }

        .pp-subtitle {
          color: ${isLight ? '#64748b' : '#6b6480'};
          font-size: 14px;
          font-weight: 300;
          max-width: 480px;
          margin: 0 auto 12px;
          line-height: 1.6;
        }

        .pp-date {
          color: ${isLight ? '#94a3b8' : '#3d3a4a'};
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        /* ── DIVIDER ── */
        .pp-divider {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #dcb432, transparent);
          margin: 32px auto;
        }

        /* ── BODY ── */
        .pp-body {
          position: relative;
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px 100px;
        }

        /* ── TIMELINE LINE ── */
        .tc-line {
          position: absolute;
          left: 43px;
          top: 0;
          bottom: 80px;
          width: 1px;
          background: rgba(220,180,50,0.08);
        }

        .tc-line::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          background: linear-gradient(180deg, #dcb432 0%, rgba(220,180,50,0.3) 100%);
          height: calc(var(--progress, 0) * 100%);
          transition: height 0.1s linear;
        }

        /* ── SECTION ROW ── */
        .pp-row {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .pp-row.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── NUMBER BADGE ── */
        .pp-num {
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

        /* ── CARD ── */
        .pp-card {
          flex: 1;
          border: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'};
          border-radius: 12px;
          padding: 22px 26px;
          background: ${isLight ? '#ffffff' : '#0e0e12'};
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
          margin-bottom: 8px;
        }

        .pp-card:hover {
          border-color: rgba(220,180,50,0.2);
          box-shadow: ${isLight ? '0 0 0 1px rgba(220,180,50,0.08), 0 20px 50px rgba(0,0,0,0.08)' : '0 0 0 1px rgba(220,180,50,0.08), 0 20px 50px rgba(0,0,0,0.6)'};
          transform: translateY(-1px);
        }

        .pp-card-title {
          font-weight: 600;
          font-size: 14px;
          color: ${isLight ? '#1e293b' : '#ffffff'};
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }

        .pp-card-body {
          font-size: 13px;
          line-height: 1.75;
          color: ${isLight ? '#475569' : '#ffffff'};
          font-weight: 300;
        }

        /* ── CONTACT CARD ── */
        .pp-contact-card {
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

        .pp-contact-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #dcb432;
          margin-bottom: 6px;
        }

        .pp-contact-desc {
          font-size: 13px;
          color: ${isLight ? '#64748b' : '#ffffff'};
          margin-bottom: 14px;
          font-weight: 300;
        }

        .pp-btn {
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

        .pp-btn:hover {
          background: #f0ca50;
          transform: translateY(-1px);
        }

        /* ── FOOTER ── */
        .pp-footer {
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.04);
          padding-top: 40px;
          margin-top: 20px;
        }

        .pp-footer p {
          font-size: 12px;
          color: ${isLight ? '#64748b' : '#ffffff'};
          margin-bottom: 16px;
          font-weight: 300;
        }

        .pp-footer a {
          color: #dcb432;
          font-size: 12px;
          text-decoration: none;
          letter-spacing: 0.05em;
        }

        .pp-footer a:hover {
          text-decoration: underline;
        }

        /* ── CONSENT BAR ── */
        .pp-consent {
          border: 1px solid rgba(220,180,50,0.1);
          border-radius: 10px;
          background: #0c0c10;
          padding: 18px 24px;
          font-size: 12px;
          color: #ffffff;
          text-align: center;
          margin-bottom: 40px;
          font-weight: 300;
          line-height: 1.6;
        }

        .pp-consent strong {
          color: #dcb432;
          font-weight: 600;
        }
      `}</style>

      <div className="pp-root">

        {/* HERO */}
        <div className="pp-hero" style={{ position: "relative", zIndex: 1 }}>
          <div className="pp-hero-glow" />
          <div className="pp-hero-glow2" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="pp-badge">Documento Legal · Ecuador</div>
            <h1 className="pp-title">
              POLÍTICA DE<br /><span>PRIVACIDAD</span>
            </h1>
            <p className="pp-subtitle">
              En Importadora Atlas protegemos tu información personal. Aquí te explicamos con transparencia cómo recopilamos y usamos tus datos.
            </p>
            <p className="pp-date">Última actualización: 01 de Octubre de 2026</p>
            <div className="pp-divider" />
          </div>
        </div>

        {/* BODY */}
        <div className="pp-body" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="tc-line"
            ref={lineRef}
            style={{ "--progress": "0" } as React.CSSProperties}
          />

          {sections.map((s, i) =>
            s.isContact ? (
              <div
                key={s.number}
                id={`section-${i}`}
                className={`pp-row${visible.has(i) ? " visible" : ""}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="pp-num">{s.number}</div>
                <div className="pp-contact-card">
                  <div>
                    <p className="pp-contact-label">Contacto</p>
                    <p className="pp-contact-desc">
                      Escríbenos para cualquier consulta sobre privacidad o ejercer tus derechos ARCO.
                    </p>
                    <a href="mailto:importaciones.Atlas@hotmail.com" className="pp-btn">
                      importaciones.Atlas@hotmail.com
                    </a>
                  </div>
                  <div style={{ fontSize: "12px", color: "#3a3750", textAlign: "right", lineHeight: 1.8 }}>
                    <div style={{ color: "#5a5570", marginBottom: 4 }}>WhatsApp</div>
                    <div style={{ color: "#dcb432", fontWeight: 600 }}>+593 98 280 4800</div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={s.number}
                id={`section-${i}`}
                className={`pp-row${visible.has(i) ? " visible" : ""}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="pp-num">{s.number}</div>
                <div className="pp-card">
                  <p className="pp-card-title">{s.title}</p>
                  <p className="pp-card-body">{s.body}</p>
                </div>
              </div>
            )
          )}

          {/* CONSENT NOTE */}
          <div className="pp-consent">
            Al usar <strong>importadoratlas.com</strong> y marcar la casilla <strong>"Acepto la Política de Privacidad"</strong> en el checkout, confirmas que leíste y estás de acuerdo con este documento. Conforme a la <strong>Ley Orgánica de Protección de Datos Personales de Ecuador</strong>.
          </div>

          {/* FOOTER */}
          <div className="pp-footer">
            <p>Gracias por confiar en Importadora Atlas. Tu privacidad es lo primero.</p>
            <Link href="/">← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoliticaPrivacidad;