import React, { useMemo, useState } from 'react';
import { 
  ClipboardList, 
  ShieldCheck, 
  Users, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  FileText, 
  BarChart3,
  Layers,
  Sparkles,
  Calendar,
  Search,
  X,
  PieChart,
  Activity,
  AlertTriangle,
  Factory,
  Building2,
  TrendingUp,
  Check,
  Target,
  ShieldAlert,
  Filter,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { UsuarioQualidade, RNCRecord } from '../types';
import { spStore } from '../services/sharepointService';
import { getClientBadgeInfo } from '../constants/clientes';

interface Menu2ViewProps {
  currentUser: UsuarioQualidade;
  onNavigate: (screen: string, params?: any) => void;
  onOpenSharePointModal: () => void;
}

export const Menu2View: React.FC<Menu2ViewProps> = ({
  currentUser,
  onNavigate,
  onOpenSharePointModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const perfil = currentUser.perfil;
  const isOperator = perfil === 'User';

  const allRncs = spStore.getRNCs();

  // Estados de filtros interativos cruzados entre dashboards
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTipoRnc, setSelectedTipoRnc] = useState<string | null>(null);
  const [selectedProtCli, setSelectedProtCli] = useState<boolean | null>(null);
  const [selectedDefeito, setSelectedDefeito] = useState<string | null>(null);

  const hasActiveFilters = Boolean(
    selectedClient || selectedStatus || selectedTipoRnc || selectedProtCli || selectedDefeito
  );

  const clearAllFilters = () => {
    setSelectedClient(null);
    setSelectedStatus(null);
    setSelectedTipoRnc(null);
    setSelectedProtCli(null);
    setSelectedDefeito(null);
  };

  const handleGoToGalleryWithFilters = () => {
    onNavigate('lista-8d', {
      cliente: selectedClient || undefined,
      status: selectedStatus || undefined,
      tipo: selectedTipoRnc || (selectedProtCli ? 'protcliente' : undefined),
      search: selectedDefeito || undefined
    });
  };

  // Base filtrada cruzada conforme seleções ativas do usuário
  const filteredRncs = useMemo(() => {
    return allRncs.filter(r => {
      if (selectedClient) {
        const c = (r.cliente || 'OUTROS').trim().toUpperCase();
        if (c !== selectedClient.toUpperCase()) return false;
      }
      if (selectedStatus) {
        if (selectedStatus === 'Proteção ao cliente') {
          if (!r.protcliente || r.protcliente === 'Não') return false;
        } else if (r.status !== selectedStatus) {
          return false;
        }
      }
      if (selectedTipoRnc) {
        if (r.tipoRnc !== selectedTipoRnc) return false;
      }
      if (selectedProtCli) {
        if (!r.protcliente || r.protcliente === 'Não') return false;
      }
      if (selectedDefeito) {
        const rawDesc = (r.descricaoProblema || '').toLowerCase();
        const rawModo = (r.modoFalha || '').toLowerCase();
        const target = selectedDefeito.toLowerCase();
        if (!rawDesc.includes(target) && !rawModo.includes(target)) return false;
      }
      return true;
    });
  }, [allRncs, selectedClient, selectedStatus, selectedTipoRnc, selectedProtCli, selectedDefeito]);

  // Cálculo de alta performance de todas as métricas gerenciais e cruzadas
  const metrics = useMemo(() => {
    let open = 0;
    let concluido = 0;
    let prot = 0;
    let reprovado = 0;
    let totalPecas = 0;

    // Tipos de ocorrência
    let tipoFormal = 0;
    let tipoInformal = 0;
    let tipoInterno = 0;
    let tipoProtCliente = 0;

    // Status conforme sequência oficial da Imagem 7 do usuário
    let statusRelatorioInicial = 0;
    let statusRncEmitida = 0;
    let statusEmAndamento = 0;

    // Avaliações de Proteção ao Cliente
    let protPendentes = 0;
    let protAprovados = 0;

    const defectCounts: Record<string, { count: number; pecas: number }> = {};

    for (let i = 0; i < filteredRncs.length; i++) {
      const r = filteredRncs[i];
      const pecas = Number(r.quantidadeAfetada) || 1;
      totalPecas += pecas;

      // Status
      if (r.status === 'Em Andamento') {
        open++;
        statusEmAndamento++;
      } else if (r.status === 'Relatório Inicial') {
        open++;
        statusRelatorioInicial++;
      } else if (r.status === 'RNC Emitida') {
        open++;
        statusRncEmitida++;
      } else if (r.status === 'Concluído') {
        concluido++;
      } else if (r.status === 'Reprovado') {
        reprovado++;
      }

      // Proteção ao Cliente
      if (r.protcliente && r.protcliente !== 'Não') {
        prot++;
        tipoProtCliente++;
        if (r.protcliente === 'Sim') protPendentes++;
        if (r.protcliente === 'Aprovado' || r.protcliente === 'Registro Pago') protAprovados++;
      }

      // Tipos de RNC
      if (r.tipoRnc === 'Formal') tipoFormal++;
      else if (r.tipoRnc === 'Informal') tipoInformal++;
      else if (r.tipoRnc === 'Interno') tipoInterno++;

      // Defeito / Modo de Falha
      const rawDesc = (r.modoFalha || r.descricaoProblema || 'Não especificado').trim();
      let d = rawDesc;
      if (d.length > 35) d = d.substring(0, 32) + '...';
      if (!defectCounts[d]) defectCounts[d] = { count: 0, pecas: 0 };
      defectCounts[d].count++;
      defectCounts[d].pecas += pecas;
    }

    // Base de montadoras: computada respeitando os filtros (exceto o próprio cliente se estiver alternando)
    const clientCounts: Record<string, { count: number; pecas: number }> = {};
    const montadoraBase = (selectedStatus || selectedTipoRnc || selectedProtCli || selectedDefeito)
      ? allRncs.filter(r => {
          if (selectedStatus) {
            if (selectedStatus === 'Proteção ao cliente') {
              if (!r.protcliente || r.protcliente === 'Não') return false;
            } else if (r.status !== selectedStatus) {
              return false;
            }
          }
          if (selectedTipoRnc && r.tipoRnc !== selectedTipoRnc) return false;
          if (selectedProtCli && (!r.protcliente || r.protcliente === 'Não')) return false;
          if (selectedDefeito) {
            const rawDesc = (r.descricaoProblema || '').toLowerCase();
            const rawModo = (r.modoFalha || '').toLowerCase();
            const target = selectedDefeito.toLowerCase();
            if (!rawDesc.includes(target) && !rawModo.includes(target)) return false;
          }
          return true;
        })
      : allRncs;

    for (let i = 0; i < montadoraBase.length; i++) {
      const r = montadoraBase[i];
      const pecas = Number(r.quantidadeAfetada) || 1;
      const c = (r.cliente || 'OUTROS').trim().toUpperCase();
      if (!clientCounts[c]) clientCounts[c] = { count: 0, pecas: 0 };
      clientCounts[c].count++;
      clientCounts[c].pecas += pecas;
    }

    // TODAS as montadoras (Imagem 5: não limita a Top 5, mostra todas com scroll)
    const allClients = Object.entries(clientCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        pecas: data.pecas,
        percent: montadoraBase.length > 0 ? Math.round((data.count / montadoraBase.length) * 100) : 0
      }));

    // TODOS os modos de falha (mostra todos com barra de rolagem, mantendo tamanho fixo do card)
    const topDefects = Object.entries(defectCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        pecas: data.pecas,
        percent: filteredRncs.length > 0 ? Math.round((data.count / filteredRncs.length) * 100) : 0
      }));

    const taxaResolucao = filteredRncs.length > 0 ? Math.round((concluido / filteredRncs.length) * 100) : 0;
    const taxaRetencaoProt = prot > 0 ? Math.round((protAprovados / prot) * 100) : 100;

    return {
      openCount: open,
      concluidoCount: concluido,
      reprovadoCount: reprovado,
      protCliCount: prot,
      protPendentes,
      protAprovados,
      totalPecas,
      taxaResolucao,
      taxaRetencaoProt,
      tipoFormal,
      tipoInformal,
      tipoInterno,
      tipoProtCliente,
      statusRelatorioInicial,
      statusRncEmitida,
      statusEmAndamento,
      allClients,
      topDefects
    };
  }, [allRncs, filteredRncs, selectedStatus, selectedTipoRnc, selectedProtCli, selectedDefeito]);

  const getClientBadge = (cliente: string) => {
    return getClientBadgeInfo(cliente);
  };

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 animate-in fade-in duration-150 pb-16 overflow-x-hidden min-w-0">
      
      {/* 1. BARRA DE PESQUISA & ATALHOS RÁPIDOS */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              onNavigate('lista-8d', { search: searchQuery.trim() });
            }
          }} 
          className="relative w-full max-w-xl"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar por RNC, peça, montadora ou código SAP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 !pl-10 !pr-10 bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15 outline-none shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Limpar campo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn-secondary h-9 px-3 text-xs font-semibold gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Todos os Filtros</span>
          </button>
        )}
      </div>

      {/* BANNER FLUTUANTE DE FILTROS CRUZADOS ATIVOS (QUANDO SELECIONADO NO DASHBOARD) */}
      {hasActiveFilters && (
        <div className="card-saas p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/90 via-sky-50/90 to-indigo-50/90 border-blue-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#0f6cbd]" />
              Filtro Ativo no Dashboard:
            </span>
            {selectedClient && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs">
                Montadora: <strong>{selectedClient}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  title="Remover filtro de montadora"
                  aria-label="Remover filtro de montadora"
                  className="p-0.5 rounded hover:bg-blue-100 text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs">
                Status: <strong>{selectedStatus}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedStatus(null)}
                  title="Remover filtro de status"
                  aria-label="Remover filtro de status"
                  className="p-0.5 rounded hover:bg-blue-100 text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedTipoRnc && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-purple-900 border border-purple-200 shadow-2xs">
                Tipo: <strong>{selectedTipoRnc}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedTipoRnc(null)}
                  title="Remover filtro de tipo"
                  aria-label="Remover filtro de tipo"
                  className="p-0.5 rounded hover:bg-purple-100 text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedProtCli && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-200 shadow-2xs">
                <strong>Proteção ao Cliente</strong>
                <button
                  type="button"
                  onClick={() => setSelectedProtCli(null)}
                  title="Remover filtro de proteção ao cliente"
                  aria-label="Remover filtro de proteção ao cliente"
                  className="p-0.5 rounded hover:bg-emerald-100 text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedDefeito && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-rose-900 border border-rose-200 shadow-2xs">
                Defeito: <strong>{selectedDefeito}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedDefeito(null)}
                  title="Remover filtro de defeito"
                  aria-label="Remover filtro de defeito"
                  className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <span className="text-xs text-slate-600 font-medium">
              ({filteredRncs.length.toLocaleString('pt-BR')} registros correspondentes)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGoToGalleryWithFilters}
              className="btn-primary h-9 px-4 text-xs font-bold gap-2 shadow-sm bg-[#0f6cbd] hover:bg-[#0b5796] text-white cursor-pointer"
              title="Abrir a galeria de ocorrências com estes filtros já aplicados"
            >
              <span>Ver Ocorrências na Galeria ({filteredRncs.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. CARDS DE INDICADORES MACRO (KPI COCKPIT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total RNCs */}
        <div
          onClick={() => clearAllFilters()}
          className={`card-saas card-saas-hover cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all ${
            !hasActiveFilters ? 'ring-2 ring-blue-500/40 bg-white' : 'bg-white/80 opacity-90 hover:opacity-100'
          }`}
          title="Clique para redefinir e ver todos os registros"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Total de ocorrências</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0f6cbd] flex items-center justify-center border border-blue-100/80 group-hover:scale-105 group-hover:bg-[#0f6cbd] group-hover:text-white transition-all shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-extrabold text-[#0f172a] font-mono my-2.5 tracking-tight tabular-nums">
            {filteredRncs.length.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-[#64748b] flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
            <span>{metrics.totalPecas.toLocaleString('pt-BR')} peças afetadas</span>
            <span className="text-[11px] text-[#0f6cbd] font-semibold flex items-center gap-0.5">
              {hasActiveFilters ? 'Filtro Ativo' : 'Base Completa'}
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
            </span>
          </div>
        </div>

        {/* Card 2: Em Andamento / Tratativa */}
        <div
          onClick={() => setSelectedStatus(prev => prev === 'Em Andamento' ? null : 'Em Andamento')}
          className={`card-saas card-saas-hover cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all ${
            selectedStatus === 'Em Andamento'
              ? 'ring-2 ring-amber-500 bg-amber-50/70 shadow-md scale-[1.01]'
              : 'bg-gradient-to-b from-white to-amber-50/20'
          }`}
          title="Clique para filtrar apenas ocorrências em tratativa ativa"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900/80">Em tratativa ativa</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-extrabold text-amber-900 font-mono my-2.5 tracking-tight tabular-nums">
            {metrics.openCount.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-amber-800/80 flex items-center justify-between pt-2 border-t border-amber-100/80">
            <span>Em execução</span>
            <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-0.5">
              {selectedStatus === 'Em Andamento' ? 'Selecionado' : 'Filtrar'}
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
            </span>
          </div>
        </div>

        {/* Card 3: Proteção ao Cliente (VERDE, Destaque Chão de Fábrica - NOME OFICIAL PADRONIZADO) */}
        <div
          onClick={() => setSelectedProtCli(prev => prev ? null : true)}
          className={`card-saas card-saas-hover cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all border-emerald-200/80 ${
            selectedProtCli
              ? 'ring-2 ring-emerald-600 bg-emerald-50 shadow-md scale-[1.01]'
              : 'bg-gradient-to-b from-white to-emerald-50/20'
          }`}
          title="Clique para filtrar apenas registros do programa Proteção ao Cliente"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-950">Proteção ao Cliente</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-extrabold text-emerald-950 font-mono my-2.5 tracking-tight tabular-nums">
            {metrics.protCliCount.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-emerald-800 flex items-center justify-between pt-2 border-t border-emerald-100/80">
            <span>
              {metrics.protPendentes > 0 ? (
                <strong className="text-amber-700">{metrics.protPendentes} aguardando avaliação</strong>
              ) : (
                'Detecções de proteção na fábrica'
              )}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5">
              {selectedProtCli ? 'Selecionado' : 'Filtrar'}
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
            </span>
          </div>
        </div>

        {/* Card 4: Concluídas / Taxa de Eficácia */}
        <div
          onClick={() => setSelectedStatus(prev => prev === 'Concluído' ? null : 'Concluído')}
          className={`card-saas card-saas-hover cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all ${
            selectedStatus === 'Concluído'
              ? 'ring-2 ring-sky-600 bg-sky-50 shadow-md scale-[1.01]'
              : 'bg-gradient-to-b from-white to-sky-50/20'
          }`}
          title="Clique para filtrar apenas ocorrências concluídas"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-950">Eficácia de resolução</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200/70 group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-2.5">
            <span className="text-3xl sm:text-4xl font-display font-extrabold text-sky-950 font-mono tracking-tight tabular-nums">
              {metrics.taxaResolucao}%
            </span>
            <span className="text-xs text-sky-800/80 font-medium">
              ({metrics.concluidoCount.toLocaleString('pt-BR')} fechadas)
            </span>
          </div>
          <div className="text-xs text-sky-800 flex items-center justify-between pt-2 border-t border-sky-100/80">
            <span>Ocorrências concluídas</span>
            <span className="text-[11px] text-sky-700 font-semibold flex items-center gap-0.5">
              {selectedStatus === 'Concluído' ? 'Selecionado' : 'Filtrar'}
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
            </span>
          </div>
        </div>

      </div>

      {/* 3. MÓDULOS OPERACIONAIS (Acesso Direto e Intuitivo) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-[#94a3b8]">
            Módulos operacionais
          </h2>
          <span className="text-xs text-[#94a3b8]">Ações diretas do sistema</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Módulo 1 */}
          <div
            onClick={() => onNavigate('lista-8d')}
            className="card-saas card-saas-hover cursor-pointer flex items-start gap-3.5 p-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0f6cbd] flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-[#0f6cbd] group-hover:text-white transition-all shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-display font-bold text-[#0f172a] group-hover:text-[#0f6cbd] transition-colors truncate">
                Lista de ocorrências (RNC)
              </div>
              <div className="text-xs text-[#64748b] mt-0.5 line-clamp-2 leading-relaxed">
                Visualização por lista e blocos com filtros completos.
              </div>
            </div>
          </div>

          {/* Módulo 2: Proteção ao Cliente (VERDE - NOME PADRONIZADO) */}
          <div
            onClick={() => onNavigate('registro-protcli')}
            className="card-saas card-saas-hover cursor-pointer flex items-start gap-3.5 p-4 group border-emerald-100"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-display font-bold text-[#0f172a] group-hover:text-emerald-700 transition-colors truncate">
                Lançamento Proteção ao Cliente
              </div>
              <div className="text-xs text-[#64748b] mt-0.5 line-clamp-2 leading-relaxed">
                Apontamento de contenção e rastreabilidade SAP para proteção ao cliente.
              </div>
            </div>
          </div>

          {/* Módulo 3 */}
          <div
            onClick={() => onNavigate('falha-entrega')}
            className="card-saas card-saas-hover cursor-pointer flex items-start gap-3.5 p-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-700 group-hover:text-white transition-all shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-display font-bold text-[#0f172a] group-hover:text-amber-700 transition-colors truncate">
                Falhas de entrega
              </div>
              <div className="text-xs text-[#64748b] mt-0.5 line-clamp-2 leading-relaxed">
                Registro e contenção de divergências logísticas de expedição.
              </div>
            </div>
          </div>

          {/* Módulo 4 */}
          <div
            onClick={() => onNavigate('cadastro-usuarios')}
            className="card-saas card-saas-hover cursor-pointer flex items-start gap-3.5 p-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-slate-700 group-hover:text-white transition-all shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-display font-bold text-[#0f172a] group-hover:text-slate-800 transition-colors truncate">
                Gestão de usuários
              </div>
              <div className="text-xs text-[#64748b] mt-0.5 line-clamp-2 leading-relaxed">
                Perfis de acesso da qualidade e colaboradores cadastrados.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. DASHBOARDS GRÁFICOS EXECUTIVOS (FILTROS CRUZADOS RESPONSIVOS) - CADA UM OCUPANDO METADE DA TELA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Painel 1: Volume por Montadora (Ocupa 50% da tela) */}
        <div className="card-saas p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#e2e8f0] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f6cbd] flex items-center justify-center border border-blue-100/70 shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-display font-bold text-[#0f172a]">
                    Volume de ocorrências por montadora
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Distribuição quantitativa e representatividade na base total ({metrics.allClients.length} montadoras)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedClient && (
                  <button
                    type="button"
                    onClick={() => setSelectedClient(null)}
                    className="text-xs text-[#0f6cbd] font-semibold hover:underline"
                  >
                    Limpar Montadora
                  </button>
                )}
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 tabular-nums">
                  {filteredRncs.length.toLocaleString('pt-BR')} registros
                </span>
              </div>
            </div>

            {/* Lista Gráfica com Barra de Rolagem Mantendo Altura Fixa (Foto 5) */}
            <div className="flex flex-col gap-3 pt-4 max-h-[380px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {metrics.allClients.map(item => {
                const isSelected = selectedClient === item.name;
                const badge = getClientBadge(item.name);
                return (
                  <div 
                    key={item.name}
                    onClick={() => setSelectedClient(prev => prev === item.name ? null : item.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-blue-50/90 border-[#0f6cbd] ring-2 ring-[#0f6cbd]/30 shadow-xs' 
                        : 'bg-slate-50/70 border-slate-200/80 hover:border-[#0f6cbd]/60 hover:bg-white hover:shadow-2xs'
                    }`}
                    title={`Clique para ${isSelected ? 'remover filtro' : 'filtrar ocorrências'} de ${item.name}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${badge.bg} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span className={`font-display text-xs sm:text-sm truncate ${isSelected ? 'font-extrabold text-[#0b5796]' : 'font-bold text-[#0f172a] group-hover:text-[#0f6cbd]'}`}>
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#0f6cbd] text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#64748b] hidden sm:inline">
                          {item.pecas.toLocaleString('pt-BR')} pçs
                        </span>
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border tabular-nums shadow-2xs ${
                          isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-[#0f172a]'
                        }`}>
                          {item.count.toLocaleString('pt-BR')} ({item.percent}%)
                        </span>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('lista-8d', { cliente: item.name });
                            }}
                            className="px-2 py-0.5 text-[11px] font-bold text-[#0b5796] bg-white border border-blue-200 rounded-md hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
                            title="Ir para a galeria desta montadora"
                          >
                            <span>Galeria</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de Progresso com Gradiente */}
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected 
                            ? 'bg-[#0f6cbd]' 
                            : 'bg-gradient-to-r from-[#0f6cbd] to-[#0e67b0] group-hover:from-[#0b5a9e] group-hover:to-[#0f6cbd]'
                        }`} 
                        style={{ width: `${Math.max(item.percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748b] mt-4">
            <span>Clique em qualquer montadora para aplicar filtro cruzado</span>
            <button 
              type="button"
              onClick={() => onNavigate('lista-8d', { cliente: selectedClient || undefined })}
              className="text-[#0f6cbd] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas na Galeria</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Painel 2: Origem das Ocorrências — Ocupa 1 Coluna */}
        <div className="card-saas p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e8f0] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100/70 shadow-xs">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-display font-bold text-[#0f172a]">
                    Origem das Ocorrências
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Cliente vs Internas vs Proteção
                  </p>
                </div>
              </div>
            </div>

            {/* Categorias com Proporções e Filtro Cruzado */}
            <div className="flex flex-col gap-2.5 pt-4">
              
              {/* Cliente Formal */}
              <div 
                onClick={() => setSelectedTipoRnc(prev => prev === 'Formal' ? null : 'Formal')}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedTipoRnc === 'Formal'
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                    : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <div>
                    <span className="font-bold text-xs text-[#0f172a] block">Ocorrências Cliente (Formal)</span>
                    <span className="text-[11px] text-[#64748b]">Comunicações oficiais de montadora</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-sm text-blue-900 block tabular-nums">
                    {metrics.tipoFormal}
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    {filteredRncs.length > 0 ? Math.round((metrics.tipoFormal / filteredRncs.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Cliente Informal */}
              <div 
                onClick={() => setSelectedTipoRnc(prev => prev === 'Informal' ? null : 'Informal')}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedTipoRnc === 'Informal'
                    ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300'
                    : 'bg-purple-50/50 border-purple-100 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <div>
                    <span className="font-bold text-xs text-[#0f172a] block">Ocorrências Cliente (Informal)</span>
                    <span className="text-[11px] text-[#64748b]">Alertas operacionais de linha</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-sm text-purple-900 block tabular-nums">
                    {metrics.tipoInformal}
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {filteredRncs.length > 0 ? Math.round((metrics.tipoInformal / filteredRncs.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Ocorrências Internas */}
              <div 
                onClick={() => setSelectedTipoRnc(prev => prev === 'Interno' ? null : 'Interno')}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedTipoRnc === 'Interno'
                    ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Factory className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-xs text-[#0f172a] block">Ocorrências Internas</span>
                    <span className="text-[11px] text-[#64748b]">Detectadas nos processos fabris</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-sm text-slate-900 block tabular-nums">
                    {metrics.tipoInterno}
                  </span>
                  <span className="text-[10px] text-slate-700 font-semibold">
                    {filteredRncs.length > 0 ? Math.round((metrics.tipoInterno / filteredRncs.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Proteção ao Cliente (VERDE - NOME PADRONIZADO) */}
              <div 
                onClick={() => setSelectedProtCli(prev => prev ? null : true)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedProtCli
                    ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-400'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="font-bold text-xs text-emerald-950 block">Proteção ao Cliente</span>
                    <span className="text-[11px] text-emerald-800">Detecções de proteção na fábrica</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-sm text-emerald-950 block tabular-nums">
                    {metrics.protCliCount}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {filteredRncs.length > 0 ? Math.round((metrics.protCliCount / filteredRncs.length) * 100) : 0}%
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-[#64748b] mt-4 flex items-center justify-between">
            <span>Clique para filtrar origem</span>
            <span className="font-semibold text-emerald-700 font-mono">100% Rastreado</span>
          </div>
        </div>

      </div>

      {/* 5. SEGUNDA LINHA DE DASHBOARDS (STATUS DE CONTENÇÃO & RESOLUÇÃO + PARETO DE MODOS DE FALHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Painel 3: Status de Contenção & Tratativa (IMAGEM 6 E IMAGEM 7: SEQUÊNCIA E ITENS EXATOS DA FOTO 7) */}
        <div className="card-saas p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e8f0] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/70 shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-display font-bold text-[#0f172a]">
                    Status de Contenção & Tratativa das Ocorrências
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Acompanhamento de triagem inicial, contenção fabril e resolução
                  </p>
                </div>
              </div>

              {selectedStatus && (
                <button
                  type="button"
                  onClick={() => setSelectedStatus(null)}
                  className="text-xs text-[#0f6cbd] font-semibold hover:underline"
                >
                  Limpar Status
                </button>
              )}
            </div>

            {/* Grid dos 5 Status na Sequência Exata da Imagem 7:
                1. Proteção ao cliente
                2. Relatório Inicial
                3. RNC Emitida
                4. Em Andamento
                5. Concluído */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-4">
              
              {/* 1. Proteção ao cliente (Primeiro item da Foto 7) */}
              <div 
                onClick={() => setSelectedProtCli(prev => prev ? null : true)}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  selectedProtCli
                    ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/50'
                }`}
                title="Clique para filtrar Proteção ao Cliente"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Proteção</span>
                  <span className="text-xs font-bold text-emerald-950 block mt-0.5">Proteção ao cliente</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-lg sm:text-xl font-mono font-extrabold text-emerald-950 block tabular-nums">
                    {metrics.protCliCount}
                  </span>
                  <span className="text-[10px] text-emerald-700">Ações preventivas</span>
                </div>
              </div>

              {/* 2. Relatório Inicial (Segundo item da Foto 7) */}
              <div 
                onClick={() => setSelectedStatus(prev => prev === 'Relatório Inicial' ? null : 'Relatório Inicial')}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  selectedStatus === 'Relatório Inicial'
                    ? 'bg-sky-100/80 border-sky-500 ring-2 ring-sky-400 shadow-xs'
                    : 'bg-sky-50 border-sky-100 hover:bg-sky-100/50'
                }`}
                title="Clique para filtrar Relatório Inicial"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Triagem</span>
                  <span className="text-xs font-bold text-sky-950 block mt-0.5">Relatório Inicial</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-lg sm:text-xl font-mono font-extrabold text-sky-950 block tabular-nums">
                    {metrics.statusRelatorioInicial}
                  </span>
                  <span className="text-[10px] text-sky-700">Aguardando tratativa</span>
                </div>
              </div>

              {/* 3. RNC Emitida (Terceiro item da Foto 7, antes ausente) */}
              <div 
                onClick={() => setSelectedStatus(prev => prev === 'RNC Emitida' ? null : 'RNC Emitida')}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  selectedStatus === 'RNC Emitida'
                    ? 'bg-indigo-100/80 border-indigo-500 ring-2 ring-indigo-400 shadow-xs'
                    : 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/50'
                }`}
                title="Clique para filtrar RNC Emitida"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Oficializada</span>
                  <span className="text-xs font-bold text-indigo-950 block mt-0.5">RNC Emitida</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-lg sm:text-xl font-mono font-extrabold text-indigo-950 block tabular-nums">
                    {metrics.statusRncEmitida}
                  </span>
                  <span className="text-[10px] text-indigo-700">Oficial no cliente</span>
                </div>
              </div>

              {/* 4. Em Andamento (Quarto item da Foto 7) */}
              <div 
                onClick={() => setSelectedStatus(prev => prev === 'Em Andamento' ? null : 'Em Andamento')}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  selectedStatus === 'Em Andamento'
                    ? 'bg-amber-100/80 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                    : 'bg-amber-50 border-amber-100 hover:bg-amber-100/50'
                }`}
                title="Clique para filtrar Em Andamento"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Em Curso</span>
                  <span className="text-xs font-bold text-amber-950 block mt-0.5">Em Andamento</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-lg sm:text-xl font-mono font-extrabold text-amber-950 block tabular-nums">
                    {metrics.statusEmAndamento}
                  </span>
                  <span className="text-[10px] text-amber-700">Contenção ativa</span>
                </div>
              </div>

              {/* 5. Concluído (Quinto item da Foto 7) */}
              <div 
                onClick={() => setSelectedStatus(prev => prev === 'Concluído' ? null : 'Concluído')}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  selectedStatus === 'Concluído'
                    ? 'bg-slate-200/90 border-slate-500 ring-2 ring-slate-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                title="Clique para filtrar Concluídos"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Finalizadas</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">Concluído</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 block tabular-nums">
                    {metrics.concluidoCount}
                  </span>
                  <span className="text-[10px] text-slate-600">Resolvidas</span>
                </div>
              </div>

            </div>

            {/* Barra Visual de Resolução das Ocorrências (Imagem 6) */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Progresso Geral de Resolução das Ocorrências</span>
                <span className="font-mono font-bold text-emerald-700">{metrics.taxaResolucao}% de Conclusão</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-500" 
                  style={{ width: `${metrics.taxaResolucao}%` }}
                  title="Concluídas"
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${100 - metrics.taxaResolucao}%` }}
                  title="Em Andamento / Triagem"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748b] mt-2 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> {metrics.concluidoCount} Concluídas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> {metrics.openCount} Em Tratativa Ativa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel 4: Pareto dos Principais Modos de Falha / Defeitos Reportados */}
        <div className="card-saas p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e8f0] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100/70 shadow-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-display font-bold text-[#0f172a]">
                    Pareto de Modos de Falha Recorrentes
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Principais causas registradas no chão de fábrica ({metrics.topDefects.length} causas mapeadas)
                  </p>
                </div>
              </div>

              {selectedDefeito && (
                <button
                  type="button"
                  onClick={() => setSelectedDefeito(null)}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Limpar Defeito
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-3 max-h-[380px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {metrics.topDefects.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">
                  Nenhum modo de falha registrado para os filtros atuais.
                </div>
              ) : (
                metrics.topDefects.map((def, idx) => {
                  const isSelected = selectedDefeito === def.name;
                  const maxCount = metrics.topDefects[0]?.count || 1;
                  const relativePercent = Math.max(Math.round((def.count / maxCount) * 100), 5);

                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDefeito(prev => prev === def.name ? null : def.name)}
                      className={`flex flex-col gap-1.5 p-2.5 rounded-xl transition border cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-200'
                          : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                      title={`Clique para filtrar pelo defeito ${def.name}`}
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-slate-800 truncate min-w-0">
                          <strong className="text-slate-400 font-mono mr-1.5">#{idx + 1}</strong>
                          {def.name}
                        </span>
                        <span className="font-mono font-bold text-slate-700 tabular-nums shrink-0">
                          {def.count} ({def.pecas.toLocaleString('pt-BR')} pçs)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected 
                              ? 'bg-rose-600' 
                              : idx === 0 
                                ? 'bg-rose-500' 
                                : idx === 1 
                                  ? 'bg-amber-500' 
                                  : 'bg-[#0f6cbd]'
                          }`}
                          style={{ width: `${relativePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-[#64748b] flex items-center justify-between mt-3">
            <span>Clique para filtrar por modo de falha</span>
            <span className="font-semibold text-slate-700">Gestamp Sorocaba</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Menu2View;
