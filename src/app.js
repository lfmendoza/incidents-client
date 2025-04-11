/**
 * @fileoverview Punto de entrada principal de la aplicación
 * Inicializa componentes, workers, router y store
 */

// Importación de módulos core
import { initRouter } from "./router.js";
import { initStore } from "./core/store/store.js";
import { initWorkerBridge } from "./core/workers/worker-bridge.js";

// Importación de Servicios
import { ApiService } from "./core/services/api.service.js";
import { NotificationService } from "./core/services/notification.service.js";

// Importación de componentes
import "./components/atoms/button.component.js";
import "./components/atoms/input.component.js";
import "./components/atoms/loader.component.js";
import "./components/molecules/form-group.component.js";
import "./components/molecules/incident-card.component.js";
import "./components/molecules/status-badge.component.js";
import "./components/organisms/incident-form.component.js";
import "./components/organisms/incident-list.component.js";
import "./components/organisms/header.component.js";
import "./components/templates/incidents-page.component.js";
import "./components/templates/incident-detail-page.component.js";
import "./components/templates/create-incident-page.component.js";

// Importación de páginas
import "./pages/home-page.js";
import "./pages/incident-detail-page.js";
import "./pages/create-incident-page.js";
import "./pages/edit-incident-page.js";
import "./pages/not-found-page.js";

// App Shell Component
class AppShell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initApp();
  }

  /**
   * Inicializa todos los componentes core de la aplicación
   * en el orden correcto para garantizar dependencias
   */
  async initApp() {
    console.log("🚀 Iniciando aplicación...");

    try {
      // 1. Inicializar el Worker Bridge para comunicación con web workers
      await initWorkerBridge();
      console.log("✅ Worker Bridge inicializado");

      // 2. Inicializar el store global para state management
      await initStore();
      console.log("✅ Store inicializado");

      // 3. Inicializar servicios singleton
      ApiService.init();
      NotificationService.init();
      console.log("✅ Servicios inicializados");

      // 4. Inicializar el router al final cuando todo está listo
      initRouter();
      console.log("✅ Router inicializado");

      // Registrar evento de app ready
      window.dispatchEvent(new CustomEvent("app-ready"));

      // Medir tiempo de carga para analytics
      if (window.performance) {
        const loadTime = Math.round(performance.now());
        console.log(`📊 Aplicación inicializada en ${loadTime}ms`);
      }
    } catch (error) {
      console.error("❌ Error al inicializar la aplicación:", error);
      this.showErrorState();
    }
  }

  /**
   * Muestra un estado de error cuando falla la inicialización
   */
  showErrorState() {
    const main = this.shadowRoot.querySelector("main");
    if (main) {
      main.innerHTML = `
        <div class="error-container">
          <h2>¡Ups! Algo salió mal</h2>
          <p>No pudimos inicializar la aplicación correctamente.</p>
          <button class="btn btn-primary" id="retry-btn">Reintentar</button>
        </div>
      `;

      const retryBtn = main.querySelector("#retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          window.location.reload();
        });
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
        }
        
        header {
          background-color: var(--primary-color);
          color: white;
          padding: var(--spacing-md) 0;
          box-shadow: var(--shadow-md);
        }
        
        main {
          padding: var(--spacing-lg) 0;
          min-height: calc(100vh - 160px);
        }
        
        footer {
          padding: var(--spacing-md) 0;
          background-color: var(--secondary-color);
          color: white;
          text-align: center;
          font-size: var(--font-size-sm);
        }
        
        .error-container {
          max-width: 500px;
          margin: 0 auto;
          padding: var(--spacing-xl);
          text-align: center;
          background-color: var(--surface-color);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
        }
        
        .error-container h2 {
          color: var(--error-color);
          margin-bottom: var(--spacing-md);
        }
        
        .error-container p {
          margin-bottom: var(--spacing-lg);
        }
        
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-md);
        }
        
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          opacity: 0;
          visibility: hidden;
          transition: opacity var(--transition-normal), visibility var(--transition-normal);
        }
        
        .loading-overlay.active {
          opacity: 1;
          visibility: visible;
        }
      </style>
      
      <header>
        <div class="container">
          <app-header></app-header>
        </div>
      </header>
      
      <main>
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </main>
      
      <footer>
        <div class="container">
          <p>Sistema de Gestión de Incidentes &copy; ${new Date().getFullYear()}</p>
        </div>
      </footer>
      
      <div class="loading-overlay" id="loading-overlay">
        <app-loader size="large"></app-loader>
      </div>
    `;
  }
}

// Registrar componente principal
customElements.define("app-shell", AppShell);

// Detección de características para garantizar compatibilidad
(() => {
  const requiredFeatures = [
    "customElements" in window,
    "attachShadow" in Element.prototype,
    "import" in document.createElement("link"),
    "content" in document.createElement("template"),
    "Promise" in window,
    "fetch" in window,
    "from" in Array,
  ];

  const allFeaturesSupported = requiredFeatures.every((feature) => feature);

  if (!allFeaturesSupported) {
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Navegador no compatible</h2>
        <p>Esta aplicación requiere un navegador moderno. Por favor, actualiza tu navegador o usa Chrome, Firefox, Safari o Edge.</p>
      </div>
    `;
  }
})();

// Registro de Service Worker para soporte offline (si está en producción)
if ("serviceWorker" in navigator && location.hostname !== "localhost") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "✅ Service Worker registrado con éxito:",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("❌ Error al registrar Service Worker:", error);
      });
  });
}

// Exportar una instancia de la aplicación para acceso global
export const App = {
  showLoading() {
    const loadingOverlay = document
      .querySelector("app-shell")
      ?.shadowRoot?.querySelector("#loading-overlay");

    if (loadingOverlay) {
      loadingOverlay.classList.add("active");
    }
  },

  hideLoading() {
    const loadingOverlay = document
      .querySelector("app-shell")
      ?.shadowRoot?.querySelector("#loading-overlay");

    if (loadingOverlay) {
      loadingOverlay.classList.remove("active");
    }
  },
};
