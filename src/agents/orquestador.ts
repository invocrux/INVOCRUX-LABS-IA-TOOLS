import {
  IMessagesInput,
  IMetadataAgente,
  IToolCall,
} from "../interfaces/interface";
import { consultarLLM } from "../services/llmService.service";
import { tools } from "../tools";
import { ejecutarTool } from "../tools/toolRegistry";
import { agentesDisponibles } from "./agentRegistry";
import { detectarIntenciones } from "./detectarIntenciones";

function detectarAgente(nombre: string) {
  return agentesDisponibles.find((agent) => agent.nombre === nombre);
}

function filtrarToolsPorAgente(nombresTools: string[]): IToolCall[] {
  return tools.filter((tool) => nombresTools.includes(tool.function.name));
}

async function procesarAgente(
  mensaje: string,
  metadata: IMetadataAgente,
): Promise<string> {
  const toolsDelAgente = filtrarToolsPorAgente(metadata.tools);
  
  const mensajes: IMessagesInput[] = [
    { role: "system", content: metadata.systemPrompt },
    { role: "user", content: mensaje },
  ];

  let respuesta = await consultarLLM(mensajes, toolsDelAgente);

  let ultimaToolEjecutada: string | null = null;
  let toolCalls = respuesta.choices[0].message.tool_calls || [];

  while (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      const toolActual = JSON.stringify({
        nombre: toolCall.function.name,
        args: toolCall.function.arguments,
      });

      if (toolActual === ultimaToolEjecutada) {
        return "Operación completada.";
      }

      ultimaToolEjecutada = toolActual;

      const args = JSON.parse(toolCall.function.arguments);
      const resultadoTool = await ejecutarTool(toolCall.function.name, args);
      
      console.log(`📦 Tool ejecutada: ${toolCall.function.name}`, resultadoTool);

      mensajes.push({
        role: "assistant",
        content: JSON.stringify(toolCall),
        tool_calls: toolCalls,
      });

      mensajes.push({
        role: "user",
        content: `Resultado de ${toolCall.function.name}: ${JSON.stringify(resultadoTool)}`,
      });

      respuesta = await consultarLLM(mensajes, toolsDelAgente);
      
      console.log("🔄 Siguiente respuesta:", JSON.stringify(respuesta.choices[0].message, null, 2));
      
      toolCalls = respuesta.choices[0].message.tool_calls || [];
    }
  }
  return respuesta.choices[0].message.content || "Sin respuesta";
}

export async function orquestador(mensaje: string): Promise<string> {
  const agentesDetectados = await detectarIntenciones(mensaje);
  let respuestaFinal = "";
  
  for (const nombreAgente of agentesDetectados) {
    const metadata: IMetadataAgente | undefined= detectarAgente(nombreAgente);

    if (!metadata) {
      respuestaFinal += `Agente ${nombreAgente} no encontrado.\n`;
      continue;
    }

    const respuestaAgente = await procesarAgente(mensaje, metadata);
    respuestaFinal += `[${nombreAgente}] ${respuestaAgente}\n`;
  }
  return respuestaFinal;
}
