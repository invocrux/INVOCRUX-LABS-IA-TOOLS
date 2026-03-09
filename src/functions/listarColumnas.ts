import cliente from "../services/supabase";

interface ColumnaResumen {
  nombre: string;
  tipo_dato: string;
}

/**
 * Lista las columnas (campos personalizados) de una fase específica de un proyecto.
 * Solo devuelve nombre y tipo de dato - lo mínimo necesario.
 */
async function listarColumnasDeProyecto(
  proyectoId: string,
  fase: string
): Promise<string> {
  const { data, error } = await cliente
    .from("campo_personalizado")
    .select("nombre, tipo_dato")
    .eq("proyecto_id", proyectoId)
    .eq("fase", fase)
    .order("orden", { ascending: true });

  if (error) {
    throw new Error("Error al listar las columnas: " + error.message);
  }

  if (!data || data.length === 0) {
    return `No hay columnas configuradas para la fase ${fase}.`;
  }

  const columnas = data as ColumnaResumen[];
  const lista = columnas
    .map((c, i) => `${i + 1}. ${c.nombre} (${c.tipo_dato})`)
    .join("\n");

  return `Columnas de ${fase} (${columnas.length}):\n${lista}`;
}

export default listarColumnasDeProyecto;
