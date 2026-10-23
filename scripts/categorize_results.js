import fs from 'fs';
const results = JSON.parse(fs.readFileSync('scripts/audit_results.json', 'utf8'));

console.log('=== CARDS 1 A 17 ===');
results.slice(0, 17).forEach(r => {
  console.log(`[Card ${r.index}] ${r.card}`);
  console.log(`    Campo SharePoint (DataField): ${r.dataField}`);
  console.log(`    Rótulo Visual: ${r.label}`);
  console.log(`    Controle: ${r.control}`);
  console.log(`    Obrigatório: ${r.required}`);
  console.log(`    Visível: ${r.visible}`);
  console.log('---------------------------------------------------------');
});


console.log('\n=== 2. CAMPOS DE EDIÇÃO (VISIBLE = EDICAO) ===');
results.filter(r => r.visible.includes('edicao')).forEach(r => {
  console.log(`[Card ${r.index}] ${r.card} | Rótulo: ${r.label} | Web: ${r.inRegView ? 'PRESENTE' : 'FALTANDO'}`);
});

console.log('\n=== 3. CAMPOS OCULTOS / INTERNOS (VISIBLE = FALSE) ===');
results.filter(r => r.visible === '=false').forEach(r => {
  console.log(`[Card ${r.index}] ${r.card} | DataField: ${r.dataField}`);
});
