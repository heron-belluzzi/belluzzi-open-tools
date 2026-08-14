# Deploy no CloudPanel

Este documento registra a topologia da instância oficial. Ele não contém
senhas, chaves privadas ou tokens.

## Contrato atual

| Item | Valor |
|---|---|
| Domínio | `tools.belluzzi.dev` |
| Alias ativo | `qr.belluzzi.dev` |
| Alias preparado | `pass.belluzzi.dev` (DNS, vhost e TLS pendentes) |
| Tipo do site | Node.js |
| Servidor | `34.138.211.55` |
| SSH | Porta `22`, chave PuTTY da sessão `Augmentum` |
| Site user | `belluzzi-tools` |
| Node.js | `22` |
| App port | `127.0.0.1:3020` |
| Diretório | `/home/belluzzi-tools/htdocs/tools.belluzzi.dev` |
| Processo PM2 | `belluzzi-open-tools` |

O CloudPanel encaminha o tráfego do Nginx para a porta da aplicação. Não é
necessário criar um segundo site Reverse Proxy.

## Pré-requisitos

- Registro DNS `A` para `tools.belluzzi.dev` apontando para o servidor.
- Certificado TLS válido no CloudPanel.
- Git e Node.js disponíveis para o site user.
- PM2 instalado no ambiente NVM do site user.

## Primeira instalação

Execute como `belluzzi-tools`:

```bash
source "$HOME/.nvm/nvm.sh"
mkdir -p "$HOME/htdocs"
git clone https://github.com/heron-belluzzi/belluzzi-open-tools.git \
  "$HOME/htdocs/tools.belluzzi.dev"
cd "$HOME/htdocs/tools.belluzzi.dev"
npm ci
npm run build
npm install --global pm2
APP_PORT=3020 pm2 start ecosystem.config.cjs
pm2 save
```

## Atualização

```bash
source "$HOME/.nvm/nvm.sh"
cd "$HOME/htdocs/tools.belluzzi.dev"
git fetch origin
git pull --ff-only origin main
npm ci
npm run build
APP_PORT=3020 pm2 reload ecosystem.config.cjs --update-env
pm2 save
```

## Gates após o deploy

```bash
curl -fsS http://127.0.0.1:3020/api/health
pm2 status belluzzi-open-tools
pm2 logs belluzzi-open-tools --lines 50 --nostream
```

Externamente, verificar:

- `/` redireciona para `/pt` ou `/en` conforme o idioma.
- `/pt`, `/en`, `/pt/qr`, `/en/qr`, `/pt/pass` e `/en/pass` respondem via
  HTTPS.
- Tema claro/escuro, alternância de idioma, exportações do QR e geração local
  de senhas/passphrases funcionam.
- `robots.txt`, `sitemap.xml` e `/api/health` estão acessíveis.

## Alias `qr.belluzzi.dev`

O alias está ativo na mesma aplicação, sem segundo site ou processo. O vhost de
`tools.belluzzi.dev` inclui os dois nomes no `server_name` e encaminha ambos
para `127.0.0.1:3020`.

Ao receber `/`, a aplicação lê `Accept-Language`, preserva a query string e
responde com `307` para `/pt/qr` ou `/en/qr` no domínio canônico. A resposta
inclui `Vary: Accept-Language` para não misturar idiomas em cache.

O certificado Let’s Encrypt foi emitido com os SANs `tools.belluzzi.dev` e
`qr.belluzzi.dev`. O CloudPanel verifica e renova os certificados diariamente
pelo cron `/etc/cron.d/clp`:

```text
15 5 * * * clp /usr/bin/bash -c "/usr/bin/clpctl lets-encrypt:renew:certificates"
```

Comandos de verificação:

```bash
openssl x509 \
  -in /etc/nginx/ssl-certificates/tools.belluzzi.dev.crt \
  -noout -issuer -dates -ext subjectAltName
systemctl is-active cron
clpctl lets-encrypt:renew:certificates
nginx -t
```

O backup anterior à inclusão do alias está em
`/etc/nginx/sites-enabled/tools.belluzzi.dev.conf.pre-qr-20260814-135732`.

## Futuro alias `pass.belluzzi.dev`

A aplicação já reconhece o host e responde com `307` para `/pt/pass` ou
`/en/pass`, preservando a query string e variando por `Accept-Language`. Para
ativá-lo publicamente ainda é necessário:

1. apontar o DNS para o mesmo servidor;
2. incluir `pass.belluzzi.dev` no `server_name` do vhost existente;
3. reemitir o certificado Let’s Encrypt com o novo SAN;
4. validar HTTP, HTTPS, idioma e renovação automática.

## Segredos

Credenciais locais de deploy ficam apenas no `.env` ignorado pelo Git. Nunca
adicione senhas, chaves PuTTY ou tokens ao repositório, à documentação ou ao
ecossistema PM2.
