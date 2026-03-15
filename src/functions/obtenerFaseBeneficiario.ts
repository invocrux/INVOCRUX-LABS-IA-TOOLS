import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

/**
 * Obtiene la fase actual de un beneficiario específico.
 * Puede buscar por cédula o por nombre.
 */
async function obtenerFaseBeneficiario(
  proyectoIdOrName: string,
  busqueda: string,
  tipoBusqueda: "cedula" | "nombre" = "nombre"
): Promise<string> {
  console.log(`🔍 [obtenerFaseBeneficiario] proyectoId recibido: "${proyectoIdOrName}"`);
  console.log(`🔍 [obtenerFaseBeneficiario] busqueda: "${busqueda}", tipo: "${tipoBusqueda}"`);

  // Resolver el proyecto_id (puede venir como nombre o UUID)
  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  // 1. Encontrar el campo según el tipo de búsqueda
  let campoQuery = cliente
    .from("campo_personalizado")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId);

  if (tipoBusqueda === "cedula") {
    campoQuery = campoQuery.eq("es_identificador", true);
  } else {
    campoQuery = campoQuery.ilike("nombre", "%nombre%");
  }

  const { data: campos, error: errorCampo } = await campoQuery;

  if (errorCampo || !campos || campos.length === 0) {
    const tipoTexto = tipoBusqueda === "cedula" ? "identificador (cédula)" : "nombre";
    return `No se encontró un campo de ${tipoTexto} configurado en este proyecto.`;
  }

  const campoIds = campos.map((c) => c.id);

  // 2. Buscar el beneficiario
  let query = cliente
    .from("valor_campo_beneficiario")
    .select("beneficiario_id, valor")
    .in("campo_id", campoIds);

  if (tipoBusqueda === "cedula") {
    query = query.eq("valor", busqueda);
  } else {
    query = query.ilike("valor", `%${busqueda}%`);
  }

  const { data: valores, error: errorBusqueda } = await query;

  if (errorBusqueda) {
    return `Error al buscar beneficiario: ${errorBusqueda.message}`;
  }

  if (!valores || valores.length === 0) {
    return `No se encontró ningún beneficiario con ${tipoBusqueda === "cedula" ? "cédula" : "nombre"} "${busqueda}".`;
  }

  // 3. Obtener la fase del beneficiario
  const beneficiarioId = valores[0].beneficiario_id;
  const nombreEncontrado = valores[0].valor;

  const { data: beneficiario, error: errorBeneficiario } = await cliente
    .from("beneficiario")
    .select("fase")
    .eq("id", beneficiarioId)
    .single();

  if (errorBeneficiario || !beneficiario) {
    return `Error al obtener información del beneficiario.`;
  }

  return `El beneficiario "${nombreEncontrado}" se encuentra actualmente en la fase: **${beneficiario.fase}**.`;
}

export default obtenerFaseBeneficiario;
