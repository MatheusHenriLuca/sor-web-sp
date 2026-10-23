import fs from 'node:fs';

const WebSocket = globalThis.WebSocket;

async function run() {
  try {
    const res = await fetch('http://localhost:9222/json');
    const targets = await res.json();
    const target = targets.find(t => t.url && t.url.includes('5173'));
    if (!target) {
      console.log('Target not found');
      process.exit(1);
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.onopen = async () => {
      console.log('Connected to CDP');

      // 1. DESKTOP TEST (1280x800)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 850,
        deviceScaleFactor: 1,
        mobile: false
      });
      await new Promise(r => setTimeout(r, 600));

      // Capture Desktop Screenshot
      const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/mluca/.gemini/antigravity-ide/brain/9c42668a-ac43-40ce-874e-3365ae0cbe36/val_sidebar_desktop.png', Buffer.from(shotDesktop.data, 'base64'));
      console.log('Saved val_sidebar_desktop.png');

      // 2. MOBILE TEST (375x667)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 667,
        deviceScaleFactor: 1,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 500));

      // Click hamburger button
      const clickHamburger = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('header button[aria-label="Abrir menu"]') || document.querySelector('header button svg.lucide-menu')?.closest('button');
          if (btn) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            return 'hamburger clicked';
          }
          return 'hamburger not found';
        })()`,
        returnByValue: true
      });
      console.log('Hamburger Click:', clickHamburger.result.value);

      await new Promise(r => setTimeout(r, 500));

      // Capture Mobile Drawer Screenshot
      const shotMobileDrawer = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/mluca/.gemini/antigravity-ide/brain/9c42668a-ac43-40ce-874e-3365ae0cbe36/val_sidebar_mobile.png', Buffer.from(shotMobileDrawer.data, 'base64'));
      console.log('Saved val_sidebar_mobile.png');

      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
