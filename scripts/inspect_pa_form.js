import fs from 'fs';

const content = fs.readFileSync('../sor-app/src/Registro de 8D.pa.yaml', 'utf8');
const lines = content.split('\n');

let inForm = false;
let formIndent = -1;
const formCards = [];
let currentCard = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  const indent = line.search(/\S|$/);

  if (trimmed.startsWith('- EditFormNovoReg:') || trimmed.startsWith('EditFormNovoReg:')) {
    inForm = true;
    formIndent = indent;
    console.log('Found EditFormNovoReg at line', i + 1);
    continue;
  }

  if (inForm) {
    if (trimmed.startsWith('- ') && indent <= formIndent && !trimmed.includes('EditFormNovoReg')) {
      inForm = false;
      console.log('Exited EditFormNovoReg at line', i + 1);
      break;
    }

    if (trimmed.startsWith('- ') && trimmed.includes('_DataCard')) {
      const cardName = trimmed.substring(2, trimmed.indexOf(':')).trim();
      currentCard = {
        name: cardName,
        line: i + 1,
        indent,
        dataField: '',
        displayName: '',
        label: '',
        valueControls: []
      };
      formCards.push(currentCard);
    } else if (currentCard) {
      if (trimmed.startsWith('DataField:')) {
        currentCard.dataField = trimmed.replace('DataField:', '').trim();
      }
      if (trimmed.startsWith('DisplayName:')) {
        currentCard.displayName = trimmed.replace('DisplayName:', '').trim();
      }
      if (trimmed.startsWith('Text:') && !currentCard.label) {
        currentCard.label = trimmed.replace('Text:', '').trim();
      }
      if (trimmed.startsWith('- ') && !trimmed.includes('_DataCard')) {
        const ctrlName = trimmed.substring(2, trimmed.indexOf(':')).trim();
        currentCard.valueControls.push(ctrlName);
      }
    }
  }
}

console.log('\n--- CARDS IN EditFormNovoReg (' + formCards.length + ') ---');
formCards.forEach((c, idx) => {
  console.log((idx + 1) + '. Card: ' + c.name);
  console.log('   DataField: ' + c.dataField);
  console.log('   DisplayName: ' + c.displayName);
  console.log('   Label: ' + c.label);
  console.log('   Controls: ' + c.valueControls.join(', '));
});
