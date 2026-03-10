import cliente from "../services/supabase";

interface ResultadoBusqueda {
  nombreBuscado: string;
  coincidencias: string[];
  beneficiarioIds: string[];
}

/**
 * Busca beneficiarios por nombre (búsqueda parcial con ilike).
 * Busca en campos que contengan "nombre" en su nombre.
 */
async function buscarBeneficiariosPorNombre(
  proyectoId: string,
  nombres: string[]
): Promise<string> {
  // Encontrar campos que contengan "nombre" (puede haber varios: "nombre", "nombre completo", etc.)
  const { data: campos, error: errorCampo } = await cliente
    .from("campo_personalizado")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId)
    .ilike("nombre", "%nombre%");

  if (errorCampo || !campos || campos.length === 0) {
    return "No se encontró un campo de nombre configurado en este proyecto.";
  }

  // Usar todos los campos que contengan "nombre"
  const campoIds = campos.map((c) => c.id);
  console.log(`🔍 Buscando en campos: ${campos.map((c) => c.nombre).join(", ")}`);

  const resultados: ResultadoBusqueda[] = [];

  // Búsqueda parcial por cada nombre
  for (const nombreBuscado of nombres) {
    // Buscar en TODOS los campos de nombre
    const { data: encontrados, error } = await cliente
      .from("valor_campo_beneficiario")
      .select("valor, beneficiario_id")
      .in("campo_id", campoIds)
      .ilike("valor", `%${nombreBuscado}%`);

    if (error) {
      throw new Error("Error al buscar beneficiarios: " + error.message);
    }

    // Eliminar duplicados (mismo beneficiario puede aparecer en varios campos)
    const uniqueBeneficiarios = new Map<string, string>();
    encontrados?.forEach((e) => {
      if (!uniqueBeneficiarios.has(e.beneficiario_id)) {
        uniqueBeneficiarios.set(e.beneficiario_id, e.valor);
      }
    });

    resultados.push({
      nombreBuscado,
      coincidencias: Array.from(uniqueBeneficiarios.values()),
      beneficiarioIds: Array.from(uniqueBeneficiarios.keys()),
    });
  }

  // Generar respuesta
  const totalCoincidencias = resultados.reduce(
    (sum, r) => sum + r.coincidencias.length,
    0
  );

  let respuesta = `Búsqueda por nombre: ${totalCoincidencias} coincidencia(s) encontrada(s).`;

  for (const resultado of resultados) {
    if (resultado.coincidencias.length > 0) {
      respuesta += `\n\n"${resultado.nombreBuscado}" coincide con:`;
      resultado.coincidencias.forEach((nombre) => {
        respuesta += `\n  - ${nombre}`;
      });
    } else {
      respuesta += `\n\n"${resultado.nombreBuscado}": sin coincidencias.`;
    }
  }

  return respuesta;
}

export default buscarBeneficiariosPorNombre;
