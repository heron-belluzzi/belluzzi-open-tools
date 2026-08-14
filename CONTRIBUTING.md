# Como contribuir

Contribuições são bem-vindas por issues e pull requests.

## Antes de começar

1. Verifique se já existe uma issue ou pull request para a mudança.
2. Abra uma issue para funcionalidades maiores ou mudanças de arquitetura.
3. Preserve os temas claro/escuro, PT-BR/inglês e acessibilidade.
4. Não adicione rastreamento ou envio de dados sem discussão prévia.

## Desenvolvimento

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Inclua testes para regras de negócio e descreva no pull request como a interface
foi validada em desktop e dispositivos móveis.
