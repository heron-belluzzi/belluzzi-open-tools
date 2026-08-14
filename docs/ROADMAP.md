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
- [x] Seleção automática PT/EN preparada para `qr.belluzzi.dev`.
- [ ] Apontar o DNS e emitir TLS para `qr.belluzzi.dev`.
- [ ] Publicar o case correspondente em `belluzzi.dev`.

## Próximas ferramentas

1. **Pass:** senhas e passphrases usando Web Crypto.
2. **UTM/WhatsApp Builder:** presets locais e integração com o QR Studio.
3. **Data Toolkit:** JSON, YAML e CSV processados no navegador.
4. **SiteCheck:** primeiro produto independente, em `check.belluzzi.dev`.
5. **Hook:** inbox temporário e seguro para webhooks.

## Definição de pronto

Cada ferramenta deve ter PT/EN, temas, mobile, teclado, testes proporcionais ao
risco, processamento local quando possível, documentação de privacidade e
validação na instância pública antes de ser marcada como disponível.
