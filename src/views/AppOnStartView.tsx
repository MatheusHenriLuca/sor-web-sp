import React, { useEffect, useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  ArrowRight,
  Settings,
  Server,
  Building2,
  Users,
  Layers,
  FileText,
  ShieldCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  Lock,
  Radio
} from 'lucide-react';
import { spStore } from '../services/sharepointService';
import { UsuarioQualidade } from '../types';

interface AppOnStartViewProps {
  onComplete: (startScreen: 'menu-2' | 'verif-user', user: UsuarioQualidade) => void;
  onOpenSharePointModal: () => void;
}

export const AppOnStartView: React.FC<AppOnStartViewProps> = ({
  onComplete,
  onOpenSharePointModal
}) => {
  const [progress, setProgress] = useState(12);
  const [currentStepText, setCurrentStepText] = useState('Iniciando conexão direta com o SharePoint Online...');
  const [loadResult, setLoadResult] = useState<{
    user: UsuarioQualidade;
    pessoasCount: number;
    pecasCount: number;
    treinamentosCount: number;
    startScreen: 'Menu_2' | 'Verif_user';
  } | null>(null);
  const [hasError, setHasError] = useState(false);

  const runStartup = async () => {
    setHasError(false);
    setProgress(15);
    setCurrentStepText('Estabelecendo credenciais e lendo listas SharePoint...');
    try {
      const res = await spStore.simulateAppOnStart(undefined, (msg, pct) => {
        setProgress(pct);
        setCurrentStepText(msg);
      });

      setProgress(100);
      setCurrentStepText("Sincronização com o SharePoint concluída com sucesso.");
      setLoadResult(res);

      // Auto-navigate para a tela inicial após breve confirmação visual
      const timer = setTimeout(() => {
        onComplete(res.startScreen === 'Menu_2' ? 'menu-2' : 'verif-user', res.user);
      }, 1200);

      return () => clearTimeout(timer);
    } catch (e) {
      console.error("Erro na inicialização", e);
      setHasError(true);
      setCurrentStepText("Não foi possível conectar ao SharePoint. Verifique a rede ou credenciais.");
    }
  };

  useEffect(() => {
    runStartup();
  }, []);

  const handleManualEnter = () => {
    if (loadResult) {
      onComplete(loadResult.startScreen === 'Menu_2' ? 'menu-2' : 'verif-user', loadResult.user);
    } else {
      const user = spStore.getCurrentUser();
      onComplete('menu-2', user);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f8fafc] font-sans text-[#0f172a]">
      
      {/* 1. CABEÇALHO CORPORATIVO PADRONIZADO */}
      <header className="!h-14 w-full !px-4 sm:!px-8 lg:!px-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white shadow-2xs z-10 shrink-0">
        <div className="flex items-center !gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0f6cbd] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            G
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold text-[#0f172a] leading-tight truncate">
              SOR • Gestão da Qualidade Automotiva
            </div>
            <div className="text-[11px] sm:text-xs text-[#64748b] truncate">
              Tratativa de Produto Não Conforme • Gestão de RNC
            </div>
          </div>
        </div>

        <div className="flex items-center !gap-4">
          <div className="hidden md:flex items-center !gap-2 text-xs text-[#64748b] !pr-4 border-r border-[#e2e8f0]">
            <Building2 size={14} className="text-[#0f6cbd]" />
            <span>Gestamp Sorocaba • Planta Sorocaba</span>
          </div>

          <button 
            type="button"
            onClick={onOpenSharePointModal}
            className="btn-secondary !h-8 !px-3 text-xs flex items-center !gap-1.5 cursor-pointer shrink-0"
            title="Configurações de sincronização SharePoint"
          >
            <Settings size={14} className="text-[#64748b]" />
            <span className="hidden sm:inline">Configurar Conexão</span>
            <span className="sm:hidden">Conexão</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA PRINCIPAL: HUB DE SINCRONIZAÇÃO PROFISSIONAL */}
      <main className="flex-1 w-full flex items-center justify-center !p-4 sm:!p-6 lg:!p-8 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white border border-[#e2e8f0] rounded-2xl shadow-xs overflow-hidden flex flex-col my-auto">
          
          {/* Barra Superior de Destaque Visual */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0f6cbd] via-[#2563eb] to-[#0f6cbd]" />

          <div className="!p-5 sm:!p-7 lg:!p-9 flex flex-col !gap-5 sm:!gap-6 lg:!gap-7">
            
            {/* Topo do Hub: Identidade, Título e Badge de Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between !gap-4 pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-start !gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#eff6fc] border border-[#c7e0f4] flex items-center justify-center text-[#0f6cbd] shadow-2xs shrink-0 mt-0.5">
                  {hasError ? (
                    <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 animate-in zoom-in" />
                  ) : progress === 100 ? (
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 animate-in zoom-in" />
                  ) : (
                    <Server className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse text-[#0f6cbd]" />
                  )}
                </div>

                <div className="flex flex-col !gap-1 min-w-0">
                  <div className="flex items-center !gap-2">
                    <span className="inline-flex items-center !gap-1 !px-2.5 !py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6fc] text-[#0f6cbd] border border-[#d0e7f9]">
                      <Radio size={11} className="animate-pulse text-[#0f6cbd]" />
                      Gestamp Sorocaba • Planta Sorocaba
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-bold text-[#0f172a] tracking-tight leading-snug">
                    {hasError ? "Falha na Conexão Operacional" : progress === 100 ? "Ambiente Conectado e Pronto" : "Carregando Dados Operacionais"}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed max-w-2xl">
                    Sincronizando dados em tempo real com as listas do SharePoint Online. Inicializando catálogo de peças, registros de RNC e base de colaboradores.
                  </p>
                </div>
              </div>

              {/* Badge de Estado no Topo à Direita */}
              <div className="shrink-0 self-start sm:self-center">
                {hasError ? (
                  <span className="inline-flex items-center !gap-1.5 !px-3 !py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]">
                    <AlertCircle size={13} className="text-[#991b1b]" />
                    Erro de Conexão
                  </span>
                ) : progress === 100 ? (
                  <span className="inline-flex items-center !gap-1.5 !px-3 !py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                    <CheckCircle2 size={13} className="text-[#059669]" />
                    100% Concluído
                  </span>
                ) : (
                  <span className="inline-flex items-center !gap-1.5 !px-3 !py-1 rounded-full text-xs font-semibold bg-[#eff6fc] text-[#0f6cbd] border border-[#c7e0f4]">
                    <Loader2 size={13} className="animate-spin text-[#0f6cbd]" />
                    Sincronizando
                  </span>
                )}
              </div>
            </div>

            {/* Seção da Barra de Progresso e Console de Etapas */}
            <div className="flex flex-col !gap-2.5 sm:!gap-3">
              <div className="flex items-center justify-between text-xs !px-0.5">
                <span className="font-semibold text-[#475569] flex items-center !gap-1.5">
                  <Database size={14} className="text-[#0f6cbd]" />
                  Status da sincronização das bases
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-[#0f6cbd] tabular-nums">
                  {progress}%
                </span>
              </div>

              {/* Barra de Progresso Fluida com visual moderno */}
              <div className="w-full !h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden !p-0.5 border border-[#e2e8f0]">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    hasError 
                      ? 'bg-rose-500' 
                      : progress === 100 
                      ? 'bg-emerald-600' 
                      : 'bg-[#0f6cbd]'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Console da Operação Atual em Andamento */}
              <div className="!py-2.5 sm:!py-3 !px-3.5 sm:!px-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#334155] flex items-center justify-between !gap-3">
                <div className="flex items-center !gap-2.5 min-w-0">
                  {hasError ? (
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                  ) : progress === 100 ? (
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 size={15} className="text-[#0f6cbd] animate-spin shrink-0" />
                  )}
                  <span className="font-medium truncate">
                    {currentStepText}
                  </span>
                </div>
                <div className="hidden sm:flex items-center !gap-1.5 text-[11px] text-[#64748b] font-mono shrink-0">
                  <Lock size={12} className="text-[#94a3b8]" />
                  <span>Microsoft 365</span>
                </div>
              </div>
            </div>

            {/* Grade com os 4 Cards Padronizados das Fontes de Dados (2x2 no mobile, 4 colunas no desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 !gap-2.5 sm:!gap-3.5">
              
              {/* 1. Colaboradores */}
              <div className="bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-xl !p-3.5 sm:!p-4 flex flex-col justify-between !gap-2.5 sm:!gap-3 transition-all shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#eff6fc] text-[#0f6cbd] flex items-center justify-center shrink-0">
                    <Users size={15} />
                  </div>
                  <span className={`inline-flex items-center !gap-1 !px-2 !py-0.5 rounded-full text-[10px] font-semibold ${
                    loadResult ? 'bg-[#ecfdf5] text-[#065f46]' : 'bg-[#fffbeb] text-[#92400e]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${loadResult ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {loadResult ? 'Ativo' : 'Carregando'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0f172a] truncate">Colaboradores</span>
                  <span className="text-[10px] sm:text-[11px] text-[#64748b] truncate">Lista BASE_ATIVOS</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-[#0f6cbd] pt-1 border-t border-[#f1f5f9] truncate">
                  {loadResult ? `${loadResult.pessoasCount} cadastrados` : 'Buscando ativos...'}
                </div>
              </div>

              {/* 2. Catálogo de Peças */}
              <div className="bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-xl !p-3.5 sm:!p-4 flex flex-col justify-between !gap-2.5 sm:!gap-3 transition-all shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#eff6fc] text-[#0f6cbd] flex items-center justify-center shrink-0">
                    <Layers size={15} />
                  </div>
                  <span className={`inline-flex items-center !gap-1 !px-2 !py-0.5 rounded-full text-[10px] font-semibold ${
                    loadResult ? 'bg-[#ecfdf5] text-[#065f46]' : 'bg-[#fffbeb] text-[#92400e]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${loadResult ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {loadResult ? 'Pronto' : 'Sincronizando'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0f172a] truncate">Catálogo de Peças</span>
                  <span className="text-[10px] sm:text-[11px] text-[#64748b] truncate">Peças gerais AA3</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-[#0f6cbd] pt-1 border-t border-[#f1f5f9] truncate">
                  {loadResult ? `${loadResult.pecasCount} itens ativos` : 'Indexando catálogo...'}
                </div>
              </div>

              {/* 3. Ocorrências 8D */}
              <div className="bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-xl !p-3.5 sm:!p-4 flex flex-col justify-between !gap-2.5 sm:!gap-3 transition-all shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#eff6fc] text-[#0f6cbd] flex items-center justify-center shrink-0">
                    <FileText size={15} />
                  </div>
                  <span className={`inline-flex items-center !gap-1 !px-2 !py-0.5 rounded-full text-[10px] font-semibold ${
                    progress >= 80 ? 'bg-[#ecfdf5] text-[#065f46]' : 'bg-[#fffbeb] text-[#92400e]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${progress >= 80 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {progress >= 80 ? 'Sincronizado' : 'Indexando'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0f172a] truncate">Registros de RNC</span>
                  <span className="text-[10px] sm:text-[11px] text-[#64748b] truncate">Incidentes Qualidade</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-[#0f6cbd] pt-1 border-t border-[#f1f5f9] truncate">
                  {progress >= 80 ? 'Base atualizada' : 'Lendo registros...'}
                </div>
              </div>

              {/* 4. SharePoint Online */}
              <div className="bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-xl !p-3.5 sm:!p-4 flex flex-col justify-between !gap-2.5 sm:!gap-3 transition-all shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#eff6fc] text-[#0f6cbd] flex items-center justify-center shrink-0">
                    <ShieldCheck size={15} />
                  </div>
                  <span className={`inline-flex items-center !gap-1 !px-2 !py-0.5 rounded-full text-[10px] font-semibold ${
                    progress === 100 
                      ? 'bg-[#ecfdf5] text-[#065f46]' 
                      : hasError 
                      ? 'bg-[#fef2f2] text-[#991b1b]' 
                      : 'bg-[#fffbeb] text-[#92400e]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      progress === 100 ? 'bg-emerald-500' : hasError ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                    }`} />
                    {progress === 100 ? 'Conectado' : hasError ? 'Falha' : 'Conectando'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0f172a] truncate">SharePoint 365</span>
                  <span className="text-[10px] sm:text-[11px] text-[#64748b] truncate">Tenant Gestamp</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-[#0f6cbd] pt-1 border-t border-[#f1f5f9] truncate">
                  {progress === 100 ? 'Sessão ativa' : hasError ? 'Indisponível' : 'Autenticando...'}
                </div>
              </div>

            </div>

            {/* Faixa Informativa Operacional (Ambiente de Produção) */}
            <div className="flex flex-wrap items-center justify-between !gap-2 !py-2 sm:!py-2.5 !px-3.5 sm:!px-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-[10px] sm:text-[11px] text-[#64748b]">
              <div className="flex items-center !gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium text-[#334155]">Planta Sorocaba</span>
                <span>•</span>
                <span>Gestão de RNC</span>
              </div>
              <div className="flex items-center !gap-3 sm:!gap-4">
                <span>Protocolo REST M365</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Cache Seguro</span>
              </div>
            </div>

            {/* Botão de Ação / Tentativa */}
            <div>
              {hasError ? (
                <button 
                  type="button"
                  onClick={runStartup}
                  className="btn-primary w-full !h-10 sm:!h-11 text-xs sm:text-sm font-semibold flex items-center justify-center !gap-2 cursor-pointer shadow-xs hover:shadow"
                >
                  <RefreshCw size={15} />
                  <span>Tentar Conectar Novamente</span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleManualEnter}
                  disabled={progress < 100}
                  className={`w-full !h-10 sm:!h-11 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center !gap-2 transition-all cursor-pointer ${
                    progress === 100 
                      ? 'btn-primary shadow-xs hover:shadow' 
                      : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed border border-[#e2e8f0]'
                  }`}
                >
                  {progress < 100 ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-[#94a3b8]" />
                      <span>Aguarde a sincronização das bases...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar Sistema Agora</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* 3. RODAPÉ CORPORATIVO */}
      <footer className="!h-11 w-full !px-4 sm:!px-8 lg:!px-10 border-t border-[#e2e8f0] bg-white flex items-center justify-between text-[11px] sm:text-xs text-[#64748b] z-10 shrink-0">
        <div className="truncate">
          Gestamp Sorocaba • Indústria de Autopeças • Planta Sorocaba
        </div>
        <div className="hidden md:block">
          Ambiente Corporativo Microsoft 365 • SharePoint Online
        </div>
        <div className="truncate shrink-0">
          SOR Versão Web 2026.10
        </div>
      </footer>

    </div>
  );
};

export default AppOnStartView;
