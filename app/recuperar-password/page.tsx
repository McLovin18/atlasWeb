"use client";
import { useState } from "react";
import BottomBarPublic from "../components/BottomBarPublic";
import { sendPasswordResetEmail } from "../lib/firebase-auth";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSent(false);
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <BottomBarPublic />
      <div style={{ background: "var(--cardBg)", borderColor: "var(--border)" }} className="w-full max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-xl border">
        <h2 style={{ color: "var(--text)" }} className="text-2xl font-bold mb-4 text-center">Recuperar contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              borderColor: "var(--border)",
              background: "var(--bgSecondary)",
              color: "var(--text)"
            }}
            className="w-full p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-white/30"
            required
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors duration-200 shadow-md disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>
        {sent && <div className="mt-4 text-green-600 text-center">Revisa tu correo para restablecer tu contraseña.</div>}
        {sent && <div className="mt-2 text-green-600 text-xs text-center">Si no la encuentras en la parte principal, revisa en SPAM.</div>}

        {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
      </div>
    </div>
  );
}

