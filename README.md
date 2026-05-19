# AXM Project Manager

Gestão de projetos com fluxo de fases, documentos e comentários.

## Pré-requisitos

- **Node.js** 20+
- **Docker** (para PostgreSQL local)
- **npm**

## Rodar tudo com um comando

Na raiz do projeto:

```bash
npm install
npm run dev
```

Isso automaticamente:

1. Sobe o **PostgreSQL** via Docker
2. Cria `server/.env` e `.env.local` se não existirem
3. Aplica schema e **seed** no banco
4. Inicia **API** (porta 3001) e **front** (porta 5173)

Acesse: **http://localhost:5173**

O front chama a API via proxy `/api` → `http://localhost:3001`.

## Estrutura

```
├── src/           # Front React + Vite
├── server/        # API Node + Fastify + Prisma
├── scripts/dev.mjs
└── docker-compose.yml
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Postgres + API + front |
| `npm run dev:web` | Só front (precisa API rodando) |
| `npm run dev:api` | Só API (precisa Postgres) |
| `npm run db:up` | Só PostgreSQL |
| `npm run db:setup` | Schema + seed |

## Variáveis de ambiente

**Front** (`.env.local`):

```
VITE_API_URL=/api
```

**API** (`server/.env`):

```
PORT=3001
DATABASE_URL=postgresql://axm:axm@localhost:5432/axm
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
API_PUBLIC_URL=/api
```

## Mock (sem API)

```
VITE_USE_MOCK=true
```

## Deploy (Render)

- **Web Service:** pasta `server`, build `npm install && npm run db:setup`, start `npm start`
- **Static Site:** `npm run build`, publish `dist`
- **PostgreSQL:** Render Postgres, `DATABASE_URL` na API
# render-axm
