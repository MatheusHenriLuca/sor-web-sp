import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileSpreadsheet, 
  Layers, 
  Users, 
  AlertOctagon,
  HardDrive
} from 'lucide-react';
import { spStore } from '../services/sharepointService';

interface SharePointSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed: () => void;
}

export const SharePointSyncModal: React.FC<SharePointSyncModalProps> = ({
  isOpen,
  onClose,
  onDataRefreshed
}) => {
  const [connState, setConnState] = useState(spStore.getConnectionState());
  const [siteUrl, setSiteUrl] = useState(connState.siteUrl);
  const [token, setToken] = useState(connState.accessToken);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  if (!isOpen) return null;

  const pecasCount = spStore.getColPecasGeraisAA3().length;
  const ativosCount = spStore.getBaseAtivos().length;
  const usersCount = spStore.getUsuarios().length;
  const rncsCount = spStore.getRNCs().length;
  const treinCount = spStore.getTreinamentos().length;


  const handleSyncAllSharePoint = async () => {
    setSyncingAll(true);
    setStatusMsg({ text: "Sincronizando todas as listas do SharePoint Online com paginação completa...", type: 'info' });
    try {
      const res = await spStore.syncWithSharePoint({ forceRefresh: true });
      if (res.error) {
        setStatusMsg({ text: `Falha na sincronização: ${res.error}`, type: 'error' });
      } else {
        setStatusMsg({ 
          text: `Sincronismo completo! ${res.count.toLocaleString()} RNCs e ${res.pecasCount.toLocaleString()} peças carregadas diretamente do SharePoint Online sem limite de 999.`, 
          type: 'success' 
        });
        setConnState(spStore.getConnectionState());
        onDataRefreshed();
      }
    } catch (e: any) {
      setStatusMsg({ text: `Erro: ${e.message}`, type: 'error' });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const result = await spStore.testSharePointConnection(siteUrl, token);
      if (result.success) {
        setStatusMsg({ text: result.message, type: 'success' });
        setConnState(spStore.getConnectionState());
      } else {
        setStatusMsg({ text: result.message, type: 'error' });
      }
    } catch (e: any) {
      setStatusMsg({ text: `Falha: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    spStore.setConnectionState({
      siteUrl,
      accessToken: token,
      mode: token ? 'sharepoint' : 'local'
    });
    setConnState(spStore.getConnectionState());
    setStatusMsg({ text: "Configuração gravada no navegador!", type: 'success' });
  };

  const handleExportCSV = (table: 'pecas' | 'ativos' | 'rncs') => {
    const csv = spStore.exportTableToCSV(table);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gestamp_${table}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportPecas = () => {
    if (!importText.trim()) {
      setStatusMsg({ text: "Cole o conteúdo CSV das peças no campo abaixo.", type: 'error' });
      return;
    }
    const result = spStore.importPecasFromCSV(importText);
    if (result.error) {
      setStatusMsg({ text: `Erro na importação: ${result.error}`, type: 'error' });
    } else {
      setStatusMsg({ text: `Sucesso: ${result.count} peças importadas para 'colpecasgerais_AA3'!`, type: 'success' });
      setShowImportBox(false);
      setImportText('');
      onDataRefreshed();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Deseja restaurar as bases originais da Gestamp com o catálogo fabril completo?")) {
      spStore.resetToDefaults();
      onDataRefreshed();
      setStatusMsg({ text: "Bases restauradas para o catálogo padrão Gestamp Brasil!", type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#092162] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="text-lg font-bold">Bases de Dados & Integração SharePoint</h2>
              <p className="text-xs text-sky-200">Gerenciamento de listas originais e sincronismo fabril</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-slate-800">
          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${
              statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              statusMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Sincronismo Direto Completo (Graph API) */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="text-sm font-bold text-[#092162] flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-sky-600 ${syncingAll ? 'animate-spin' : ''}`} />
                Sincronismo Direto Completo (Sem Trava de 999)
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Carrega 100% dos dados reais do SharePoint Online (paginação recursiva no Graph API).
              </p>
            </div>
            <button
              onClick={handleSyncAllSharePoint}
              disabled={syncingAll}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#092162] hover:bg-[#00126b] text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {syncingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Baixando Páginas...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  <span>Sincronizar Tudo do SharePoint</span>
                </>
              )}
            </button>
          </div>

          {/* Connected Bases Summary */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#092162]" />
              Bases Carregadas na Memória do App (Power Apps Runtime)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                  <span>lista_geral_peças_aa3</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">Real</span>
                </div>
                <div className="text-xl font-bold text-[#092162] mt-1">{pecasCount.toLocaleString()} peças</div>
                <div className="text-[11px] text-slate-500">colpecasgerais_AA3</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                  <span>BASE_ATIVOS</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">Real</span>
                </div>
                <div className="text-xl font-bold text-[#092162] mt-1">{ativosCount.toLocaleString()} colab.</div>
                <div className="text-[11px] text-slate-500">varPessoas</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                  <span>Usuários Ocorrências</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">Real</span>
                </div>
                <div className="text-xl font-bold text-[#092162] mt-1">{usersCount.toLocaleString()} perfis</div>
                <div className="text-[11px] text-slate-500">varRE / Varperfil</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                  <span>Resumo dos Incidentes</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Integral</span>
                </div>
                <div className="text-xl font-bold text-emerald-700 mt-1">{rncsCount.toLocaleString()} RNCs</div>
                <div className="text-[11px] text-slate-500">8D & Proteções</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold">Treinamentos</div>
                <div className="text-xl font-bold text-[#092162] mt-1">{treinCount.toLocaleString()} registros</div>
                <div className="text-[11px] text-slate-500">Col_Treinamentos</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-500 font-semibold">Status Servidor</div>
                <div className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </div>
                <div className="text-[11px] text-slate-500">data_hora_atual_apprnc</div>
              </div>
            </div>
          </div>

          {/* SharePoint Online Endpoint Config */}
          <div className="border-t border-slate-200 pt-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              Conexão Direta ao SharePoint Online (Tenant Gestamp)
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL do Site SharePoint</label>
              <input 
                type="text"
                value={siteUrl}
                onChange={e => setSiteUrl(e.target.value)}
                placeholder="https://gestamp.sharepoint.com/sites/qualidade-sor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#092162] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Token de Acesso Bearer (Microsoft Graph / SharePoint REST)
              </label>
              <input 
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Cole o Bearer Token obtido via Entra ID / MSAL..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#092162] focus:border-transparent"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                * Se o token não for informado, o aplicativo opera em modo <strong>Local Fabril Persistente</strong> com os dados completos e validados da Gestamp.
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-[#092162] text-white rounded-lg text-sm font-bold hover:bg-[#00126B] transition"
              >
                Salvar Configurações
              </button>
              <button 
                onClick={handleTestConnection}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Testar Conexão REST
              </button>
            </div>
          </div>

          {/* Import / Export Tools */}
          <div className="border-t border-slate-200 pt-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Importação & Exportação de Dados do SharePoint
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleExportCSV('pecas')}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                Exportar Peças (CSV)
              </button>
              <button 
                onClick={() => handleExportCSV('ativos')}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                Exportar Ativos (CSV)
              </button>
              <button 
                onClick={() => handleExportCSV('rncs')}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                Exportar RNCs 8D (CSV)
              </button>
              <button 
                onClick={() => setShowImportBox(!showImportBox)}
                className="px-3 py-2 bg-sky-50 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold hover:bg-sky-100 flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-sky-700" />
                Importar Lista de Peças (CSV)
              </button>
              <button 
                onClick={handleResetDefaults}
                className="px-3 py-2 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center gap-2 transition ml-auto"
              >
                <RefreshCw className="w-4 h-4 text-rose-700" />
                Restaurar Base Padrão
              </button>
            </div>

            {showImportBox && (
              <div className="mt-3 p-4 bg-slate-100 border border-slate-300 rounded-lg flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-700">
                  Cole as linhas do CSV de Peças (formato: Identificação;Material;Descrição;Cliente;Nesting Level;Posto;FMDS;CodCliText;Componente;CarryOver):
                </div>
                <textarea 
                  rows={4}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="1;53201-0D120;PAINEL DIANTEIRO;TOYOTA;0;POSTO 04;FMDS 02;532010D120;53201-0D121;Não"
                  className="w-full p-2 text-xs font-mono border border-slate-300 rounded bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setShowImportBox(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleImportPecas}
                    className="px-4 py-1.5 text-xs font-bold bg-sky-700 text-white rounded hover:bg-sky-800"
                  >
                    Processar Importação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Ambiente Fabril Gestamp Brasil • Compatibilidade Power Apps Studio
          </span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-900 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
