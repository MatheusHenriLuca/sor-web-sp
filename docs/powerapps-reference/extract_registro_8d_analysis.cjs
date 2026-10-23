const fs = require('fs');
const content = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

const lines = content.split('\n');

// Find all controls and DataCards
console.log('--- SCANNING REGISTRO DE 8D FORM ---');

// Let's find EditForm
let formStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('EditForm') || lines[i].includes('Form:')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}

// Find all DataCards
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

console.log(`Found ${cards.length} DataCards in Registro de 8D`);

const results = cards.map(c => {
  const text = c.lines.join('\n');
  const df = (text.match(/DataField:\s*=\s*"([^"]+)"/) || [])[1] || '';
  const dn = (text.match(/DisplayName:\s*=\s*([^\n]+)/) || [])[1] || '';
  const y = (text.match(/Y:\s*=\s*(\d+)/) || [])[1] || '';
  const x = (text.match(/X:\s*=\s*(\d+)/) || [])[1] || '';
  const def = (text.match(/Default:\s*=\s*([^\n]+)/) || [])[1] || '';
  const update = (text.match(/Update:\s*=\s*([^\n]+)/) || [])[1] || '';
  const visible = (text.match(/Visible:\s*=\s*([^\n]+)/) || [])[1] || '';
  
  // Find inner controls
  const controls = [];
  const cRegex = /\n\s+- ([\w\d_]+):\s*\n\s+Control:\s*([^\n]+)/g;
  let cm;
  while ((cm = cRegex.exec(text)) !== null) {
    controls.push({ name: cm[1], type: cm[2].trim() });
  }

  // Find Label texts
  const labelTexts = [];
  const lRegex = /Text:\s*=\s*"([^"]+)"/g;
  let lm;
  while ((lm = lRegex.exec(text)) !== null) {
    if (lm[1] !== '*' && lm[1] !== 'Parent.Error') {
      labelTexts.push(lm[1]);
    }
  }

  // Find specific auto-fill expressions (formulas referencing other controls)
  const autoFills = [];
  const linesArr = c.lines;
  for (let j = 0; j < linesArr.length; j++) {
    const l = linesArr[j];
    if (l.includes('cxproduto') || l.includes('cxcomp') || l.includes('cxsubcomp') || l.includes('cxcliente') || l.includes('RadioGroupCanvas1_1') || l.includes('colpecasgerais')) {
      autoFills.push(l.trim());
    }
  }

  return {
    name: c.name,
    line: c.start,
    dataField: df,
    displayName: dn,
    y: parseInt(y) || 0,
    x: parseInt(x) || 0,
    def,
    update,
    visible,
    controls,
    labelTexts,
    autoFills
  };
});

// Sort by line number (which reflects form layout sequence)
results.sort((a, b) => a.line - b.line);

results.forEach((r, idx) => {
  console.log(`\n[${idx + 1}] Card: ${r.name} (Line ${r.line})`);
  console.log(`   DataField: "${r.dataField}" | Labels: ${JSON.stringify(r.labelTexts)}`);
  console.log(`   Controls: ${r.controls.map(x => x.name + ' [' + x.type + ']').join(', ')}`);
  if (r.update) console.log(`   Update: ${r.update}`);
  if (r.visible) console.log(`   Visible: ${r.visible}`);
  if (r.autoFills.length > 0) {
    console.log(`   AutoFill / Dependent Expressions:`);
    r.autoFills.forEach(af => console.log(`      * ${af}`));
  }
});
