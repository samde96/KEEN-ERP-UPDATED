const PRINT_STYLE_ID = 'keen-print-page-style';
const PRINT_BODY_CLASSES = ['printing-report', 'printing-receipt'];

function clearPrintMode() {
  document.body.classList.remove(...PRINT_BODY_CLASSES);
  document.getElementById(PRINT_STYLE_ID)?.remove();
}

function printWithMode(mode, pageRule) {
  if (typeof window === 'undefined') return;

  clearPrintMode();

  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `@page { ${pageRule} }`;
  document.head.appendChild(style);
  document.body.classList.add(`printing-${mode}`);

  const cleanup = () => clearPrintMode();
  window.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(() => window.print(), 50);
  window.setTimeout(cleanup, 10000);
}

export function printReceipt() {
  printWithMode('receipt', 'size: 80mm auto; margin: 4mm;');
}

export function printReport() {
  printWithMode('report', 'size: A4 portrait; margin: 12mm;');
}
