"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTracking } from "../lib/useAnalytics";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";
import styles from "./Footer.module.css";
import { themeManager } from "./themeManager";

/* ---------------- Iconos redes ---------------- */

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const IconWhatsApp = () => (
  <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.908 7.593c-1.747 0-3.48-.53-4.942-1.49L7.793 24.41l1.132-3.337a8.955 8.955 0 0 1-1.72-5.272c0-4.955 4.04-8.995 8.997-8.995S25.2 10.845 25.2 15.8c0 4.958-4.04 8.998-8.998 8.998zm0-19.798c-5.96 0-10.8 4.842-10.8 10.8 0 1.964.53 3.898 1.546 5.574L5 27.176l5.974-1.92a10.807 10.807 0 0 0 16.03-9.455c0-5.958-4.842-10.8-10.802-10.8z" />
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------------- Iconos de pago (genéricos, no marcas exactas) ---------------- */

const PayVisa = () => (
  <div className={styles.ftPayCard} style={{ background: "#1a1f71" }}>
    <span style={{ color: "#fff", fontStyle: "italic" }}>VISA</span>
  </div>
);

const PayMastercard = () => (
  <div className={styles.ftPayCard} style={{ background: "#f4f4f4" }}>
    <span style={{ position: "relative", width: 26, height: 16, display: "inline-block" }}>
      <span style={{ position: "absolute", left: 0, width: 16, height: 16, borderRadius: "50%", background: "#eb001b", opacity: 0.9 }} />
      <span style={{ position: "absolute", right: 0, width: 16, height: 16, borderRadius: "50%", background: "#f79e1b", opacity: 0.9, mixBlendMode: "multiply" }} />
    </span>
  </div>
);

const PayAmex = () => (
  <div className={styles.ftPayCard} style={{ background: "#2e77bc" }}>
    <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.03em" }}>AMEX</span>
  </div>
);

const PayDiners = () => (
  <div className={styles.ftPayCard} style={{ background: "#f4f4f4" }}>
    <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#0079be", display: "inline-block" }} />
  </div>
);

const PayMaestro = () => (
  <div className={styles.ftPayCard} style={{ background: "#f4f4f4" }}>
    <span style={{ position: "relative", width: 26, height: 16, display: "inline-block" }}>
      <span style={{ position: "absolute", left: 0, width: 16, height: 16, borderRadius: "50%", background: "#0099df", opacity: 0.9 }} />
      <span style={{ position: "absolute", right: 0, width: 16, height: 16, borderRadius: "50%", background: "#ed0006", opacity: 0.9, mixBlendMode: "multiply" }} />
    </span>
  </div>
);

/* ---------------- Datos del negocio ---------------- */

const WHATSAPP_NUMBER = "593986080164"; // solo números, con código de país, sin '+' ni espacios
const WHATSAPP_DISPLAY = "+593 98 608 0164"; // como se muestra al usuario
const INSTAGRAM_URL = "https://www.instagram.com/importadoratlas/";
const DEV_INSTAGRAM_URL = "https://www.instagram.com/hector.cobena/";

const socialLinks = [
  { href: INSTAGRAM_URL, label: "Instagram", Icon: IconInstagram },
  { href: `https://wa.me/${WHATSAPP_NUMBER}`, label: "WhatsApp", Icon: IconWhatsApp },
];

const helpLinks = [
  { href: "/como-comprar", label: "Cómo comprar" },
  { href: "/medios-de-pago", label: "Medios de pago" },
  { href: "/envios", label: "¿Cómo son los envíos?" },
  { href: "/garantia", label: "Garantía y devoluciones" },
  { href: "/contacto", label: "Contacto" },
];

const policyLinks = [
  { href: "/politicas/envios", label: "Política de envíos" },
  { href: "/politicas/devoluciones", label: "Política de devoluciones" },
  { href: "/politicas/privacidad", label: "Política de privacidad" },
  { href: "/politicas/condiciones", label: "Condiciones de servicio" },
];

const Footer: React.FC = () => {
  const pathname = usePathname();
  const { trackLinkClick } = useTracking();
  const [theme, setTheme] = useState("dark");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkTheme = () => setTheme(themeManager.getTheme());
    checkTheme();
    const handler = () => checkTheme();
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const showWhatsAppFloating = pathname && !pathname.startsWith("/admin");
  const isLight = theme === "light";
  const borderColor = isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.18)";
  const softBorder = isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.14)";

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: conectar a tu proveedor de newsletter (Firestore, Resend, etc.)
    setEmail("");
  };

  return (
    <>
      <footer className={styles.ftRoot} style={{ background: "var(--bg)", color: "var(--footerText)" }}>
        <div className={styles.ftGlowLeft} />
        <div className={styles.ftGlowRight} />

        <div className={styles.ftContainer}>
          {/* Marca + descripción */}
          <div className={styles.ftIntro}>
            <h2 className={styles.ftBrand} style={{ color: "var(--text)" }}>
              Importadora Atlas — Tecnología que simplifica tu vida.
            </h2>
            <p className={styles.ftIntroText} style={{ color: "var(--textSecondary)" }}>
              Importamos tecnología directamente desde China con foco en calidad, garantía real y una
              experiencia de compra en línea segura, rápida y con envíos a todo Ecuador.
            </p>
          </div>

          {/* Grid: newsletter / ayuda / políticas */}
          <div className={styles.ftGrid}>
            <div className={styles.ftCol}>
              <h3 className={styles.ftColTitle} style={{ color: "var(--text)" }}>Newsletter</h3>
              <p className={styles.ftColText} style={{ color: "var(--textSecondary)" }}>
                Entérate antes que nadie de nuevos productos y ofertas.
              </p>
              <form className={styles.ftNewsletter} onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className={styles.ftNewsletterInput}
                  style={{ borderColor: softBorder, color: "var(--text)" }}
                />
                <button
                  type="submit"
                  aria-label="Suscribirse"
                  className={styles.ftNewsletterBtn}
                  style={{ color: "var(--text)" }}
                >
                  <IconArrow />
                </button>
              </form>
            </div>

            <div className={styles.ftCol}>
              <h3 className={styles.ftColTitle} style={{ color: "var(--text)" }}>Ayuda</h3>
              <ul className={styles.ftList}>
                {helpLinks.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className={styles.ftLink}
                      style={{ color: "var(--textSecondary)" }}
                      onClick={() => trackLinkClick().catch(console.error)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.ftCol}>
              <h3 className={styles.ftColTitle} style={{ color: "var(--text)" }}>Nuestras políticas</h3>
              <ul className={styles.ftList}>
                {policyLinks.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className={styles.ftLink}
                      style={{ color: "var(--textSecondary)" }}
                      onClick={() => trackLinkClick().catch(console.error)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* WhatsApp de contacto directo */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className={styles.ftWhatsappLine}
            style={{ color: "var(--textSecondary)" }}
            onClick={() => trackLinkClick().catch(console.error)}
          >
            <IconWhatsApp />
            <span>{WHATSAPP_DISPLAY}</span>
          </a>

          {/* Redes sociales centradas */}
          <ul className={styles.ftSocials}>
            {socialLinks.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  className={styles.ftSocialsLink}
                  style={{ borderColor, color: "var(--text)" }}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  onClick={() => trackLinkClick().catch(console.error)}
                >
                  <Icon />
                </a>
              </li>
            ))}
          </ul>

          <div className={styles.ftDivider} style={{ background: softBorder }} />

          {/* Métodos de pago */}
          <div className={styles.ftPayments}>
            <PayVisa />
            <PayMastercard />
            <PayAmex />
            <PayDiners />
            <PayMaestro />
          </div>

          {/* Copyright + créditos */}
          <div className={styles.ftCopyRow}>
            <p className={styles.ftCopyText} style={{ color: isLight ? "#64748b" : "#cccccc" }}>
              © {new Date().getFullYear()} Importadora Atlas. Todos los derechos reservados.
            </p>
            <div className={styles.ftCopyRight}>
              <div
                className={styles.ftBadge}
                style={{
                  background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.06)",
                  borderColor,
                  color: "var(--text)",
                }}
              >
                <div className={styles.ftBadgeDot} />
                Envíos a todo el país
              </div>
              <a
                href={DEV_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className={styles.ftDevLink}
                style={{ color: isLight ? "#64748b" : "#ffffff" }}
                onClick={() => trackLinkClick().catch(console.error)}
              >
                Desarrollado por Héctor Cobeña
              </a>
            </div>
          </div>
        </div>
      </footer>

      {showWhatsAppFloating && (
        <WhatsAppFloatingButton
          phoneNumber={WHATSAPP_NUMBER}
          message="Hola, quiero información sobre Importadora Atlas"
        />
      )}
    </>
  );
};

export default Footer;