import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { Serialized } from "@langchain/core/load/serializable";
import toolDefinitions from "../tools/definitions";
import * as fs from "fs";
import * as path from "path";

const LOG_FILE = path.join(process.cwd(), "agent.log");
function writeLog(message: string): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine, "utf-8");
}

export class ThinkingCallbackHandler extends BaseCallbackHandler {
  name = "thinking_handler";

  constructor() {
    super();
    fs.writeFileSync(LOG_FILE, `=== Sesión iniciada: ${new Date().toISOString()} ===\n\n`, "utf-8");
  }

  handleToolStart(
    tool: Serialized,
    input: string,
    _runId: string,
    _parentRunId?: string,
    _tags?: string[],
    _metadata?: Record<string, unknown>,
    runName?: string
  ): void {
    const toolName = runName || tool.id?.[tool.id.length - 1] || "unknown";
    
    writeLog(`[TOOL_START] Herramienta: ${toolName}`);
    let parsedInput: any;
    try {
      parsedInput = JSON.parse(input);
    } catch {
      parsedInput = input;
    }
    
    const descripcion = this.crearDescripcionDinamica(toolName, parsedInput);
    writeLog(`💭 ${descripcion}`);
    writeLog(`📋 Input completo: ${JSON.stringify(parsedInput, null, 2)}`);
  }

  handleToolEnd(output: string): void {
    writeLog(`[TOOL_END] ✅ Herramienta completada`);
    writeLog(`📦 Output completo: ${output}`);
    writeLog(`---`);
  }

  handleChainEnd(outputs: Record<string, unknown>): void {
    writeLog(`[CHAIN_END] 📝 Proceso finalizado`);
    if (outputs.output) {
      writeLog(`🤖 Respuesta final: ${outputs.output}`);
    }
    writeLog(`\n========================================\n`);
  }

  handleToolError(error: Error): void {
    writeLog(`[ERROR] ❌ Error en herramienta: ${error.message}`);
    writeLog(`Stack: ${error.stack}`);
  }

  private crearDescripcionDinamica(
    toolName: string,
    toolInput: any
  ): string {
    const toolDefinition = toolDefinitions.find(
      (tool) => tool.function.name === toolName
    );

    if (!toolDefinition) {
      return `Usando herramienta: ${toolName} con argumentos: ${JSON.stringify(toolInput)}`;
    }

    const descripcionBase = toolDefinition.function.description;
    const argsStr = JSON.stringify(toolInput);

    return `${descripcionBase} (argumentos: ${argsStr})`;
  }
}
