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
- [ ] Publicar o case correspondente em `belluzzi.dev`.

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
- [ ] Publicar o case correspondente em `belluzzi.dev`.

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
- [ ] Publicar o case correspondente em `belluzzi.dev`.

A especificação está em [`docs/UTM-WHATSAPP.md`](UTM-WHATSAPP.md).

## Próximas ferramentas

1. **Data Toolkit:** JSON, YAML e CSV processados no navegador.
2. **SiteCheck:** primeiro produto independente, em `check.belluzzi.dev`.
3. **Hook:** inbox temporário e seguro para webhooks.

## Definição de pronto

Cada ferramenta deve ter PT/EN, temas, mobile, teclado, testes proporcionais ao
risco, processamento local quando possível, documentação de privacidade e
validação na instância pública antes de ser marcada como disponível.
