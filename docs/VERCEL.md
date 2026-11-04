# Publicar RPG_PLATAFORM na Vercel

## Estado da integração — 4 de novembro de 2026

| Item | Configuração atual |
| --- | --- |
| Equipe Vercel | `rodrimir-projects` |
| Projeto do jogo | `rpg-plataform` |
| ID do projeto do jogo | `prj_IIC6zd52pz8WyjOxWVK5UkMpciUm` |
| Repositório conectado | `RodrigoPratico/RPG_PLATAFORM` |
| Branch utilizada na produção | `main` |
| Integração GitHub da organização | Instalada e visível para a Vercel |
| Primeira publicação no projeto novo | `3a7476ebe06ccb0224c0234b042696497dcbe1ca`, estado **Ready**, ambiente **Production** |
| Domínio `www.monzai.com.br` | Ainda associado ao projeto antigo; transferência pendente |
| Domínio `monzai.com.br` | Ainda no projeto antigo, redirecionando para `www.monzai.com.br` com **308** |

Acesse o [projeto correto na Vercel](https://vercel.com/rodrimir-projects/rpg-plataform). A integração Git foi confirmada pela API: o projeto novo acompanha o RPG. O projeto antigo `tempo-claro-tcc-tsi` continua conectado a `Rodrimir/tempo-claro-tcc-tsi`; suas publicações manuais do jogo não haviam trocado esse vínculo.

### Etapa pendente: mover os domínios

O build do projeto novo foi validado antes de tentar transferir o endereço. Adicionar `www.monzai.com.br` ao novo projeto retornou **409 — domain_already_in_use**, pois ele já pertence ao projeto antigo. O plugin utilizado não disponibiliza a operação de mover domínio entre projetos; adicionar um alias a um deployment não substitui essa configuração permanente.

1. Abra [Settings → Domains do projeto antigo](https://vercel.com/rodrimir-projects/tempo-claro-tcc-tsi/settings/domains).
2. Use a opção **Move** ou **Move to another project** de `www.monzai.com.br` e selecione **rpg-plataform**, na mesma equipe.
3. Mova também `monzai.com.br`, mantendo o redirecionamento **308** para `www.monzai.com.br`.
4. Em [Settings → Domains do RPG](https://vercel.com/rodrimir-projects/rpg-plataform/settings/domains), confirme os dois endereços, a verificação e o deployment de produção que os atende.
5. Depois de validar o jogo no domínio, o projeto antigo pode ser removido, conforme autorizado pelo mantenedor. Preserve o projeto `tempo-claro`, que é outro projeto e não participa desta migração.

Mova os domínios entre os projetos; não remova a propriedade do domínio da conta e preserve os registros de e-mail. O endereço público permanece na publicação antiga até concluir essa etapa.

### Atualizações automáticas por Git

A atribuição automática dos domínios de produção foi habilitada no projeto **rpg-plataform**. Cada alteração precisa ser commitada e enviada por **push para main**; um commit apenas local não chega à Vercel.

Para comprovar o fluxo, confira em **Deployments** que um push cria um deployment automaticamente com o mesmo SHA, que termina em **Ready** e tem ambiente **Production**. Depois da transferência dos domínios, confira também que `www.monzai.com.br` acompanha esse deployment. Uma publicação criada manualmente não comprova o funcionamento do gatilho Git.

Se houver um rollback ativo, use **Undo Rollback** ou promova o deployment correto para retomar as atualizações. Não habilite a atribuição automática no projeto antigo enquanto ele continuar ligado ao TCC.

Não são necessários tokens no código ou segredos do GitHub Actions para usar a integração Git nativa. Entrar na Vercel ou autorizar o plugin e instalar o aplicativo Vercel na organização do GitHub são permissões distintas; a instalação da organização foi concluída nesta migração.

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
