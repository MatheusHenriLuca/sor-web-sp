import fs from 'fs';

const content = fs.readFileSync('../sor-app/src/Registro de 8D.pa.yaml', 'utf8');
const lines = content.split('\n');

let inForm = false;
let currentCard = null;
const cards = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (trimmed.startsWith('- EditFormNovoReg:') || trimmed.startsWith('EditFormNovoReg:')) {
    inForm = true;
    continue;
  }
  if (!inForm) continue;
  if (trimmed.startsWith('- ') && line.search(/\S/) <= 12 && !trimmed.includes('EditFormNovoReg')) break;

  if (trimmed.startsWith('- ') && trimmed.includes('_DataCard')) {
    const name = trimmed.substring(2, trimmed.indexOf(':')).trim();
    currentCard = {
      index: cards.length + 1,
      name,
      line: i + 1,
      dataField: '',
      label: '',
      visible: '',
      required: '',
      controls: []
    };
    cards.push(currentCard);
  } else if (currentCard) {
    if (trimmed.startsWith('DataField:')) currentCard.dataField = trimmed.replace('DataField:', '').trim();
    if (trimmed.startsWith('Required:') && !currentCard.required) currentCard.required = trimmed.replace('Required:', '').trim();
    if (trimmed.startsWith('Visible:') && !currentCard.visible) currentCard.visible = trimmed.replace('Visible:', '').trim();
    if (trimmed.startsWith('Text:') && !currentCard.label && !trimmed.includes('Parent.DisplayName') && !trimmed.includes('Parent.Error') && !trimmed.includes('"*"')) {
      currentCard.label = trimmed.replace('Text:', '').trim();
    }
    if (trimmed.startsWith('- ') && !trimmed.includes('_DataCard')) {
      const cName = trimmed.substring(2, trimmed.indexOf(':')).trim();
      let cType = '';
      let items = '';
      let def = '';
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const l = lines[j].trim();
        if (l.startsWith('Control:')) cType = l.replace('Control:', '').trim();
        if (l.startsWith('Items:')) items = l.replace('Items:', '').trim();
        if (l.startsWith('Default:')) def = l.replace('Default:', '').trim();
        if (lines[j].search(/\S/) <= line.search(/\S/) && lines[j].trim().startsWith('- ')) break;
      }
      currentCard.controls.push({ name: cName, type: cType, items, def });
    }
  }
}

const webView = fs.readFileSync('src/views/Registro8DView.tsx', 'utf8');
const webTypes = fs.readFileSync('src/types/index.ts', 'utf8');

console.log('Total DataCards in Power Apps form: ' + cards.length + '\n');

const missing = [];
const present = [];
const hiddenInternal = [];

cards.forEach(c => {
  const rawField = c.dataField.replace(/["=']/g, '');
  const inputControl = c.controls.find(ctrl => !ctrl.name.startsWith('DataCardKey') && !ctrl.name.startsWith('ErrorMessage') && !ctrl.name.startsWith('StarVisible')) || { name: 'none', type: 'none' };
  
  // Check if hidden / technical
  const isHidden = c.visible === '=false' || c.visible.includes('false') && !c.visible.includes('If(') && !c.visible.includes('reinctxt');
  const isEdicaoOnly = c.visible.includes('edicao');

  console.log(`[Card ${c.index}] ${c.name}`);
  console.log(`   DataField: ${rawField}`);
  console.log(`   Rótulo/Label: ${c.label || '(sem label explícito)'}`);
  console.log(`   Controle: ${inputControl.name} (${inputControl.type})`);
  console.log(`   Visível: ${c.visible || 'Padrão (True)'} | Obrigatório: ${c.required || 'Padrão'}`);
  if (inputControl.items) console.log(`   Items: ${inputControl.items.substring(0, 100)}`);
  console.log('---------------------------------------------------------');
});
