import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

const FASES_VALIDAS = ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"] as const;
const TIPOS_DATO_VALIDOS = ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"] as const;
const TIPOS_PROCESO_VALIDOS = ["INICIO", "ETAPA", "FIN"] as const;

type Fase = (typeof FASES_VALIDAS)[number];
type TipoDato = (typeof TIPOS_DATO_VALIDOS)[number];
type TipoProceso = (typeof TIPOS_PROCESO_VALIDOS)[number];

interface CampoProcesoRow {
  id: string;
  orden: number;
  tipo_proceso: TipoProceso | null;
  numero_etapa: number | null;
  nombre: string;
}

interface CampoOrdenRow {
  id: string;
  orden: number;
}

function normalizarTipoDato(valor: string): TipoDato | null {
  const raw = valor.trim().toUpperCase();
  const aliases: Record<string, TipoDato> = {
    STRING: "TEXTO",
    TEXT: "TEXTO",
    VARCHAR: "TEXTO",
    CHAR: "TEXTO",
    NUMBER: "NUMERO",
    INTEGER: "NUMERO",
    INT: "NUMERO",
    DECIMAL: "NUMERO",
    FLOAT: "NUMERO",
    DOUBLE: "NUMERO",
    DATE: "FECHA",
    DATETIME: "FECHA",
    TIMESTAMP: "FECHA",
    BOOL: "BOOLEAN",
    BOOLEANO: "BOOLEAN",
  };

  const normalizado = (aliases[raw] || raw) as TipoDato;
  if (TIPOS_DATO_VALIDOS.includes(normalizado)) return normalizado;
  return null;
}

function normalizarFase(valor?: string): Fase {
  if (!valor || valor.trim() === "") return "FORMULACION";
  const fase = valor.trim().toUpperCase() as Fase;
  if (!FASES_VALIDAS.includes(fase)) {
    throw new Error(`fase inválida. Debe ser una de: ${FASES_VALIDAS.join(", ")}`);
  }
  return fase;
}

function normalizarTipoProceso(valor?: string): TipoProceso | null {
  if (!valor || valor.trim() === "") return null;
  const tipo = valor.trim().toUpperCase() as TipoProceso;
  if (!TIPOS_PROCESO_VALIDOS.includes(tipo)) {
    throw new Error(`tipo_proceso inválido. Debe ser uno de: ${TIPOS_PROCESO_VALIDOS.join(", ")}`);
  }
  return tipo;
}

function calcularOrdenParaProceso(
  camposProceso: CampoProcesoRow[],
  tipoProceso: TipoProceso,
  numeroEtapa: number | null,
  maxOrden: number,
): number {
  if (camposProceso.length === 0) {
    return maxOrden + 1;
  }

  if (tipoProceso === "INICIO") {
    return camposProceso[0].orden;
  }

  if (tipoProceso === "ETAPA") {
    const anchorCampos = camposProceso.filter((campo) => {
      if (campo.tipo_proceso === "INICIO") return true;
      if (
        campo.tipo_proceso === "ETAPA" &&
        campo.numero_etapa !== null &&
        numeroEtapa !== null &&
        campo.numero_etapa < numeroEtapa
      ) {
        return true;
      }
      return false;
    });

    if (anchorCampos.length > 0) {
      return anchorCampos[anchorCampos.length - 1].orden + 1;
    }

    return camposProceso[0].orden;
  }

  return maxOrden + 1;
}

async function incrementarOrdenDesde(proyectoId: string, nuevoOrden: number): Promise<void> {
  const { data, error } = await cliente
    .from("campo_personalizado")
    .select("id, orden")
    .eq("proyecto_id", proyectoId)
    .gte("orden", nuevoOrden)
    .order("orden", { ascending: false });

  if (error) {
    throw new Error("Error obteniendo campos para reordenar: " + error.message);
  }

  const campos = (data || []) as CampoOrdenRow[];
  for (const campo of campos) {
    const { error: updateError } = await cliente
      .from("campo_personalizado")
      .update({ orden: campo.orden + 1 })
      .eq("id", campo.id);

    if (updateError) {
      throw new Error("Error reordenando campos: " + updateError.message);
    }
  }
}

