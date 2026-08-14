# Belluzzi Open Tools

Ferramentas gratuitas, open source e focadas em privacidade, mantidas pelo
[Belluzzi](https://belluzzi.dev).

O projeto preserva a identidade visual do site principal do Belluzzi e oferece
temas claro e escuro, português do Brasil e inglês.

## Ferramentas disponíveis

- Hub de ferramentas em `/pt` e `/en`.
- QR Code Studio em `/pt/qr` e `/en/qr`.
- QR Codes para URL, texto, Wi-Fi, vCard, eventos, WhatsApp e e-mail.
- Personalização de cores, tamanho, margem e correção de erro.
- Logotipo central com correção de erro reforçada e validação de contraste.
- Exportação PNG e SVG.
- Gerador de senhas aleatórias com regras configuráveis e Web Crypto.
- Gerador de passphrases com listas BIP39 em português e inglês.
- Estimativa transparente de entropia, avisos de uso e cópia rápida.
- Processamento integral no navegador, sem persistência ou envio do conteúdo
  das ferramentas.

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
npm run test:e2e
```

## Docker

```bash
docker compose up --build
```

Por padrão, o Compose publica a aplicação em `http://localhost:3020`. A porta
pode ser alterada com `APP_PORT`.

O procedimento da instância oficial está em
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Domínio curto do QR Code

O alias [`qr.belluzzi.dev`](https://qr.belluzzi.dev) seleciona o destino pelo
idioma do navegador:

- português: `https://tools.belluzzi.dev/pt/qr`;
- inglês: `https://tools.belluzzi.dev/en/qr`.

O redirecionamento negociado usa `307` e `Vary: Accept-Language`, preservando a
query string e evitando fixar um idioma em caches compartilhados.

O alias compartilha o site de `tools.belluzzi.dev` e utiliza certificado
Let’s Encrypt com renovação automática administrada pelo CloudPanel.

O código também está preparado para selecionar o idioma em
`pass.belluzzi.dev` e encaminhar para `/pt/pass` ou `/en/pass`. A ativação desse
alias depende do DNS e da inclusão no vhost/certificado da instância oficial.

## Privacidade

O QR Code Studio e o Pass não enviam o conteúdo digitado ou gerado para uma
API. A composição do QR e a geração criptográfica acontecem no navegador. A
aplicação pública não exige cadastro nem inclui anúncios de terceiros.

## Roadmap

1. QR Code Studio — disponível.
2. Gerador de senhas e passphrases — disponível.
3. Criador de UTMs e links para WhatsApp.
4. Toolkit de JSON, YAML e CSV.
5. Produtos independentes como SiteCheck e Hook.

## English

Belluzzi Open Tools is a privacy-first collection of free and open source web
utilities. It includes a browser-only QR Code Studio and a Web Crypto password
and passphrase generator, with light/dark themes and Brazilian
Portuguese/English localization.

## Licença

Licenciado sob a [Apache License 2.0](LICENSE).
