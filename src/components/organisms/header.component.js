/**
 * @fileoverview Componente de cabecera de la aplicación
 * Implementa la navegación y el encabezado principal
 */

import { store, actions } from "../../core/store/store.js";
import { getRouter } from "../../router.js";

/**
 * Componente Header - Componente de organismo
 * @element app-header
 */
class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Estado interno
    this._darkMode = false;
    this._menuOpen = false;

    // Binding de métodos
    this._toggleMenu = this._toggleMenu.bind(this);
    this._handleHomeClick = this._handleHomeClick.bind(this);
    this._toggleDarkMode = this._toggleDarkMode.bind(this);
    this._handleStoreUpdate = this._handleStoreUpdate.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando el componente se conecta al DOM
  connectedCallback() {
    // Agregar event listeners
    this._addEventListeners();

    // Suscribirse al store para actualizaciones
    this._unsubscribeStore = store.subscribe(this._handleStoreUpdate);

    // Comprobar estado inicial
    const state = store.getState();
    this._darkMode = state.ui.darkMode;
    this._menuOpen = state.ui.menuOpen;
    this._updateHeader();
  }

  // Lifecycle: Cuando el componente se desconecta del DOM
  disconnectedCallback() {
    // Limpiar event listeners
    this._removeEventListeners();

    // Cancelar suscripción al store
    if (this._unsubscribeStore) {
      this._unsubscribeStore();
    }
  }

  /**
   * Maneja actualizaciones del store
   * @param {Object} state - Estado actual del store
   * @private
   */
  _handleStoreUpdate(state) {
    // Actualizar si cambia el modo oscuro
    if (state.ui.darkMode !== this._darkMode) {
      this._darkMode = state.ui.darkMode;
      this._updateDarkModeToggle();
    }

    // Actualizar si cambia el estado del menú
    if (state.ui.menuOpen !== this._menuOpen) {
      this._menuOpen = state.ui.menuOpen;
      this._updateMenuState();
    }
  }

  /**
   * Agregar event listeners
   * @private
   */
  _addEventListeners() {
    const menuToggle = this.shadowRoot.querySelector(".menu-toggle");
    const homeLink = this.shadowRoot.querySelector(".home-link");
    const darkModeToggle = this.shadowRoot.querySelector(".dark-mode-toggle");

    if (menuToggle) menuToggle.addEventListener("click", this._toggleMenu);
    if (homeLink) homeLink.addEventListener("click", this._handleHomeClick);
    if (darkModeToggle)
      darkModeToggle.addEventListener("click", this._toggleDarkMode);

    // Escuchar clics fuera del menú para cerrarlo en móvil
    document.addEventListener("click", this._handleOutsideClick);
  }

  /**
   * Quitar event listeners
   * @private
   */
  _removeEventListeners() {
    const menuToggle = this.shadowRoot.querySelector(".menu-toggle");
    const homeLink = this.shadowRoot.querySelector(".home-link");
    const darkModeToggle = this.shadowRoot.querySelector(".dark-mode-toggle");

    if (menuToggle) menuToggle.removeEventListener("click", this._toggleMenu);
    if (homeLink) homeLink.removeEventListener("click", this._handleHomeClick);
    if (darkModeToggle)
      darkModeToggle.removeEventListener("click", this._toggleDarkMode);

    document.removeEventListener("click", this._handleOutsideClick);
  }

  /**
   * Maneja clics fuera del componente para cerrar menú móvil
   * @param {Event} event - Evento de clic
   * @private
   */
  _handleOutsideClick(event) {
    // Solo procesar si el menú está abierto
    if (!this._menuOpen) return;

    // Verificar si el clic fue dentro de este componente
    const isInside = event.composedPath().includes(this);

    if (!isInside) {
      store.dispatch(actions.toggleMenu(false));
    }
  }

  /**
   * Alternar estado del menú móvil
   * @private
   */
  _toggleMenu() {
    store.dispatch(actions.toggleMenu(!this._menuOpen));
  }

  /**
   * Manejar clic en enlace de inicio
   * @param {Event} event - Evento de clic
   * @private
   */
  _handleHomeClick(event) {
    event.preventDefault();

    // Navegar a inicio
    const router = getRouter();
    if (router) {
      router.navigateToRoute("HOME");
    }

    // Cerrar menú en móvil
    if (this._menuOpen) {
      store.dispatch(actions.toggleMenu(false));
    }
  }

  /**
   * Alternar modo oscuro
   * @private
   */
  _toggleDarkMode() {
    store.dispatch(actions.setDarkMode(!this._darkMode));
  }

  /**
   * Actualiza el estado del toggle de modo oscuro
   * @private
   */
  _updateDarkModeToggle() {
    const toggle = this.shadowRoot.querySelector(".dark-mode-toggle");
    if (toggle) {
      toggle.setAttribute("aria-checked", this._darkMode ? "true" : "false");
      toggle.title = this._darkMode
        ? "Cambiar a modo claro"
        : "Cambiar a modo oscuro";

      // Actualizar icono
      const icon = toggle.querySelector("svg");
      if (icon) {
        icon.innerHTML = this._darkMode
          ? '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>' // Luna
          : '<circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>'; // Sol
      }
    }

    // Aplicar clase al cuerpo del documento
    if (this._darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }

  /**
   * Actualiza el estado del menú
   * @private
   */
  _updateMenuState() {
    const navMenu = this.shadowRoot.querySelector(".nav-menu");
    const menuToggle = this.shadowRoot.querySelector(".menu-toggle");

    if (navMenu) {
      navMenu.classList.toggle("open", this._menuOpen);
    }

    if (menuToggle) {
      menuToggle.setAttribute(
        "aria-expanded",
        this._menuOpen ? "true" : "false"
      );

      // Actualizar icono
      const icon = menuToggle.querySelector("svg");
      if (icon) {
        icon.innerHTML = this._menuOpen
          ? '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' // X (cerrar)
          : '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>'; // Hamburguesa
      }
    }
  }

  /**
   * Actualiza el encabezado completo
   * @private
   */
  _updateHeader() {
    this._updateDarkModeToggle();
    this._updateMenuState();
  }

  /**
   * Renderiza el componente completo
   * @private
   */
  _render() {
    // CSS
    const styles = `
      :host {
        display: block;
        width: 100%;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
      }
      
      .logo-container {
        display: flex;
        align-items: center;
      }
      
      .logo {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .logo-icon {
        display: flex;
      }
      
      .nav-menu {
        display: flex;
        gap: 1.5rem;
        align-items: center;
      }
      
      .nav-link {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem;
        border-radius: var(--border-radius-md, 0.375rem);
        transition: all 0.15s ease;
      }
      
      .nav-link:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .home-link {
        color: white;
      }
      
      .icon-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        padding: 0.5rem;
        border-radius: var(--border-radius-full, 9999px);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      
      .icon-btn:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .dark-mode-toggle {
        margin-left: 0.5rem;
      }
      
      .menu-toggle {
        display: none;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .menu-toggle {
          display: flex;
          z-index: 20;
        }
        
        .nav-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 250px;
          flex-direction: column;
          background-color: var(--primary-dark, #1d4ed8);
          padding: 5rem 1rem 1rem;
          z-index: 10;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        
        .nav-menu.open {
          transform: translateX(0);
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
        }
        
        .nav-link {
          width: 100%;
          padding: 0.75rem 1rem;
        }
      }
    `;

    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="header">
        <div class="logo-container">
          <a href="/" class="logo home-link">
            <span class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            <span>Sistema de Incidentes</span>
          </a>
        </div>
        
        <button class="icon-btn menu-toggle" aria-label="Menú" aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <nav class="nav-menu">
          <a href="/" class="nav-link home-link">Inicio</a>
          <a href="/incidents/create" class="nav-link">Nuevo Incidente</a>
          
          <button class="icon-btn dark-mode-toggle" aria-label="Alternar modo oscuro" title="Cambiar a modo oscuro" aria-checked="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
            </svg>
          </button>
        </nav>
      </div>
    `;

    // Actualizar componente
    this._updateHeader();
  }
}

// Registrar el componente
customElements.define("app-header", HeaderComponent);

export default HeaderComponent;
