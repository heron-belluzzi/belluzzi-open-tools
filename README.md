# Belluzzi Open Tools

Ferramentas gratuitas, open source e focadas em privacidade, mantidas pelo
[Belluzzi](https://belluzzi.dev).

O projeto preserva a identidade visual do site principal do Belluzzi e oferece
temas claro e escuro, português do Brasil e inglês.

## Primeira versão

- Hub de ferramentas em `/pt` e `/en`.
- QR Code Studio em `/pt/qr` e `/en/qr`.
- QR Codes para URL, texto, Wi-Fi, vCard, WhatsApp e e-mail.
- Personalização de cores, tamanho, margem e correção de erro.
- Exportação PNG e SVG.
- Processamento integral no navegador, sem persistência ou envio do conteúdo.

## Requisitos

- Node.js 22 ou superior.
- npm 10 ou superior.

## Desenvolvimento

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Verificações

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Docker

```bash
docker compose up --build
```

Por padrão, o Compose publica a aplicação em `http://localhost:3020`. A porta
pode ser alterada com `APP_PORT`.

O procedimento da instância oficial está em
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Privacidade

O QR Code Studio não envia o conteúdo digitado para uma API. A composição e a
renderização do QR Code são feitas no navegador. A aplicação pública não exige
cadastro nem inclui anúncios de terceiros.

## Roadmap

1. QR Code Studio.
2. Gerador de senhas e passphrases.
3. Criador de UTMs e links para WhatsApp.
4. Toolkit de JSON, YAML e CSV.
5. Produtos independentes como SiteCheck e Hook.

## English

Belluzzi Open Tools is a privacy-first collection of free and open source web
utilities. The first release includes a browser-only QR Code Studio with light
and dark themes and Brazilian Portuguese/English localization.

## Licença

Licenciado sob a [Apache License 2.0](LICENSE).
