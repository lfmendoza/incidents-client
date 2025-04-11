/**
 * @fileoverview Puente de comunicación con Web Workers
 * Proporciona una API de promesas para interactuar con workers
 */

import { CONFIG } from "../../config.js";

// Mapa de workers activos
const workers = new Map();

// Mapa de callbacks pendientes por ID de mensaje
const pendingCallbacks = new Map();

// Contador para generar IDs únicos de mensajes
let messageIdCounter = 0;

/**
 * Genera un ID único para mensajes
 * @returns {string} ID único
 */
function generateMessageId() {
  return `msg_${Date.now()}_${messageIdCounter++}`;
}

/**
 * Inicializa un worker específico
 * @param {string} name - Nombre del worker
 * @param {string} workerPath - Ruta al archivo del worker
 * @returns {Promise<Worker>} Worker inicializado
 */
function initWorker(name, workerPath) {
  return new Promise((resolve, reject) => {
    try {
      // Crear worker
      const worker = new Worker(workerPath, { name });

      // Configurar handler para mensajes
      worker.addEventListener("message", (event) => {
        const { id, result, type, message } = event.data;

        // Mensaje de inicialización
        if (type === "init") {
          console.log(`🔄 Worker [${name}]: ${message}`);
          resolve(worker);
          return;
        }

        // Mensaje de respuesta a una petición
        if (id && pendingCallbacks.has(id)) {
          const { resolve: resolveCb, reject: rejectCb } =
            pendingCallbacks.get(id);
          pendingCallbacks.delete(id);

          resolveCb(result);
        }
      });

      // Manejar errores
      worker.addEventListener("error", (error) => {
        console.error(`❌ Error en worker [${name}]:`, error);
        reject(error);
      });

      // Guardar worker en el mapa
      workers.set(name, worker);
    } catch (error) {
      console.error(`❌ Error al inicializar worker [${name}]:`, error);
      reject(error);
    }
  });
}

/**
 * Envía un mensaje a un worker y devuelve una promesa con la respuesta
 * @param {string} workerName - Nombre del worker
 * @param {string} action - Acción a ejecutar
 * @param {Object} payload - Datos para la acción
 * @returns {Promise<any>} Resultado de la acción
 */
export function sendToWorker(workerName, action, payload = {}) {
  return new Promise((resolve, reject) => {
    const worker = workers.get(workerName);

    if (!worker) {
      reject(new Error(`Worker [${workerName}] no inicializado`));
      return;
    }

    // Generar ID único para esta petición
    const messageId = generateMessageId();

    // Registrar callbacks para esta petición
    pendingCallbacks.set(messageId, { resolve, reject });

    // Enviar mensaje al worker
    worker.postMessage({
      id: messageId,
      action,
      payload,
    });

    // Timeout de seguridad para evitar memory leaks
    setTimeout(() => {
      if (pendingCallbacks.has(messageId)) {
        pendingCallbacks.delete(messageId);
        reject(
          new Error(`Timeout al esperar respuesta del worker [${workerName}]`)
        );
      }
    }, 30000); // 30 segundos de timeout
  });
}

/**
 * Inicializa todos los workers de la aplicación
 * @returns {Promise<void>}
 */
export async function initWorkerBridge() {
  try {
    // Detectar si el navegador soporta Web Workers
    if (!window.Worker) {
      console.warn(
        "⚠️ Este navegador no soporta Web Workers. La aplicación funcionará en modo degradado."
      );
      return;
    }

    // Inicializar worker de API
    await initWorker("api", CONFIG.WORKERS.API_WORKER);

    return true;
  } catch (error) {
    console.error("❌ Error al inicializar Worker Bridge:", error);
    throw error;
  }
}

/**
 * Termina un worker específico
 * @param {string} name - Nombre del worker a terminar
 */
export function terminateWorker(name) {
  const worker = workers.get(name);

  if (worker) {
    worker.terminate();
    workers.delete(name);

    // Limpiar callbacks pendientes para este worker
    for (const [id, _] of pendingCallbacks.entries()) {
      if (id.startsWith(`${name}_`)) {
        pendingCallbacks.delete(id);
      }
    }

    console.log(`🛑 Worker [${name}] terminado`);
  }
}

/**
 * Termina todos los workers
 */
export function terminateAllWorkers() {
  for (const [name, _] of workers.entries()) {
    terminateWorker(name);
  }

  pendingCallbacks.clear();
}

// Limpiar workers al cerrar la página
window.addEventListener("beforeunload", () => {
  terminateAllWorkers();
});

// Exponer una API global para depuración en desarrollo
if (process.env.NODE_ENV === "development") {
  window.__workerBridge = {
    getWorkers: () => Array.from(workers.keys()),
    getPendingCallbacks: () => pendingCallbacks.size,
    sendToWorker,
    terminateWorker,
    terminateAllWorkers,
  };
}
