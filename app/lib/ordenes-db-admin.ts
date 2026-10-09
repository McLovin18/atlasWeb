import admin from "./firebase-admin";
import { getCatalogPricing } from "./pricing";

// ── Funciones que usan admin SDK (solo para API routes) ─────────────────────

export async function crearOrdenAdmin(orden: any) {
  console.log("[crearOrdenAdmin] Iniciando creación de orden");
  const adminDb = admin.firestore();

  // Generar orderId usando admin SDK
  console.log("[crearOrdenAdmin] Generando orderId...");
  const metaRef = adminDb.collection("ordenes_meta").doc("counter");
  const counterDoc = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(metaRef);
    const last = snap.exists ? (snap.data().lastNumber || 0) : 0;
    const next = last + 1;
    tx.set(metaRef, { lastNumber: next }, { merge: true });
    return next;
  });
  const orderId = `ord-${String(counterDoc).padStart(5, "0")}`;
  console.log("[crearOrdenAdmin] orderId generado:", orderId);

  const productosOrigen = Array.isArray(orden.productos) ? orden.productos : [];
  const productosProcesados: any[] = [];
  let total = 0;

  // Validar cantidades
  const MAX_QUANTITY_PER_ITEM = 10;
  for (const item of productosOrigen) {
    const cantidad = Number(item.cantidad || 1);
    if (cantidad > MAX_QUANTITY_PER_ITEM) {
      throw new Error(`Cantidad máxima permitida por producto: ${MAX_QUANTITY_PER_ITEM}`);
    }
    if (cantidad < 1) {
      throw new Error("Cantidad debe ser al menos 1");
    }
  }

  // Obtener productos usando admin SDK
  const productRefs = productosOrigen
    .filter((item: any) => item?.id)
    .map((item: any) => adminDb.collection("productos").doc(item.id));

  const productDocs = await Promise.all(
    productRefs.map((ref) => ref.get().catch(() => null))
  );

  const productDataMap = new Map<string, any>();
  for (const snap of productDocs) {
    if (snap && snap.exists) {
      productDataMap.set(snap.id, snap.data());
    }
  }

  for (const item of productosOrigen) {
    if (!item?.id) continue;

    const data = productDataMap.get(item.id);
    if (!data) continue;

    const { basePrice, discount, hasDiscount, finalPrice } = getCatalogPricing(data);
    const cantidad = Number(item.cantidad || 1);
    const unitPrice = finalPrice;
    const lineTotal = unitPrice * cantidad;

    // Validar stock
    const stock = Number(data.stock || 0);
    if (stock < cantidad) {
      throw new Error(
        `Stock insuficiente para "${data.nombre}". Disponibles: ${stock}, Solicitados: ${cantidad}`
      );
    }

    total += lineTotal;

    productosProcesados.push({
      id: item.id,
      nombre: data.nombre,
      cantidad,
      precioBase: basePrice,
      descuento: hasDiscount ? discount : 0,
      precioFinal: finalPrice,
      subtotal: lineTotal,
      imagen: data.imagenes?.[0] || "",
      bodegaId: data.bodegaId || null,
      selectedTalla: item.selectedTalla || null,
      selectedColor: item.selectedColor || null,
      selectedVariations: item.selectedVariations || null,
      variationAttributeIds: item.variationAttributeIds || null,
    });
  }

  // Crear orden usando admin SDK
  const ordenDoc = await adminDb.collection("ordenes").add({
    orderId,
    cliente: orden.cliente,
    direccion: orden.direccion,
    productos: productosProcesados,
    subtotal: orden.subtotal || total,
    costoEnvio: orden.costoEnvio || 0,
    total: orden.total || total,
    estado: orden.estado || "pendiente",
    paymentMethod: orden.paymentMethod || "whatsapp",
    checkoutId: orden.checkoutId || "",
    paymentStatus: orden.paymentStatus || "pending",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  });

  return {
    id: ordenDoc.id,
    orderId,
  };
}
