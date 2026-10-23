const fs = require('fs');
const https = require('https');

// Lê .env
const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

async function getToken() {
  const body = new URLSearchParams({
    client_id: env.AZURE_CLIENT_ID,
    client_secret: env.AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  }).toString();

  const res = await fetch(`https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json();
  return data.access_token;
}

async function run() {
  const token = await getToken();
  console.log('Token obtido com sucesso!');
  
  const siteQualidade = env.SP_SITE_QUALIDADE_ID || "gitservices.sharepoint.com,9c1aa92f-d7e2-4473-ae5c-f7cdab109151,4da4d998-c144-472c-a09c-90b7be3ffe77";
  const listName = env.SP_LIST_RNCS || "Resumo dos Incidentes de qualidade";
  const url = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$top=200`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(`Recebidos ${data.value.length} itens.`);

  const abrirValues = new Set();
  const localValues = new Set();
  let matches = 0;

  for (const it of data.value) {
    const f = it.fields || {};
    // Procura qualquer campo com 8d ou 8D
    Object.keys(f).forEach(k => {
      if (k.toLowerCase().includes('8d')) {
        abrirValues.add(`${k} = ${JSON.stringify(f[k])}`);
      }
    });

    const abrir8d = String(f.Abrir_x0020_8D_x003f_ || f.abrir_8d || f.abrir8d || f.Abrir8D || '').trim().toLowerCase();
    const local8d = String(f.local_8d || f.local8d || '').trim().toUpperCase();
    if (abrir8d === 'sim' || abrir8d === 'true' || local8d === 'APP' || local8d === '8D') {
      matches++;
    }
  }

  console.log('\nCampos com "8d" encontrados nas primeiras 200 RNCs:');
  console.log([...abrirValues].slice(0, 20));
  console.log(`\nMatches no critério 8D: ${matches} de ${data.value.length}`);
}

run().catch(console.error);
