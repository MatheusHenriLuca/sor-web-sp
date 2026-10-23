const fs = require('fs');
const controls = JSON.parse(fs.readFileSync('form_controls_report.json', 'utf8'));

console.log('================================================================================');
console.log('SEQUÊNCIA DOS CAMPOS E REGRAS DE PREENCHIMENTO AUTOMÁTICO (TELA REGISTRO DE 8D)');
console.log('================================================================================\n');

// Find all controls that have formulas referencing cxproduto, cxcomp, cxsubcomp, cxcliente, RadioGroupCanvas1_1
const autoFilledControls = [];

controls.forEach(c => {
  const t = c.fullText;
  const references = [];
  if (t.includes('cxproduto_1.Selected')) references.push('cxproduto_1 (Peça Final / Produto)');
  if (t.includes('cxcomp_1.Selected')) references.push('cxcomp_1 (Componente)');
  if (t.includes('cxsubcomp.Selected')) references.push('cxsubcomp (SubComponente)');
  if (t.includes('cxcliente.Selected')) references.push('cxcliente (Cliente / Montadora)');
  if (t.includes('RadioGroupCanvas1_1.Selected')) references.push('RadioGroupCanvas1_1 (Tipo de Peça: Peça Final vs Componente)');
  if (t.includes('colpecasgerais_AA3')) references.push('colpecasgerais_AA3 (Catálogo de Peças)');

  if (references.length > 0 && !['cxproduto_1', 'cxcomp_1', 'cxsubcomp', 'cxcliente', 'RadioGroupCanvas1_1'].includes(c.name)) {
    autoFilledControls.push({
      control: c.name,
      type: c.ctrlType,
      dataField: c.dataField,
      references: references,
      snippet: t
    });
  }
});

console.log(`TOTAL DE CONTROLES COM PREENCHIMENTO AUTOMÁTICO/VÍNCULO À PEÇA: ${autoFilledControls.length}\n`);

autoFilledControls.forEach((item, idx) => {
  console.log(`[${idx + 1}] Controle: ${item.control} (${item.type})`);
  console.log(`    Vinculado a: ${item.references.join(' | ')}`);
  
  // Extract key lines
  const lines = item.snippet.split('\n');
  lines.forEach(l => {
    const trimmed = l.trim();
    if (trimmed.startsWith('Default:') || 
        trimmed.startsWith('DefaultSelectedItems:') || 
        trimmed.startsWith('Items:') || 
        trimmed.startsWith('Text:') || 
        trimmed.startsWith('Update:') || 
        trimmed.startsWith('Visible:')) {
      console.log(`    ${trimmed}`);
    }
  });
  console.log('--------------------------------------------------------------------------------');
});
