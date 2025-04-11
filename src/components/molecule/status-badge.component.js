/**
 * @fileoverview Componente de badge para estados de incidentes
 * Muestra el estado de un incidente con colores significativos
 */

import { CONFIG } from "../../config.js";

/**
 * Componente Status Badge - Componente molecular
 * @element status-badge
 *
 * @attr {string} status - Estado del incidente (pendiente, en proceso, resuelto)
 */
class StatusBadgeComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return ["status"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Valores por defecto
    this._status = "";

    // Estados válidos y sus configuraciones
    this._statusConfig = {
      [CONFIG.INCIDENT_STATUS.PENDING]: {
        label: "Pendiente",
        class: "badge-pending",
        color: "#fbbf24",
        bgColor: "#fef3c7",
        icon: `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `,
      },
      [CONFIG.INCIDENT_STATUS.IN_PROGRESS]: {
        label: "En proceso",
        class: "badge-in-progress",
        color: "#0891b2",
        bgColor: "#e0f2fe",
        icon: `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        `,
      },
      [CONFIG.INCIDENT_STATUS.RESOLVED]: {
        label: "Resuelto",
        class: "badge-resolved",
        color: "#15803d",
        bgColor: "#dcfce7",
        icon: `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        `,
      },
    };

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "status") {
      this._status = newValue || "";
      this._updateBadge();
    }
  }

  // Getter y setter para status
  get status() {
    return this._status;
  }

  set status(value) {
    this.setAttribute("status", value);
  }

  /**
   * Actualiza el badge según el estado
   * @private
   */
  _updateBadge() {
    const badge = this.shadowRoot.querySelector(".badge");
    const icon = this.shadowRoot.querySelector(".badge-icon");
    const text = this.shadowRoot.querySelector(".badge-text");

    // Obtener configuración para este estado o usar valores por defecto
    const config = this._statusConfig[this._status] || {
      label: this._status || "Desconocido",
      class: "badge-default",
      color: "#64748b",
      bgColor: "#f1f5f9",
      icon: "",
    };

    // Actualizar clases y estilos
    badge.className = `badge ${config.class}`;
    badge.style.setProperty("--badge-color", config.color);
    badge.style.setProperty("--badge-bg-color", config.bgColor);

    // Actualizar contenido
    text.textContent = config.label;

    // Actualizar icono si existe
    if (icon) {
      if (config.icon) {
        icon.innerHTML = config.icon;
        icon.hidden = false;
      } else {
        icon.hidden = true;
      }
    }
  }

  /**
   * Renderiza el componente completo
   * @private
   */
  _render() {
    // CSS con variables y clases
    const styles = `
      :host {
        display: inline-block;
      }
      
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.5;
        border-radius: 9999px;
        background-color: var(--badge-bg-color, #f1f5f9);
        color: var(--badge-color, #64748b);
      }
      
      .badge-icon {
        display: inline-flex;
        margin-right: 0.25rem;
      }
      
      /* Animación para estado en proceso */
      .badge-in-progress .badge-icon svg {
        animation: spin 1.5s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <span class="badge">
        <span class="badge-icon"></span>
        <span class="badge-text"></span>
      </span>
    `;

    // Actualizar componente según estado
    this._updateBadge();
  }
}

// Registrar el componente
customElements.define("status-badge", StatusBadgeComponent);

export default StatusBadgeComponent;
