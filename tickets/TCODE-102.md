# TCODE-102 — Montar um pedido para levar

**Tipo:** História · **Prioridade:** Média · **Projeto:** Soft Rock Coffee

Quero selecionar minhas bebidas e conferir as quantidades e o total antes de pedir no balcão.

Adicione um pequeno botão **+** ao lado de cada bebida. Ao adicionar, atualize a quantidade e o total sem abrir a sacola ou tirar o foco do botão. Abra a sacola lateral somente ao clicar em Ver pedido, preservando a estrutura e o visual do cardápio.

Critérios de aceite:
- Mostrar as bebidas selecionadas, preço unitário, quantidades, subtotais e total em reais.
- Adicionar a mesma bebida novamente aumenta sua quantidade, sem duplicar a linha.
- Permitir aumentar, diminuir e remover bebidas, além de limpar o pedido. Limitar a 99 unidades por bebida; diminuir até zero remove o item.
- Permitir fechar a sacola ou continuar escolhendo. Escape fecha e devolve o foco ao botão de origem.
- Mostrar um botão para reabrir o pedido com o total; no celular, usar uma barra fixa inferior, como Ver pedido · R$ 18,00.
- Atualizar valores imediatamente usando centavos inteiros, anunciar mudanças de forma acessível e permitir operação pelo teclado.
- Manter o pedido somente em memória: recarregar a página limpa a seleção. Não enviar pedidos, processar pagamentos ou fazer chamadas de rede. Orientar o visitante a mostrar a seleção no balcão.
