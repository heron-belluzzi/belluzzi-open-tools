# Belluzzi Open Tools

Free, open source, privacy-first tools maintained by
[Belluzzi](https://belluzzi.dev).

The project follows the visual identity of the main Belluzzi website and
supports light and dark themes, Brazilian Portuguese, and English.

## Available tools

- Tool hub at `/pt` and `/en`.
- QR Code Studio at `/pt/qr` and `/en/qr`.
- QR codes for URLs, text, Wi-Fi, vCards, events, WhatsApp, and email.
- Custom colors, size, margin, and error correction.
- Centered logo with stronger error correction and contrast validation.
- PNG and SVG export.
- Random password generator with configurable rules and Web Crypto.
- Passphrase generator with Portuguese and English BIP39 wordlists.
- Transparent entropy estimates, security guidance, and quick copying.
- UTM campaign links with built-in presets and consistent naming.
- Official WhatsApp links with phone normalization and message preview.
- One-time, session-only handoff from campaign links to QR Code Studio.
- Fully client-side processing with no persistence or transmission of tool
  content.

## Requirements

- Node.js 22 or newer.
- npm 10 or newer.

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Quality checks

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

By default, Docker Compose publishes the application at
`http://localhost:3020`. Use `APP_PORT` to select a different port.

The official instance deployment procedure is documented in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Short tool domains

The [`qr.belluzzi.dev`](https://qr.belluzzi.dev) alias selects its destination
according to the browser language:

- Portuguese: `https://tools.belluzzi.dev/pt/qr`;
- English: `https://tools.belluzzi.dev/en/qr`.

Language negotiation uses a `307` redirect with `Vary: Accept-Language`,
preserves the query string, and prevents shared caches from fixing one language
for every visitor.

The [`pass.belluzzi.dev`](https://pass.belluzzi.dev) alias uses the same
language negotiation and redirects to `/pt/pass` or `/en/pass`.

The [`utm.belluzzi.dev`](https://utm.belluzzi.dev) alias redirects to `/pt/utm`
or `/en/utm` using the same language and query-string rules.

All three aliases share the `tools.belluzzi.dev` application and a single
Let’s Encrypt certificate, with automatic renewal managed by CloudPanel.

## Privacy

QR Code Studio, Pass and the campaign link builders do not send entered or
generated content to an API. QR composition, cryptographic generation and link
assembly happen entirely in the browser. The public application requires no
account and contains no third-party ads.

## Roadmap

1. QR Code Studio — available.
2. Password and passphrase generator — available.
3. UTM and WhatsApp link builder — available.
4. JSON, YAML, and CSV toolkit.
5. Independent products such as SiteCheck and Hook.

## License

Licensed under the [Apache License 2.0](LICENSE).
