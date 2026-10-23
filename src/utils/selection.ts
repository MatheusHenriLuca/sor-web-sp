/**
 * Utilitário de Interação Segura de Linhas e Cards
 * Permite que o usuário selecione e copie qualquer texto da linha/card sem disparar a navegação.
 * Funciona globalmente em tabelas, galerias e listas.
 */

export function handleSafeClick(
  action: () => void,
  event?: React.MouseEvent
): void {
  // 1. Se o usuário estiver selecionando texto, não execute a ação de navegação
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    return;
  }

  // 2. Se o clique foi originado em um botão, link, input ou elemento com ação específica, não interfira
  if (event && event.target) {
    const target = event.target as HTMLElement;
    const isInteractive = target.closest('button, a, input, select, textarea, [data-interactive="true"]');
    if (isInteractive) {
      return;
    }
  }

  // 3. Executa a ação
  action();
}
