import cliente from "../services/supabase";

/**
 * Obtiene el resumen del archivo Excel subido por un usuario.
 */
async function obtenerExcelSubido(usuarioId: string): Promise<string> {
  const { data, error } = await cliente
    .from("excel_temporal")
    .select("nombre_archivo, columnas, datos, total_filas, configuracion")
    .eq("user_id", usuarioId)
    .single();

  if (error || !data) {
    return "No hay ningún archivo Excel subido. El usuario debe subir un archivo primero.";
  }

  const muestra = (data.datos as Record<string, string>[]).slice(0, 5);

  return JSON.stringify({
    nombre_archivo: data.nombre_archivo,
    total_filas: data.total_filas,
    columnas: data.columnas,
    muestra,
    configuracion_actual: data.configuracion,
  });
}

export default obtenerExcelSubido;
