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
  {
    type: "function",
    function: {
      name: "agregar_columna_proyecto",
      description:
        "Crea una nueva columna (campo personalizado) en un proyecto, igual que el modal de agregar campo. Si no se especifica fase, usa FORMULACION por defecto. Si define proceso ETAPA y la etapa ya existe, la herramienta pide confirmación (forzar_desplazamiento_etapa=true) antes de desplazar la etapa actual.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description:
              "UUID o nombre del proyecto. Si viene nombre, se resolverá internamente al UUID correcto.",
          },
          nombre_columna: {
            type: "string",
            description: "Nombre exacto de la nueva columna a crear.",
          },
          tipo_dato: {
            type: "string",
            enum: ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"],
            description: "Tipo de dato de la columna.",
          },
          usuario_id: {
            type: "string",
            description: "ID del usuario que realiza la acción.",
          },
          fase: {
            type: "string",
            enum: ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"],
            description: "Fase donde se asocia la columna. Opcional; por defecto FORMULACION.",
          },
          valor_por_defecto: {
            type: "string",
            description:
              "Valor por defecto opcional para inicializar este campo en todos los beneficiarios existentes.",
          },
          define_proceso: {
            type: "boolean",
            description: "Si true, la columna define proceso (INICIO, ETAPA o FIN).",
          },
          tipo_proceso: {
            type: "string",
            enum: ["INICIO", "ETAPA", "FIN"],
            description: "Tipo de proceso cuando define_proceso=true.",
          },
          numero_etapa: {
            type: "number",
            description: "Número de etapa (requerido cuando tipo_proceso=ETAPA).",
          },
          forzar_desplazamiento_etapa: {
            type: "boolean",
            description:
              "Usar true solo después de confirmar con el usuario cuando hay conflicto de etapa ETAPA.",
          },
        },
        required: ["proyecto_id", "nombre_columna", "tipo_dato", "usuario_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "editar_columna_proyecto",
      description:
        "Edita una columna existente de un proyecto (nombre, tipo de dato y/o fase). No permite editar la columna identificadora. Antes de editar, usa listar_columnas para confirmar nombre exacto.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID o nombre del proyecto.",
          },
          nombre_columna_actual: {
            type: "string",
            description: "Nombre actual exacto de la columna que se quiere editar.",
          },
          nuevo_nombre_columna: {
            type: "string",
            description: "Nuevo nombre para la columna (opcional).",
          },
          nuevo_tipo_dato: {
            type: "string",
            enum: ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"],
            description: "Nuevo tipo de dato (opcional).",
          },
          nueva_fase: {
            type: "string",
            enum: ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"],
            description: "Nueva fase para asociar la columna (opcional).",
          },
        },
        required: ["proyecto_id", "nombre_columna_actual"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "eliminar_columna_proyecto",
      description:
        "Elimina una columna de un proyecto. Como es una acción destructiva, primero devuelve confirmación requerida. Solo elimina cuando confirmar_eliminacion=true.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID o nombre del proyecto.",
          },
          nombre_columna: {
            type: "string",
            description: "Nombre exacto de la columna a eliminar.",
          },
          confirmar_eliminacion: {
            type: "boolean",
            description: "Debe ser true para ejecutar la eliminación definitiva.",
          },
        },
        required: ["proyecto_id", "nombre_columna"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "previsualizar_columna_generada",
      description:
        "Prepara y valida una columna generada a partir de otras columnas, devolviendo un bloque técnico de pre-ejecución. Esta herramienta NO crea nada; se usa para confirmar con el usuario antes de ejecutar.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID o nombre del proyecto.",
          },
          nombre_columna_destino: {
            type: "string",
            description: "Nombre de la nueva columna a crear.",
          },
          columnas_fuente: {
            type: "array",
            items: { type: "string" },
            description: "Columnas origen en el orden en que deben aplicarse.",
          },
          descripcion_regla: {
            type: "string",
            description: "Texto corto de la regla interpretada por la IA en lenguaje natural.",
          },
          modo: {
            type: "string",
            enum: ["UNIR_TEXTO", "OPERACION_NUMERICA"],
            description: "Modo interno para ejecutar la generación.",
          },
          usuario_id: {
            type: "string",
            description: "ID del usuario que ejecuta la acción.",
          },
          fase: {
            type: "string",
            enum: ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"],
            description: "Fase asociada para la nueva columna. Opcional; por defecto FORMULACION.",
          },
          separador: {
            type: "string",
            description: "Separador a usar en modo UNIR_TEXTO. Por defecto espacio.",
          },
          operador: {
            type: "string",
            enum: ["SUMA", "RESTA", "MULTIPLICACION", "DIVISION"],
            description: "Operador cuando modo=OPERACION_NUMERICA.",
          },
          tipo_resultado: {
            type: "string",
            enum: ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"],
            description: "Tipo de dato final de la columna destino.",
          },
        },
        required: [
          "proyecto_id",
          "nombre_columna_destino",
          "columnas_fuente",
          "descripcion_regla",
          "modo",
          "usuario_id",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_columna_generada",
      description:
        "Crea y calcula la columna generada para todos los beneficiarios. SOLO ejecutar después de confirmación explícita del usuario y con confirmado=true.",
      parameters: {
        type: "object",
        properties: {
          proyecto_id: {
            type: "string",
            description: "UUID o nombre del proyecto.",
          },
          nombre_columna_destino: {
            type: "string",
            description: "Nombre de la nueva columna a crear.",
          },
          columnas_fuente: {
            type: "array",
            items: { type: "string" },
            description: "Columnas origen en el orden en que deben aplicarse.",
          },
          descripcion_regla: {
            type: "string",
            description: "Texto corto de la regla interpretada por la IA en lenguaje natural.",
          },
          modo: {
            type: "string",
            enum: ["UNIR_TEXTO", "OPERACION_NUMERICA"],
            description: "Modo interno para ejecutar la generación.",
          },
          usuario_id: {
            type: "string",
            description: "ID del usuario que ejecuta la acción.",
          },
          confirmado: {
            type: "boolean",
            description: "Debe ser true para ejecutar esta acción destructiva/creación.",
          },
          fase: {
            type: "string",
            enum: ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"],
            description: "Fase asociada para la nueva columna. Opcional; por defecto FORMULACION.",
          },
          separador: {
            type: "string",
            description: "Separador a usar en modo UNIR_TEXTO. Por defecto espacio.",
          },
          operador: {
            type: "string",
            enum: ["SUMA", "RESTA", "MULTIPLICACION", "DIVISION"],
            description: "Operador cuando modo=OPERACION_NUMERICA.",
          },
          tipo_resultado: {
            type: "string",
            enum: ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"],
            description: "Tipo de dato final de la columna destino.",
          },
        },
        required: [
          "proyecto_id",
          "nombre_columna_destino",
          "columnas_fuente",
          "descripcion_regla",
          "modo",
          "usuario_id",
          "confirmado",
        ],
      },
    },
  },
  // ==================== EXCEL + PROJECT CREATION TOOLS ====================
  {
    type: "function",
    function: {
      name: "obtener_excel_subido",
      description:
        "Obtiene el resumen del archivo Excel que el usuario subió. Usar cuando el usuario dice que subió un archivo, acaba de cargar un Excel, o quieres ver los datos del archivo. Retorna columnas, cantidad de filas, muestra de datos y estado de configuración.",
      parameters: {
        type: "object",
        properties: {
          usuario_id: {
            type: "string",
            description: "ID del usuario que subió el archivo.",
          },
        },
        required: ["usuario_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "configurar_proyecto_excel",
      description:
        "Configura paso a paso los parámetros para crear un proyecto NUEVO desde el Excel subido. Usar para establecer: nombre del proyecto, campo identificador, selección parcial de columnas, y mapeo de columnas. Cada llamada actualiza UN aspecto. IMPORTANTE: Si el usuario pide importar SOLO ALGUNAS columnas, primero usa campo='columnas_a_incluir' con el array JSON de nombres exactos, ANTES de configurar 'campo_identificador'. Al configurar 'campo_identificador', el mapeo se genera automáticamente usando solo las columnas seleccionadas (si se configuraron). Cuando la configuración esté completa, usar previsualizar_proyecto_excel (NO buscar el proyecto en la base de datos, aún no existe).",
      parameters: {
        type: "object",
        properties: {
          usuario_id: {
            type: "string",
            description: "ID del usuario.",
          },
          campo: {
            type: "string",
            enum: ["nombre_proyecto", "campo_identificador", "columnas_a_incluir", "mappings"],
            description:
              "Qué aspecto configurar: 'nombre_proyecto' para el nombre, 'campo_identificador' para la columna que identifica únicamente a cada beneficiario (ej: cédula), 'columnas_a_incluir' para indicar explícitamente qué columnas importar (usar cuando el usuario pide importar solo algunas columnas), 'mappings' para mapeo personalizado completo de columnas.",
          },
          valor: {
            type: "string",
            description:
              "El valor a establecer. Para 'nombre_proyecto': el nombre. Para 'campo_identificador': nombre exacto de la columna Excel (el mapeo se genera automáticamente usando solo las columnas de 'columnas_a_incluir' si fue configurado). Para 'columnas_a_incluir': JSON string con array de nombres exactos de columnas Excel a importar, ej: [\"Nombre\",\"Cedula\",\"Municipio\"]. LLAMAR ANTES de 'campo_identificador' para que el auto-mapping respete la selección. Para 'mappings': JSON string con array de {excelColumn, fieldName, dataType, esIdentificador, esBasico}. IMPORTANTE: dataType SOLO acepta: TEXTO, NUMERO, FECHA, BOOLEAN.",
          },
        },
        required: ["usuario_id", "campo", "valor"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "previsualizar_proyecto_excel",
      description:
        "Muestra un resumen completo de cómo quedará el proyecto NUEVO antes de crearlo. Usar cuando el usuario quiere ver el mapeo de columnas, confirmar la configuración, o antes de crear el proyecto. Esta herramienta lee los datos del Excel temporal, NO busca en la base de datos. SIEMPRE usar antes de crear_proyecto_desde_excel.",
      parameters: {
        type: "object",
        properties: {
          usuario_id: {
            type: "string",
            description: "ID del usuario.",
          },
        },
        required: ["usuario_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_proyecto_desde_excel",
      description:
        "Crea el proyecto completo en Habitat usando el Excel subido y la configuración acumulada. SOLO usar cuando: 1) La configuración está completa (nombre, identificador, mappings), 2) Ya se usó previsualizar_proyecto_excel, 3) El usuario confirmó que desea crear el proyecto. Inserta proyecto, campos, beneficiarios y valores.",
      parameters: {
        type: "object",
        properties: {
          usuario_id: {
            type: "string",
            description: "ID del usuario que crea el proyecto.",
          },
        },
        required: ["usuario_id"],
      },
    },
  },
];

export default tools;
