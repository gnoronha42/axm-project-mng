# Mapa mental — funcionalidades AXM Project Manager

Documento de referência para o escopo de produto: repositório de documentos (estilo drive) + fluxo de gestão de projetos com fases contratuais e acompanhamento.

---

## Diagrama (Mermaid)

> Em editores que suportam Mermaid (GitHub, GitLab, VS Code com extensão), o diagrama abaixo renderiza como mapa mental.

```mermaid
mindmap
  root((AXM Project Manager))
    Experiência do usuário
      Layout e marca
        Sidebar moderna
        Tema dourado AXM
      Dashboard
        Indicadores resumidos
        Projetos ativos
        Documentos recentes
      Projetos
        Lista e filtros
        Detalhe do projeto
      Documentos
        Repositório global
        Filtro por fase e categoria
      Fluxo visual
        Timeline de fases
        Quadro Kanban por fase
    Gestão do ciclo do projeto
      Fases do fluxo
        Recebimento do processo
        Plano de trabalho
        Revisão e ajustes
        Execução do cliente
        Aprovação do cliente
        Elaboração do convênio
        Assinatura do convênio
        Execução do projeto
        Validação com cliente
      Documentos por fase
        Upload e categorias
        Versionamento desejado
      Comunicação
        Comentários por fase
        Resolução de pendências
      Execução e prestação de contas
        Relatórios técnicos mensais
        Notas fiscais e comprovantes
        Envio para validação
    Infraestrutura e qualidade
      Integração com API
        Substituir dados mock
        Variáveis de ambiente
      Segurança e acesso
        Autenticação
        Perfis cliente consultoria investidor
      Operação
        CI build e testes
        Deploy preview e produção
        Monitoramento básico
    Evoluções futuras
      Notificações
      Busca avançada
      Auditoria de alterações
      Integrações externas
```

---

## Mapa em lista (mesma hierarquia)

### AXM Project Manager (raiz)

#### Experiência do usuário

- **Layout e marca** — Sidebar, identidade visual, navegação principal.
- **Dashboard** — Indicadores, projetos ativos, atalhos a documentos recentes.
- **Projetos** — Listagem com busca e filtros; tela de detalhe com abas.
- **Documentos** — Visão global do repositório com filtros.
- **Fluxo visual** — Timeline das fases; quadro estilo Kanban por coluna de fase.

#### Gestão do ciclo do projeto

- **Fases do fluxo** — Nove etapas desde recebimento até validação com o cliente.
- **Documentos por fase** — Anexos alinhados à etapa (plano, convênio, NF, relatório etc.).
- **Comunicação** — Comentários e ajustes vinculados à fase.
- **Execução e prestação de contas** — Relatórios mensais, NFs, fluxo de validação.

#### Infraestrutura e qualidade

- **Integração com API** — Backend real, persistência, cliente HTTP.
- **Segurança e acesso** — Login e permissões por papel.
- **Operação** — CI/CD, ambientes, documentação de execução.

#### Evoluções futuras

- Notificações, busca avançada, auditoria, integrações.

---

## Legenda de prioridade (sugestão)

| Área              | Curto prazo típico        | Médio prazo              |
|-------------------|---------------------------|--------------------------|
| UX / Visual       | Fluxo no menu, empty states | Refinos de acessibilidade |
| Ciclo do projeto  | Avanço de fase persistido | Regras por perfil        |
| Infra             | CI + preview deploy       | API + banco + storage    |

---

---

## Roadmap operacional

Cronograma por dias, back-end MVP, Docker/Render e checklist P0–P3:

→ **[ROADMAP-ENTREGAS.md](./ROADMAP-ENTREGAS.md)**  
→ **[DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md)** — roteiro para colocar em produção

*Última atualização: documento gerado para alinhamento de escopo com cliente e time.*
