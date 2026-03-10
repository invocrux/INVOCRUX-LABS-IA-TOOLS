import cliente from "../services/supabase";

interface ResultadoBusqueda {
  cedula: string;
  encontrado: boolean;
  beneficiarioId?: string;
}

/**
 * Busca beneficiarios por cédula (búsqueda exacta).
 * Usa el campo marcado como es_identificador = true.
 */
async function buscarBeneficiariosPorCedula(
  proyectoId: string,
  cedulas: string[]
): Promise<string> {
  // Encontrar el campo identificador (cédula)
  const { data: campo, error: errorCampo } = await cliente
    .from("campo_personalizado")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId)
    .eq("es_identificador", true)
    .single();

  if (errorCampo || !campo) {
    return "No se encontró un campo identificador (cédula) configurado en este proyecto.";
  }

  // Búsqueda exacta por cédulas
  const { data: encontrados, error } = await cliente
    .from("valor_campo_beneficiario")
    .select("valor, beneficiario_id")
    .eq("campo_id", campo.id)
    .in("valor", cedulas);

  if (error) {
    throw new Error("Error al buscar beneficiarios: " + error.message);
  }

  const mapaEncontrados = new Map(
    (encontrados || []).map((v) => [v.valor, v.beneficiario_id])
  );

  const resultados: ResultadoBusqueda[] = cedulas.map((cedula) => ({
    cedula,
    encontrado: mapaEncontrados.has(cedula),
    beneficiarioId: mapaEncontrados.get(cedula),
  }));

  // Generar respuesta
  const encontradosCount = resultados.filter((r) => r.encontrado).length;
  const noEncontrados = resultados.filter((r) => !r.encontrado).map((r) => r.cedula);

  let respuesta = `Búsqueda por cédula: ${encontradosCount} de ${cedulas.length} encontrado(s).`;

  if (noEncontrados.length > 0) {
    respuesta += `\nNo encontrados: ${noEncontrados.join(", ")}`;
  }

  return respuesta;
}

export default buscarBeneficiariosPorCedula;
