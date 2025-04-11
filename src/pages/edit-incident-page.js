/**
 * @fileoverview Página de edición de incidentes
 * Muestra el formulario para editar un incidente existente
 */

/**
 * Componente Edit Incident Page
 * @element edit-incident-page
 *
 * @attr {string} data-id - ID del incidente a editar
 */
class EditIncidentPage extends HTMLElement {
  static get observedAttributes() {
    return ["data-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
  }

  // Getters
  get incidentId() {
    return this.getAttribute("data-id");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data-id" && oldValue !== newValue && this.isConnected) {
      // Actualizar el formulario con el nuevo ID
      const form = this.shadowRoot.querySelector("incident-form");
      if (form) {
        form.setAttribute("incident-id", newValue);
      }
    }
  }

  /**
   * Maneja el evento de formulario enviado
   * @param {CustomEvent} event - Evento del formulario
   * @private
   */
  _handleFormSubmit(event) {
    // La navegación se maneja en el componente de formulario
    console.log("Incidente actualizado:", event.detail.incident);
  }

  /**
   * Maneja el evento de cancelación de formulario
   * @param {CustomEvent} event - Evento de cancelación
   * @private
   */
  _handleFormCancel() {
    // La navegación se maneja en el componente de formulario
  }

  /**
   * Agrega event listeners
   * @private
   */
  _addEventListeners() {
    const form = this.shadowRoot.querySelector("incident-form");

    if (form) {
      form.addEventListener("incident-form:submit", this._handleFormSubmit);
      form.addEventListener("incident-form:cancel", this._handleFormCancel);
    }
  }

  /**
   * Quita event listeners
   * @private
   */
  _removeEventListeners() {
    const form = this.shadowRoot.querySelector("incident-form");

    if (form) {
      form.removeEventListener("incident-form:submit", this._handleFormSubmit);
      form.removeEventListener("incident-form:cancel", this._handleFormCancel);
    }
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  _render() {
    // CSS
    const styles = `
        :host {
          display: block;
        }
        
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--secondary-color, #475569);
          text-align: center;
        }
      `;

    // Template HTML
    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="edit-incident-container">
          <h1 class="page-title">Editar Incidente</h1>
          
          <incident-form 
            mode="edit" 
            incident-id="${this.incidentId || ""}"
          ></incident-form>
        </div>
      `;

    // Agregar event listeners
    this._addEventListeners();
  }
}

// Registrar el componente
customElements.define("edit-incident-page", EditIncidentPage);

export default EditIncidentPage;
