const fs = require('fs');

const content = fs.readFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-plano-acao-canvas/action_plan.pa.yaml', 'utf-8');
const lines = content.split('\n');

function inspectBlock(targetName) {
  let start = -1;
  let targetIndent = -1;
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(new RegExp(`^(\\s*)-\\s*${targetName}:`));
    if (match) {
      start = i;
      targetIndent = match[1].length;
      break;
    }
  }

  if (start === -1) return { error: 'Not found' };

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (i > start) {
      const lineIndent = line.search(/\S/);
      if (lineIndent !== -1 && lineIndent <= targetIndent && line.trim().startsWith('-')) {
        break;
      }
    }
    result.push(line);
  }

  return result.join('\n');
}

const popupsToInspect = [
  'Novaacao',
  'Conclacao',
  'Exclacao',
  'Exclplanoacao',
  'Validaracao',
  'foto_expandida',
  'Formactionplan'
];

const report = {};
popupsToInspect.forEach(p => {
  const text = inspectBlock(p);
  // Find child controls, labels, and DataCards
  const sublines = text.split('\n');
  const controls = [];
  const labels = [];
  const datacards = [];
  
  sublines.forEach(l => {
    const m = l.match(/^\s*-\s*([a-zA-Z0-9_]+):/);
    if (m) controls.push(m[1]);
    const d = l.match(/DataField:\s*(.+)/);
    if (d) datacards.push(d[1].trim());
    const t = l.match(/Text:\s*(.+)/);
    if (t) labels.push(t[1].trim());
  });

  report[p] = {
    totalLines: sublines.length,
    controls: controls.slice(0, 20),
    dataFields: datacards,
    sampleLabels: labels.slice(0, 15)
  };
});

fs.writeFileSync('scripts/plano_popups_detailed.json', JSON.stringify(report, null, 2));
console.log('Saved detailed popup report to scripts/plano_popups_detailed.json');
