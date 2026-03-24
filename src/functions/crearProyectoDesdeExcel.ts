import cliente from "../services/supabase";

interface Mapping {
  excelColumn: string;
  fieldName: string;
  dataType: string;
  esIdentificador: boolean;
  esBasico: boolean;
}

interface Configuracion {
  nombre_proyecto: string;
  campo_identificador: string;
  mappings: Mapping[];
}

/**
 * Crea un proyecto completo en Habitat desde el Excel subido y la configuración acumulada.
 * Inserta: proyecto → campos_personalizados → beneficiarios → valores.
 */
async function crearProyectoDesdeExcel(usuarioId: string): Promise<string> {
  // 1. Cargar datos del Excel temporal
  const { data: excelData, error: excelError } = await cliente
    .from("excel_temporal")
    .select("*")
    .eq("user_id", usuarioId)
    .single();

  if (excelError || !excelData) {
    return "No hay archivo Excel subido.";
  }

  const config = excelData.configuracion as Configuracion;
  const datos = excelData.datos as Record<string, string>[];

  // Validar configuración completa
  if (!config.nombre_proyecto || !config.campo_identificador || !config.mappings?.length) {
    return "Configuración incompleta. Usa configurar_proyecto_excel para completar: nombre_proyecto, campo_identificador y mappings.";
  }

  try {
    // 2. Crear proyecto
    const { data: proyecto, error: proyError } = await cliente
      .from("proyecto")
      .insert({
        nombre: config.nombre_proyecto,
        estado: "FORMULACION",
        total_beneficiarios: datos.length,
        creado_by: usuarioId,
      })
      .select("id")
      .single();

    if (proyError || !proyecto) {
      return "Error al crear el proyecto: " + (proyError?.message || "desconocido");
    }

    const proyectoId = proyecto.id;

    // 3. Crear campos personalizados (normalizar tipo_dato a valores válidos)
    const TIPOS_VALIDOS = ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"];
    const normalizarTipo = (t: string): string => {
      const upper = t.trim().toUpperCase();
      if (TIPOS_VALIDOS.includes(upper)) return upper;
      const aliases: Record<string, string> = {
        STRING: "TEXTO", TEXT: "TEXTO", NUMBER: "NUMERO", INT: "NUMERO",
        DATE: "FECHA", DATETIME: "FECHA", BOOL: "BOOLEAN", BOOLEANO: "BOOLEAN",
      };
      return aliases[upper] || "TEXTO";
    };

    const camposInsert = config.mappings.map((m, index) => ({
      proyecto_id: proyectoId,
      nombre: m.fieldName,
      tipo_dato: normalizarTipo(m.dataType),
      es_identificador: m.esIdentificador,
      es_basico: m.esBasico ?? true,
      fase: null,
      orden: index + 1,
      creado_by: usuarioId,
    }));

    const { data: camposCreados, error: camposError } = await cliente
      .from("campo_personalizado")
      .insert(camposInsert)
      .select("id, nombre");

    if (camposError || !camposCreados) {
      return "Error al crear campos: " + (camposError?.message || "desconocido");
    }

    // Mapa de nombre de campo → id
    const campoMap = new Map(camposCreados.map((c) => [c.nombre, c.id]));

    // Mapa de excelColumn → campo_id
    const excelToCampoId = new Map(
      config.mappings.map((m) => [m.excelColumn, campoMap.get(m.fieldName)])
    );

    // 4. Crear beneficiarios en lotes
    const BATCH_SIZE = 100;
    let beneficiariosCreados = 0;
    let valoresCreados = 0;

    for (let i = 0; i < datos.length; i += BATCH_SIZE) {
      const batch = datos.slice(i, i + BATCH_SIZE);

      const beneficiariosInsert = batch.map(() => ({
        proyecto_id: proyectoId,
        fase: "FORMULACION",
        modificado_by: usuarioId,
      }));

      const { data: benefs, error: benError } = await cliente
        .from("beneficiario")
        .insert(beneficiariosInsert)
        .select("id");

      if (benError || !benefs) {
        return `Error al crear beneficiarios (lote ${i / BATCH_SIZE + 1}): ${benError?.message || "desconocido"}. Se crearon ${beneficiariosCreados} beneficiarios antes del error.`;
      }

      beneficiariosCreados += benefs.length;

      // 5. Crear valores para cada beneficiario del lote
      const valoresInsert: Array<{
        beneficiario_id: string;
        campo_id: string;
        valor: string;
        modificado_by: string;
      }> = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const beneficiarioId = benefs[j].id;

        for (const mapping of config.mappings) {
          const campoId = excelToCampoId.get(mapping.excelColumn);
          if (!campoId) continue;

          valoresInsert.push({
            beneficiario_id: beneficiarioId,
            campo_id: campoId,
            valor: row[mapping.excelColumn] || "",
            modificado_by: usuarioId,
          });
        }
      }

      // Insertar valores en sub-lotes de 500
      const VALOR_BATCH = 500;
      for (let v = 0; v < valoresInsert.length; v += VALOR_BATCH) {
        const valorBatch = valoresInsert.slice(v, v + VALOR_BATCH);
        const { error: valError } = await cliente
          .from("valor_campo_beneficiario")
          .insert(valorBatch);

        if (valError) {
          return `Error al insertar valores (lote ${v / VALOR_BATCH + 1}): ${valError.message}. Proyecto creado parcialmente.`;
        }
        valoresCreados += valorBatch.length;
      }
    }

    // 6. Limpiar excel_temporal
    await cliente.from("excel_temporal").delete().eq("user_id", usuarioId);

    return JSON.stringify({
      mensaje: `Proyecto "${config.nombre_proyecto}" creado exitosamente.`,
      proyecto_id: proyectoId,
      beneficiarios_creados: beneficiariosCreados,
      campos_creados: camposCreados.length,
      valores_insertados: valoresCreados,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return "Error inesperado al crear el proyecto: " + message;
  }
}

export default crearProyectoDesdeExcel;
