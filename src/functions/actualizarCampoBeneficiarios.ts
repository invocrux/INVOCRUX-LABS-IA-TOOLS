import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

interface ResultadoActualizacion {
  actualizados: number;
  errores: string[];
}

/**
 * Actualiza un campo específico para múltiples beneficiarios identificados por cédula.
 */
async function actualizarCampoBeneficiarios(
  proyectoIdOrName: string,
  cedulas: string[],
  nombreColumna: string,
  nuevoValor: string,
  usuarioId: string
): Promise<string> {
  console.log(`🔍 [actualizarCampoBeneficiarios] proyectoId: "${proyectoIdOrName}"`);
  console.log(`🔍 [actualizarCampoBeneficiarios] cedulas: ${JSON.stringify(cedulas)}`);
  console.log(`🔍 [actualizarCampoBeneficiarios] columna: "${nombreColumna}", valor: "${nuevoValor}"`);

  // Resolver el proyecto_id (puede venir como nombre o UUID)
  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  const resultado: ResultadoActualizacion = {
    actualizados: 0,
    errores: [],
  };

  // 1. Encontrar el campo identificador (cédula)
  const { data: campoIdentificador, error: errorId } = await cliente
    .from("campo_personalizado")
    .select("id")
    .eq("proyecto_id", proyectoId)
    .eq("es_identificador", true)
    .single();

  if (errorId || !campoIdentificador) {
    return "Error: No se encontró un campo identificador (cédula) en este proyecto.";
  }

  // 2. Encontrar el campo a actualizar
  const { data: campoActualizar, error: errorCampo } = await cliente
    .from("campo_personalizado")
    .select("id, tipo_dato")
    .eq("proyecto_id", proyectoId)
    .ilike("nombre", nombreColumna)
    .single();

  if (errorCampo || !campoActualizar) {
    return `Error: No se encontró la columna "${nombreColumna}" en este proyecto.`;
  }

  // 3. Buscar beneficiarios por cédula
  const { data: valoresCedula, error: errorBusqueda } = await cliente
    .from("valor_campo_beneficiario")
    .select("valor, beneficiario_id")
    .eq("campo_id", campoIdentificador.id)
    .in("valor", cedulas);

  if (errorBusqueda) {
    return "Error al buscar beneficiarios: " + errorBusqueda.message;
  }

  const beneficiariosPorCedula = new Map(
    (valoresCedula || []).map((v) => [v.valor, v.beneficiario_id])
  );

  // 4. Actualizar cada beneficiario encontrado
  for (const cedula of cedulas) {
    const beneficiarioId = beneficiariosPorCedula.get(cedula);

    if (!beneficiarioId) {
      resultado.errores.push(`Cédula ${cedula} no encontrada`);
      continue;
    }

    // Verificar si ya existe el valor para este campo
    const { data: valorExistente } = await cliente
      .from("valor_campo_beneficiario")
      .select("id")
      .eq("beneficiario_id", beneficiarioId)
      .eq("campo_id", campoActualizar.id)
      .single();

    if (valorExistente) {
      // Actualizar
      const { error: errorUpdate } = await cliente
        .from("valor_campo_beneficiario")
        .update({
          valor: nuevoValor,
          modificado_by: usuarioId,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", valorExistente.id);

      if (errorUpdate) {
        resultado.errores.push(`Error actualizando cédula ${cedula}`);
      } else {
        resultado.actualizados++;
      }
    } else {
      // Insertar nuevo
      const { error: errorInsert } = await cliente
        .from("valor_campo_beneficiario")
        .insert({
          beneficiario_id: beneficiarioId,
          campo_id: campoActualizar.id,
          valor: nuevoValor,
          modificado_by: usuarioId,
        });

      if (errorInsert) {
        resultado.errores.push(`Error insertando valor para cédula ${cedula}`);
      } else {
        resultado.actualizados++;
      }
    }
  }

  // 5. Generar respuesta
  let respuesta = `Actualización completada: ${resultado.actualizados} de ${cedulas.length} registros actualizados.`;

  if (resultado.errores.length > 0) {
    respuesta += `\nErrores (${resultado.errores.length}): ${resultado.errores.join(", ")}`;
  }

  return respuesta;
}

export default actualizarCampoBeneficiarios;
