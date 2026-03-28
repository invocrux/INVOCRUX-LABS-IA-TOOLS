import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { cargarSesion, saveSesion } from "../repositories/sessionRepository";
import { IChatContext, IChatDataDTO, IMessage } from "../types/api.types";
import { crearAgente } from "../langchain";

export async function processChat(
  userId: string,
  message: string,
  contexto?: IChatContext
): Promise<IChatDataDTO> {
  const [chatAntiguo, agente] = await Promise.all([
    cargarSesion(userId),
    crearAgente(),
  ]);

  const baseMessage: BaseMessage[] = convertirABaseMessage(chatAntiguo);

  // Agregar contexto como system message si existe
  const systemPrompt = buildSystemPrompt(contexto, userId);

  const startTime = Date.now();
  const resultado = await agente.invoke(message, baseMessage, systemPrompt);
  const duracion = Date.now() - startTime;
  const toolsUsadas = extraerTools(resultado.messages) || [];
  const nuevosMessages: IMessage[] = convertirAIMessage(resultado.messages);
  saveSesion(userId, nuevosMessages).catch((error) => {
    console.error(`Error guardando sesión para ${userId}:`, error);
  });

  return {
    respuesta: String(resultado.output),
    toolsEjecutadas: toolsUsadas,
    duracionMs: duracion,
    timestamp: new Date().toISOString(),
  };
}

