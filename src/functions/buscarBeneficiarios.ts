import cliente from "../services/supabase";

interface BeneficiarioEncontrado {
  cedula: string;
  encontrado: boolean;
  beneficiarioId?: string;
}

/**
 * Busca beneficiarios por cédula en un proyecto.
 * La cédula está en campo_personalizado con es_identificador = true.
 */
async function buscarBeneficiariosPorCedula(
  proyectoId: string,
  cedulas: string[]
): Promise<string> {
  // Primero, encontrar el campo que es identificador (cédula)
  const { data: campoId, error: errorCampo } = await cliente
    .from("campo_personalizado")
    .select("id")
    .eq("proyecto_id", proyectoId)
    .eq("es_identificador", true)
    .single();

  if (errorCampo || !campoId) {
    return "No se encontró un campo identificador (cédula) configurado en este proyecto.";
  }

  // Buscar beneficiarios por sus cédulas
  const { data: valores, error: errorValores } = await cliente
    .from("valor_campo_beneficiario")
    .select("valor, beneficiario_id")
    .eq("campo_id", campoId.id)
    .in("valor", cedulas);

  if (errorValores) {
    throw new Error("Error al buscar beneficiarios: " + errorValores.message);
  }

  // Mapear resultados
  const encontrados = new Map(
    (valores || []).map((v) => [v.valor, v.beneficiario_id])
  );

  const resultados: BeneficiarioEncontrado[] = cedulas.map((cedula) => ({
    cedula,
    encontrado: encontrados.has(cedula),
    beneficiarioId: encontrados.get(cedula),
  }));

  const encontradosCount = resultados.filter((r) => r.encontrado).length;
  const noEncontrados = resultados
    .filter((r) => !r.encontrado)
    .map((r) => r.cedula);

  let respuesta = `Búsqueda completada: ${encontradosCount} de ${cedulas.length} encontrados.`;

  if (noEncontrados.length > 0) {
    respuesta += `\nNo encontrados: ${noEncontrados.join(", ")}`;
  }

  return respuesta;
}

export default buscarBeneficiariosPorCedula;
