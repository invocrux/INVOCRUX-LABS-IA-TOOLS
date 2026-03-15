import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

interface BeneficiarioEncontrado {
  nombre: string;
  cedula: string | null;
  beneficiarioId: string;
}

interface ResultadoBusqueda {
  nombreBuscado: string;
  coincidencias: BeneficiarioEncontrado[];
}

/**
 * Busca beneficiarios por nombre (búsqueda parcial con ilike).
 * Devuelve nombre Y cédula para que se pueda usar en actualizaciones.
 */
async function buscarBeneficiariosPorNombre(
  proyectoIdOrName: string,
  nombres: string[]
): Promise<string> {
  console.log(`🔍 [buscarBeneficiariosPorNombre] proyectoId recibido: "${proyectoIdOrName}"`);
  console.log(`🔍 [buscarBeneficiariosPorNombre] nombres a buscar: ${JSON.stringify(nombres)}`);

  // Resolver el proyecto_id (puede venir como nombre o UUID)
  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  // Encontrar campo de nombre
  const { data: camposNombre, error: errorCampoNombre } = await cliente
    .from("campo_personalizado")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId)
    .ilike("nombre", "%nombre%");
  
  console.log(`🔍 [buscarBeneficiariosPorNombre] campos encontrados: ${JSON.stringify(camposNombre)}`);
  console.log(`🔍 [buscarBeneficiariosPorNombre] error: ${JSON.stringify(errorCampoNombre)}`);

  if (errorCampoNombre || !camposNombre || camposNombre.length === 0) {
    return "No se encontró un campo de nombre configurado en este proyecto.";
  }

  // Encontrar campo identificador (cédula)
  const { data: campoIdentificador } = await cliente
    .from("campo_personalizado")
    .select("id, nombre")
    .eq("proyecto_id", proyectoId)
    .eq("es_identificador", true)
    .single();

  const campoNombreIds = camposNombre.map((c) => c.id);
  console.log(`🔍 Buscando en campos: ${camposNombre.map((c) => c.nombre).join(", ")}`);

  const resultados: ResultadoBusqueda[] = [];

  // Búsqueda parcial por cada nombre
  for (const nombreBuscado of nombres) {
    const { data: encontrados, error } = await cliente
      .from("valor_campo_beneficiario")
      .select("valor, beneficiario_id")
      .in("campo_id", campoNombreIds)
      .ilike("valor", `%${nombreBuscado}%`);

    if (error) {
      throw new Error("Error al buscar beneficiarios: " + error.message);
    }

    // Eliminar duplicados y obtener cédulas
    const beneficiariosUnicos = new Map<string, BeneficiarioEncontrado>();
    
    for (const e of encontrados || []) {
      if (!beneficiariosUnicos.has(e.beneficiario_id)) {
        let cedula: string | null = null;
        
        // Obtener cédula si existe campo identificador
        if (campoIdentificador) {
          const { data: valorCedula } = await cliente
            .from("valor_campo_beneficiario")
            .select("valor")
            .eq("beneficiario_id", e.beneficiario_id)
            .eq("campo_id", campoIdentificador.id)
            .single();
          
          cedula = valorCedula?.valor || null;
        }

        beneficiariosUnicos.set(e.beneficiario_id, {
          nombre: e.valor,
          cedula,
          beneficiarioId: e.beneficiario_id,
        });
      }
    }

    resultados.push({
      nombreBuscado,
      coincidencias: Array.from(beneficiariosUnicos.values()),
    });
  }

  // Generar respuesta
  const totalCoincidencias = resultados.reduce(
    (sum, r) => sum + r.coincidencias.length,
    0
  );

  let respuesta = `Búsqueda por nombre: ${totalCoincidencias} coincidencia(s) encontrada(s).`;

  const nombreCampoId = campoIdentificador?.nombre || "Cédula";

  for (const resultado of resultados) {
    if (resultado.coincidencias.length > 0) {
      respuesta += `\n\n"${resultado.nombreBuscado}" coincide con:`;
      resultado.coincidencias.forEach((b) => {
        respuesta += `\n  - ${b.nombre} (${nombreCampoId}: ${b.cedula || "sin registro"})`;
      });
    } else {
      respuesta += `\n\n"${resultado.nombreBuscado}": sin coincidencias.`;
    }
  }

  return respuesta;
}

export default buscarBeneficiariosPorNombre;
