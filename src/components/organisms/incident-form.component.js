/**
 * @fileoverview Componente de formulario para incidentes
 * Gestiona creación y edición de incidentes
 */

import { CONFIG } from '../../config.js';
import { ApiService } from '../../core/services/api.service.js';
import { store, actions } from '../../core/store/store.js';
import { getRouter } from '../../router.js';

/**
 * Componente Incident Form - Componente de organismo
 * @element incident-form
 * 
 * @attr {string} incident-id - ID del incidente (para modo edición)
 * @attr {string} mode - Modo del formulario (create, edit)
 * 
 * @fires incident-form:submit - Cuando se envía el formulario exitosamente
 * @fires incident-form:cancel - Cuando se cancela la operación
 */
class IncidentFormComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return ['incident-id', 'mode'];
  }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Estado interno
    this._incidentId = null;
    this._mode = 'create';
    this._formData = {
      reporter: '',
      description: '',
      status: CONFIG.INCIDENT_STATUS.PENDING
    };
    this._formErrors = {
      reporter: '',
      description: ''
    };
    this._isLoading = false;
    this._isSubmitting = false;
    
    // Binding de métodos
    this._handleSubmit = this._handleSubmit.bind(this);
    this._handleCancel = this._handleCancel.bind(this);
    this._handleInput = this._handleInput.bind(this);
    this._handleStatusChange = this._handleStatusChange.bind(this);
    
    // Inicializar
    this._render();
  }
  
  // Lifecycle: Cuando el componente se conecta al DOM
  connectedCallback() {
    // Agregar event listeners
    this._addEventListeners();
    
    // Cargar datos si estamos en modo edición
    if (this._mode === 'edit' && this._incidentId) {
      this._loadIncidentData();
    }
  }
  
  // Lifecycle: Cuando el componente se desconecta del DOM
  disconnectedCallback() {
    // Limpiar event listeners
    this._removeEventListeners();
  }
  
  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'incident-id':
        this._incidentId = newValue;
        if (this._mode === 'edit' && newValue && this.isConnected) {
          this._loadIncidentData();
        }
        break;
      case 'mode':
        this._mode = newValue || 'create';
        this._updateForm();
        break;
    }
  }
  
  // Getters y setters
  get incidentId() {
    return this._incidentId;
  }
  
  set incidentId(value) {
    this.setAttribute('incident-id', value);
  }
  
  get mode() {
    return this._mode;
  }
  
  set mode(value) {
    this.setAttribute('mode', value);
  }
  
  /**
   * Agregar event listeners
   * @private
   */
  _addEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
    const statusOptions = this.shadowRoot.querySelectorAll('input[name="status"]');
    
    if (form) form.addEventListener('submit', this._handleSubmit);
    if (cancelBtn) cancelBtn.addEventListener('click', this._handleCancel);
    
    // Event listeners para inputs
    const reporterInput = this.shadowRoot.querySelector('#reporter');
    const descriptionInput = this.shadowRoot.querySelector('#description');
    
    if (reporterInput) reporterInput.addEventListener('input', this._handleInput);
    if (descriptionInput) descriptionInput.addEventListener('input', this._handleInput);
    
    // Event listeners para radio de status
    statusOptions.forEach(radio => {
      radio.addEventListener('change', this._handleStatusChange);
    });
  }
  
  /**
   * Quitar event listeners
   * @private
   */
  _removeEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
    const statusOptions = this.shadowRoot.querySelectorAll('input[name="status"]');
    
    if (form) form.removeEventListener('submit', this._handleSubmit);
    if (cancelBtn) cancelBtn.removeEventListener('click', this._handleCancel);
    
    // Limpiar listeners de inputs
    const reporterInput = this.shadowRoot.querySelector('#reporter');
    const descriptionInput = this.shadowRoot.querySelector('#description');
    
    if (reporterInput) reporterInput.removeEventListener('input', this._handleInput);
    if (descriptionInput) descriptionInput.removeEventListener('input', this._handleInput);
    
    // Limpiar listeners de radio de status
    statusOptions.forEach(radio => {
      radio.removeEventListener('change', this._handleStatusChange);
    });
  }
  
  /**
   * Carga datos del incidente para edición
   * @private
   */
  async _loadIncidentData() {
    try {
      this._isLoading = true;
      this._updateForm();
      
      // Buscar primero en el store para evitar petición
      const state = store.getState();
      let incident = state.incidents.find(inc => inc.id == this._incidentId);
      
      // Si no está en el store, hacer petición a la API
      if (!incident) {
        incident = await ApiService.getIncidentById(this._incidentId);
        
        // Actualizar store
        if (incident) {
          store.dispatch(actions.setCurrentIncident(incident));
        }
      }
      
      if (incident) {
        // Actualizar formData
        this._formData = {
          reporter: incident.reporter || '',
          description: incident.description || '',
          status: incident.status || CONFIG.INCIDENT_STATUS.PENDING
        };
        
        // Actualizar UI
        this._updateForm();
      } else {
        // Mostrar error
        store.dispatch(actions.showErrorNotification('No se encontró el incidente'));
        this._handleCancel();
      }
    } catch (error) {
      console.error('Error al cargar incidente:', error);
      store.dispatch(actions.showErrorNotification('Error al cargar el incidente'));
    } finally {
      this._isLoading = false;
      this._updateForm();
    }
  }
  
  /**
   * Maneja cambios en los inputs
   * @param {Event} event - Evento de input
   * @private
   */
  _handleInput(event) {
    const { name, value } = event.target;
    
    // Actualizar formData
    this._formData = {
      ...this._formData,
      [name]: value
    };
    
    // Validar campo
    this._validateField(name, value);
    
    // Actualizar UI
    this._updateField(name);
  }
  
  /**
   * Maneja cambios en el estado del incidente
   * @param {Event} event - Evento de cambio
   * @private
   */
  _handleStatusChange(event) {
    const { value } = event.target;
    
    // Actualizar formData
    this._formData.status = value;
  }
  
  /**
   * Valida un campo específico
   * @param {string} name - Nombre del campo
   * @param {string} value - Valor del campo
   * @private
   */
  _validateField(name, value) {
    // Reset del error
    this._formErrors[name] = '';
    
    // Validar según campo
    switch (name) {
      case 'reporter':
        if (!value.trim()) {
          this._formErrors.reporter = 'El nombre del reportador es obligatorio';
        }
        break;
      case 'description':
        if (!value.trim()) {
          this._formErrors.description = 'La descripción es obligatoria';
        } else if (value.trim().length < CONFIG.VALIDATION.INCIDENT_DESCRIPTION_MIN_LENGTH) {
          this._formErrors.description = `La descripción debe tener al menos ${CONFIG.VALIDATION.INCIDENT_DESCRIPTION_MIN_LENGTH} caracteres`;
        }
        break;
    }
  }
  
  /**
   * Valida todo el formulario
   * @returns {boolean} True si es válido
   * @private
   */
  _validateForm() {
    // Validar cada campo
    this._validateField('reporter', this._formData.reporter);
    this._validateField('description', this._formData.description);
    
    // Actualizar UI
    this._updateField('reporter');
    this._updateField('description');
    
    // Verificar si hay errores
    return !Object.values(this._formErrors).some(error => error);
  }
  
  /**
   * Actualiza un campo específico en la UI
   * @param {string} name - Nombre del campo
   * @private
   */
  _updateField(name) {
    const input = this.shadowRoot.querySelector(`#${name}`);
    const errorElement = this.shadowRoot.querySelector(`.${name}-error`);
    
    if (input) {
      input.value = this._formData[name];
      
      // Actualizar clases según estado
      if (this._formErrors[name]) {
        input.classList.add('error');
      } else {
        input.classList.remove('error');
      }
    }
    
    // Mostrar mensaje de error si existe
    if (errorElement) {
      errorElement.textContent = this._formErrors[name];
      errorElement.hidden = !this._formErrors[name];
    }
  }
  
  /**
   * Actualiza todos los campos del formulario
   * @private
   */
  _updateForm() {
    // Actualizar título según modo
    const formTitle = this.shadowRoot.querySelector('.form-title');
    if (formTitle) {
      formTitle.textContent = this._mode === 'create' 
        ? 'Crear Nuevo Incidente' 
        : 'Editar Incidente';
    }
    
    // Actualizar botón de submit
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.textContent = this._mode === 'create' ? 'Crear Incidente' : 'Guardar Cambios';
      submitBtn.disabled = this._isSubmitting || this._isLoading;
    }
    
    // Mostrar/ocultar loader
    const loader = this.shadowRoot.querySelector('.form-loader');
    if (loader) {
      loader.hidden = !this._isLoading;
    }
    
    // Actualizar sección de estado (solo visible en edición)
    const statusSection = this.shadowRoot.querySelector('.status-section');
    if (statusSection) {
      statusSection.hidden = this._mode !== 'edit';
    }
    
    // Actualizar valores de inputs
    this._updateField('reporter');
    this._updateField('description');
    
    // Actualizar radio buttons de status
    const statusOptions = this.shadowRoot.querySelectorAll('input[name="status"]');
    statusOptions.forEach(radio => {
      radio.checked = radio.value === this._formData.status;
    });
  }
  
  /**
   * Maneja envío del formulario
   * @param {Event} event - Evento de submit
   * @private
   */
  async _handleSubmit(event) {
    event.preventDefault();
    
    // Validar formulario
    if (!this._validateForm()) {
      return;
    }
    
    try {
      this._isSubmitting = true;
      this._updateForm();
      
      // Crear o actualizar incidente según modo
      let response;
      
      if (this._mode === 'create') {
        // Crear nuevo incidente
        response = await ApiService.createIncident({
          reporter: this._formData.reporter,
          description: this._formData.description
        });
        
        // Actualizar store
        store.dispatch(actions.addIncident(response));
        
        // Mostrar notificación
        store.dispatch(actions.showSuccessNotification('Incidente creado con éxito'));
      } else {
        // Actualizar incidente existente (solo estado)
        response = await ApiService.updateIncidentStatus(
          this._incidentId, 
          this._formData.status
        );
        
        // Actualizar store
        store.dispatch(actions.updateIncident(response));
        
        // Mostrar notificación
        store.dispatch(actions.showSuccessNotification('Incidente actualizado con éxito'));
      }
      
      // Emitir evento de éxito
      this.dispatchEvent(new CustomEvent('incident-form:submit', {
        bubbles: true,
        composed: true,
        detail: { 
          incident: response,
          mode: this._mode
        }
      }));
      
      // Redirigir a la lista de incidentes
      getRouter().navigateToRoute('HOME');
    } catch (error) {
      console.error('Error al guardar incidente:', error);
      
      // Mostrar notificación de error
      store.dispatch(actions.showErrorNotification(
        `Error al ${this._mode === 'create' ? 'crear' : 'actualizar'} incidente: ${error.message || 'Inténtalo de nuevo'}`
      ));
    } finally {
      this._isSubmitting = false;
      this._updateForm();
    }
  }
  
  /**
   * Maneja cancelación del formulario
   * @private
   */
  _handleCancel() {
    // Emitir evento de cancelación
    this.dispatchEvent(new CustomEvent('incident-form:cancel', {
      bubbles: true,
      composed: true
    }));
    
    // Volver a la página anterior
    window.history.back();
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
      }
      
      .form-container {
        background-color: white;
        border-radius: var(--border-radius-lg, 0.5rem);
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
        padding: 1.5rem;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .form-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--secondary-color, #475569);
        margin-top: 0;
        margin-bottom: 1.5rem;
        text-align: center;
      }
      
      .form-group {
        margin-bottom: 1.25rem;
      }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--secondary-color, #475569);
      }
      
      .input-field {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        line-height: 1.5;
        color: #334155;
        background-color: white;
        border: 1px solid #e2e8f0;
        border-radius: var(--border-radius-md, 0.375rem);
        transition: all 0.15s ease-in-out;
      }
      
      .input-field:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .input-field.error {
        border-color: var(--error-color, #ef4444);
      }
      
      .error-message {
        color: var(--error-color, #ef4444);
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
      
      textarea.input-field {
        min-height: 120px;
        resize: vertical;
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }
      
      button {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 500;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
        transition: all 0.15s ease-in-out;
      }
      
      .submit-btn {
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border: none;
      }
      
      .submit-btn:hover:not(:disabled) {
        background-color: var(--primary-dark, #2563eb);
      }
      
      .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .cancel-btn {
        background-color: white;
        color: var(--secondary-color, #475569);
        border: 1px solid #e2e8f0;
      }
      
      .cancel-btn:hover {
        background-color: #f8fafc;
      }
      
      /* Sección de estados */
      .status-section {
        margin-bottom: 1.5rem;
        border: 1px solid #e2e8f0;
        border-radius: var(--border-radius-md, 0.375rem);
        padding: 1rem;
        background-color: #f8fafc;
      }
      
      .status-title {
        font-weight: 500;
        margin-top: 0;
        margin-bottom: 0.75rem;
      }
      
      .status-options {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      
      .status-option {
        display: flex;
        align-items: center;
        margin-right: 1rem;
      }
      
      input[type="radio"] {
        margin-right: 0.5rem;
      }
      
      /* Loader */
      .form-loader {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 2rem 0;
      }
      
      .spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid #e2e8f0;
        border-radius: 50%;
        border-top-color: var(--primary-color, #3b82f6);
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="form-container">
        <h2 class="form-title">${this._mode === 'create' ? 'Crear Nuevo Incidente' : 'Editar Incidente'}</h2>
        
        <div class="form-loader" ?hidden="${!this._isLoading}">
          <div class="spinner"></div>
        </div>
        
        <form ?hidden="${this._isLoading}">
          <div class="form-group">
            <label for="reporter">Reportado por *</label>
            <input 
              id="reporter" 
              class="input-field ${this._formErrors.reporter ? 'error' : ''}" 
              type="text" 
              name="reporter"
              value="${this._formData.reporter}"
              ?disabled="${this._mode === 'edit'}"
              required
            >
            <div class="error-message reporter-error" ?hidden="${!this._formErrors.reporter}">
              ${this._formErrors.reporter}
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">Descripción *</label>
            <textarea 
              id="description" 
              class="input-field ${this._formErrors.description ? 'error' : ''}" 
              name="description"
              ?disabled="${this._mode === 'edit'}"
              required
              minlength="${CONFIG.VALIDATION.INCIDENT_DESCRIPTION_MIN_LENGTH}"
            >${this._formData.description}</textarea>
            <div class="error-message description-error" ?hidden="${!this._formErrors.description}">
              ${this._formErrors.description}
            </div>
          </div>
          
          <div class="status-section" ?hidden="${this._mode !== 'edit'}">
            <h3 class="status-title">Estado del incidente</h3>
            <div class="status-options">
              <label class="status-option">
                <input type="radio" name="status" value="${CONFIG.INCIDENT_STATUS.PENDING}" 
                  ?checked="${this._formData.status === CONFIG.INCIDENT_STATUS.PENDING}">
                Pendiente
              </label>
              <label class="status-option">
                <input type="radio" name="status" value="${CONFIG.INCIDENT_STATUS.IN_PROGRESS}" 
                  ?checked="${this._formData.status === CONFIG.INCIDENT_STATUS.IN_PROGRESS}">
                En proceso
              </label>
              <label class="status-option">
                <input type="radio" name="status" value="${CONFIG.INCIDENT_STATUS.RESOLVED}" 
                  ?checked="${this._formData.status === CONFIG.INCIDENT_STATUS.RESOLVED}">
                Resuelto
              </label>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancelar</button>
            <button type="submit" class="submit-btn" ?disabled="${this._isSubmitting}">
              ${this._mode === 'create' ? 'Crear Incidente' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Actualizar componente según estado
    this._updateForm();
  }
}

// Registrar el componente
customElements.define('incident-form', IncidentFormComponent);

export default IncidentFormComponent;