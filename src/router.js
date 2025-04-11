/**
 * @fileoverview Router ligero para navegación SPA
 * Implementa sistema de rutas con parámetros dinámicos y navegación por history API
 */

import { CONFIG } from "./config.js";

// Definición de rutas y componentes asociados
const routes = [
  {
    path: CONFIG.ROUTES.HOME,
    component: "home-page",
  },
  {
    path: CONFIG.ROUTES.INCIDENTS,
    component: "home-page",
  },
  {
    path: CONFIG.ROUTES.INCIDENT_DETAIL,
    component: "incident-detail-page",
    // Función para extraer parámetros de la URL
    params: (path) => {
      const match = path.match(/\/incidents\/(\d+)$/);
      return match ? { id: match[1] } : null;
    },
  },
  {
    path: CONFIG.ROUTES.CREATE_INCIDENT,
    component: "create-incident-page",
  },
  {
    path: CONFIG.ROUTES.EDIT_INCIDENT,
    component: "edit-incident-page",
    params: (path) => {
      const match = path.match(/\/incidents\/(\d+)\/edit$/);
      return match ? { id: match[1] } : null;
    },
  },
  {
    path: CONFIG.ROUTES.NOT_FOUND,
    component: "not-found-page",
  },
];

// Router outlet - Componente donde se renderizarán las vistas
class RouterOutlet extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // El router outlet se registra cuando es conectado al DOM
    window.routerOutlet = this;

    // Mostrar página inicial si ya está inicializado el router
    if (window.router && window.router.initialized) {
      window.router.navigate(window.location.pathname);
    }
  }

  // Carga la página correspondiente
  async loadPage(component, params = {}) {
    // 1. Primero limpiamos el contenido actual
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    // 2. Creamos el nuevo elemento de página
    const page = document.createElement(component);

    // 3. Si hay parámetros, los pasamos como atributos
    for (const [key, value] of Object.entries(params)) {
      page.setAttribute(`data-${key}`, value);
    }

    // 4. Agregamos la nueva página
    this.appendChild(page);

    // 5. Emitimos evento de cambio de página con información
    window.dispatchEvent(
      new CustomEvent("page-changed", {
        detail: { component, params },
      })
    );

    // 6. Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: "smooth" });

    return page;
  }
}

// Definición del Router
class Router {
  constructor() {
    this.routes = routes;
    this.initialized = false;
    this.currentRoute = null;
  }

  /**
   * Inicializar el router
   */
  init() {
    // Registramos eventos de navegación
    window.addEventListener("popstate", this._handlePopState.bind(this));

    // Interceptar clicks en links para manejo SPA
    document.body.addEventListener("click", this._handleLinkClick.bind(this));

    // Marcar como inicializado
    this.initialized = true;

    // Navegar a la ruta actual
    this.navigate(window.location.pathname, false);

    console.log("🧭 Router inicializado");
  }

  /**
   * Manejar evento de popstate (cuando se usa el botón atrás/adelante)
   * @param {PopStateEvent} event - Evento popstate
   * @private
   */
  _handlePopState(event) {
    // Navegar a la URL actual sin agregar entrada en history
    this.navigate(window.location.pathname, false);
  }

  /**
   * Interceptar clicks en links para navegación SPA
   * @param {MouseEvent} event - Evento de click
   * @private
   */
  _handleLinkClick(event) {
    // Buscar si el click fue en un link o dentro de un link
    const link = event.target.closest("a");

    // Si no es un link o es externo o tiene atributo para abrir en nueva ventana, ignorar
    if (
      !link ||
      link.hostname !== window.location.hostname ||
      link.target === "_blank" ||
      link.hasAttribute("download") ||
      link.getAttribute("rel") === "external"
    ) {
      return;
    }

    // Prevenir comportamiento por defecto
    event.preventDefault();

    // Navegar a la nueva ruta
    this.navigate(link.pathname);
  }

  /**
   * Navegar a una ruta específica
   * @param {string} path - Ruta a navegar
   * @param {boolean} [addToHistory=true] - Si se debe agregar a history
   * @returns {Promise<void>}
   */
  async navigate(path, addToHistory = true) {
    // Normalizar path
    const normalizedPath =
      path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

    // Buscar ruta que coincida
    let matchedRoute = null;
    let params = {};

    for (const route of this.routes) {
      // Coincidencia exacta
      if (route.path === normalizedPath) {
        matchedRoute = route;
        break;
      }

      // Ruta con parámetros
      if (route.params && typeof route.params === "function") {
        const extractedParams = route.params(normalizedPath);
        if (extractedParams) {
          matchedRoute = route;
          params = extractedParams;
          break;
        }
      }
    }

    // Si no se encontró ninguna ruta, mostrar 404
    if (!matchedRoute) {
      matchedRoute = this.routes.find(
        (route) => route.path === CONFIG.ROUTES.NOT_FOUND
      );
    }

    // Guardar ruta actual
    this.currentRoute = {
      path: normalizedPath,
      component: matchedRoute.component,
      params,
    };

    // Actualizar URL en el navegador si es necesario
    if (addToHistory) {
      window.history.pushState({ path: normalizedPath }, "", normalizedPath);
    }

    // Si existe el outlet, cargar la página
    if (window.routerOutlet) {
      await window.routerOutlet.loadPage(matchedRoute.component, params);
    }
  }

  /**
   * Navegar a una ruta con parámetros
   * @param {string} route - Nombre de la ruta (de CONFIG.ROUTES)
   * @param {Object} params - Parámetros para la ruta
   */
  navigateToRoute(route, params = {}) {
    // Buscar la definición de la ruta
    const routePath = CONFIG.ROUTES[route];

    if (!routePath) {
      console.error(`Ruta no encontrada: ${route}`);
      return;
    }

    // Construir la ruta con parámetros
    let path = routePath;
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, value);
    }

    // Navegar a la ruta construida
    this.navigate(path);
  }
}

// Crear una instancia del router
const router = new Router();

// Exportar función de inicialización
export function initRouter() {
  // Registrar el componente router-outlet
  if (!customElements.get("router-outlet")) {
    customElements.define("router-outlet", RouterOutlet);
  }

  // Inicializar router
  router.init();

  // Guardar referencia global
  window.router = router;

  return router;
}

// Exportar helper para acceder al router desde cualquier parte
export function getRouter() {
  return window.router;
}
