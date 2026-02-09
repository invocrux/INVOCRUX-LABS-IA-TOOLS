import "dotenv/config";
import { ChatOpenAI, ClientOptions } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { langChainTools } from "./toolDefinitions";

const config: ClientOptions = {
  baseURL: "http://127.0.0.1:1234/v1",
};

async function main() {
  const llm = new ChatOpenAI({
    model: "qwen2.5-72b-instruct",
    temperature: 0,
    apiKey: "",
    configuration: config,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Sos un asistente de inventario de frutería. Usá tools cuando haga falta. No inventes datos. Responde en español.",
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools: langChainTools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools: langChainTools,
    verbose: true,
  });

  const result = await executor.invoke({
    input:
      "Listame todos los productos y crea uno nuevo llamado Kiwi con 10 unidades a $3000",
  });

  console.log("\n🤖 RESULTADO:\n", result.output);
}

main().catch(console.error);
