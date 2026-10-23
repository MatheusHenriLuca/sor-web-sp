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

cards.slice(0, 11).forEach((c, idx) => {
  const text = c.lines.join('\n');
  const df = (text.match(/DataField:\s*=\s*"([^"]+)"/) || [])[1] || '';
  const update = (text.match(/Update:\s*=\s*([^\n]+)/) || [])[1] || '';
  const visible = (text.match(/Visible:\s*=\s*([^\n]+)/) || [])[1] || '';
  
  const labelTexts = [];
  const lRegex = /Text:\s*=\s*"([^"]+)"/g;
  let lm;
  while ((lm = lRegex.exec(text)) !== null) {
    if (lm[1] !== '*' && lm[1] !== 'Parent.Error') labelTexts.push(lm[1]);
  }

  const controls = [];
  const cRegex = /\n\s+- ([\w\d_]+):\s*\n\s+Control:\s*([^\n]+)/g;
  let cm;
  while ((cm = cRegex.exec(text)) !== null) {
    controls.push({ name: cm[1], type: cm[2].trim() });
  }

  console.log(`\nCard [${idx + 1}]: ${c.name} (Line ${c.start}) | DataField: "${df}"`);
  console.log(`   Labels: ${JSON.stringify(labelTexts)}`);
  console.log(`   Controls: ${controls.map(x=>x.name+' ['+x.type+']').join(', ')}`);
  if (update) console.log(`   Update: ${update}`);
  if (visible) console.log(`   Visible: ${visible}`);

  // check if any formulas mention cxproduto, cxcomp, colpecasgerais
  c.lines.forEach(l => {
    if (l.includes('cxproduto') || l.includes('cxcomp') || l.includes('cxsubcomp') || l.includes('cxcliente') || l.includes('RadioGroupCanvas1_1') || l.includes('colpecasgerais')) {
      console.log(`      * [dep] ${l.trim()}`);
    }
  });
});
