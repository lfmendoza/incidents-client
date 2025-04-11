/**
 * @fileoverview Página de detalle de incidente
 * Muestra la información detallada de un incidente específico
 */

import { store, actions } from "../core/store/store.js";
import { ApiService } from "../core/services/api.service.js";
import { getRouter } from "../router.js";

/**
 * Componente Incident Detail Page
 * @element incident-detail-page
 *
 * @attr {string} data-id - ID del incidente a mostrar
 */
class IncidentDetailPage extends HTMLElement {
  static get observedAttributes() {
    return ["data-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Estado interno
    this._incident = null;
    this._loading = true;
    this._error = null;

    // Binding de métodos
    this._handleEditClick = this._handleEditClick.bind(this);
    this._handleDeleteClick = this._handleDeleteClick.bind(this);
    this._handleBackClick = this._handleBackClick.bind(this);
    this._handleStatusChange = this._handleStatusChange.bind(this);
  }

  // Getters
  get incidentId() {
    return this.getAttribute("data-id");
  }

  // Lifecycle
  connectedCallback() {
    this._render();

    // Cargar datos del incidente
    if (this.incidentId) {
      this._loadIncidentData();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data-id" && oldValue !== newValue && this.isConnected) {
      this._loadIncidentData();
    }
  }

  /**
   * Carga los datos del incidente
   * @private
   */
  async _loadIncidentData() {
    if (!this.incidentId) return;

    try {
      this._loading = true;
      this._error = null;
      this._updateUI();

      // Buscar primero en el store
      const state = store.getState();
      let incident = state.incidents.find((inc) => inc.id == this.incidentId);

      // Si no está en el store, hacer petición a la API
      if (!incident) {
        incident = await ApiService.getIncidentById(this.incidentId);

        // Actualizar store
        if (incident) {
          store.dispatch(actions.setCurrentIncident(incident));
        }
      }

      this._incident = incident;
    } catch (error) {
      console.error("Error al cargar el incidente:", error);
      this._error =
        "No se pudo cargar la información del incidente. Inténtalo de nuevo.";
      store.dispatch(
        actions.showErrorNotification("Error al cargar el incidente")
      );
    } finally {
      this._loading = false;
      this._updateUI();
    }
  }

  /**
   * Actualiza el estado del incidente
   * @param {string} newStatus - Nuevo estado
   * @private
   */
  async _updateIncidentStatus(newStatus) {
    if (!this.incidentId || !this._incident) return;

    try {
      store.dispatch(actions.setLoading(true));

      // Llamar a la API
      const updatedIncident = await ApiService.updateIncidentStatus(
        this.incidentId,
        newStatus
      );

      // Actualizar store
      store.dispatch(actions.updateIncident(updatedIncident));

      // Actualizar localmente
      this._incident = updatedIncident;

      // Mostrar notificación
      store.dispatch(
        actions.showSuccessNotification("Estado actualizado correctamente")
      );

      this._updateUI();
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      store.dispatch(
        actions.showErrorNotification("Error al actualizar el estado")
      );
    } finally {
      store.dispatch(actions.setLoading(false));
    }
  }

  /**
   * Formatea fecha a formato legible
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha formateada
   * @private
   */
  _formatDate(dateString) {
    if (!dateString) return "Fecha desconocida";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Actualiza la interfaz según el estado actual
   * @private
   */
  _updateUI() {
    // Referencias a elementos
    const container = this.shadowRoot.querySelector(".detail-container");
    const loader = this.shadowRoot.querySelector(".detail-loader");
    const errorMsg = this.shadowRoot.querySelector(".error-message");
    const content = this.shadowRoot.querySelector(".detail-content");

    // Mostrar/ocultar loader
    if (loader) {
      loader.hidden = !this._loading;
    }

    // Mostrar/ocultar error
    if (errorMsg) {
      errorMsg.hidden = !this._error;
      if (this._error) {
        errorMsg.textContent = this._error;
      }
    }

    // Mostrar/ocultar contenido
    if (content) {
      content.hidden = this._loading || this._error || !this._incident;
    }

    // Si no hay incidente aún, salir
    if (!this._incident) return;

    // Actualizar datos del incidente
    const title = this.shadowRoot.querySelector(".detail-title");
    const reporter = this.shadowRoot.querySelector(".incident-reporter");
    const dateElement = this.shadowRoot.querySelector(".incident-date");
    const description = this.shadowRoot.querySelector(".incident-description");
    const statusBadge = this.shadowRoot.querySelector("status-badge");
    const statusRadios = this.shadowRoot.querySelectorAll(
      'input[name="status"]'
    );

    if (title) title.textContent = `Incidente #${this._incident.id}`;
    if (reporter) reporter.textContent = this._incident.reporter;
    if (dateElement)
      dateElement.textContent = this._formatDate(this._incident.created_at);
    if (description) description.textContent = this._incident.description;
    if (statusBadge) statusBadge.setAttribute("status", this._incident.status);

    // Actualizar radio del estado
    statusRadios.forEach((radio) => {
      radio.checked = radio.value === this._incident.status;
    });
  }

  /**
   * Manejador para clic en botón editar
   * @private
   */
  _handleEditClick() {
    getRouter().navigateToRoute("EDIT_INCIDENT", { id: this.incidentId });
  }

  /**
   * Manejador para clic en botón eliminar
   * @private
   */
  async _handleDeleteClick() {
    if (
      !confirm(
        "¿Estás seguro de eliminar este incidente? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      store.dispatch(actions.setLoading(true));

      // Llamar a la API
      await ApiService.deleteIncident(this.incidentId);

      // Actualizar store
      store.dispatch(actions.deleteIncident(this.incidentId));

      // Mostrar notificación
      store.dispatch(
        actions.showSuccessNotification("Incidente eliminado correctamente")
      );

      // Volver a página principal
      getRouter().navigateToRoute("HOME");
    } catch (error) {
      console.error("Error al eliminar incidente:", error);
      store.dispatch(
        actions.showErrorNotification("Error al eliminar el incidente")
      );
    } finally {
      store.dispatch(actions.setLoading(false));
    }
  }

  /**
   * Manejador para clic en botón volver
   * @private
   */
  _handleBackClick() {
    window.history.back();
  }

  /**
   * Manejador para cambio de estado
   * @param {Event} event - Evento change
   * @private
   */
  _handleStatusChange(event) {
    const newStatus = event.target.value;
    if (newStatus && newStatus !== this._incident.status) {
      this._updateIncidentStatus(newStatus);
    }
  }

  /**
   * Agrega event listeners
   * @private
   */
  _addEventListeners() {
    const editBtn = this.shadowRoot.querySelector("#edit-btn");
    const deleteBtn = this.shadowRoot.querySelector("#delete-btn");
    const backBtn = this.shadowRoot.querySelector("#back-btn");
    const statusRadios = this.shadowRoot.querySelectorAll(
      'input[name="status"]'
    );

    if (editBtn) editBtn.addEventListener("click", this._handleEditClick);
    if (deleteBtn) deleteBtn.addEventListener("click", this._handleDeleteClick);
    if (backBtn) backBtn.addEventListener("click", this._handleBackClick);

    statusRadios.forEach((radio) => {
      radio.addEventListener("change", this._handleStatusChange);
    });
  }

  /**
   * Quita event listeners
   * @private
   */
  _removeEventListeners() {
    const editBtn = this.shadowRoot.querySelector("#edit-btn");
    const deleteBtn = this.shadowRoot.querySelector("#delete-btn");
    const backBtn = this.shadowRoot.querySelector("#back-btn");
    const statusRadios = this.shadowRoot.querySelectorAll(
      'input[name="status"]'
    );

    if (editBtn) editBtn.removeEventListener("click", this._handleEditClick);
    if (deleteBtn)
      deleteBtn.removeEventListener("click", this._handleDeleteClick);
    if (backBtn) backBtn.removeEventListener("click", this._handleBackClick);

    statusRadios.forEach((radio) => {
      radio.removeEventListener("change", this._handleStatusChange);
    });
  }

  _render() {
    // CSS
    const styles = `
      :host {
        display: block;
      }
      
      .detail-container {
        background-color: white;
        border-radius: var(--border-radius-lg, 0.5rem);
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
        padding: 1.5rem;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .detail-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--secondary-color, #475569);
        margin: 0;
      }
      
      .header-buttons {
        display: flex;
        gap: 0.75rem;
      }
      
      .button {
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius-md, 0.375rem);
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.15s ease;
      }
      
      .primary-button {
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border: none;
      }
      
      .primary-button:hover {
        background-color: var(--primary-dark, #2563eb);
      }
      
      .outline-button {
        background-color: transparent;
        border: 1px solid #e2e8f0;
        color: var(--secondary-color, #475569);
      }
      
      .outline-button:hover {
        background-color: #f8fafc;
      }
      
      .danger-button {
        background-color: var(--error-color, #ef4444);
        color: white;
        border: none;
      }
      
      .danger-button:hover {
        background-color: #dc2626;
      }
      
      .incident-info {
        margin-bottom: 2rem;
      }
      
      .info-section {
        margin-bottom: 1.5rem;
      }
      
      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--secondary-color, #475569);
      }
      
      .info-row {
        display: flex;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
      }
      
      .info-label {
        font-weight: 500;
        color: var(--secondary-color, #475569);
        width: 140px;
        flex-shrink: 0;
      }
      
      .info-value {
        color: #334155;
        flex: 1;
      }
      
      .incident-description {
        white-space: pre-line;
        line-height: 1.6;
      }
      
      .status-section {
        background-color: #f8fafc;
        border-radius: var(--border-radius-md, 0.375rem);
        padding: 1rem;
        margin-top: 2rem;
      }
      
      .status-options {
        display: flex;
        gap: 1.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }
      
      .status-option {
        display: flex;
        align-items: center;
      }
      
      input[type="radio"] {
        margin-right: 0.5rem;
      }
      
      .detail-loader {
        display: flex;
        justify-content: center;
        padding: 2rem 0;
      }
      
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
        border: 3px solid #e2e8f0;
        border-radius: 50%;
        border-top-color: var(--primary-color, #3b82f6);
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .error-message {
        text-align: center;
        padding: 2rem;
        color: var(--error-color, #ef4444);
      }
    `;

    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="detail-container">
        <div class="detail-header">
          <h1 class="detail-title">
            ${
              this._incident
                ? `Incidente #${this._incident.id}`
                : "Detalle de Incidente"
            }
          </h1>
          
          <div class="header-buttons">
            <button id="back-btn" class="button outline-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </button>
            
            <button id="edit-btn" class="button primary-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              Editar
            </button>
            
            <button id="delete-btn" class="button danger-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Eliminar
            </button>
          </div>
        </div>
        
        <div class="detail-loader" ?hidden="${!this._loading}">
          <div class="spinner"></div>
        </div>
        
        <div class="error-message" ?hidden="${!this._error}">${
      this._error || ""
    }</div>
        
        <div class="detail-content" ?hidden="${
          this._loading || this._error || !this._incident
        }">
          <div class="incident-info">
            <div class="info-section">
              <h2 class="section-title">Información General</h2>
              
              <div class="info-row">
                <div class="info-label">Estado:</div>
                <div class="info-value">
                  <status-badge status="${
                    this._incident?.status || "pendiente"
                  }"></status-badge>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Reportado por:</div>
                <div class="info-value incident-reporter">${
                  this._incident?.reporter || ""
                }</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Fecha:</div>
                <div class="info-value incident-date">${this._formatDate(
                  this._incident?.created_at
                )}</div>
              </div>
            </div>
            
            <div class="info-section">
              <h2 class="section-title">Descripción</h2>
              <div class="incident-description">${
                this._incident?.description || ""
              }</div>
            </div>
            
            <div class="status-section">
              <h2 class="section-title">Actualizar Estado</h2>
              <div class="status-options">
                <label class="status-option">
                  <input type="radio" name="status" value="pendiente" ?checked="${
                    this._incident?.status === "pendiente"
                  }">
                  Pendiente
                </label>
                <label class="status-option">
                  <input type="radio" name="status" value="en proceso" ?checked="${
                    this._incident?.status === "en proceso"
                  }">
                  En proceso
                </label>
                <label class="status-option">
                  <input type="radio" name="status" value="resuelto" ?checked="${
                    this._incident?.status === "resuelto"
                  }">
                  Resuelto
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar event listeners
    this._addEventListeners();
  }
}

// Registrar el componente
customElements.define("incident-detail-page", IncidentDetailPage);

export default IncidentDetailPage;
