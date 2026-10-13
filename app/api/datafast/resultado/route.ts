import { NextRequest, NextResponse } from "next/server";
import { applyStockDeltaToProduct } from "../../../lib/order-checkout-utils";
import admin from "../../../lib/firebase-admin";
import { Resend } from "resend";

// ── Configuración Datafast ─────────────────────────────────────────────────────

const DATAFAST_BASE_URL = process.env.DATAFAST_BASE_URL;
const DATAFAST_ENTITY_ID = process.env.DATAFAST_ENTITY_ID;
const DATAFAST_AUTH_TOKEN = process.env.DATAFAST_AUTH_TOKEN;

// Códigos estándar OPP: éxito (incluye modo test 000.100.11x) y pendiente
const SUCCESS_REGEX = /^(000\.000\.|000\.100\.1|000\.[36])/;
const PENDING_REGEX = /^(000\.200|000\.400\.0[^3]|000\.400\.100)/;
const RESOURCE_PATH_REGEX = /^\/v1\/checkouts\/[A-Za-z0-9._-]+\/payment$/;

// Ruta de tu página de pago (ajusta si es distinta)
const CHECKOUT_PATH = "/checkout";

// ── Helper: Verificar estado del pago en Datafast ───────────────────────────────

async function getPaymentStatus(resourcePath: string): Promise<any> {
  if (!DATAFAST_BASE_URL || !DATAFAST_ENTITY_ID || !DATAFAST_AUTH_TOKEN) {
    throw new Error("Faltan credenciales de Datafast");
  }

  const url = `${DATAFAST_BASE_URL}${resourcePath}?entityId=${DATAFAST_ENTITY_ID}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${DATAFAST_AUTH_TOKEN}` },
    cache: "no-store",
  });

  const data = await response.json();
  
  console.log("=== DATAFAST PAYMENT STATUS RESPONSE ===");
  console.log("URL:", url);
  console.log("Status:", response.status);
  console.log("Full JSON Response:", JSON.stringify(data, null, 2));
  console.log("Result Code:", data?.result?.code);
  console.log("Result Description:", data?.result?.description);
  console.log("Result Extended Description:", data?.result?.extendedDescription);
  console.log("Payment ID:", data?.id);
  console.log("Amount:", data?.amount);
  console.log("Currency:", data?.currency);
  console.log("Payment Type:", data?.paymentType);
  console.log("=========================================");

  if (!response.ok) {
    console.error("Datafast status error:", data?.result);
    throw new Error(data.result?.description || "Error al verificar pago");
  }

  return data;
}

// ── Helper: Actualizar stock de productos ───────────────────────────────────────

async function actualizarStockOrden(orden: any, delta: number): Promise<void> {
  const adminDb = admin.firestore();
  const productos = orden.productos || [];

  for (const item of productos) {
    try {
      const prodRef = adminDb.collection("productos").doc(item.id);
      const prodSnap = await prodRef.get();

      if (!prodSnap.exists) {
        console.error(`Producto no encontrado: ${item.id}`);
        continue;
      }

      const stockUpdate = applyStockDeltaToProduct(prodSnap.data(), item, delta);
      await prodRef.update(stockUpdate);
      console.log(`[Stock Update] Producto ${item.id}: delta=${delta}`);
    } catch (err) {
      console.error(`[Stock Update] Error con producto ${item?.id}:`, err);
    }
  }
}

// ── Helper: Enviar correos de pago exitoso ───────────────────────────────────────

