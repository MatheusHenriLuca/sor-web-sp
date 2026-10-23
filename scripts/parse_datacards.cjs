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
    currentCard = { name: cardMatch[2].trim(), line: i + 1, props: {}, labels: [], children: [] };
  } else if (currentCard) {
    const childMatch = line.match(/^(\s{30})- ([^:]+):/);
    if (childMatch) {
      currentCard.children.push(childMatch[2].trim());
    }
    const propMatch = line.match(/^\s{30}([A-Za-z0-9_]+):\s*(.*)/);
    if (propMatch) {
      currentCard.props[propMatch[1]] = propMatch[2].trim();
    }
    const labelMatch = line.match(/Text:\s*(=.*)/);
    if (labelMatch) {
      currentCard.labels.push(labelMatch[1].trim());
    }
  }
}
if (currentCard) cards.push(currentCard);

cards.slice(0, 30).forEach((c, idx) => {
  console.log(`[${idx + 1}] Line ${c.line}: ${c.name}`);
  console.log(`    DataField: ${c.props.DataField || 'N/A'}`);
  console.log(`    Required: ${c.props.Required || 'N/A'}`);
  console.log(`    Visible: ${c.props.Visible || 'N/A'}`);
  console.log(`    Labels: ${c.labels.filter(l => !l.includes('Parent.Error') && l !== '="*"').join(' | ')}`);
  console.log(`    Children: ${c.children.join(', ')}`);
});
