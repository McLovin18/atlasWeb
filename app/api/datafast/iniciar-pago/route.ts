import { NextRequest, NextResponse } from "next/server";
import { crearOrdenAdmin } from "../../../lib/ordenes-db-admin";
import { buildOrderProductLine, cleanUndefined } from "../../../lib/order-checkout-utils";
import { preCheckIdempotentOrder, completeIdempotentOrder, failIdempotentOrder, cleanupExpiredLocks } from "../../../lib/idempotent-order-db";
import admin from "../../../lib/firebase-admin";

// ── Configuración Datafast ─────────────────────────────────────────────────────

const DATAFAST_BASE_URL = process.env.DATAFAST_BASE_URL;
const DATAFAST_ENTITY_ID = process.env.DATAFAST_ENTITY_ID;
const DATAFAST_AUTH_TOKEN = process.env.DATAFAST_AUTH_TOKEN;
const DATAFAST_CURRENCY = process.env.DATAFAST_CURRENCY || "USD";
const DATAFAST_MID = process.env.DATAFAST_MID;
const DATAFAST_TID = process.env.DATAFAST_TID;

// ── Tipos ───────────────────────────────────────────────────────────────────────

interface IniciarPagoRequest {
  cliente: {
    nombre: string;
    nombreSolo: string;
    apellido: string;
    identificacion: string;
    email: string;
    telefono: string;
  };
  direccion: {
    provincia: string;
    ciudad: string;
    direccion: string;
  };
  productos: Array<{
    id: string;
    cantidad: number;
    cartKey?: string;
    selectedTalla?: string;
    selectedColor?: string;
    selectedVariations?: Record<string, string>;
    variationAttributeIds?: string[];
    nombre?: string;
    precio?: number;
  }>;
  subtotal: number;
  costoEnvio: number;
  total: number;
}

// ── Helper: Generar idempotency key ─────────────────────────────────────────────

function generateIdempotencyKey(email: string, items: any[]): string {
  const itemsHash = items
    .map((item) => `${item.id}-${item.cantidad}-${item.cartKey || ""}`)
    .sort()
    .join("|");
  return `${email}-${itemsHash}`.replace(/[^a-zA-Z0-9-_]/g, "");
}

// ── Helper: Crear checkout en Datafast ────────────────────────────────────────────

