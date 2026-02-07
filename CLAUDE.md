# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

AI-powered inventory management system for learning tools, agents, and RAG. Uses a local LLM (Llama 3.3 70B) with OpenAI-compatible tool calling to manage product inventory from Supabase.

## Running the Application

```bash
npm install
npm run build
npm run dev
```

**Prerequisites:**
- Local LLM server running at `http://127.0.0.1:1234/v1/chat/completions` (LM Studio with Llama 3.3 70B)
- Supabase credentials in `.env` file (`SUPABASE_URL`, `SUPABASE_KEY`)
- Node.js with TypeScript support

## Architecture

TypeScript application implementing a multi-pass LLM agent pattern with tool calling:

1. **Initial LLM call** - Sends user message with tool definitions, LLM decides which tools to use
2. **Tool execution** - Executes requested tools (CRUD operations on `inventario` table)
3. **Loop detection** - Compares current tool with last executed to prevent infinite loops
4. **Continues** - If LLM requests more tools, repeats; otherwise returns final response

### Project Structure

```
src/
├── index.ts                           (Main orchestrator with multi-tool support)
├── services/
│   ├── supabase.ts                   (Supabase client)
│   └── llmService.service.ts         (LLM API calls, centralized)
├── functions/
│   ├── listarProducto.ts             (List all products)
│   ├── buscarProducto.ts             (Search products)
│   ├── crearProducto.ts              (Create product with validation)
│   ├── actualizarProducto.ts         (Update product)
│   ├── eliminarProducto.ts           (Delete product)
│   └── index.ts
├── tools/
│   ├── definitions.ts                (Tool definitions for LLM - OpenAI format)
│   ├── toolRegistry.ts               (Dynamic tool function mapping)
│   └── index.ts
├── interfaces/
│   └── interface.ts                  (TypeScript types)
├── prompts/
│   └── systemPrompt.ts               (System prompts)
└── tsconfig.json
```

### Key Components

- `procesarMensajeUsuario()` - Main entry point, orchestrates multi-tool flow
- `toolRegistry` - Dynamic mapping of tool names to functions (avoids hardcoded conditionals)
- `llmService.ts` - Centralized LLM API communication
- **Tools**: `listar_productos`, `buscar_producto`, `crear_producto`, `actualizar_producto`, `eliminar_producto`

### Database

- **Table**: `inventario`
- **Operations**: Full CRUD support
- **Main columns**: `id`, `producto` (name), `cantidad` (quantity), `precio` (price)

## Code Conventions

- Spanish variable names and comments throughout
- TypeScript with strict typing
- Functional architecture with tool registry pattern
- ES6 modules (`import`/`export`)
- Multi-pass LLM pattern with intelligent loop detection

## Learning Goals

- [x] Tool calling with local LLM
- [x] Multi-tool execution without arbitrary limits
- [x] Loop detection by comparing tool identity
- [x] Duplicate validation in CRUD operations
- [ ] Agents with conditional logic
- [ ] RAG (Retrieval-Augmented Generation)
- [ ] Specialized agents
