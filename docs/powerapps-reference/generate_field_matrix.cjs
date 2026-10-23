const fs = require('fs');

const content = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

// Parse EditFormNovoReg
const formStart = content.indexOf('EditFormNovoReg:');
const formContent = content.slice(formStart);

// Split into cards
const cardRegex = /\n\s{8}-\s+([\w\d_]+_DataCard\d*):([\s\S]*?)(?=\n\s{8}-\s+[\w\d_]+_DataCard\d*:|\n\s{6}-\s+[\w\d_]+:|$)/g;
let match;
const cards = [];

while ((match = cardRegex.exec(formContent)) !== null) {
  const cardName = match[1];
  const block = match[2];

  // Properties of Card
  const dfMatch = block.match(/DataField:\s*=\s*"([^"]+)"/);
  const dataField = dfMatch ? dfMatch[1] : '';

  const yMatch = block.match(/Y:\s*=\s*([0-9]+)/);
  const y = yMatch ? parseInt(yMatch[1], 10) : 0;

  const reqMatch = block.match(/Required:\s*=\s*([^\n]+)/);
  const required = reqMatch ? reqMatch[1].trim() : 'false';

  const visMatch = block.match(/Visible:\s*=\s*([^\n]+)/);
  const visible = visMatch ? visMatch[1].trim() : 'true';

  const updateMatch = block.match(/Update:\s*=\s*([^\n]+)/);
  const update = updateMatch ? updateMatch[1].trim() : '';

  // Find labels (DataCardKey or visual text)
  const labels = [];
  const labelMatches = block.matchAll(/Text:\s*=\s*"([^"]+)"/g);
  for (const lm of labelMatches) {
    const val = lm[1];
    if (val !== '*' && val !== 'Parent.Error' && val !== ':' && !val.startsWith('=')) {
      labels.push(val);
    }
  }

  // Find controls
  const controls = [];
  const ctrlRegex = /-\s+([\w\d_]+):\s*\n\s+Control:\s*([^\n]+)([\s\S]*?)(?=\n\s{10,12}-\s+[\w\d_]+:|$)/g;
  let cm;
  while ((cm = ctrlRegex.exec(block)) !== null) {
    const cName = cm[1];
    const cType = cm[2].trim();
    const cBlock = cm[3];

    const defMatch = cBlock.match(/Default:\s*=\s*([^\n]+)/);
    const defSelMatch = cBlock.match(/DefaultSelectedItems:\s*=\s*([^\n]+)/);
    const itemsMatch = cBlock.match(/Items:\s*=\s*([^\n]+)/);
    const onChangeMatch = cBlock.match(/OnChange:\s*=\s*([^\n]+)/);
    const onSelectMatch = cBlock.match(/OnSelect:\s*=\s*([^\n]+)/);
    const cVisMatch = cBlock.match(/Visible:\s*=\s*([^\n]+)/);

    controls.push({
      name: cName,
      type: cType,
      defaultVal: defMatch ? defMatch[1].trim() : '',
      defaultSelected: defSelMatch ? defSelMatch[1].trim() : '',
      items: itemsMatch ? itemsMatch[1].trim() : '',
      onChange: onChangeMatch ? onChangeMatch[1].trim() : '',
      onSelect: onSelectMatch ? onSelectMatch[1].trim() : '',
      visible: cVisMatch ? cVisMatch[1].trim() : ''
    });
  }

  cards.push({
    cardName,
    y,
    dataField,
    labels,
    required,
    visible,
    update,
    controls,
    blockLength: block.length
  });
}

console.log('Total DataCards extracted:', cards.length);
fs.writeFileSync('cards_detailed_analysis.json', JSON.stringify(cards, null, 2));
