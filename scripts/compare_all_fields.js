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
      displayName: '',
      label: '',
      visible: '',
      required: '',
      update: '',
      controls: []
    };
    cards.push(currentCard);
  } else if (currentCard) {
    if (trimmed.startsWith('DataField:')) currentCard.dataField = trimmed.replace('DataField:', '').trim();
    if (trimmed.startsWith('DisplayName:')) currentCard.displayName = trimmed.replace('DisplayName:', '').trim();
    if (trimmed.startsWith('Required:') && !currentCard.required) currentCard.required = trimmed.replace('Required:', '').trim();
    if (trimmed.startsWith('Visible:') && !currentCard.visible) currentCard.visible = trimmed.replace('Visible:', '').trim();
    if (trimmed.startsWith('Update:')) currentCard.update = trimmed.replace('Update:', '').trim();
    if (trimmed.startsWith('Text:') && !currentCard.label && !trimmed.includes('Parent.DisplayName') && !trimmed.includes('Parent.Error') && !trimmed.includes('"*"')) {
      currentCard.label = trimmed.replace('Text:', '').trim();
    }
    if (trimmed.startsWith('- ') && !trimmed.includes('_DataCard')) {
      const cName = trimmed.substring(2, trimmed.indexOf(':')).trim();
      let cType = '';
      let items = '';
      let def = '';
      let defaultSelected = '';
      for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
        const l = lines[j].trim();
        if (l.startsWith('Control:')) cType = l.replace('Control:', '').trim();
        if (l.startsWith('Items:')) items = l.replace('Items:', '').trim();
        if (l.startsWith('Default:')) def = l.replace('Default:', '').trim();
        if (l.startsWith('DefaultSelectedItems:')) defaultSelected = l.replace('DefaultSelectedItems:', '').trim();
        if (lines[j].search(/\S/) <= line.search(/\S/) && lines[j].trim().startsWith('- ')) break;
      }
      currentCard.controls.push({ name: cName, type: cType, items, def, defaultSelected });
    }
  }
}

const regView = fs.readFileSync('src/views/Registro8DView.tsx', 'utf8');
const detView = fs.readFileSync('src/views/Detalhes8DView.tsx', 'utf8');
const types = fs.readFileSync('src/types/index.ts', 'utf8');

console.log('Total DataCards no Power Apps: ' + cards.length);

const results = cards.map(c => {
  const cleanField = c.dataField.replace(/["=']/g, '');
  const inputCtrl = c.controls.find(ctrl => 
    !ctrl.name.startsWith('DataCardKey') && 
    !ctrl.name.startsWith('ErrorMessage') && 
    !ctrl.name.startsWith('StarVisible') &&
    ctrl.type !== 'Label'
  ) || c.controls[0] || { name: 'none', type: 'none' };

  // check existence in web
  const inTypes = types.includes(cleanField) || (c.name && types.includes(c.name));
  const inRegView = regView.includes(cleanField) || (inputCtrl.name && regView.includes(inputCtrl.name));
  const inDetView = detView.includes(cleanField) || (inputCtrl.name && detView.includes(inputCtrl.name));

  return {
    index: c.index,
    card: c.name,
    dataField: cleanField,
    label: c.label.replace(/^="|"$/g, ''),
    control: `${inputCtrl.name} (${inputCtrl.type})`,
    visible: c.visible || 'true',
    required: c.required || 'false',
    update: c.update,
    items: inputCtrl.items,
    inTypes,
    inRegView,
    inDetView
  };
});

fs.writeFileSync('scripts/audit_results.json', JSON.stringify(results, null, 2));
console.log('Resultados salvos em scripts/audit_results.json');
