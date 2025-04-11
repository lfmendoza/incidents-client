/**
 * @fileoverview Página de creación de incidentes
 * Muestra el formulario para crear nuevos incidentes
 */

/**
 * Componente Create Incident Page
 * @element create-incident-page
 */
class CreateIncidentPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
  }

  /**
   * Maneja el evento de formulario enviado
   * @param {CustomEvent} event - Evento del formulario
   * @private
   */
  _handleFormSubmit(event) {
    // La navegación se maneja en el componente de formulario
    console.log("Incidente creado:", event.detail.incident);
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
        <div class="create-incident-container">
          <h1 class="page-title">Crear Nuevo Incidente</h1>
          
          <incident-form mode="create"></incident-form>
        </div>
      `;

    // Agregar event listeners
    this._addEventListeners();
  }
}

// Registrar el componente
customElements.define("create-incident-page", CreateIncidentPage);

export default CreateIncidentPage;
