/**
 * @fileoverview Componente de tarjeta de incidente
 * Muestra los datos de un incidente en formato de tarjeta
 */

import { ApiService } from "../../core/services/api.service.js";
import { store, actions } from "../../core/store/store.js";
import { getRouter } from "../../router.js";
import { NotificationService } from "../../core/services/notification.service.js";

/**
 * Componente Incident Card - Componente molecular
 * @element incident-card
 *
 * @attr {string} incident-id - ID del incidente
 * @attr {string} reporter - Nombre del reportador
 * @attr {string} description - Descripción del incidente
 * @attr {string} status - Estado del incidente
 * @attr {string} created-at - Fecha de creación
 * @attr {boolean} expanded - Si la tarjeta está expandida
 *
 * @fires incident-card:view - Cuando se solicita ver el detalle del incidente
 * @fires incident-card:edit - Cuando se solicita editar el incidente
 * @fires incident-card:delete - Cuando se solicita eliminar el incidente
 */
class IncidentCardComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return [
      "incident-id",
      "reporter",
      "description",
      "status",
      "created-at",
      "expanded",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Estado interno
    this._incidentId = null;
    this._reporter = "";
    this._description = "";
    this._status = "pendiente";
    this._createdAt = "";
    this._expanded = false;
    this._deleteConfirmOpen = false;

    // Binding de métodos
    this._handleViewClick = this._handleViewClick.bind(this);
    this._handleEditClick = this._handleEditClick.bind(this);
    this._handleDeleteClick = this._handleDeleteClick.bind(this);
    this._toggleExpand = this._toggleExpand.bind(this);
    this._confirmDelete = this._confirmDelete.bind(this);
    this._cancelDelete = this._cancelDelete.bind(this);

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando el componente se conecta al DOM
  connectedCallback() {
    // Agregar event listeners
    this._addEventListeners();

    // Utilizar Intersection Observer para animación de entrada
    this._setupIntersectionObserver();
  }

  // Lifecycle: Cuando el componente se desconecta del DOM
  disconnectedCallback() {
    // Limpiar event listeners
    this._removeEventListeners();

    // Desconectar observer
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Actualizar propiedades internas
    switch (name) {
      case "incident-id":
        this._incidentId = newValue;
        break;
      case "reporter":
        this._reporter = newValue || "";
        break;
      case "description":
        this._description = newValue || "";
        break;
      case "status":
        this._status = newValue || "pendiente";
        break;
      case "created-at":
        this._createdAt = newValue || "";
        break;
      case "expanded":
        this._expanded = newValue !== null;
        break;
    }

    // Actualizar componente
    this._updateCard();
  }

  // Agregar event listeners
  _addEventListeners() {
    const viewBtn = this.shadowRoot.querySelector(".view-btn");
    const editBtn = this.shadowRoot.querySelector(".edit-btn");
    const deleteBtn = this.shadowRoot.querySelector(".delete-btn");
    const confirmDeleteBtn = this.shadowRoot.querySelector(
      ".confirm-delete-btn"
    );
    const cancelDeleteBtn = this.shadowRoot.querySelector(".cancel-delete-btn");
    const expandBtn = this.shadowRoot.querySelector(".expand-btn");

    if (viewBtn) viewBtn.addEventListener("click", this._handleViewClick);
    if (editBtn) editBtn.addEventListener("click", this._handleEditClick);
    if (deleteBtn) deleteBtn.addEventListener("click", this._handleDeleteClick);
    if (confirmDeleteBtn)
      confirmDeleteBtn.addEventListener("click", this._confirmDelete);
    if (cancelDeleteBtn)
      cancelDeleteBtn.addEventListener("click", this._cancelDelete);
    if (expandBtn) expandBtn.addEventListener("click", this._toggleExpand);
  }

  // Quitar event listeners
  _removeEventListeners() {
    const viewBtn = this.shadowRoot.querySelector(".view-btn");
    const editBtn = this.shadowRoot.querySelector(".edit-btn");
    const deleteBtn = this.shadowRoot.querySelector(".delete-btn");
    const confirmDeleteBtn = this.shadowRoot.querySelector(
      ".confirm-delete-btn"
    );
    const cancelDeleteBtn = this.shadowRoot.querySelector(".cancel-delete-btn");
    const expandBtn = this.shadowRoot.querySelector(".expand-btn");

    if (viewBtn) viewBtn.removeEventListener("click", this._handleViewClick);
    if (editBtn) editBtn.removeEventListener("click", this._handleEditClick);
    if (deleteBtn)
      deleteBtn.removeEventListener("click", this._handleDeleteClick);
    if (confirmDeleteBtn)
      confirmDeleteBtn.removeEventListener("click", this._confirmDelete);
    if (cancelDeleteBtn)
      cancelDeleteBtn.removeEventListener("click", this._cancelDelete);
    if (expandBtn) expandBtn.removeEventListener("click", this._toggleExpand);
  }

  // Configurar Intersection Observer para animación de entrada
  _setupIntersectionObserver() {
    if ("IntersectionObserver" in window) {
      this._observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const card = this.shadowRoot.querySelector(".card");
              if (card) {
                card.classList.add("visible");
              }
              // Desconectar después de activar para mejorar rendimiento
              this._observer.disconnect();
            }
          });
        },
        {
          threshold: 0.1,
        }
      );

      this._observer.observe(this);
    } else {
      // Fallback para navegadores sin soporte
      const card = this.shadowRoot.querySelector(".card");
      if (card) {
        card.classList.add("visible");
      }
    }
  }

  /**
   * Manejador para ver detalle del incidente
   * @private
   */
  _handleViewClick() {
    // Navegar a la página de detalle
    getRouter().navigateToRoute("INCIDENT_DETAIL", { id: this._incidentId });

    // Emitir evento personalizado
    this.dispatchEvent(
      new CustomEvent("incident-card:view", {
        bubbles: true,
        composed: true,
        detail: { id: this._incidentId },
      })
    );
  }

  /**
   * Manejador para editar incidente
   * @private
   */
  _handleEditClick() {
    // Navegar a la página de edición
    getRouter().navigateToRoute("EDIT_INCIDENT", { id: this._incidentId });

    // Emitir evento personalizado
    this.dispatchEvent(
      new CustomEvent("incident-card:edit", {
        bubbles: true,
        composed: true,
        detail: { id: this._incidentId },
      })
    );
  }

  /**
   * Manejador para eliminar incidente
   * @private
   */
  _handleDeleteClick() {
    this._deleteConfirmOpen = true;
    this._updateCard();
  }

  /**
   * Confirma eliminación de incidente
   * @private
   */
  async _confirmDelete() {
    try {
      // Mostrar loader
      store.dispatch(actions.setLoading(true));

      // Llamar a la API
      await ApiService.deleteIncident(this._incidentId);

      // Actualizar store eliminando el incidente
      store.dispatch(actions.deleteIncident(this._incidentId));

      // Mostrar notificación
      store.dispatch(
        actions.showSuccessNotification("Incidente eliminado con éxito")
      );

      // Animar salida
      const card = this.shadowRoot.querySelector(".card");
      if (card) {
        card.classList.add("deleting");

        // Quitar del DOM después de animación
        setTimeout(() => {
          this.remove();
        }, 300);
      } else {
        this.remove();
      }

      // Emitir evento personalizado
      this.dispatchEvent(
        new CustomEvent("incident-card:delete", {
          bubbles: true,
          composed: true,
          detail: { id: this._incidentId },
        })
      );
    } catch (error) {
      console.error("Error al eliminar incidente:", error);
      store.dispatch(
        actions.showErrorNotification(
          "Error al eliminar: " + (error.message || "Inténtalo de nuevo")
        )
      );
    } finally {
      // Ocultar loader
      store.dispatch(actions.setLoading(false));
    }
  }

  /**
   * Cancela eliminación de incidente
   * @private
   */
  _cancelDelete() {
    this._deleteConfirmOpen = false;
    this._updateCard();
  }

  /**
   * Alterna estado de expansión de la tarjeta
   * @private
   */
  _toggleExpand() {
    this._expanded = !this._expanded;
    this.setAttribute("expanded", this._expanded ? "" : null);
    this._updateCard();
  }

  /**
   * Formatea fecha a local string
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha formateada
   * @private
   */
  _formatDate(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Trunca texto a una longitud máxima
   * @param {string} text - Texto a truncar
   * @param {number} maxLength - Longitud máxima
   * @returns {string} Texto truncado
   * @private
   */
  _truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  /**
   * Actualiza la tarjeta según estado actual
   * @private
   */
  _updateCard() {
    // Referencias a elementos
    const card = this.shadowRoot.querySelector(".card");
    const statusBadge = this.shadowRoot.querySelector("status-badge");
    const reporter = this.shadowRoot.querySelector(".reporter");
    const description = this.shadowRoot.querySelector(".description");
    const date = this.shadowRoot.querySelector(".date");
    const deleteModal = this.shadowRoot.querySelector(".delete-confirm");
    const expandBtn = this.shadowRoot.querySelector(".expand-btn");
    const expandIcon = expandBtn?.querySelector("svg");

    // Actualizar componentes
    if (statusBadge) statusBadge.setAttribute("status", this._status);
    if (reporter) reporter.textContent = this._reporter;

    if (description) {
      if (this._expanded) {
        description.textContent = this._description;
        description.classList.add("expanded");
      } else {
        description.textContent = this._truncateText(this._description, 100);
        description.classList.remove("expanded");
      }
    }

    if (date) date.textContent = this._formatDate(this._createdAt);

    // Controlar modal de confirmación
    if (deleteModal) {
      deleteModal.classList.toggle("open", this._deleteConfirmOpen);
    }

    // Control de expansión
    if (card) {
      card.classList.toggle("expanded", this._expanded);
    }

    if (expandIcon) {
      expandIcon.style.transform = this._expanded
        ? "rotate(180deg)"
        : "rotate(0)";
    }
  }

  /**
   * Renderiza la tarjeta completa
   * @private
   */
  _render() {
    // CSS
    const styles = `
      :host {
        display: block;
        margin-bottom: 1rem;
      }
      
      .card {
        background-color: white;
        border-radius: var(--border-radius-lg, 0.5rem);
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
        overflow: hidden;
        transition: all 0.3s ease-in-out, transform 0.2s ease, opacity 0.4s ease;
        opacity: 0;
        transform: translateY(10px);
      }
      
      .card.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .card.deleting {
        transform: translateX(100%);
        opacity: 0;
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .card-title {
        font-weight: 600;
        font-size: 1rem;
        color: var(--secondary-color, #475569);
        margin: 0;
      }
      
      .card-body {
        padding: 1rem;
      }
      
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      
      .meta-info {
        margin-bottom: 1rem;
      }
      
      .reporter {
        font-weight: 500;
        color: var(--secondary-color, #475569);
      }
      
      .date {
        font-size: 0.875rem;
        color: #64748b;
      }
      
      .description {
        margin: 0.75rem 0;
        line-height: 1.5;
        color: #334155;
        transition: max-height 0.3s ease;
      }
      
      .card-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .btn {
        padding: 0.5rem;
        background: none;
        border: none;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s ease;
      }
      
      .btn:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
      
      .view-btn {
        color: var(--primary-color, #3b82f6);
      }
      
      .edit-btn {
        color: var(--info-color, #3b82f6);
      }
      
      .delete-btn {
        color: var(--error-color, #ef4444);
      }
      
      .expand-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 9999px;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        font-size: 0.875rem;
      }
      
      .expand-btn:hover {
        background-color: #f1f5f9;
      }
      
      .expand-btn svg {
        transition: transform 0.3s ease;
      }
      
      /* Confirmación de eliminación */
      .delete-confirm {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(2px);
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 10;
        padding: 1rem;
        border-radius: var(--border-radius-lg, 0.5rem);
      }
      
      .delete-confirm.open {
        display: flex;
      }
      
      .delete-confirm-message {
        text-align: center;
        margin-bottom: 1rem;
        font-weight: 500;
        color: var(--error-color, #ef4444);
      }
      
      .delete-confirm-actions {
        display: flex;
        gap: 0.75rem;
      }
      
      .confirm-delete-btn {
        background-color: var(--error-color, #ef4444);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
        font-weight: 500;
      }
      
      .cancel-delete-btn {
        background-color: #e2e8f0;
        color: #475569;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
        font-weight: 500;
      }
    `;

    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Incidente #${this._incidentId}</h3>
          <status-badge status="${this._status}"></status-badge>
        </div>
        
        <div class="card-body">
          <div class="meta-info">
            <div class="reporter">Reportado por: ${this._reporter}</div>
            <div class="date">${this._formatDate(this._createdAt)}</div>
          </div>
          
          <div class="description">${this._truncateText(
            this._description,
            100
          )}</div>
          
          <button class="expand-btn">
            ${this._expanded ? "Mostrar menos" : "Mostrar más"}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
        
        <div class="card-footer">
          <div class="card-actions">
            <button class="btn view-btn" title="Ver detalles">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            
            <button class="btn edit-btn" title="Editar incidente">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            
            <button class="btn delete-btn" title="Eliminar incidente">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="delete-confirm">
          <div class="delete-confirm-message">
            ¿Estás seguro de eliminar este incidente?<br>
            Esta acción no se puede deshacer.
          </div>
          <div class="delete-confirm-actions">
            <button class="cancel-delete-btn">Cancelar</button>
            <button class="confirm-delete-btn">Eliminar</button>
          </div>
        </div>
      </div>
    `;

    // Actualizar la tarjeta según atributos
    this._updateCard();
  }
}

// Registrar el componente
customElements.define("incident-card", IncidentCardComponent);

export default IncidentCardComponent;