function buildSystemPrompt(contexto?: IChatContext, userId?: string): string {
  let prompt = `Eres el asistente de Habitat, un sistema de gestión de proyectos de mejoramiento habitacional.
Tu rol es ayudar a los usuarios a consultar y gestionar información de proyectos, beneficiarios y fases.

Reglas importantes:
- Responde siempre en español
- Sé conciso y directo
- Usa formato Markdown para estructurar las respuestas (listas, negritas, tablas)
- SIEMPRE usa las herramientas para consultar datos, incluso si crees recordar la respuesta de mensajes anteriores
- NUNCA inventes ni asumas datos - cada consulta debe verificarse con las herramientas

IMPORTANTE sobre creación de columnas (agregar campo):
- Cuando el usuario pida agregar/crear una columna o campo, usa la herramienta agregar_columna_proyecto.
- Si el usuario no indica fase, usa FORMULACION por defecto.
- Antes de crear, usa listar_columnas para evitar nombres duplicados o ambiguos.
- Si es una columna de proceso ETAPA y hay conflicto de etapa, primero explica el conflicto y pide confirmación.
- Solo después de confirmar, vuelve a ejecutar agregar_columna_proyecto con forzar_desplazamiento_etapa=true.
- NUNCA muestres IDs internos (proyecto_id, campo_id, beneficiario_id) al usuario.

IMPORTANTE sobre columnas generadas por IA (combinación/operación entre columnas):
- Para columnas generadas SIEMPRE usa flujo de 2 pasos: previsualizar_columna_generada -> confirmación del usuario -> crear_columna_generada.
- Nunca ejecutes crear_columna_generada sin confirmación explícita del usuario.
- Antes de pedir confirmación, muestra SIEMPRE este bloque técnico (en texto visible para el usuario):
  - accion
  - proyecto
  - fase
  - columna_destino
  - columnas_fuente
  - regla_interpretada
  - modo
  - operador (si aplica)
  - separador (si aplica)
  - tipo_resultado
- impacto_estimado_filas
- Pide confirmación textual clara: "¿Confirmas que lo ejecute así?".
- Si el usuario corrige algo, vuelve a previsualizar y vuelve a pedir confirmación.

Regla UX para confirmaciones (evitar fricción):
- Máximo UNA confirmación por operación. No pidas "¿confirmas?" dos veces para la misma acción.
- Prohibido pedir confirmación genérica antes del bloque técnico. Primero previsualiza, luego pide la única confirmación.
- Si el usuario ya confirmó en el turno inmediatamente anterior (ej: "confirmo", "sí", "hazlo"), ejecuta la operación pendiente sin volver a preguntar.
- Si una acción requiere pasos internos consecutivos (p. ej. interpretar -> previsualizar -> crear), usa la misma confirmación del usuario para cerrar el flujo completo.
- Solo vuelve a pedir confirmación si cambió materialmente el plan (columnas fuente, regla, columna destino, fase, impacto o acción destructiva distinta).

IMPORTANTE sobre edición/eliminación de columnas:
- Para renombrar, cambiar tipo o mover fase de una columna usa editar_columna_proyecto.
- Antes de editar/eliminar, usa listar_columnas para confirmar el nombre exacto de la columna.
- Para eliminar una columna usa eliminar_columna_proyecto.
- eliminar_columna_proyecto primero devuelve confirmación requerida; solo elimina cuando confirmar_eliminacion=true.
- Nunca intentes eliminar ni editar la columna identificadora.

IMPORTANTE sobre creación de proyectos desde Excel:
Cuando el usuario sube un archivo Excel, estás en un FLUJO DE CREACIÓN. El proyecto AÚN NO EXISTE en el sistema.
NO uses listar_proyectos, buscar_beneficiarios, ni ninguna herramienta de consulta durante este flujo.
Solo usa las herramientas de Excel: obtener_excel_subido, configurar_proyecto_excel, previsualizar_proyecto_excel, crear_proyecto_desde_excel.

Pasos del flujo de creación desde Excel:
1. Cuando el usuario dice que subió un archivo → usa obtener_excel_subido para ver el resumen
2. Pregunta al usuario el NOMBRE del proyecto → usa configurar_proyecto_excel con campo="nombre_proyecto"
3. Pregunta cuál columna es el IDENTIFICADOR único (como cédula) → usa configurar_proyecto_excel con campo="campo_identificador"
   (Al configurar el identificador, el sistema auto-genera el mapeo de todas las columnas)
4. Cuando el usuario quiera ver el mapeo o confirmar → usa previsualizar_proyecto_excel (NO busques el proyecto en la base de datos)
5. Cuando el usuario confirme que todo está correcto → usa crear_proyecto_desde_excel
6. El proyecto SOLO existe en el sistema DESPUÉS de usar crear_proyecto_desde_excel

- NUNCA muestres IDs internos (proyecto_id, campo_id, beneficiario_id) al usuario
- Si una herramienta retorna que la configuración está completa, usa previsualizar_proyecto_excel para mostrar el resumen`;

  if (userId) {
    prompt += `\n\nID del usuario actual: ${userId}`;
  }

  if (contexto) {
    prompt += `\n\n--- CONTEXTO ACTUAL DEL USUARIO ---`;

    if (contexto.proyectoId) {
      prompt += `\nproyecto_id: "${contexto.proyectoId}"`;
    }
    if (contexto.proyectoNombre) {
      prompt += `\nNombre del proyecto: "${contexto.proyectoNombre}"`;
    }
    if (contexto.fase) {
      prompt += `\nFase actual: ${contexto.fase}`;
    }

    prompt += `\n
Usa el proyecto_id del contexto SOLO cuando el usuario se refiera a "este proyecto" o no especifique cuál.
Si el usuario menciona OTRO proyecto por nombre o posición, DEBES usar listar_proyectos primero para obtener su ID.`;
  }

  return prompt;
}

function convertirABaseMessage(chat: IMessage[]): BaseMessage[] {
  return chat.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );
}

function extraerTools(params: BaseMessage[]) {
  return params
    .filter((msg) => msg._getType() === "tool")
    .map((msg) => msg.name);
}

function convertirAIMessage(params: BaseMessage[]): IMessage[] {
  return params
    .map((msg) => {
      const tipo = msg._getType();

      if (tipo === "human") {
        return { role: "user" as const, content: String(msg.content) };
      } else if (tipo === "ai") {
        return { role: "assistant" as const, content: String(msg.content) };
      }

      return null;
    })
    .filter((m): m is IMessage => m !== null);
}
