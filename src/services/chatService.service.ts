import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { cargarSesion, saveSesion } from "../repositories/sessionRepository";
import { IChatDataDTO, IMessage } from "../types/api.types";
import { crearAgente } from "../langchain";

export async function processChat(
  userId: string,
  message: string,
): Promise<IChatDataDTO> {
  const [chatAntiguo, agente] = await Promise.all([
    cargarSesion(userId),
    crearAgente(),
  ]);

  const baseMessage: BaseMessage[] = convertirABaseMessage(chatAntiguo);
  const startTime = Date.now();
  const resultado = await agente.invoke(message, baseMessage);
  const duracion = Date.now() - startTime;
  const toolsUsadas = extraerTools(resultado.messages) || [];
  const nuevosMessages: IMessage[] = convertirAIMessage(resultado.messages);
  saveSesion(userId, nuevosMessages).catch((error) => {
    console.error(`Error guardando sesión para ${userId}:`, error);
  });

  return {
    respuesta: resultado.output,
    toolsEjecutadas: toolsUsadas,
    duracionMs: duracion,
    timestamp: new Date().toISOString(),
  };
}

function convertirABaseMessage(chat: IMessage[]): BaseMessage[] {
  return chat.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );
}

function extraerTools(params: BaseMessage[]) {
  return params
    .filter((msg) => msg.type && msg.type === "tool")
    .map((msg) => msg.name);
}

function convertirAIMessage(params: BaseMessage[]): IMessage[] {
  return params
    .map((msg) => {
      const tipo = msg.type;

      if (tipo === "human") {
        return { role: "user" as const, content: msg.content };
      } else if (tipo === "ai") {
        return { role: "assistant" as const, content: msg.content };
      }

      return null;
    })
    .filter((m): m is IMessage => m !== null);
}
