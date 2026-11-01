# Orientações para manutenção

- Pedido do Rodrigo: registre sempre em commits as alterações concluídas e validadas. Faça commits por unidade funcional coerente, com mensagem clara, e informe os hashes na entrega. Não deixe a implementação final apenas no workspace. Envie ao remoto quando a tarefa autorizar publicação/sincronização.
- Antes de commitar, revise o diff e execute os testes apropriados. Para mudanças na aplicação: `npm test`; para servidor ou empacotamento Python: `python3 -m unittest discover -s tests -p 'test_*.py'`. Use `npm run build` antes de publicar.
- Preserve commits e arquivos enviados pelo usuário. Confira a ponta remota antes de atualizar a branch; não use force push para sobrepor alterações concorrentes.
- A arquitetura está em `dist/features/`, com composição em `dist/app/features.js`. Domínios não dependem do DOM ou da persistência; funcionalidades não importam `dist/app/`. Veja `docs/ARCHITECTURE.md`.
- Mantenha exatamente caixa, espaços, acentos e pastas dos assets originais em `dist/assets/Cards` e `dist/assets/Mapa`. Novos locais seguem `<Região>-Subregioes/<Região> - <Local>.png`. Leia `docs/ASSETS.md` e regenere o catálogo com `npm run assets`.
- Alterações de schema exigem migração que preserve os dados existentes e testes. Nunca reinicie o banco do usuário para aplicar novos assets.
- Não versione credenciais, dados de navegador de teste, arquivos temporários, dependências instaladas ou o ZIP gerado. Preserve as instruções de execução local em `docs/LOCAL.md`.
