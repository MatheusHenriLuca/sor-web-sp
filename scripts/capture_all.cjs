const { execSync } = require('child_process');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const brain = 'C:\\Users\\mluca\\.gemini\\antigravity-ide\\brain\\014f11f6-dd45-49c9-bf9f-b97889d1b372';

const shots = [
  { name: 'capture_mobile_390_dashboard.png', size: '390,844', url: 'http://127.0.0.1:5173/?screen=menu-2' },
  { name: 'capture_mobile_390_lista.png', size: '390,844', url: 'http://127.0.0.1:5173/?screen=lista-8d' },
  { name: 'capture_mobile_390_detalhes.png', size: '390,950', url: 'http://127.0.0.1:5173/?screen=detalhes-8d&rncId=101' },
  { name: 'capture_mobile_390_loading.png', size: '390,844', url: 'http://127.0.0.1:5173/?screen=on-start' },
  { name: 'capture_mobile_390_registro.png', size: '390,900', url: 'http://127.0.0.1:5173/?screen=registro-8d' },
  { name: 'capture_tablet_768_dashboard.png', size: '768,1024', url: 'http://127.0.0.1:5173/?screen=menu-2' },
  { name: 'capture_tablet_768_detalhes.png', size: '768,1024', url: 'http://127.0.0.1:5173/?screen=detalhes-8d&rncId=101' },
  { name: 'capture_desktop_1920_dashboard.png', size: '1920,1080', url: 'http://127.0.0.1:5173/?screen=menu-2' },
  { name: 'capture_desktop_1920_detalhes.png', size: '1920,1080', url: 'http://127.0.0.1:5173/?screen=detalhes-8d&rncId=101' }
];

shots.forEach(s => {
  const target = path.join(brain, s.name);
  const cmd = `"${chrome}" --headless=new --disable-gpu --virtual-time-budget=3000 --window-size=${s.size} --screenshot="${target}" "${s.url}"`;
  console.log('Capturing:', s.name);
  execSync(cmd, { stdio: 'inherit' });
});
console.log('All responsive screenshots captured successfully.');
