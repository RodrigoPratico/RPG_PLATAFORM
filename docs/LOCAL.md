# Rodar o RPG localmente no Linux

Requisitos: Git, Python 3.11 ou superior e um navegador atual com JavaScript e armazenamento permitidos. Node.js é necessário apenas para desenvolvimento e testes JavaScript. Não são necessários pacotes pip, Docker ou GPU.

## Instalar os requisitos, se faltarem

CachyOS:

```sh
sudo pacman -S --needed git python
```

Ubuntu:

```sh
sudo apt install git python3
```

Confira a versão:

```sh
python3 --version
```

Se sua versão do Ubuntu fornecer Python anterior ao 3.11, use uma versão de Python 3.11+ antes de continuar. O programa usa `tomllib`, incluído nessa versão.

## Baixar e iniciar

Os comandos abaixo funcionam no Bash e no fish:

```sh
git clone https://github.com/RodrigoPratico/RPG_PLATAFORM.git
cd RPG_PLATAFORM
python3 serve.py
```

Abra **http://127.0.0.1:8080** no navegador. Deixe esse terminal aberto enquanto usar o programa. Para encerrar, pressione **Ctrl+C**. Para iniciar outra vez, entre na mesma pasta e execute `python3 serve.py`.

O primeiro início gera o pacote Linux de download se ele estiver ausente. É normal levar alguns segundos. A interface e os mapas funcionam sem serviços externos.

## Usar a campanha

- No mapa do reino, aponte para uma região para ver seu resumo; clique para abrir seu mapa próprio.
- Use **Voltar ao mapa do reino** para retornar. Personagens são mostrados por região.
- Arraste retratos no mapa do reino para transferi-los entre regiões. Dentro da região, arrastar ajusta apenas a posição.
- Em **Capítulos**, crie e edite textos, vincule personagens e use **Salvar alterações**.
- Em **Personagens**, edite fichas, imagens, região, local e contexto. O filtro permite ver apenas os personagens de uma região.
- Em **Universo e backups**, edite regiões, carregue mapas e crie outras campanhas independentes. O guia de mapeamento fica em [REGIOES.md](REGIOES.md).

## Preservar os dados

As alterações ficam no IndexedDB do navegador. Elas não ficam dentro do repositório e não são enviadas ao GitHub. Clique em **↓ Backup** para baixar um JSON com textos, mapas, fichas e posições. Para trazer a campanha do site, exporte nesse site e importe em **Universo e backups → Importar backup** no endereço local.

Use sempre o mesmo navegador, perfil e endereço **http://127.0.0.1:8080**. `localhost`, outra porta ou outro domínio usam bancos diferentes. Limpar os dados do site ou usar navegação privada pode impedir a recuperação sem backup. Fechar o programa normalmente não apaga a campanha.

## Atualizar o código

Exporte um backup e encerre o servidor com Ctrl+C. Depois:

```sh
cd RPG_PLATAFORM
git pull --ff-only
python3 serve.py
```

O comando `cd` parte da pasta onde o repositório foi clonado; se já estiver dentro de `RPG_PLATAFORM`, execute apenas os dois últimos comandos. Recarregue o navegador após atualizar. A versão 2 migra o salvamento antigo de Caldris e preserva seus capítulos e notas, mantendo o mapa anterior arquivado. Se você alterou arquivos do código e o Git recusar a atualização, preserve essas alterações antes de resolver o conflito; não apague o banco do navegador.

## Porta e configuração

Se a porta 8080 estiver ocupada:

```sh
python3 serve.py --port 8081
```

Abra http://127.0.0.1:8081 e importe seu backup, pois a origem mudou. A configuração opcional fica em `config.toml`. O servidor local escuta no loopback e serve apenas os arquivos da aplicação. Para hospedagem pública, use [VERCEL.md](VERCEL.md).

## Testes para desenvolvimento

Com Node.js 20+ e Python 3.11+:

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

Ou execute `make test` se tiver GNU Make. Para reproduzir o build estático e o pacote Linux, execute `npm run build`; não é necessário `npm install`.
