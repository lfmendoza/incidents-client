/**
 * @fileoverview Componente de loader/spinner
 * Implementa un indicador visual de carga con diferentes tamaños y variantes
 */

/**
 * Componente Loader - Componente atómico
 * @element app-loader
 *
 * @attr {string} size - Tamaño del loader (small, medium, large)
 * @attr {string} variant - Variante del loader (primary, secondary, light)
 * @attr {string} text - Texto descriptivo opcional
 */
class LoaderComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return ["size", "variant", "text"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Valores por defecto
    this._size = "medium";
    this._variant = "primary";
    this._text = "";

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Actualizar propiedades internas
    switch (name) {
      case "size":
        this._size = newValue || "medium";
        break;
      case "variant":
        this._variant = newValue || "primary";
        break;
      case "text":
        this._text = newValue || "";
        break;
    }

    // Re-renderizar
    this._updateComponent();
  }

  // Getters y setters para atributos
  get size() {
    return this._size;
  }

  set size(value) {
    this.setAttribute("size", value);
  }

  get variant() {
    return this._variant;
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }

  get text() {
    return this._text;
  }

  set text(value) {
    this.setAttribute("text", value);
  }

  /**
   * Actualiza el componente según propiedades
   * @private
   */
  _updateComponent() {
    const loader = this.shadowRoot.querySelector(".loader");
    const textElement = this.shadowRoot.querySelector(".loader-text");

    // Actualizar clases según atributos
    if (loader) {
      loader.className = `loader loader-${this._size} loader-${this._variant}`;
    }

    // Actualizar texto si existe
    if (textElement) {
      textElement.textContent = this._text;
      textElement.hidden = !this._text;
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
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .loader {
          display: inline-block;
          border-radius: 50%;
          border: 2px solid currentColor;
          border-top-color: transparent;
          animation: spin 0.8s linear infinite;
        }
        
        /* Tamaños */
        .loader-small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }
        
        .loader-medium {
          width: 24px;
          height: 24px;
          border-width: 3px;
        }
        
        .loader-large {
          width: 40px;
          height: 40px;
          border-width: 4px;
        }
        
        /* Variantes de color */
        .loader-primary {
          color: var(--primary-color, #3b82f6);
        }
        
        .loader-secondary {
          color: var(--secondary-color, #475569);
        }
        
        .loader-light {
          color: rgba(255, 255, 255, 0.8);
        }
        
        /* Texto */
        .loader-text {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: inherit;
          text-align: center;
        }
        
        /* Animación */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;

    // Template HTML
    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="loader loader-${this._size} loader-${this._variant}"></div>
        <div class="loader-text" ?hidden="${!this._text}">${this._text}</div>
      `;
  }
}

// Registrar el componente
customElements.define("app-loader", LoaderComponent);

export default LoaderComponent;
