const https = require('https');

const tenantId = process.env.AZURE_TENANT_ID || "";
const clientId = process.env.AZURE_CLIENT_ID || "";
const clientSecret = process.env.AZURE_CLIENT_SECRET || "";
const siteId = "gitservices.sharepoint.com,9c1aa92f-d7e2-4473-ae5c-f7cdab109151,4da4d998-c144-472c-a09c-90b7be3ffe77";

async function main() {
  console.log("1. Obtendo token no Microsoft Entra ID...");
  const postData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  }).toString();

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: postData
  });

  if (!tokenRes.ok) {
    console.error("Erro na autenticação:", await tokenRes.text());
    return;
  }

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  console.log(" Token obtido com sucesso!");

  console.log("\n2. Consultando listas no site Qualidade AA3...");
  const listsRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listsRes.ok) {
    console.error("Erro ao buscar listas:", await listsRes.text());
    return;
  }

  const listsData = await listsRes.json();
  console.log(`\n Listas encontradas no SharePoint (${listsData.value.length}):`);
  for (const l of listsData.value) {
    console.log(` - [${l.displayName}] -> ID: ${l.id}`);
  }

  // Testando busca de itens na lista "Resumo dos Incidentes de qualidade"
  const rncList = listsData.value.find(l => l.displayName === 'Resumo dos Incidentes de qualidade');
  if (rncList) {
    console.log(`\n3. Buscando últimos 5 itens da lista "${rncList.displayName}" (ID: ${rncList.id})...`);
    const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${rncList.id}/items?$expand=fields&$top=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (itemsRes.ok) {
      const itemsData = await itemsRes.json();
      console.log(` Itens reais retornados: ${itemsData.value.length}`);
      itemsData.value.forEach((item, idx) => {
        const f = item.fields || {};
        console.log(`   #${idx + 1} - ID: ${f.id || item.id} | Codigo: ${f.Title || f.Codigo_Ocorrencia} | Peca: ${f.Descricao_Peca || f.Codigo_Peca} | Defeito: ${f.Defeito_Descricao || f.Defeito}`);
      });
    } else {
      console.error("Erro ao buscar itens da lista:", await itemsRes.text());
    }
  }
}

main().catch(console.error);
