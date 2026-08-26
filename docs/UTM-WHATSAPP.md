# UTM & WhatsApp Builder: Especificação funcional

## Objetivo

Entregar dois geradores locais em uma única ferramenta: links de campanha com
parâmetros UTM consistentes e links oficiais do WhatsApp com telefone e mensagem
codificados corretamente. A ferramenta deve reduzir erros de montagem manual e
se integrar ao QR Code Studio sem enviar os dados ao servidor.

## Limites da primeira release

- Rotas canônicas: `/pt/utm` e `/en/utm`.
- Duas abas: **UTM Builder** e **WhatsApp Link**.
- Processamento integral no navegador, sem API, cadastro ou histórico.
- Presets embutidos; não há criação ou persistência de presets personalizados.
- Não inclui encurtamento, redirecionamento, analytics ou validação da
  existência de números de telefone.
- `utm.belluzzi.dev` negocia PT/EN automaticamente e redireciona para a rota
  canônica preservando a query string.

## UTM Builder

### Entradas

- URL de destino.
- `utm_source`, `utm_medium` e `utm_campaign` obrigatórios.
- `utm_content` e `utm_term` opcionais.
- Normalização opcional dos valores UTM para minúsculas e `snake_case`.

### Presets

| Preset | `utm_source` | `utm_medium` |
|---|---|---|
| Google Ads | `google` | `cpc` |
| Meta Ads | `meta` | `paid_social` |
| Instagram orgânico | `instagram` | `social` |
| Newsletter | `newsletter` | `email` |

Os presets preenchem origem e mídia, sem substituir o nome da campanha.

### Regras

- Aceitar URLs HTTP/HTTPS e adicionar HTTPS quando o protocolo for omitido.
- Preservar query string e fragmento existentes.
- Substituir parâmetros UTM homônimos já existentes, sem duplicá-los.
- Codificar corretamente os valores e exibir erro para URL ou campos
  obrigatórios inválidos.
- Alertar quando a URL final ultrapassar 2.000 caracteres.

## WhatsApp Link

### Entradas

- Telefone internacional com DDI e DDD.
- Mensagem inicial opcional, incluindo emojis e quebras de linha.

### Regras

- Remover espaços e sinais de formatação do telefone.
- Aceitar de 8 a 15 dígitos; a validação confirma apenas o formato.
- Gerar `https://wa.me/<telefone>` e adicionar `?text=` somente quando houver
  mensagem.
- Exibir a quantidade de caracteres da mensagem e uma prévia legível.

## Resultado e ações

As duas abas oferecem:

- resultado atualizado localmente;
- copiar;
- abrir o link;
- limpar;
- enviar ao QR Code Studio.

O handoff para o QR Studio usa `sessionStorage` somente após ação explícita do
usuário. O QR Studio consome e remove o valor ao abrir, evitando expor a URL ou
a mensagem como parâmetro de navegação.

## UX, acessibilidade e localização

- Identidade visual Belluzzi e componentes editoriais existentes.
- Temas claro e escuro.
- Português do Brasil e inglês.
- Abas operáveis por clique, setas, Home e End.
- Feedback de clipboard por região viva.
- Layout sem rolagem horizontal a partir de 320 px.
- Avisos claros de privacidade, formato do telefone e comprimento da URL.

## Critérios de pronto

- Geradores puros cobertos por testes unitários.
- Preservação de query/fragmento e substituição de UTMs comprovadas em testes.
- WhatsApp com emoji e quebra de linha comprovado em testes.
- Handoff UTM/WhatsApp → QR comprovado por E2E.
- Clipboard, teclado, PT/EN, mobile e acessibilidade validados.
- Nenhuma chamada `fetch`/XHR durante geração, cópia ou handoff.
- Lint, typecheck, testes, build, E2E e auditoria de dependências aprovados.
