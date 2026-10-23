const fs = require('fs');
const content = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

const lines = content.split('\n');

// Parse controls inside EditForm1
let insideForm = false;
let formIndent = 0;
const formControls = [];

let currentControl = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('EditFormNovoReg') || line.includes('EditForm1:')) {
    insideForm = true;
    formIndent = line.search(/\S/);
    continue;
  }
  
  if (insideForm) {
    const indent = line.search(/\S/);
    if (indent !== -1 && indent <= formIndent && !line.startsWith(' ')) {
      insideForm = false;
      continue;
    }

    const ctrlMatch = line.match(/^(\s+)- ([\w\d_\s]+):/);
    if (ctrlMatch) {
      if (currentControl) formControls.push(currentControl);
      currentControl = {
        name: ctrlMatch[2].trim(),
        indent: ctrlMatch[1].length,
        line: i + 1,
        properties: {},
        lines: [line]
      };
    } else if (currentControl) {
      currentControl.lines.push(line);
      const propMatch = line.match(/^\s+([\w\d]+):\s*(=.*)?$/);
      if (propMatch) {
        currentControl.properties[propMatch[1]] = (propMatch[2] || '').trim();
      }
    }
  }
}
if (currentControl) formControls.push(currentControl);

console.log(`Total controls in form: ${formControls.length}`);

// Let's filter input controls (ComboBox, TextInput, DatePicker, Radio, Dropdown)
const inputTypes = ['Classic/ComboBox', 'Classic/TextInput', 'Classic/DatePicker', 'Radio', 'Classic/Drop Down', 'Classic/Toggle', 'TypedDataCard'];

const interesting = formControls.filter(c => {
  const text = c.lines.join('\n');
  const ctrlType = (text.match(/Control:\s*([^\n]+)/) || [])[1] || '';
  return inputTypes.some(t => ctrlType.includes(t)) || c.name.endsWith('DataCard1') || c.name.endsWith('DataCard2');
});

console.log(`Interesting controls: ${interesting.length}`);

const report = interesting.map(c => {
  const text = c.lines.join('\n');
  const ctrlType = (text.match(/Control:\s*([^\n]+)/) || [])[1] || '';
  const def = (text.match(/Default:\s*([^\n]+)/) || [])[1] || '';
  const defSel = (text.match(/DefaultSelectedItems:\s*([^\n]+)/) || [])[1] || '';
  const items = (text.match(/Items:\s*([^\n]+)/) || [])[1] || '';
  const onChange = (text.match(/OnChange:\s*([^\n]+)/) || [])[1] || '';
  const textProp = (text.match(/Text:\s*([^\n]+)/) || [])[1] || '';
  const visible = (text.match(/Visible:\s*([^\n]+)/) || [])[1] || '';
  const update = (text.match(/Update:\s*([^\n]+)/) || [])[1] || '';
  const dataField = (text.match(/DataField:\s*([^\n]+)/) || [])[1] || '';

  // Get parent card or context
  return {
    name: c.name,
    line: c.line,
    ctrlType,
    dataField,
    def,
    defSel,
    items,
    onChange,
    textProp,
    visible,
    update,
    fullText: text
  };
});

fs.writeFileSync('form_controls_report.json', JSON.stringify(report, null, 2));
console.log('Saved form_controls_report.json');
