const fs = require('fs');
const content = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

function extractControlBlock(ctrlName) {
  const lines = content.split('\n');
  let start = -1;
  let indent = 0;
  const block = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(new RegExp(`^(\\s+)- ${ctrlName}:`));
    if (m) {
      start = i;
      indent = m[1].length;
      block.push(l);
    } else if (start !== -1) {
      const nextMatch = l.match(/^(\s+)- [\w\d_]+:/);
      if (nextMatch && nextMatch[1].length <= indent) {
        break;
      }
      block.push(l);
    }
  }
  return block.join('\n');
}

const targetControls = [
  'DataCardValue51',
  'coprodtxt',
  'DataCardValue42',
  'carryovertxt',
  'DataCardValue21',
  'pecasegtxt'
];

targetControls.forEach(ctrl => {
  console.log(`\n======================================================`);
  console.log(`CONTROLE: ${ctrl}`);
  console.log(`======================================================`);
  console.log(extractControlBlock(ctrl));
});
