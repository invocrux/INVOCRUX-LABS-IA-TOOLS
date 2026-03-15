import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

interface ColumnaResumen {
  nombre: string;
  tipo_dato: string;
}

/**
 * Lista las columnas (campos personalizados) de un proyecto.
 * Los campos son globales al proyecto (no específicos de una fase).
 * Solo devuelve nombre y tipo de dato - lo mínimo necesario.
 */
async function listarColumnasDeProyecto(
  proyectoIdOrName: string
): Promise<string> {
  console.log(`🔍 [listarColumnas] proyectoId recibido: "${proyectoIdOrName}"`);

  // Resolver el proyecto_id (puede venir como nombre o UUID)
  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  // Los campos son globales al proyecto, no filtrar por fase
  const { data, error } = await cliente
    .from("campo_personalizado")
    .select("nombre, tipo_dato")
    .eq("proyecto_id", proyectoId)
    .order("orden", { ascending: true });

  if (error) {
    throw new Error("Error al listar las columnas: " + error.message);
  }

  if (!data || data.length === 0) {
    return `No hay columnas configuradas para este proyecto.`;
  }

  const columnas = data as ColumnaResumen[];
  const lista = columnas
    .map((c, i) => `${i + 1}. ${c.nombre} (${c.tipo_dato})`)
    .join("\n");

  return `Columnas del proyecto (${columnas.length}):\n${lista}`;
}

export default listarColumnasDeProyecto;
