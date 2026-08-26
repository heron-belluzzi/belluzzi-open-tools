# SiteCheck

## Objetivo

O SiteCheck produz um checklist acionável de sinais públicos de um site sem
criar conta, histórico, nota arbitrária ou crawler. A interface canônica fica
em `/pt/check` e `/en/check`; a API é `POST /api/site-check`.

## Escopo

- resposta HTTP final, tempo observado e até cinco redirecionamentos;
- certificado TLS, validade, autorização e protocolo;
- headers de segurança, cache e atributos de cookies;
- título, descrição, canonical, robots meta, viewport, idioma, hreflang,
  Open Graph e H1;
- `robots.txt` e `sitemap.xml` no domínio final;
- políticas de crawling separadas para busca, ações iniciadas pelo usuário e
  treinamento de modelos;
- meta robots, `X-Robots-Tag`, conteúdo no HTML inicial e JSON-LD;
- detecção passiva de `llms.txt`, OpenAPI, MCP, WebMCP e A2A Agent Card;
- relatório em PT-BR e inglês, imprimível pelo navegador.

Não entram nesta versão: crawler de páginas internas, execução de JavaScript,
Lighthouse, teste de invasão, histórico, compartilhamento público ou
armazenamento do resultado.

## Contrato da API

Requisição:

```http
POST /api/site-check
Content-Type: application/json

{"url":"example.com"}
```

Uma entrada sem protocolo assume HTTPS. A resposta inclui alvo normalizado e
final, cadeia de redirects, duração, dados TLS, estado de robots/sitemap,
evidências estruturadas em `agents` e uma lista de verificações com `id`,
`category`, `status` e valor opcional. Os status são `pass`, `warning`, `fail`
e `info`.

A seção `agents` é aditiva para preservar consumidores do contrato anterior.
Ela contém perfil técnico inferido, matriz por crawler, diretivas da página,
HTML inicial, JSON-LD, recursos opcionais e interfaces detectadas. Não há nota
numérica ou promessa de inclusão em respostas de IA.

Erros usam `{ "error": { "code": "..." } }` e códigos estáveis:
`INVALID_URL`, `TARGET_BLOCKED`, `PORT_NOT_ALLOWED`, `TIMEOUT`,
`RESPONSE_TOO_LARGE`, `RATE_LIMITED`, `BUSY` e `TARGET_UNREACHABLE`.

## Segurança de rede

- somente HTTP/HTTPS e portas padrão 80/443;
- URLs limitadas a 2.048 caracteres, sem credenciais;
- resolução e validação IPv4/IPv6 em cada redirect;
- bloqueio de loopback, redes privadas, link-local, CGNAT, multicast,
  endereços reservados e metadata cloud;
- conexão fixada ao IP validado para impedir DNS rebinding;
- nenhuma propagação de cookies, autenticação ou headers do visitante;
- `Accept-Encoding: identity` para limitar os bytes realmente recebidos;
- cinco segundos por requisição e quinze segundos por análise;
- 1 MiB para HTML e sitemap e 256 KiB para robots, `llms.txt` e Agent Card;
- no máximo cinco recursos lógicos por análise: página, robots, sitemap,
  `llms.txt` e Agent Card;
- recursos auxiliares não podem redirecionar para outra origem;
- até duas análises simultâneas e dez por IP a cada dez minutos.

O código nunca registra URL, query ou IP analisado. Eventos de Analytics contêm
somente locale, conclusão, contagens agregadas ou código genérico de erro.

## IA e agentes

O catálogo inicial diferencia crawlers de busca, uso iniciado por pessoas e
treinamento. Bloquear treinamento é uma preferência editorial legítima e
permanece informativo. Ausência de `llms.txt`, OpenAPI, MCP, WebMCP ou A2A em
um site comum também não gera falha.

O SiteCheck interpreta apenas sinais públicos e o HTML inicial: não executa
JavaScript, não segue links de `llms.txt`, não inicializa servidores MCP, não
chama operações OpenAPI ou A2A e não simula um provedor de IA. `llms.txt` e
WebMCP são apresentados como experimentais.

## Proteção de borda

Além dos limites da aplicação, a instância oficial usa uma regra Cloudflare
para `/api/site-check`: três requisições por IP em dez segundos, com bloqueio
de dez segundos. A regra protege rajadas antes que elas cheguem à origem; a
aplicação continua responsável por limitar uso prolongado e concorrência.

A regra foi validada em produção em 26 de agosto de 2026 com requisições POST
inválidas, sem iniciar análises externas: as três primeiras alcançaram a
aplicação e a Cloudflare bloqueou as seguintes com HTTP `429`.

Configuração recomendada no painel da zona `belluzzi.dev`:

- expressão baseada no caminho `/api/site-check`;
- característica de contagem por endereço IP;
- três requisições em dez segundos;
- ação `Block` por dez segundos;
- manter a proteção interna ativa, pois o contador de borda não a substitui.