async function enviarCorreosPagoExitoso(orden: any): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[enviarCorreosPagoExitoso] RESEND_API_KEY no configurado");
    return;
  }

  const resend = new Resend(resendApiKey);
  const adminEmail = process.env.ADMIN_EMAIL || "soporte@tecnothings.com";
  const fromEmail = process.env.FROM_EMAIL || "pedidos@importadoratlas.com";
  const replyToEmail = process.env.REPLY_TO_EMAIL || "soporte@importadoratlas.com";
  const clienteEmail = orden.cliente?.email;

  if (!clienteEmail) {
    console.error("[enviarCorreosPagoExitoso] No hay email del cliente");
    return;
  }

  // Correo al cliente
  try {
    await resend.emails.send({
      from: fromEmail,
      to: clienteEmail,
      subject: `¡Pago exitoso! Tu pedido ${orden.orderId} ha sido confirmado — Importadora Atlas`,
      html: buildOrderEmailHTML(orden),
      replyTo: replyToEmail,
    });
    console.log(`✅ [Email Cliente] Enviado a ${clienteEmail}`);
  } catch (err) {
    console.error("[enviarCorreosPagoExitoso] Error email cliente:", err);
  }

  // Correo al dueño/admin
  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Nuevo pedido pagado: ${orden.orderId} — Importadora Atlas`,
      html: buildAdminEmailHTML(orden),
      replyTo: clienteEmail,
    });
    console.log(`✅ [Email Admin] Enviado a ${adminEmail}`);
  } catch (err) {
    console.error("[enviarCorreosPagoExitoso] Error email admin:", err);
  }
}

// ── Helpers de HTML para correos ─────────────────────────────────────────────────

// Escapa datos del usuario antes de meterlos en el HTML del correo
function esc(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: any): string {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

function buildProductRows(orden: any): string {
  if (!orden.productos || !Array.isArray(orden.productos) || orden.productos.length === 0) {
    return "<tr><td colspan='4' style='padding:12px;text-align:center;color:#999;'>No hay productos</td></tr>";
  }

  return orden.productos
    .map((p: any) => {
      const cantidad = Number(p.cantidad || 1);
      const precio = Number(p.precioFinal || p.precioBase || p.precio || 0);
      const subtotal = precio * cantidad;
      const imagen = p.imagenes?.[0] || "";
      return `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                      <td style="padding:12px 8px;font-size:13px;color:#374151;">
                        ${imagen ? `<img src="${esc(imagen)}" alt="${esc(p.nombre)}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:12px;vertical-align:middle;">` : ""}
                        <strong>${esc(p.nombre || "Producto")}</strong>
                      </td>
                      <td style="padding:12px 8px;text-align:center;font-size:13px;color:#374151;">${cantidad}</td>
                      <td style="padding:12px 8px;text-align:right;font-size:13px;color:#374151;">$${precio.toFixed(2)}</td>
                      <td style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#dcb432;">$${subtotal.toFixed(2)}</td>
                    </tr>`;
    })
    .join("");
}

function buildFooterHTML(brandName: string): string {
  return `
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Este correo fue enviado automáticamente por ${esc(brandName)}</p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} ${esc(brandName)}. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>`;
}

function buildOrderEmailHTML(orden: any): string {
  const brandName = process.env.BRAND_NAME || "Importadora Atlas";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #dcb432 0%, #c9a32d 100%);border-radius:12px 12px 0 0;">
          <tr>
            <td style="padding:32px;text-align:center;color:white;">
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:bold;">🎉 ¡Pago Exitoso!</h1>
              <p style="margin:0;font-size:14px;opacity:0.9;">Tu pedido ha sido confirmado</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px 36px;">
              <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;">
                <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Número de pedido</p>
                <p style="margin:0;font-size:24px;font-weight:bold;color:#16a34a;">${esc(orden.orderId || "N/A")}</p>
                <p style="margin:8px 0 0;font-size:13px;color:#666;">Fecha: ${orden.createdAt ? esc(new Date(orden.createdAt).toLocaleDateString("es-ES")) : "N/A"}</p>
              </div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Resumen del pedido</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
                    <th style="padding:12px 8px;text-align:left;font-size:13px;font-weight:bold;color:#374151;">Producto</th>
                    <th style="padding:12px 8px;text-align:center;font-size:13px;font-weight:bold;color:#374151;width:60px;">Cant.</th>
                    <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#374151;width:100px;">Precio</th>
                    <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#374151;width:100px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildProductRows(orden)}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Subtotal:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${money(orden.subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Envío:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${money(orden.costoEnvio)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:bold;">
                  <span style="color:#1f2937;">Total:</span>
                  <span style="color:#16a34a;">$${money(orden.total)}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px 20px;">
                <p style="margin:0 0 12px;font-size:14px;color:#0369a1;font-weight:bold;">📦 Dirección de envío</p>
                <p style="margin:0 0 8px;font-size:14px;color:#0369a1;">
                  ${esc(orden.direccion?.direccion || "N/A")}, ${esc(orden.direccion?.ciudad || "N/A")}
                </p>
                <p style="margin:0;font-size:14px;color:#0369a1;">
                  ${esc(orden.direccion?.provincia || "N/A")}
                </p>
              </div>
            </td>
          </tr>
        </table>
        ${buildFooterHTML(brandName)}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildAdminEmailHTML(orden: any): string {
  const brandName = process.env.BRAND_NAME || "Importadora Atlas";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #dcb432 0%, #c9a32d 100%);border-radius:12px 12px 0 0;">
          <tr>
            <td style="padding:32px;text-align:center;color:white;">
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:bold;">💰 Nuevo Pedido Pagado</h1>
              <p style="margin:0;font-size:14px;opacity:0.9;">Pedido confirmado y pagado</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px 36px;">
              <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;">
                <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Número de pedido</p>
                <p style="margin:0;font-size:24px;font-weight:bold;color:#16a34a;">${esc(orden.orderId || "N/A")}</p>
                <p style="margin:8px 0 0;font-size:13px;color:#666;">Total: $${money(orden.total)}</p>
              </div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Información del contacto</h2>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Nombre:</strong> ${esc(orden.cliente?.nombre || "N/A")}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Email:</strong> ${esc(orden.cliente?.email || "N/A")}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Teléfono:</strong> ${esc(orden.cliente?.telefono || "N/A")}</p>
              <p style="margin:0;font-size:14px;color:#374151;"><strong>Identificación:</strong> ${esc(orden.cliente?.identificacion || "N/A")}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Dirección de envío</h2>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;">${esc(orden.direccion?.direccion || "N/A")}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;">${esc(orden.direccion?.ciudad || "N/A")}, ${esc(orden.direccion?.provincia || "N/A")}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Productos del pedido</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
                    <th style="padding:12px 8px;text-align:left;font-size:13px;font-weight:bold;color:#374151;">Producto</th>
                    <th style="padding:12px 8px;text-align:center;font-size:13px;font-weight:bold;color:#374151;width:60px;">Cant.</th>
                    <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#374151;width:100px;">Precio</th>
                    <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#374151;width:100px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildProductRows(orden)}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Subtotal:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${money(orden.subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Envío:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${money(orden.costoEnvio)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:bold;">
                  <span style="color:#1f2937;">Total:</span>
                  <span style="color:#dcb432;">$${money(orden.total)}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>
        ${buildFooterHTML(brandName)}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── Helpers de redirección ──────────────────────────────────────────────────────

function redirigir(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.nextUrl.origin));
}

// Vuelve al checkout mostrando el error real junto al formulario
function volverAlCheckout(req: NextRequest, pedidoId: string, mensaje: string, errorId?: string) {
  const url = new URL(CHECKOUT_PATH, req.nextUrl.origin);
  url.searchParams.set("pedidoId", pedidoId);
  url.searchParams.set("paymentError", mensaje);
  if (errorId && errorId !== "N/A") {
    url.searchParams.set("paymentErrorId", errorId);
  }
  url.searchParams.set("retry", "1"); // la página debe pedir un checkoutId nuevo
  return NextResponse.redirect(url);
}


// ── Procesar resultado de pago de Datafast ───────────────────────────────────────

async function procesarResultado(req: NextRequest): Promise<NextResponse> {
  console.log("=== DATAFAST CALLBACK START ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  
  const rawBody = await req.text();
  console.log("Raw Body:", rawBody);
  console.log("================================");

  const { searchParams } = req.nextUrl;
  const resourcePathParam = searchParams.get("resourcePath");
  const checkoutId = searchParams.get("id"); // Datafast envía el checkoutId como "id"
  const merchantTransactionId = searchParams.get("merchantTransactionId");

  console.log("resourcePathParam:", resourcePathParam);
  console.log("checkoutId:", checkoutId);
  console.log("merchantTransactionId:", merchantTransactionId);

  // Datafast envía el checkoutId, necesitamos buscar la orden por checkoutId
  if (!checkoutId) {
    console.error("[Datafast Result] No checkoutId in request");
    return redirigir(req, "/");
  }

  try {
    const adminDb = admin.firestore();
    
    // Buscar orden por checkoutId
    const ordenQuery = adminDb.collection("ordenes").where("checkoutId", "==", checkoutId).limit(1);
    const ordenSnap = await ordenQuery.get();
    
    if (ordenSnap.empty) {
      console.error("[Datafast Result] Orden no encontrada con checkoutId:", checkoutId);
      return redirigir(req, "/");
    }
    
    const ordenDoc = ordenSnap.docs[0];
    const pedidoId = ordenDoc.id;
    const orden = ordenDoc.data();
    
    console.log("[Datafast Result] Orden encontrada:", pedidoId);

    if (!orden) return redirigir(req, "/");

    // Ya procesada → éxito
    if (orden.estado === "pagada" || orden.estado === "completada") {
      console.log("[Datafast Result] Orden ya procesada como pagada");
      return redirigir(req, `/checkout/success?pedidoId=${pedidoId}`);
    }

    // Determinar y validar resourcePath
    let resourcePath = resourcePathParam;
    if (resourcePath) {
      if (!RESOURCE_PATH_REGEX.test(resourcePath)) {
        console.error("[Datafast Result] resourcePath inválido:", resourcePath);
        return volverAlCheckout(req, pedidoId, "No se pudo verificar el pago. Intenta nuevamente.");
      }
      // El checkout debe ser el de esta orden
      if (orden.checkoutId && !resourcePath.includes(`/${orden.checkoutId}/`)) {
        console.error("[Datafast Result] checkoutId no coincide con la orden");
        return volverAlCheckout(req, pedidoId, "No se pudo verificar el pago. Intenta nuevamente.");
      }
    } else if (orden.checkoutId) {
      resourcePath = `/v1/checkouts/${orden.checkoutId}/payment`;
    } else {
      await adminDb.collection("ordenes").doc(pedidoId).update({ estado: "pendiente_verificacion" });
      return redirigir(req, `/checkout/pending?pedidoId=${pedidoId}`);
    }

    console.log("[Datafast Result] Consultando estado del pago en:", resourcePath);
    const paymentData = await getPaymentStatus(resourcePath);
    const code: string = paymentData.result?.code || "";
    const descripcion: string =
      paymentData.result?.extendedDescription ||
      paymentData.result?.description ||
      "El pago fue rechazado. Verifica los datos e intenta nuevamente.";
    
    // Capturar el ID del pago/error de Datafast
    const paymentId = paymentData.id || paymentData.paymentId || "N/A";
    console.log("Datafast Payment ID:", paymentId);
    console.log("Datafast Error Code:", code);
    console.log("Datafast Error Description:", descripcion);

    // ── Éxito ──
    if (SUCCESS_REGEX.test(code)) {
      console.log("[Datafast Result] Pago exitoso");
      // El monto pagado debe coincidir con el total de la orden
      const pagado = Number(paymentData.amount);
      const esperado = Number(orden.total);
      if (!Number.isFinite(pagado) || Math.abs(pagado - esperado) > 0.01) {
        console.error(`[Datafast Result] Monto no coincide: pagado=${pagado} esperado=${esperado}`);
        await adminDb.collection("ordenes").doc(pedidoId).update({
          estado: "pendiente_verificacion",
          paymentStatus: "amount_mismatch",
          paymentCode: code,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return redirigir(req, `/checkout/pending?pedidoId=${pedidoId}`);
      }

      // Transacción: solo UNA request "reclama" la orden (evita doble stock/correos)
      const ordenRef = adminDb.collection("ordenes").doc(pedidoId);
      const reclamada = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ordenRef);
        const estado = snap.data()?.estado;
        if (estado === "pagada" || estado === "completada") return false;
        tx.update(ordenRef, {
          estado: "pagada",
          paymentStatus: "success",
          paymentId: paymentData.id,
          paymentCode: code,
          paymentDescription: paymentData.result?.description || "",
          paymentExtendedDescription: paymentData.result?.extendedDescription || "",
          paidAt: new Date().toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true;
      });

      if (reclamada) {
        await actualizarStockOrden(orden, -1);
        await enviarCorreosPagoExitoso(orden);
      }

      return redirigir(req, `/checkout/success?pedidoId=${pedidoId}`);
    }

    // ── Pendiente ──
    if (PENDING_REGEX.test(code)) {
      console.log("[Datafast Result] Pago pendiente");
      await adminDb.collection("ordenes").doc(pedidoId).update({
        estado: "pendiente_verificacion",
        paymentStatus: "pending",
        paymentCode: code,
        paymentDescription: paymentData.result?.description || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return redirigir(req, `/checkout/pending?pedidoId=${pedidoId}`);
    }

    // ── Rechazo / error de validación: volver al checkout con el error visible ──
    console.log("❌ PAGO FALLIDO:", code, descripcion);

    // Si es un error de validación (código 100.100.400), marcar como error de validación
    // para que el frontend pueda mostrar el error localmente si es posible
    if (code === "100.100.400" || code.startsWith("100.")) {
      await adminDb.collection("ordenes").doc(pedidoId).update({
        estado: "error_validacion",
        paymentStatus: "validation_failed",
        paymentCode: code,
        paymentDescription: descripcion,
        paymentId: paymentId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await adminDb.collection("ordenes").doc(pedidoId).update({
        estado: "rechazada",
        paymentStatus: "failed",
        paymentCode: code,
        paymentDescription: descripcion,
        paymentId: paymentId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return volverAlCheckout(req, pedidoId, descripcion, paymentId);
  } catch (error: any) {
    console.error("[datafast-resultado] Error:", error);
    return volverAlCheckout(
      req,
      pedidoId || "",
      "No se pudo confirmar el pago. Por favor intenta nuevamente."
    );
  }
}

export async function GET(req: NextRequest) {
  return procesarResultado(req);
}

// Datafast puede retornar por POST en algunos flujos 3DS
export async function POST(req: NextRequest) {
  return procesarResultado(req);
}