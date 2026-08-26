# SiteCheck: AI & Agent Readiness

Este documento especifica a sétima release do Belluzzi Open Tools. A entrega
será uma evolução do SiteCheck, depois do Hook, sem novo produto, domínio,
processo PM2 ou banco de dados.

## Objetivo

Explicar se um site público oferece sinais técnicos claros para mecanismos de
busca, assistentes com navegação e sistemas de agentes, respeitando a intenção
do proprietário e sem prometer inclusão, citação ou posicionamento em respostas
geradas por IA.

A análise continuará anônima, síncrona e sem persistência. O usuário informará
uma URL e receberá evidências e recomendações em PT-BR ou inglês.

## Decisões de produto

- A funcionalidade será a categoria `IA & Agentes` do relatório atual.
- As rotas continuarão sendo `/pt/check` e `/en/check`.
- Não haverá nota numérica, selo de aprovação ou alegação de “GEO garantido”.
- Bloquear um crawler de treinamento não será tratado como erro: pode ser uma
  decisão legítima do publicador.
- Sinais experimentais serão identificados como experimentais e não serão
  requisitos para um site comum.
- Recursos próprios de agentes só serão avaliados quando encontrados; a
  ausência de MCP, WebMCP, OpenAPI ou Agent Card em um site comum será
  informativa, nunca uma falha.
- Um produto separado só será reconsiderado se houver execução com modelos,
  múltiplas páginas, histórico, monitoramento ou consumo de APIs pagas.

## Fora do escopo da primeira versão

- Executar JavaScript em navegador headless.
- Simular uma visita real de ChatGPT, Claude, Gemini ou outro provedor.
- Executar ferramentas WebMCP, MCP ou operações A2A.
- Chamar endpoints de uma OpenAPI ou autenticar em serviços remotos.
- Rastrear o site inteiro ou seguir links de `llms.txt`.
- Armazenar URLs, relatórios, IPs ou histórico.
- Estimar a probabilidade de uma marca aparecer em respostas de IA.

## Perfis e linguagem do relatório

O analisador inferirá um perfil somente para organizar resultados:

- `website`: página pública sem interfaces de agente detectadas;
- `developer_api`: documentação ou descrição OpenAPI explicitamente indicada;
- `agent_service`: Agent Card, MCP ou WebMCP explicitamente detectado.

O perfil não será uma classificação comercial. Cada resultado continuará usando
`pass`, `warning`, `fail` ou `info`, com estas regras:

- `fail`: recurso declarado está inválido ou tecnicamente inacessível;
- `warning`: condição provavelmente involuntária limita descoberta ou leitura;
- `info`: escolha editorial, ausência opcional ou tecnologia experimental;
- `pass`: sinal aplicável está válido e coerente.

## Catálogo de crawlers

O código terá um catálogo versionado com nome, provedor, finalidade e fonte
oficial. A primeira versão deve cobrir, no mínimo:

- busca e descoberta;
- acesso iniciado por um usuário;
- treinamento ou melhoria de modelos.

As finalidades não podem ser combinadas em um único “permitido para IA”. Por
exemplo, permitir busca e bloquear treinamento é uma política válida.

O catálogo deverá registrar a data da última revisão e ser conferido antes de
cada release, pois nomes e políticas de provedores podem mudar.

## Análises planejadas

### 1. Política de crawling

- Interpretar `robots.txt` de acordo com grupos de `User-agent` e precedência
  do Robots Exclusion Protocol.
- Avaliar o caminho analisado para cada crawler do catálogo.
- Diferenciar `allowed`, `blocked`, `not_declared`, `unavailable` e `invalid`.
- Exibir a regra específica que produziu a decisão, sem esconder a evidência.
- Não confundir bloqueio de crawling com remoção de uma URL de um índice.

### 2. Diretivas da página

- Analisar meta robots genérica e diretivas por user agent.
- Analisar todos os headers `X-Robots-Tag`, inclusive valores qualificados por
  user agent.
- Detectar conflitos entre `robots.txt`, meta robots e headers.
- Explicar que uma diretiva dentro da página pode não ser descoberta quando o
  próprio `robots.txt` impede o crawling.

### 3. Conteúdo disponível sem renderização

- Verificar conteúdo textual útil no HTML inicial.
- Verificar `lang`, título, descrição, um H1 coerente e landmarks semânticos.
- Verificar links com `href` descobrível e textos ou nomes acessíveis.
- Informar quando a resposta parece ser apenas um app shell dependente de
  JavaScript.
