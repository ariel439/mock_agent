# Como funciona um agente de programação

Um agente conecta um modelo de IA às ferramentas de desenvolvimento do computador.
O **modelo decide o próximo passo**; a **extensão executa a ação e devolve o resultado**.
Para entender esse processo, vamos acompanhar um pedido do início ao fim:

> “Adicione imagens das bebidas ao cardápio de café.”

## 1. O pedido chega ao modelo

Você escreve o que deseja mudar na conversa da extensão.
Ela envia ao modelo o pedido, as instruções do projeto e o contexto relevante disponível.
Também informa quais ferramentas ele pode solicitar e quais parâmetros cada uma aceita.

O modelo não enxerga o computador inteiro nem acessa arquivos sozinho.
Se precisar descobrir onde está o cardápio, deve solicitar uma ferramenta para investigar.

## 2. Tools: as ferramentas que o modelo pode solicitar

Uma **tool** é uma operação implementada na extensão, como buscar código, ler arquivos ou executar testes.
Cada ferramenta tem um nome, uma descrição e parâmetros de entrada.
O modelo recebe esse catálogo e escolhe qual operação solicitar conforme a informação de que precisa.

| Ferramenta | Para que serve |
| --- | --- |
| `inspect_workspace_projects` | Descobrir os projetos, tecnologias e comandos disponíveis. |
| `search_files` | Procurar um texto ou nome no código e retornar os trechos encontrados. |
| `read_file` / `read_files` | Ler o conteúdo de um ou vários arquivos. |
| `propose_file_patch` | Propor uma alteração pontual em um arquivo existente. |
| `propose_create_file` | Propor a criação de um arquivo. |
| `get_diagnostics` | Consultar erros e avisos fornecidos pelo editor. |
| `run_terminal_command` | Executar um teste, build ou outro comando permitido. |
| `get_git_context` | Consultar o estado do Git e as alterações do projeto. |

Por exemplo, uma solicitação de busca informa o texto procurado; uma leitura informa o caminho do arquivo.
É a extensão que executa essas operações e devolve os resultados ao modelo.

## 3. Cada ferramenta cria um novo vai e volta

1. O modelo solicita uma ação, indicando o nome da ferramenta e seus parâmetros.
2. A extensão verifica a solicitação e as permissões necessárias.
3. A ferramenta executa no computador e retorna conteúdo, resultado ou erro.
4. A extensão envia esse resultado ao modelo junto do contexto da conversa.
5. O modelo avalia a informação e escolhe outra ação ou prepara a resposta final.

**Modelo → solicitação de ferramenta → execução no PC → resultado → modelo.**

Uma tarefa pode exigir vários desses ciclos. Os próximos passos dependem do que for encontrado.
A sequência abaixo é um exemplo; o agente pode aproveitar informações já disponíveis e pular etapas.

## 4. Discovery: descobrir como o projeto está organizado

Se ainda não conhece a estrutura, o modelo pode solicitar `inspect_workspace_projects`.
A extensão inspeciona as pastas abertas no VS Code e procura sinais dos projetos existentes.

- `package.json`, `pom.xml` e `.csproj` ajudam a identificar tecnologias e dependências.
- Pastas como `apps`, `packages` e `services` ajudam a localizar projetos dentro de um repositório maior.
- Código e configurações fornecem sinais de React, Spring Boot, bancos, Kafka e outras tecnologias.
- Scripts e arquivos de build indicam comandos disponíveis e a pasta em que devem ser executados.

O modelo recebe um mapa resumido com projetos, tecnologias, arquivos importantes e comandos.
Essas informações incluem evidências e níveis de confiança; sinais conflitantes podem ser indicados.
No nosso exemplo, isso ajuda a localizar a aplicação web e descobrir como verificar suas alterações.
Essa descoberta inicial não significa que todo o código já foi lido ou compreendido.

## 5. Busca e ranking: encontrar onde vale a pena olhar

Com a estrutura em mãos, o modelo pode usar `search_files` para procurar o cardápio pelos nomes das bebidas.
A busca encontra ocorrências nos arquivos; o **ranking ordena esses resultados por relevância**.
Essa ordenação usa regras de pontuação na extensão antes de os resultados chegarem ao modelo.

- **Pedido:** procurar uma implementação é diferente de procurar testes ou configurações.
- **Correspondência:** caminhos exatos, nomes de arquivos e definições de símbolos ganham relevância.
- **Contexto:** arquivo aberto, projeto ativo e arquivos alterados ajudam a orientar a ordem.
- **Tipo de arquivo:** código-fonte tende a aparecer antes de exemplos, dependências e arquivos gerados.

Assim, o código do cardápio tende a aparecer antes de uma cópia gerada durante o build.
Se o pedido for sobre testes, os arquivos de teste recebem mais prioridade.
O primeiro resultado é uma pista, não uma garantia: o modelo ainda precisa conferir o conteúdo.

## 6. Leitura: entender o comportamento antes de mudar

O modelo solicita `read_file` ou `read_files` para ler os arquivos relevantes.
No exemplo, lê a estrutura do cardápio e seus estilos para entender como as bebidas são exibidas.
Também verifica se já existem imagens no projeto e quais caminhos podem ser usados na página.
Se faltar alguma imagem, pode informar essa necessidade ao usuário, em vez de inventar um caminho.
Cada resultado volta ao modelo e ajuda a decidir se já existe contexto suficiente para editar.

O contexto tem limite de tamanho: saídas longas podem ser reduzidas e o histórico pode ser resumido.
Por isso, pode ser necessário reler um arquivo para confirmar seu estado atual.
Conteúdo obtido pelas ferramentas pode ser enviado ao provedor configurado para o modelo.

## 7. Alteração: transformar a decisão em código

Depois de entender o problema, o modelo pode chamar `propose_file_patch` com uma alteração pontual.
Neste caso, a proposta seria incluir as imagens disponíveis, textos alternativos e ajustes de tamanho no layout.
A extensão verifica a proposta e solicita aprovação quando necessário antes de aplicá-la.
O resultado informa ao modelo se a alteração foi aplicada ou se houve algum problema.

Se o arquivo mudou desde a leitura ou a alteração falhou, o modelo pode precisar reler e ajustar a proposta.
Pedir uma alteração não significa que ela já aconteceu: a confirmação vem da ferramenta.

## 8. Verificação e resposta final

Com a alteração aplicada, o agente pode consultar diagnósticos ou executar um teste adequado à mudança.
No exemplo, deve conferir se as imagens carregam e se o cardápio continua legível no desktop e no celular.
Se houver falha, o erro volta ao modelo, que pode investigar e propor uma correção.

A verificação deve ser proporcional à tarefa; nem toda mudança exige executar a suíte inteira.
Ao concluir, o modelo explica o que alterou, o que verificou e o que ficou pendente.
Encerrar uma execução não garante, por si só, que o código funciona ou que todo o objetivo foi atendido.

## 9. Como isso aparece nesta demonstração

O fluxo descrito acima depende das decisões do modelo e dos resultados das ferramentas.
No mock T-Code, a primeira mensagem executa o primeiro ticket e a segunda executa o segundo.
A espera de aproximadamente **7,5 segundos** é parte do roteiro da apresentação.
O mock altera arquivos reais e mostra suas diferenças, mas não chama um modelo nem usa a API configurada.
Em um agente conectado a um modelo, a duração e a sequência de ações variam conforme a tarefa.
