/**
 * Utilidades de validación para requests del API
 */

import {
  BillingItemRequest,
  CreateOrUpdateBillingItemsRequest,
} from "./types";

/**
 * Errores de validación
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Valida que un valor sea una cadena no vacía
 */
function isNonEmptyString(value: any): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Valida que un valor sea un array
 */
function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Valida un elemento individual del request
 * @param item - Elemento a validar
 * @param index - Índice del elemento en el array (para mensajes de error)
 * @throws ValidationError si el elemento no es válido
 */
export function validateBillingItemRequest(
  item: any,
  index: number
): asserts item is BillingItemRequest {
  const prefix = `Item ${index + 1}`;

  // Validar entity
  if (!isNonEmptyString(item.entity)) {
    throw new ValidationError(
      `${prefix}: el campo 'entity' es requerido y debe ser una cadena no vacía`
    );
  }

  // Validar month
  if (!isNonEmptyString(item.month)) {
    throw new ValidationError(
      `${prefix}: el campo 'month' es requerido y debe ser una cadena no vacía`
    );
  }

  // Validar formato de month (YYYY-MM)
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!monthRegex.test(item.month)) {
    throw new ValidationError(
      `${prefix}: el formato del campo 'month' debe ser YYYY-MM (ejemplo: 2025-01)`
    );
  }

  // Validar azureDevOpsId
  if (!isNonEmptyString(item.azureDevOpsId)) {
    throw new ValidationError(
      `${prefix}: el campo 'azureDevOpsId' es requerido y debe ser una cadena no vacía`
    );
  }

  // Validar campos opcionales si están presentes
  if (item.requestType !== undefined && !isNonEmptyString(item.requestType)) {
    throw new ValidationError(
      `${prefix}: si se proporciona 'requestType', debe ser una cadena no vacía`
    );
  }

  if (item.notes !== undefined && typeof item.notes !== "string") {
    throw new ValidationError(
      `${prefix}: si se proporciona 'notes', debe ser una cadena`
    );
  }

  if (item.amount !== undefined) {
    if (typeof item.amount !== "number" || item.amount < 0) {
      throw new ValidationError(
        `${prefix}: si se proporciona 'amount', debe ser un número mayor o igual a 0`
      );
    }
  }
}

/**
 * Valida el body completo del request
 * @param body - Body del request
 * @throws ValidationError si el body no es válido
 */
export function validateCreateOrUpdateRequest(
  body: any
): asserts body is CreateOrUpdateBillingItemsRequest {
  // Validar que body existe
  if (!body || typeof body !== "object") {
    throw new ValidationError("El body del request debe ser un objeto JSON");
  }

  // Validar que items es un array
  if (!isArray(body.items)) {
    throw new ValidationError(
      "El campo 'items' es requerido y debe ser un array"
    );
  }

  // Validar que items no está vacío
  if (body.items.length === 0) {
    throw new ValidationError(
      "El campo 'items' debe contener al menos un elemento"
    );
  }

  // Validar userId si se proporciona
  if (body.userId !== undefined && !isNonEmptyString(body.userId)) {
    throw new ValidationError(
      "Si se proporciona 'userId', debe ser una cadena no vacía"
    );
  }

  // Validar cada elemento del array
  body.items.forEach((item, index) => {
    validateBillingItemRequest(item, index);
  });
}

/**
 * Valida el método HTTP
 * @param method - Método HTTP del request
 * @throws ValidationError si el método no es POST
 */
export function validateHttpMethod(method: string): void {
  if (method !== "POST") {
    throw new ValidationError(
      `Método HTTP no permitido: ${method}. Use POST`
    );
  }
}
