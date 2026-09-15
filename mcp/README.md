# AXM MCP Server

Servidor **Model Context Protocol** (stdio) com duas ferramentas:

| Tool | Função |
|------|--------|
| `mcp_validate_suframa_rules` | Concilia obrigação 5% PD&I, ICT Amazônia (40%) e CAPDA (20%) |
| `mcp_sagat_fill_sandbox` | Monta o payload do RD e simula preenchimento **sem** acessar o portal real |

## Executar

```bash
cd mcp
npx tsx src/index.ts
```

Cada linha no stdin é um JSON-RPC. Exemplo:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

`SAGAT_LIVE=true` é recusado de propósito — automação de interface só em sandbox até a homologação.
