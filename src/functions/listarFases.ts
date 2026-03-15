import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

/**
 * Lista las fases disponibles de un proyecto.
 * Las fases son fijas (ENUM), pero solo mostramos las que tienen campos configurados.
 */
async function listarFasesDeProyecto(proyectoIdOrName: string): Promise<string> {
  // Resolver el proyecto_id (puede venir como nombre o UUID)
  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  // Obtener fases que tienen campos personalizados configurados
  const { data, error } = await cliente
    .from("campo_personalizado")
    .select("fase")
    .eq("proyecto_id", proyectoId)
    .not("fase", "is", null);

  if (error) {
    throw new Error("Error al listar las fases: " + error.message);
  }

  if (!data || data.length === 0) {
    return "Este proyecto no tiene fases configuradas.";
  }

  // Obtener fases únicas y ordenarlas
  const ordenFases = ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"];
  const fasesUnicas = [...new Set(data.map((d) => d.fase as string))];
  const fasesOrdenadas = fasesUnicas.sort(
    (a, b) => ordenFases.indexOf(a) - ordenFases.indexOf(b)
  );

  const lista = fasesOrdenadas
    .map((fase, i) => `${i + 1}. ${fase}`)
    .join("\n");

  return `Fases del proyecto (${fasesOrdenadas.length}):\n${lista}`;
}

export default listarFasesDeProyecto;
