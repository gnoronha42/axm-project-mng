# Roteiro de deploy em produção — AXM Project Manager

Passo a passo para publicar **front (Vite)** + **API (Node)** + **PostgreSQL** + **armazenamento de arquivos**.

---

## Visão da arquitetura em produção

```
[Usuário]
    ↓ HTTPS
[Front estático]  →  Vercel / Netlify / Cloudflare Pages
    ↓ VITE_API_URL
[API Fastify]     →  Render Web Service / Railway / VPS + Docker
    ↓
[PostgreSQL]      →  Render Postgres / Supabase / RDS
[Uploads]         →  Disco persistente (Render) ou S3/R2 (recomendado depois)
```

---

## Pré-requisitos

- Repositório no GitHub (ou GitLab)
- Conta **Render** (ou Railway / VPS)
- Domínio opcional (ex.: `app.axm.com.br`, `api.axm.com.br`)

---

## Fase 1 — Banco de dados (PostgreSQL)

### Opção A: Render PostgreSQL

1. Criar **PostgreSQL** no dashboard Render.
2. Copiar **Internal Database URL** (para a API no mesmo Render) ou **External** (dev local).
3. Guardar como `DATABASE_URL`.

### Opção B: Supabase / Neon

1. Criar projeto e connection string `postgresql://...`.
2. Usar como `DATABASE_URL` na API.

### Aplicar schema e seed (uma vez)

No seu PC (com `DATABASE_URL` de produção):

```bash
cd server
export DATABASE_URL="postgresql://..."
npm run db:push
npm run db:seed
```

> Em produção contínua, prefira depois `prisma migrate deploy` em vez de `db push`.

---

## Fase 2 — API (back-end)

### Variáveis de ambiente (produção)

| Variável | Exemplo | Obrigatório |
|----------|---------|-------------|
| `PORT` | `10000` (Render define `$PORT`) | Sim |
| `DATABASE_URL` | `postgresql://...` | Sim |
| `CORS_ORIGIN` | `https://app.seudominio.com` | Sim |
| `JWT_SECRET` | string longa aleatória | Futuro (auth) |
| `UPLOAD_DIR` | `/var/data/uploads` | Sim |
| `API_PUBLIC_URL` | `https://api.seudominio.com` | Sim (URLs de download) |

### Render — Web Service

1. **New → Web Service** → conectar repositório.
2. **Root Directory:** `server`
3. **Build Command:** `npm install && npx prisma generate && npx prisma db push`
4. **Start Command:** `npm start`
5. Adicionar variáveis acima.
6. **Disk** (opcional no Render): montar volume em `/var/data` e `UPLOAD_DIR=/var/data/uploads`.
7. Deploy → anotar URL: `https://axm-api.onrender.com`

### Docker na VPS (alternativa)

```dockerfile
# server/Dockerfile (criar se usar VPS)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

`docker-compose.prod.yml`: `api` + `postgres` + volume `uploads`.

---

## Fase 3 — Front-end (estático)

### Build local de teste

```bash
# Na raiz
export VITE_API_URL=https://axm-api.onrender.com
npm run build
npm run preview
```

### Render — Static Site

1. **New → Static Site** → mesmo repositório.
2. **Root Directory:** `.` (raiz)
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. **Environment:** `VITE_API_URL=https://axm-api.onrender.com`
6. Deploy → URL: `https://axm-web.onrender.com`

### Vercel / Netlify

- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://sua-api.com`

### CORS

Na API, `CORS_ORIGIN` deve ser **exatamente** a URL do front (com `https`, sem barra final):

```
CORS_ORIGIN=https://axm-web.onrender.com
```

Várias origens (preview + prod):

```
CORS_ORIGIN=https://axm-web.onrender.com,https://staging.axm.com
```

---

## Fase 4 — Checklist antes de ir ao ar

- [ ] `npm run build` passa sem erro
- [ ] API `/health` retorna `{ "ok": true }`
- [ ] Login na URL do front lista projetos (dados do seed ou reais)
- [ ] Avançar fase persiste após F5
- [ ] Upload de documento funciona e aparece na lista
- [ ] Comentário persiste após F5
- [ ] `CORS_ORIGIN` correto (sem erro no console do navegador)
- [ ] `API_PUBLIC_URL` aponta para a API pública (links de arquivo)
- [ ] HTTPS em front e API
- [ ] Backup do Postgres configurado (Render faz snapshot no plano pago)

---

## Fase 5 — Domínio customizado (opcional)

1. **Front:** CNAME `app` → host do Static Site (Render/Vercel).
2. **API:** CNAME `api` → host do Web Service.
3. Atualizar `VITE_API_URL=https://api.seudominio.com` e rebuild do front.
4. Atualizar `CORS_ORIGIN` e `API_PUBLIC_URL` na API.

---

## Fase 6 — CI/CD (recomendado)

GitHub Actions (`.github/workflows/deploy.yml`):

1. **on push main**
2. Job `build-front`: `npm ci && npm run build`
3. Job `build-api`: `cd server && npm ci && npx prisma generate`
4. Deploy automático via Render/GitHub integration (mais simples) ou SSH na VPS.

Render já faz deploy automático ao push se o serviço estiver ligado ao repo.

---

## Fase 7 — Pós-go-live (próximas melhorias)

| Prioridade | Item |
|------------|------|
| Alta | Autenticação (JWT) + perfis |
| Alta | Storage S3/R2 para uploads (escala) |
| Média | `prisma migrate` versionado |
| Média | Monitoramento (Sentry, Uptime Robot) |
| Baixa | CDN na frente do front |

---

## Resumo rápido (Render)

| Serviço | Tipo | Pasta | Comando build | Start / Publish |
|---------|------|-------|---------------|-----------------|
| axm-db | PostgreSQL | — | — | — |
| axm-api | Web Service | `server/` | `npm i && prisma generate && prisma db push` | `npm start` |
| axm-web | Static Site | `/` | `npm i && npm run build` | `dist` |

**Ordem sugerida:** Postgres → API (seed) → Front com `VITE_API_URL` → testar → domínio.

---

## Rollback

- **Front:** redeploy do deploy anterior no painel Render/Vercel.
- **API:** redeploy commit anterior; cuidado com `db push` destrutivo — preferir migrations.
- **Banco:** restore do snapshot Render.

---

*Documento complementar: [ROADMAP-ENTREGAS.md](./ROADMAP-ENTREGAS.md) e [MAPA-MENTAL-FUNCIONALIDADES.md](./MAPA-MENTAL-FUNCIONALIDADES.md).*
