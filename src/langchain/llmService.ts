import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});
