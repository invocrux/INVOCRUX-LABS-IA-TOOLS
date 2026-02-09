import { tool } from "@langchain/core/tools";
import { tools } from "../tools";
import { ejecutarTool } from "../tools/toolRegistry";
import { z } from "zod";
import { IParameters } from "../interfaces/interface";

export const langChainTools = tools.map((toolDef) => {
    return tool(
        async (args: any) => {
            return await ejecutarTool(toolDef.function.name, args);
        },
        {
            name: toolDef.function.name,
            description: toolDef.function.description,
            schema: convertirParametrosAZod(toolDef.function.parameters),
        } as any
    );
});

function convertirParametrosAZod(parameters: IParameters): z.ZodType {
  const properties = parameters.properties || {};
  const required = parameters.required || [];
  const schemaObj: any = {};
  for (const [key, prop] of Object.entries(properties)) {
    let zodType: any;
    // Convertir según el type
    if ((prop as any).type === "string") {
      zodType = z.string();
    } else if ((prop as any).type === "number") {
      zodType = z.number();
    } else if ((prop as any).type === "boolean") {
      zodType = z.boolean();
    }
    // Agregar descripción
    if ((prop as any).description) {
      zodType = zodType.describe((prop as any).description);
    }
    // Si NO es required, hacerlo opcional
    if (!required.includes(key)) {
      zodType = zodType.optional();
    }
    schemaObj[key] = zodType;
  }
  return z.object(schemaObj);
}