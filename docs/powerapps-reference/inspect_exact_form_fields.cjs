const fs = require('fs');

const rawYaml = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

// Let's inspect the controls and their Update / Default properties
const cards = JSON.parse(fs.readFileSync('cards_sequence_complete.json', 'utf8'));

cards.forEach(c => {
  console.log(`\n======================================================`);
  console.log(`CARD ${c.index}: ${c.name} | DataField: ${c.dataField}`);
  console.log(`Visible: ${c.visible}`);
  console.log(`Update: ${c.update}`);
  
  // Find lines in rawText that have DataCardKey, Control, Default, Items, Update
  const lines = c.rawText.split('\n');
  lines.forEach(l => {
    const trimmed = l.trim();
    if (trimmed.startsWith('DataCardKey') || 
        trimmed.startsWith('Text:') || 
        trimmed.startsWith('Update:') || 
        trimmed.startsWith('Required:') || 
        trimmed.startsWith('Default:') || 
        trimmed.startsWith('DefaultSelectedItems:') || 
        trimmed.startsWith('Control:') ||
        trimmed.startsWith('- DataCardValue') ||
        trimmed.startsWith('- cx') ||
        trimmed.startsWith('- Radio') ||
        trimmed.startsWith('- AddPicture') ||
        trimmed.startsWith('- Image')) {
      console.log('   ', trimmed);
    }
  });
});
