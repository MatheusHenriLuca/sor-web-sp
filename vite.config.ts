import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';

// ============================================================================
// MICROSOFT GRAPH / SHAREPOINT ONLINE DIRECT PROXY MIDDLEWARE
// Conexão direta e nativa com as listas do SharePoint da Gestamp
// ============================================================================
function sharepointDirectProxyPlugin(env: Record<string, string>): Plugin {
  let cachedToken: string | null = null;
  let tokenExpiresAt = 0;

  async function getAccessToken(): Promise<string> {
    const isPlaceholder = (val?: string) => !val || val.startsWith('your-') || val === 'undefined';
    const tenantId = (!isPlaceholder(env.AZURE_TENANT_ID) ? env.AZURE_TENANT_ID : process.env.AZURE_TENANT_ID) || "";
    const clientId = (!isPlaceholder(env.AZURE_CLIENT_ID) ? env.AZURE_CLIENT_ID : process.env.AZURE_CLIENT_ID) || "";
    const clientSecret = (!isPlaceholder(env.AZURE_CLIENT_SECRET) ? env.AZURE_CLIENT_SECRET : process.env.AZURE_CLIENT_SECRET) || "";

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Credenciais do Azure não configuradas no .env (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET).");
    }

    // Retorna token em cache se ainda válido (com folga de 5 min)
    if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
      return cachedToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Falha na autenticação Microsoft Entra ID: ${res.status} ${res.statusText} - ${errText}`);
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    cachedToken = data.access_token || null;
    tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
    return cachedToken || '';
  }

  // Cache em memória no servidor Vite para acesso instantâneo sem sobrecarregar o Microsoft Graph
  const dataCache: Record<string, { items: any[]; timestamp: number }> = {};
  const inFlightRequests: Record<string, Promise<any[]> | null> = {};
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache em memória

  /**
   * Coleta TODOS os itens do SharePoint através da paginação @odata.nextLink do Microsoft Graph.
   * Quebra o limite padrão de 999 itens e retorna a base integral (4.000+ peças, 4.900+ RNCs).
   */
  async function fetchAllGraphPages(
    initialUrl: string, 
    token: string, 
    cacheKey?: string, 
    forceRefresh = false
  ): Promise<any[]> {
    if (!forceRefresh && cacheKey && dataCache[cacheKey]) {
      const entry = dataCache[cacheKey];
      if (Date.now() - entry.timestamp < CACHE_TTL_MS && entry.items.length > 0) {
        console.log(`[SP Proxy] Cache HIT para '${cacheKey}': ${entry.items.length} itens retornados instantaneamente.`);
        return entry.items;
      }
    }

    // Deduplica requisições simultâneas para evitar sobrecarga
    if (cacheKey && inFlightRequests[cacheKey]) {
      console.log(`[SP Proxy] Aguardando requisição em andamento para '${cacheKey}'...`);
      return inFlightRequests[cacheKey]!;
    }

    const fetchPromise = (async () => {
      console.log(`[SP Proxy] Iniciando paginação completa Graph API para: ${initialUrl}`);
      const allItems: any[] = [];
      let nextUrl: string | null = initialUrl;
      let pageCount = 0;

      while (nextUrl) {
        pageCount++;
        const gRes = await fetch(nextUrl, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly' 
          }
        });

        if (!gRes.ok) {
          const errText = await gRes.text();
          console.error(`[SP Proxy] Erro na página ${pageCount}: HTTP ${gRes.status} - ${errText}`);
          throw new Error(`Falha ao obter página ${pageCount} do SharePoint: ${gRes.status} - ${errText}`);
        }

        const data = (await gRes.json()) as any;
        if (data.value && Array.isArray(data.value)) {
          allItems.push(...data.value);
        }

        nextUrl = data['@odata.nextLink'] || null;
        if (pageCount % 5 === 0 || !nextUrl) {
          console.log(`[SP Proxy] Progresso [${cacheKey || 'dados'}]: ${allItems.length} itens coletados (${pageCount} páginas)...`);
        }
      }

      console.log(`[SP Proxy] Concluído com sucesso [${cacheKey || 'dados'}]: ${allItems.length} itens reais em ${pageCount} páginas.`);

      if (cacheKey) {
        dataCache[cacheKey] = {
          items: allItems,
          timestamp: Date.now()
        };
      }

      return allItems;
    })();

    if (cacheKey) {
      inFlightRequests[cacheKey] = fetchPromise;
    }

    try {
      return await fetchPromise;
    } finally {
      if (cacheKey) {
        inFlightRequests[cacheKey] = null;
      }
    }
  }

  return {
    name: 'sharepoint-direct-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/sp')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        const siteQualidade = env.SP_SITE_QUALIDADE_ID || "gitservices.sharepoint.com,9c1aa92f-d7e2-4473-ae5c-f7cdab109151,4da4d998-c144-472c-a09c-90b7be3ffe77";
        const sitePlanoAcao = env.SP_SITE_PLANO_ACAO_ID || "gitservices.sharepoint.com,8470854f-76e8-4466-b170-a108e39aca26,75aece75-b01e-4275-9531-df4aec5ff60e";
        const siteRH = env.SP_SITE_RH_ID || "gitservices.sharepoint.com,da46cf2b-d662-47d4-a9d0-21f1ec46d86b,da2e112d-40de-43dd-a87b-bad0b3ba706e";

        try {
          // 1. Status da Conexão
          if (req.url === '/api/sp/status') {
            try {
              const token = await getAccessToken();
              res.end(JSON.stringify({ 
                connected: Boolean(token), 
                message: "Conexão direta ativa com o SharePoint Online (gitservices.sharepoint.com)!",
                siteQualidade,
                sitePlanoAcao,
                siteRH,
                cachedLists: Object.keys(dataCache).map(k => ({ list: k, count: dataCache[k].items.length }))
              }));
            } catch (err: any) {
              res.end(JSON.stringify({ connected: false, message: err.message }));
            }
            return;
          }

          // Para todas as operações seguintes, requer o token
          const token = await getAccessToken();

          // 2. RNCs - GET (Listar todas as ocorrências reais paginadas)
          if (req.method === 'GET' && (req.url === '/api/sp/rncs' || req.url.startsWith('/api/sp/rncs?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listName = env.SP_LIST_RNCS || "Resumo dos Incidentes de qualidade";
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$orderby=fields/Modified%20desc&$top=999`;
            
            const allItems = await fetchAllGraphPages(graphUrl, token, 'rncs', forceRefresh);
            res.end(JSON.stringify({ value: allItems }));
            return;
          }

          // 3. RNCs - POST (Criar ocorrência real diretamente no SharePoint)
          if (req.method === 'POST' && req.url === '/api/sp/rncs') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const listName = env.SP_LIST_RNCS || "Resumo dos Incidentes de qualidade";
              const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items`;
              const payload = JSON.parse(body);

              const gRes = await fetch(graphUrl, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: payload })
              });
              const data = await gRes.json();
              delete dataCache['rncs']; // Invalida cache após inserção
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 4. RNCs - PATCH (Editar ocorrência real diretamente no SharePoint)
          if (req.method === 'PATCH' && req.url.startsWith('/api/sp/rncs/')) {
            const itemId = req.url.replace('/api/sp/rncs/', '').split('?')[0];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const listName = env.SP_LIST_RNCS || "Resumo dos Incidentes de qualidade";
              const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items/${itemId}/fields`;
              const payload = JSON.parse(body);

              const gRes = await fetch(graphUrl, {
                method: 'PATCH',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              });
              const data = await gRes.json();
              delete dataCache['rncs']; // Invalida cache após edição
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 5. RNCs - DELETE (Excluir ocorrência no SharePoint)
          if (req.method === 'DELETE' && req.url.startsWith('/api/sp/rncs/')) {
            const itemId = req.url.replace('/api/sp/rncs/', '').split('?')[0];
            const listName = env.SP_LIST_RNCS || "Resumo dos Incidentes de qualidade";
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items/${itemId}`;
            const gRes = await fetch(graphUrl, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            delete dataCache['rncs']; // Invalida cache após exclusão
            res.statusCode = gRes.status;
            res.end(JSON.stringify({ success: gRes.ok }));
            return;
          }

          // 6. Peças - GET (Listar TODAS as peças reais de 'lista_geral_peças_aa3' sem o limite de 999)
          if (req.method === 'GET' && (req.url === '/api/sp/pecas' || req.url.startsWith('/api/sp/pecas?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listName = env.SP_LIST_PECAS || "lista_geral_peças_aa3";
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$top=999`;
            
            const allItems = await fetchAllGraphPages(graphUrl, token, 'pecas', forceRefresh);
            res.end(JSON.stringify({ value: allItems }));
            return;
          }

          // 7. Ativos / Colaboradores - GET (Listar todos de 'BASE_ATIVOS' paginado)
          if (req.method === 'GET' && (req.url === '/api/sp/ativos' || req.url.startsWith('/api/sp/ativos?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listName = env.SP_LIST_ATIVOS || "BASE_ATIVOS";
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteRH}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$top=999`;
            try {
              const allItems = await fetchAllGraphPages(graphUrl, token, 'ativos', forceRefresh);
              res.end(JSON.stringify({ value: allItems }));
            } catch (err) {
              const fallbackUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$top=999`;
              const allItems = await fetchAllGraphPages(fallbackUrl, token, 'ativos', forceRefresh);
              res.end(JSON.stringify({ value: allItems }));
            }
            return;
          }

          // 8. Usuários - GET (Listar todos de 'Usuários ocorrências qualidade')
          if (req.method === 'GET' && (req.url === '/api/sp/usuarios' || req.url.startsWith('/api/sp/usuarios?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listName = env.SP_LIST_USUARIOS || "Usuários ocorrências qualidade";
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$top=999`;
            const allItems = await fetchAllGraphPages(graphUrl, token, 'usuarios', forceRefresh);
            res.end(JSON.stringify({ value: allItems }));
            return;
          }

          // 9. Imagens - Proxy seguro para carregar imagens do SharePoint com Bearer Token
          if (req.method === 'GET' && req.url.startsWith('/api/sp/image-proxy?')) {
            const urlParams = new URLSearchParams(req.url.split('?')[1]);
            const targetUrl = urlParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Parâmetro 'url' obrigatório." }));
              return;
            }

            try {
              const imgRes = await fetch(targetUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (!imgRes.ok) {
                res.statusCode = imgRes.status;
                res.end(JSON.stringify({ error: `Falha ao carregar imagem: ${imgRes.status}` }));
                return;
              }

              const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              const arrayBuffer = await imgRes.arrayBuffer();
              res.end(Buffer.from(arrayBuffer));
            } catch (err: any) {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          // 10. 8D - GET RNCs marcadas para 8D
          if (req.method === 'GET' && (req.url === '/api/sp/8d/rncs' || req.url.startsWith('/api/sp/8d/rncs?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listName = env.SP_LIST_RNCS || "Resumo dos Incidentes de qualidade";
            const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${encodeURIComponent(listName)}/items?$expand=fields&$orderby=fields/Modified%20desc&$top=999`;
            const allItems = await fetchAllGraphPages(graphUrl, token, 'rncs', forceRefresh);
            
            // Filtro por abrir_8d = 'Sim' ou local_8d = 'APP'
            const filtered = allItems.filter(it => {
              const f = it.fields || {};
              const abrir8d = String(f.Abrir_x0020_8D_x003f_ || f.abrir_8d || f.abrir8d || f.Abrir8D || '').trim().toLowerCase();
              const local8d = String(f.local_8d || f.local8d || '').trim().toUpperCase();
              return abrir8d === 'sim' || local8d === 'APP';
            });

            res.end(JSON.stringify({ value: filtered, total: filtered.length }));
            return;
          }

          // 11. 8D - GET Detalhes Agregados por ID do 8D (:id8d)
          if (req.method === 'GET' && req.url.startsWith('/api/sp/8d/') && req.url.includes('/detalhes')) {
            const rawId = req.url.replace('/api/sp/8d/', '').replace('/detalhes', '').split('?')[0];
            const id8d = decodeURIComponent(rawId).trim();
            const forceRefresh = req.url.includes('refresh=true');

            // Carrega em paralelo todas as coleções relacionadas
            const [partAll, ishiAll, henkAll, entrAll, planosAll, acoesAll] = await Promise.all([
              fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/d42434ab-576a-4e6b-b50b-333c63b3b070/items?expand=fields&$top=999`, token, 'sp_participantes', forceRefresh),
              fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/ad128c05-7222-4bf1-ac63-47c6716fdd59/items?expand=fields&$top=999`, token, 'sp_ishikawa', forceRefresh),
              fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/04327a3f-f030-4111-a26e-7d6454997c8c/items?expand=fields&$top=999`, token, 'sp_henkaten', forceRefresh),
              fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/7298b358-1dae-426b-97da-798054647bdc/items?expand=fields&$top=999`, token, 'sp_entrevista', forceRefresh),
              fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/87789d0a-3594-40e0-9109-33e8836884f4/items?expand=fields&$top=999`, token, 'sp_planos', forceRefresh),
              fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/649afa01-cda6-4eb8-a89d-e9ffe9af7d41/items?expand=fields&$top=999`, token, 'sp_acoes', forceRefresh)
            ]);

            // Normaliza matching por id8d (ex: "I - 4520" ou "Q - 1014" ou número)
            const matchId = (val?: string) => {
              if (!val) return false;
              const cleanVal = String(val).trim().toUpperCase();
              const target = id8d.toUpperCase();
              const numOnly = target.replace(/^[A-Z]+\s*-\s*/, '').trim();
              return cleanVal === target || cleanVal.endsWith(`- ${numOnly}`) || cleanVal === numOnly || cleanVal.includes(target);
            };

            const rncsAll = dataCache['rncs']?.items || [];
            const rncNum = id8d.replace(/^[A-Za-z]+\s*-\s*/, '').trim();
            const rncItem = rncsAll.find(it => String(it.fields?.id || it.id) === rncNum);

            const participantesItem = partAll.find(it => matchId(it.fields?.id8d || it.fields?.id_8d));
            const ishikawaItems = ishiAll.filter(it => matchId(it.fields?.id8d || it.fields?.id_8d));
            const henkatenItem = henkAll.find(it => matchId(it.fields?.id8d || it.fields?.id_8d));
            const entrevistaItem = entrAll.find(it => matchId(it.fields?.id8d || it.fields?.id_8d));
            const planoItem = planosAll.find(it => matchId(it.fields?.idprograma || it.fields?.id_programa));
            const acoesItems = acoesAll.filter(it => {
              const f = it.fields || {};
              if (matchId(f.id_programa_acoes)) return true;
              if (planoItem && String(f.id_rel2) === String(planoItem.fields?.id || planoItem.id)) return true;
              return false;
            });

            res.end(JSON.stringify({
              id8d,
              rnc: rncItem ? { id: rncItem.id, ...rncItem.fields } : null,
              participantes: participantesItem ? { id: participantesItem.id, ...participantesItem.fields } : null,
              ishikawa: ishikawaItems.map(it => ({ id: it.id, ...it.fields })),
              henkaten: henkatenItem ? { id: henkatenItem.id, ...henkatenItem.fields } : null,
              entrevista: entrevistaItem ? { id: entrevistaItem.id, ...entrevistaItem.fields } : null,
              plano: planoItem ? { id: planoItem.id, ...planoItem.fields } : null,
              acoes: acoesItems.map(it => ({ id: it.id, ...it.fields }))
            }));
            return;
          }

          // 12. 8D - POST/PATCH Participantes e Revisões de Etapas
          if (req.method === 'POST' && req.url.startsWith('/api/sp/8d/') && req.url.endsWith('/participantes')) {
            const rawId = req.url.replace('/api/sp/8d/', '').replace('/participantes', '').split('?')[0];
            const id8d = decodeURIComponent(rawId).trim();
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "d42434ab-576a-4e6b-b50b-333c63b3b070";
              const partAll = await fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${listId}/items?expand=fields&$top=999`, token, 'sp_participantes', false);
              const existing = partAll.find(it => String(it.fields?.id8d || '').trim().toUpperCase() === id8d.toUpperCase());

              let result;
              if (existing) {
                const patchUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${listId}/items/${existing.id}/fields`;
                const gRes = await fetch(patchUrl, {
                  method: 'PATCH',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                result = await gRes.json();
              } else {
                const postUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${listId}/items`;
                const gRes = await fetch(postUrl, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fields: { id8d, ...payload } })
                });
                result = await gRes.json();
              }
              delete dataCache['sp_participantes'];
              res.end(JSON.stringify(result));
            });
            return;
          }

          // 13. 8D - POST Causa Ishikawa
          if (req.method === 'POST' && req.url.startsWith('/api/sp/8d/') && req.url.endsWith('/ishikawa')) {
            const rawId = req.url.replace('/api/sp/8d/', '').replace('/ishikawa', '').split('?')[0];
            const id8d = decodeURIComponent(rawId).trim();
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "ad128c05-7222-4bf1-ac63-47c6716fdd59";
              const postUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${listId}/items`;
              const gRes = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: { id8d, ...payload } })
              });
              const data = await gRes.json();
              delete dataCache['sp_ishikawa'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 14. 8D - PATCH Causa Ishikawa (Atualizar 5PQ ou Hipótese)
          if (req.method === 'PATCH' && req.url.startsWith('/api/sp/8d/ishikawa/')) {
            const itemId = req.url.replace('/api/sp/8d/ishikawa/', '').split('?')[0];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "ad128c05-7222-4bf1-ac63-47c6716fdd59";
              const patchUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${listId}/items/${itemId}/fields`;
              const gRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await gRes.json();
              delete dataCache['sp_ishikawa'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 15. 8D - DELETE Causa Ishikawa
          if (req.method === 'DELETE' && req.url.startsWith('/api/sp/8d/ishikawa/')) {
            const itemId = req.url.replace('/api/sp/8d/ishikawa/', '').split('?')[0];
            const listId = "ad128c05-7222-4bf1-ac63-47c6716fdd59";
            const delUrl = `https://graph.microsoft.com/v1.0/sites/${siteQualidade}/lists/${listId}/items/${itemId}`;
            const gRes = await fetch(delUrl, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            delete dataCache['sp_ishikawa'];
            res.statusCode = gRes.status;
            res.end(JSON.stringify({ success: gRes.ok }));
            return;
          }

          // 16. PLANO DE AÇÃO - GET Planos Mestres ('Action plan')
          if (req.method === 'GET' && (req.url === '/api/sp/planos' || req.url.startsWith('/api/sp/planos?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listId = "87789d0a-3594-40e0-9109-33e8836884f4";
            const allItems = await fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items?expand=fields&$top=999`, token, 'sp_planos', forceRefresh);
            
            const urlObj = new URL(`http://localhost${req.url}`);
            const idprograma = urlObj.searchParams.get('idprograma');
            let filtered = allItems;
            if (idprograma) {
              filtered = allItems.filter(it => String(it.fields?.idprograma || '').trim().toUpperCase() === idprograma.trim().toUpperCase());
            }

            res.end(JSON.stringify({ value: filtered.map(it => ({ id: it.id, ...it.fields })), total: filtered.length }));
            return;
          }

          // 17. PLANO DE AÇÃO - POST Criar Plano Mestre ('Action plan')
          if (req.method === 'POST' && req.url === '/api/sp/planos') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "87789d0a-3594-40e0-9109-33e8836884f4";
              const postUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items`;
              const gRes = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: payload })
              });
              const data = await gRes.json();
              delete dataCache['sp_planos'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 18. PLANO DE AÇÃO - PATCH Atualizar Plano Mestre
          if (req.method === 'PATCH' && req.url.startsWith('/api/sp/planos/')) {
            const itemId = req.url.replace('/api/sp/planos/', '').split('?')[0];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "87789d0a-3594-40e0-9109-33e8836884f4";
              const patchUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items/${itemId}/fields`;
              const gRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await gRes.json();
              delete dataCache['sp_planos'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 18.1 PLANO DE AÇÃO - DELETE Excluir Plano Mestre
          if (req.method === 'DELETE' && req.url.startsWith('/api/sp/planos/')) {
            const itemId = req.url.replace('/api/sp/planos/', '').split('?')[0];
            const listId = "87789d0a-3594-40e0-9109-33e8836884f4";
            const delUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items/${itemId}`;
            const gRes = await fetch(delUrl, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            delete dataCache['sp_planos'];
            res.statusCode = gRes.status;
            res.end(JSON.stringify({ success: gRes.ok }));
            return;
          }

          // 19. AÇÕES DETALHADAS - GET ('Action plan_acoes')
          if (req.method === 'GET' && (req.url === '/api/sp/acoes' || req.url.startsWith('/api/sp/acoes?'))) {
            const forceRefresh = req.url.includes('refresh=true');
            const listId = "649afa01-cda6-4eb8-a89d-e9ffe9af7d41";
            const allItems = await fetchAllGraphPages(`https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items?expand=fields&$top=999`, token, 'sp_acoes', forceRefresh);
            
            const urlObj = new URL(`http://localhost${req.url}`);
            const idprograma = urlObj.searchParams.get('idprograma');
            const idplano = urlObj.searchParams.get('idplano');

            let filtered = allItems;
            if (idprograma) {
              filtered = filtered.filter(it => String(it.fields?.id_programa_acoes || '').trim().toUpperCase() === idprograma.trim().toUpperCase());
            }
            if (idplano) {
              filtered = filtered.filter(it => String(it.fields?.id_rel2 || '') === String(idplano));
            }

            res.end(JSON.stringify({ value: filtered.map(it => ({ id: it.id, ...it.fields })), total: filtered.length }));
            return;
          }

          // 20. AÇÕES DETALHADAS - POST Criar Nova Ação
          if (req.method === 'POST' && req.url === '/api/sp/acoes') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "649afa01-cda6-4eb8-a89d-e9ffe9af7d41";
              const postUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items`;
              const gRes = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: payload })
              });
              const data = await gRes.json();
              delete dataCache['sp_acoes'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 21. AÇÕES DETALHADAS - PATCH Editar Ação
          if (req.method === 'PATCH' && req.url.startsWith('/api/sp/acoes/')) {
            const itemId = req.url.replace('/api/sp/acoes/', '').split('?')[0];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "649afa01-cda6-4eb8-a89d-e9ffe9af7d41";
              const patchUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items/${itemId}/fields`;
              const gRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await gRes.json();
              delete dataCache['sp_acoes'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 22. AÇÕES DETALHADAS - POST Concluir Ação pelo Responsável
          if (req.method === 'POST' && req.url.startsWith('/api/sp/acoes/') && req.url.endsWith('/concluir')) {
            const itemId = req.url.replace('/api/sp/acoes/', '').replace('/concluir', '').split('?')[0];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "649afa01-cda6-4eb8-a89d-e9ffe9af7d41";
              const patchUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items/${itemId}/fields`;
              
              const fieldsToUpdate = {
                status: payload.validacao_acao === 'NÃO' ? 'Validado' : 'Concluído',
                data_conclusao: payload.data_conclusao || new Date().toISOString(),
                comentarios_evidencia: payload.comentarios_evidencia || '',
                finalizacao: payload.validacao_acao === 'NÃO' ? 'Sim' : 'Não'
              };

              const gRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(fieldsToUpdate)
              });
              const data = await gRes.json();
              delete dataCache['sp_acoes'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 23. AÇÕES DETALHADAS - POST Validar Ação pela Qualidade
          if (req.method === 'POST' && req.url.startsWith('/api/sp/acoes/') && req.url.endsWith('/validar')) {
            const itemId = req.url.replace('/api/sp/acoes/', '').replace('/validar', '').split('?')[0];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              const payload = JSON.parse(body);
              const listId = "649afa01-cda6-4eb8-a89d-e9ffe9af7d41";
              const patchUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items/${itemId}/fields`;
              
              const isApproved = payload.aprovado === true || payload.status === 'Validado';
              const fieldsToUpdate = {
                status: isApproved ? 'Validado' : 'Aberto',
                finalizacao: isApproved ? 'Sim' : 'Não',
                status_revisar2: isApproved ? '' : 'Revisar',
                comentarios_validacao: payload.comentarios_validacao || (isApproved ? 'Ação validada com sucesso.' : 'Ação requer revisão técnica.')
              };

              const gRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(fieldsToUpdate)
              });
              const data = await gRes.json();
              delete dataCache['sp_acoes'];
              res.end(JSON.stringify(data));
            });
            return;
          }

          // 24. AÇÕES DETALHADAS - DELETE
          if (req.method === 'DELETE' && req.url.startsWith('/api/sp/acoes/')) {
            const itemId = req.url.replace('/api/sp/acoes/', '').split('?')[0];
            const listId = "649afa01-cda6-4eb8-a89d-e9ffe9af7d41";
            const delUrl = `https://graph.microsoft.com/v1.0/sites/${sitePlanoAcao}/lists/${listId}/items/${itemId}`;
            const gRes = await fetch(delUrl, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            delete dataCache['sp_acoes'];
            res.statusCode = gRes.status;
            res.end(JSON.stringify({ success: gRes.ok }));
            return;
          }

          // Fallback para rota desconhecida
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Rota API não suportada: ${req.url}` }));

        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || "Erro interno no proxy SharePoint" }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tailwindcss(),
      react(),
      sharepointDirectProxyPlugin(env)
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true
    }
  };
});

