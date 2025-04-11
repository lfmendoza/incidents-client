/**
 * @fileoverview Reducers para el store
 * Contiene funciones puras que manejan las actualizaciones de estado
 */

import { ACTION_TYPES } from "./actions.js";

/**
 * Combina varios reducers en uno solo
 * @param {Object} reducers - Objeto con reducers por sección
 * @returns {Function} Reducer combinado
 */
function combineReducers(reducers) {
  return (state, action) => {
    const nextState = {};

    // Aplicar cada reducer a su sección correspondiente del estado
    for (const [key, reducer] of Object.entries(reducers)) {
      nextState[key] = reducer(state[key], action, state);
    }

    // Mantener propiedades que no tienen reducer específico
    for (const key in state) {
      if (!reducers.hasOwnProperty(key)) {
        nextState[key] = state[key];
      }
    }

    return nextState;
  };
}

/**
 * Reducer para estado de UI
 */
function uiReducer(state = {}, action, globalState) {
  switch (action.type) {
    case ACTION_TYPES.UI.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ACTION_TYPES.UI.SET_DARK_MODE:
      return {
        ...state,
        darkMode: action.payload,
      };

    case ACTION_TYPES.UI.TOGGLE_MENU:
      return {
        ...state,
        menuOpen:
          action.payload !== undefined ? action.payload : !state.menuOpen,
      };

    case ACTION_TYPES.UI.SET_FILTER_STATUS:
      return {
        ...state,
        filterStatus: action.payload,
      };

    default:
      return state;
  }
}

/**
 * Reducer para incidentes
 */
function incidentsReducer(state = [], action, globalState) {
  switch (action.type) {
    case ACTION_TYPES.INCIDENTS.SET_INCIDENTS:
      return action.payload || [];

    case ACTION_TYPES.INCIDENTS.ADD_INCIDENT:
      return [...state, action.payload];

    case ACTION_TYPES.INCIDENTS.UPDATE_INCIDENT:
      return state.map((incident) =>
        incident.id === action.payload.id
          ? { ...incident, ...action.payload }
          : incident
      );

    case ACTION_TYPES.INCIDENTS.DELETE_INCIDENT:
      return state.filter((incident) => incident.id !== action.payload);

    default:
      return state;
  }
}

/**
 * Reducer para incidente actual
 */
function currentIncidentReducer(state = null, action, globalState) {
  switch (action.type) {
    case ACTION_TYPES.INCIDENTS.SET_CURRENT_INCIDENT:
      return action.payload;

    case ACTION_TYPES.INCIDENTS.CLEAR_CURRENT_INCIDENT:
      return null;

    case ACTION_TYPES.INCIDENTS.UPDATE_INCIDENT:
      // Si el incidente actual es el que se está actualizando, actualizar también aquí
      if (state && state.id === action.payload.id) {
        return { ...state, ...action.payload };
      }
      return state;

    case ACTION_TYPES.INCIDENTS.DELETE_INCIDENT:
      // Si el incidente actual es el que se está eliminando, limpiarlo
      if (state && state.id === action.payload) {
        return null;
      }
      return state;

    default:
      return state;
  }
}

/**
 * Reducer para notificaciones
 */
function notificationsReducer(state = [], action, globalState) {
  switch (action.type) {
    case ACTION_TYPES.NOTIFICATIONS.ADD_NOTIFICATION:
      return [...state, action.payload];

    case ACTION_TYPES.NOTIFICATIONS.REMOVE_NOTIFICATION:
      return state.filter((notification) => notification.id !== action.payload);

    case ACTION_TYPES.NOTIFICATIONS.MARK_NOTIFICATION_DISPLAYED:
      return state.map((notification) =>
        notification.id === action.payload
          ? { ...notification, displayed: true }
          : notification
      );

    default:
      return state;
  }
}

/**
 * Reducer para errores
 */
function errorReducer(state = null, action, globalState) {
  switch (action.type) {
    case ACTION_TYPES.ERRORS.SET_ERROR:
      return action.payload;

    case ACTION_TYPES.ERRORS.CLEAR_ERROR:
      return null;

    default:
      return state;
  }
}

/**
 * Reducer para estado de carga global
 */
function loadingReducer(state = false, action, globalState) {
  switch (action.type) {
    case ACTION_TYPES.UI.SET_LOADING:
      return action.payload;

    default:
      return state;
  }
}

/**
 * Crea el reducer principal de la aplicación
 * @returns {Function} Reducer combinado
 */
export function createReducer() {
  return combineReducers({
    loading: loadingReducer,
    incidents: incidentsReducer,
    currentIncident: currentIncidentReducer,
    notifications: notificationsReducer,
    error: errorReducer,
    ui: uiReducer,
  });
}
