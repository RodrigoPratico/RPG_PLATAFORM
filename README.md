# RPG_PLATAFORM · Caldris — Atlas de Crônicas

Administrador pessoal de campanhas de RPG, em português, pré-configurado com **A Voz Que Devolve — Crônica de Monzai Dragon**. Estado da história: dia 26 da Lua Pálida, às 02h.

## Publicar na Vercel e usar seu domínio

O repositório já inclui `vercel.json`. Importe **RodrigoPratico/RPG_PLATAFORM** na sua conta Vercel e publique a branch `main`. A configuração usa Framework **Other**, raiz do projeto **.**, build **npm run build**, sem instalação de dependências, e saída **dist**. O build valida os arquivos e gera o pacote Linux; o site servido é inteiramente estático. Não são necessárias variáveis de ambiente.

Depois, no projeto Vercel, abra **Settings → Domains → Add Domain** e configure no seu provedor DNS os valores mostrados pela Vercel. O domínio e o DNS não são alterados por este repositório. Veja o passo a passo em [docs/VERCEL.md](docs/VERCEL.md).

**Não existe login dentro da aplicação.** A Vercel e um domínio próprio não herdam a proteção privada da versão hospedada no ChatGPT. O mapa, as imagens e os dados iniciais em `dist/features/campaigns/data/caldris.js` serão acessíveis a quem puder abrir a implantação. Alterações feitas pelo usuário ficam no navegador; elas não são enviadas ao GitHub ou à Vercel. Configure acesso no provedor ou implemente autenticação se precisar restringir os arquivos publicados.

Ao migrar do endereço anterior para o domínio novo, exporte o backup no endereço antigo e importe no novo. O armazenamento não migra automaticamente.

## Rodar no CachyOS / Ubuntu

Guia direto para clonar, executar, atualizar e manter os dados: [docs/LOCAL.md](docs/LOCAL.md).

Requisitos de execução: **Python 3.11+** e um navegador com JavaScript e IndexedDB. Não precisa de Node.js, npm, Docker, GPU ou acesso root para executar. A interface não depende de CDN, fontes externas ou serviços de IA.

1. Baixe `caldris-linux.zip` pela aba **Universo e backups**, extraia e abra um terminal na pasta `caldris-atlas`.
2. Execute (os comandos funcionam também no fish):

```sh
python3 --version
python3 serve.py
```

3. Abra **http://127.0.0.1:8080**. Encerre com `Ctrl+C`.

Se Python não estiver instalado, no CachyOS: `sudo pacman -S python`; no Ubuntu: `sudo apt install python3`. Confira a versão com `python3 --version`. A aplicação não altera pacotes, partições, permissões ou serviços do sistema.

Se a porta estiver ocupada, use `python3 serve.py --port 8081`. **Mudar a porta muda a origem de armazenamento do navegador**: importe seu backup no novo endereço. Prefira manter sempre o mesmo host, porta e perfil do navegador. `localhost` e `127.0.0.1` também são origens diferentes. Não abra o HTML diretamente com `file://`.

Configuração opcional em `config.toml`. O servidor escuta apenas no loopback, valida a porta e restringe a raiz de arquivos à pasta do projeto. Não é um servidor para exposição pública na rede.

## Funcionalidades

- Campanhas independentes, com nome, subtítulo e calendário editáveis.
- Atlas com mapa do reino, nove mapas regionais e quarenta locais ilustrados de Brennford, Thornwick, Hallow e Caldris Real enviados pelo autor. Apontar ou focar uma região mostra resumo, prévia do mapa e personagens; clicar abre a região. Há navegação por reino → região → local, resumos e prévias, miniaturas selecionáveis, seletor de mapas, zoom de 100–300%, tela cheia e camadas independentes.
- Marcadores pequenos arrastáveis; a ficha inteira aparece ao passar o mouse. Setas do teclado ajustam posições em 1%; Enter seleciona o personagem. Em telas pequenas o toque abre a ficha completa.
- Fichas com imagem, miniatura dos retratos iniciais, função, idade, rank, cinco atributos, facção, lealdade, resumo, relações e notas do mestre.
- Personagens com uma região atual e posições independentes no reino e no mapa regional. Arrastar entre regiões no mapa do reino transfere o vínculo e define o local geral; soltar sobre um local ilustrado transfere o vínculo à sub-região; arrastar dentro de um mapa de local ajusta a posição. O filtro da região também inclui personagens de seus locais.
- Localidades editáveis e pontos de interesse nos mapas regionais. Escolher um local regional na ficha também atualiza a região. As coordenadas são percentuais.
- Regiões editáveis com resumo, contorno poligonal e mapa de destino. Use “Delimitar região” para desenhar o contorno e conectar mapas de novas histórias, sem alterar o código.
- Editor de capítulos, estados (Rascunho / Em andamento / Concluído), vínculos com personagens e exportação Markdown.
- Compêndio, facções, tramas e mistérios com pesquisa, criação, edição e exclusão.
- Planejamento de campeonato: regulamento, confrontos, etapas e resultados manuais. Não há simulação de combate ou inscrições inventadas.
- Backup JSON completo com todas as campanhas, contornos, vínculos, posições e imagens embutidas; importação validada e atômica. Salvamentos e backups das versões 1 e 2 são migrados para a versão 3, preservando textos e fichas. O mapa anterior de Caldris permanece arquivado.
- Histórico das últimas 60 gravações por campanha, restauração de uma gravação anterior e proteção contra gravação obsoleta em outra aba.

