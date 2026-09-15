# AXM Project Manager - Edição Suframa PD&I 🚀

O **AXM Project Manager** é um sistema de gestão do ciclo de vida de projetos evoluído para atuar como uma plataforma SaaS Inteligente voltada para consultorias e empresas beneficiárias do Polo Industrial de Manaus. O sistema gerencia projetos de Pesquisa, Desenvolvimento e Inovação (PD&I), audita regras fiscais da Suframa via IA e automatiza a consolidação do Relatório Demonstrativo (RD) para o SAGAT.

---

## 🏗️ Novas Funcionalidades e Engenharia de IA

### 1. Sistema Multi-Tenant e Perfis Avançados (Roles)
O fluxo de trabalho foi segmentado em permissões granulares para proteger o ecossistema:
*   **Consultoria (Admin):** Visão macro de conformidade, auditoria final e disparo de automações para o SAGAT.
*   **Empresa Beneficiária (Cliente):** Input de faturamento bruto/líquido, acompanhamento de obrigações e aprovação de relatórios.
*   **Instituto (Investidor/Prestador):** Lançamento de cronogramas técnicos, anexação de evidências e prestação de contas.

### 2. Módulo Fiscal Automatizado (Regras Suframa)
*   **Cálculo da Obrigação:** Dedução automatizada de impostos permitidos (IPI/ICMS) e aplicação da alíquota legal de 5% sobre o Faturamento Líquido de informática/automação.
*   **Validador de Repartição:** Alertas visuais e travas caso o investimento mínimo em ICTs credenciadas ou Programas Prioritários do CAPDA não atinja o percentual exigido por lei.

### 3. IA Cognitiva e RAG (Análise de Relatórios)
*   **Ingestão de Arquivos:** Ao realizar o upload do relatório técnico do Instituto no fluxo do projeto, a pipeline de IA processa o documento usando técnicas de **RAG (Retrieval-Augmented Generation)**.
*   **Extração de Entidades:** Identificação automática de despesas elegíveis, cruzamento de horas trabalhadas da equipe e validação de escopo tecnológico, sinalizando riscos potenciais de glosa antes da fiscalização oficial.

### 4. Automação SAGAT via MCP (Model Context Protocol)
*   O sistema utiliza o padrão **MCP** para estender as capacidades do modelo de linguagem (LLM) por meio de ferramentas externas seguras.
*   **Validador Fiscais:** Ferramentas MCP expõem a lógica das portarias da Suframa diretamente para a IA validar os balanços financeiros.
*   **Automação de Interface (RPA Baseado em Agentes):** Diante da ausência de uma API oficial da Suframa, um agente autônomo executa automação de interface de usuário (Headless Browser) para transcrever com precisão os dados consolidados do AXM para as telas internas do portal SAGAT.

---

## 🛠️ Stack Tecnológica Atualizada

*   **Frontend:** React + Vite + Ant Design, operando em container isolado.
*   **Backend API:** Node.js + Fastify + Prisma, evoluído para suporte a tenants, cálculos de alíquotas e orquestração de agentes.
*   **Banco de Dados:** PostgreSQL (Dockerizado) com suporte a múltiplos inquilinos (Tenant Isolation) e persistência de uploads em volume dedicado.
*   **AI Engine:** Integração com LLM + banco de dados vetorial para indexação de documentos de projetos.
*   **MCP Server:** Servidor Node.js/Python expondo ferramentas padronizadas para manipulação de rotinas regulatórias.

---

## 🛫 Como Executar o Ambiente de Inovação

O ambiente continua totalmente dockerizado para facilitar o deploy contínuo em sua VPS:

```bash
# 1. Clone o repositório
git clone https://github.com/gnoronha42/axm-project-mng.git
cd axm-project-mng

# 2. Configure as variáveis de ambiente de IA e credenciais do SAGAT (Sandbox)
cp .env.production.example .env

# 3. Suba o ecossistema (Web, API, DB)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Desenvolvimento local (front + API + Postgres)

```bash
npm install
npm run dev
```

Acesse: **http://localhost:5173** (API em `http://localhost:3001`, proxy `/api`).

### Credenciais Padrão de Homologação (Seed)
*   **URL de Acesso:** `http://76.13.234.226:8085` (ou domínio configurado)
*   **Admin da Consultoria:** `admin@axm.local` / `admin123`

---

## 🔒 Segurança e Compliance

*   **Sessões JWT Pró-Ativas:** Proteção rígida em todas as rotas da API corporativa.
*   **Sandbox SAGAT:** Todo código de automação de interface opera inicialmente em ambientes de validação e espelhamento visual antes da geração do código hash final da "Declaração de Veracidade".

---

## Estrutura do repositório

```
├── src/                    # Front React + Vite
├── server/                 # API Node + Fastify + Prisma
├── deploy/nginx.conf       # Proxy /api no container web
├── docker-compose.yml      # Postgres local (dev)
├── docker-compose.prod.yml # Stack VPS (web + api + db)
└── scripts/dev.mjs         # Sobe Postgres + API + front
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Postgres + API + front |
| `npm run dev:web` | Só front |
| `npm run dev:api` | Só API |
| `npm run db:up` | Só PostgreSQL |
| `npm run db:setup` | Schema + seed (via `server/`) |
