# Roadmap de entregas — AXM Project Manager

Cronograma revisado com **front já feito**, **back-end mínimo viável (MVP)** e **infra (Docker / Render)**.

---

## Situação atual (front)

| Item do cronograma | Status | Observação |
|--------------------|--------|------------|
| Timeline de 9 fases | ✅ Feito | `PhaseTimeline` no detalhe do projeto |
| Modais padronizados | ✅ Feito | Avanço de fase, upload, notificações |
| Histórico de abas na URL | ✅ Feito | `?tab=docs\|comments\|reports` |
| Repositório / listagem de docs | ✅ Parcial | UI + mock; upload não persiste arquivo |
| Kanban por fase | ⚠️ Código pronto | `WorkflowBoard` — falta rota no menu |
| Checklist por fase | ❌ Pendente | Ainda não existe no front |
| Conectividade com API real | ❌ Pendente | `services/api.ts` usa mock |
| Perfis de acesso | ❌ Pendente | Sem login |
| Deploy preview | ❌ Pendente | Só build local |

---

## Fases do cronograma (melhoradas)

### Fase 2 — Gestão do ciclo de vida (visual + dados reais)

| Dia | Entrega | Front | Back-end MVP |
|-----|---------|-------|----------------|
| **D3** | Timeline de fases | Ajustes de copy por fase + destaque da fase ativa | `GET /projects/:id` com `phases[]` persistido |
| **D4** | Ações e Kanban | Rota `/fluxo` + menu; checklist simples por fase (checkbox local → API) | `PATCH /projects/:id/phases/:phase` (status, notas) |
| **D5** | Repositório inteligente | Upload com barra de progresso real; pastas por categoria/fase | `POST /projects/:id/documents` (multipart) + `GET` com metadados no Postgres |

### Fase 3 — Estabilidade e entrega (infra + demo)

| Dia | Entrega | Front | Back-end + Infra |
|-----|---------|-------|------------------|
| **D6** | Conectividade (wiring) | Trocar mock por `fetch` + `VITE_API_URL` | API Node + Postgres; `POST /projects/:id/advance-phase` com regra de negócio |
| **D6** | Perfis básicos | Tela de login; header com usuário | JWT + roles: `consultoria`, `cliente`, `investidor` (leitura) |
| **D7** | Polimento e deploy | Responsivo, empty states, link de demo | CI + **Render** (ou Docker Compose em VPS) |

---

## Back-end MVP — escopo mínimo viável

Objetivo: substituir `src/services/api.ts` (mock) sem over-engineering.

### Stack sugerida

- **Runtime:** Node 20 + **Fastify** ou **Express**
- **Banco:** PostgreSQL (Render PostgreSQL ou container Docker)
- **Arquivos:** pasta `uploads/` no disco (MVP) → depois S3/Cloudflare R2
- **ORM:** Prisma ou Drizzle (migrations simples)

### Endpoints (espelham o front atual)

```
GET    /health
GET    /projects
GET    /projects/:id
POST   /projects/:id/advance-phase

GET    /projects/:id/documents
GET    /documents                    # global (dashboard)
POST   /projects/:id/documents       # multipart upload

GET    /projects/:id/comments
POST   /projects/:id/comments

GET    /projects/:id/reports
PATCH  /reports/:id                  # draft | submitted | validated | rejected
```

### Regras de negócio (MVP)

1. **Avançar fase:** só se fase atual = `in_progress`; marca como `completed` e abre a próxima como `in_progress`.
2. **Comentários:** sempre vinculados a `projectId` + `phase`.
3. **Documentos:** metadados no banco + arquivo no disco; campos: categoria, fase, versão, `uploadedBy`.
4. **Auth (D6):** rotas protegidas exceto `/health`; cliente só vê projetos onde é `client`.

---

## Lista de funcionalidades (prioridade para esta semana)

### P0 — Demo com dados reais

- [ ] Criar pasta `server/` com API + Postgres
- [ ] Seed com os 4 projetos do mock
- [ ] Front: `api.ts` → `apiClient.ts` com `import.meta.env.VITE_API_URL`
- [ ] `advancePhase` persistindo no banco
- [ ] Comentários persistindo (não perder ao F5)

### P1 — Repositório utilizável

- [ ] Upload multipart com progresso (`onUploadProgress` / axios)
- [ ] Download / visualizar PDF (URL assinada ou estática)
- [ ] Filtros de documentos por fase e categoria (já na UI)

### P2 — Fluxo visual completo

- [ ] Menu **Fluxo** → Kanban (`WorkflowBoard`)
- [ ] Checklist por fase (3–5 itens fixos por fase, configurável depois)
- [ ] Relatório mensal: enviar / validar (botões já na UI → ligar API)

### P3 — Infra e deploy

- [ ] `.env.example` (front + back)
- [ ] `docker-compose.yml`: `api` + `postgres` (+ opcional `adminer`)
- [ ] Deploy **Render**: Static Site (front) + Web Service (API) + PostgreSQL
- [ ] GitHub Actions: `build` front + `test` API

---

## Deploy: Docker vs Render

### Opção A — Render (recomendado para demo rápida)

| Serviço | Tipo | O quê |
|---------|------|--------|
| `axm-web` | Static Site | `npm run build` → pasta `dist` |
| `axm-api` | Web Service | `server/` Node, porta `$PORT` |
| `axm-db` | PostgreSQL | Plano free ou starter |

Variáveis:

- Front (build): `VITE_API_URL=https://axm-api.onrender.com`
- API: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN=https://axm-web.onrender.com`

### Opção B — Docker Compose (local / VPS)

```yaml
# Visão geral (implementar em docker-compose.yml)
services:
  postgres:   # porta 5432
  api:        # porta 3001, depende de postgres
  web:        # nginx servindo dist OU vite preview em dev
```

Comandos típicos:

```bash
docker compose up -d postgres api
cd server && npm run migrate && npm run seed
npm run dev          # front apontando VITE_API_URL=http://localhost:3001
```

### Opção C — Híbrido

- Desenvolvimento: Docker local
- Demo cliente: Render (URL fixa, sem manter servidor)

---

## Mapa front ↔ back (wiring)

| Tela / hook | Mock atual | Endpoint futuro |
|-------------|------------|-----------------|
| `useProjects` | `getProjects` | `GET /projects` |
| `useProject` | `getProject` | `GET /projects/:id` |
| `useAdvancePhase` | `advancePhase` (não altera mock) | `POST /projects/:id/advance-phase` |
| `useDocuments` | filtro em array | `GET /projects/:id/documents` |
| `useAllDocuments` | todos mocks | `GET /documents` |
| `useComments` / `useAddComment` | array em memória | `GET` + `POST` comments |
| `useReports` | mockReports | `GET` + `PATCH` reports |
| `DocumentUpload` | toast fake | `POST` multipart |

---

## Mensagem resumida para alinhar com cliente (WhatsApp)

> Esta semana fechamos o **visual do fluxo** (timeline + kanban no menu) e a **API mínima** com Postgres: projetos, fases, documentos e comentários salvos de verdade. Subimos **preview no Render** (link do app + API). Na sequência entram login por perfil e validação de relatórios mensais.

---

## Próximo passo técnico imediato

1. Scaffold `server/` (Fastify + Prisma + Postgres).
2. `docker-compose.yml` + `.env.example`.
3. Refatorar `src/services/api.ts` para usar `VITE_API_URL` com fallback mock em dev.

*Documento alinhado ao mapa mental em `MAPA-MENTAL-FUNCIONALIDADES.md`.*
