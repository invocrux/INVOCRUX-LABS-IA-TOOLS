import { IToolCall } from "../interfaces/interface";

const tools: IToolCall[] = [
  // ==================== HABITAT TOOLS ====================
  {
    type: "function",
    function: {
      name: "listar_proyectos",
      description:
        "Lista todos los proyectos disponibles en Habitat. Usar cuando el usuario pregunta por proyectos o necesita seleccionar uno.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_fases",
      description:
        "Lista las fases disponibles de un proyecto específico (ej: FORMULACION, EJECUCION). Usar después de identificar el proyecto.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "El ID del proyecto (UUID).",
          },
        },
        required: ["proyecto_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_columnas",
      description:
        "Lista las columnas (campos) disponibles en una fase de un proyecto. Muestra nombre y tipo de dato.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "El ID del proyecto (UUID).",
          },
          fase: {
            type: "string",
            enum: ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"],
            description: "La fase del proyecto.",
          },
        },
        required: ["proyecto_id", "fase"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_beneficiarios",
      description:
        "Busca beneficiarios por su cédula en un proyecto. Útil para verificar si existen antes de actualizar.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "El ID del proyecto (UUID).",
          },
          cedulas: {
            type: "array",
            items: { type: "string" },
            description: "Lista de cédulas a buscar.",
          },
        },
        required: ["proyecto_id", "cedulas"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "actualizar_campo_beneficiarios",
      description:
        "Actualiza un campo específico para múltiples beneficiarios identificados por cédula. Usar para cambios masivos.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "El ID del proyecto (UUID).",
          },
          cedulas: {
            type: "array",
            items: { type: "string" },
            description: "Lista de cédulas de los beneficiarios a actualizar.",
          },
          nombre_columna: {
            type: "string",
            description: "Nombre de la columna/campo a actualizar.",
          },
          nuevo_valor: {
            type: "string",
            description: "El nuevo valor a asignar.",
          },
          usuario_id: {
            type: "string",
            description: "ID del usuario que realiza la acción.",
          },
        },
        required: ["proyecto_id", "cedulas", "nombre_columna", "nuevo_valor", "usuario_id"],
      },
    },
  },
];

export default tools;