- Deixar explícito que o SiteCheck não renderizou a página nesta versão.

### 4. Dados estruturados

- Localizar blocos `application/ld+json`.
- Validar sintaxe JSON, `@context`, presença de `@type` e URLs absolutas quando
  exigidas pela estrutura encontrada.
- Listar os tipos Schema.org detectados e erros objetivos.
- Não afirmar elegibilidade para rich results nem fazer validação completa de
  vocabulário específico de um provedor.

### 5. `llms.txt`

- Consultar apenas `/llms.txt` no mesmo origin.
- Validar resposta, tamanho, codificação e estrutura básica em Markdown.
- Verificar título H1, resumo em blockquote, seções H2 e links Markdown.
- Resolver links para apresentar evidência, sem baixá-los nesta versão.
- Detectar `llms-full.txt` ou versões Markdown indicadas pelo documento sem
  tratá-las como obrigatórias.
- Marcar o resultado como experimental, inclusive quando estiver válido.
- Ausência será `info`, nunca `warning` ou `fail`.

### 6. Interfaces de API e agentes

- Detectar descrições OpenAPI indicadas por link ou metadado explícito; não
  sondar uma lista extensa de caminhos convencionais.
- Detectar WebMCP declarativo no HTML e informar que ferramentas imperativas
  dependentes de JavaScript não foram executadas.
- Detectar links explícitos para MCP, sem enviar `initialize`, `tools/list` ou
  qualquer outra chamada ao servidor.
- Consultar `/.well-known/agent-card.json` no mesmo origin com limite rígido e
  validar campos públicos essenciais quando o recurso existir.
- Nunca invocar a URL operacional, ferramentas ou skills descritas em um Agent
  Card.
- Tratar WebMCP como Community Group Draft até que seu status normativo mude.

## Modelo de dados proposto

Adicionar `agents` a `SiteCheckCategory` e estender o relatório com evidências
estruturadas, sem colocar conteúdo arbitrário completo na interface:

```ts
type AgentPolicyPurpose = "search" | "user_action" | "training";
type AgentPolicyDecision =
  | "allowed"
  | "blocked"
  | "not_declared"
  | "unavailable"
  | "invalid";

type AgentPolicyEvidence = {
  provider: string;
  crawler: string;
  purpose: AgentPolicyPurpose;
  decision: AgentPolicyDecision;
  source: "robots" | "meta" | "header";
  evidence?: string;
};

type AgentReadiness = {
  profile: "website" | "developer_api" | "agent_service";
  policies: AgentPolicyEvidence[];
  initialHtml: { textLength: number; appShellSuspected: boolean };
  structuredData: { valid: number; invalid: number; types: string[] };
  llms: SiteCheckResource & { experimental: true };
  agentCard: SiteCheckResource;
  signals: Array<"openapi" | "mcp" | "webmcp" | "a2a">;
};
```

Os IDs de checks, textos e recomendações continuarão sendo enumerados e
traduzidos em `messages/pt.json` e `messages/en.json`.

## Arquitetura e limites de rede

A implementação reutilizará `safeRequest`, validação de IP público, resolução
DNS fixada, bloqueio de DNS rebinding, redirects limitados e timeouts atuais.

Orçamento máximo por análise:

1. página informada;
2. `robots.txt`;
3. `sitemap.xml`;
4. `llms.txt`;
5. `/.well-known/agent-card.json`.

Regras adicionais:

- no máximo cinco recursos e somente no origin final da página;
- recursos auxiliares em paralelo dentro do deadline global de 15 segundos;
- até 1 MiB para HTML e sitemap;
- até 256 KiB para robots, `llms.txt` e Agent Card;
- sem cookies, autenticação ou headers privados do visitante;
- links externos serão validados sintaticamente, mas não visitados;
- a proteção interna e o rate limiting da Cloudflare continuarão ativos.

## Organização sugerida do código

```text
src/lib/site-check/
├── agent-catalog.ts
├── agent-analyzer.ts
├── agent-card.ts
├── llms-txt.ts
├── robots-policy.ts
├── structured-data.ts
├── analyzer.ts
├── network.ts
└── types.ts
```

`analyzer.ts` continuará orquestrando o relatório. Parsers serão funções puras
com fixtures locais; somente a camada de rede poderá acessar destinos públicos.

## Interface

