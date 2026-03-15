# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Invocrux Labs IA Tools** is a Node.js/TypeScript backend that provides AI-powered tools for the Habitat project. It uses LangChain with OpenAI to create an AI assistant capable of querying and modifying beneficiary data in Supabase.

**Tech Stack:**
- Node.js with TypeScript
- Express.js for HTTP server
- LangChain for AI agent orchestration
- OpenAI API (via LangChain)
- Supabase for database operations
- Zod for schema validation

## Key Commands

```bash
# Development (port 3001)
npm run dev

# Build
npm run build

# Production
npm start
```

## Architecture

### Folder Structure

```
src/
├── server.ts                    # Express server (port 3001 local, dynamic in prod)
├── api/
│   ├── controllers/
│   │   ├── chatController.controller.ts   # Chat endpoint, receives context
│   │   └── sessionController.controller.ts # Session management (get/clear)
│   └── routes/
│       └── chat.routes.ts       # POST /api/chat, GET/DELETE /api/chat/session
├── services/
│   ├── chatService.service.ts   # Builds system prompt with context
│   └── supabase.ts              # Supabase client
├── repositories/
│   └── sessionRepository.ts     # Session persistence (upsert, get, clear)
├── langchain/
│   ├── agente.ts                # LangChain agent with tool execution loop
│   ├── llmService.ts            # OpenAI LLM configuration
│   └── toolDefinitions.ts       # Converts tool definitions to LangChain format
├── functions/                   # Tool implementations (one file per tool)
│   ├── index.ts                 # Barrel export
│   ├── helpers/
│   │   └── resolveProyectoId.ts # Resolves UUID or project name to valid UUID
│   ├── listarProyectos.ts
│   ├── listarFases.ts
│   ├── listarColumnas.ts
│   ├── buscarBeneficiariosPorCedula.ts
│   ├── buscarBeneficiariosPorNombre.ts
│   ├── obtenerFaseBeneficiario.ts
│   └── actualizarCampoBeneficiarios.ts
├── tools/
│   ├── definitions.ts           # Tool schemas (OpenAI function format)
│   └── toolRegistry.ts          # Maps tool names to functions
├── types/
│   └── api.types.ts             # IChatContext interface
└── interfaces/
    └── interface.ts             # IToolCall, IPropertyDefinition, etc.
```

## Available Tools

| Tool | Description |
|------|-------------|
| `listar_proyectos` | Lists all available projects (returns JSON with instruction to hide IDs from user) |
| `listar_fases` | Lists phases of a specific project |
| `listar_columnas` | Lists columns/fields of a project (global, not phase-specific) |
| `buscar_beneficiarios_por_cedula` | Exact search by cedula/ID |
| `buscar_beneficiarios_por_nombre` | Partial search by name, returns name + cedula for each match |
| `obtener_fase_beneficiario` | Gets the current phase of a specific beneficiary |
| `actualizar_campo_beneficiarios` | Bulk updates a field for multiple beneficiaries by cedula |

## Helper Functions

### `resolveProyectoId(proyectoIdOrName: string)`

Located in `src/functions/helpers/resolveProyectoId.ts`. All tools use this helper to:
1. Accept either a UUID or project name
2. Validate that the UUID exists in the database (prevents fake UUIDs)
3. Search by name if not a valid UUID

This prevents the LLM from inventing fake UUIDs or passing project names where IDs are expected.

## Adding New Tools

1. **Create function** in `src/functions/`:
```typescript
// src/functions/myNewTool.ts
import cliente from "../services/supabase";

async function myNewTool(param1: string, param2: string): Promise<string> {
  // Implementation
  return "Result message";
}

export default myNewTool;
```

2. **Export** in `src/functions/index.ts`:
```typescript
export { default as myNewTool } from "./myNewTool";
```

