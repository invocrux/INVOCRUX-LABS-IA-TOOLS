import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

const FASES_VALIDAS = ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"] as const;
const TIPOS_DATO_VALIDOS = ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"] as const;

type Fase = (typeof FASES_VALIDAS)[number];
type TipoDato = (typeof TIPOS_DATO_VALIDOS)[number];

interface CampoRow {
  id: string;
  nombre: string;
  tipo_dato: TipoDato;
  fase: Fase | null;
  es_identificador: boolean;
}

function normalizarTipoDato(valor: string): TipoDato | null {
  const raw = valor.trim().toUpperCase();
  const aliases: Record<string, TipoDato> = {
    STRING: "TEXTO",
    TEXT: "TEXTO",
    VARCHAR: "TEXTO",
    CHAR: "TEXTO",
    NUMBER: "NUMERO",
    INTEGER: "NUMERO",
    INT: "NUMERO",
    DECIMAL: "NUMERO",
    FLOAT: "NUMERO",
    DOUBLE: "NUMERO",
    DATE: "FECHA",
    DATETIME: "FECHA",
    TIMESTAMP: "FECHA",
    BOOL: "BOOLEAN",
    BOOLEANO: "BOOLEAN",
  };

  const normalizado = (aliases[raw] || raw) as TipoDato;
  if (TIPOS_DATO_VALIDOS.includes(normalizado)) return normalizado;
  return null;
}

function normalizarFase(valor: string): Fase | null {
  if (!valor || valor.trim() === "") return null;
  const fase = valor.trim().toUpperCase() as Fase;
  if (!FASES_VALIDAS.includes(fase)) return null;
  return fase;
}

async function editarColumnaProyecto(
  proyectoIdOrName: string,
  nombreColumnaActual: string,
  nuevoNombreColumna?: string,
  nuevoTipoDato?: string,
  nuevaFase?: string,
): Promise<string> {
  if (!proyectoIdOrName || proyectoIdOrName.trim() === "") {
    return "Error: proyecto_id es requerido.";
  }

  if (!nombreColumnaActual || nombreColumnaActual.trim() === "") {
    return "Error: nombre_columna_actual es requerido.";
  }

  const hayNuevoNombre = !!nuevoNombreColumna && nuevoNombreColumna.trim() !== "";
  const hayNuevoTipo = !!nuevoTipoDato && nuevoTipoDato.trim() !== "";
  const hayNuevaFase = !!nuevaFase && nuevaFase.trim() !== "";

  if (!hayNuevoNombre && !hayNuevoTipo && !hayNuevaFase) {
    return "Error: debes enviar al menos un cambio (nuevo_nombre_columna, nuevo_tipo_dato o nueva_fase).";
  }

  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  const { data: campoData, error: campoError } = await cliente
    .from("campo_personalizado")
    .select("id, nombre, tipo_dato, fase, es_identificador")
    .eq("proyecto_id", proyectoId)
    .ilike("nombre", nombreColumnaActual.trim())
    .maybeSingle();

  if (campoError) {
    return "Error buscando la columna actual: " + campoError.message;
  }

  if (!campoData) {
    return `No se encontró la columna "${nombreColumnaActual}" en el proyecto.`;
  }

  const campo = campoData as CampoRow;
  if (campo.es_identificador) {
    return "No se puede editar la columna identificadora del proyecto.";
  }

  const nuevoNombreFinal = hayNuevoNombre ? nuevoNombreColumna!.trim() : campo.nombre;

  if (nuevoNombreFinal.length === 0) {
    return "Error: nuevo_nombre_columna no puede estar vacío.";
  }

  if (nuevoNombreFinal.toLowerCase() !== campo.nombre.toLowerCase()) {
    const { data: duplicado, error: duplicadoError } = await cliente
      .from("campo_personalizado")
      .select("id")
      .eq("proyecto_id", proyectoId)
      .ilike("nombre", nuevoNombreFinal)
      .maybeSingle();

    if (duplicadoError) {
      return "Error validando nombre de columna: " + duplicadoError.message;
    }

    if (duplicado) {
      return `Ya existe una columna con el nombre "${nuevoNombreFinal}" en este proyecto.`;
    }
  }

  let nuevoTipoFinal = campo.tipo_dato;
  if (hayNuevoTipo) {
    const tipo = normalizarTipoDato(nuevoTipoDato!);
    if (!tipo) {
      return `Error: nuevo_tipo_dato inválido. Debe ser uno de: ${TIPOS_DATO_VALIDOS.join(", ")}.`;
    }
    nuevoTipoFinal = tipo;
  }

  let nuevaFaseFinal: Fase | null = campo.fase;
  if (hayNuevaFase) {
    const fase = normalizarFase(nuevaFase!);
    if (!fase) {
      return `Error: nueva_fase inválida. Debe ser una de: ${FASES_VALIDAS.join(", ")}.`;
    }
    nuevaFaseFinal = fase;
  }

  const { error: updateError } = await cliente
    .from("campo_personalizado")
    .update({
      nombre: nuevoNombreFinal,
      tipo_dato: nuevoTipoFinal,
      fase: nuevaFaseFinal,
    })
    .eq("id", campo.id)
    .eq("proyecto_id", proyectoId);

  if (updateError) {
    return "Error actualizando la columna: " + updateError.message;
  }

  return JSON.stringify({
    ok: true,
    mensaje: `La columna "${campo.nombre}" fue actualizada correctamente.`,
    cambios: {
      nombre_antes: campo.nombre,
      nombre_despues: nuevoNombreFinal,
      tipo_antes: campo.tipo_dato,
      tipo_despues: nuevoTipoFinal,
      fase_antes: campo.fase,
      fase_despues: nuevaFaseFinal,
    },
  });
}

export default editarColumnaProyecto;
