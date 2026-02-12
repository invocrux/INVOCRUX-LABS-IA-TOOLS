# INVOCRUX LABS - IA TOOLS

🤖 AI-powered inventory management system for fruit stores ("frutería") using **LangChain 1.0** agents with multi-tool execution and conversation memory.

## 🎯 Project Overview

This project is a **learning playground** for understanding how to build:
- ✨ **Tools**: Functions that AI models can invoke for inventory management
- 🔄 **Multi-tool execution**: Execute multiple tools in parallel with LangChain agents
- 🏢 **Specialized Agents**: AgentExecutor with dynamic tool registry
- 💾 **Conversation Memory**: Persistent chat history in Supabase
- 🌐 **REST API**: Express backend with Swagger documentation

## 🏗️ Architecture

Modern TypeScript backend with LangChain 1.0 agent pattern:

1. **Express Server** - REST API listening on port 3000
2. **LangChain Agent** - ChatOpenAI model with multi-tool calling capability
3. **Tool Execution** - Dynamic registry executing CRUD operations on Supabase
4. **Memory Persistence** - Chat history stored in `agent_sessions` table
5. **Error Handling** - Centralized middleware with Zod validation


## 🚀 Running the Application

### Prerequisites

- **Node.js 18+** with TypeScript support
- **Local LLM server** running at `http://127.0.0.1:1234/v1` (LM Studio)
  - Qwen 2.5 72B Instruct recommended
- **Supabase** project with database credentials

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
EOF

# 3. Start development server
npm run dev
# Server runs at http://localhost:3000
# API Docs at http://localhost:3000/api-docs
```

### Production Build

```bash
# Compile TypeScript to JavaScript
npm run build

# Run compiled server
npm start
```

### Testing the API

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Chat Endpoint:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "mensaje": "Buscá la manzana"
  }'
```

Visit `http://localhost:3000/api-docs` to test endpoints interactively with Swagger UI.

## 🛠️ Project Structure

```
src/
├── api/
│   ├── controllers/
│   │   ├── chatController.ts       # Request handler for /api/chat
│   │   └── health.controller.ts    # Health check endpoint
│   ├── middleware/
│   │   └── errorHandler.ts         # Centralized error handling
│   └── routes/
│       └── chat.routes.ts          # Express routes with Swagger docs
├── langchain/
│   ├── agente.ts                   # AgentExecutor factory
│   ├── llmService.ts               # ChatOpenAI singleton
│   ├── memory.ts                   # BufferMemory configuration
│   ├── toolDefinitions.ts          # OpenAI→Zod schema converter
│   └── callbacks.ts                # Logging & humanized thinking
├── repositories/
│   └── sessionRepository.ts        # Database operations for chat history
├── services/
│   └── supabase.ts                 # Supabase client singleton
├── functions/
│   ├── buscarProducto.ts           # Search with accent normalization
│   ├── crearProducto.ts            # Create product
│   ├── actualizarProducto.ts       # Update product
│   └── eliminarProducto.ts         # Delete product
├── types/
│   └── api.types.ts                # TypeScript interfaces & Zod schemas
├── config/
│   └── swagger.ts                  # Swagger/OpenAPI configuration
└── server.ts                       # Express app entry point
```

## 🔑 Key Features

### REST API (`server.ts` + `express`)
- Express server with JSON parsing middleware
- Swagger UI documentation at `/api-docs`
- Centralized error handling middleware
- Port: 3000

### LangChain Agent Integration (`langchain/`)
- **AgentExecutor**: Multi-tool capable agent
- **BufferMemory**: Conversation history management
- **Tool Registry**: Dynamic tool mapping (no hardcoded conditionals)
- **Parallel Tool Execution**: Multiple tools can execute simultaneously

### Chat Service (`services/chatService.ts`)
- **Orchestration**: Loads chat history, creates agent, invokes with message
- **Performance**: Parallel operations with `Promise.all()`
- **Persistence**: Fire-and-forget session saving (non-blocking)
- **Metrics**: Tracks execution time and tools used

