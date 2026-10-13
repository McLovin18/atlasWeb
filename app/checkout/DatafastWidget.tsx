"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    wpwlOptions: {
      onReady?: () => void;
      onError?: (error: any) => void;
      onBeforeSubmitCard?: (e?: any) => boolean;
      onFormSubmitted?: () => void;
      onPaymentSuccess?: (data: any) => void;
      onPaymentFailed?: (data: any) => void;
      onValidationError?: (data: any) => void;
      shopperResultUrl?: string;
      [key: string]: any;
    };
  }
}

interface DatafastWidgetProps {
  checkoutId: string;
  pedidoId: string;
  /** Error que viene del servidor tras un pago rechazado (ej. ?paymentError=...) */
  errorMessage?: string;
}

/**
 * Renderiza el widget de pago de Datafast (Peach Payments / HiPay).
 * Datafast inyecta un formulario de pago dentro del div #payment-form
 * usando su script de JavaScript.
 *
 * Documentación: https://datafast.com.ec/documentacion
 *
 * Variables de entorno requeridas en .env.local:
 *   NEXT_PUBLIC_DATAFAST_SCRIPT_URL
 *   → En pruebas: https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=
 *   → En producción: https://oppwa.com/v1/paymentWidgets.js?checkoutId=
 */

const DATAFAST_SCRIPT_BASE =
  process.env.NEXT_PUBLIC_DATAFAST_SCRIPT_URL ||
  "https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=";

// Tipos de pago a mostrar en el widget (VISA, MASTER, AMEX, etc.)
const PAYMENT_BRANDS = "VISA MASTER DINERS AMEX";

// Traducciones de errores de Datafast al español
const DATAFAST_ERROR_TRANSLATIONS: Record<string, string> = {
  "request contains no cc/bank account holder": "El nombre del titular de la tarjeta es requerido",
  "card holder is required": "El nombre del titular de la tarjeta es requerido",
  "card number is required": "El número de tarjeta es requerido",
  "card number is invalid": "El número de tarjeta es inválido",
  "card expiry is required": "La fecha de vencimiento es requerida",
  "card expiry is invalid": "La fecha de vencimiento es inválida",
  "card cvv is required": "El código de seguridad (CVV) es requerido",
  "card cvv is invalid": "El código de seguridad (CVV) es inválido",
  "invalid card holder": "El nombre del titular es inválido",
  "invalid card number": "El número de tarjeta es inválido",
  "invalid expiry date": "La fecha de vencimiento es inválida",
  "invalid cvv": "El código de seguridad (CVV) es inválido",
};

// Traduce un error de Datafast al español
function translateDatafastError(englishMessage: string): string {
  const lowerMessage = englishMessage.toLowerCase().trim();
  
  // Buscar coincidencia exacta o parcial
  for (const [english, spanish] of Object.entries(DATAFAST_ERROR_TRANSLATIONS)) {
    if (lowerMessage.includes(english.toLowerCase())) {
      return spanish;
    }
  }
  
  // Si no hay traducción, devolver el mensaje original
  return englishMessage;
}

// REMOVIDA: Validación del lado del cliente
// Dejamos que Datafast valide completamente y devuelva su propio error con ID
// Datafast manejará la validación y devolverá el error con su ID específico

