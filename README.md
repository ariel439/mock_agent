# T-Code · Soft Rock Coffee

Extensão de apresentação para VS Code com conversa e configurações em português. A versão **0.3.0** usa uma cafeteria já pronta como ponto de partida: o primeiro ticket melhora somente a organização do cardápio; o segundo adiciona uma sacola para montar um pedido para levar.

O roteiro é offline e determinístico. A primeira mensagem não vazia executa TCODE-101 e a segunda executa TCODE-102. O conteúdo do prompt aparece na conversa, mas não determina as alterações. Depois das duas entregas, reinicie a demonstração para repetir. Não há LLM, backend, telemetria nem chamadas de rede em tempo de execução.

## Apresentar

1. Instale `artifacts/t-code-0.3.0.vsix` com **Extensions: Install from VSIX…**. O comando de empacotamento abaixo gera esse arquivo.
2. Abra `demo-project` em uma janela confiável do VS Code. Abrir sua pasta pai também funciona. Mantenha a pasta `images/` junto do projeto.
3. Abra `demo-project/index.html` no navegador. A página inicial já tem cabeçalho, foto da cafeteria, seis bebidas com preços, história e horários.
4. Envie [TCODE-101](tickets/TCODE-101.md) no T-Code e recarregue a página. Somente o cardápio muda: duas seções, **Clássicos quentes** e **Cafés gelados**, com uma foto de destaque por seção. A estrutura ao redor permanece igual.
5. Envie [TCODE-102](tickets/TCODE-102.md) e recarregue. Cada bebida ganha um botão **+** que adiciona a bebida sem abrir a sacola. Clique em **Ver pedido** para conferir quantidades, remoção, subtotais e total.
6. Adicione Espresso e Americano e clique em **Ver pedido**. O total será **R$ 18,00**. Aumente Espresso para duas unidades: **R$ 26,00**. Remova Americano: **R$ 16,00**.
7. Em uma tela estreita, use a barra fixa **Ver pedido** para reabrir a seleção. Escape fecha a sacola e devolve o foco ao controle de origem. Recarregar a página limpa o pedido.

Enter envia; Shift+Enter adiciona uma linha. O resumo da entrega mostra linhas adicionadas em verde e removidas em laranja, com totais e contagem por arquivo, calculados a partir dos arquivos antes e depois. Clique no nome para abrir a comparação nativa do VS Code; **Revisar** abre a lista de arquivos para escolher uma comparação. A seta ao lado também abre diretamente a comparação daquele arquivo. HTML e CSS são gerados com quebras de linha para facilitar a revisão. Mensagens antigas sem estatísticas continuam revisáveis, sem exibir contagens inventadas. Cada prompt leva aproximadamente 7,5 segundos, distribuídos entre as três mensagens de progresso (2,5 segundos por etapa). O progresso do agente é roteirizado, não raciocínio de modelo nem execução de testes. O comando **T-Code: Visualizar página de demonstração** abre a página dentro do VS Code e a atualiza após cada ticket.

A página usa HTML, CSS, JavaScript e fotos locais; nenhum servidor é necessário. Preços e horários são ilustrativos. A sacola calcula uma seleção para mostrar no balcão: não envia pedidos nem processa pagamentos. Quantidades vão de 1 a 99 por bebida. Fotos são ilustrativas; consulte as [fontes e licença](demo-project/images/CREDITS.md).

## Configurações

A engrenagem abre **URL da API**, **Chave secreta** e **Modelo do agente**. Opções: GLM 5.2, Qwen 3.6 120B, Mistral 4 119B, GPT OSS 120B e NVIDIA Nemotron 3.

URL e modelo ficam no estado global da extensão. A chave usa o SecretStorage do VS Code e nunca volta para a interface. Deixe a chave em branco ao salvar para preservar a existente. Essas configurações fazem parte do mock, sem conectar a um provedor ou alterar o roteiro.

## Reiniciar e transferir

Execute **T-Code: Reiniciar demonstração** e confirme, ou rode `npm run reset` na raiz do repositório. Recarregue a página depois. O reset restaura `index.html`, `styles.css`, `app.js` e `.t-code-demo.json`. A extensão detecta a mudança de etapa e limpa a conversa. Edições salvas nesses três arquivos são descartadas; imagens e outros arquivos são preservados. Execute com a extensão ociosa e sem alterações não salvas nos editores da demonstração.

Para outro computador, transfira o VSIX, a pasta `demo-project` inteira (incluindo o marcador oculto e `images/`) e os arquivos de `tickets/`. O projeto editável e as fotos são distribuídos separadamente do VSIX.

O reset aceita os marcadores anteriores Service Hub, Soft Rock Coffee e Órbita, migrando para o novo roteiro da cafeteria. Use o projeto atualizado com suas fotos e reinicie antes de aplicar tickets de uma versão diferente. O reset não baixa imagens. A extensão recusa workspaces não relacionados, projetos de demonstração ambíguos e editores com alterações não salvas. Edições manuais bloqueiam a próxima entrega até o reset. A etapa fica no marcador do projeto; a conversa fica no estado do workspace.

## Desenvolver, verificar e empacotar

Use Node.js 22 ou superior. A instalação de dependências e os downloads iniciais de ferramentas de teste exigem internet; a extensão instalada e a página não.

```powershell
npm install
npm run check
npm run qa:offline
npx playwright install chromium
npm run test:ui
npm run test:integration
npm run package
```

O pacote gerado é `artifacts/t-code-0.3.0.vsix`. Inclui extensão, interface, templates, lógica de pedidos e tickets. Não há dependências npm de execução nem compilação. Pressione F5 no repositório para iniciar a extensão em desenvolvimento.

Os testes unitários verificam totais, limites de quantidade, remoção, preservação do conteúdo fora do cardápio no primeiro ticket, proteção de arquivos, reset e configurações. `test:ui` verifica as três etapas, fotos locais, responsividade, sacola, teclado, foco, quantidades, total, remoção, limpeza, recarga e configurações do chat sem HTTP. Capturas ficam em `test-results/`.

`test:integration` usa um Extension Host isolado e um projeto temporário com fotos para testar ativação, prévia, tickets, bloqueio de duplicatas, proteção dos editores, diffs e reset. Defina `TCODE_VSCODE_EXECUTABLE` para um executável local do VS Code para evitar downloads. O diálogo nativo de confirmação de reset não é automatizado.

Código: [extensão](src/extension.js), [arquivos](src/demo.js), [cenário](src/scenario.js), [pedido](src/order.js), [configurações](src/settings.js), [chat](media/chat.html), [testes do pedido](tests/order.test.js), [testes do navegador](tests/coffee-ui.js).
