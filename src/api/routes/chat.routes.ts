import { Router } from "express";
import { handleChat } from "../controllers/chatController.controller";
import { handleUpload } from "../controllers/uploadController.controller";
import { handleGetSession, handleClearSession } from "../controllers/sessionController.controller";
import { health } from "../controllers/health.controller";
import upload from "../middleware/upload";

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Procesa un mensaje de chat
 *     description: Envía un mensaje al agente IA que gestiona el inventario de la frutería
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           example:
 *             userId: "usuario_123"
 *             mensaje: "puedes listas los productos que tengo en mi inventario ?"
 *     responses:
 *       200:
 *         description: Respuesta exitosa del agente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponseSuccess'
 *       400:
 *         description: Error de validación en los datos enviados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponseError'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponseError'
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica el estado del servidor
 *     description: Endpoint para health checks. Retorna OK si el servidor está funcionando
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Servidor está funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

const chatRouter = Router();
chatRouter.post("/chat", handleChat);
chatRouter.post("/chat/upload", upload.single("archivo"), handleUpload);
chatRouter.get("/chat/session", handleGetSession);
chatRouter.delete("/chat/session", handleClearSession);
chatRouter.get("/health", health);

export default chatRouter;
