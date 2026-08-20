# Plano de credibilidade e descoberta

Este documento define como o Belluzzi Open Tools deve fortalecer a presença
profissional do Belluzzi sem disputar espaço com os projetos comerciais e de
portfólio já publicados em `belluzzi.dev`.

## Objetivo

Apresentar o Belluzzi Open Tools como uma única iniciativa open source: um
conjunto de ferramentas úteis, publicadas e mantidas em produção. A comunicação
deve demonstrar capacidade técnica, cuidado com privacidade e consistência de
produto, conduzindo quem tiver interesse para a instância pública, o GitHub e o
contato profissional.

## Estado atual

A seção unificada foi publicada em `belluzzi.dev` em 20 de agosto de 2026, com
conteúdo em PT-BR e inglês, temas claro/escuro, atalhos para as três ferramentas,
central, GitHub e contato profissional. O README já apresenta capturas reais da
central e das três ferramentas, badges verificáveis e links rápidos. A descrição
e os tópicos do repositório também estão configurados. O social preview em
1280×640 já foi enviado pela tela de configurações do GitHub; resta apenas
destacar o repositório no perfil.

## Seção própria em `belluzzi.dev`

### Decisão de produto

- QR Code Studio, Pass e UTM & WhatsApp Builder não entram individualmente na
  grade de projetos do portfólio.
- A home recebe uma única seção `Belluzzi Open Tools`, independente do
  componente de cases.
- A posição recomendada é logo após os projetos selecionados e antes da seção
  que apresenta os diferenciais profissionais.
- A seção usa o mesmo design, temas e responsividade do site principal.
- A implementação deve existir em PT-BR e inglês.

### Hierarquia proposta

1. Eyebrow `Open source`.
2. Título apresentando ferramentas abertas e gratuitas mantidas pelo Belluzzi.
3. Texto curto sobre utilidade, privacidade e uso em produção.
4. Um painel da iniciativa com os selos `Apache-2.0`, `PT/EN`, `dark/light` e
   `processamento local quando possível`.
5. Cartões compactos para as ferramentas disponíveis:
   - QR Code Studio;
   - Pass;
   - UTM & WhatsApp Builder.
6. CTA primário para `tools.belluzzi.dev`.
7. CTA secundário para o repositório no GitHub.
8. CTA profissional discreto para conversar sobre um projeto.

Os cartões são atalhos de uso, não cases: não terão imagem grande, narrativa
individual, stack detalhada ou destaque equivalente aos projetos do portfólio.
Ferramentas futuras só aparecem depois de estarem publicadas.

### Requisitos de implementação

- Criar um componente próprio, sem reutilizar ou alimentar o componente de
  cases do portfólio.
- Preservar a leitura e a densidade visual da home em desktop e mobile.
- Não adicionar uma página individual para cada ferramenta em `belluzzi.dev`.
- Registrar cliques para a central, GitHub e ferramentas sem capturar o
  conteúdo gerado pelo usuário.
- Usar links externos seguros e nomes acessíveis.
- Validar teclado, contraste, temas, PT/EN e largura de 320 px.
- Atualizar o conteúdo público para agentes e dados estruturados somente no
  nível da iniciativa, evitando duplicar cada ferramenta como projeto.

## Apresentação do repositório no GitHub

O README permanece em inglês e deve ganhar uma camada visual e operacional mais
forte:

- imagem principal real da central de ferramentas;
- capturas otimizadas das ferramentas publicadas;
- badges de CI, release, licença e instância pública;
- links rápidos para QR, Pass, UTM e código-fonte;
- resumo da arquitetura client-side e das garantias de privacidade;
- instruções curtas de execução local e contribuição;
- referência ao roadmap e às releases;
- social preview consistente com a identidade Belluzzi;
- descrição e tópicos do repositório revisados no GitHub;
- repositório destacado no perfil do GitHub.

As imagens devem representar o produto real, sem métricas inventadas, e ser
comprimidas para não tornar o clone do repositório desnecessariamente pesado.

## Quarta ferramenta: Data Toolkit

O Data Toolkit foi implementado como a quarta release do repositório principal.

### Escopo inicial

- formatar, validar e minificar JSON;
- indicar erros com linha e coluna quando possível;
- converter JSON e YAML com parsing seguro e sem tags executáveis;
- visualizar CSV, detectar delimitador e converter CSV e JSON;
- copiar e baixar resultados;
- processar texto e arquivos localmente, sem upload;
- PT-BR, inglês, temas, teclado, mobile e testes;
- rotas `/pt/data` e `/en/data`;
- alias opcional `data.belluzzi.dev` depois da publicação canônica.

Não entram na primeira versão: histórico, colaboração, armazenamento em nuvem,
execução de código, planilhas avançadas ou processamento de arquivos sem limite
de tamanho.

## Produto seguinte: SiteCheck

O SiteCheck continua planejado como o primeiro produto independente, em
`check.belluzzi.dev`, com backend e repositório próprios.

### Escopo inicial

- status HTTP, cadeia de redirecionamentos e tempo de resposta;
- validade e informações do certificado TLS;
- headers de segurança e cache;
- metadados essenciais de SEO, canonical e idiomas;
- disponibilidade de `robots.txt` e `sitemap.xml`;
- resumo acionável em PT-BR e inglês.

Por fazer requisições do servidor para URLs fornecidas pelo usuário, a
arquitetura deve nascer com proteção contra SSRF, bloqueio de redes privadas,
portas permitidas, timeouts, limite de resposta, rate limiting e retenção mínima
de logs. Não será um scanner invasivo de segurança.

## Ordem de execução

1. Implementar a seção Belluzzi Open Tools em `belluzzi.dev`.
2. Melhorar a apresentação e os metadados do repositório no GitHub.
3. Desenvolver o Data Toolkit como `v0.4.0` — concluído; publicação na
   instância oficial pendente.
4. Planejar o repositório e a arquitetura isolada do SiteCheck.
5. Desenvolver o SiteCheck após fechar seus limites de segurança e operação.

## Definição de pronto da camada de credibilidade

- a iniciativa aparece em uma seção própria, sem ocupar vagas no portfólio;
- os três links públicos e o GitHub estão acessíveis e rastreáveis;
- PT-BR, inglês, temas, teclado e mobile estão validados;
- README, screenshots, badges, descrição, tópicos e social preview estão
  atualizados;
- nenhum texto inventa clientes, métricas ou resultados não comprovados;
- mudanças são publicadas e verificadas nos ambientes oficiais.
