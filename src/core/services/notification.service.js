/**
 * @fileoverview Servicio para mostrar notificaciones al usuario
 * Implementa un sistema de tostadas (toasts) para mensajes temporales
 */

import { store, actions } from "../store/store.js";

/**
 * Servicio de Notificaciones - Singleton
 */
class NotificationServiceClass {
  constructor() {
    this.initialized = false;
    this.container = null;
    this.toasts = new Map();
    this.counter = 0;
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  init() {
    if (this.initialized) return;

    // Crear contenedor de notificaciones
    this.container = document.createElement("div");
    this.container.className = "notification-container";
    document.body.appendChild(this.container);

    // Aplicar estilos al contenedor
    Object.assign(this.container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "1000",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      maxWidth: "350px",
      fontFamily: "var(--font-family)",
      pointerEvents: "none",
    });

    // Observar el store para mostrar notificaciones automáticamente
    store.subscribe((state) => {
      const notifications = state.notifications;
      if (notifications.length > 0) {
        const latestNotification = notifications[notifications.length - 1];
        if (!latestNotification.displayed) {
          this.show(
            latestNotification.message,
            latestNotification.type,
            latestNotification.duration
          );

          // Marcar como mostrada
          store.dispatch(
            actions.markNotificationDisplayed(latestNotification.id)
          );
        }
      }
    });

    this.initialized = true;
    console.log("✅ Notification Service inicializado");
  }

  /**
   * Muestra una notificación tipo toast
   * @param {string} message - Mensaje a mostrar
   * @param {string} [type='info'] - Tipo de notificación (success, error, warning, info)
   * @param {number} [duration=5000] - Duración en milisegundos
   * @returns {number} ID de la notificación
   */
  show(message, type = "info", duration = 5000) {
    // Asegurar que el servicio está inicializado
    if (!this.initialized) {
      this.init();
    }

    // Generar ID único para esta notificación
    const id = ++this.counter;

    // Crear elemento toast
    const toast = document.createElement("div");
    toast.className = `notification notification-${type}`;
    toast.textContent = message;
    this.toasts.set(id, toast);

    // Aplicar estilos al toast
    Object.assign(toast.style, {
      padding: "12px 16px",
      backgroundColor: this._getBackgroundColor(type),
      color: this._getTextColor(type),
      borderRadius: "6px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      marginBottom: "10px",
      opacity: "0",
      transform: "translateX(100%)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      pointerEvents: "auto",
      position: "relative",
      overflow: "hidden",
    });

    // Agregar al contenedor
    this.container.appendChild(toast);

    // Forzar reflow para activar transición
    void toast.offsetWidth;

    // Mostrar con animación
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";

    // Agregar barra de progreso
    const progressBar = document.createElement("div");
    progressBar.className = "notification-progress";

    // Aplicar estilos a la barra de progreso
    Object.assign(progressBar.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      height: "3px",
      width: "100%",
      backgroundColor: this._getProgressColor(type),
      transformOrigin: "left",
      animation: `notification-progress ${duration}ms linear forwards`,
    });

    // Crear keyframes para la animación de la barra de progreso
    if (!document.querySelector("#notification-keyframes")) {
      const style = document.createElement("style");
      style.id = "notification-keyframes";
      style.textContent = `
        @keyframes notification-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `;
      document.head.appendChild(style);
    }

    toast.appendChild(progressBar);

    // Configurar autocierre
    const timeoutId = setTimeout(() => {
      this.hide(id);
    }, duration);

    // Permitir cerrar haciendo clic
    toast.addEventListener("click", () => {
      clearTimeout(timeoutId);
      this.hide(id);
    });

    return id;
  }

  /**
   * Oculta una notificación por ID
   * @param {number} id - ID de la notificación
   */
  hide(id) {
    const toast = this.toasts.get(id);

    if (toast) {
      // Animar salida
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";

      // Eliminar después de la animación
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.toasts.delete(id);
      }, 300);
    }
  }

  /**
   * Muestra una notificación de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration=5000] - Duración en milisegundos
   * @returns {number} ID de la notificación
   */
  success(message, duration = 5000) {
    return this.show(message, "success", duration);
  }

  /**
   * Muestra una notificación de error
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration=5000] - Duración en milisegundos
   * @returns {number} ID de la notificación
   */
  error(message, duration = 5000) {
    return this.show(message, "error", duration);
  }

  /**
   * Muestra una notificación de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration=5000] - Duración en milisegundos
   * @returns {number} ID de la notificación
   */
  warning(message, duration = 5000) {
    return this.show(message, "warning", duration);
  }

  /**
   * Muestra una notificación de información
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration=5000] - Duración en milisegundos
   * @returns {number} ID de la notificación
   */
  info(message, duration = 5000) {
    return this.show(message, "info", duration);
  }

  /**
   * Obtiene el color de fondo según el tipo de notificación
   * @param {string} type - Tipo de notificación
   * @returns {string} Color en formato CSS
   * @private
   */
  _getBackgroundColor(type) {
    switch (type) {
      case "success":
        return "#f0fdf4";
      case "error":
        return "#fef2f2";
      case "warning":
        return "#fffbeb";
      case "info":
      default:
        return "#f0f9ff";
    }
  }

  /**
   * Obtiene el color de texto según el tipo de notificación
   * @param {string} type - Tipo de notificación
   * @returns {string} Color en formato CSS
   * @private
   */
  _getTextColor(type) {
    switch (type) {
      case "success":
        return "#166534";
      case "error":
        return "#991b1b";
      case "warning":
        return "#92400e";
      case "info":
      default:
        return "#0c4a6e";
    }
  }

  /**
   * Obtiene el color de la barra de progreso según el tipo
   * @param {string} type - Tipo de notificación
   * @returns {string} Color en formato CSS
   * @private
   */
  _getProgressColor(type) {
    switch (type) {
      case "success":
        return "#22c55e";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
      default:
        return "#3b82f6";
    }
  }
}

// Exportar instancia singleton
export const NotificationService = new NotificationServiceClass();
