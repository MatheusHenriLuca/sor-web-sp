const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/mluca/.gemini/antigravity/scratch/POWER APPS/sor-plano-acao-canvas';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pa.yaml'));

const summary = {};

files.forEach(file => {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const forms = [];
  const galleries = [];
  const containers = [];
  const popups = [];
  const buttons = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*-\s*([a-zA-Z0-9_]+):/);
    if (match) {
      const name = match[1];
      const nextLines = lines.slice(i, i + 15).join('\n');
      
      if (nextLines.includes('Control: Form') || name.startsWith('Form')) {
        forms.push(name);
      } else if (nextLines.includes('Control: Gallery') || name.startsWith('Gallery') || name.startsWith('Galeria')) {
        galleries.push(name);
      } else if (name.toLowerCase().includes('tela') || name.toLowerCase().includes('modal') || name.toLowerCase().includes('popup') || name.toLowerCase().includes('pop_up') || name.toLowerCase().includes('container')) {
        popups.push(name);
      } else if (nextLines.includes('Control: Container') || nextLines.includes('Control: GroupContainer')) {
        containers.push(name);
      }
    }
  }

  summary[file] = {
    size: content.length,
    forms: [...new Set(forms)],
    galleries: [...new Set(galleries)],
    popups: [...new Set(popups)],
    containers: [...new Set(containers)].slice(0, 20)
  };
});

console.log(JSON.stringify(summary, null, 2));
