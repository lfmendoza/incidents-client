/**
 * @fileoverview Página de inicio
 * Muestra la lista de incidentes
 */

/**
 * Componente Home Page
 * @element home-page
 */
class HomePage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
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
        }
        
        .page-subtitle {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          color: var(--secondary-color, #475569);
          font-weight: normal;
        }
      `;

    // Template HTML
    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="home-container">
          <h1 class="page-title">Panel de Incidentes</h1>
          <p class="page-subtitle">Gestiona los incidentes reportados por el equipo</p>
          
          <incident-list></incident-list>
        </div>
      `;
  }
}

// Registrar el componente
customElements.define("home-page", HomePage);

export default HomePage;
