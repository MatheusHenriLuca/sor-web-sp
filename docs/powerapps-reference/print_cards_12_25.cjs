const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('cards_sequence_complete.json', 'utf8'));

for (let i = 11; i < cards.length; i++) {
  const c = cards[i];
  console.log(`\nCard [${c.index}]: ${c.name} | DataField: "${c.dataField}"`);
  console.log(`   Labels: ${JSON.stringify(c.labels)}`);
  console.log(`   Controls: ${c.controls.map(x => x.name + ' [' + x.type + ']').join(', ')}`);
  console.log(`   Update: ${c.update}`);
  console.log(`   Visible: ${c.visible}`);
}