## Salvamento e limites

**O banco é IndexedDB no seu navegador, não um banco na nuvem ou um arquivo SQLite no servidor.** O servidor Python só entrega a interface. Nem encerrar o servidor nem fechar a aba apaga o banco, mas limpar os dados do site, usar navegação privada ou trocar de perfil/endereço impede acessar o mesmo banco. Não há sincronização entre dispositivos ou edição colaborativa.

Clique em **Salvar alterações** nos formulários. O indicador “Salvo neste navegador” só aparece após a confirmação da transação. Uma falha mantém a versão anterior; o formulário continua disponível com a mensagem de erro. O mapa salva ao soltar o marcador. Existe confirmação ao descartar um formulário editado.

Use **↓ Backup** regularmente. O JSON contém imagens, inclusive as fichas originais, de modo que não depende de links do Site. Para trocar de computador ou usar a versão Linux, importe o backup no novo endereço. A importação **substitui todas as campanhas** e pede confirmação depois de validar. O último estado fica em **Restaurar gravação anterior**, mas isso não substitui backups externos.

Armazenamento persistente depende de concessão pelo navegador; solicite-o em Universo e backups. Essa concessão reduz descarte automático e não protege contra limpeza manual. Imagens aceitas: PNG, JPEG e WebP, até 15 MB e 60 MP; são decodificadas e reduzidas a no máximo 2400 px. SVG e URLs remotas são rejeitados. Backup: até 256 MB. Texto: até 200 mil caracteres por registro. Até 100 campanhas e 5 mil itens por coleção. As quotas finais dependem do navegador e do espaço livre.

Qualquer pessoa com acesso ao perfil local do navegador pode ler seu banco. As “Notas do mestre” são uma organização editorial, **não uma autorização separada**: este é um aplicativo pessoal, sem modo de jogador ou ocultação de segredos por papel. O repositório público e implantações sem proteção expõem também os dados iniciais da campanha incluídos no código.

## Estado inicial e fidelidade

- 21 personagens; nove com as imagens enviadas. Os demais têm iniciais, sem retratos inventados.
- Mapa geral, nove mapas regionais, quarenta mapas de locais (dez de Brennford, dez de Thornwick, dez de Hallow e dez de Caldris Real) e o mapa anterior arquivado. Nove contornos regionais e quarenta conexões para locais ilustrados, ajustáveis pelo mestre, com 93 localidades/pontos de interesse. O Campo do Leão permanece uma posição proposta.
- Vinte personagens distribuídos conforme o estado da campanha. A comitiva de Oriane fica em trânsito para Greymoor; Yuki fica em Durnholm, apesar de sua origem em Hallow. Rorik segue sem região e sem marcador por paradeiro desconhecido.
- Quatro capítulos resumidos concluídos e o capítulo V como rascunho.
- Seis facções, seis registros do compêndio e doze tramas/pendências.
- Desconhecidos permanecem desconhecidos: atributos não informados são `null`; os cinco atributos de Monzai são 9.999.999 e seu rank público é 0. Rank global não é copiado indevidamente para todos os atributos.
- Divergências de idade de Celine, calendário e durações de viagem ficam registradas para decisão do autor. O filho Teodric Velarde e o Inquisidor Teodric Hale são personagens distintos.
- Os textos são uma síntese editorial dos fatos, instituições e vínculos não explícitos fornecidos, não uma cópia integral do compêndio.

## Escolha técnica e arquitetura

**JavaScript em módulos ES, com JSDoc nos contratos principais**, permite a mesma aplicação leve na hospedagem e no Linux, sem uma cadeia de dependências para execução. **Python com tipagem** fornece um lançador/servidor local simples, configurável e testável. Uma infraestrutura com contêineres ou framework de interface não é necessária para este aplicativo pessoal.

