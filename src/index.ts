import dotenv from "dotenv";
import { consultarLLM } from "./services/llmService.service";
import { ILLMResponse, IMessagesInput } from "./interfaces/interface";
import { ejecutarTool } from "./tools/toolRegistry";
dotenv.config();

async function procesarMensajeUsuario(mensajeUsuario: string): Promise<string> {
  const mensajes: IMessagesInput[] = [
    {
      role: "user",
      content: mensajeUsuario,
    },
  ];

  let ultimaToolEjecutada: string | null = null;

  while (true) {
    const respuesta: ILLMResponse = await consultarLLM(mensajes);
    const mensajeIA = respuesta.choices[0].message;

    console.log("📊 Respuesta LLM:", JSON.stringify(mensajeIA, null, 2));

    // Si NO hay tool_calls, el LLM terminó - devolver respuesta final
    if (!mensajeIA.tool_calls || mensajeIA.tool_calls.length === 0) {
      return mensajeIA.content || "No pude procesar tu solicitud.";
    }

    // Agregar respuesta del assistant al historial
    mensajes.push({
      role: "assistant",
      content: mensajeIA.content,
      tool_calls: mensajeIA.tool_calls,
    });

    // Ejecutar cada tool
    for (const toolCall of mensajeIA.tool_calls) {
      const toolActual = JSON.stringify({
        nombre: toolCall.function.name,
        args: toolCall.function.arguments,
      });

      // Detectar loop: ¿es igual a la anterior?
      if (toolActual === ultimaToolEjecutada) {
        console.log("🔄 Loop detectado, finalizando...");
        return "Operación completada.";
      }

      // Ejecutar la tool
      const args = JSON.parse(toolCall.function.arguments);
      const resultado = await ejecutarTool(toolCall.function.name, args);

      console.log(`📦 Tool ejecutada: ${toolCall.function.name}`, resultado);

      // Guardar como última ejecutada
      ultimaToolEjecutada = toolActual;

      // Agregar resultado al historial
      mensajes.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: resultado,
      });
    }

    console.log("📝 Continuando con siguiente ronda...");
  }
}

(async () => {
  const respuesta = await procesarMensajeUsuario(
    "Quiero ver todas las manzanas que tengo en stock y actualizar el precio de la Manzana Verde a $6000",
  );
  console.log("\n🤖 IA:", respuesta);
})();
