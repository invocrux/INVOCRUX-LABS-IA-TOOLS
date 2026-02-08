import {
  ILLMResponse,
  IMessagesInput,
  IToolCall,
} from "../interfaces/interface";
import { SYSTEM_PROMPT_INITIAL } from "../prompts/systemPrompt";
import { tools } from "../tools";

const LLM_URL = "http://127.0.0.1:1234/v1/chat/completions";
const LLM_MODEL = "meta-llama.llama-3.3-70b-instruct";

export async function consultarLLM(
  mensajes: IMessagesInput[],
  toolsEspecificas: IToolCall[] | null = tools,
): Promise<ILLMResponse> {
  const body: any = {
    model: LLM_MODEL,
    messages: mensajes,
  };

  if (toolsEspecificas && toolsEspecificas.length > 0) {
    body.tools = toolsEspecificas;
    body.tool_choice = "auto";
    body.system = SYSTEM_PROMPT_INITIAL;
  }
  const respuesta = await fetch(LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await respuesta.json()) as ILLMResponse;
}
