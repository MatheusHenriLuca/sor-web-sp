const fs = require('fs');
const content = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

const lines = content.split('\n');

const cards = [];
let cur = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^(\s+)- ([\w\s_]+_DataCard\d*):/);
  if (m) {
    if (cur) cards.push(cur);
    cur = { name: m[2], indent: m[1].length, start: i + 1, lines: [line] };
  } else if (cur) {
    const nextCardOrSibling = line.match(/^(\s+)- [\w\s_]+:/);
    if (nextCardOrSibling && nextCardOrSibling[1].length <= cur.indent) {
      cards.push(cur);
      cur = null;
    } else {
      cur.lines.push(line);
    }
  }
}
if (cur) cards.push(cur);

const parsed = cards.map((c, idx) => {
  const text = c.lines.join('\n');
  const df = (text.match(/DataField:\s*=\s*"([^"]+)"/) || [])[1] || '';
  const y = (text.match(/Y:\s*=\s*(\d+)/) || [])[1] || '';
  const update = (text.match(/Update:\s*=\s*([^\n]+)/) || [])[1] || '';
  const visible = (text.match(/Visible:\s*=\s*([^\n]+)/) || [])[1] || '';
  const defaultVal = (text.match(/Default:\s*=\s*([^\n]+)/) || [])[1] || '';

  // Extract all labels (DataCardKey or Title labels)
  const labels = [];
  const labelRegex = /Text:\s*=\s*"([^"]+)"/g;
  let lm;
  while ((lm = labelRegex.exec(text)) !== null) {
    if (lm[1] !== '*' && lm[1] !== 'Parent.Error' && lm[1] !== ':') {
      labels.push(lm[1]);
    }
  }

  // Extract all controls inside
  const controls = [];
  const ctrlRegex = /\n\s+- ([\w\d_]+):\s*\n\s+Control:\s*([^\n]+)/g;
  let cm;
  while ((cm = ctrlRegex.exec(text)) !== null) {
    controls.push({ name: cm[1], type: cm[2].trim() });
  }

  return {
    index: idx + 1,
    name: c.name,
    line: c.start,
    dataField: df,
    labels: labels,
    y: parseInt(y) || 0,
    update: update.trim(),
    visible: visible.trim(),
    defaultVal: defaultVal.trim(),
    controls: controls,
    rawText: text
  };
});

fs.writeFileSync('cards_sequence_complete.json', JSON.stringify(parsed, null, 2));

console.log('=== LISTA COMPLETA DOS 25 DATACARDS (SEQUÊNCIA DO FORMULÁRIO POWER APPS) ===\n');
parsed.forEach(p => {
  console.log(`[${p.index}] ${p.name}`);
  console.log(`    Rótulo(s) Visual(is): ${p.labels.length ? p.labels.join(' | ') : '(Sem rótulo explícito)'}`);
  console.log(`    Coluna SharePoint (DataField): "${p.dataField}"`);
  console.log(`    Controles: ${p.controls.map(x => x.name + ' (' + x.type + ')').join(', ')}`);
  if (p.visible) console.log(`    Visibilidade: ${p.visible}`);
  if (p.update) console.log(`    Update: ${p.update}`);
  console.log('');
});
