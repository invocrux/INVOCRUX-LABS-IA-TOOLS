import { type BaseMessage } from "@langchain/core/messages";

// En LangChain v1.x, la memoria se maneja con arrays de BaseMessage
// Esta función retorna un array vacío que se puede usar para inicializar el historial
export function crearMemoria(): BaseMessage[] {
  return [];
}


