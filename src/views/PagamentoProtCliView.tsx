import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Search, 
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { RNCRecord, UsuarioQualidade } from '../types';
import { spStore } from '../services/sharepointService';
import { getClientBadgeInfo } from '../constants/clientes';
import { formatDateBR } from '../utils/date';

interface PagamentoProtCliViewProps {
  onNavigate: (screen: any) => void;
  currentUser: UsuarioQualidade;
}

export const PagamentoProtCliView: React.FC<PagamentoProtCliViewProps> = ({ onNavigate, currentUser }) => {
  const [aprovados, setAprovados] = useState<RNCRecord[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    const list = spStore.getRNCs().filter(r => r.protcliente === 'Aprovado');
    setAprovados(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLiquidarLote = () => {
    // Espelha fielmente Icon8.OnSelect do Power Apps:
    // ForAll(Gallery_Lista_Protecao_ao_Cliente.AllItems, Patch('Resumo dos Incidentes...', ThisRecord, {protcliente: "Registro Pago", data_pagamento: Today() - 1}))
    const count = spStore.liquidarProtecoesCliente();
    setNotification({
      type: 'success',
      message: `${count} registro(s) liquidado(s) com sucesso como 'Registro Pago' no SharePoint!`
    });
    loadData();
  };

  const getClientBadge = (cliente: string) => {
    return getClientBadgeInfo(cliente);
  };

  const filteredAprovados = aprovados.filter(r => 
    (r.field1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.codigoRastreabilidade || '').includes(searchTerm) ||
    (r.componente || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-4 pb-16 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <CheckCircle2 size={16} />
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-xs">
            <DollarSign size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-[#0f172a] tracking-tight">
              Liquidação de Pagamentos: Proteção ao Cliente
            </h1>
            <p className="text-xs text-[#64748b]">
              Autorização e baixa financeira de RNCs com proteção aprovada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={loadData}
            className="btn-secondary h-9 px-3.5 text-xs font-semibold"
            title="Recarregar dados"
          >
            <RefreshCw size={14} />
            <span>Atualizar</span>
          </button>

          {aprovados.length > 0 && (
            <button 
              type="button"
              onClick={handleLiquidarLote}
              className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 h-9 px-4 text-xs font-semibold"
            >
              <CheckCircle2 size={15} />
              <span>Liquidar Todos ({aprovados.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {aprovados.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              className="form-input !h-9 !pl-9 !pr-8 text-xs"
              placeholder="Buscar RNC, cliente ou SAP..."
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
            {filteredAprovados.length} de {aprovados.length} registros pendentes
          </span>
        </div>
      )}

      {/* Main Table or Empty State */}
      <div className="card-saas overflow-hidden">
        {aprovados.length === 0 ? (
          <div className="py-16 text-center text-[#64748b] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#0f172a]">Nenhum pagamento pendente</h3>
              <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
                Todas as proteções ao cliente autorizadas já foram liquidadas e registradas como &apos;Registro Pago&apos;.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]/90 text-xs font-display font-semibold text-[#64748b]">
                  <th className="py-3 px-4 w-12 text-center font-semibold">#</th>
                  <th className="py-3 px-4 font-semibold">Código RNC</th>
                  <th className="py-3 px-4 font-semibold">Data Ocorrência</th>
                  <th className="py-3 px-4 font-semibold">Cliente (Montadora)</th>
                  <th className="py-3 px-4 font-semibold">Peça / Componente</th>
                  <th className="py-3 px-4 font-semibold">Etiqueta SAP (9 Dígitos)</th>
                  <th className="py-3 px-4 font-semibold">Status Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-xs">
                {filteredAprovados.map(r => {
                  const badge = getClientBadge(r.cliente || '');
                  return (
                    <tr key={r.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-4 text-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${badge.color}`}>
                          {badge.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0f6cbd]">
                        {r.field1 || `RNC-${r.id}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748b]">
                        {formatDateBR(r.dataOcorrencia)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0f172a]">
                        {r.cliente}
                      </td>
                      <td className="py-3 px-4 text-[#0f172a]">
                        {r.componente}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {r.codigoRastreabilidade || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.protcliente}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default PagamentoProtCliView;
