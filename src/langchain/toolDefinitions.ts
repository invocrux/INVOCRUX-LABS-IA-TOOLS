import { tool } from "@langchain/core/tools";
import { tools } from "../tools";
import { ejecutarTool } from "../tools/toolRegistry";
import { z } from "zod";
import { IParameters } from "../interfaces/interface";
import { llm } from "./llmService";
import * as fs from "fs";
import * as path from "path";

const LOG_FILE = path.join(process.cwd(), "agent.log");

function writeLog(message: string): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine, "utf-8");
}

async function generarDescripcionHumana(
  toolName: string,
  input: any,
): Promise<string> {
  const prompt = `Describí en una oración corta y natural qué vas a hacer. 
                    Tool: ${toolName}
                    Argumentos: ${JSON.stringify(input)}
                    Respuesta (solo la oración, nada más):`;

  try {
    const respuesta = await llm.invoke(prompt);
    return respuesta.content as string;
  } catch (error) {
    return `Ejecutando ${toolName} con ${JSON.stringify(input)}`;
  }
}

export const langChainTools = tools.map((toolDef) => {
  return tool(
    async (args: any) => {
      const toolName = toolDef.function.name;
      const descripcionHumana = await generarDescripcionHumana(toolName, args);
      writeLog(`[TOOL_START] 💭 ${descripcionHumana}`);
      writeLog(`📋 (${toolName}: ${JSON.stringify(args)})`);
      const startTime = Date.now();

      try {
        const result = await ejecutarTool(toolName, args);
        const duration = Date.now() - startTime;
        writeLog(`[TOOL_END] ✅ Listo (${duration}ms)`);
        writeLog(`📦 Resultado: ${JSON.stringify(result)}`);
        writeLog(`---`);
        return result;
      } catch (error: any) {
        writeLog(`[TOOL_ERROR] ❌ ${toolName} falló: ${error.message}`);
        throw error;
      }
    },
    {
      name: toolDef.function.name,
      description: toolDef.function.description,
      schema: convertirParametrosAZod(toolDef.function.parameters),
    } as any,
  );
});

function convertirParametrosAZod(parameters: IParameters): z.ZodType {
  const properties = parameters.properties || {};
  const required = parameters.required || [];
  const schemaObj: any = {};
  for (const [key, prop] of Object.entries(properties)) {
    let zodType: any;
    if ((prop as any).type === "string") {
      zodType = z.string();
    } else if ((prop as any).type === "number") {
      zodType = z.number();
    } else if ((prop as any).type === "boolean") {
      zodType = z.boolean();
    }
    if ((prop as any).description) {
      zodType = zodType.describe((prop as any).description);
    }
    if (!required.includes(key)) {
      zodType = zodType.optional();
    }
    schemaObj[key] = zodType;
  }
  return z.object(schemaObj);
}
