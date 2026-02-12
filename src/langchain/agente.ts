import { langChainTools } from "./toolDefinitions";
import { llm } from "./llmService";
import { BaseMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

export async function crearAgente() {
  const llmWithTools = llm.bindTools(langChainTools);

  // Construir un mapa para búsqueda rápida de tools
  const toolMap: { [key: string]: any } = {};
  langChainTools.forEach((tool) => {
    toolMap[tool.name] = tool;
  });

  return {
    async invoke(input: string, history: BaseMessage[] = []) {
      const messages: BaseMessage[] = [...history];
      messages.push(new HumanMessage(input));

      let response = await llmWithTools.invoke(messages);
      messages.push(response);

      // Loop para ejecutar herramientas si es necesario
      while (
        response.tool_calls &&
        Array.isArray(response.tool_calls) &&
        response.tool_calls.length > 0
      ) {
        // Ejecutar TODOS los tool_calls en paralelo (multi-tool support)
        const toolPromises = response.tool_calls.map(async (toolCall) => {
          const toolName = toolCall.name;
          const tool = toolMap[toolName];

          if (!tool) {
            console.warn(`Tool no encontrada: ${toolName}`);
            return null;
          }

          try {
            const toolResult = await tool.invoke(toolCall.args);
            return new ToolMessage({
              tool_call_id: (toolCall.id as string) || "unknown",
              content: String(toolResult),
              name: toolName,
            });
          } catch (error) {
            console.error(`Error ejecutando tool ${toolName}:`, error);
            return null;
          }
        });

        // Esperar a que todas las tools terminen
        const toolMessages = await Promise.all(toolPromises);

        // Agregar solo los mensajes exitosos
        toolMessages.forEach((msg) => {
          if (msg) messages.push(msg);
        });

        response = await llmWithTools.invoke(messages);
        messages.push(response);
      }

      // Retornar respuesta final
      const lastAiMessage = messages
        .slice()
        .reverse()
        .find((m) => m._getType && m._getType() === "ai");

      return {
        output: lastAiMessage?.content || "No se pudo generar respuesta",
        messages,
      };
    },
  };
}
