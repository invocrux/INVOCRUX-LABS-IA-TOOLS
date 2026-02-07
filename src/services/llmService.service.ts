import { ILLMResponse, IMessagesInput, IToolCall } from "../interfaces/interface";
import { tools } from "../tools";

const LLM_URL = "http://127.0.0.1:1234/v1/chat/completions";
const LLM_MODEL = "meta-llama.llama-3.3-70b-instruct";

export async function consultarLLM(mensajes: IMessagesInput[]): Promise<ILLMResponse> {
    const respuesta = await fetch(LLM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: LLM_MODEL,
            messages: mensajes,
            tools: tools,
            tool_choice: "auto"
        }),
    });
    const data = (await respuesta.json()) as ILLMResponse;
    return data;
}
