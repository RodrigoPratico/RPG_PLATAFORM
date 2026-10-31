# Atlas regional

No **Atlas do mundo**, aponte para uma área delimitada ou para sua contagem de personagens. A prévia mostra imagem, resumo e habitantes. Clique para abrir o mapa da região. O foco por teclado mostra a mesma prévia; Enter ou Espaço abre a região. Use **Voltar ao mapa do reino** ou o item Atlas do mundo do menu para retornar.

Dentro da região aparecem somente seus personagens. A seção abaixo do mapa reúne o resumo, as fichas e o acesso ao filtro regional. A camada **Localidades** mostra os pontos de interesse de cada imagem. O seletor de mapas também permite abrir diretamente qualquer região ou o mapa anterior arquivado.

## Mover personagens

- No mapa do reino, solte o retrato dentro de outra região. O vínculo é transferido, o marcador do mapa regional anterior é retirado e um marcador aparece no mapa de destino. O local textual recebe o local geral dessa região.
- Dentro de um mapa regional, arraste livremente: a posição local muda e o vínculo permanece. O ponto correspondente no reino não é alterado.
- Na ficha, escolha **Região atual** ou um **Local atual** vinculado a uma região. Ao selecionar um novo local, o vínculo regional acompanha esse local. Escolhas explicitamente contraditórias são rejeitadas.
- **Sem região definida** retira o pertencimento e os marcadores regionais; a ficha continua disponível. Mapas avulsos e o mapa anterior arquivado conservam suas posições próprias.

Os marcadores aceitam setas do teclado (1% por passo). As posições são gravadas ao soltar ou mover pelo teclado. Soltar fora das áreas do reino mostra erro e restaura a posição salva.

## Criar e revisar regiões

1. Carregue o mapa geral e as imagens em **Universo e backups → Mapas**.
2. No mapa geral, clique em **Delimitar região** e marque os vértices em sequência. Use três ou mais pontos, sem cruzar as linhas.
3. Clique em **Concluir contorno**. Defina nome e resumo; escolha um mapa já carregado ou envie uma imagem para criar o destino regional.
4. Salve. A área passa a mostrar o resumo e abrir seu mapa. Depois, atribua personagens pela ficha.

Em **Universo e backups → Regiões**, edite os resumos, mapas e pontos do contorno. A seção avançada aceita um par X,Y por linha, de 0 a 100, com origem no canto superior esquerdo. Localidades vinculadas devem estar no mapa geral ou no mapa regional associado. O botão **Delimitar região** desenha novas áreas; contornos existentes podem ser ajustados numericamente no editor.

Cada mapa regional possui uma conexão de origem. Ciclos, mapas ausentes e polígonos inválidos são rejeitados antes de salvar. Nas sobreposições, a área menor tem prioridade. As delimitações iniciais são aproximações editoriais ajustáveis; não alteram a imagem original nem reivindicam fronteiras canônicas novas.

## Dados e migração

A versão 2 mantém o mesmo banco IndexedDB, sem apagar o armazenamento. Ao abrir um salvamento da versão 1, a atualização ocorre numa transação com controle de revisão. O mapa anterior e suas posições ficam no seletor como **mapa anterior**. Capítulos, notas, atributos e imagens das fichas são preservados. O novo atlas é aplicado apenas à campanha inicial reconhecida de Caldris; outros universos continuam independentes.

Backups antigos passam pela mesma migração antes de serem importados. A restauração anterior também aceita o schema antigo. Não há sincronização entre domínios: exporte/importe mantenha sempre um backup externo. O backup atual embute todas as imagens dos mapas, inclusive os regionais.

Contrato principal:

```js
region = {id, name, summary, worldMapId, mapId, polygon, x, y, locationIds};
character.regionId = region.id; // ou string vazia para paradeiro indefinido
character.positions[mapId] = {x, y};
```

A imagem regional não é derivada por recorte do mundo: cada uma das nove imagens fornecidas é preservada como mapa próprio. Novos mundos usam o mesmo editor; dados específicos de Caldris ficam isolados em `dist/atlas-data.js`.
