# Arquitetura por funcionalidades

A versão 1.3 agrupa regras, telas, formulários, validação e dados por domínio. A aplicação continua em módulos ES nativos, sem dependências npm para executar ou construir. Python 3.11+ mantém o servidor Linux de loopback. Esses ambientes leves atendem à hospedagem estática e ao uso pessoal com IndexedDB.

| Diretório | Responsabilidade e contrato |
| --- | --- |
| `dist/app/` | Composição, inicialização, navegação, store, migração do agregado e validação completa antes de gravar. |
| `dist/features/atlas/` | Hierarquia de mapas, geometria, pertencimento, arraste, cenas, catálogo e configurações geográficas. |
| `dist/features/characters/` | Fichas, atributos, imagens, pesquisa e filtro regional. |
| `dist/features/chapters/` | Editor, vínculos, estados e exportação Markdown. |
| `dist/features/records/` | Compêndio, facções e tramas. |
| `dist/features/tournament/` | Regulamento e confrontos manuais. |
| `dist/features/campaigns/` | Identidade e seleção de universos, dados iniciais e adaptador IndexedDB. |
| `dist/features/backups/` | Exportação/importação, restauração e persistência do navegador. |
| `dist/shared/` | Primitivas, validação básica, imagens, componentes, diálogos e contratos JSDoc. Não importa funcionalidades. |
| `scripts/` | Descoberta de assets, verificação do grafo de módulos e pacote Linux. |

Dentro de cada funcionalidade, `index.js` expõe seu descriptor público; `domain.js` e `validation.js`, quando necessários, são independentes do DOM; `controller.js` recebe portas de aplicação; `view.js` apresenta os dados sem persistir. Os estilos novos do atlas ficam no próprio módulo. `styles.css` conserva os componentes e layouts visuais compartilhados.

## Dependências explícitas

`app/features.js` registra as fábricas em `FeatureRegistry`. Cada descriptor informa `id`, rotas, ações, comandos, serviços e, opcionalmente, estilos e hooks de renderização. O registro rejeita colisões antes de instalar um módulo. A aplicação não mantém um grande switch de telas ou formulários.

Um controller recebe `FeatureContext`: leitura da campanha, `commit`, navegação, diálogos e consulta aos serviços públicos de outra funcionalidade. Personagens consulta o serviço espacial do atlas; sem esse serviço, continua editando fichas e preserva posições existentes. Atlas consulta personagens apenas ao abrir uma ficha. O seed de Caldris é uma composição explícita de dados iniciais, não uma dependência dos casos de uso.

Funcionalidades não importam `app/`. O domínio não conhece IndexedDB ou seletores HTML. Testes e build percorrem imports locais, rejeitam ciclos e verificam essas fronteiras. Não há carregamento de plugins remotos ou execução de código recebido por backup.

Para adicionar uma funcionalidade, crie seu descriptor e registre sua fábrica. Adicione seu validador em `app/schema.js` se persistir novos campos; planeje a migração em `app/migrations.js` se mudar o formato. Para ocultar uma funcionalidade opcional, remova sua fábrica da composição e confira as referências aos seus serviços. Os validadores dos dados existentes devem continuar registrados para preservar a integridade dos backups. Remover também o domínio persistido exige migração deliberada.

## Uma única fronteira de gravação

O fluxo é formulário/arraste → caso de uso → `store.commit` → cópia candidata → validadores de cada domínio → `CampaignRepository.save` → publicação do estado confirmado → renderização. Erros mantêm o estado anterior e aparecem no formulário e no log JSON. A gravação da campanha e do snapshot anterior ocorre numa transação IndexedDB; a revisão é comparada dentro da transação. Duas abas não sobrescrevem silenciosamente uma revisão desatualizada.

O schema 3 preserva o banco `caldris-atlas` e a object store `archive`. Migrações aceitam versões 1 e 2, operam em cópias e mantêm capítulos, anotações, atributos, posições personalizadas e imagens enviadas. Trocam apenas caminhos conhecidos dos assets antigos. O mapa anterior permanece como referência. Importar um backup ainda substitui o conjunto de campanhas após confirmação.

## Assets e mapas

O build descobre imagens pelo padrão existente e gera um catálogo estático. A abertura do aplicativo incorpora somente entradas ainda não aplicadas, inclusive em campanhas já no schema 3. `catalogApplied` impede que uma conexão excluída pelo mestre reapareça na próxima visita. Edições salvas e posições não são substituídas por defaults novos.

Uma conexão une `worldMapId` (mapa pai) e `mapId` (mapa filho). Esse contrato suporta reino → região → local e níveis adicionais. `regionId` identifica o lugar mais específico do personagem; as funções espaciais resolvem seus ancestrais. Contagens e filtros da região incluem seus locais. Uma transferência remove marcadores de mapas irmãos e conserva os ancestrais e mapas avulsos. Excluir conexões remove conexões descendentes, preservando imagens, mapas, fichas e capítulos.

Veja [ASSETS.md](ASSETS.md) para adicionar imagens e [REGIOES.md](REGIOES.md) para ajustar contornos e coordenadas.
