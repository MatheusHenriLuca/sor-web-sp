import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Search,
  Calendar,
  Layers,
  Clock
} from 'lucide-react';
import { FalhaEntregaRecord, UsuarioQualidade } from '../types';
import { spStore } from '../services/sharepointService';
import { CLIENTES_LIST, DEFAULT_CLIENTE, getClientBadgeInfo } from '../constants/clientes';
import { formatDateBR } from '../utils/date';

interface FalhaEntregaViewProps {
  onNavigate: (screen: any) => void;
  currentUser: UsuarioQualidade;
}

export const FalhaEntregaView: React.FC<FalhaEntregaViewProps> = ({ onNavigate, currentUser }) => {
  const [falhas, setFalhas] = useState<FalhaEntregaRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Novo registro state
  const [form, setForm] = useState<Partial<FalhaEntregaRecord>>({
    data: new Date().toISOString().split('T')[0],
    cliente: DEFAULT_CLIENTE,
    produto: 'COROLLA',
    turno: '1º Turno',
    qtdFalha: 1,
    motivoFalha: 'Atraso Logístico no Envio',
    areaFmds: 'FMDS 01',
    observacao: ''
  });

  const loadData = () => {
    setFalhas(spStore.getFalhasEntrega());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    spStore.saveFalhaEntrega(form);
    setNotification({ type: 'success', message: 'Falha de entrega cadastrada com sucesso!' });
    setModalOpen(false);
    loadData();
  };

  const handleDelete = () => {
    if (deleteId) {
      spStore.deleteFalhaEntrega(deleteId);
      setNotification({ type: 'success', message: 'Registro de falha excluído com sucesso.' });
      setDeleteId(null);
      loadData();
    }
  };

  const getClientBadge = (cliente: string) => {
    return getClientBadgeInfo(cliente);
  };

  const filteredFalhas = falhas.filter(f => 
    (f.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.produto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.motivoFalha || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.areaFmds || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPecas = falhas.reduce((acc, curr) => acc + (curr.qtdFalha || 0), 0);

  return (
    <div className="w-full flex flex-col gap-4 pb-16 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-[#edfdf3] text-[#0f7b3a] border-[#b8e8c8]' 
              : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-inherit opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => onNavigate('menu-2')}
            className="btn-secondary h-9 px-3 text-xs font-semibold"
            title="Voltar à Visão Geral"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-[#0f172a] tracking-tight">
              Gestão de Falhas de Entrega
            </h1>
            <p className="text-xs text-[#64748b]">
              Registro e rastreabilidade logística de expedição e montadoras
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary h-9 px-4 text-xs font-semibold"
        >
          <Plus size={15} />
          <span>Registrar Falha de Entrega</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-saas p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Total Ocorrências
          </span>
          <div className="text-2xl font-bold font-display text-[#0f172a] mt-2 font-mono">
            {falhas.length}
          </div>
        </div>

        <div className="card-saas p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Peças Não Entregues
          </span>
          <div className="text-2xl font-bold font-display text-rose-600 mt-2 font-mono">
            {totalPecas.toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="card-saas p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Status Operacional
          </span>
          <div className="text-xs font-semibold text-emerald-700 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Monitoramento Ativo
          </div>
        </div>

        <div className="card-saas p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Repositório SharePoint
          </span>
          <div className="text-xs font-medium text-[#0f172a] mt-2 truncate font-mono">
            Lista_Falha_de_Entrega
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            className="form-input !h-9 !pl-9 !pr-8 text-xs"
            placeholder="Buscar por cliente, motivo ou FMDS..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span className="text-xs text-[#64748b] font-medium hidden sm:inline tabular-nums">
          {filteredFalhas.length} registros encontrados
        </span>
      </div>

      {/* Tabela SaaS */}
      <div className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]/90 text-xs font-display font-semibold text-[#64748b]">
                <th className="py-3 px-4 w-12 text-center font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Data</th>
                <th className="py-3 px-4 font-semibold">Cliente (Montadora)</th>
                <th className="py-3 px-4 font-semibold">Produto / Veículo</th>
                <th className="py-3 px-4 font-semibold">Turno</th>
                <th className="py-3 px-4 text-center font-semibold">Qtd Falha</th>
                <th className="py-3 px-4 font-semibold">Motivo da Falha</th>
                <th className="py-3 px-4 font-semibold">Área / FMDS</th>
                <th className="py-3 px-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-xs">
              {filteredFalhas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#64748b]">
                    Nenhuma falha de entrega localizada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredFalhas.map(f => {
                  const badge = getClientBadge(f.cliente || '');
                  return (
                    <tr key={f.id} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="py-3 px-4 text-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${badge.color}`}>
                          {badge.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748b]">
                        {formatDateBR(f.data)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0f172a]">
                        {f.cliente}
                      </td>
                      <td className="py-3 px-4 text-[#0f172a]">
                        {f.produto}
                      </td>
                      <td className="py-3 px-4 text-[#64748b]">
                        {f.turno}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-50 text-rose-600 border border-rose-100">
                          {f.qtdFalha} pçs
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#334155] max-w-xs truncate" title={f.motivoFalha}>
                        {f.motivoFalha}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {f.areaFmds}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          type="button"
                          onClick={() => setDeleteId(f.id)}
                          className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100"
                          title="Excluir ocorrência"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Registro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-saas !p-0 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Truck size={16} />
                </div>
                <h3 className="font-display font-bold text-[#0f172a] text-sm sm:text-base">
                  Registrar Nova Falha de Entrega
                </h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="form-label block mb-1">Data da Falha</label>
                  <input 
                    type="date"
                    className="form-input text-xs font-mono"
                    value={form.data}
                    onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label block mb-1">Turno</label>
                  <select 
                    className="form-input text-xs"
                    value={form.turno}
                    onChange={e => setForm(prev => ({ ...prev, turno: e.target.value }))}
                  >
                    <option value="1º Turno">1º Turno</option>
                    <option value="2º Turno">2º Turno</option>
                    <option value="3º Turno">3º Turno</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="form-label block mb-1">Cliente</label>
                  <select 
                    className="form-input text-xs"
                    value={form.cliente}
                    onChange={e => setForm(prev => ({ ...prev, cliente: e.target.value }))}
                  >
                    {CLIENTES_LIST.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label block mb-1">Produto / Veículo</label>
                  <input 
                    type="text"
                    className="form-input text-xs"
                    value={form.produto}
                    onChange={e => setForm(prev => ({ ...prev, produto: e.target.value }))}
                    placeholder="Ex: COROLLA, YARIS"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="form-label block mb-1">Qtd. Afetada</label>
                  <input 
                    type="number"
                    min="1"
                    className="form-input text-xs font-mono font-bold"
                    value={form.qtdFalha}
                    onChange={e => setForm(prev => ({ ...prev, qtdFalha: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label block mb-1">Área / FMDS</label>
                  <input 
                    type="text"
                    className="form-input text-xs"
                    value={form.areaFmds}
                    onChange={e => setForm(prev => ({ ...prev, areaFmds: e.target.value }))}
                    placeholder="Ex: FMDS 01, Expedição"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label block mb-1">Motivo da Falha</label>
                <input 
                  type="text"
                  className="form-input text-xs"
                  value={form.motivoFalha}
                  onChange={e => setForm(prev => ({ ...prev, motivoFalha: e.target.value }))}
                  placeholder="Ex: Atraso Logístico, Divergência de Quantidade..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e2e8f0] mt-2">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary h-9 px-4 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary h-9 px-4 text-xs font-semibold"
                >
                  Salvar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-saas !p-6 shadow-2xl w-full max-w-sm overflow-hidden text-center flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#0f172a] text-base">Excluir Registro?</h3>
              <p className="text-xs text-[#64748b] mt-1">
                Tem certeza de que deseja remover permanentemente este registro de falha de entrega?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setDeleteId(null)}
                className="btn-secondary h-9 px-4 text-xs font-semibold flex-1"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleDelete}
                className="btn-primary !bg-rose-600 hover:!bg-rose-700 !border-rose-600 h-9 px-4 text-xs font-semibold flex-1"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FalhaEntregaView;
