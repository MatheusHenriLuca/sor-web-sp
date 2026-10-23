const tenantId = process.env.AZURE_TENANT_ID || "";
const clientId = process.env.AZURE_CLIENT_ID || "";
const clientSecret = process.env.AZURE_CLIENT_SECRET || "";
const siteId = "gitservices.sharepoint.com,9c1aa92f-d7e2-4473-ae5c-f7cdab109151,4da4d998-c144-472c-a09c-90b7be3ffe77";
const listId = "19f404f8-e842-496f-a26c-9b2bf7af0317";

async function main() {
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
  const token = (await tokenRes.json()).access_token;

  const itemRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/6119?$expand=fields`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const item = await itemRes.json();
  console.log("CAMPOS DO ITEM 6119:");
  console.log(JSON.stringify(item.fields, null, 2));
}

main();
