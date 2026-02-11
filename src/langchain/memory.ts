import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

export function crearMemoria(): BufferMemory {
  return new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
    outputKey: "output",
  });
}


