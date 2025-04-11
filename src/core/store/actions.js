/**
 * @fileoverview Definición de acciones para el store
 * Proporciona funciones creadoras de acciones tipadas
 */

// Función de utilidad para crear actionCreators con tipo y payload
function createAction(type) {
  const actionCreator = (payload) => ({ type, payload });
  actionCreator.type = type;
  return actionCreator;
}

// Definición de todos los tipos de acciones
// Se agrupan por dominio para mejor organización
const ActionTypes = {
  // Acciones de UI
  UI: {
    SET_LOADING: "ui/setLoading",
    SET_DARK_MODE: "ui/setDarkMode",
    TOGGLE_MENU: "ui/toggleMenu",
    SET_FILTER_STATUS: "ui/setFilterStatus",
  },

  // Acciones de incidentes
  INCIDENTS: {
    LOAD_INCIDENTS: "incidents/loadIncidents",
    SET_INCIDENTS: "incidents/setIncidents",
    ADD_INCIDENT: "incidents/addIncident",
    UPDATE_INCIDENT: "incidents/updateIncident",
    DELETE_INCIDENT: "incidents/deleteIncident",
    SET_CURRENT_INCIDENT: "incidents/setCurrentIncident",
    CLEAR_CURRENT_INCIDENT: "incidents/clearCurrentIncident",
  },

  // Acciones de notificaciones
  NOTIFICATIONS: {
    ADD_NOTIFICATION: "notifications/addNotification",
    REMOVE_NOTIFICATION: "notifications/removeNotification",
    MARK_NOTIFICATION_DISPLAYED: "notifications/markNotificationDisplayed",
  },

  // Acciones de errores
  ERRORS: {
    SET_ERROR: "errors/setError",
    CLEAR_ERROR: "errors/clearError",
  },
};

// Creadores de acciones
export const actions = {
  // UI
  setLoading: createAction(ActionTypes.UI.SET_LOADING),
  setDarkMode: createAction(ActionTypes.UI.SET_DARK_MODE),
  toggleMenu: createAction(ActionTypes.UI.TOGGLE_MENU),
  setFilterStatus: createAction(ActionTypes.UI.SET_FILTER_STATUS),

  // Incidentes
  loadIncidents: createAction(ActionTypes.INCIDENTS.LOAD_INCIDENTS),
  setIncidents: createAction(ActionTypes.INCIDENTS.SET_INCIDENTS),
  addIncident: createAction(ActionTypes.INCIDENTS.ADD_INCIDENT),
  updateIncident: createAction(ActionTypes.INCIDENTS.UPDATE_INCIDENT),
  deleteIncident: createAction(ActionTypes.INCIDENTS.DELETE_INCIDENT),
  setCurrentIncident: createAction(ActionTypes.INCIDENTS.SET_CURRENT_INCIDENT),
  clearCurrentIncident: createAction(
    ActionTypes.INCIDENTS.CLEAR_CURRENT_INCIDENT
  ),

  // Notificaciones
  addNotification: createAction(ActionTypes.NOTIFICATIONS.ADD_NOTIFICATION),
  removeNotification: createAction(
    ActionTypes.NOTIFICATIONS.REMOVE_NOTIFICATION
  ),
  markNotificationDisplayed: createAction(
    ActionTypes.NOTIFICATIONS.MARK_NOTIFICATION_DISPLAYED
  ),

  // Errores
  setError: createAction(ActionTypes.ERRORS.SET_ERROR),
  clearError: createAction(ActionTypes.ERRORS.CLEAR_ERROR),

  // Helpers para notificaciones con tipado predefinido
  showSuccessNotification: (message) => ({
    type: ActionTypes.NOTIFICATIONS.ADD_NOTIFICATION,
    payload: {
      id: Date.now(),
      message,
      type: "success",
      duration: 5000,
      displayed: false,
    },
  }),

  showErrorNotification: (message) => ({
    type: ActionTypes.NOTIFICATIONS.ADD_NOTIFICATION,
    payload: {
      id: Date.now(),
      message,
      type: "error",
      duration: 7000,
      displayed: false,
    },
  }),

  showWarningNotification: (message) => ({
    type: ActionTypes.NOTIFICATIONS.ADD_NOTIFICATION,
    payload: {
      id: Date.now(),
      message,
      type: "warning",
      duration: 6000,
      displayed: false,
    },
  }),

  showInfoNotification: (message) => ({
    type: ActionTypes.NOTIFICATIONS.ADD_NOTIFICATION,
    payload: {
      id: Date.now(),
      message,
      type: "info",
      duration: 5000,
      displayed: false,
    },
  }),
};

// Exportar tipos de acciones también (útil para testing)
export const ACTION_TYPES = ActionTypes;