- Adicionar `IA & Agentes` à navegação de categorias do relatório.
- Exibir uma matriz `Provedor / Crawler / Finalidade / Decisão`.
- Usar badges distintos para `Experimental` e `Não aplicável`.
- Mostrar a evidência técnica e uma recomendação curta em cada item.
- Preservar impressão, temas, teclado, leitor de tela, PT-BR, inglês e 320 px.
- Não criar CTA alarmista para sinais opcionais ausentes.

## Plano de implementação

### Fase 1: contratos e parsers

- Congelar o catálogo inicial de crawlers com fontes e data de revisão.
- Criar tipos e IDs de checks.
- Implementar parser de robots, meta robots e `X-Robots-Tag`.
- Implementar parsers de JSON-LD, `llms.txt` e Agent Card.

### Fase 2: coleta segura e relatório

- Reaproveitar o conteúdo de `robots.txt` já baixado pelo SiteCheck.
- Adicionar as duas novas sondas limitadas: `llms.txt` e Agent Card.
- Montar evidências e recomendações sem ultrapassar o orçamento de rede.
- Manter compatibilidade da API para consumidores do relatório atual.

### Fase 3: experiência bilíngue

- Adicionar categoria, matriz de políticas e recursos detectados.
- Escrever textos PT-BR e inglês equivalentes.
- Validar estados válido, ausente, bloqueado, inválido, experimental e não
  aplicável.

### Fase 4: qualidade e publicação

- Executar lint, typecheck, unitários, build e E2E.
- Revisar segurança e privacidade.
- Validar a instância canônica e `check.belluzzi.dev`.
- Atualizar README, documentação, screenshots e publicar `v0.7.0`.

## Estratégia de testes

### Unitários

- grupos, curingas, precedência e arquivos malformados de robots;
- políticas diferentes para busca, ação do usuário e treinamento;
- múltiplos headers e conflitos de diretivas;
- HTML completo versus app shell;
- JSON-LD válido, múltiplo e inválido;
- `llms.txt` válido, parcial, ausente, excessivo e com links inválidos;
- Agent Card válido, incompleto, excessivo e contendo URLs privadas;
- ausência de sinais opcionais sem falso `fail`.

### Integração

- orçamento máximo de cinco requests;
- mesma origem para recursos auxiliares;
- IP privado, redirect privado e DNS rebinding continuam bloqueados;
- deadline global, limites de bytes, concorrência e rate limiting;
- resposta antiga permanece compatível e a nova seção é determinística.

### E2E

- relatório completo em PT-BR e inglês;
- matriz utilizável por teclado e leitor de tela;
- temas claro/escuro, impressão e viewport de 320 px;
- estados experimentais e não aplicáveis claramente identificados;
- analytics sem URL, crawler analisado ou conteúdo do destino.

## Critérios de aceite

- Nenhum recurso privado ou porta não permitida pode ser alcançado.
- A análise realiza no máximo cinco requests e respeita o deadline de 15 s.
- Bloquear treinamento nunca gera `fail` por si só.
- Ausência de `llms.txt`, MCP, WebMCP, OpenAPI ou A2A não penaliza um site
  comum.
- Todo resultado apresenta finalidade, evidência e recomendação traduzida.
- Nenhuma URL ou política analisada é persistida ou enviada ao Analytics.
- Lint, tipos, testes unitários, build e E2E passam no CI.
- Produção é validada em `tools.belluzzi.dev` e `check.belluzzi.dev` antes da
  release `v0.7.0`.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Políticas de crawler mudarem | Catálogo versionado, fontes oficiais e revisão por release |
| Transformar preferência editorial em erro | Resultados por finalidade e bloqueio de treinamento como informação |
| Padrões experimentais gerarem falsos alertas | Badge experimental, ausência sem penalidade e sem nota numérica |
| Aumentar o custo da análise | Cinco requests, paralelismo limitado, bytes e deadline globais |
| Executar uma interface remota perigosa | Somente detecção e parsing; nenhuma ferramenta ou operação é invocada |
| Confundir HTML inicial com página renderizada | Texto explícito no relatório e renderização fora do escopo |

## Fontes normativas e de referência

Revisadas em 26 de agosto de 2026; devem ser verificadas novamente antes da
implementação:

- [Robots Exclusion Protocol: RFC 9309](https://www.rfc-editor.org/rfc/rfc9309)
- [OpenAI: Publishers and Developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
- [Anthropic: crawler controls](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Google: robots meta e X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [`llms.txt` v2: proposta](https://llmstxt.org/)
- [WebMCP: Community Group Draft](https://webmachinelearning.github.io/webmcp/)
- [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25)
- [Agent2Agent Protocol](https://a2a-protocol.org/latest/specification/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
