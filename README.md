# INVOCRUX LABS - IA TOOLS

🤖 AI-powered inventory management system for learning **tools**, **agents**, and **RAG** with local LLM (Llama 3.3 70B).

## 🎯 Project Overview

This project is a **learning playground** for understanding how to build:
- ✨ **Tools**: Functions that AI models can invoke
- 🔄 **Multi-tool execution**: Chaining multiple tools without infinite loops
- 🏢 **Specialized Agents**: Different AI agents for different tasks
- 🧠 **RAG (Retrieval-Augmented Generation)**: Injecting external context into AI responses

## 🏗️ Architecture

TypeScript application implementing a multi-pass LLM agent pattern with tool calling:

1. **Initial LLM call** - Sends user message with tool definitions
2. **Tool execution** - Executes requested tools (CRUD operations)
3. **Loop detection** - Prevents infinite loops by detecting repeated tool calls
4. **Response generation** - LLM returns final natural language response


## 🚀 Running the Application

### Prerequisites

- **Node.js** with TypeScript support
- **Local LLM server** running at `http://127.0.0.1:1234/v1/chat/completions`
  - LM Studio with Llama 3.3 70B recommended
- **Supabase** account with credentials in `.env`

### Setup

```bash
# Install dependencies
npm install

# Create .env file with:
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key

# Compile TypeScript
npm run build

# Run the application
npm run dev
```

## 🛠️ Key Components

### Main Orchestrator (`index.ts`)

- **Multi-tool loop**: Executes multiple tools in sequence without arbitrary limits
- **Loop detection**: Compares current tool with last executed to prevent infinite loops
- **Clean flow**: While loop continues until LLM responds without tool_calls

### Tool Registry (`toolRegistry.ts`)

Dynamic mapping of tool names to functions - avoids hardcoded conditionals:

```typescript
const toolRegistry = {
  listar_productos: listarProducto,
  buscar_producto: buscarProducto,
  crear_producto: crearProducto,
  actualizar_producto: actualizarProducto,
  eliminar_producto: eliminarProducto,
};
```

### Tool Definitions (`definitions.ts`)

Follows OpenAI tool calling format with proper parameter definitions.

## 📊 Database

**Table**: `inventario`

**Columns**:
- `id` - Product ID
- `producto` - Product name
- `cantidad` - Stock quantity
- `precio` - Price
- `created_at` - Creation timestamp

## 🎓 Learning Roadmap

### Level 1 ✅ (Complete)
- [x] Basic tool calling with local LLM
- [x] CRUD operations
- [x] Multi-tool execution (fixed infinite loops)
- [x] Duplicate product validation

### Level 2 🚧 (In Progress)
- [x] Agents with conditional logic
- [ ] RAG (Retrieval-Augmented Generation)
- [ ] Specialized agents (search, update, reports)

## 💻 Code Conventions

- **Language**: Spanish variable names and comments
- **Typing**: TypeScript with strict mode
- **Patterns**: Functional architecture with registry pattern
- **Modules**: ES6 `import`/`export`
- **Error handling**: Async/await with proper error messages

## 📝 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Invocrux** - Learning AI Tools, Agents & RAG

---

**Last Updated**: February 2026
