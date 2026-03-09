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
- Si necesitas información que no tienes, usa las herramientas disponibles
- NO inventes datos, siempre usa las herramientas para obtener información real`;

  if (userId) {
    prompt += `\n\nID del usuario actual: ${userId}`;
  }

  if (contexto) {
    prompt += `\n\n--- CONTEXTO ACTUAL ---`;

    if (contexto.proyectoId) {
      prompt += `\nProyecto ID: ${contexto.proyectoId}`;
    }
    if (contexto.proyectoNombre) {
      prompt += `\nProyecto: ${contexto.proyectoNombre}`;
    }
    if (contexto.fase) {
      prompt += `\nFase actual: ${contexto.fase}`;
    }

    prompt += `\n\nUsa este contexto para las operaciones. Si el usuario pide algo relacionado con "este proyecto" o "la fase actual", usa estos valores.`;
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