async function agregarColumnaProyecto(
  proyectoIdOrName: string,
  nombreColumna: string,
  tipoDatoRaw: string,
  usuarioId: string,
  faseRaw?: string,
  valorPorDefecto?: string,
  defineProceso: boolean = false,
  tipoProcesoRaw?: string,
  numeroEtapa?: number,
  forzarDesplazamientoEtapa: boolean = false,
): Promise<string> {
  if (!proyectoIdOrName || proyectoIdOrName.trim() === "") {
    return "Error: proyecto_id es requerido.";
  }

  if (!nombreColumna || nombreColumna.trim() === "") {
    return "Error: nombre_columna es requerido.";
  }

  if (!usuarioId || usuarioId.trim() === "") {
    return "Error: usuario_id es requerido.";
  }

  const tipoDato = normalizarTipoDato(tipoDatoRaw);
  if (!tipoDato) {
    return `Error: tipo_dato inválido. Debe ser uno de: ${TIPOS_DATO_VALIDOS.join(", ")}.`;
  }

  let fase: Fase;
  let tipoProceso: TipoProceso | null;

  try {
    fase = normalizarFase(faseRaw);
    tipoProceso = normalizarTipoProceso(tipoProcesoRaw);
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }

  if (defineProceso && !tipoProceso) {
    return "Error: tipo_proceso es requerido cuando define_proceso=true.";
  }

  if (!defineProceso) {
    tipoProceso = null;
  }

  let numeroEtapaFinal: number | null = null;
  if (tipoProceso === "ETAPA") {
    const parsed = Number(numeroEtapa);
    if (Number.isNaN(parsed) || parsed < 1) {
      return "Error: numero_etapa debe ser un número mayor o igual a 1 cuando tipo_proceso=ETAPA.";
    }
    numeroEtapaFinal = parsed;
  }

  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  const { data: campoExistente, error: campoExistenteError } = await cliente
    .from("campo_personalizado")
    .select("id")
    .eq("proyecto_id", proyectoId)
    .ilike("nombre", nombreColumna.trim())
    .maybeSingle();

  if (campoExistenteError) {
    return "Error validando columnas existentes: " + campoExistenteError.message;
  }

  if (campoExistente) {
    return `Ya existe una columna con el nombre "${nombreColumna}" en este proyecto.`;
  }

  const { data: todosCamposData, error: todosCamposError } = await cliente
    .from("campo_personalizado")
    .select("id, orden, tipo_proceso, numero_etapa, nombre")
    .eq("proyecto_id", proyectoId)
    .order("orden", { ascending: true });

  if (todosCamposError) {
    return "Error obteniendo campos del proyecto: " + todosCamposError.message;
  }

  const todosCampos = (todosCamposData || []) as CampoProcesoRow[];
  const maxOrden = todosCampos.length > 0 ? Math.max(...todosCampos.map((c) => c.orden)) : -1;
  const camposProceso = todosCampos.filter((c) => c.tipo_proceso !== null);

  if (tipoProceso === "ETAPA" && numeroEtapaFinal !== null) {
    const conflictivo = camposProceso.find(
      (campo) => campo.tipo_proceso === "ETAPA" && campo.numero_etapa === numeroEtapaFinal,
    );

    if (conflictivo) {
      const maxEtapaActual = camposProceso
        .filter((campo) => campo.tipo_proceso === "ETAPA" && campo.numero_etapa !== null)
        .reduce((max, campo) => Math.max(max, campo.numero_etapa || 0), 0);
      const nuevaEtapaDesplazada = maxEtapaActual + 1;

      if (!forzarDesplazamientoEtapa) {
        return JSON.stringify({
          requiereConfirmacion: true,
          mensaje:
            `La etapa ${numeroEtapaFinal} ya está en uso por "${conflictivo.nombre}". ` +
            `Si confirmas, ese campo se moverá a la etapa ${nuevaEtapaDesplazada}.`,
          conflicto: {
            campoActual: conflictivo.nombre,
            etapaSolicitada: numeroEtapaFinal,
            nuevaEtapaSiConfirma: nuevaEtapaDesplazada,
          },
        });
      }

      const { error: desplazarError } = await cliente
        .from("campo_personalizado")
        .update({ numero_etapa: nuevaEtapaDesplazada })
        .eq("id", conflictivo.id);

      if (desplazarError) {
        return "Error desplazando etapa existente: " + desplazarError.message;
      }
    }
  }

  let nuevoOrden = maxOrden + 1;
  if (defineProceso && tipoProceso && tipoProceso !== "FIN") {
    nuevoOrden = calcularOrdenParaProceso(camposProceso, tipoProceso, numeroEtapaFinal, maxOrden);
    await incrementarOrdenDesde(proyectoId, nuevoOrden);
  }

  const payloadCampo = {
    proyecto_id: proyectoId,
    fase,
    nombre: nombreColumna.trim(),
    tipo_dato: tipoDato,
    es_basico: false,
    es_identificador: false,
    define_proceso: defineProceso,
    tipo_proceso: tipoProceso,
    numero_etapa: numeroEtapaFinal,
    orden: nuevoOrden,
    creado_by: usuarioId,
  };

  const { data: campoCreado, error: crearCampoError } = await cliente
    .from("campo_personalizado")
    .insert(payloadCampo)
    .select("id, nombre, orden")
    .single();

  if (crearCampoError || !campoCreado) {
    return "Error creando columna: " + (crearCampoError?.message || "desconocido");
  }

  let beneficiariosInicializados = 0;
  const defaultVal = (valorPorDefecto || "").trim();
  if (defaultVal !== "") {
    const { data: beneficiarios, error: beneficiariosError } = await cliente
      .from("beneficiario")
      .select("id")
      .eq("proyecto_id", proyectoId);

    if (beneficiariosError) {
      return "Columna creada, pero falló cargar beneficiarios para valor por defecto: " + beneficiariosError.message;
    }

    const listaBeneficiarios = beneficiarios || [];
    if (listaBeneficiarios.length > 0) {
      const valores = listaBeneficiarios.map((b) => ({
        campo_id: campoCreado.id,
        beneficiario_id: b.id,
        valor: defaultVal,
        modificado_by: usuarioId,
      }));

      const { error: valoresError } = await cliente
        .from("valor_campo_beneficiario")
        .insert(valores);

      if (valoresError) {
        return "Columna creada, pero falló asignar valor por defecto: " + valoresError.message;
      }

      beneficiariosInicializados = valores.length;
    }
  }

  return JSON.stringify({
    ok: true,
    mensaje: `Columna "${campoCreado.nombre}" creada exitosamente en fase ${fase}.`,
    columna: {
      id: campoCreado.id,
      nombre: campoCreado.nombre,
      orden: campoCreado.orden,
      fase,
      tipo_dato: tipoDato,
      define_proceso: defineProceso,
      tipo_proceso: tipoProceso,
      numero_etapa: numeroEtapaFinal,
    },
    beneficiarios_inicializados: beneficiariosInicializados,
  });
}

export default agregarColumnaProyecto;
