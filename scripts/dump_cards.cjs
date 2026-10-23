const fs = require('fs');
const content = fs.readFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-app/src/Registro de 8D.pa.yaml', 'utf8');
const lines = content.split('\n');
let currentCard = null;
const cards = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const cardMatch = line.match(/^(\s{24})- ([^:]+):/);
  if (cardMatch) {
    if (currentCard) cards.push(currentCard);
    currentCard = { name: cardMatch[2].trim(), line: i + 1, props: {}, labels: [] };
  } else if (currentCard) {
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

cards.slice(0, 14).forEach((c, idx) => {
  const lbl = c.labels.filter(l => !l.includes('Parent.Error') && l !== '="*"').join(' | ');
  console.log(`[Card ${idx}] ${c.name} (DataField: ${c.props.DataField || 'N/A'})`);
  console.log(`   Label: ${lbl}`);
  console.log(`   Visible: ${c.props.Visible || 'TRUE (Always)'}`);
  console.log(`   Required: ${c.props.Required || 'FALSE'}`);
});
