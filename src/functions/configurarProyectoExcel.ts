import cliente from "../services/supabase";

const TIPOS_VALIDOS = ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"] as const;
type TipoDato = (typeof TIPOS_VALIDOS)[number];

/** Normaliza cualquier variante de tipo de dato al enum válido de Habitat */
function normalizarTipoDato(tipo: string): TipoDato {
  const t = tipo.trim().toUpperCase();
  if (TIPOS_VALIDOS.includes(t as TipoDato)) return t as TipoDato;

  // Mapear variantes comunes
  const aliases: Record<string, TipoDato> = {
    STRING: "TEXTO",
    TEXT: "TEXTO",
    VARCHAR: "TEXTO",
    CHAR: "TEXTO",
    NUMBER: "NUMERO",
    INT: "NUMERO",
    INTEGER: "NUMERO",
    FLOAT: "NUMERO",
    DECIMAL: "NUMERO",
    DOUBLE: "NUMERO",
    DATE: "FECHA",
    DATETIME: "FECHA",
    TIMESTAMP: "FECHA",
    BOOL: "BOOLEAN",
    BOOLEANO: "BOOLEAN",
  };

  return aliases[t] || "TEXTO";
}

/** Detecta si una columna Excel contiene fechas basándose en el nombre */
function detectarTipoPorNombre(nombreColumna: string): TipoDato {
  const nombre = nombreColumna.toLowerCase();
  if (/fecha|date|fech/i.test(nombre)) return "FECHA";
  return "TEXTO";
}

interface Configuracion {
  nombre_proyecto?: string;
  campo_identificador?: string;
  columnas_a_incluir?: string[];
  mappings?: Array<{
    excelColumn: string;
    fieldName: string;
    dataType: string;
    esIdentificador: boolean;
    esBasico: boolean;
  }>;
}

/**
 * Configura incrementalmente los parámetros para crear un proyecto desde Excel.
 *
 * Campos soportados:
 *  - "nombre_proyecto"      → nombre del nuevo proyecto
 *  - "campo_identificador"  → columna que identifica unívocamente cada fila (ej: cédula).
 *                             Si ya existe "columnas_a_incluir", el auto-mapping respeta esa lista.
 *  - "columnas_a_incluir"   → JSON string con array de nombres de columnas Excel a importar.
 *                             Llamar ANTES de "campo_identificador" para que el auto-mapping
 *                             use solo esas columnas. Si se llama DESPUÉS y ya hay mappings,
 *                             regenera los mappings filtrando por la nueva lista.
 *  - "mappings"             → JSON string con array de mappings manuales completos.
 */
async function configurarProyectoExcel(
  usuarioId: string,
  campo: string,
  valor: string
): Promise<string> {
  const { data, error } = await cliente
    .from("excel_temporal")
    .select("configuracion, columnas")
    .eq("user_id", usuarioId)
    .single();

  if (error || !data) {
    return "No hay archivo Excel subido. El usuario debe subir un archivo primero.";
  }

  const config: Configuracion = (data.configuracion as Configuracion) || {};

  switch (campo) {
    case "nombre_proyecto":
      config.nombre_proyecto = valor;
      break;

    case "columnas_a_incluir": {
      // Parsear el array de columnas que el usuario quiere importar
      let columnasDeseadas: string[];
      try {
        columnasDeseadas = JSON.parse(valor);
        if (!Array.isArray(columnasDeseadas)) throw new Error("No es array");
      } catch {
        return "Error: columnas_a_incluir debe ser un JSON array de strings. Ej: [\"Nombre\",\"Cedula\",\"Municipio\"]";
      }

      // Validar que todas las columnas existan en el Excel
      const columnasInvalidas = columnasDeseadas.filter(
        (c) => !(data.columnas as string[]).includes(c)
      );
      if (columnasInvalidas.length > 0) {
        return `Las siguientes columnas no existen en el Excel: ${columnasInvalidas.join(", ")}. Columnas disponibles: ${(data.columnas as string[]).join(", ")}`;
      }

      config.columnas_a_incluir = columnasDeseadas;

      // Si ya existe un campo_identificador, regenerar mappings respetando la nueva lista
      if (config.campo_identificador) {
        const identificador = config.campo_identificador;
        config.mappings = columnasDeseadas.map((col: string) => ({
          excelColumn: col,
          fieldName: col,
          dataType: detectarTipoPorNombre(col),
          esIdentificador: col === identificador,
          esBasico: true,
        }));
      }
      break;
    }

    case "campo_identificador": {
      // Validar que la columna existe
      if (!(data.columnas as string[]).includes(valor)) {
        return `La columna "${valor}" no existe en el Excel. Columnas disponibles: ${(data.columnas as string[]).join(", ")}`;
      }
      config.campo_identificador = valor;

      // Auto-generar mappings si no existen
      if (!config.mappings) {
        // Respetar columnas_a_incluir si ya fue configurado; si no, usar todas
        const columnasBase: string[] =
          config.columnas_a_incluir && config.columnas_a_incluir.length > 0
            ? config.columnas_a_incluir
            : (data.columnas as string[]);

        config.mappings = columnasBase.map((col: string) => ({
          excelColumn: col,
          fieldName: col,
          dataType: detectarTipoPorNombre(col),
          esIdentificador: col === valor,
          esBasico: true,
        }));
      } else {
        // Actualizar el identificador en mappings existentes
        config.mappings = config.mappings.map((m) => ({
          ...m,
          esIdentificador: m.excelColumn === valor,
        }));
      }
      break;
    }

    case "mappings":
      try {
        const parsed = JSON.parse(valor);
        // Normalizar tipos de dato a valores válidos
        config.mappings = parsed.map((m: Record<string, unknown>) => ({
          ...m,
          dataType: normalizarTipoDato(String(m.dataType || "TEXTO")),
        }));
      } catch {
        return "Error: el valor de mappings debe ser un JSON válido.";
      }
      break;

    default:
      return `Campo no reconocido: "${campo}". Usar: nombre_proyecto, campo_identificador, columnas_a_incluir, o mappings.`;
  }

  // Guardar configuración actualizada
  const { error: updateError } = await cliente
    .from("excel_temporal")
    .update({ configuracion: config })
    .eq("user_id", usuarioId);

  if (updateError) {
    return "Error al guardar la configuración: " + updateError.message;
  }

  // Responder con estado actual
  const faltante: string[] = [];
  if (!config.nombre_proyecto) faltante.push("nombre_proyecto");
  if (!config.campo_identificador) faltante.push("campo_identificador");
  if (!config.mappings || config.mappings.length === 0) faltante.push("mappings");

  const totalColumnas = (data.columnas as string[]).length;
  const columnasImportar = config.mappings?.length ?? 0;
  const seleccionParcial = config.columnas_a_incluir && config.columnas_a_incluir.length > 0;

  if (faltante.length === 0) {
    return JSON.stringify({
      mensaje: "Configuración completa. Puedes usar previsualizar_proyecto_excel para mostrar el resumen al usuario antes de crear.",
      columnas_totales_excel: totalColumnas,
      columnas_a_importar: columnasImportar,
      seleccion_parcial: seleccionParcial,
      configuracion: config,
    });
  }

  return JSON.stringify({
    mensaje: `Configuración actualizada. Faltan: ${faltante.join(", ")}`,
    columnas_totales_excel: totalColumnas,
    columnas_a_importar: columnasImportar,
    seleccion_parcial: seleccionParcial,
    configuracion: config,
  });
}

export default configurarProyectoExcel;
