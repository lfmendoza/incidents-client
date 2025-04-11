/**
 * @fileoverview Servicio para interactuar con la API REST
 * Utiliza un Web Worker para realizar las peticiones HTTP sin bloquear el hilo principal
 */

import { apiUrl }

// Exportar instancia singleton
export const ApiService = new ApiServiceClass(); from '../../config.js';
import { sendToWorker } from '../workers/worker-bridge.js';
import { store, actions } from '../store/store.js';

/**
 * Servicio de API - Singleton
 */
class ApiServiceClass {
  constructor() {
    this.initialized = false;
    this.pendingRequests = new Set();
  }
  
  /**
   * Inicializa el servicio
   */
  init() {
    if (this.initialized) return;
    
    // Escuchar cambios en la navegación para cancelar peticiones pendientes
    window.addEventListener('page-changed', () => {
      this.abortPendingRequests();
    });
    
    this.initialized = true;
    console.log('✅ API Service inicializado');
  }
  
  /**
   * Cancela todas las peticiones pendientes
   * Útil cuando el usuario navega a otra página y las respuestas ya no son relevantes
   */
  abortPendingRequests() {
    // En una implementación más completa, aquí se podría usar AbortController
    // para cancelar peticiones fetch pendientes en el worker
    this.pendingRequests.clear();
  }
  
  /**
   * Maneja errores de API de forma centralizada
   * @param {Object} error - Error de respuesta
   * @private
   */
  _handleError(error) {
    // Disparar acción en el store para manejo centralizado de errores
    store.dispatch(actions.setError({
      message: error.message || 'Error de comunicación con el servidor',
      code: error.status || 'NETWORK_ERROR',
      timestamp: Date.now()
    }));
    
    // Re-lanzar el error para manejo específico en componentes
    throw error;
  }
  
  /**
   * Realiza una petición a la API
   * @param {string} method - Método HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<any>} Datos de respuesta
   */
  async request(method, endpoint, options = {}) {
    const { body, params, useCache = true, showLoader = true } = options;
    
    try {
      // Construir URL completa
      let url = apiUrl(endpoint);
      
      // Agregar parámetros de query si existen
      if (params) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        }
        
        const queryString = queryParams.toString();
        if (queryString) {
          url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
        }
      }
      
      // Marcar como petición en curso
      const requestId = `${method}:${url}:${Date.now()}`;
      this.pendingRequests.add(requestId);
      
      // Mostrar loader global si se solicita
      if (showLoader) {
        store.dispatch(actions.setLoading(true));
      }
      
      // Realizar la petición a través del worker
      const response = await sendToWorker('api', 'request', {
        url,
        method,
        body,
        useCache: useCache && method === 'GET',
        cacheTTL: 300000 // 5 minutos de caché por defecto
      });
      
      // Petición completada, eliminar del tracking
      this.pendingRequests.delete(requestId);
      
      // Ocultar loader si no hay más peticiones pendientes y se solicitó mostrar
      if (showLoader && this.pendingRequests.size === 0) {
        store.dispatch(actions.setLoading(false));
      }
      
      // Verificar si la petición fue exitosa
      if (!response.success) {
        // Construir objeto de error estandarizado
        const error = {
          message: response.data?.error || 'Error en la petición',
          status: response.status,
          data: response.data
        };
        
        return this._handleError(error);
      }
      
      // Devolver datos de respuesta
      return response.data;
    } catch (error) {
      // Error inesperado (network, timeout, etc)
      this._handleError({
        message: error.message || 'Error de conexión',
        status: 'NETWORK_ERROR'
      });
    }
  }
  
  /**
   * Petición GET
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<any>} Datos de respuesta
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }
  
  /**
   * Petición POST
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<any>} Datos de respuesta
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, { ...options, body: data });
  }
  
  /**
   * Petición PUT
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<any>} Datos de respuesta
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, { ...options, body: data });
  }
  
  /**
   * Petición DELETE
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<any>} Datos de respuesta
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }
  
  /**
   * Purga la caché de API
   * @param {Object} [options={}] - Opciones de purga
   * @returns {Promise<Object>} Resultado de la purga
   */
  async purgeCache(options = {}) {
    return sendToWorker('api', 'purgeCache', options);
  }
  
  /**
   * Obtiene estadísticas del caché
   * @returns {Promise<Object>} Estadísticas del caché
   */
  async getCacheStats() {
    return sendToWorker('api', 'getCacheStats');
  }
  
  // API específica para incidentes
  
  /**
   * Obtiene todos los incidentes
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<Array>} Lista de incidentes
   */
  async getIncidents(options = {}) {
    return this.get('incidents', options);
  }
  
  /**
   * Obtiene un incidente por ID
   * @param {number|string} id - ID del incidente
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<Object>} Datos del incidente
   */
  async getIncidentById(id, options = {}) {
    return this.get(`incidents/${id}`, options);
  }
  
  /**
   * Crea un nuevo incidente
   * @param {Object} data - Datos del incidente
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<Object>} Incidente creado
   */
  async createIncident(data, options = {}) {
    return this.post('incidents', data, options);
  }
  
  /**
   * Actualiza el estado de un incidente
   * @param {number|string} id - ID del incidente
   * @param {string} status - Nuevo estado
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<Object>} Incidente actualizado
   */
  async updateIncidentStatus(id, status, options = {}) {
    return this.put(`incidents/${id}`, { status }, options);
  }
  
  /**
   * Elimina un incidente
   * @param {number|string} id - ID del incidente
   * @param {Object} [options={}] - Opciones adicionales
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteIncident(id, options = {}) {
    return this.delete(`incidents/${id}`, options);
  }
}