/**
 * Firebase Cloud Functions para Life Tracker
 * API de Billing Items
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import {
  CreateOrUpdateBillingItemsRequest,
  CreateOrUpdateBillingItemsResponse,
  ProcessingStatus,
} from "./types";
import {processBillingItems} from "./billingService";
import {
  validateCreateOrUpdateRequest,
  validateHttpMethod,
  ValidationError,
} from "./validation";

// Inicializar Firebase Admin
admin.initializeApp();

// Crear app Express
const app = express();

// Configurar CORS para permitir llamadas desde n8n, Postman, etc.
app.use(cors({origin: true}));

// Middleware para parsear JSON
app.use(express.json());

/**
 * POST /billingItems
 * Endpoint para crear y/o actualizar ítems de facturación
 */
app.post("/", async (req, res) => {
  try {
    // Validar método HTTP
    validateHttpMethod(req.method);

    // Validar body del request
    const requestBody = req.body;
    validateCreateOrUpdateRequest(requestBody);

    const typedBody = requestBody as CreateOrUpdateBillingItemsRequest;

    // Procesar los ítems
    const results = await processBillingItems(
      typedBody.items,
      typedBody.userId
    );

    // Calcular totales
    const totalItems = results.length;
    const created = results.filter(
      (r) => r.status === ProcessingStatus.CREATED
    ).length;
    const updated = results.filter(
      (r) => r.status === ProcessingStatus.UPDATED
    ).length;
    const unchanged = results.filter(
      (r) => r.status === ProcessingStatus.UNCHANGED
    ).length;
    const errors = results.filter(
      (r) => r.status === ProcessingStatus.ERROR
    ).length;

    // Preparar respuesta
    const response: CreateOrUpdateBillingItemsResponse = {
      success: errors === 0,
      totalItems,
      created,
      updated,
      unchanged,
      errors,
      results,
      message: errors === 0 ?
        "Todos los ítems procesados exitosamente" :
        `${errors} ítem(s) con errores`,
    };

    // Retornar respuesta
    res.status(200).json(response);
  } catch (error: any) {
    console.error("Error in billingItems endpoint:", error);

    // Manejar errores de validación
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        totalItems: 0,
        created: 0,
        updated: 0,
        unchanged: 0,
        errors: 1,
        results: [],
        message: "Error de validación",
        error: error.message,
      });
    }

    // Manejar otros errores
    return res.status(500).json({
      success: false,
      totalItems: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: 1,
      results: [],
      message: "Error interno del servidor",
      error: error.message || "Error desconocido",
    });
  }
});

/**
 * GET /billingItems
 * Endpoint de verificación (healthcheck)
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de Billing Items - Life Tracker",
    version: "1.0.0",
    endpoints: {
      "POST /billingItems": "Crear y/o actualizar ítems de facturación",
    },
  });
});

// Exportar la función HTTP
export const billingItems = functions.https.onRequest(app);
