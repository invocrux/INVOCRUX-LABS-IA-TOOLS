import cliente from "../services/supabase";
import { resolveProyectoId } from "./helpers/resolveProyectoId";

const FASES_VALIDAS = ["FORMULACION", "EJECUCION", "FACTURACION", "RECHAZADO"] as const;
const MODOS_VALIDOS = ["UNIR_TEXTO", "OPERACION_NUMERICA"] as const;
const OPERADORES_VALIDOS = ["SUMA", "RESTA", "MULTIPLICACION", "DIVISION"] as const;
const TIPOS_DATO_VALIDOS = ["TEXTO", "NUMERO", "FECHA", "BOOLEAN"] as const;

type Fase = (typeof FASES_VALIDAS)[number];
type ModoGeneracion = (typeof MODOS_VALIDOS)[number];
type OperadorNumerico = (typeof OPERADORES_VALIDOS)[number];
type TipoDato = (typeof TIPOS_DATO_VALIDOS)[number];

interface CampoProyecto {
  id: string;
  nombre: string;
  tipo_dato: string;
  orden: number;
}

interface ValorRow {
  beneficiario_id: string;
  campo_id: string;
  valor: string | null;
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

function normalizarTipoDato(tipo?: string, modo?: ModoGeneracion): TipoDato {
  if (!tipo || tipo.trim() === "") return modo === "OPERACION_NUMERICA" ? "NUMERO" : "TEXTO";
  const valor = tipo.trim().toUpperCase() as TipoDato;
  if (!TIPOS_DATO_VALIDOS.includes(valor)) {
    throw new Error(`tipo_resultado inválido. Debe ser uno de: ${TIPOS_DATO_VALIDOS.join(", ")}`);
  }
  return valor;
}

function parseNumero(valor: string | null): number {
  if (!valor || valor.trim() === "") return 0;
  const normalizado = valor.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalizado);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

function calcularNumerico(valores: number[], operador: OperadorNumerico): number {
  if (valores.length === 0) return 0;
  if (operador === "SUMA") return valores.reduce((acc, n) => acc + n, 0);
  if (operador === "MULTIPLICACION") return valores.reduce((acc, n) => acc * n, 1);
  if (operador === "RESTA") return valores.slice(1).reduce((acc, n) => acc - n, valores[0]);
  return valores.slice(1).reduce((acc, n) => (n === 0 ? acc : acc / n), valores[0]);
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function crearColumnaGenerada(
  proyectoIdOrName: string,
  nombreColumnaDestino: string,
  columnasFuente: string[],
  descripcionRegla: string,
  modo: string,
  usuarioId: string,
  confirmado: boolean,
  fase?: string,
  separador?: string,
  operador?: string,
  tipoResultado?: string,
): Promise<string> {
  if (!confirmado) {
    return "Error: confirmado=true es requerido para ejecutar la creación de columna generada.";
  }
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

  let faseFinal: Fase;
  let modoFinal: ModoGeneracion;
  let operadorFinal: OperadorNumerico | null;
  let tipoResultadoFinal: TipoDato;

  try {
    faseFinal = normalizarFase(fase);
    modoFinal = normalizarModo(modo);
    operadorFinal = normalizarOperador(operador);
    tipoResultadoFinal = normalizarTipoDato(tipoResultado, modoFinal);
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
    .select("id, nombre, tipo_dato, orden")
    .eq("proyecto_id", proyectoId)
    .order("orden", { ascending: true });

  if (camposError) {
    return "Error cargando columnas del proyecto: " + camposError.message;
  }

  const campos = (camposData || []) as CampoProyecto[];
  const camposPorNombre = new Map(
    campos.map((c) => [c.nombre.toLowerCase().trim(), c]),
  );

  if (camposPorNombre.has(nombreColumnaDestino.toLowerCase().trim())) {
    return `Ya existe una columna llamada "${nombreColumnaDestino}" en el proyecto.`;
  }

  const camposFuente: CampoProyecto[] = [];
  const noEncontradas: string[] = [];
  for (const fuente of columnasFuente) {
    const campo = camposPorNombre.get(fuente.toLowerCase().trim());
    if (!campo) {
      noEncontradas.push(fuente);
      continue;
    }
    camposFuente.push(campo);
  }

  if (noEncontradas.length > 0) {
    return `No se encontraron estas columnas fuente: ${noEncontradas.join(", ")}.`;
  }

  if (modoFinal === "OPERACION_NUMERICA") {
    const noNumericas = camposFuente
      .filter((c) => c.tipo_dato !== "NUMERO")
      .map((c) => `${c.nombre} (${c.tipo_dato})`);
    if (noNumericas.length > 0) {
      return `Para OPERACION_NUMERICA todas las columnas fuente deben ser NUMERO. No válidas: ${noNumericas.join(", ")}.`;
    }
  }

  const maxOrden = campos.length > 0 ? Math.max(...campos.map((c) => c.orden)) : -1;

  const { data: nuevoCampo, error: createFieldError } = await cliente
    .from("campo_personalizado")
    .insert({
      proyecto_id: proyectoId,
      fase: faseFinal,
      nombre: nombreColumnaDestino.trim(),
      tipo_dato: tipoResultadoFinal,
      es_basico: false,
      es_identificador: false,
      define_proceso: false,
      tipo_proceso: null,
      numero_etapa: null,
      orden: maxOrden + 1,
      creado_by: usuarioId,
    })
    .select("id, nombre")
    .single();

  if (createFieldError || !nuevoCampo) {
    return "Error creando la columna destino: " + (createFieldError?.message || "desconocido");
  }

  const { data: beneficiariosData, error: beneficiariosError } = await cliente
    .from("beneficiario")
    .select("id")
    .eq("proyecto_id", proyectoId);

  if (beneficiariosError) {
    return "Columna creada, pero falló cargar beneficiarios: " + beneficiariosError.message;
  }

  const beneficiarios = (beneficiariosData || []).map((b) => b.id as string);
  if (beneficiarios.length === 0) {
    return JSON.stringify({
      ok: true,
      mensaje: `La columna "${nuevoCampo.nombre}" fue creada. El proyecto no tiene beneficiarios para calcular valores aún.`,
      bloqueTecnico: {
        accion: "crear_columna_generada",
        columna_destino: nuevoCampo.nombre,
        filas_calculadas: 0,
        regla_interpretada: descripcionRegla,
      },
    });
  }

  const sourceIds = camposFuente.map((c) => c.id);
  const valoresMap = new Map<string, Map<string, string | null>>();

  const chunksBeneficiarios = chunkArray(beneficiarios, 500);
  for (const chunk of chunksBeneficiarios) {
    const { data: valoresData, error: valoresError } = await cliente
      .from("valor_campo_beneficiario")
      .select("beneficiario_id, campo_id, valor")
      .in("beneficiario_id", chunk)
      .in("campo_id", sourceIds);

    if (valoresError) {
      return "Columna creada, pero falló cargar valores fuente: " + valoresError.message;
    }

    const valores = (valoresData || []) as ValorRow[];
    for (const row of valores) {
      if (!valoresMap.has(row.beneficiario_id)) {
        valoresMap.set(row.beneficiario_id, new Map());
      }
      valoresMap.get(row.beneficiario_id)!.set(row.campo_id, row.valor);
    }
  }

  const separadorFinal = separador !== undefined ? separador : " ";
  const inserts = beneficiarios.map((beneficiarioId) => {
    const fuenteValores = camposFuente.map((campo) => {
      const valor = valoresMap.get(beneficiarioId)?.get(campo.id) ?? null;
      return { campo: campo.nombre, valor };
    });

    let resultado: string | null;

    if (modoFinal === "UNIR_TEXTO") {
      const partes = fuenteValores
        .map((f) => (f.valor || "").trim())
        .filter((v) => v.length > 0);
      resultado = partes.join(separadorFinal).replace(/\s+/g, " ").trim();
      if (resultado === "") resultado = null;
    } else {
      const numeros = fuenteValores.map((f) => parseNumero(f.valor));
      const calculado = calcularNumerico(numeros, operadorFinal!);
      resultado = Number.isFinite(calculado) ? String(calculado) : "0";
    }

    return {
      campo_id: nuevoCampo.id as string,
      beneficiario_id: beneficiarioId,
      valor: resultado,
      modificado_by: usuarioId,
    };
  });

  const chunkInserts = chunkArray(inserts, 500);
  for (const chunk of chunkInserts) {
    const { error: insertError } = await cliente
      .from("valor_campo_beneficiario")
      .insert(chunk);
    if (insertError) {
      return "Columna creada, pero falló guardar valores derivados: " + insertError.message;
    }
  }

  return JSON.stringify({
    ok: true,
    mensaje: `La columna "${nuevoCampo.nombre}" fue creada y calculada correctamente.`,
    bloqueTecnico: {
      accion: "crear_columna_generada",
      fase: faseFinal,
      columna_destino: nuevoCampo.nombre,
      columnas_fuente: camposFuente.map((c) => c.nombre),
      regla_interpretada: descripcionRegla,
      modo: modoFinal,
      operador: operadorFinal,
      separador: separadorFinal,
      filas_calculadas: inserts.length,
    },
  });
}

export default crearColumnaGenerada;
