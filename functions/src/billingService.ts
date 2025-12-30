/**
 * Servicio de lógica de negocio para billing items
 */

import * as admin from "firebase-admin";
import {
  BillingItem,
  BillingItemRequest,
  BillingItemStatus,
  ItemProcessingResult,
  ProcessingStatus,
} from "./types";

const COLLECTION_NAME = "billing-items";

/**
 * Obtiene una referencia a la colección de billing items
 */
function getBillingCollection() {
  return admin.firestore().collection(COLLECTION_NAME);
}

/**
 * Busca un billing item existente por entidad y mes
 * @param entity - Entidad gubernamental
 * @param month - Mes en formato YYYY-MM
 * @param userId - ID del usuario (opcional)
 * @returns El billing item si existe, null si no
 */
export async function findExistingBillingItem(
  entity: string,
  month: string,
  userId?: string
): Promise<{doc: admin.firestore.DocumentSnapshot; data: BillingItem} | null> {
  try {
    let query = getBillingCollection()
      .where("entity", "==", entity)
      .where("month", "==", month);

    // Filtrar por userId si se proporciona
    if (userId) {
      query = query.where("userId", "==", userId);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as BillingItem;
    data.id = doc.id;

    return {doc, data};
  } catch (error) {
    console.error("Error finding billing item:", error);
    throw error;
  }
}

/**
 * Crea un nuevo billing item
 * @param itemRequest - Datos del ítem a crear
 * @param userId - ID del usuario (opcional)
 * @returns El ítem creado con su ID
 */
export async function createBillingItem(
  itemRequest: BillingItemRequest,
  userId?: string
): Promise<BillingItem> {
  try {
    const now = new Date().toISOString();

    const newItem: Omit<BillingItem, "id"> = {
      entity: itemRequest.entity,
      month: itemRequest.month,
      azureDevOpsId: itemRequest.azureDevOpsId,
      status: BillingItemStatus.IN_AZURE_DEVOPS,
      requestType: itemRequest.requestType,
      notes: itemRequest.notes,
      amount: itemRequest.amount,
      createdAt: now,
      updatedAt: now,
      userId: userId,
    };

    const docRef = await getBillingCollection().add(newItem);

    return {
      ...newItem,
      id: docRef.id,
    };
  } catch (error) {
    console.error("Error creating billing item:", error);
    throw error;
  }
}

/**
 * Actualiza un billing item existente
 * @param docId - ID del documento en Firestore
 * @param itemRequest - Datos a actualizar
 * @param currentData - Datos actuales del ítem
 * @returns El ítem actualizado
 */
export async function updateBillingItem(
  docId: string,
  itemRequest: BillingItemRequest,
  currentData: BillingItem
): Promise<BillingItem> {
  try {
    const now = new Date().toISOString();

    // Preparar datos a actualizar
    const updates: Partial<BillingItem> = {
      updatedAt: now,
    };

    // Solo actualizar azureDevOpsId si no existe
    if (!currentData.azureDevOpsId && itemRequest.azureDevOpsId) {
      updates.azureDevOpsId = itemRequest.azureDevOpsId;
      updates.status = BillingItemStatus.IN_AZURE_DEVOPS;
    }

    // Actualizar otros campos si vienen en el request
    if (itemRequest.requestType !== undefined) {
      updates.requestType = itemRequest.requestType;
    }
    if (itemRequest.notes !== undefined) {
      updates.notes = itemRequest.notes;
    }
    if (itemRequest.amount !== undefined) {
      updates.amount = itemRequest.amount;
    }

    // Aplicar actualizaciones
    await getBillingCollection().doc(docId).update(updates);

    return {
      ...currentData,
      ...updates,
      id: docId,
    };
  } catch (error) {
    console.error("Error updating billing item:", error);
    throw error;
  }
}

/**
 * Procesa un elemento individual del request
 * @param itemRequest - Datos del ítem a procesar
 * @param userId - ID del usuario (opcional)
 * @returns Resultado del procesamiento
 */
export async function processItem(
  itemRequest: BillingItemRequest,
  userId?: string
): Promise<ItemProcessingResult> {
  const identifier = `${itemRequest.entity}-${itemRequest.month}`;

  try {
    // Validar formato de mes (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(itemRequest.month)) {
      return {
        identifier,
        entity: itemRequest.entity,
        month: itemRequest.month,
        status: ProcessingStatus.ERROR,
        message: "Error: formato de mes inválido (debe ser YYYY-MM)",
        error: `Invalid month format: ${itemRequest.month}`,
      };
    }

    // Buscar si existe el ítem
    const existing = await findExistingBillingItem(
      itemRequest.entity,
      itemRequest.month,
      userId
    );

    if (!existing) {
      // CREAR nuevo ítem
      const newItem = await createBillingItem(itemRequest, userId);

      return {
        identifier,
        entity: itemRequest.entity,
        month: itemRequest.month,
        status: ProcessingStatus.CREATED,
        itemId: newItem.id,
        message: `Ítem creado exitosamente con Azure DevOps ID: ${itemRequest.azureDevOpsId}`,
      };
    } else {
      // ACTUALIZAR o MANTENER ítem existente
      const currentItem = existing.data;

      if (currentItem.azureDevOpsId) {
        // Ya tiene Azure DevOps ID, no cambiar
        return {
          identifier,
          entity: itemRequest.entity,
          month: itemRequest.month,
          status: ProcessingStatus.UNCHANGED,
          itemId: currentItem.id,
          message: `Ítem sin cambios: ya tiene Azure DevOps ID ${currentItem.azureDevOpsId}`,
        };
      } else {
        // Actualizar con el nuevo Azure DevOps ID
        const updatedItem = await updateBillingItem(
          existing.doc.id,
          itemRequest,
          currentItem
        );

        return {
          identifier,
          entity: itemRequest.entity,
          month: itemRequest.month,
          status: ProcessingStatus.UPDATED,
          itemId: updatedItem.id,
          message: `Ítem actualizado: agregado Azure DevOps ID ${itemRequest.azureDevOpsId}`,
        };
      }
    }
  } catch (error: any) {
    console.error(`Error processing item ${identifier}:`, error);

    return {
      identifier,
      entity: itemRequest.entity,
      month: itemRequest.month,
      status: ProcessingStatus.ERROR,
      message: "Error al procesar el ítem",
      error: error.message || String(error),
    };
  }
}

/**
 * Procesa una lista de ítems
 * @param items - Lista de ítems a procesar
 * @param userId - ID del usuario (opcional)
 * @returns Lista de resultados del procesamiento
 */
export async function processBillingItems(
  items: BillingItemRequest[],
  userId?: string
): Promise<ItemProcessingResult[]> {
  const results: ItemProcessingResult[] = [];

  // Procesar cada ítem secuencialmente para evitar condiciones de carrera
  for (const item of items) {
    const result = await processItem(item, userId);
    results.push(result);
  }

  return results;
}
