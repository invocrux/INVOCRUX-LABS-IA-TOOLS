import { IToolCall } from "../interfaces/interface";

const tools: IToolCall[] = [
  {
    type: "function",
    function: {
      name: "listar_productos",
      description:
        "Lista todos los productos disponibles en el inventario.",
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
      name: "buscar_producto",
      description:
        "Busca un producto en la base de datos por su nombre y devuelve el stock y precio.",
      parameters: {
        type: "object",
        properties: {
          nombre_producto: {
            type: "string",
            description:
              "El nombre del producto a buscar (ej: 'Mouse', 'laptop').",
          },
        },
        required: ["nombre_producto"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_producto",
      description:
        "Crea un nuevo producto en la base de datos.",
      parameters: {
        type: "object",
        properties: {
          nombre_producto: {
            type: "string",
            description:
              "El nombre del producto a crear (ej: 'Mouse', 'laptop').",
          },
          cantidad_producto: {
            type: "number",
            description:
              "La cantidad del producto a crear.",
          },
          precio_producto: {
            type: "number",
            description:
              "El precio del producto a crear.",
          },
        },
        required: ["nombre_producto", "cantidad_producto", "precio_producto"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "eliminar_producto",
      description:
        "Elimina un producto de la base de datos por su id.",
      parameters: {
        type: "object",
        properties: {
          id_producto: {
            type: "number",
            description:
              "El id del producto a eliminar.",
          },
        },
        required: ["id_producto"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "actualizar_producto",
      description:
        "Actualiza un producto de la base de datos por su id.",
      parameters: {
        type: "object",
        properties: {
          id_producto: {
            type: "number",
            description:
              "El id del producto a actualizar (obligatorio).",
          },
          cantidad_producto: {
            type: "number",
            description:
              "La nueva cantidad del producto (opcional).",
          },
          precio_producto: {
            type: "number",
            description:
              "El nuevo precio del producto (opcional).",
          },
        },
        required: ["id_producto"],
      },
    },
  },
];
export default tools;
