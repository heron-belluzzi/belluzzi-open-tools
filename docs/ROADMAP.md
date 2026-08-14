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
- [x] Roteamento preparado para seleção automática PT/EN em
  `pass.belluzzi.dev`.
- [ ] Ativar DNS, vhost e TLS para `pass.belluzzi.dev`.
- [ ] Publicar o case correspondente em `belluzzi.dev`.

## Próximas ferramentas

1. **UTM/WhatsApp Builder:** presets locais e integração com o QR Studio.
2. **Data Toolkit:** JSON, YAML e CSV processados no navegador.
3. **SiteCheck:** primeiro produto independente, em `check.belluzzi.dev`.
4. **Hook:** inbox temporário e seguro para webhooks.

## Definição de pronto

Cada ferramenta deve ter PT/EN, temas, mobile, teclado, testes proporcionais ao
risco, processamento local quando possível, documentação de privacidade e
validação na instância pública antes de ser marcada como disponível.