```text
dist/
  app.js                 entrada estável → app/bootstrap.js
  app/                   composição, store, schema e migrações
  features/
    atlas/               mapas, regiões, sub-regiões e catálogo
    characters/          fichas, imagens e atributos
    chapters/            capítulos e exportação
    records/             compêndio, facções e tramas
    tournament/          regulamento e confrontos
    campaigns/           campanhas, seed e repositório IndexedDB
    backups/             cópias portáteis e restauração
  shared/                componentes, validação básica e contratos
  assets/Cards/          fichas e Miniaturas/
  assets/Mapa/           mapa geral, Regiões/ e *-Subregioes/
  assets/Interface/      ícones e brasão da aplicação
  assets/aliases.json    compatibilidade de URLs sem imagens duplicadas
assets.config.json       associação de pastas, posições e resumos
scripts/asset-catalog.mjs descoberta automática de novos mapas locais
scripts/module-graph.mjs verificação de imports e ciclos
scripts/build.mjs        validação e pacote Linux para Vercel
serve.py / config.toml   servidor local e configuração
```

O controlador valida uma cópia candidata e só a publica em memória após o commit; o repositório mantém banco, revisão e snapshot anterior na mesma transação. A comparação da revisão é feita dentro da transação para evitar sobrescritas entre abas. Renderizadores recebem dados e retornam HTML escapado; o domínio não depende do DOM ou do banco. Não há promessa de isolamento multiusuário no servidor, pois ele não recebe dados de campanha.

O schema do backup tem `schemaVersion: 3`, `revision` e `campaigns`. Cada campanha possui coleções independentes. Posições usam `positions[mapId] = {x, y}`, com coordenadas entre 0 e 100. Uma região conecta `worldMapId` a `mapId`, com `polygon`, âncora e `locationIds`; cada personagem possui `regionId`. A validação rejeita contornos cruzados, mapas cíclicos e referências inexistentes. As migrações das versões 1 e 2 são idempotentes: atualizam Caldris reconhecida, arquivam a imagem anterior e mantêm campanhas independentes sem injetar os dados de Caldris. Veja [docs/REGIOES.md](docs/REGIOES.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/ASSETS.md](docs/ASSETS.md).

## Testes e manutenção

Para desenvolver/testar: Node.js 20+ e Python 3.11+. Não há pacotes npm para instalar.

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

Ou `make test`, se GNU Make estiver instalado. Os testes cobrem integridade do seed, rejeição de backups malformados, isolamento de campanhas, referências de capítulos, exclusões em cascata, imagens/escape de texto, coordenadas, configuração e contrato HTTP. Os testes regionais verificam contornos, hierarquia, transferências, filtros, ciclos, descoberta de pastas futuras e migração de salvamentos reais das versões 1 e 2 com notas e capítulos personalizados. Os testes de arquitetura verificam fronteiras, imports, registro modular e falhas atômicas de persistência. Para recompilar o ZIP: `python3 scripts/package.py` ou `make package`. Ao acrescentar imagens no repositório, execute primeiro `npm run assets` ou `npm run build`. O catálogo gerado deve ser versionado; Python sozinho não atualiza esse catálogo.

Para reproduzir o build da Vercel, execute `npm run build`. Nenhum `npm install` é necessário. O arquivo `dist/caldris-linux.zip` é gerado, não versionado. Ao executar diretamente um clone no Linux, o servidor Python gera esse pacote se estiver ausente, mantendo o botão de download funcional.

Roteiro manual: criar/editar capítulo, recarregar e conferir persistência; criar personagem com imagem e colocá-lo no mapa; arrastar e recarregar; exportar/importar backup; abrir uma segunda aba e verificar conflito; alternar campanhas; conferir zoom e navegação em janela estreita. Não apague o armazenamento do navegador de uso real durante testes.

Logs: servidor escreve linhas JSON no terminal; falhas da interface escrevem JSON no console do navegador e mensagem legível no formulário. O sistema não faz telemetria nem envia campanha a terceiros. Para backup corporativo, histórico longo, multiusuário ou sincronização, implemente um backend e autenticação antes de mudar a exposição do serviço.

## Acrescentar as próximas sub-regiões

Mantenha `dist/assets/Mapa/Regiões/<Região>-Subregioes/<Região> - <Local>.png`. Pastas conhecidas são associadas às regiões por `assets.config.json`; `npm run build` atualiza o catálogo. Os próximos arquivos entram na campanha existente na abertura seguinte, sem reiniciar a história. Pontos e resumos continuam editáveis. Veja o procedimento completo em [docs/ASSETS.md](docs/ASSETS.md).
