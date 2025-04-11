/**
 * @fileoverview Configuración centralizada de la aplicación
 * Mantiene valores constantes y configuración del entorno
 */

export const CONFIG = {
  // API
  API_BASE_URL: "http://localhost:3000",

  // Rutas de la aplicación
  ROUTES: {
    HOME: "/",
    INCIDENTS: "/incidents",
    INCIDENT_DETAIL: "/incidents/:id",
    CREATE_INCIDENT: "/incidents/create",
    EDIT_INCIDENT: "/incidents/:id/edit",
    NOT_FOUND: "/404",
  },

  // Estados de incidentes
  INCIDENT_STATUS: {
    PENDING: "pendiente",
    IN_PROGRESS: "en proceso",
    RESOLVED: "resuelto",
  },

  // Configuración de Workers
  WORKERS: {
    API_WORKER: "src/core/workers/api.worker.js",
  },

  // Ajustes de rendimiento
  PERFORMANCE: {
    // Tamaño de lote para renderizar grandes cantidades de elementos
    RENDER_BATCH_SIZE: 20,
    // Tiempo en ms entre renderizados de lotes para no bloquear el hilo principal
    RENDER_BATCH_DELAY: 10,
    // Opciones para Intersection Observer (lazy loading)
    INTERSECTION_OBSERVER: {
      rootMargin: "200px",
      threshold: 0.1,
    },
  },

  // Validaciones
  VALIDATION: {
    INCIDENT_DESCRIPTION_MIN_LENGTH: 10,
  },

  // Tiempos de caché
  CACHE: {
    // Tiempo de caché para datos de incidentes (5 minutos)
    INCIDENTS_TTL: 5 * 60 * 1000,
  },
};

/**
 * Método para unir una ruta relativa con la URL base de la API
 * @param {string} path - Ruta relativa
 * @returns {string} URL completa
 */
export function apiUrl(path) {
  return `${CONFIG.API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Reemplaza parámetros en una ruta con valores reales
 * @param {string} route - Ruta con parámetros (ej: '/incidents/:id')
 * @param {Object} params - Objeto con valores de parámetros
 * @returns {string} Ruta con parámetros reemplazados
 */
export function buildRoute(route, params = {}) {
  let result = route;

  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }

  return result;
}

export default CONFIG;
