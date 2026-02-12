import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Frutería AI API",
      version: "1.0.0",
      description:
        "API REST para gestión inteligente de inventario de frutería con agente IA",
      contact: {
        name: "Invocrux Labs",
        email: "invocrux@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo",
      },
    ],
    components: {
      schemas: {
        ChatRequest: {
          type: "object",
          required: ["user_id", "mensaje"],
          properties: {
            user_id: {
              type: "string",
              description: "ID único del usuario",
              example: "usuario_123",
            },
            mensaje: {
              type: "string",
              description: "Mensaje de chat del usuario",
              example: "Buscá la manzana",
            },
          },
        },
        ChatData: {
          type: "object",
          properties: {
            respuesta: {
              type: "string",
              description: "Respuesta del agente IA",
              example: "Hay 50 manzanas en el inventario",
            },
            toolsEjecutadas: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Lista de herramientas ejecutadas",
              example: ["buscarProducto"],
            },
            duracionMs: {
              type: "number",
              description: "Tiempo de procesamiento en milisegundos",
              example: 1250,
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Timestamp de la respuesta",
              example: "2026-02-11T22:00:00Z",
            },
          },
        },
        ChatResponseSuccess: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              $ref: "#/components/schemas/ChatData",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2026-02-11T22:00:00Z",
            },
          },
        },
        ErrorDetail: {
          type: "object",
          properties: {
            code: {
              type: "string",
              example: "VALIDATION_ERROR",
            },
            message: {
              type: "string",
              example: "Validación de datos fallida",
            },
            details: {
              type: "object",
              description: "Detalles adicionales del error",
            },
          },
        },
        ChatResponseError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              $ref: "#/components/schemas/ErrorDetail",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2026-02-11T22:00:00Z",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "ok",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2026-02-11T22:00:00Z",
            },
          },
        },
      },
    },
  },
  apis: ["./src/api/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
