/**
 * Tipos e interfaces para el sistema de facturación
 */

/**
 * Estado de un ítem de facturación
 */
export enum BillingItemStatus {
  /** Solicitud pendiente de crear en Azure DevOps */
  PENDING = "pending",
  /** Solicitud creada en Azure DevOps */
  IN_AZURE_DEVOPS = "in_azure_devops",
  /** Facturación completada */
  COMPLETED = "completed",
  /** Cancelada */
  CANCELLED = "cancelled"
}

/**
 * Ítem de facturación
 */
export interface BillingItem {
  /** ID único del documento en Firestore */
  id?: string;

  /** Entidad gubernamental (nombre o código) */
  entity: string;

  /** Mes en formato YYYY-MM */
  month: string;

  /** ID del work item en Azure DevOps (opcional) */
  azureDevOpsId?: string;

  /** Estado de la solicitud */
  status: BillingItemStatus;

  /** Tipo de solicitud (opcional) */
  requestType?: string;

  /** Notas adicionales (opcional) */
  notes?: string;

  /** Monto a facturar (opcional) */
  amount?: number;

  /** Fecha de creación */
  createdAt: string;

  /** Fecha de última actualización */
  updatedAt: string;

  /** ID del usuario que creó el ítem */
  userId?: string;
}

/**
 * Elemento individual de la petición al API
 */
export interface BillingItemRequest {
  /** Entidad gubernamental */
  entity: string;

  /** Mes en formato YYYY-MM */
  month: string;

  /** ID del work item en Azure DevOps */
  azureDevOpsId: string;

  /** Tipo de solicitud (opcional) */
  requestType?: string;

  /** Notas adicionales (opcional) */
  notes?: string;

  /** Monto a facturar (opcional) */
  amount?: number;
}

/**
 * Body completo de la petición al API
 */
export interface CreateOrUpdateBillingItemsRequest {
  /** Lista de ítems a crear o actualizar */
  items: BillingItemRequest[];

  /** ID del usuario (opcional, para filtrar por usuario) */
  userId?: string;
}

/**
 * Estado de procesamiento de un elemento
 */
export enum ProcessingStatus {
  /** Ítem creado exitosamente */
  CREATED = "created",
  /** Ítem actualizado exitosamente */
  UPDATED = "updated",
  /** Ítem sin cambios (ya tenía Azure DevOps ID) */
  UNCHANGED = "unchanged",
  /** Error al procesar el ítem */
  ERROR = "error"
}

/**
 * Resultado del procesamiento de un elemento individual
 */
export interface ItemProcessingResult {
  /** Identificador lógico (entidad + mes) */
  identifier: string;

  /** Entidad gubernamental */
  entity: string;

  /** Mes */
  month: string;

  /** Estado del procesamiento */
  status: ProcessingStatus;

  /** ID del documento en Firestore (si existe) */
  itemId?: string;

  /** Mensaje descriptivo */
  message: string;

  /** Mensaje de error (si hubo error) */
  error?: string;
}

/**
 * Respuesta del API
 */
export interface CreateOrUpdateBillingItemsResponse {
  /** Indica si la petición se procesó completamente */
  success: boolean;

  /** Total de elementos en la petición */
  totalItems: number;

  /** Total de elementos creados */
  created: number;

  /** Total de elementos actualizados */
  updated: number;

  /** Total de elementos sin cambios */
  unchanged: number;

  /** Total de elementos con error */
  errors: number;

  /** Detalles por cada elemento procesado */
  results: ItemProcessingResult[];

  /** Mensaje general (opcional) */
  message?: string;
}
