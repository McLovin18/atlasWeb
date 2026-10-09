import { NextRequest, NextResponse } from "next/server";
import { applyStockDeltaToProduct } from "../../../lib/order-checkout-utils";
import admin from "../../../lib/firebase-admin";
import { Resend } from "resend";

// ── Configuración Datafast ─────────────────────────────────────────────────────

const DATAFAST_BASE_URL = process.env.DATAFAST_BASE_URL;
const DATAFAST_ENTITY_ID = process.env.DATAFAST_ENTITY_ID;
const DATAFAST_AUTH_TOKEN = process.env.DATAFAST_AUTH_TOKEN;

// ── Helper: Verificar estado del pago en Datafast ───────────────────────────────

async function getPaymentStatus(resourcePath: string): Promise<any> {
  if (!DATAFAST_BASE_URL || !DATAFAST_ENTITY_ID || !DATAFAST_AUTH_TOKEN) {
    throw new Error("Faltan credenciales de Datafast");
  }

  const url = `${DATAFAST_BASE_URL}${resourcePath}?entityId=${DATAFAST_ENTITY_ID}`;

  console.log("[Datafast] Verificando pago con URL:", url);
  console.log("[Datafast] Auth token:", DATAFAST_AUTH_TOKEN?.substring(0, 10) + "...");

  // Usar Bearer token igual que en iniciar-pago
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DATAFAST_AUTH_TOKEN}`,
    },
  });

  const data = await response.json();

  console.log("[Datafast] Response status:", response.status);
  console.log("[Datafast] Response data:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    console.error("Datafast status error:", data);
    throw new Error(data.result?.description || "Error al verificar pago");
  }

  return data;
}

// ── Helper: Actualizar stock de productos ───────────────────────────────────────

async function actualizarStockOrden(orden: any, delta: number): Promise<void> {
  const adminDb = admin.firestore();
  const productos = orden.productos || [];

  for (const item of productos) {
    const prodRef = adminDb.collection("productos").doc(item.id);
    const prodSnap = await prodRef.get();

    if (!prodSnap.exists) {
      console.error(`Producto no encontrado: ${item.id}`);
      continue;
    }

    const productData = prodSnap.data();
    const stockUpdate = applyStockDeltaToProduct(productData, item, delta);

    await prodRef.update(stockUpdate);
    console.log(`[Stock Update] Producto ${item.id}: delta=${delta}`, stockUpdate);
  }
}

// ── Helper: Enviar correos de pago exitoso ───────────────────────────────────────

async function enviarCorresPagoExitoso(orden: any): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[enviarCorresPagoExitoso] RESEND_API_KEY no configurado");
    return;
  }

  const resend = new Resend(resendApiKey);
  const adminEmail = process.env.ADMIN_EMAIL || "soporte@tecnothings.com";
  const fromEmail = process.env.FROM_EMAIL || "pedidos@importadoratlas.com";
  const replyToEmail = process.env.REPLY_TO_EMAIL || "soporte@importadoratlas.com";
  const clienteEmail = orden.cliente?.email;

  if (!clienteEmail) {
    console.error("[enviarCorresPagoExitoso] No hay email del cliente");
    return;
  }

  // Enviar correo al cliente
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
    console.error("[enviarCorresPagoExitoso] Error enviando email al cliente:", err);
  }

  // Enviar correo al dueño/admin
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
    console.error("[enviarCorresPagoExitoso] Error enviando email al admin:", err);
  }
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
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%);border-radius:12px 12px 0 0;">
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
                <p style="margin:0;font-size:24px;font-weight:bold;color:#16a34a;">${orden.orderId || "N/A"}</p>
                <p style="margin:8px 0 0;font-size:13px;color:#666;">Fecha: ${orden.createdAt ? new Date(orden.createdAt).toLocaleDateString("es-ES") : "N/A"}</p>
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
                  ${
                    orden.productos && Array.isArray(orden.productos)
                      ? orden.productos.map((p: any) => {
                          const cantidad = Number(p.cantidad || 1);
                          const precio = Number(p.precioFinal || p.precioBase || p.precio || 0);
                          const subtotal = precio * cantidad;
                          return `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                      <td style="padding:12px 8px;font-size:13px;color:#374151;">
                        <strong>${p.nombre || "Producto"}</strong>
                      </td>
                      <td style="padding:12px 8px;text-align:center;font-size:13px;color:#374151;">${cantidad}</td>
                      <td style="padding:12px 8px;text-align:right;font-size:13px;color:#374151;">$${precio.toFixed(2)}</td>
                      <td style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#6d28d9;">$${subtotal.toFixed(2)}</td>
                    </tr>
                  `;
                        })
                      : "<tr><td colspan=4 style='padding:12px;text-align:center;color:#999;'>No hay productos</td></tr>"
                  }
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Subtotal:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${(orden.subtotal || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Envío:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${(orden.costoEnvio || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:bold;">
                  <span style="color:#1f2937;">Total:</span>
                  <span style="color:#16a34a;">$${(orden.total || 0).toFixed(2)}</span>
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
                  ${orden.direccion?.direccion || "N/A"}, ${orden.direccion?.ciudad || "N/A"}
                </p>
                <p style="margin:0;font-size:14px;color:#0369a1;">
                  ${orden.direccion?.provincia || "N/A"}
                </p>
              </div>
            </td>
          </tr>
        </table>
        <tr>
          <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Este correo fue enviado automáticamente por ${brandName}</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
          </td>
        </tr>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildAdminEmailHTML(orden: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width>
</head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #059669 0%, #10b981 100%);border-radius:12px 12px 0 0;">
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
                <p style="margin:0;font-size:24px;font-weight:bold;color:#16a34a;">${orden.orderId || "N/A"}</p>
                <p style="margin:8px 0 0;font-size:13px;color:#666;">Total: $${(orden.total || 0).toFixed(2)}</p>
              </div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Información del cliente</h2>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Nombre:</strong> ${orden.cliente?.nombre || "N/A"}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Email:</strong> ${orden.cliente?.email || "N/A"}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Teléfono:</strong> ${orden.cliente?.telefono || "N/A"}</p>
              <p style="margin:0;font-size:14px;color:#374151;"><strong>Identificación:</strong> ${orden.cliente?.identificacion || "N/A"}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Dirección de envío</h2>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;">${orden.direccion?.direccion || "N/A"}</p>
              <p style="margin:0 0 4px;font-size:14px;color:#374151;">${orden.direccion?.ciudad || "N/A"}, ${orden.direccion?.provincia || "N/A"}</p>
            </td>
          </tr>
        </table>
        <tr>
          <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Este correo fue enviado automáticamente por ${brandName}</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
          </td>
        </tr>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── POST: Capturar datos del pago desde Datafast ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Datafast POST] Body recibido:", JSON.stringify(body, null, 2));

    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("pedidoId");

    return NextResponse.json({
      message: "POST recibido",
      body,
      pedidoId,
    });
  } catch (error) {
    console.error("[Datafast POST] Error:", error);
    return NextResponse.json(
      { error: "Error al procesar POST" },
      { status: 500 }
    );
  }
}

// ── GET: Procesar resultado del pago ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("pedidoId");
    const resourcePath = searchParams.get("resourcePath");

    console.log("[Datafast Result] Todos los parámetros recibidos:");
    searchParams.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!pedidoId) {
      return NextResponse.json(
        { error: "Falta pedidoId" },
        { status: 400 }
      );
    }

    // Obtener la orden usando admin SDK
    const adminDb = admin.firestore();
    const ordenRef = adminDb.collection("ordenes").doc(pedidoId);
    const ordenSnap = await ordenRef.get();

    if (!ordenSnap.exists) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const orden = ordenSnap.data();

    // Si ya está procesada, redirigir a página de éxito
    if (orden.estado === "pagada" || orden.estado === "completada") {
      return NextResponse.redirect(
        new URL(`/checkout/success?pedidoId=${pedidoId}`, req.url)
      );
    }

    // Si hay resourcePath, verificar el estado del pago en Datafast
    if (resourcePath) {
      console.log("[Datafast Result] Verificando pago con resourcePath:", resourcePath);
      const paymentData = await getPaymentStatus(resourcePath);
      const paymentStatus = paymentData.result?.code;

      console.log("[Datafast Result] Payment status:", paymentStatus);
      console.log("[Datafast Result] Payment data:", JSON.stringify(paymentData, null, 2));

      // Códigos de éxito según Datafast
      // 000.100.110 = Payment successful
      // 000.100.112 = Payment pending (3DS)
      // 000.100.113 = Payment pending (external)
      if (paymentStatus === "000.100.110" || paymentStatus === "000.200.100") {
        // Pago exitoso
        console.log("✅✅✅ PAGO EXITOSO ✅✅✅");
        console.log("Payment ID:", paymentData.id);
        console.log("Payment Status:", paymentStatus);
        console.log("Payment Description:", paymentData.result?.description);

        await ordenRef.update({
          estado: "pagada",
          paymentStatus: "success",
          paymentId: paymentData.id,
          paymentCode: paymentStatus,
          paymentDescription: paymentData.result?.description,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Deducir stock
        await actualizarStockOrden(orden);

        // Enviar correos de confirmación
        await enviarCorresPagoExitoso(orden);

        // Redirigir a página de éxito
        return NextResponse.redirect(
          new URL(`/checkout/exito?pedidoId=${pedidoId}`, req.url)
        );
      } else if (
        paymentStatus === "000.100.112" ||
        paymentStatus === "000.100.113" ||
        paymentStatus === "000.200.110"
      ) {
        // Pago pendiente (3DS o externo)
        console.log("⏳⏳⏳ PAGO PENDIENTE ⏳⏳⏳");
        console.log("Payment Status:", paymentStatus);
        console.log("Payment Description:", paymentData.result?.description);

        await ordenRef.update({
          estado: "pendiente_verificacion",
          paymentStatus: "pending",
          paymentData: paymentData,
          paymentCode: paymentStatus,
          paymentDescription: paymentData.result?.description,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Redirigir a página de pendiente
        return NextResponse.redirect(
          new URL(`/checkout/pendiente?pedidoId=${pedidoId}`, req.url)
        );
      } else {
        // Pago fallido
        console.log("❌❌❌ PAGO FALLIDO ❌❌❌");
        console.log("Payment Status:", paymentStatus);
        console.log("Payment Description:", paymentData.result?.description);

        await ordenRef.update({
          estado: "rechazada",
          paymentStatus: "failed",
          paymentData: paymentData,
          paymentCode: paymentStatus,
          paymentDescription: paymentData.result?.description,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Redirigir a página de error
        return NextResponse.redirect(
          new URL(`/checkout/failed?pedidoId=${pedidoId}`, req.url)
        );
      }
    }

    // Si no hay resourcePath, verificar el estado actual en Datafast usando checkoutId
    if (orden.checkoutId) {
      const paymentData = await getPaymentStatus(`/v1/checkouts/${orden.checkoutId}/payment`);
      const paymentStatus = paymentData.result?.code;

      console.log("[Datafast Result] Payment status (checkout):", paymentStatus);

      if (paymentStatus === "000.100.110" || paymentStatus === "000.200.100") {
        await ordenRef.update({
          estado: "pagada",
          paymentStatus: "success",
          paymentData: paymentData,
          paidAt: new Date().toISOString(),
        });

        await actualizarStockOrden(orden, -1);

        await enviarCorresPagoExitoso(orden);

        return NextResponse.redirect(
          new URL(`/checkout/success?pedidoId=${pedidoId}`, req.url)
        );
      } else if (
        paymentStatus === "000.100.112" ||
        paymentStatus === "000.100.113" ||
        paymentStatus === "000.200.110"
      ) {
        await ordenRef.update({
          estado: "pendiente_verificacion",
          paymentStatus: "pending",
          paymentData: paymentData,
        });

        return NextResponse.redirect(
          new URL(`/checkout/pending?pedidoId=${pedidoId}`, req.url)
        );
      } else {
        await ordenRef.update({
          estado: "fallida",
          paymentStatus: "failed",
          paymentData: paymentData,
          error: paymentData.result?.description || "Pago fallido",
        });

        return NextResponse.redirect(
          new URL(`/checkout/failed?pedidoId=${pedidoId}`, req.url)
        );
      }
    }

    // Si no hay información de pago, marcar como pendiente
    await ordenRef.update({
      estado: "pendiente_verificacion",
    });

    return NextResponse.redirect(
      new URL(`/checkout/pending?pedidoId=${pedidoId}`, req.url)
    );
  } catch (error: any) {
    console.error("[datafast-resultado] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar resultado" },
      { status: 500 }
    );
  }
}