3. **Register** in `src/tools/toolRegistry.ts`:
```typescript
import myNewTool from "../functions/myNewTool";

const toolRegistry = {
  // ... existing tools
  my_new_tool: (args) => myNewTool(args.param1, args.param2),
};
```

4. **Define schema** in `src/tools/definitions.ts`:
```typescript
{
  type: "function",
  function: {
    name: "my_new_tool",
    description: "Clear description of when to use this tool",
    parameters: {
      type: "object",
      properties: {
        param1: {
          type: "string",
          description: "Description of param1",
        },
        param2: {
          type: "string",
          enum: ["option1", "option2"], // Optional: for enums
          description: "Description of param2",
        },
      },
      required: ["param1", "param2"],
    },
  },
},
```

## Tool Design Principles

- **Granular tools**: Create small, specific tools that the AI can chain together
- **Hide sensitive data**: IDs (proyecto_id, beneficiario_id) should be used internally but NEVER shown to users
- **Clear descriptions**: Tool descriptions tell the AI WHEN to use each tool
- **Separate by action**: One tool = one action (e.g., separate `buscar_por_cedula` and `buscar_por_nombre`)

## Context System

The frontend sends optional context with each message:

```typescript
interface IChatContext {
  proyectoId?: string;
  proyectoNombre?: string;
  fase?: string;
  userId?: string;
}
```

This context is injected into the system prompt so the AI knows which project the user is working on.

## LangChain Integration

### Tool Schema Conversion

`toolDefinitions.ts` converts OpenAI-format tool definitions to LangChain format using Zod:

- `string` → `z.string()`
- `string` with `enum` → `z.enum([...])`
- `array` → `z.array(z.string())`
- `number` → `z.number()`
- `boolean` → `z.boolean()`

### Agent Loop

The agent in `agente.ts`:
1. Receives user message + history + system prompt
2. Invokes LLM with tools
3. If LLM returns tool_calls, executes them in parallel
4. Adds tool results to messages
5. Invokes LLM again
6. Repeats until no more tool_calls
7. Returns final response

## Database Schema (Supabase)

Key tables used by tools:

- `proyecto` - Projects
- `beneficiario` - Beneficiaries (has `fase` column)
- `campo_personalizado` - Field definitions per project
- `valor_campo_beneficiario` - Field values per beneficiary

### Important Fields

- `campo_personalizado.es_identificador` - The cedula/ID field
- `campo_personalizado.nombre` - Field name (search for "nombre" to find name fields)
- `beneficiario.fase` - Current phase (FORMULACION, EJECUCION, FACTURACION, RECHAZADO)

## Environment Variables

```env
PORT=3001                    # Local development port
OPENAI_API_KEY=sk-...        # OpenAI API key
SUPABASE_URL=https://...     # Supabase project URL
SUPABASE_ANON_KEY=eyJ...     # Supabase anon key
```

## Deployment (Render)

Deployed as a Web Service on Render.

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node.js

## Integration with Habitat Frontend

The frontend (`habitat-v2`) communicates with this backend via:

### Chat Endpoint
- **POST `/api/chat`**
- **Request:** `{ message: string, context?: IChatContext }`
- **Response:** `{ response: string }`

### Session Management
- **GET `/api/chat/session?userId=xxx`** - Get existing session history
- **DELETE `/api/chat/session?userId=xxx`** - Clear session (New Chat)

### Realtime Updates

When the AI modifies data (via `actualizar_campo_beneficiarios`), the Habitat frontend detects changes using **Supabase Realtime** subscriptions on `valor_campo_beneficiario` table. Instead of auto-reloading (which caused infinite loops), the frontend shows a **visual indicator** on the refresh button, prompting the user to manually reload.

## Logging

Tool executions are logged to `agent.log` in the project root:

```
[timestamp] [TOOL_START] 💭 Human-readable description
[timestamp] 📋 (tool_name: {"args": "..."})
[timestamp] [TOOL_END] ✅ Listo (123ms)
[timestamp] 📦 Resultado: "..."
```
