/**
 * @fileoverview Página 404 - Not Found
 * Se muestra cuando una ruta no existe
 */

import { getRouter } from "../router.js";

/**
 * Componente Not Found Page
 * @element not-found-page
 */
class NotFoundPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Binding de métodos
    this._handleBackToHome = this._handleBackToHome.bind(this);
  }

  connectedCallback() {
    this._render();
    this._addEventListeners();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  /**
   * Maneja el evento de clic en botón de volver a inicio
   * @private
   */
  _handleBackToHome() {
    const router = getRouter();
    if (router) {
      router.navigateToRoute("HOME");
    }
  }

  /**
   * Agrega event listeners
   * @private
   */
  _addEventListeners() {
    const homeBtn = this.shadowRoot.querySelector("#home-btn");
    if (homeBtn) {
      homeBtn.addEventListener("click", this._handleBackToHome);
    }
  }

  /**
   * Quita event listeners
   * @private
   */
  _removeEventListeners() {
    const homeBtn = this.shadowRoot.querySelector("#home-btn");
    if (homeBtn) {
      homeBtn.removeEventListener("click", this._handleBackToHome);
    }
  }

  _render() {
    // CSS
    const styles = `
      :host {
        display: block;
      }
      
      .not-found-container {
        text-align: center;
        padding: 3rem 1rem;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .error-code {
        font-size: 6rem;
        font-weight: 800;
        color: var(--primary-color, #3b82f6);
        line-height: 1;
        margin: 0;
        opacity: 0.5;
      }
      
      .error-title {
        font-size: 2rem;
        font-weight: 600;
        margin: 1rem 0 2rem;
        color: var(--secondary-color, #475569);
      }
      
      .error-message {
        font-size: 1.125rem;
        margin-bottom: 2rem;
        color: var(--secondary-color, #475569);
      }
      
      .home-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: var(--border-radius-md, 0.375rem);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .home-btn:hover {
        background-color: var(--primary-dark, #2563eb);
      }
      
      .not-found-image {
        max-width: 300px;
        margin: 2rem auto;
        opacity: 0.8;
      }
    `;

    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="not-found-container">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Página no encontrada</h2>
        
        <p class="error-message">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        
        <div class="not-found-image">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" fill="none">
            <path d="M250 50C137.157 50 46 141.157 46 254C46 366.843 137.157 458 250 458C362.843 458 454 366.843 454 254C454 141.157 362.843 50 250 50Z" stroke="#E2E8F0" stroke-width="8"/>
            <circle cx="180" cy="180" r="25" fill="#64748B"/>
            <circle cx="320" cy="180" r="25" fill="#64748B"/>
            <path d="M180 300C180 300 210 350 250 350C290 350 320 300 320 300" stroke="#64748B" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </div>
        
        <button id="home-btn" class="home-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Volver al inicio
        </button>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define("not-found-page", NotFoundPage);

export default NotFoundPage;