async function createDatafastCheckout(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
  pedidoId?: string,
  direccion?: any,
  cliente?: any
): Promise<{ checkoutId: string }> {
  console.log("[Datafast] Configuración:", {
    baseUrl: DATAFAST_BASE_URL,
    entityId: DATAFAST_ENTITY_ID,
    hasAuthToken: !!DATAFAST_AUTH_TOKEN,
    authTokenLength: DATAFAST_AUTH_TOKEN?.length,
    currency: DATAFAST_CURRENCY,
    mid: DATAFAST_MID,
    tid: DATAFAST_TID,
  });

  if (!DATAFAST_BASE_URL || !DATAFAST_ENTITY_ID || !DATAFAST_AUTH_TOKEN) {
    throw new Error("Faltan credenciales de Datafast en variables de entorno");
  }

  const url = `${DATAFAST_BASE_URL}/v1/checkouts?entityId=${DATAFAST_ENTITY_ID}`;

  // Intentar primero con Bearer token (más común en APIs modernas)
  const useBearer = true;
  const auth = useBearer
    ? DATAFAST_AUTH_TOKEN
    : Buffer.from(`${DATAFAST_ENTITY_ID}:${DATAFAST_AUTH_TOKEN}`).toString("base64");

  console.log("[Datafast] Auth header:", useBearer ? `Bearer ${auth.substring(0, 10)}...` : `Basic ${auth.substring(0, 10)}...`);

  const payload = {
    amount: amount.toFixed(2),
    currency: DATAFAST_CURRENCY,
    paymentType: "DB",
    merchantTransactionId: orderId,
    customer: {
      email: customerEmail,
      givenName: customerName.split(" ")[0] || customerName,
      surname: customerName.split(" ").slice(1).join(" ") || "",
    },
    billing: {
      street1: direccion?.direccion || "N/A",
      city: direccion?.ciudad || "N/A",
      state: direccion?.provincia || "N/A",
      country: "EC",
    },
  };

  console.log("[Datafast] Payload:", JSON.stringify(payload, null, 2));

  // Convertir payload a formato URL-encoded según documentación de Datafast
  // Usar notación de puntos para objetos anidados
  const formData = new URLSearchParams();
  const flattenObject = (obj: any, prefix: string = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey);
      } else {
        formData.append(newKey, String(value));
      }
    });
  };
  flattenObject(payload);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: useBearer ? `Bearer ${auth}` : `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-MID": DATAFAST_MID || "",
      "X-TID": DATAFAST_TID || "",
    },
    body: formData.toString(),
  });

  const data = await response.json();

  console.log("[Datafast] Response status:", response.status);
  console.log("[Datafast] Response data:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    console.error("Datafast API error:", data);
    throw new Error(data.result?.description || "Error al crear checkout en Datafast");
  }

  const checkoutId = data.id;
  if (!checkoutId) {
    throw new Error("No se recibió checkoutId de Datafast");
  }

  return { checkoutId };
}

// ── POST: Iniciar pago ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("========================================");
  console.log("[Datafast POST] Iniciando endpoint");
  console.log("========================================");
  try {
    const body = await req.json();
    console.log("[Datafast POST] Body recibido:", JSON.stringify(body, null, 2));

    // Validaciones básicas
    if (!body.cliente?.email || !body.productos?.length) {
      console.log("[Datafast POST] Error: Faltan datos requeridos");
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Generar idempotency key
    const idempotencyKey = generateIdempotencyKey(body.cliente.email, body.productos);

    // Pre-check idempotencia (solo si no es forceRetry)
    const forceRetry = body.forceRetry === true;
    let preCheck;
    if (!forceRetry) {
      preCheck = await preCheckIdempotentOrder({
        idempotencyKey,
        userId: body.cliente.email, // Usar email como userId temporal
        email: body.cliente.email,
        totalAmount: body.total,
        itemCount: body.productos.length,
        source: "online",
      });

      // Si no puede proceder por lock expirado, limpiar y reintentar automáticamente
      if (!preCheck.canProceed && preCheck.error?.includes("already being processed")) {
        console.log("[Datafast] Lock expirado detectado, limpiando y reintentando...");
        await cleanupExpiredLocks();
        // Reintentar después de limpiar
        preCheck = await preCheckIdempotentOrder({
          idempotencyKey,
          userId: body.cliente.email,
          email: body.cliente.email,
          totalAmount: body.total,
          itemCount: body.productos.length,
          source: "online",
        });
      }
    } else {
      preCheck = { canProceed: true, lockId: `order_lock_${idempotencyKey}` };
    }

    if (!preCheck.canProceed && !body.forceRetry) {
      console.log("[iniciar-pago] Idempotencia: No puede proceder", preCheck);
      if (preCheck.existingOrderId) {
        console.log("[iniciar-pago] Idempotencia: Orden existente encontrada", preCheck.existingOrderId);
        // Devolver orden existente usando admin SDK
        const adminDb = admin.firestore();
        const ordenSnap = await adminDb.collection("ordenes").doc(preCheck.existingOrderId).get();
        if (ordenSnap.exists) {
          const orden = ordenSnap.data();
          console.log("[iniciar-pago] Idempotencia: Orden existente con checkoutId", orden.checkoutId);

          // Verificar si el checkoutId es válido (no expirado)
          // Datafast expira los checkoutIds después de 30 minutos
          const ordenCreatedAt = orden.createdAt?.toDate?.() || new Date(orden.createdAt);
          const minutesSinceCreation = (Date.now() - ordenCreatedAt.getTime()) / (1000 * 60);

          if (minutesSinceCreation > 25 || !orden.checkoutId) {
            // Checkout expirado o no existe, crear uno nuevo
            console.log("[iniciar-pago] Checkout expirado, creando nuevo...");
            console.log("[iniciar-pago] Direccion:", body.direccion);
            console.log("[iniciar-pago] Cliente:", body.cliente);
            const { checkoutId: newCheckoutId } = await createDatafastCheckout(
              orden.orderId,
              orden.total || body.total,
              body.cliente.email,
              body.cliente.nombre,
              preCheck.existingOrderId,
              body.direccion,
              body.cliente
            );
            console.log("[iniciar-pago] Nuevo checkoutId creado:", newCheckoutId);

            // Actualizar orden con nuevo checkoutId
            await adminDb.collection("ordenes").doc(preCheck.existingOrderId).update({
              checkoutId: newCheckoutId,
              estado: "pendiente_pago",
            });

            return NextResponse.json({
              pedidoId: preCheck.existingOrderId,
              orderId: orden.orderId,
              checkoutId: newCheckoutId,
              message: "Checkout renovado",
            });
          }

          console.log("[iniciar-pago] Idempotencia: Devolviendo orden existente con checkoutId válido");
          return NextResponse.json({
            pedidoId: preCheck.existingOrderId,
            orderId: orden.orderId,
            checkoutId: orden.checkoutId,
            message: "Orden ya existe",
          });
        }
      }

      // Si el error es "Request is already being processed", intentar limpiar locks viejos
      if (preCheck.error === "Request is already being processed") {
        try {
          const { deleted } = await cleanupExpiredLocks();
          if (deleted > 0) {
            // Reintentar después de limpiar
            const retryCheck = await preCheckIdempotentOrder({
              idempotencyKey,
              userId: body.cliente.email,
              email: body.cliente.email,
              totalAmount: body.total,
              itemCount: body.productos.length,
              source: "online",
            });

            if (retryCheck.canProceed) {
              // Continuar con el flujo normal
              // Nota: Necesitamos reestructurar el código para esto
              // Por ahora, devolvemos un mensaje para que el usuario reintente
            }
          }
        } catch (err) {
          console.error("Error cleaning up locks:", err);
        }
      }

      return NextResponse.json(
        { error: preCheck.error || "Por favor espera unos segundos e intenta nuevamente" },
        { status: 409 }
      );
    }

    // Obtener datos de productos usando admin SDK
    const adminDb = admin.firestore();
    const productRefs = body.productos
      .filter((item) => item?.id)
      .map((item) => adminDb.collection("productos").doc(item.id));

    const productDocs = await Promise.all(
      productRefs.map((ref) => ref.get().catch(() => null))
    );

    const productDataMap = new Map<string, any>();
    for (const snap of productDocs) {
      if (snap && snap.exists) {
        productDataMap.set(snap.id, snap.data());
      }
    }

    // Procesar items del pedido
    const productosProcesados: any[] = [];
    let subtotalCalculado = 0;

    for (const item of body.productos) {
      if (!item?.id) continue;

      const productData = productDataMap.get(item.id);
      if (!productData) {
        throw new Error(`Producto no encontrado: ${item.id}`);
      }

      const lineItem = buildOrderProductLine(item, productData);
      productosProcesados.push(lineItem);
      subtotalCalculado += lineItem.subtotal;
    }

    // Calcular total con envío
    const costoEnvio = body.costoEnvio || 5;
    const totalCalculado = subtotalCalculado + costoEnvio;

    // Validar total
    if (Math.abs(totalCalculado - body.total) > 0.1) {
      throw new Error(`Total mismatch: calculado ${totalCalculado}, recibido ${body.total}`);
    }

    // Crear orden en Firebase usando admin SDK
    console.log("[iniciar-pago] Creando orden con crearOrdenAdmin...");
    let orden;
    try {
      orden = await crearOrdenAdmin({
        cliente: body.cliente,
        direccion: body.direccion,
        productos: productosProcesados,
        subtotal: subtotalCalculado,
        costoEnvio,
        total: totalCalculado,
        estado: "pendiente_pago",
        checkoutId: "",
        paymentMethod: "datafast",
      });
      console.log("[iniciar-pago] Orden creada exitosamente:", orden);
    } catch (err: any) {
      console.error("[iniciar-pago] Error creando orden:", err);
      throw err;
    }

    // Crear checkout en Datafast
    console.log("[iniciar-pago] Creando checkout en Datafast...");
    const { checkoutId } = await createDatafastCheckout(
      orden.orderId,
      totalCalculado,
      body.cliente.email,
      body.cliente.nombre,
      orden.id,
      body.direccion,
      body.cliente
    );
    console.log("[iniciar-pago] CheckoutId creado:", checkoutId);

    // Actualizar orden con checkoutId usando admin SDK (bypass reglas)
    await adminDb.collection("ordenes").doc(orden.id).update({
      checkoutId,
      idempotencyKey,
    });
    console.log("[iniciar-pago] Orden actualizada con checkoutId");

    // Completar idempotencia
    await completeIdempotentOrder(preCheck.lockId, orden.id);

    return NextResponse.json({
      pedidoId: orden.id,
      orderId: orden.orderId,
      checkoutId,
    });
  } catch (error: any) {
    console.error("[iniciar-pago] Error:", error);

    // Marcar como fallida si tenemos lockId
    // Nota: En una implementación más robusta, pasaríamos el lockId en el contexto

    return NextResponse.json(
      { error: error.message || "Error al iniciar pago" },
      { status: 500 }
    );
  }
}
