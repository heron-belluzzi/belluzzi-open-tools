# Roadmap — Belluzzi Open Tools

Este documento acompanha o estado real do repositório e da instância oficial.

## Fundação

- [x] Repositório público sob `heron-belluzzi`.
- [x] Next.js, TypeScript, Tailwind CSS e componentes compartilhados.
- [x] Identidade visual alinhada ao site principal do Belluzzi.
- [x] Português do Brasil, inglês e temas claro/escuro.
- [x] CI com lint, tipos, testes, build e testes E2E.
- [x] Docker, PM2, healthcheck e deploy no CloudPanel.
- [x] Apache-2.0, segurança, contribuição e código de conduta.
- [x] UTMs consistentes nos links para `belluzzi.dev`.
- [x] Headers de segurança e Content Security Policy.

## QR Code Studio — primeira release

- [x] URL, texto, Wi-Fi, vCard, evento, WhatsApp e e-mail.
- [x] Cores, tamanho, margem e níveis de correção de erro.
- [x] Logotipo local em PNG, JPEG ou WebP.
- [x] Validação básica de contraste.
- [x] Exportação PNG e SVG sem envio do conteúdo ao servidor.
- [x] Seleção automática PT/EN em `qr.belluzzi.dev`.
- [x] DNS, vhost e TLS Let’s Encrypt com renovação automática para o alias.
- [x] Incluir o atalho na seção unificada `Belluzzi Open Tools` em
  `belluzzi.dev`.

## Pass — segunda release

- [x] Senhas aleatórias usando Web Crypto e amostragem sem viés.
- [x] Regras de tamanho, letras, números, símbolos e caracteres ambíguos.
- [x] Passphrases BIP39 em português e inglês.
- [x] Estimativa explicada de entropia e faixas de força.
- [x] Geração e cópia locais, sem persistência ou chamadas de rede.
- [x] Mobile, teclado, temas, PT/EN, testes unitários, E2E e acessibilidade.
- [x] Seleção automática PT/EN ativa em
  `pass.belluzzi.dev`.
- [x] DNS, vhost e TLS Let’s Encrypt com renovação automática para o alias.
- [x] Incluir o atalho na seção unificada `Belluzzi Open Tools` em
  `belluzzi.dev`.

## UTM & WhatsApp Builder — terceira release

- [x] UTMs com origem, mídia, campanha, conteúdo e termo.
- [x] Presets para Google Ads, Meta Ads, Instagram e newsletter.
- [x] Normalização opcional, preservação de query/fragmento e substituição sem
  duplicatas.
- [x] Links `wa.me` com telefone internacional, mensagem e prévia.
- [x] Cópia, abertura, limpeza e handoff transitório para o QR Studio.
- [x] Processamento local, mobile, teclado, temas, PT/EN e acessibilidade.
- [x] Rotas `/pt/utm` e `/en/utm` e roteamento preparado para
  `utm.belluzzi.dev`.
- [x] DNS, vhost e TLS Let’s Encrypt com renovação automática para o alias.
- [x] Incluir o atalho na seção unificada `Belluzzi Open Tools` em
  `belluzzi.dev`.

A especificação está em [`docs/UTM-WHATSAPP.md`](UTM-WHATSAPP.md).

## Credibilidade e descoberta

- [x] Criar uma seção própria `Belluzzi Open Tools` na home de `belluzzi.dev`,
  separada dos projetos do portfólio.
- [x] Apresentar a iniciativa em um único painel com atalhos compactos para as
  ferramentas já publicadas.
- [x] Adicionar CTAs para a central, o GitHub e o contato profissional.
- [x] Validar a seção em PT-BR, inglês, temas, teclado e mobile.
- [ ] Adicionar screenshots reais, badges e links rápidos ao README.
- [ ] Revisar descrição, tópicos e social preview do repositório no GitHub.
- [ ] Destacar o repositório no perfil do GitHub.

O plano detalhado está em
[`docs/CREDIBILITY-PLAN.md`](CREDIBILITY-PLAN.md).

## Data Toolkit — quarta release

- [ ] Formatar, validar e minificar JSON.
- [ ] Converter JSON e YAML com parsing seguro.
- [ ] Visualizar CSV e converter CSV e JSON.
- [ ] Copiar e baixar os resultados sem enviar dados ao servidor.
- [ ] Adicionar limites seguros para arquivos e entradas grandes.
- [ ] Publicar `/pt/data` e `/en/data` com PT/EN, temas, teclado e mobile.
- [ ] Ativar `data.belluzzi.dev` somente depois da rota canônica estar pronta.

## SiteCheck — primeiro produto independente

- [ ] Definir arquitetura e repositório próprios para `check.belluzzi.dev`.
- [ ] Verificar HTTP, redirecionamentos, TLS, headers, SEO, robots e sitemap.
- [ ] Projetar proteção contra SSRF, rate limiting, timeouts e limites de
  resposta antes de implementar o backend.
- [ ] Publicar uma análise acionável em PT-BR e inglês.

## Produtos posteriores

1. **Hook:** inbox temporário e seguro para webhooks.

## Definição de pronto

Cada ferramenta deve ter PT/EN, temas, mobile, teclado, testes proporcionais ao
risco, processamento local quando possível, documentação de privacidade e
validação na instância pública antes de ser marcada como disponível.
