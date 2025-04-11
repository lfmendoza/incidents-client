/**
 * @fileoverview Store centralizado para gestión de estado de la aplicación
 * Implementa un patrón similar a Redux pero más ligero
 */

import { actions } from "./actions.js";
import { createReducer } from "./reducers.js";

// Estado inicial de la aplicación
const initialState = {
  // Estado de carga global
  loading: false,
  // Datos de incidentes
  incidents: [],
  // Incidente actualmente seleccionado/detalle
  currentIncident: null,
  // Cola de notificaciones
  notifications: [],
  // Información de errores
  error: null,
  // Estado de la UI
  ui: {
    darkMode: localStorage.getItem("darkMode") === "true",
    menuOpen: false,
    filterStatus: "all",
  },
  // Historial de acciones para depuración
  _actionLog: [],
};

/**
 * Clase Store - Implementa patrón observable para gestión de estado
 */
class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = initialState;
    this.subscribers = new Set();
    this.middlewares = [];
    this.actionCounter = 0;

    // Para depuración y desarrollo
    if (process.env.NODE_ENV === "development") {
      this._exposeToWindow();
    }
  }

  /**
   * Expone el store para debugging en development
   * @private
   */
  _exposeToWindow() {
    window.__store = {
      getState: () => this.state,
      dispatch: this.dispatch.bind(this),
      subscribe: this.subscribe.bind(this),
      unsubscribe: this.unsubscribe.bind(this),
    };
  }

  /**
   * Obtiene el estado actual
   * @returns {Object} Estado actual
   */
  getState() {
    return this.state;
  }

  /**
   * Despacha una acción al store
   * @param {Object} action - Acción a despachar
   * @returns {Object} La acción despachada
   */
  dispatch = (action) => {
    if (typeof action !== "object" || !action.type) {
      throw new Error(
        'Las acciones deben ser objetos con una propiedad "type"'
      );
    }

    // Agregar metadatos a la acción
    const enhancedAction = {
      ...action,
      _id: ++this.actionCounter,
      _timestamp: Date.now(),
    };

    // Ejecutar middlewares
    const middlewarePromises = this.middlewares.map((middleware) => {
      return middleware(this)(enhancedAction);
    });

    // Procesar la acción una vez que todos los middlewares hayan terminado
    Promise.all(middlewarePromises).then(() => {
      // Calcular nuevo estado aplicando el reducer
      const nextState = this.reducer(this.state, enhancedAction);

      // Guardar acción en el log si está habilitado
      if (process.env.NODE_ENV === "development") {
        nextState._actionLog = [
          ...this.state._actionLog.slice(-19), // Mantener solo las últimas 20 acciones
          {
            type: enhancedAction.type,
            payload: enhancedAction.payload,
            timestamp: enhancedAction._timestamp,
          },
        ];
      }

      // Actualizar estado
      this.state = nextState;

      // Notificar a los suscriptores
      this.notifySubscribers();
    });

    return enhancedAction;
  };

  /**
   * Registra un middleware
   * @param {Function} middleware - Función middleware
   */
  applyMiddleware(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Registra un suscriptor para recibir actualizaciones de estado
   * @param {Function} subscriber - Función a ejecutar cuando el estado cambie
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(subscriber) {
    if (typeof subscriber !== "function") {
      throw new Error("El suscriptor debe ser una función");
    }

    this.subscribers.add(subscriber);

    // Devolver función para cancelar suscripción
    return () => {
      this.unsubscribe(subscriber);
    };
  }

  /**
   * Cancela la suscripción de un suscriptor
   * @param {Function} subscriber - Suscriptor a eliminar
   */
  unsubscribe(subscriber) {
    this.subscribers.delete(subscriber);
  }

  /**
   * Notifica a todos los suscriptores sobre cambios en el estado
   * @private
   */
  notifySubscribers() {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error("Error en suscriptor del store:", error);
      }
    }
  }

  /**
   * Restablece el estado a su valor inicial
   */
  reset() {
    this.state = initialState;
    this.notifySubscribers();
  }
}

// Crear una instancia del reducer
const reducer = createReducer();

// Crear instancia del store
const store = new Store(reducer, initialState);

// Logger middleware para desarrollo
if (process.env.NODE_ENV === "development") {
  store.applyMiddleware((store) => (action) => {
    console.group(
      `%c Acción: ${action.type}`,
      "color: #3b82f6; font-weight: bold;"
    );
    console.log("%c Acción:", "color: #64748b;", action);
    console.log("%c Estado anterior:", "color: #64748b;", store.getState());

    // Middleware asíncrono - devolvemos una promesa
    return Promise.resolve().then(() => {
      console.log("%c Estado siguiente:", "color: #64748b;", store.getState());
      console.groupEnd();
    });
  });
}

// Middleware para persistencia selectiva en localStorage
store.applyMiddleware((store) => (action) => {
  // Ejecutar después de que se actualice el estado
  return Promise.resolve().then(() => {
    const state = store.getState();

    // Persistir preferencias de UI
    if (action.type === actions.SET_DARK_MODE.type) {
      localStorage.setItem("darkMode", state.ui.darkMode);
    }
  });
});

/**
 * Inicializa el store y carga datos iniciales si es necesario
 * @returns {Promise<void>}
 */
export function initStore() {
  return Promise.resolve();
}

// Exportar store y acciones
export { store, actions };
