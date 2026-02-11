import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { cargarSesion } from "../repositories/sessionRepository";
import { BufferMemory } from "langchain/memory";

export async function processChat(userId: string, message: string) {
  const chatAntiguo = await cargarSesion(userId);
  const langChainMessages = chatAntiguo.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );
  const memory = new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
    outputKey: "output"
  })
}
