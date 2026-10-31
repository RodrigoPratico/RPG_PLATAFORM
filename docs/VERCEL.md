# Publicar RPG_PLATAFORM na Vercel

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

O arquivo inclui todas as campanhas, textos, mapas, fichas e posições. O IndexedDB é separado por origem: domínio antigo, domínio novo, `www` e URLs de preview não compartilham o banco. Publicar novamente no mesmo domínio preserva os registros existentes; modificar `seed.js` só afeta navegadores que ainda não têm um banco. Use importação de backup para aplicar um estado diferente a um banco já existente.

## Acesso e colaboração

Esta aplicação não implementa autenticação, servidor de dados, sincronização ou papéis de mestre/jogador. A proteção privada do Site no ChatGPT não é transportada para a Vercel. O repositório é público e contém o contexto e as imagens iniciais da campanha. Restrinja a implantação no provedor quando necessário; segredos que precisam ficar ocultos de visitantes não devem estar em arquivos estáticos enviados a eles.

Alterações do navegador não viram commits automaticamente. Para levar uma campanha editada a outro dispositivo, use o backup. Para alterar a aplicação, faça commits na branch conectada à Vercel; novos deployments dependem da integração estar configurada.

## Referências oficiais

- Configuração: https://vercel.com/docs/project-configuration/vercel-json
- Build e diretório de saída: https://vercel.com/docs/builds/configure-a-build
- Domínios: https://vercel.com/docs/domains/working-with-domains/add-a-domain
