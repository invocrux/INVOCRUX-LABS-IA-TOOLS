import { IMessagesInput } from "../interfaces/interface";
import { consultarLLM } from "../services/llmService.service";
import { agentesDisponibles } from "./agentRegistry";

export async function detectarIntenciones(mensaje: string): Promise<string[]> {
  const listaAgentes: string = agentesDisponibles
    .map((agent) => `${agent.nombre}: ${agent.descripcion}`)
    .join("\n");
  const prompt =
    `Eres un clasificador de intenciones. tu trabajo es identificar  que agentes debe manejar la consulta del usuario.
    Los agentes disponibles son:
    ${listaAgentes}

    consulta del usuario: ${mensaje}

    responde UNICAMENTE con JSON en este formato: 
    { "agentes": ["nombreAgente1", "nombreAgente2"] }
    `.trim();

  const mensajes: IMessagesInput[] = [{ role: "user", content: prompt }];
  const respuesta = await consultarLLM(mensajes);

  const contenido = respuesta.choices[0].message.content;
  const resultado = JSON.parse(contenido);

  return resultado.agentes;
}
