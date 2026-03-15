import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

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
  proyectoIdOrName: string,
  cedulas: string[]
): Promise<string> {
  console.log(`🔍 [buscarBeneficiariosPorCedula] proyectoId recibido: "${proyectoIdOrName}"`);
  console.log(`🔍 [buscarBeneficiariosPorCedula] cedulas a buscar: ${JSON.stringify(cedulas)}`);

  // Resolver el proyecto_id (puede venir como nombre o UUID)
  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  // Encontrar el campo identificador (cédula)
  const { data: campo, error: errorCampo } = await cliente
    .from("campo_personalizado")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId)
    .eq("es_identificador", true)
    .single();
  
  console.log(`🔍 [buscarBeneficiariosPorCedula] campo encontrado: ${JSON.stringify(campo)}`);
  console.log(`🔍 [buscarBeneficiariosPorCedula] error: ${JSON.stringify(errorCampo)}`);

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
