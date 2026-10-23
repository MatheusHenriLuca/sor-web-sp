const fs = require('fs');
const audit = JSON.parse(fs.readFileSync('c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-web/scripts/audit_detailed_full.json'));
audit.slice(0, 31).forEach(a => {
  console.log(`${a.index}. [${a.cardName}]`);
  console.log(`   Label: ${a.label}`);
  console.log(`   DataField: ${a.dataField} | DisplayName: ${a.displayName}`);
  console.log(`   Visible: ${a.visibleFormula}`);
  console.log(`   Required: ${a.requiredFormula}`);
  console.log('---');
});
