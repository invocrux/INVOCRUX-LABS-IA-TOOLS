import cliente from "../services/supabase";

/**
 * Muestra un resumen de cómo quedará el proyecto antes de crearlo.
 */
async function previsualizarProyectoExcel(usuarioId: string): Promise<string> {
  const { data, error } = await cliente
    .from("excel_temporal")
    .select("nombre_archivo, columnas, datos, total_filas, configuracion")
    .eq("user_id", usuarioId)
    .single();

  if (error || !data) {
    return "No hay archivo Excel subido.";
  }

  const config = data.configuracion as {
    nombre_proyecto?: string;
    campo_identificador?: string;
    mappings?: Array<{
      excelColumn: string;
      fieldName: string;
      dataType: string;
      esIdentificador: boolean;
    }>;
  };

  if (!config.nombre_proyecto || !config.campo_identificador || !config.mappings) {
    const faltante: string[] = [];
    if (!config.nombre_proyecto) faltante.push("nombre del proyecto");
    if (!config.campo_identificador) faltante.push("campo identificador");
    if (!config.mappings) faltante.push("mapeo de columnas");
    return `Configuración incompleta. Falta definir: ${faltante.join(", ")}`;
  }

  // Muestra de datos mapeados a los nombres de campo
  const muestra = (data.datos as Record<string, string>[]).slice(0, 3).map((row) => {
    const mapped: Record<string, string> = {};
    for (const m of config.mappings!) {
      mapped[m.fieldName] = row[m.excelColumn] || "";
    }
    return mapped;
  });

  return JSON.stringify({
    proyecto: config.nombre_proyecto,
    total_beneficiarios: data.total_filas,
    campo_identificador: config.campo_identificador,
    campos: config.mappings.map((m) => ({
      nombre: m.fieldName,
      tipo: m.dataType,
      esIdentificador: m.esIdentificador,
    })),
    muestra_datos: muestra,
    archivo_origen: data.nombre_archivo,
  });
}

export default previsualizarProyectoExcel;
