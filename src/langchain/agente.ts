import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { langChainTools } from "./toolDefinitions";
import { crearMemoria } from "./memory";
import { ThinkingCallbackHandler } from "./callbacks";
import { llm } from "./llmService";
export async function crearAgente(): Promise<AgentExecutor> {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Sos un asistente de inventario de frutería. Tienes la capacidad de guardar contexto, Si el usuario pregunta por algo que ya hicimos o hablamos, usá esa información. Usá tools cuando haga falta. No inventes datos. Responde en español.",
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools: langChainTools,
    prompt,
  });

  const callbackHandler = new ThinkingCallbackHandler();
  const executor = new AgentExecutor({
    agent,
    tools: langChainTools,
    memory: crearMemoria(),
    verbose: true,
    callbacks: [callbackHandler],
  });

  return executor;
}
