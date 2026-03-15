import { IToolCall } from "../interfaces/interface";

const tools: IToolCall[] = [
  // ==================== HABITAT TOOLS ====================
  {
    type: "function",
    function: {
      name: "listar_proyectos",
      description:
        "Lista todos los proyectos disponibles con sus IDs. OBLIGATORIO usar esta herramienta cuando el usuario menciona un proyecto por nombre o posición (ej: 'el segundo proyecto', 'proyecto BAQ25') y necesitas obtener su proyecto_id para otras operaciones.",
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
            description: "UUID del proyecto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). NO es el nombre del proyecto.",
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
        "Lista las columnas (campos) disponibles en un proyecto. Muestra nombre y tipo de dato. Los campos son globales al proyecto, no específicos de una fase.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID del proyecto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). NO es el nombre del proyecto.",
          },
        },
        required: ["proyecto_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_beneficiarios_por_cedula",
      description:
        "Busca beneficiarios por cédula (búsqueda exacta) en un proyecto específico. Si el usuario menciona otro proyecto, primero usa listar_proyectos para obtener el proyecto_id correcto.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID del proyecto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). NO es el nombre del proyecto. Obtener de listar_proyectos o del contexto.",
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
      name: "buscar_beneficiarios_por_nombre",
      description:
        "Busca beneficiarios por nombre (búsqueda parcial) en un proyecto específico. Si el usuario menciona otro proyecto, primero usa listar_proyectos para obtener el proyecto_id correcto.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID del proyecto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). NO es el nombre del proyecto. Obtener de listar_proyectos o del contexto.",
          },
          nombres: {
            type: "array",
            items: { type: "string" },
            description: "Lista de nombres o apellidos a buscar.",
          },
        },
        required: ["proyecto_id", "nombres"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_fase_beneficiario",
      description:
        "Obtiene la fase actual en la que se encuentra un beneficiario específico (FORMULACION, EJECUCION, FACTURACION, RECHAZADO). Usar cuando el usuario pregunta en qué fase está un beneficiario.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID del proyecto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). NO es el nombre del proyecto.",
          },
          busqueda: {
            type: "string",
            description: "El valor a buscar (nombre o cédula del beneficiario).",
          },
          tipo_busqueda: {
            type: "string",
            enum: ["cedula", "nombre"],
            description: "Tipo de búsqueda: 'cedula' para búsqueda exacta, 'nombre' para búsqueda parcial.",
          },
        },
        required: ["proyecto_id", "busqueda", "tipo_busqueda"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "actualizar_campo_beneficiarios",
      description:
        "Actualiza un campo específico para múltiples beneficiarios. ANTES de usar esta herramienta DEBES: 1) Usar buscar_beneficiarios_por_nombre o buscar_beneficiarios_por_cedula para obtener la cédula real del beneficiario, 2) Usar listar_columnas para conocer el nombre exacto de la columna a actualizar (ej: puede llamarse 'CC' en lugar de 'cedula').",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID del proyecto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). NO es el nombre del proyecto.",
          },
          cedulas: {
            type: "array",
            items: { type: "string" },
            description: "Lista de cédulas (números de identificación) de los beneficiarios. NO nombres. Obtener con buscar_beneficiarios_por_nombre si solo conoces el nombre.",
          },
          nombre_columna: {
            type: "string",
            description: "Nombre EXACTO de la columna a actualizar (tal como aparece en listar_columnas). Ejemplo: 'CC' no 'cedula', 'Nombre Completo' no 'nombre'.",
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
