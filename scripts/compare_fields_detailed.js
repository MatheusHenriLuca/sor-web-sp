import fs from 'fs';

const paCards = JSON.parse(fs.readFileSync('scripts/audit_results.json', 'utf8'));
const regView = fs.readFileSync('src/views/Registro8DView.tsx', 'utf8');
const types = fs.readFileSync('src/types/index.ts', 'utf8');

// List of all fields in Power Apps form
console.log('=== ANÁLISE DETALHADA CAMPO A CAMPO ===\n');

const missingReport = [];

paCards.forEach(c => {
  const isFalse = c.visible === '=false';
  const isEdicao = c.visible.includes('edicao');
  const isNovoReg = !isFalse && !isEdicao;

  // Let's analyze exact purpose and match in Web
  missingReport.push({
    index: c.index,
    card: c.card,
    dataField: c.dataField,
    label: c.label,
    control: c.control,
    mode: isFalse ? 'TÉCNICO / OCULTO' : (isEdicao ? 'MODO EDIÇÃO' : 'NOVO REGISTRO'),
    required: c.required,
    visible: c.visible
  });
});

console.log(JSON.stringify(missingReport, null, 2));
