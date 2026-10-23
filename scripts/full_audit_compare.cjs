const fs = require('fs');

const yamlContent = fs.readFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-app/src/Registro de 8D.pa.yaml', 'utf8');
const viewContent = fs.readFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-web/src/views/Registro8DView.tsx', 'utf8');
const typesContent = fs.readFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-web/src/types/index.ts', 'utf8');

const lines = yamlContent.split('\n');
let currentCard = null;
const cards = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const cardMatch = line.match(/^(\s{24})- ([^:]+):/);
  if (cardMatch) {
    if (currentCard) cards.push(currentCard);
    currentCard = { name: cardMatch[2].trim(), line: i + 1, props: {}, labels: [], children: [] };
  } else if (currentCard) {
    const childMatch = line.match(/^(\s{30})- ([^:]+):/);
    if (childMatch) {
      currentCard.children.push(childMatch[2].trim());
    }
    const propMatch = line.match(/^\s{30}([A-Za-z0-9_]+):\s*(.*)/);
    if (propMatch) {
      let val = propMatch[2].trim();
      if (val === '|-' || val === '|' || val === '|+') {
        let j = i + 1;
        val = '';
        while (j < lines.length && lines[j].match(/^\s{32,}/)) {
          val += ' ' + lines[j].trim();
          j++;
        }
      }
      currentCard.props[propMatch[1]] = val.trim();
    }
    const labelMatch = line.match(/Text:\s*(=.*)/);
    if (labelMatch) {
      currentCard.labels.push(labelMatch[1].trim());
    }
  }
}
if (currentCard) cards.push(currentCard);

const audit = cards.map((c, idx) => {
  const lbl = c.labels.filter(l => !l.includes('Parent.Error') && l !== '="*"').join(' | ');
  const df = (c.props.DataField || '').replace(/["=']/g, '');
  const disp = (c.props.DisplayName || '').replace(/.*,\s*([a-zA-Z0-9_]+)\)/, '$1');
  const vis = c.props.Visible || 'ALWAYS';
  const req = c.props.Required || 'FALSE';
  
  return {
    index: idx,
    cardName: c.name,
    dataField: df,
    displayName: disp,
    label: lbl,
    visibleFormula: vis,
    requiredFormula: req,
    inTypes: typesContent.includes(df) || typesContent.includes(disp),
  };
});

fs.writeFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-web/scripts/audit_detailed_full.json', JSON.stringify(audit, null, 2));
console.log(`Audited ${audit.length} cards. Saved to scripts/audit_detailed_full.json`);
