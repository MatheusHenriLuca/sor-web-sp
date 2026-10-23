import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertTriangle,
  Barcode,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Users
} from 'lucide-react';
import { RNCRecord, UsuarioQualidade } from '../types';
import { spStore } from '../services/sharepointService';
import { formatDateBR } from '../utils/date';

interface DashboardViewProps {
  onNavigate: (screen: any, params?: any) => void;
  currentUser: UsuarioQualidade;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, currentUser }) => {
  const rncs = spStore.getRNCs();
  const alertas = spStore.getAlertas();

  const totalRncs = rncs.length;
  const emAndamento = rncs.filter(r => r.status === 'Em Andamento').length;
  const concluidos = rncs.filter(r => r.status === 'Concluído').length;
  const relInicial = rncs.filter(r => r.status === 'Relatório Inicial').length;
  const protecoesPendentes = rncs.filter(r => r.protcliente === 'Sim').length;

  const isOperator = currentUser.perfil === 'User';

  return (
    <div className="w-full flex flex-col gap-4 pb-16 animate-in fade-in duration-150">
      
      {/* Top Welcome Banner */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#061338] via-[#092162] to-[#0d348a] text-white p-5 sm:p-6 shadow-md border border-sky-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SOR Engine
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cockpit de Indicadores da Qualidade
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/80 max-w-2xl mt-1 leading-relaxed">
              Tratativa de Não Conformidades, Contenção e Rastreabilidade SAP em tempo real.
            </p>
          </div>

          {/* Botões removidos da direita para evitar duplicação com o menu lateral */}
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        <div 
          onClick={() => onNavigate('lista-8d', { tipo: 'Tudo' })}
          className="card-saas p-4 sm:p-5 flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-sky-700 transition">
              Total RNCs
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {totalRncs.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Base histórica ativa</span>
        </div>

        <div 
          onClick={() => onNavigate('lista-8d', { status: 'Em Andamento' })}
          className="card-saas p-4 sm:p-5 flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-amber-700 transition">
              Em Andamento
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">
            {emAndamento.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-amber-700/80 font-bold mt-1 block">Ocorrências em tratativa ativa</span>
        </div>

        <div 
          onClick={() => onNavigate('lista-8d', { status: 'Relatório Inicial' })}
          className="card-saas p-4 sm:p-5 flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-sky-700 transition">
              Relatório Inicial
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 font-mono tracking-tight">
            {relInicial.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-sky-700/80 font-bold mt-1 block">Fase de triagem D1-D3</span>
        </div>

        <div 
          onClick={() => onNavigate('lista-8d', { status: 'Concluído' })}
          className="card-saas p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700 transition">
              Concluídas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
            {concluidos.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-emerald-700/80 font-bold mt-1 block">Eficácia validada</span>
        </div>

        <div 
          onClick={() => onNavigate('lista-8d', { tipo: 'protcliente' })}
          className="card-saas p-4 sm:p-5 flex flex-col justify-between hover:border-rose-300 transition-all cursor-pointer group col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-rose-700 transition">
              Proteção Cliente
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
            {protecoesPendentes.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-rose-700/80 font-bold mt-1 block">Bloqueios SAP ativos</span>
        </div>

      </section>

      {/* Bento Grid: Ocorrências Recentes + Alertas & Atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Tabela de Ocorrências Recentes (2 colunas) */}
        <div className="lg:col-span-2 card-saas overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-700" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Ocorrências Recentes no Chão de Fábrica
                </h2>
              </div>
              <button 
                onClick={() => onNavigate('lista-8d', { tipo: 'Tudo' })}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition"
              >
                <span>Ver Todas</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th className="py-3 px-5">Código</th>
                    <th className="py-3 px-5">Cliente</th>
                    <th className="py-3 px-5">Defeito / Peça</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rncs.slice(0, 6).map(rnc => (
                    <tr key={rnc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-5">
                        <strong className="font-mono text-slate-900 font-bold">{rnc.field1 || `RNC-${rnc.id}`}</strong>
                        <div className="text-[10px] text-slate-400 font-mono">{formatDateBR(rnc.dataOcorrencia)}</div>
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-800">
                        {rnc.cliente}
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{rnc.produto}</div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="max-w-[200px] truncate font-medium text-slate-800">
                          {rnc.descricaoProblema || 'Não informado'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{rnc.componente}</div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          rnc.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                          rnc.status === 'Em Andamento' ? 'bg-amber-100 text-amber-900' :
                          rnc.status === 'Relatório Inicial' ? 'bg-sky-100 text-sky-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {rnc.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button 
                          onClick={() => {
                            if (rnc.status === 'Relatório Inicial' && !isOperator) {
                              onNavigate('registro-8d', { edicao: true, rncId: rnc.id });
                            } else {
                              onNavigate('detalhes-8d', { rncId: rnc.id });
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alertas & Atalhos Rápidos (1 coluna) */}
        <div className="flex flex-col gap-4">
          
          {/* Alertas da Qualidade */}
          <div className="card-saas p-5 flex flex-col gap-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Alertas da Qualidade Divulgados
              </h3>
            </div>

            {alertas.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum alerta registrado recentemente.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {alertas.slice(0, 3).map(alerta => (
                  <div 
                    key={alerta.id}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950"
                  >
                    <div className="font-extrabold truncate">{alerta.produto} - {alerta.defeito}</div>
                    <div className="text-[11px] text-amber-800/80 mt-0.5">
                      Postos: {alerta.postosDivulgados} • {formatDateBR(alerta.dataDivulgacao)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atalhos de Chão de Fábrica */}
          <div className="card-saas p-5 flex flex-col gap-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Barcode className="w-5 h-5 text-sky-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Atalhos Rápidos de Chão de Fábrica
              </h3>
            </div>

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => onNavigate('rastreabilidade')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                    <Barcode size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Rastreabilidade SAP</span>
                    <span className="text-[10px] text-slate-400">Consulta de lotes e etiquetas vivas</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              <button 
                onClick={() => onNavigate('registro-protcli')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/50 hover:bg-rose-50 border border-rose-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-rose-950">Proteção ao Cliente</span>
                    <span className="text-[10px] text-rose-700/80">Validação 9 dígitos SAP</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-rose-400 group-hover:text-rose-700 transition" />
              </button>

              <button 
                onClick={() => onNavigate('lista-8d')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Galeria de Ocorrências</span>
                    <span className="text-[10px] text-slate-400">Filtragem rápida e paginação</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-700 transition" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardView;
