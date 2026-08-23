# SiteCheck v0.5.0

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
final, cadeia de redirects, duração, dados TLS, estado de robots/sitemap e uma
lista de verificações com `id`, `category`, `status` e valor opcional. Os status
são `pass`, `warning`, `fail` e `info`.

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
- 1 MiB para HTML e sitemap e 256 KiB para robots;
- até duas análises simultâneas e dez por IP a cada dez minutos.

O código nunca registra URL, query ou IP analisado. Eventos de Analytics contêm
somente locale, conclusão, contagens agregadas ou código genérico de erro.

## Proteção de borda

Além dos limites da aplicação, está planejada uma regra Cloudflare para
`/api/site-check`: três requisições por IP em dez segundos, com bloqueio de dez
segundos. A regra protegerá rajadas antes que elas cheguem à origem; a aplicação
continuará responsável por limitar uso prolongado e concorrência.

Configuração recomendada no painel da zona `belluzzi.dev`:

- expressão baseada no caminho `/api/site-check`;
- característica de contagem por endereço IP;
- três requisições em dez segundos;
- ação `Block` por dez segundos;
- manter a proteção interna ativa, pois o contador de borda não a substitui.

