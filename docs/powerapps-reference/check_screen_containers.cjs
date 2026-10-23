const fs = require('fs');
const content = fs.readFileSync('sor-app/src/Registro de 8D.pa.yaml', 'utf8');

// Find all top-level controls on the screen
const lines = content.split('\n');
console.log('Top level containers/controls in Registro de 8D:');
lines.forEach((l, idx) => {
  const m = l.match(/^(\s{2,6})- ([\w\d_\s]+):\s*\n\s+Control:\s*([^\n]+)/);
  if (m) {
    console.log(`[L${idx+1}] ${m[2]} (${m[3]})`);
  }
});
