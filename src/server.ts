import express from "express";
import swaggerUi from "swagger-ui-express";
import chatRouter from "./api/routes/chat.routes";
import { errorHandler } from "./api/middleware/errorHandler";
import { swaggerSpec } from "./config/swagger";

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Registrar router de chat con prefix /api
app.use("/api", chatRouter);

// Middleware de manejo de errores (DEBE ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Documentación disponible en http://localhost:${PORT}/api-docs`);
});

export default app;