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

function convertirParametrosAZod(parameters: IParameters): any {
  const properties = parameters.properties || {};
  const required = parameters.required || [];
  const schemaObj: Record<string, any> = {};

  for (const [key, prop] of Object.entries(properties)) {
    const propDef = prop as any;
    const propType = propDef.type;

    let zodType: any;
    
    if (propType === "string") {
      // Si tiene enum, usar z.enum()
      if (propDef.enum && Array.isArray(propDef.enum)) {
        zodType = z.enum(propDef.enum as [string, ...string[]]);
      } else {
        zodType = z.string();
      }
    } else if (propType === "number") {
      zodType = z.number();
    } else if (propType === "boolean") {
      zodType = z.boolean();
    } else if (propType === "array") {
      // Manejar arrays - ver el tipo de items
      const itemsType = propDef.items?.type || "string";
      if (itemsType === "string") {
        zodType = z.array(z.string());
      } else if (itemsType === "number") {
        zodType = z.array(z.number());
      } else {
        zodType = z.array(z.any());
      }
    } else {
      zodType = z.any();
    }

    if (propDef.description) {
      zodType = zodType.describe(propDef.description);
    }

    if (!required.includes(key)) {
      zodType = zodType.optional();
    }

    schemaObj[key] = zodType;
  }

  return z.object(schemaObj);
}

export const langChainTools = tools.map((toolDef) => {
  const toolSchema: any = convertirParametrosAZod(toolDef.function.parameters);

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
      schema: toolSchema,
    },
  ) as any;
});
