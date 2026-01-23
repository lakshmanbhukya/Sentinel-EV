# Backend Architecture Rules

## 🚀 Framework Rules

### Fastify (MANDATORY)
- **MUST** use Fastify as the HTTP server framework
- **FORBIDDEN**: Express.js, NestJS (Express adapter), Koa, Hapi, or any other backend framework
- Use Fastify's plugin-based architecture (`fastify-plugin`) for modularity
- All routes **MUST** be registered via route plugins, not inline routes

### Fastify Native Features (REQUIRED)
- JSON Schema validation for all routes
- Built-in logging (Pino) - no external loggers
- Fastify hooks: `onRequest`, `preHandler`, `onResponse`, `onSend`
- Native serialization and validation

---

## 📘 TypeScript Rules

### Strict Typing (MANDATORY)
- **TypeScript only** - no JavaScript files allowed
- `"strict": true` in `tsconfig.json`
- Explicit return types on all functions
- No `any` types (use `unknown` if necessary)
- Enable: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`

---

## 🏗️ Layered Architecture

### Folder Structure (ENFORCED)
```
src/
├── routes/          # HTTP route definitions (thin layer)
├── controllers/     # Request/response handling
├── services/        # Business logic (core application logic)
├── ai/              # AI service abstraction layer (Groq only)
├── schemas/         # Fastify JSON schemas
├── plugins/         # Fastify plugins
├── utils/           # Shared utilities
├── types/           # TypeScript type definitions
├── config/          # Configuration and env validation
└── app.ts           # Fastify app initialization
```

### Layer Responsibilities
- **Routes**: Register endpoints, attach schemas, delegate to controllers
- **Controllers**: Parse requests, call services, format responses
- **Services**: Business logic, data processing, external API calls
- **AI Layer**: Groq AI abstraction (stateless, reusable)
- **Schemas**: JSON Schema definitions for validation
- **Plugins**: Reusable Fastify plugins (auth, logging, etc.)

### Rules
- ❌ **NO** business logic inside route definitions
- ❌ **NO** direct database calls in controllers
- ❌ **NO** AI SDK usage outside the `ai/` layer
- ✅ Controllers call services, services contain logic

---

## 🔒 Validation & Security

### Request/Response Validation (MANDATORY)
- **MUST** use Fastify JSON Schema for all routes
- **FORBIDDEN**: Zod, Joi, Yup, class-validator (unless absolutely required)
- Define schemas in `schemas/` directory
- Attach schemas to routes via `schema` property

### Security Plugins (REQUIRED)
```typescript
// MUST enable these plugins
- @fastify/helmet       // Security headers
- @fastify/rate-limit   // Rate limiting
- @fastify/cors         // CORS (configurable per environment)
```

### Environment Variables
- **MUST** validate all environment variables at startup
- Use a dedicated config module (`config/env.ts`)
- Fail fast if required variables are missing
- Never expose secrets in logs or error messages

---

## 🤖 AI Services Rules (STRICT)

### Groq AI Only (MANDATORY)
- **ALL** AI features **MUST** use Groq AI only
- **FORBIDDEN**: OpenAI, Gemini, Claude, Anthropic, local LLMs, Hugging Face, Ollama, or any other AI provider

### AI Abstraction Layer (REQUIRED)
- All AI interactions **MUST** be abstracted in `ai/` service layer
- Use Groq's official SDK (`groq-sdk`) or REST APIs
- AI services **MUST** be stateless (no local model storage)
- ❌ **NEVER** embed AI logic directly in routes or controllers

### AI Service Structure
```
src/ai/
├── groq.service.ts      # Groq client wrapper
├── chat.service.ts      # Chat completion logic
├── types.ts             # AI-specific types
└── prompts.ts           # Prompt templates
```

---

## ⚡ Performance & Scalability

### Stateless Backend (MANDATORY)
- Backend **MUST** be stateless (no in-memory sessions)
- Use external state stores (Redis, PostgreSQL, etc.)
- Horizontal scaling must be possible without code changes

### Async/Await (REQUIRED)
- Use `async/await` everywhere
- ❌ **NO** callbacks or Promise chains
- ❌ **NO** blocking operations on the event loop
- ❌ **NO** synchronous filesystem operations (`fs.readFileSync`, etc.)

### Caching (OPTIONAL)
- If caching is used, it **MUST** be external (Redis, Memcached)
- ❌ **NO** in-memory caching (breaks statelessness)

---

## 🚨 Error Handling

### Centralized Error Handler (REQUIRED)
- Use Fastify's `setErrorHandler` for all errors
- Standardize error response format across the application
- ❌ **NEVER** expose stack traces in production
- Log errors with Pino (Fastify's built-in logger)

### Error Response Format
```typescript
{
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
}
```

---

## ❌ Forbidden Practices

### Strictly Prohibited
- ❌ Express middleware or Express-based frameworks
- ❌ Local AI/ML models (TensorFlow, PyTorch, ONNX, etc.)
- ❌ Synchronous filesystem operations
- ❌ CPU-heavy operations on the event loop
- ❌ Mixing controller and service logic
- ❌ Direct AI SDK usage inside routes or controllers
- ❌ Business logic in route definitions
- ❌ `any` types in TypeScript
- ❌ Exposing internal errors to clients

---

## ✅ Best Practices

### Code Quality
- Use ESLint + Prettier
- Write unit tests for services
- Use dependency injection where appropriate
- Keep functions small and focused
- Document complex logic with comments

### Logging
- Use Fastify's Pino logger
- Log at appropriate levels (info, warn, error)
- Include request IDs for traceability
- Never log sensitive data (passwords, tokens, etc.)

### Configuration
- Use environment-specific configs (dev, staging, prod)
- Validate configuration at startup
- Use `.env` files for local development
- Use secrets management in production (AWS Secrets Manager, Vault, etc.)
