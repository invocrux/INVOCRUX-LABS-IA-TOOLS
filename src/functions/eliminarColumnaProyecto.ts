import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

interface CampoRow {
  id: string;
  nombre: string;
  es_identificador: boolean;
}

async function eliminarColumnaProyecto(
  proyectoIdOrName: string,
  nombreColumna: string,
  confirmarEliminacion: boolean = false,
): Promise<string> {
  if (!proyectoIdOrName || proyectoIdOrName.trim() === "") {
    return "Error: proyecto_id es requerido.";
  }

  if (!nombreColumna || nombreColumna.trim() === "") {
    return "Error: nombre_columna es requerido.";
  }

  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  const { data: campoData, error: campoError } = await cliente
    .from("campo_personalizado")
    .select("id, nombre, es_identificador")
    .eq("proyecto_id", proyectoId)
    .ilike("nombre", nombreColumna.trim())
    .maybeSingle();

  if (campoError) {
    return "Error buscando la columna: " + campoError.message;
  }

  if (!campoData) {
    return `No se encontró la columna "${nombreColumna}" en el proyecto.`;
  }

  const campo = campoData as CampoRow;
  if (campo.es_identificador) {
    return "No se puede eliminar la columna identificadora del proyecto.";
  }

  const { count: totalValores, error: countError } = await cliente
    .from("valor_campo_beneficiario")
    .select("id", { count: "exact", head: true })
    .eq("campo_id", campo.id);

  if (countError) {
    return "Error validando impacto de la eliminación: " + countError.message;
  }

  if (!confirmarEliminacion) {
    return JSON.stringify({
      requiereConfirmacion: true,
      mensaje:
        `Vas a eliminar la columna "${campo.nombre}" y sus valores asociados. ` +
        "Confirma para proceder.",
      impacto: {
        columna: campo.nombre,
        valores_asociados: totalValores || 0,
      },
    });
  }

  const { error: deleteError } = await cliente
    .from("campo_personalizado")
    .delete()
    .eq("id", campo.id)
    .eq("proyecto_id", proyectoId);

  if (deleteError) {
    return "Error eliminando la columna: " + deleteError.message;
  }

  return JSON.stringify({
    ok: true,
    mensaje: `La columna "${campo.nombre}" fue eliminada correctamente.`,
    valores_eliminados_en_cascada: totalValores || 0,
  });
}

export default eliminarColumnaProyecto;