### Database Persistence (`repositories/sessionRepository.ts`)
- **Load**: Retrieves chat history from `agent_sessions` table
- **Save**: Upserts new messages (create if new user, update if existing)
- **Format**: Stores messages as JSON array with role/content structure

## 📊 Database Schema

### Products Table: `inventario`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `producto` | TEXT | Product name (lowercase, no accents) |
| `cantidad` | INTEGER | Stock quantity |
| `precio` | DECIMAL | Product price |
| `created_at` | TIMESTAMP | Creation timestamp |

### Chat History Table: `agent_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | User identifier |
| `chat_history` | JSONB | Array of messages (role + content) |
| `created_at` | TIMESTAMP | Session creation |
| `updated_at` | TIMESTAMP | Last update |

**Indexes**:
- `user_id` - For fast session lookups

## 🎓 Learning Roadmap

### Phase 1 ✅ (Complete)
- [x] LangChain 1.0 agent setup with multi-tool execution
- [x] CRUD operations on Supabase inventory
- [x] Conversation memory with persistent chat history
- [x] REST API with Express
- [x] Error handling & validation with Zod
- [x] Swagger/OpenAPI documentation
- [x] Centralized middleware architecture

### Phase 2 🚧 (Planned)
- [x] RAG (Retrieval-Augmented Generation) for product knowledge
- [x] Advanced memory management (long-term vs short-term)
- [x] Multi-user session management
- [ ] Rate limiting & authentication
- [ ] Monitoring & analytics
- [ ] Production deployment (Docker, cloud)

## 💻 Code Conventions

- **Language**: Spanish variable names and comments throughout
- **Typing**: TypeScript with strict mode enabled
- **Architecture**: Controller → Service → Repository pattern
- **Validation**: Zod schemas for request validation
- **Error Handling**: 
  - Centralized middleware (no try-catch in controllers)
  - Typed error responses with error codes
  - Proper HTTP status codes
- **Naming**:
  - Variables/functions: camelCase
  - Database columns: snake_case
  - Interfaces: `I` prefix (e.g., `IChatRequest`)
- **Modules**: ES6 `import`/`export`
- **Scalability**: Dynamic registries over hardcoded conditionals

## 🔄 Request/Response Flow

```
User Request
    ↓
Express Router
    ↓
Controller (Zod validation)
    ↓
Service (business logic)
    ↓
LangChain Agent
    ├─ Load chat history (Repository)
    ├─ Create AgentExecutor
    ├─ Invoke with message
    └─ Extract tools & response
    ↓
Repository (save chat history)
    ↓
Response (JSON with metadata)
    ↓
Error Handler (if needed)
```

## 📚 API Documentation

### Endpoint: POST `/api/chat`

Send a message to the AI agent for inventory management.

**Request:**
```json
{
  "userId": "user_123",
  "mensaje": "¿Cuántas manzanas hay?"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "respuesta": "Hay 50 manzanas en el inventario",
    "toolsEjecutadas": ["buscarProducto"],
    "duracionMs": 1250,
    "timestamp": "2026-02-12T18:57:35.740Z"
  },
  "timestamp": "2026-02-12T18:57:35.740Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validación de datos fallida",
    "details": { ... }
  },
  "timestamp": "2026-02-12T18:57:35.740Z"
}
```

### Available Tools (Agent can use)

- **buscarProducto** - Search inventory by product name
- **crearProducto** - Create new product
- **actualizarProducto** - Update product details
- **eliminarProducto** - Delete product from inventory

## 🚀 Performance Notes

- **LangChain 1.0**: ~10x faster than 0.3.x
- **Parallel Operations**: Promise.all() for concurrent operations
- **Non-blocking Saves**: Fire-and-forget for session persistence
- **Response Time**: Typically 1-3 seconds with local LLM

## 📝 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Invocrux Labs** - Learning AI Tools, Agents & RAG

---

**Last Updated**: February 12, 2026
**Status**: ✅ Production Ready (Backend API)
