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

      // 1. Reload the page at ?screen=menu-2
      await send('Page.navigate', { url: 'http://localhost:5173/?screen=menu-2' });
      await new Promise(r => setTimeout(r, 1200));

      // 2. DESKTOP TEST (1400x900)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1400,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await new Promise(r => setTimeout(r, 600));

      // Verify DOM and metrics on desktop
      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const aside = document.querySelector('aside');
          if (!aside) return { error: 'No aside' };

          const navContainer = aside.querySelector('.overflow-y-auto');
          const navStyle = navContainer ? window.getComputedStyle(navContainer) : null;

          const actionBtn = aside.querySelector('button');
          const actionBtnStyle = actionBtn ? window.getComputedStyle(actionBtn) : null;

          // Find category headers
          const catButtons = Array.from(aside.querySelectorAll('button')).filter(b => 
            b.innerText.includes('Registro de Ocorrências') ||
            b.innerText.includes('Proteção ao Cliente') ||
            b.innerText.includes('Falha de Entrega') ||
            b.innerText.includes('Configurações')
          );

          // Find navigation links
          const navLinks = Array.from(aside.querySelectorAll('button')).filter(b => 
            b.innerText.includes('Menu Principal') ||
            b.innerText.includes('Ocorrências Gerais') ||
            b.innerText.includes('Ocorrências Cliente')
          );

          const activeLink = aside.querySelector('.bg-\\\\[\\\\#eff6fc\\\\]') || Array.from(navLinks).find(l => l.innerText.includes('Menu Principal'));
          const activeStyle = activeLink ? window.getComputedStyle(activeLink) : null;

          // Check icons
          const icons = Array.from(aside.querySelectorAll('svg.lucide'));
          const iconSizes = icons.map(ic => ({
            name: ic.getAttribute('class'),
            width: window.getComputedStyle(ic).width,
            height: window.getComputedStyle(ic).height
          }));

          return {
            containerGap: navStyle ? navStyle.gap : null,
            containerPadding: navStyle ? navStyle.padding : null,
            actionBtn: actionBtn ? {
              text: actionBtn.innerText.trim(),
              height: actionBtnStyle.height,
              padding: actionBtnStyle.padding,
              borderRadius: actionBtnStyle.borderRadius,
              backgroundColor: actionBtnStyle.backgroundColor
            } : null,
            categoryCount: catButtons.length,
            categories: catButtons.map(cb => ({
              text: cb.innerText.trim(),
              display: window.getComputedStyle(cb).display,
              justifyContent: window.getComputedStyle(cb).justifyContent
            })),
            activeLink: activeLink ? {
              text: activeLink.innerText.trim(),
              backgroundColor: activeStyle ? activeStyle.backgroundColor : null,
              color: activeStyle ? activeStyle.color : null,
              fontWeight: activeStyle ? activeStyle.fontWeight : null
            } : null,
            iconCount: icons.length,
            sampleIconSizes: iconSizes.slice(0, 5)
          };
        })()`,
        returnByValue: true
      });
      console.log('Desktop Metrics:', JSON.stringify(metrics.result.value, null, 2));

      // Capture Desktop Screenshot with all categories expanded
      const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/mluca/.gemini/antigravity-ide/brain/9c42668a-ac43-40ce-874e-3365ae0cbe36/final_sidebar_desktop.png', Buffer.from(shotDesktop.data, 'base64'));
      console.log('Saved final_sidebar_desktop.png');

      // 3. Test collapse/expand interaction
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.includes('Registro de Ocorrências'));
          if (btn) btn.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 400));

      const shotCollapsed = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/mluca/.gemini/antigravity-ide/brain/9c42668a-ac43-40ce-874e-3365ae0cbe36/final_sidebar_collapsed.png', Buffer.from(shotCollapsed.data, 'base64'));
      console.log('Saved final_sidebar_collapsed.png');

      // Re-expand it
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.includes('Registro de Ocorrências'));
          if (btn) btn.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 400));

      // 4. MOBILE TEST (375x700)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 700,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 600));

      // Click hamburger
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('header button[aria-label="Abrir menu"]') || 
                      document.querySelector('header button svg.lucide-menu')?.closest('button');
          if (btn) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          }
        })()`
      });
      await new Promise(r => setTimeout(r, 600));

      const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/mluca/.gemini/antigravity-ide/brain/9c42668a-ac43-40ce-874e-3365ae0cbe36/final_sidebar_mobile.png', Buffer.from(shotMobile.data, 'base64'));
      console.log('Saved final_sidebar_mobile.png');

      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