export default function DatafastWidget({
  checkoutId,
  pedidoId,
  errorMessage = "",
}: DatafastWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [widgetError, setWidgetError] = useState<string>(errorMessage);

  // Si el padre envía un nuevo error (pago rechazado), mostrarlo
  useEffect(() => {
    if (errorMessage) setWidgetError(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    if (!checkoutId || !containerRef.current) return;

    // ⭐ Configurar wpwlOptions ANTES de cargar el script
    window.wpwlOptions = {
      // NO configurar shopperResultUrl aquí porque ya está configurado en el backend
      // al crear el checkout. Si lo configuramos aquí, Datafast rechaza con error
      // "was already set and cannot be overwritten"

      onReady: function () {
        console.log("=== DATAFAST WIDGET READY ===");
        const datafast =
          '<br/><br/><img src="https://www.datafast.com.ec/images/verified.png" style="display:block;margin:0 auto; width:100%;">';
        const form = document.querySelector("form.wpwl-form-card") as HTMLFormElement | null;
        if (form) {
          const button = form.querySelector(".wpwl-button");
          if (button) {
            button.insertAdjacentHTML("beforebegin", datafast);

            // Agregar listener al botón para capturar intentos de pago fallidos
            button.addEventListener("click", function () {
              console.log("=== PAYMENT BUTTON CLICKED ===");
              console.log("Form state:", form.checkValidity());

              // Capturar valores del formulario para evidencia
              const cardNumber = (form.querySelector(".wpwl-control-cardNumber") as HTMLInputElement | null)?.value;
              const expiry = (form.querySelector(".wpwl-control-expiry") as HTMLInputElement | null)?.value;
              const cvv = (form.querySelector(".wpwl-control-cvv") as HTMLInputElement | null)?.value;
              const holder = (form.querySelector(".wpwl-control-cardHolder") as HTMLInputElement | null)?.value;

              console.log("Form values:", {
                cardNumber: cardNumber ? "****" + cardNumber.slice(-4) : "empty",
                expiry: expiry || "empty",
                cvv: cvv ? "***" : "empty",
                holder: holder || "empty",
              });

              localStorage.setItem(
                "datafast_form_state",
                JSON.stringify({
                  timestamp: new Date().toISOString(),
                  formValid: form.checkValidity(),
                  expiry: expiry || "empty",
                  holder: holder || "empty",
                  checkoutId: checkoutId,
                  pedidoId: pedidoId,
                })
              );
            });
          }

          // Al editar el titular, limpiar el error asociado
          const holderInput = form.querySelector(".wpwl-control-cardHolder") as HTMLInputElement | null;
          holderInput?.addEventListener("input", () => {
            holderInput.classList.remove("wpwl-has-error");
            setWidgetError("");
          });

          // Intercept errores de validación del formulario HTML5
          form.addEventListener("invalid", function(e) {
            console.error("=== FORM INVALID EVENT ===");
            console.error("Invalid field:", e.target);
            console.error("Validation message:", (e.target as any).validationMessage);
            
            const target = e.target as HTMLInputElement;
            if (target) {
              const fieldName = target.name || target.id || target.className;
              const message = target.validationMessage || "Campo inválido";
              
              // Si es el campo del titular, mostrar mensaje específico
              if (fieldName.includes("cardHolder") || fieldName.includes("holder")) {
                setWidgetError("Nombre del titular: " + message);
              } else {
                setWidgetError(message);
              }
            }
            
            // Prevenir el comportamiento por defecto para evitar recarga
            e.preventDefault();
            e.stopPropagation();
          }, true); // Use capture phase

          // Intercept el envío del formulario para prevenir recarga en errores
          form.addEventListener("submit", function(e) {
            console.log("=== FORM SUBMIT EVENT ===");
            
            // Verificar si hay errores visibles en el formulario
            const hasErrors = form.querySelector('.wpwl-has-error') || 
                            form.querySelector('.wpwl-error') ||
                            form.querySelector('.error');
            
            if (hasErrors) {
              console.log("Formulario tiene errores, previniendo envío");
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            
            // Si no hay errores, permitir el envío normal
            console.log("Formulario sin errores, permitiendo envío a Datafast");
            // No prevenimos el envío, dejamos que Datafast maneje el proceso
          }, true); // Use capture phase

          // Observar cambios en el DOM para capturar errores que Datafast inyecte
          const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    // Buscar mensajes de error de Datafast
                    if (element.classList.contains('wpwl-error') || 
                        element.classList.contains('error') ||
                        element.classList.contains('validation-error')) {
                      console.log("=== DATAFAST ERROR ELEMENT FOUND ===");
                      console.log("Error element:", element);
                      console.log("Error text:", element.textContent);
                      
                      const errorText = element.textContent || "";
                      if (errorText) {
                        setWidgetError(errorText);
                      }
                    }
                  }
                });
              }
            });
          });
          
          observer.observe(form, { childList: true, subtree: true });
        }
      },

      // Se ejecuta ANTES de enviar. Si devuelve false, NO se envía y el formulario queda intacto.
      onBeforeSubmitCard: function () {
        console.log("=== DATAFAST onBeforeSubmitCard ===");
        const form = document.querySelector("form.wpwl-form-card") as HTMLFormElement | null;
        const holderInput = form?.querySelector(".wpwl-control-cardHolder") as HTMLInputElement | null;

        console.log("Valor del titular:", holderInput?.value);
        
        // Validar que el nombre del titular no esté vacío antes de enviar a Datafast
        // Esto previene que Datafast redirija al servidor con errores de validación
        if (!holderInput?.value || holderInput.value.trim() === "") {
          console.log("Nombre del titular vacío, previniendo envío");
          setWidgetError("El nombre del titular es requerido. Debe ser igual al que aparece en la tarjeta.");
          return false;
        }
        
        // Validar que el nombre tenga al menos nombre y apellido (Datafast requiere ambos)
        const holderValue = holderInput.value.trim();
        const nameParts = holderValue.split(/\s+/).filter(part => part.length > 0);
        
        if (nameParts.length < 2) {
          console.log("Nombre del titular incompleto (falta apellido), previniendo envío");
          setWidgetError("El nombre del titular debe incluir nombre y apellido, tal como aparece en la tarjeta.");
          return false;
        }
        
        // Validar que el nombre tenga al menos 3 caracteres
        if (holderValue.length < 3) {
          console.log("Nombre del titular muy corto, previniendo envío");
          setWidgetError("El nombre del titular es muy corto. Debe incluir nombre y apellido.");
          return false;
        }
        
        setWidgetError("");
        console.log("=== ENVIANDO A DATAFAST PARA VALIDACIÓN ===");
        return true;
      },

      onError: function (error: any) {
        console.error("=== DATAFAST WIDGET ERROR ===");
        console.error("Error Details:", error);
        console.error("Error Type:", error?.name);
        console.error("Error Message:", error?.message);
        console.error("Error Code:", error?.code);
        console.error("Error Description:", error?.description);
        console.error("Error ID:", error?.id || error?.transactionId || error?.paymentId);
        console.error("==============================");

        // Prevenir cualquier redirección o recarga
        if (error?.preventDefault) {
          error.preventDefault();
        }

        // Capturar el ID del error si existe (para logs internos, no para mostrar al cliente)
        const errorId = error?.id || error?.transactionId || error?.paymentId || "N/A";
        
        // Mostrar el error en la misma página sin quitar el formulario
        const errorMessage = error?.message || error?.description || 
          "Hubo un problema con los datos de pago. Revisa la información e intenta nuevamente.";
        
        // Traducir al español
        const translatedMessage = translateDatafastError(errorMessage);
        
        setWidgetError(translatedMessage);

        // Guardar el error en localStorage para evidencia (con ID para debugging)
        const errorData = {
          timestamp: new Date().toISOString(),
          errorType: error?.name || "unknown",
          errorMessage: errorMessage,
          translatedMessage: translatedMessage,
          errorCode: error?.code || "unknown",
          errorId: errorId,
          checkoutId: checkoutId,
          pedidoId: pedidoId,
        };
        localStorage.setItem("datafast_widget_error", JSON.stringify(errorData));
        
        // Retornar false para prevenir que Datafast continúe con el proceso
        return false;
      },
      
      // Callback cuando el formulario se envía exitosamente
      onFormSubmitted: function() {
        console.log("=== DATAFAST FORM SUBMITTED ===");
      },
      
      // Callback cuando hay un error de validación en el formulario
      onValidationError: function(error: any) {
        console.error("=== DATAFAST VALIDATION ERROR ===");
        console.error("Validation Error:", error);
        console.error("Error Message:", error?.message);
        console.error("Error Code:", error?.code);
        console.error("Error Description:", error?.description);
        console.error("Field:", error?.field);
        console.error("==============================");
        
        // Prevenir cualquier redirección o recarga
        if (error?.preventDefault) {
          error.preventDefault();
        }
        
        const errorMessage = error?.message || error?.description || 
          "Error en la validación de los datos. Verifica el nombre del titular y otros campos.";
        setWidgetError(errorMessage);
        
        // Guardar en localStorage
        localStorage.setItem("datafast_validation_error", JSON.stringify({
          timestamp: new Date().toISOString(),
          errorMessage,
          errorCode: error?.code,
          field: error?.field,
          checkoutId,
          pedidoId,
        }));
        
        // Retornar false para prevenir que Datafast continúe con el proceso
        return false;
      },
      
      // Callback cuando el pago falla
      onPaymentFailed: function(data: any) {
        console.error("=== DATAFAST PAYMENT FAILED ===");
        console.error("Payment Failed Data:", data);
        console.error("==============================");
        
        // Prevenir cualquier redirección
        if (data?.preventDefault) {
          data.preventDefault();
        }
        
        const errorMessage = data?.result?.description || data?.message || 
          "El pago fue rechazado. Verifica los datos de la tarjeta.";
        setWidgetError(errorMessage);
        
        // Retornar false para prevenir que Datafast continúe con el proceso
        return false;
      },
      
      // Callback cuando el pago es exitoso
      onPaymentSuccess: function(data: any) {
        console.log("=== DATAFAST PAYMENT SUCCESS ===");
        console.log("Payment Success Data:", data);
        console.log("==============================");
        
        // Redirigur a la página de éxito
        // Datafast debería haber enviado el callback al backend, pero también
        // redirigimos aquí como fallback
        window.location.href = `/checkout/success?pedidoId=${pedidoId}`;
      },
      style: "card",
      locale: "es",
      labels: {
        cvv: "CVV",
        cardHolder: "Nombre(Igual que en la tarjeta)",
      },
      // Configuración para manejar 3DS
      threeDS: {
        challengeWindowSize: "05", // 05 = Tamaño completo de pantalla
      },
      // Prevenir envío automático del formulario para controlar errores de validación
      autoSubmit: false,
    };

    // Limpiar script anterior si existiera
    if (scriptRef.current) {
      document.body.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = `${DATAFAST_SCRIPT_BASE}${checkoutId}`;
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [checkoutId]);

  return (
    <div className="widget-wrapper">
      <div className="security-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Pago 100% seguro con cifrado SSL</span>
      </div>

      {/*
        Datafast busca este div con el atributo data-brands para inyectar el form.
        NO configuramos action porque shopperResultUrl ya está configurado en el backend.
      */}
      <div
        ref={containerRef}
        id="payment-form"
        className="payment-form-container"
      >
        <form
          className="paymentWidgets"
          data-brands={PAYMENT_BRANDS}
        />
      </div>

      {/* El error vive FUERA del contenedor del widget, así nunca se borra ni quita el formulario */}
      {widgetError && (
        <div className="widget-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{widgetError}</span>
        </div>
      )}

      <p className="widget-disclaimer">
        Tus datos de pago son procesados de forma segura por Datafast.
        Importadora Atlas no almacena información de tu tarjeta.
      </p>

      <style jsx>{`
        .widget-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .security-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ddd;
          font-size: 13px;
          font-weight: 500;
        }

        .widget-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(224, 85, 85, 0.1);
          border: 1px solid rgba(224, 85, 85, 0.4);
          border-radius: 8px;
          color: #f5b4b4;
          font-size: 14px;
          line-height: 1.5;
        }

        .payment-form-container {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          padding: 4px;
          /* Datafast inyecta su propio CSS dentro del iframe/form */
          min-height: 360px;
        }

        .widget-disclaimer {
          font-size: 12px;
          color: #aaa;
          text-align: center;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}