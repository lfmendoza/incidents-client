/**
 * @fileoverview Componente de entrada de texto reutilizable
 * Implementa un campo de entrada con validación y estados
 */

/**
 * Componente de Input - Componente atómico
 * @element app-input
 *
 * @attr {string} type - Tipo de input (text, number, email, password, etc.)
 * @attr {string} name - Nombre del campo
 * @attr {string} value - Valor del input
 * @attr {string} placeholder - Texto de placeholder
 * @attr {string} label - Etiqueta del campo
 * @attr {boolean} required - Si el campo es obligatorio
 * @attr {boolean} disabled - Si el campo está deshabilitado
 * @attr {string} error - Mensaje de error
 * @attr {string} helper - Texto de ayuda
 * @attr {string} pattern - Patrón de validación (regex)
 * @attr {number} maxlength - Longitud máxima
 * @attr {number} minlength - Longitud mínima
 *
 * @fires input - Cuando cambia el valor del input
 * @fires change - Cuando se completa un cambio (blur)
 * @fires app-input:input - Evento personalizado con el nuevo valor
 * @fires app-input:change - Evento personalizado cuando se completa un cambio
 * @fires app-input:validate - Evento personalizado con el resultado de validación
 */
class InputComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return [
      "type",
      "name",
      "value",
      "placeholder",
      "label",
      "required",
      "disabled",
      "error",
      "helper",
      "pattern",
      "maxlength",
      "minlength",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Opciones por defecto
    this._type = "text";
    this._name = "";
    this._value = "";
    this._placeholder = "";
    this._label = "";
    this._required = false;
    this._disabled = false;
    this._error = "";
    this._helper = "";
    this._pattern = null;
    this._maxlength = null;
    this._minlength = null;
    this._hasFocus = false;

    // Binding de métodos
    this._handleInput = this._handleInput.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando el componente se conecta al DOM
  connectedCallback() {
    const input = this.shadowRoot.querySelector("input");

    // Agregar event listeners
    input.addEventListener("input", this._handleInput);
    input.addEventListener("change", this._handleChange);
    input.addEventListener("focus", this._handleFocus);
    input.addEventListener("blur", this._handleBlur);
  }

  // Lifecycle: Cuando el componente se desconecta del DOM
  disconnectedCallback() {
    const input = this.shadowRoot.querySelector("input");

    // Limpiar event listeners
    input.removeEventListener("input", this._handleInput);
    input.removeEventListener("change", this._handleChange);
    input.removeEventListener("focus", this._handleFocus);
    input.removeEventListener("blur", this._handleBlur);
  }

  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Actualizar propiedades internas
    switch (name) {
      case "type":
        this._type = newValue || "text";
        break;
      case "name":
        this._name = newValue || "";
        break;
      case "value":
        this._value = newValue || "";
        break;
      case "placeholder":
        this._placeholder = newValue || "";
        break;
      case "label":
        this._label = newValue || "";
        break;
      case "required":
        this._required = newValue !== null;
        break;
      case "disabled":
        this._disabled = newValue !== null;
        break;
      case "error":
        this._error = newValue || "";
        break;
      case "helper":
        this._helper = newValue || "";
        break;
      case "pattern":
        this._pattern = newValue;
        break;
      case "maxlength":
        this._maxlength = newValue ? parseInt(newValue, 10) : null;
        break;
      case "minlength":
        this._minlength = newValue ? parseInt(newValue, 10) : null;
        break;
    }

    // Re-renderizar o actualizar partes específicas
    this._updateComponent();
  }

  // Getters y setters para atributos

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    // Actualizar el valor del input directamente
    const input = this.shadowRoot.querySelector("input");
    if (input && input.value !== val) {
      input.value = val;
    }
  }

  get name() {
    return this._name;
  }

  set name(val) {
    this.setAttribute("name", val);
  }

  get error() {
    return this._error;
  }

  set error(val) {
    if (val) {
      this.setAttribute("error", val);
    } else {
      this.removeAttribute("error");
    }
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(val) {
    if (val) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  /**
   * Valida el input según reglas configuradas
   * @returns {boolean} true si es válido
   */
  validate() {
    const input = this.shadowRoot.querySelector("input");
    const isValid = input.checkValidity();

    // Si no es válido, mostrar mensajes de error nativos
    if (!isValid) {
      if (this._required && !this._value) {
        this.error = "Este campo es obligatorio";
      } else if (
        this._pattern &&
        this._value &&
        !new RegExp(this._pattern).test(this._value)
      ) {
        this.error = "Formato no válido";
      } else if (this._minlength && this._value.length < this._minlength) {
        this.error = `Debe tener al menos ${this._minlength} caracteres`;
      } else if (this._maxlength && this._value.length > this._maxlength) {
        this.error = `No puede tener más de ${this._maxlength} caracteres`;
      } else {
        this.error = "Valor no válido";
      }
    } else {
      this.error = "";
    }

    // Emitir evento personalizado de validación
    this.dispatchEvent(
      new CustomEvent("app-input:validate", {
        bubbles: true,
        composed: true,
        detail: {
          isValid,
          name: this._name,
          value: this._value,
          error: this._error,
        },
      })
    );

    return isValid;
  }

  /**
   * Restablece el estado del input
   */
  reset() {
    this.value = "";
    this.error = "";
    this._hasFocus = false;
    this._updateComponent();
  }

  /**
   * Maneja el evento input
   * @param {InputEvent} event - Evento de input
   * @private
   */
  _handleInput(event) {
    // Actualizar valor interno
    this._value = event.target.value;

    // Emitir evento personalizado
    this.dispatchEvent(
      new CustomEvent("app-input:input", {
        bubbles: true,
        composed: true,
        detail: {
          name: this._name,
          value: this._value,
        },
      })
    );

    // Validar en tiempo real si hay un error previo
    if (this._error) {
      this.validate();
    }
  }

  /**
   * Maneja el evento change
   * @param {Event} event - Evento change
   * @private
   */
  _handleChange(event) {
    // Validar al completar un cambio
    this.validate();

    // Emitir evento personalizado
    this.dispatchEvent(
      new CustomEvent("app-input:change", {
        bubbles: true,
        composed: true,
        detail: {
          name: this._name,
          value: this._value,
          valid: !this._error,
        },
      })
    );
  }

  /**
   * Maneja el evento focus
   * @param {FocusEvent} event - Evento focus
   * @private
   */
  _handleFocus(event) {
    this._hasFocus = true;
    this._updateComponent();

    // Limpiar error al recibir foco
    if (this._error) {
      this.error = "";
    }
  }

  /**
   * Maneja el evento blur
   * @param {FocusEvent} event - Evento blur
   * @private
   */
  _handleBlur(event) {
    this._hasFocus = false;
    this._updateComponent();

    // Validar al perder el foco
    this.validate();
  }

  /**
   * Actualiza el componente según sus propiedades
   * @private
   */
  _updateComponent() {
    const input = this.shadowRoot.querySelector("input");
    const label = this.shadowRoot.querySelector("label");
    const error = this.shadowRoot.querySelector(".error-message");
    const helper = this.shadowRoot.querySelector(".helper-text");
    const wrapper = this.shadowRoot.querySelector(".input-wrapper");

    // Actualizar input
    if (input) {
      input.type = this._type;
      input.name = this._name;
      input.value = this._value;
      input.placeholder = this._placeholder;
      input.required = this._required;
      input.disabled = this._disabled;
      input.pattern = this._pattern || null;
      input.maxLength = this._maxlength || "";
      input.minLength = this._minlength || "";

      // Actualizar clases según estado
      wrapper.className = "input-wrapper";
      if (this._hasFocus) wrapper.classList.add("focused");
      if (this._disabled) wrapper.classList.add("disabled");
      if (this._error) wrapper.classList.add("has-error");
      if (this._value) wrapper.classList.add("has-value");
    }

    // Actualizar label
    if (label) {
      if (this._label) {
        label.textContent = this._label + (this._required ? " *" : "");
        label.hidden = false;
      } else {
        label.hidden = true;
      }
    }

    // Actualizar mensaje de error
    if (error) {
      error.textContent = this._error;
      error.hidden = !this._error;
    }

    // Actualizar texto de ayuda
    if (helper) {
      helper.textContent = this._helper;
      helper.hidden = !this._helper || this._error;
    }
  }

  /**
   * Renderiza el componente completo
   * @private
   */
  _render() {
    // CSS con variables y clases
    const styles = `
        :host {
          display: block;
          margin-bottom: 1rem;
          font-family: var(--font-family, system-ui, sans-serif);
        }
        
        .input-label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--secondary-color, #475569);
        }
        
        .input-wrapper {
          position: relative;
          display: flex;
          width: 100%;
        }
        
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          color: var(--secondary-color, #475569);
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
        
        .input-field::placeholder {
          color: #94a3b8;
          opacity: 1;
        }
        
        .input-field:disabled {
          background-color: #f1f5f9;
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        /* Estados */
        .input-wrapper.focused .input-field {
          border-color: var(--primary-color, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .input-wrapper.has-error .input-field {
          border-color: var(--error-color, #ef4444);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .input-wrapper.disabled .input-field {
          background-color: #f1f5f9;
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        /* Mensajes */
        .error-message {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--error-color, #ef4444);
        }
        
        .helper-text {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
        }
      `;

    // Template HTML
    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <label class="input-label" for="input-field-${
          this._uniqueId
        }" ?hidden="${!this._label}">
          ${this._label}${this._required ? " *" : ""}
        </label>
        
        <div class="input-wrapper">
          <input 
            id="input-field-${this._uniqueId}"
            class="input-field"
            type="${this._type}"
            name="${this._name}"
            value="${this._value}"
            placeholder="${this._placeholder}"
            ?required="${this._required}"
            ?disabled="${this._disabled}"
            pattern="${this._pattern || ""}"
            maxlength="${this._maxlength || ""}"
            minlength="${this._minlength || ""}"
          />
        </div>
        
        <div class="error-message" ?hidden="${!this._error}">${
      this._error
    }</div>
        <div class="helper-text" ?hidden="${!this._helper || this._error}">${
      this._helper
    }</div>
      `;

    // Generar ID único para enlazar label con input
    if (!this._uniqueId) {
      this._uniqueId = Math.random().toString(36).substring(2, 11);
    }

    // Actualizar componente según estado
    this._updateComponent();
  }
}

// Registrar el componente
customElements.define("app-input", InputComponent);

export default InputComponent;
