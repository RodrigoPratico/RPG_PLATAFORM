# Publicar RPG_PLATAFORM na Vercel

## Diagnóstico da atualização automática — 4 de novembro de 2026

A inspeção das contas encontrou esta configuração:

| Item | Estado observado |
| --- | --- |
| Equipe Vercel | `rodrimir-projects` |
| Projeto que atende `www.monzai.com.br` | `tempo-claro-tcc-tsi` |
| Repositório conectado ao projeto | `Rodrimir/tempo-claro-tcc-tsi` — incorreto para o jogo |
| Fonte correta do jogo | `RodrigoPratico/RPG_PLATAFORM`, branch `main` |
| Commit publicado no domínio | `f67bb90ee0544b797cec0630c7fa9e5dde8a2d85` |
| Ponta de `main` no início da inspeção | `bf2afadc541501fedd92264928197cec49255513` |
| Instalações GitHub visíveis para a Vercel | Somente a conta `Rodrimir`; a organização `RodrigoPratico` não apareceu |

As publicações anteriores do jogo foram feitas manualmente no projeto antigo. Publicar um deployment de outro repositório **não troca o vínculo Git do projeto**. Por isso, os pushes do RPG não acionaram esse projeto.

A tentativa de criar `rpg-plataform`, conectado ao repositório correto, foi recusada pela Vercel com a mensagem: `To link a GitHub repository, you need to install the GitHub integration first.` O projeto novo não foi criado. Entrar na Vercel ou autorizar o plugin não concede acesso do aplicativo Vercel aos repositórios de uma organização do GitHub.

### Desbloquear a integração e concluir a migração

1. Abra [a instalação do aplicativo Vercel no GitHub](https://github.com/apps/vercel/installations/new).
2. Selecione a organização **RodrigoPratico** e autorize o repositório **RPG_PLATAFORM**. Se a instalação já existir, use **Configure** nas [instalações da organização](https://github.com/organizations/RodrigoPratico/settings/installations) e inclua esse repositório. Um administrador da organização precisa concluir a autorização ou aprovar a solicitação.
3. Na equipe **rodrimir-projects**, importe `RodrigoPratico/RPG_PLATAFORM` como projeto **rpg-plataform**, com as configurações da seção seguinte. Confirme **Production Branch: main** em **Settings → Environments → Production**.
4. Valide o build e o jogo na URL do projeto novo antes de mover o domínio.
5. Em **Settings → Domains**, mova `www.monzai.com.br` do projeto antigo para o novo. Mova também `monzai.com.br`, mantendo o redirecionamento **308** para `www.monzai.com.br`. Use a operação de mover domínio entre projetos da mesma equipe; não exclua o domínio da conta nem altere registros de e-mail.
6. No projeto do RPG, confira que a atribuição automática dos domínios de produção está habilitada. Se houver um rollback ativo, use **Undo Rollback** ou promova o deployment correto para retomar as atualizações. Não habilite a atribuição automática no projeto antigo enquanto ele continuar ligado ao TCC.
7. Faça uma alteração útil, commit e **push para `main`**. Um commit apenas local não aciona a Vercel. Confira em **Deployments** que surgiu um deployment automaticamente com o mesmo SHA, que terminou em **Ready** e recebeu `www.monzai.com.br`. Uma publicação criada manualmente não comprova o funcionamento do gatilho Git.
8. Depois dessa verificação, o projeto antigo pode ser removido, conforme autorizado pelo mantenedor. Preserve o projeto `tempo-claro`, que é outro projeto e não participa desta migração.

A migração permanece pendente até a autorização da integração e a confirmação do deployment automático no domínio. Não são necessários tokens no código ou segredos do GitHub Actions para usar a integração Git nativa.

## Importar o repositório

1. Entre em https://vercel.com/new e conecte o GitHub que tem acesso à organização **RodrigoPratico**.
2. Importe **RodrigoPratico/RPG_PLATAFORM**. Se ele não aparecer, confira as permissões da integração Vercel para essa organização e esse repositório.
3. Use a branch de produção **main** e a raiz **.**; não selecione `dist` como raiz.
4. O arquivo `vercel.json` fornece a configuração:

| Campo | Valor |
| --- | --- |
| Framework Preset | Other (`framework: null`) |
| Root Directory | `.` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Vazio; instalação desativada |
| Environment Variables | Nenhuma |

5. Clique em **Deploy**. O build usa apenas módulos nativos de Node.js, valida o seed e a presença das imagens, e gera o download `caldris-linux.zip`. Python não roda na Vercel; ele é usado somente para execução local e testes locais.
6. Abra a URL fornecida pela Vercel e confira o mapa, uma ficha e a criação de um capítulo. As abas usam fragmentos como `#capitulos`; não precisam de regras de rewrite.

## Conectar seu domínio

1. No projeto, abra **Settings → Domains** e use **Add Domain**.
2. Informe seu domínio ou subdomínio. Adicione também `www` se quiser usá-lo e escolha qual endereço deve receber o redirecionamento.
3. Copie **exatamente os registros DNS apresentados pela Vercel** para o provedor que administra o seu domínio. O painel indica o registro A para a raiz ou CNAME para subdomínio, além de eventual verificação TXT. Não copie valores de outro projeto.
4. Aguarde o painel indicar configuração válida e o certificado HTTPS estar pronto. Não é necessário trocar os nameservers para apontar apenas o site; preserve os registros de e-mail e outros serviços.

O nome do domínio e as credenciais do provedor DNS não ficam no código. Essas configurações precisam ser realizadas nas suas contas. Este envio ao GitHub não cria um projeto na sua conta Vercel nem altera DNS automaticamente.

## Preservar a campanha ao migrar

Antes de mudar de endereço:

1. No site antigo, clique em **↓ Backup** e guarde o JSON.
2. No domínio novo, abra **Universo e backups → Importar backup**.
3. Selecione o arquivo, valide e confirme a substituição dos dados iniciais.

O arquivo inclui todas as campanhas, textos, mapas, fichas e posições. O IndexedDB é separado por origem: domínio antigo, domínio novo, `www` e URLs de preview não compartilham o banco. Publicar novamente no mesmo domínio preserva os registros existentes. A atualização do schema 1 para o 2 possui uma migração explícita: instala o atlas regional de Caldris reconhecida, arquiva o mapa anterior e preserva capítulos e notas. Alterações posteriores no seed, sem nova migração, afetam apenas bancos novos. Use importação de backup para aplicar outro estado a um banco existente.

## Acesso e colaboração

Esta aplicação não implementa autenticação, servidor de dados, sincronização ou papéis de mestre/jogador. A proteção privada do Site no ChatGPT não é transportada para a Vercel. O repositório é público e contém o contexto e as imagens iniciais da campanha. Restrinja a implantação no provedor quando necessário; segredos que precisam ficar ocultos de visitantes não devem estar em arquivos estáticos enviados a eles.

Alterações do navegador não viram commits automaticamente. Para levar uma campanha editada a outro dispositivo, use o backup. Para alterar a aplicação, faça commits na branch conectada à Vercel; novos deployments dependem da integração estar configurada.

## Referências oficiais

- Configuração: https://vercel.com/docs/project-configuration/vercel-json
- Build e diretório de saída: https://vercel.com/docs/builds/configure-a-build
- Domínios: https://vercel.com/docs/domains/working-with-domains/add-a-domain
