import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

const FASES_VALIDAS = ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"] as const;
const MODOS_VALIDOS = ["UNIR_TEXTO", "OPERACION_NUMERICA"] as const;
const OPERADORES_VALIDOS = ["SUMA", "RESTA", "MULTIPLICACION", "DIVISION"] as const;

type Fase = (typeof FASES_VALIDAS)[number];
type ModoGeneracion = (typeof MODOS_VALIDOS)[number];
type OperadorNumerico = (typeof OPERADORES_VALIDOS)[number];

interface CampoProyecto {
  id: string;
  nombre: string;
  tipo_dato: string;
}

function normalizarFase(fase?: string): Fase {
  if (!fase || fase.trim() === "") return "FORMULACION";
  const valor = fase.trim().toUpperCase() as Fase;
  if (!FASES_VALIDAS.includes(valor)) {
    throw new Error(`fase inválida. Debe ser una de: ${FASES_VALIDAS.join(", ")}`);
  }
  return valor;
}

function normalizarModo(modo: string): ModoGeneracion {
  const valor = modo.trim().toUpperCase() as ModoGeneracion;
  if (!MODOS_VALIDOS.includes(valor)) {
    throw new Error(`modo inválido. Debe ser uno de: ${MODOS_VALIDOS.join(", ")}`);
  }
  return valor;
}

function normalizarOperador(operador?: string): OperadorNumerico | null {
  if (!operador || operador.trim() === "") return null;
  const valor = operador.trim().toUpperCase() as OperadorNumerico;
  if (!OPERADORES_VALIDOS.includes(valor)) {
    throw new Error(`operador inválido. Debe ser uno de: ${OPERADORES_VALIDOS.join(", ")}`);
  }
  return valor;
}

async function previsualizarColumnaGenerada(
  proyectoIdOrName: string,
  nombreColumnaDestino: string,
  columnasFuente: string[],
  descripcionRegla: string,
  modo: string,
  usuarioId: string,
  fase?: string,
  separador?: string,
  operador?: string,
  tipoResultado?: string,
): Promise<string> {
  if (!proyectoIdOrName || proyectoIdOrName.trim() === "") {
    return "Error: proyecto_id es requerido.";
  }
  if (!usuarioId || usuarioId.trim() === "") {
    return "Error: usuario_id es requerido.";
  }
  if (!nombreColumnaDestino || nombreColumnaDestino.trim() === "") {
    return "Error: nombre_columna_destino es requerido.";
  }
  if (!Array.isArray(columnasFuente) || columnasFuente.length < 2) {
    return "Error: columnas_fuente debe incluir al menos 2 columnas.";
  }
  if (!descripcionRegla || descripcionRegla.trim() === "") {
    return "Error: descripcion_regla es requerida.";
  }

  let faseFinal: Fase;
  let modoFinal: ModoGeneracion;
  let operadorFinal: OperadorNumerico | null;

  try {
    faseFinal = normalizarFase(fase);
    modoFinal = normalizarModo(modo);
    operadorFinal = normalizarOperador(operador);
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }

  if (modoFinal === "OPERACION_NUMERICA" && !operadorFinal) {
    return "Error: operador es requerido cuando modo=OPERACION_NUMERICA.";
  }

  const proyectoId = await resolveProyectoId(proyectoIdOrName);
  if (!proyectoId) {
    return `No se encontró el proyecto "${proyectoIdOrName}".`;
  }

  const { data: camposData, error: camposError } = await cliente
    .from("campo_personalizado")
    .select("id, nombre, tipo_dato")
    .eq("proyecto_id", proyectoId);

  if (camposError) {
    return "Error cargando columnas del proyecto: " + camposError.message;
  }

  const campos = (camposData || []) as CampoProyecto[];
  const camposPorNombre = new Map(
    campos.map((c) => [c.nombre.toLowerCase().trim(), c]),
  );

  const destinoExistente = camposPorNombre.get(nombreColumnaDestino.toLowerCase().trim());
  if (destinoExistente) {
    return `Ya existe una columna llamada "${nombreColumnaDestino}" en el proyecto.`;
  }

  const fuentesNoEncontradas: string[] = [];
  const fuentesResueltas: CampoProyecto[] = [];

  for (const nombre of columnasFuente) {
    const campo = camposPorNombre.get(nombre.toLowerCase().trim());
    if (!campo) {
      fuentesNoEncontradas.push(nombre);
      continue;
    }
    fuentesResueltas.push(campo);
  }

  if (fuentesNoEncontradas.length > 0) {
    return `No se encontraron estas columnas fuente: ${fuentesNoEncontradas.join(", ")}.`;
  }

  if (modoFinal === "OPERACION_NUMERICA") {
    const noNumericas = fuentesResueltas
      .filter((c) => c.tipo_dato !== "NUMERO")
      .map((c) => `${c.nombre} (${c.tipo_dato})`);

    if (noNumericas.length > 0) {
      return `Para OPERACION_NUMERICA todas las columnas fuente deben ser NUMERO. No válidas: ${noNumericas.join(", ")}.`;
    }
  }

  const { count: totalBeneficiarios, error: countError } = await cliente
    .from("beneficiario")
    .select("id", { count: "exact", head: true })
    .eq("proyecto_id", proyectoId);

  if (countError) {
    return "Error estimando impacto: " + countError.message;
  }

  const tipoResultadoFinal = (tipoResultado || (modoFinal === "UNIR_TEXTO" ? "TEXTO" : "NUMERO"))
    .trim()
    .toUpperCase();

  return JSON.stringify({
    requiereConfirmacion: true,
    resumen: `Se creará la columna "${nombreColumnaDestino}" aplicando la regla indicada sobre ${fuentesResueltas.length} columnas fuente.`,
    bloqueTecnico: {
      accion: "crear_columna_generada",
      proyecto: proyectoIdOrName,
      fase: faseFinal,
      columna_destino: nombreColumnaDestino.trim(),
      columnas_fuente: fuentesResueltas.map((c) => c.nombre),
      regla_interpretada: descripcionRegla.trim(),
      modo: modoFinal,
      operador: operadorFinal,
      separador: separador ?? " ",
      tipo_resultado: tipoResultadoFinal,
      impacto_estimado_filas: totalBeneficiarios || 0,
      usuario_id: usuarioId,
    },
    instruccion: "Solicita confirmación explícita del usuario antes de ejecutar crear_columna_generada.",
  });
}

export default previsualizarColumnaGenerada;
