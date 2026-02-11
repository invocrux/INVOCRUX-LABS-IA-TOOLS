import "dotenv/config";
import { ChatOpenAI, ClientOptions } from "@langchain/openai";

const config: ClientOptions = {
  baseURL: "http://127.0.0.1:1234/v1",
};

export const llm = new ChatOpenAI({
  model: "qwen/qwen2.5-coder-14b",
  temperature: 0,
  apiKey: "",
  configuration: config,
});
