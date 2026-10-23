import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Barcode, 
  Layers, 
  Clock, 
  ChevronRight, 
  List, 
  Info, 
  MapPin, 
  Wrench, 
  Check, 
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
  History,
  Eye,
  Calendar,
  Sparkles,
  Hash,
  Car,
  Bot,
  MoreHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { RNCRecord, UsuarioQualidade, RegistroTreinamento } from '../types';
import { spStore } from '../services/sharepointService';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { RncDetalhesModal } from '../components/RncDetalhesModal';
import { formatDateBR } from '../utils/date';

interface Detalhes8DViewProps {
  rncId: number;
  onNavigate: (screen: any, params?: any) => void;
  currentUser: UsuarioQualidade;
}

export const Detalhes8DView: React.FC<Detalhes8DViewProps> = ({ 
  rncId, 
  onNavigate, 
  currentUser 
}) => {
  const [rnc, setRnc] = useState<RNCRecord | undefined>(undefined);
  const [treinamentos, setTreinamentos] = useState<RegistroTreinamento[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Modo de visualização: Detalhado (Lista Completa) vs Alerta da Qualidade
  const [activeViewMode, setActiveViewMode] = useState<'detalhes' | 'alerta'>('detalhes');
  // Seletor dos 3 Blocos Power Apps na visualização detalhada
  const [activeBlockTab, setActiveBlockTab] = useState<'todos' | 'cliente' | 'contencao' | 'disposicao'>('todos');

  // Modais
  const [modalAlertaOpen, setModalAlertaOpen] = useState(false);
  const [modalTreinOpen, setModalTreinOpen] = useState(false);
  const [modalConcluirOpen, setModalConcluirOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [modalAvaliacaoOpen, setModalAvaliacaoOpen] = useState(false);
  const [rncPopupVisualizar, setRncPopupVisualizar] = useState<RNCRecord | null>(null);

  // Pop-up menu de ações
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    if (actionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsMenuOpen]);

  // Estados dos formulários em modais
  const [alertaPostos, setAlertaPostos] = useState('');
  const [treinRe, setTreinRe] = useState<string>('');
  const [obsConclusao, setObsConclusao] = useState('');

  // Estados da Avaliação da Qualidade (Produção / Cliente)
  const [evalCriticidade, setEvalCriticidade] = useState<'A' | 'B' | 'C'>('A');
  const [evalAbrirRnc, setEvalAbrirRnc] = useState<string>('Sim - Realizar Análise / Contenção / Rastreabilidade');
  const [evalComentario, setEvalComentario] = useState<string>('');

  const reloadData = () => {
    const item = spStore.getRNCById(rncId);
    setRnc(item);
    setTreinamentos(spStore.getTreinamentos(rncId));
    if (item) {
      if (item.criticidade === 'A' || item.criticidade === 'B' || item.criticidade === 'C') {
        setEvalCriticidade(item.criticidade);
      }
      if (item.abrirRnc) {
        setEvalAbrirRnc(item.abrirRnc);
      }
      if (item.comentarioGestor) {
        setEvalComentario(item.comentarioGestor);
      }
    }
  };

  useEffect(() => {
    reloadData();
  }, [rncId]);

  // Histórico de reincidências para a mesma peça e modo de falha desta RNC (ordenado da mais recente para mais antiga)
  const historicoReincidencias = useMemo(() => {
    if (!rnc) return [];
    const defeito = rnc.modoFalha || rnc.descricaoProblema;
    if (!defeito || (!rnc.produto && !rnc.componente)) return [];
    return spStore.getHistoricoReincidencias(
      rnc.produto, 
      defeito, 
      rnc.id, 
      rnc.componente
    ).sort((a, b) => {
      const dateA = a.dataOcorrencia || '';
      const dateB = b.dataOcorrencia || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.id || 0) - (a.id || 0);
    });
  }, [rnc]);

  if (!rnc) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-[#e2e8f0] text-center flex flex-col gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0f172a]">Ocorrência não encontrada</h2>
        <p className="text-xs text-[#64748b]">O registro RNC #{rncId} não foi localizado na base de dados.</p>
        <button 
          className="btn-primary"
          onClick={() => onNavigate('lista-8d')}
        >
          Voltar para a Lista
        </button>
      </div>
    );
  }

  const role = currentUser.perfil;
  const isAdminOrQual = role === 'Admin' || role === 'Adminqual';
  const isLiderOrAbove = isAdminOrQual || role === 'Liderqual';
  const isOperator = role === 'User';

  const handleConfirmConcluir = () => {
    const res = spStore.concluirRNC(rnc.id, currentUser.nome, obsConclusao);
    if (!res.success) {
      setNotification({ type: 'error', message: res.message });
      setModalConcluirOpen(false);
      return;
    }

    setNotification({ type: 'success', message: res.message });
    setModalConcluirOpen(false);
    reloadData();
  };

  const handleSaveTreinamento = (e: React.FormEvent) => {
    e.preventDefault();
    const reNum = Number(treinRe);
    if (!reNum || isNaN(reNum)) {
      setNotification({ type: 'error', message: 'Informe uma matrícula (RE) numérica válida!' });
      return;
    }

    const res = spStore.addTreinamento(rnc.id, reNum, currentUser.nome);
    if (!res.success) {
      setNotification({ type: 'error', message: res.message });
      return;
    }

    setNotification({ type: 'success', message: res.message });
    setModalTreinOpen(false);
    setTreinRe('');
    reloadData();
  };

  const handleSaveAlerta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertaPostos.trim()) {
      setNotification({ type: 'error', message: 'Informe os postos de divulgação!' });
      return;
    }

    spStore.addAlerta({
      idRnc: rnc.id,
      produto: rnc.produto,
      componente: rnc.componente,
      defeito: rnc.descricaoProblema || 'Alerta de Qualidade',
      dataDivulgacao: new Date().toISOString().split('T')[0],
      responsavel: currentUser.nome,
      postosDivulgados: alertaPostos.trim()
    });
    setNotification({ type: 'success', message: 'Alerta de qualidade registrado com sucesso!' });
    setModalAlertaOpen(false);
    setAlertaPostos('');
    reloadData();
  };

  const handleConfirmDelete = () => {
    spStore.deleteRNCCascade(rnc.id);
    setNotification({ type: 'success', message: 'Ocorrência excluída com sucesso.' });
    setModalDeleteOpen(false);
    setTimeout(() => {
      onNavigate('lista-8d');
    }, 1000);
  };

  const handleAprovarAvaliacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalComentario.trim()) {
      setNotification({ type: 'warning', message: 'Favor preencher o feedback / parecer técnico do aprovador da Qualidade.' });
      return;
    }
    const isAbrirRncSim = evalAbrirRnc.startsWith('Sim');
    const newStatus = isAbrirRncSim ? 'Relatório Inicial' : 'Concluído';
    const updated = spStore.saveRNC({
      id: rnc.id,
      protcliente: 'Aprovado',
      status: newStatus,
      criticidade: evalCriticidade,
      abrirRnc: evalAbrirRnc,
      comentarioGestor: evalComentario.trim()
    });
    setRnc(updated);
    setModalAvaliacaoOpen(false);
    setNotification({
      type: 'success',
      message: isAbrirRncSim 
        ? 'Avaliação aprovada! Ocorrência liberada para preenchimento de contenção e rastreabilidade pela equipe de Qualidade.' 
        : 'Avaliação aprovada! Registro concluído diretamente com sucesso.'
    });
    reloadData();
  };

  const handleReprovarAvaliacao = () => {
    if (!evalComentario.trim()) {
      setNotification({ type: 'warning', message: 'Favor preencher o motivo da reprovação no parecer do aprovador.' });
      return;
    }
    const updated = spStore.saveRNC({
      id: rnc.id,
      protcliente: 'Reprovado',
      status: 'Reprovado',
      criticidade: evalCriticidade,
      abrirRnc: 'Não - Não realizar Análise / Contenção / Rastreabilidade',
      comentarioGestor: evalComentario.trim()
    });
    setRnc(updated);
    setModalAvaliacaoOpen(false);
    setNotification({ type: 'warning', message: 'Ocorrência do Programa Proteção ao Cliente reprovada.' });
    reloadData();
  };

  const isProtecaoAtiva = rnc.protcliente && rnc.protcliente !== 'Não';
  const isFormal = rnc.tipoRnc === 'Formal';
  // Código oficial/cliente para reclamação formal. Oculta se for informal ou se for mera repetição do ID
  const codigoClienteOuFormal = isFormal
    ? (rnc.codOcorrenciaCliente?.trim() || (
        rnc.field1 &&
        !['RNC #' + rnc.id, 'RNC-' + rnc.id, 'RNC ' + rnc.id, '#' + rnc.id, String(rnc.id)].includes(rnc.field1.trim())
          ? rnc.field1.trim()
          : null
      ))
    : null;

  // Código da peça mostrando estritamente os 9 primeiros caracteres (sem descrições)
  const codigoPeca9 = (rnc.componente || rnc.produto || '').trim().substring(0, 9);

  // Apuração da Data de Incidência mais recente (quando houver mais de uma ocorrência anterior, pega sempre a mais recente)
  const isReincidenteCalculado = historicoReincidencias.length > 0 || rnc.reincidente === 'SIM';
  const dataIncidenciaMaisRecente = historicoReincidencias.length > 0 
    ? historicoReincidencias[0].dataOcorrencia 
    : (rnc.dataReincidente || null);

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-150 pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 p-1 text-slate-400 hover:text-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. CABEÇALHO UNIFICADO & EXECUTIVO DA OCORRÊNCIA */}
      <div className="card-saas p-4 sm:p-5 flex flex-col gap-4 shadow-xs bg-white border-slate-200 rounded-2xl">
        
        {/* Linha 1: Navegação + Identificador + Badges de Status + Ações de Gestão */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button 
              type="button"
              onClick={() => onNavigate('lista-8d')}
              className="btn-secondary h-9 px-3.5 text-xs font-semibold shrink-0 gap-1.5 shadow-2xs hover:bg-slate-50 inline-flex items-center justify-center"
              title="Voltar para a Lista de Ocorrências"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Voltar</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Identificador Único: RNC #{id} */}
            <span className="h-9 inline-flex items-center px-3 rounded-lg text-xs sm:text-sm font-black bg-blue-50 text-[#0b5796] border border-blue-200 font-mono shrink-0 shadow-2xs">
              RNC #{rnc.id}
            </span>

            {/* Segundo Identificador: Código do Cliente / Formal (oculto quando não for formal para não duplicar o ID) */}
            {codigoClienteOuFormal && (
              <span 
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold text-slate-800 font-mono bg-slate-100 border border-slate-200 shrink-0"
                title={`Código Formal / Cliente: ${codigoClienteOuFormal}`}
              >
                <span className="text-slate-500 font-normal">Cód. Cliente:</span>
                <span className="text-slate-900 font-bold">{codigoClienteOuFormal}</span>
              </span>
            )}

            {/* Status com Alto Contraste (WCAG AA/AAA) */}
            <span className={`h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold border shrink-0 ${
              rnc.status === 'Concluído' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                : rnc.status === 'Em Andamento' 
                ? 'bg-amber-50 text-amber-950 border-amber-300' 
                : 'bg-sky-50 text-sky-950 border-sky-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                rnc.status === 'Concluído' 
                  ? 'bg-emerald-600' 
                  : rnc.status === 'Em Andamento' 
                  ? 'bg-amber-500 ring-2 ring-amber-200' 
                  : 'bg-sky-600'
              }`} />
              {rnc.status}
            </span>

            {/* Tipo */}
            <span className="h-9 inline-flex items-center px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
              {rnc.tipoRnc || 'Formal'}
            </span>

            {/* Governança 8D (sem título, exibido logo após o tipo de ocorrência) */}
            <span className={`h-9 inline-flex items-center px-3 rounded-lg text-xs font-bold border shrink-0 ${
              rnc.abrir8D === 'Sim'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              8D - {rnc.abrir8D === 'Sim' ? 'Sim' : 'Não'}
            </span>
          </div>

          {/* Ações Rápidas Alinhadas no Topo */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isLiderOrAbove && rnc.status !== 'Concluído' && (
              <button 
                type="button"
                onClick={() => setModalConcluirOpen(true)}
                className="btn-primary h-9 px-3.5 text-xs font-bold gap-1.5 shadow-sm inline-flex items-center justify-center"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Concluir RNC</span>
              </button>
            )}

            {!isOperator && (
              <button 
                type="button"
                onClick={() => onNavigate('registro-8d', { edicao: true, rncId: rnc.id, fromScreen: 'detalhes-8d' })}
                className="btn-secondary h-9 px-3 text-xs font-semibold gap-1.5 text-slate-700 hover:text-slate-900 inline-flex items-center justify-center"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Editar</span>
              </button>
            )}

            {/* Menu de ações secundárias (⋯) */}
            <div className="relative" ref={actionsMenuRef}>
              <button 
                type="button"
                onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                className={`btn-secondary h-9 px-3 text-xs font-semibold gap-1.5 inline-flex items-center justify-center ${
                  actionsMenuOpen ? 'bg-slate-100 border-slate-300 text-slate-900' : 'text-slate-700 hover:text-slate-900'
                }`}
                title="Mais ações"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Ações</span>
              </button>

              {/* Pop-up de ações */}
              {actionsMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={() => { onNavigate('impressao-8d', { rncId: rnc.id }); setActionsMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-left"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Imprimir Ficha A4</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onNavigate('rastreabilidade', { rncId: rnc.id }); setActionsMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition text-left"
                  >
                    <Barcode className="w-4 h-4 text-indigo-500" />
                    <span>Rastrear SAP</span>
                  </button>
                  {!isOperator && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={() => { setModalAlertaOpen(true); setActionsMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition text-left"
                      >
                        <Bell className="w-4 h-4 text-amber-600" />
                        <span>Registrar Alerta de Qualidade</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModalTreinOpen(true); setActionsMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-sky-700 hover:bg-sky-50 transition text-left"
                      >
                        <Users className="w-4 h-4 text-sky-600" />
                        <span>Registrar Treinamento</span>
                      </button>
                    </>
                  )}
                  {isProtecaoAtiva && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={() => { setModalAvaliacaoOpen(true); setActionsMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Avaliação da Qualidade</span>
                      </button>
                    </>
                  )}
                  {isAdminOrQual && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={() => { setModalDeleteOpen(true); setActionsMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition text-left"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Excluir Ocorrência</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha 2: Segmented Control de Modos de Visualização e Ramificação de Blocos */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Modo de Exibição:</span>
            </div>

            {/* Segmented Control Moderno */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveViewMode('detalhes')}
                className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer select-none ${
                  activeViewMode === 'detalhes'
                    ? 'bg-white text-[#0b5796] shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Relatório Detalhado</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('alerta')}
                className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer select-none ${
                  activeViewMode === 'alerta'
                    ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Alerta Qualidade / Disposição</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('rastreabilidade', { rncId: rnc.id })}
                className="h-8 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer select-none text-slate-600 hover:text-indigo-700 hover:bg-slate-200/60"
                title="Abrir tela de Rastreabilidade desta ocorrência"
              >
                <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rastrear SAP</span>
              </button>
            </div>
          </div>

          {/* Ramificação exclusiva do Relatório Detalhado: Exibir Blocos */}
          {activeViewMode === 'detalhes' && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/70 animate-in fade-in">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1">Exibir Bloco:</span>
                
                <button
                  type="button"
                  onClick={() => setActiveBlockTab('todos')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
                    activeBlockTab === 'todos'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Todos os 3 Blocos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBlockTab('cliente')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
                    activeBlockTab === 'cliente'
                      ? 'bg-[#0f6cbd] text-white shadow-2xs'
                      : 'bg-blue-50 text-[#0f6cbd] hover:bg-blue-100 border border-blue-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. Cliente & Ocorrência</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBlockTab('contencao')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
                    activeBlockTab === 'contencao'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2. Contenção & Triagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBlockTab('disposicao')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
                    activeBlockTab === 'disposicao'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3. Disposição & Evidências</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notificação Programa Produção / Cliente (Quando Ativo) */}
        {isProtecaoAtiva && (
          <div className="rounded-xl p-3 bg-emerald-50/90 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="text-xs text-emerald-900 leading-snug">
                <strong>Programa Proteção ao Cliente:</strong> Etiqueta SAP <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-950">{rnc.codigoRastreabilidade || 'Não informada'}</code>. Detecção no chão de fábrica.
              </div>
            </div>
            {isLiderOrAbove && (
              <button
                type="button"
                onClick={() => setModalAvaliacaoOpen(true)}
                className="btn-primary h-7 px-3 text-xs font-bold shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {rnc.protcliente === 'Sim' ? 'Avaliar Ocorrência' : 'Revisar Avaliação'}
              </button>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODO 1: DETALHADO (LISTA COMPLETA - REFERÊNCIA IMAGEM 3) */}
      {/* ========================================================================= */}
      {activeViewMode === 'detalhes' && (
        <div className="flex flex-col gap-6 animate-in fade-in">

          {/* ========================================================================= */}
          {/* VISUALIZAÇÃO EM COLUNA ÚNICA DOS 3 BLOCOS (CONFORME SOLICITADO)           */}
          {/* ========================================================================= */}

          {/* ========================================================================= */}
          {/* BLOCO 1: INFORMAÇÕES DO CLIENTE & RELATO DA OCORRÊNCIA (FOTO 3)          */}
          {/* ========================================================================= */}
          {(activeBlockTab === 'todos' || activeBlockTab === 'cliente') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
              {/* Header do Bloco 1 */}
              <div className="bg-[#0f2942] text-white px-4 sm:px-5 py-3.5 flex items-center gap-2.5 border-b border-[#1b3d5e]">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500 text-white tracking-wider shadow-2xs">
                  BLOCO 1
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                  <Car className="w-4 h-4 text-sky-300" />
                </div>
                <h2 className="font-bold text-sm sm:text-base tracking-wide text-white !text-white" style={{ color: '#ffffff' }}>
                  Informações do Cliente & Relato da Ocorrência
                </h2>
              </div>

              {/* Corpo do Bloco 1 */}
              <div className="p-4 sm:p-6 flex flex-col gap-5 text-xs text-slate-700">
                {/* Linha 1 do Bloco 1: Montadora, Setor Responsável, Data de Abertura & Turno, Data Final de Contenção */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Montadora</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900" title={rnc.cliente || 'Não informada'}>
                      {rnc.cliente || 'Não informada'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Setor Responsável</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {rnc.classificacaoSetor || 'Qualidade'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Data de Abertura & Turno</span>
                    </span>
                    <strong className="text-slate-900 font-mono text-xs sm:text-sm font-bold">
                      {formatDateBR(rnc.dataOcorrencia)} - {rnc.turno || '1º Turno'}
                    </strong>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Data Final de Contenção</span>
                    </span>
                    <strong className="text-slate-900 font-mono text-xs sm:text-sm font-bold">
                      {formatDateBR(rnc.dataContencao || rnc.dataOcorrencia)}
                    </strong>
                  </div>
                </div>

                {/* Grid Intermediário: Especificações de Engenharia e Origem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Posto / Linha / Área (Célula Fabril) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Posto / Linha / Área:</span>
                    <strong className="text-slate-900 font-mono text-xs block truncate" title={`${rnc.posto || ''} ${rnc.fmds || ''} ${rnc.classificacaoSetor || ''}`}>
                      {rnc.posto || 'B643033 - ROBÔ 33 - SOLDA 3'} {rnc.fmds ? `- ${rnc.fmds}` : ''} {rnc.classificacaoSetor ? `• ${rnc.classificacaoSetor}` : ''}
                    </strong>
                  </div>

                  {/* 2. Código da Peça (com divisão identificada) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-semibold text-slate-500">Código da Peça:</span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#0b5796] bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0f6cbd]" />
                        {rnc.finalComponente || 'Peça Final'}
                      </span>
                    </div>
                    <strong className="text-slate-900 font-mono text-xs font-bold block" title={rnc.componente || rnc.produto}>
                      {codigoPeca9 || '-'}
                    </strong>
                  </div>

                  {/* 3. Código do Componente */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Código do Componente:</span>
                    <strong className="text-slate-900 font-mono text-xs font-bold block truncate" title={rnc.componente || 'Não possui componente associado'}>
                      {rnc.componente ? rnc.componente.trim() : '-'}
                    </strong>
                  </div>

                  {/* 4. Quantidade com Defeito */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Quantidade com Defeito:</span>
                    <div className="text-xs font-bold text-rose-700 font-mono">
                      {rnc.quantidadeAfetada || 1} peça(s) ({rnc.modoFalha || rnc.descricaoProblema || 'Não especificado'})
                    </div>
                  </div>

                  {/* 5. Local de detecção do cliente (Power Apps Imagem 4) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Local de detecção do cliente:</span>
                    <strong className="text-slate-900 font-semibold text-xs block">
                      {rnc.setorDeteccao || '-'}
                    </strong>
                  </div>

                  {/* 6. Impacto no cliente (Power Apps Imagem 4) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Impacto no cliente:</span>
                    <strong className="text-slate-900 font-semibold text-xs block break-words" title={rnc.impactoCliente || '-'}>
                      {rnc.impactoCliente || '-'}
                    </strong>
                  </div>
                </div>

                {/* Participantes do Atendimento - Fundo Branco Unificado */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Participantes do Atendimento:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(rnc.participantesAtendimento || rnc.detector || 'LEANDRO SERAFIM DE LIMA;PAULO HENRIQUE VICENTE;LUIS HENRIQUE CAMARGO FELICIO').split(';').map((p, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Detalhamento da ocorrência (cliente) - Fundo Branco Unificado */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>* Detalhamento da ocorrência (cliente):</span>
                  </span>
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-slate-900 font-semibold leading-relaxed whitespace-pre-wrap">
                    {rnc.detalhamentoOcorrencia || rnc.descricaoCompleta || rnc.descricaoProblema || 'Ponto de SOLDA  Pegou  fora Dedevido a PEÇA AMASSADA'}
                  </div>
                </div>

                {/* Fotos Comparativas da Base do Bloco 1 (Foto 3) */}
                <div className="pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Foto OK */}
                    <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-300 bg-white shadow-2xs">
                      <div className="bg-emerald-600 text-white font-bold text-xs py-2 px-3.5 flex items-center justify-between">
                        <span>Foto da peça OK (Padrão Conforme):</span>
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="h-52 sm:h-64 bg-slate-50 p-2 flex items-center justify-center overflow-hidden">
                        <ImageWithFallback
                          src={rnc.fotoPecaOk}
                          alt={`Peça OK: ${rnc.componente}`}
                          variant="ok"
                          className="w-full h-full object-contain"
                          emptyLabel="Sem foto do padrão OK cadastrada"
                          showExternalLink={true}
                          allowZoom={true}
                          itemId={rnc.id}
                        />
                      </div>
                    </div>

                    {/* Foto NG */}
                    <div className="flex flex-col rounded-xl overflow-hidden border border-rose-300 bg-white shadow-2xs">
                      <div className="bg-rose-600 text-white font-bold text-xs py-2 px-3.5 flex items-center justify-between">
                        <span>Foto da peça NG (Evidência Não Conforme):</span>
                        <X className="w-4 h-4" />
                      </div>
                      <div className="h-52 sm:h-64 bg-slate-50 p-2 flex items-center justify-center overflow-hidden">
                        <ImageWithFallback
                          src={rnc.fotoPecaNg}
                          alt={`Peça NG: ${rnc.descricaoProblema || rnc.componente}`}
                          variant="ng"
                          className="w-full h-full object-contain"
                          emptyLabel="Sem foto do defeito NG cadastrada"
                          showExternalLink={true}
                          allowZoom={true}
                          itemId={rnc.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BLOCO 2: CONTENÇÃO IMEDIATA & DIRETRIZES OPERACIONAIS (5W2H)               */}
          {/* ========================================================================= */}
          {(activeBlockTab === 'todos' || activeBlockTab === 'contencao') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
              {/* Header do Bloco 2 */}
              <div className="bg-[#0f2942] text-white px-4 sm:px-5 py-3.5 flex items-center gap-2.5 border-b border-[#1b3d5e]">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500 text-white tracking-wider shadow-2xs">
                  BLOCO 2
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <h2 className="font-bold text-sm sm:text-base tracking-wide text-white !text-white" style={{ color: '#ffffff' }}>
                  Contenção Imediata & Diretrizes Operacionais (5W2H)
                </h2>
              </div>

              {/* Corpo do Bloco 2 */}
              <div className="p-4 sm:p-6 flex flex-col gap-5 text-xs text-slate-700">
                {/* Grid 1: Governança de Rastreabilidade & Parâmetros Críticos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500">Co-Produto?</span>
                    <strong className="text-slate-800">{rnc.coProduto || '-'}</strong>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500">Carry Over?</span>
                    <strong className="text-slate-800">{rnc.carryOver || 'Não -'}</strong>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500">Reincidente?</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                      isReincidenteCalculado
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-800'
                    }`}>
                      {isReincidenteCalculado 
                        ? `SIM - Data: ${formatDateBR(dataIncidenciaMaisRecente || rnc.dataOcorrencia)}` 
                        : (rnc.reincidente || 'Não')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500">Peça de Segurança?</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                      rnc.caracteristicaSeguranca === 'Sim'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'text-slate-800'
                    }`}>
                      {rnc.caracteristicaSeguranca === 'Sim' ? 'Sim (Crítico)' : 'Não'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500">Rastreabilidade DOC.:</span>
                    <strong className="text-slate-900">{rnc.documentoRastreabilidade || 'Etiqueta SAP'}</strong>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500">CÓD. Rastreabilidade:</span>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 font-bold">
                        {rnc.codigoRastreabilidade || '668360689'}
                      </strong>
                      {rnc.codigoRastreabilidade && (
                        <button
                          type="button"
                          onClick={() => onNavigate('rastreabilidade', { rncId: rnc.id })}
                          className="text-[11px] text-[#0f6cbd] font-bold hover:underline cursor-pointer"
                        >
                          Ver lotes SAP
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contadores de Triagem no Processo */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-slate-700 block">Contadores de Triagem no Processo:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
                      <span className="text-xs font-bold text-amber-900 block truncate">Qtd Peças Suspeitas</span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-amber-900 mt-1.5 block">
                        {rnc.qtdSuspeita || 1}
                      </span>
                      <span className="text-[11px] text-amber-700/80 block mt-1">Em quarentena para inspeção</span>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block truncate">Qtd Peças Inspecionadas</span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1.5 block">
                        {rnc.qtdInspecionada || 1}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-1">Total verificado na linha</span>
                    </div>

                    <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200">
                      <span className="text-xs font-bold text-rose-900 block truncate">Qtd Peças Bloqueadas</span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-rose-900 mt-1.5 block">
                        {rnc.qtdBloqueada || 0}
                      </span>
                      <span className="text-[11px] text-rose-700/80 block mt-1">Retidas para retrabalho / refugo</span>
                    </div>
                  </div>
                </div>

                {/* Banner de Ações de Contenção Adotadas */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col gap-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Ações de contenção adotadas:</span>
                  </span>
                  <div className="text-slate-800 font-semibold leading-relaxed">
                    {rnc.acoesContencao || 'INSPEÇÃO 100% NO POSTO DE TRABALHO; RETRABALHAR'}
                  </div>
                </div>

                {/* Diretrizes Operacionais (5W2H) */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Diretrizes 5W2H de Ação Operacional:</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">O que fazer?</span>
                      <p className="text-slate-900 font-semibold leading-relaxed">
                        {rnc.oQueFazer || 'Seleção Visual PEÇAS com deformação Segregar para RETRABALHO E AVISAR QUALIDADE'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">Como fazer?</span>
                      <p className="text-slate-900 font-semibold leading-relaxed">
                        {rnc.comoFazer || 'Peças DEFORMADAS RETRABALHAR COM CALIBRADOR E DESEMPENAR A REGIÃO, após RETRABALHO NECESSÁRIO PASSAR EM DCO. A QUALIDADE VALIDAR DIMENSIONAL'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">Porque fazer?</span>
                      <p className="text-slate-900 font-semibold leading-relaxed">
                        {rnc.porQueFazer || 'Encontrado na montagem PEÇA AMASSADA'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">Quando fazer?</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        {rnc.quandoFara || formatDateBR(rnc.dataOcorrencia)}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">Onde fazer?</span>
                      <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        {rnc.ondeFara || 'Quarentena/RETRABALHO'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between">
                      <span className="font-bold text-indigo-950">Equipe resp.:</span>
                      <strong className="text-indigo-900 font-bold uppercase tracking-wide">
                        {rnc.quemFara || rnc.detector || 'LEANDRO APARECIDO POSSOMATO'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BLOCO 3: DISPOSIÇÃO INTERNA, EVIDÊNCIAS FOTOGRÁFICAS & EQUIPE (FOTOS 4 E 5)*/}
          {/* ========================================================================= */}
          {(activeBlockTab === 'todos' || activeBlockTab === 'disposicao') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
              {/* Header do Bloco 3 */}
              <div className="bg-[#0f2942] text-white px-4 sm:px-5 py-3.5 flex items-center gap-2.5 border-b border-[#1b3d5e]">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500 text-white tracking-wider shadow-2xs">
                  BLOCO 3
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/30">
                  <Layers className="w-4 h-4 text-indigo-300" />
                </div>
                <h2 className="font-bold text-sm sm:text-base tracking-wide text-white !text-white" style={{ color: '#ffffff' }}>
                  Disposição Interna, Evidências Fotográficas & Equipe
                </h2>
              </div>

              {/* Corpo do Bloco 3 */}
              <div className="p-4 sm:p-6 flex flex-col gap-6 text-xs text-slate-700">
                {/* Parâmetros de Disposição Interna Fabril */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Possível detectar?</span>
                    <strong className="text-slate-900">{rnc.possivelDetectar || 'SIM - Visual'}</strong>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Tipo de Detecção:</span>
                    <strong className="text-slate-900">{rnc.tipoDeteccao || 'Inspeção Visual'}</strong>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Gravidade / Severidade:</span>
                    <strong className="text-slate-900">{rnc.gravidade || 'Dimensional'}</strong>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Desc. problema interno:</span>
                    <strong className="text-slate-900 uppercase block truncate">
                      {rnc.descricaoProblemaInterno || rnc.modoFalha || 'PEÇA AMASSADA / DEFORMADO'}
                    </strong>
                  </div>

                  <div className="col-span-full p-3.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Recomendações / Providências:</span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {rnc.recomendacoesProvidencias || 'Orientar TODOS ENVOLVIDOS'}
                    </p>
                  </div>
                </div>

                {/* Linha lado a lado: Foto Auxiliar (mesmo tamanho OK/NG) e Operadores Treinados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Coluna 1: Foto Auxiliar & Demarcações de Inspeção (mesmo tamanho das fotos OK e NG: h-52 sm:h-64) */}
                  <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs h-full">
                    <div className="bg-[#0f2942] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#1b3d5e]">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-xs sm:text-sm">Foto Auxiliar & Demarcações de Inspeção</span>
                      </div>
                      <span className="text-xs text-sky-200 font-semibold truncate max-w-[180px]">
                        Resp.: <strong className="text-white">{rnc.quemFara || rnc.detector || 'LEANDRO APARECIDO POSSOMATO'}</strong>
                      </span>
                    </div>

                    <div className="h-52 sm:h-64 bg-slate-50 p-2 flex items-center justify-center overflow-hidden flex-1">
                      <ImageWithFallback
                        src={rnc.fotoAuxiliar || rnc.fotoPecaNg}
                        alt="Foto auxiliar com demarcação do defeito"
                        variant="ng"
                        className="w-full h-full object-contain rounded-lg"
                        emptyLabel="Sem foto auxiliar cadastrada para esta ocorrência"
                        showExternalLink={true}
                        allowZoom={true}
                        itemId={rnc.id}
                      />
                    </div>
                  </div>

                  {/* Coluna 2: Operadores Treinados nesta Ocorrência */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs flex flex-col h-full">
                    <div className="p-3 sm:p-4 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">
                            Operadores Treinados nesta Ocorrência ({treinamentos.length})
                          </h3>
                          <p className="text-[11px] text-[#64748b]">Capacitação e alinhamento da equipe quanto ao padrão</p>
                        </div>
                      </div>
                      {!isOperator && (
                        <button
                          type="button"
                          onClick={() => setModalTreinOpen(true)}
                          className="btn-secondary h-7 px-2.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                        >
                          <span>+ Novo Treinamento</span>
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                      {treinamentos.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#64748b] my-auto">
                          Nenhum operador registrado até o momento. Clique em "+ Novo Treinamento" para registrar a capacitação da equipe.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-56 sm:max-h-64 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#f8fafc] z-10">
                              <tr className="border-b border-[#e2e8f0] text-[#64748b] font-semibold">
                                <th className="py-2.5 px-3">Operador</th>
                                <th className="py-2.5 px-3">RE</th>
                                <th className="py-2.5 px-3">Data</th>
                                <th className="py-2.5 px-3">Instrutor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f1f5f9]">
                              {treinamentos.map(t => (
                                <tr key={t.id} className="hover:bg-[#f8fafc] transition-colors">
                                  <td className="py-2 px-3 font-bold text-[#0f172a]">{t.nomeColaborador || (t as any).nomeOperador}</td>
                                  <td className="py-2 px-3 font-mono text-[#64748b]">{t.re}</td>
                                  <td className="py-2 px-3 font-mono text-[#64748b]">{formatDateBR(t.dataTreinamento)}</td>
                                  <td className="py-2 px-3 text-[#334155]">{t.responsavel || (t as any).instrutor}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Histórico de Reincidências Registradas */}
                <div className="p-4 sm:p-5 bg-amber-50/40 rounded-xl border border-amber-200/80 flex flex-col gap-3.5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <History className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] flex items-center gap-2">
                          <span>Histórico de Reincidências Registradas</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {historicoReincidencias.length} registro(s)
                          </span>
                        </h3>
                        <p className="text-[11px] text-[#64748b]">
                          Ocorrências da mesma peça com o defeito <strong>"{rnc.modoFalha || rnc.descricaoProblema}"</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {historicoReincidencias.length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-amber-200/60 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Nenhuma outra ocorrência anterior encontrada no histórico para esta peça com este defeito. (Primeira Ocorrência / Não Reincidente).</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                      {historicoReincidencias.map((item, idx) => (
                        <div 
                          key={item.id || idx}
                          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {item.field1 || `RNC #${item.id}`}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{formatDateBR(item.dataOcorrencia)}</span>
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {item.modoFalha || item.descricaoProblema || 'Defeito registrado'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.cliente} • {item.produto || item.componente} {item.posto ? `• Posto: ${item.posto}` : ''} • Qtd: {item.quantidadeAfetada || 1}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.status === 'Concluído' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : item.status === 'Em Andamento' 
                                ? 'bg-amber-50 text-amber-900 border-amber-200' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {item.status || 'Em Andamento'}
                            </span>

                            <button
                              type="button"
                              onClick={() => setRncPopupVisualizar(item)}
                              className="btn-secondary h-7 px-2.5 text-xs font-bold text-[#0b5796] hover:bg-blue-50 border-blue-200 flex items-center gap-1 cursor-pointer"
                              title="Visualizar detalhes em pop-up rápido"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#0b5796]" />
                              <span>Ver RNC</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODO 2: ALERTA DA QUALIDADE & DISPOSIÇÃO (REFERÊNCIA TELAS POWER APPS)   */}
      {/* ========================================================================= */}
      {activeViewMode === 'alerta' && (
        <div className="flex flex-col gap-5 animate-in fade-in">
          
          {/* Faixa Compacta de Status da Contenção e Ações do Alerta */}
          <div className="bg-gradient-to-r from-rose-50 via-amber-50/40 to-white border border-rose-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-700 text-white font-mono-numbers shrink-0 shadow-2xs">
                RNC #{rnc.id}
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-rose-800 uppercase tracking-wide">
                  Instrução de Contenção Ativa
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="font-semibold text-slate-800">
                  {rnc.modoFalha || rnc.descricaoProblema || 'Não conformidade'}
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-500">
                  Posto: <strong className="text-slate-700">{rnc.posto || 'Geral'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {!isOperator && (
                <button
                  type="button"
                  onClick={() => setModalAlertaOpen(true)}
                  className="btn-primary bg-rose-700 hover:bg-rose-800 border-rose-700 text-xs h-7 px-2.5 gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Registrar Divulgação</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('impressao-8d', { rncId: rnc.id })}
                className="btn-secondary text-xs h-7 px-2.5 gap-1.5"
                title="Imprimir Alerta de Qualidade"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir Alerta</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              PAINEL UNIFICADO DO ALERTA DE QUALIDADE (CONTAINER ÚNICO)
              1. Topo: Informações do Produto (Linha, Posto, Defeito, Quantidade e Peça)
              2. Centro: 3 Fotos Alinhadas na Mesma Linha (Foto OK, Foto NG, Foto Auxiliar)
              3. Base: Toda a Contenção, Disposição Interna e Plano 5W2H (O que fazer)
              ========================================================================= */}
          <div className="card-saas p-4 sm:p-5 border-slate-200 flex flex-col gap-5 shadow-xs bg-white">

            {/* 1. TOPO: INFORMAÇÕES DO PRODUTO & OCORRÊNCIA */}
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
              
              {/* Cabeçalho do Bloco com Produto e Badge de Volume */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold shrink-0">
                    <Info className="w-4 h-4 text-[#0b5796]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Informações do Produto & Identificação
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-mono-numbers mt-0.5">
                      {rnc.produto || rnc.componente || 'Produto Não Especificado'}
                    </h3>
                  </div>
                </div>

                {/* Quantidade em Destaque */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-right flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Quantidade Afetada:</span>
                    <span className="text-sm font-extrabold text-amber-950 font-mono-numbers">
                      {rnc.quantidadeAfetada || 1} Peça(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID 4 COLUNAS: LINHA, POSTO, DEFEITO E QUANTIDADE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">

                {/* 1. LINHA / ÁREA FABRIL */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Linha / Área:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={rnc.fmds || rnc.classificacaoSetor || 'Não especificada'}>
                    {rnc.fmds || rnc.classificacaoSetor || 'Área Fabril'}
                  </span>
                </div>

                {/* 2. POSTO DE TRABALHO */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0b5796]" />
                    Posto:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={rnc.posto || 'Geral'}>
                    {rnc.posto || 'Não especificado'}
                  </span>
                </div>

                {/* 3. DEFEITO IDENTIFICADO */}
                <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-rose-700 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Defeito Identificado:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-950 truncate" title={rnc.modoFalha || rnc.descricaoProblema || 'Não especificado'}>
                    {rnc.modoFalha || rnc.descricaoProblema || 'Não especificado'}
                  </span>
                </div>

                {/* 4. QUANTIDADE DE PEÇAS */}
                <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-amber-700" />
                    Quantidade de Peças:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-950 font-mono-numbers">
                    {rnc.quantidadeAfetada || 1} Peça(s)
                  </span>
                </div>

              </div>

            </div>

            {/* 2. CENTRO: AS TRÊS FOTOS NA MESMA LINHA */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#0b5796]" />
                  Padrões Visuais & Registros Fotográficos
                </span>
                <span className="text-[10px] text-slate-400">
                  Clique nas fotos para ampliar
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                {/* FOTO 1: PEÇA OK (PADRÃO CONFORME) */}
                <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 overflow-hidden shadow-xs flex flex-col">
                  <div className="bg-emerald-600 px-3 py-1.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Foto da peça OK:</span>
                    </div>
                    <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded font-semibold text-emerald-100">
                      Padrão
                    </span>
                  </div>
                  <div className="h-56 sm:h-64 bg-white flex items-center justify-center p-2 relative group overflow-hidden">
                    <ImageWithFallback
                      src={rnc.fotoPecaOk}
                      alt="Peça OK Padrão"
                      variant="ok"
                      className="w-full h-full object-contain"
                      emptyLabel="Sem foto do padrão OK"
                      allowZoom={true}
                      itemId={rnc.id}
                    />
                  </div>
                  <div className="p-2 bg-emerald-50/80 border-t border-emerald-200 text-center">
                    <span className="text-[11px] font-bold text-emerald-800">
                      Peça Conforme (Critério de Liberação)
                    </span>
                  </div>
                </div>

                {/* FOTO 2: PEÇA NG (DEFEITO REJEITADO) */}
                <div className="rounded-2xl border-2 border-rose-500 bg-rose-50/30 overflow-hidden shadow-xs flex flex-col">
                  <div className="bg-rose-600 px-3 py-1.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      <span>Foto da peça NG:</span>
                    </div>
                    <span className="text-[10px] bg-rose-700/80 px-1.5 py-0.5 rounded font-semibold text-rose-100">
                      Defeito
                    </span>
                  </div>
                  <div className="h-56 sm:h-64 bg-white flex items-center justify-center p-2 relative group overflow-hidden">
                    <ImageWithFallback
                      src={rnc.fotoPecaNg}
                      alt="Peça NG Não Conforme"
                      variant="ng"
                      className="w-full h-full object-contain"
                      emptyLabel="Sem foto da peça NG"
                      allowZoom={true}
                      itemId={rnc.id}
                    />
                  </div>
                  <div className="p-2 bg-rose-50/80 border-t border-rose-200 text-center">
                    <span className="text-[11px] font-bold text-rose-800">
                      Amostra Rejeitada / Não Conforme
                    </span>
                  </div>
                </div>

                {/* FOTO 3: FOTO AUXILIAR (RETRABALHO / SELEÇÃO) */}
                <div className="rounded-2xl border-2 border-sky-400 bg-sky-50/30 overflow-hidden shadow-xs flex flex-col">
                  <div className="bg-[#0b5796] px-3 py-1.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                      <Eye className="w-3.5 h-3.5 text-white" />
                      <span>Foto Auxiliar:</span>
                    </div>
                    <span className="text-[10px] bg-sky-800/80 px-1.5 py-0.5 rounded font-semibold text-sky-100">
                      Retrabalho / Seleção
                    </span>
                  </div>
                  <div className="h-56 sm:h-64 bg-white flex items-center justify-center p-2 relative group overflow-hidden">
                    <ImageWithFallback
                      src={rnc.fotoAuxiliar}
                      alt="Foto auxiliar de retrabalho / seleção"
                      className="w-full h-full object-contain"
                      emptyLabel="Sem foto auxiliar"
                      allowZoom={true}
                      itemId={rnc.id}
                    />
                  </div>
                  <div className="p-2 bg-sky-50/80 border-t border-sky-200 text-center">
                    <span className="text-[11px] font-bold text-sky-900">
                      Instrução Operacional / Seleção
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. BASE: CONTENÇÃO, DISPOSIÇÃO & PLANO DE AÇÃO (O QUE FAZER) */}
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
              
              {/* Grid de 2 Colunas para Disposição e Plano 5W2H */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5 items-stretch">
                
                {/* COLUNA ESQUERDA: DISPOSIÇÃO INTERNA & AÇÕES DE CONTENÇÃO */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200 flex flex-col gap-3.5 h-full">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Disposição Interna & Ações Imediatas
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 flex-1 h-full">
                    {/* Contenção */}
                    <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 flex flex-col justify-center gap-1 flex-1">
                      <span className="text-[10px] font-bold text-[#0b5796] uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0b5796]" />
                        Contenção:
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {rnc.acoesContencao || 'Nenhuma ação de contenção registrada.'}
                      </div>
                    </div>

                    {/* Recomendações / Providências */}
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex flex-col justify-center gap-1 flex-1">
                      <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                        Recomendações / Providências:
                      </span>
                      <div className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                        {rnc.recomendacoesProvidencias || 'Nenhuma recomendação técnica informada.'}
                      </div>
                    </div>

                    {/* Descrição do Problema */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-center gap-1 flex-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Descrição do problema:
                      </span>
                      <div className="text-xs text-slate-800 font-medium leading-relaxed">
                        {rnc.descricaoProblemaInterno || rnc.descricaoProblema || 'Não especificada.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: AÇÕES INTERNAS DE CONTENÇÃO (5W2H) */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200 flex flex-col gap-3.5 h-full">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                        <ShieldAlert className="w-4 h-4 text-[#0b5796]" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Ações Internas de Contenção
                      </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Instrução Operacional
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* O que fazer? */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        O que fazer?
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {rnc.oQueFazer || 'Não informado'}
                      </div>
                    </div>

                    {/* Como fazer? */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Como fazer?
                      </span>
                      <div className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                        {rnc.comoFazer || 'Não informado'}
                      </div>
                    </div>

                    {/* Porque fazer? */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Porque fazer?
                      </span>
                      <div className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                        {rnc.porQueFazer || 'Não informado'}
                      </div>
                    </div>

                    {/* Quando, Onde e Responsável */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-600" />
                          Quando fazer?
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {rnc.quandoFara || formatDateBR(rnc.dataContencao) || 'Imediato'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-600" />
                          Onde fazer?
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {rnc.ondeFara || 'Posto de Trabalho'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-600" />
                          Equipe responsável:
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate" title={rnc.quemFara || rnc.participantesAtendimento}>
                          {rnc.quemFara || rnc.participantesAtendimento || 'Qualidade / Produção'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* SEÇÃO INFERIOR: OPERADORES TREINADOS NESTA CONTENÇÃO */}
          <div className="card-saas p-0 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#0f6cbd]" />
                <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">
                  Registro de Treinamento da Equipe na Contenção ({treinamentos.length})
                </h3>
              </div>
              {!isOperator && (
                <button
                  type="button"
                  onClick={() => setModalTreinOpen(true)}
                  className="btn-secondary h-8 px-3 text-xs"
                >
                  <span>+ Novo Treinamento</span>
                </button>
              )}
            </div>

            {treinamentos.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748b]">
                Nenhum operador registrado no treinamento desta contenção até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] font-semibold">
                      <th className="py-3 px-5">Operador</th>
                      <th className="py-3 px-5">RE</th>
                      <th className="py-3 px-5">Data</th>
                      <th className="py-3 px-5">Instrutor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {treinamentos.map(t => (
                      <tr key={t.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="py-3 px-5 font-bold text-[#0f172a]">{t.nomeColaborador || (t as any).nomeOperador}</td>
                        <td className="py-3 px-5 font-mono text-[#64748b]">{t.re}</td>
                        <td className="py-3 px-5 font-mono text-[#64748b]">{formatDateBR(t.dataTreinamento)}</td>
                        <td className="py-3 px-5 text-[#334155]">{t.responsavel || (t as any).instrutor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS (CONCLUIR, TREINAMENTO, ALERTA, EXCLUIR) */}
      {/* ========================================================================= */}

      {/* Modal Concluir */}
      {modalConcluirOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Concluir Ocorrência</h3>
                <p className="text-xs text-[#64748b]">Aprovar eficácia e finalizar tratativas</p>
              </div>
            </div>
            <div>
              <label className="form-label">Parecer Final de Eficácia</label>
              <textarea 
                rows={3} 
                className="form-input" 
                placeholder="Descreva a comprovação da eficácia das ações..."
                value={obsConclusao}
                onChange={e => setObsConclusao(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
              <button 
                type="button" 
                onClick={() => setModalConcluirOpen(false)} 
                className="btn-secondary h-9 px-4 text-xs"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmConcluir} 
                className="btn-primary h-9 px-4 text-xs bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Treinamento */}
      {modalTreinOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveTreinamento} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0f6cbd] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Registrar Treinamento</h3>
                <p className="text-xs text-[#64748b]">Capacitação de operador nesta ocorrência</p>
              </div>
            </div>
            <div>
              <label className="form-label">Matrícula (RE do Colaborador) *</label>
              <input 
                type="number"
                required
                className="form-input font-mono font-bold"
                placeholder="Ex: 10423"
                value={treinRe}
                onChange={e => setTreinRe(e.target.value)}
              />
              <span className="text-[11px] text-[#64748b] mt-1 block">
                O nome e função serão preenchidos automaticamente a partir da base de ativos.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
              <button 
                type="button" 
                onClick={() => setModalTreinOpen(false)} 
                className="btn-secondary h-9 px-4 text-xs"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary h-9 px-4 text-xs"
              >
                Salvar Treinamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Alerta */}
      {modalAlertaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveAlerta} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Divulgar Alerta da Qualidade</h3>
                <p className="text-xs text-[#64748b]">Registro de divulgação nos postos de trabalho</p>
              </div>
            </div>
            <div>
              <label className="form-label">Postos de Divulgação *</label>
              <input 
                type="text"
                required
                className="form-input"
                placeholder="Ex: B643033 - ROBÔ 33, Inspeção Final"
                value={alertaPostos}
                onChange={e => setAlertaPostos(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
              <button 
                type="button" 
                onClick={() => setModalAlertaOpen(false)} 
                className="btn-secondary h-9 px-4 text-xs"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary h-9 px-4 text-xs bg-amber-700 hover:bg-amber-800 border-amber-700"
              >
                Registrar Divulgação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Avaliação da Qualidade (Produção / Cliente) */}
      {modalAvaliacaoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#e2e8f0] flex flex-col overflow-hidden animate-in fade-in my-auto max-h-[90vh]">
            
            {/* Header Modal com Gradiente Verde */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Classificação Proteção ao Cliente</h3>
                  <p className="text-xs text-emerald-100">Avaliação técnica da Qualidade para peças reportadas na fábrica</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setModalAvaliacaoOpen(false)}
                className="w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <form onSubmit={handleAprovarAvaliacao} className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5 text-xs sm:text-sm">
              
              {/* Resumo da Ocorrência Registrada pelo Operador */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex gap-3.5 items-start">
                {rnc.fotoPecaNg ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
                    <img src={rnc.fotoPecaNg} alt="Peça NG" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-100/60 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    SAP
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#0f172a] text-sm truncate">
                      {rnc.field1 || `RNC #${rnc.id}`} • {rnc.componente || rnc.produto}
                    </span>
                    <span className="font-mono text-xs font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      SAP: {rnc.codigoRastreabilidade || 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748b]">
                    <strong>Detector:</strong> {rnc.detector || 'Operador da Linha'} • <strong>Montadora:</strong> {rnc.cliente} • <strong>Qtd:</strong> {rnc.quantidadeAfetada} pç
                  </div>
                  <div className="text-xs text-[#334155] italic bg-white p-2 rounded border border-slate-200 mt-1">
                    "{rnc.descricaoProblema || 'Não Conformidade registrada na linha'}"
                  </div>
                </div>
              </div>

              {/* 1. Seleção de Criticidade (A, B, C) */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-[#0f172a] text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>Criticidade da detecção *</span>
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Opção A */}
                  <label 
                    onClick={() => {
                      setEvalCriticidade('A');
                      setEvalAbrirRnc('Sim - Realizar Análise / Contenção / Rastreabilidade');
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      evalCriticidade === 'A' 
                        ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="criticidade" 
                      value="A" 
                      checked={evalCriticidade === 'A'} 
                      onChange={() => {
                        setEvalCriticidade('A');
                        setEvalAbrirRnc('Sim - Realizar Análise / Contenção / Rastreabilidade');
                      }}
                      className="mt-1 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900 text-xs sm:text-sm">A • Crítico (Impacto Direto no Cliente)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">RNC Mandatória</span>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                        Peças com defeitos que <strong>não são detectadas</strong> em nenhuma etapa posterior do nosso processo, com grande impacto no cliente (parada de linha ou perda de montagem).
                      </p>
                    </div>
                  </label>

                  {/* Opção B */}
                  <label 
                    onClick={() => setEvalCriticidade('B')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      evalCriticidade === 'B' 
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="criticidade" 
                      value="B" 
                      checked={evalCriticidade === 'B'} 
                      onChange={() => setEvalCriticidade('B')}
                      className="mt-1 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-amber-950 text-xs sm:text-sm">B • Médio (Gerado pelo Processo)</span>
                      <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                        Peças geradas pelo processo com impacto no cliente, porém passíveis de contenção e retrabalho interno controlado.
                      </p>
                    </div>
                  </label>

                  {/* Opção C */}
                  <label 
                    onClick={() => setEvalCriticidade('C')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      evalCriticidade === 'C' 
                        ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="criticidade" 
                      value="C" 
                      checked={evalCriticidade === 'C'} 
                      onChange={() => setEvalCriticidade('C')}
                      className="mt-1 text-slate-700 focus:ring-slate-500"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">C • Baixo (Fora do Processo / Leve)</span>
                      <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                        Desvios gerados fora do processo padrão ou com baixo impacto no cliente.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Decisão de Abertura de RNC Completa */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-[#0f172a] text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>Abrir RNC e Tratativa? *</span>
                </label>

                {evalCriticidade === 'A' ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Bloqueado em 'Sim':</strong> Para Criticidade A, a abertura da RNC e contenção é mandatória pelas diretrizes de qualidade.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label 
                      onClick={() => setEvalAbrirRnc('Sim - Realizar Análise / Contenção / Rastreabilidade')}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                        evalAbrirRnc.startsWith('Sim')
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 font-bold text-blue-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="abrirRnc" 
                        value="Sim" 
                        checked={evalAbrirRnc.startsWith('Sim')} 
                        onChange={() => setEvalAbrirRnc('Sim - Realizar Análise / Contenção / Rastreabilidade')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <strong>Sim</strong> • Realizar Análise / Contenção
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Envia para complementação de contenção e rastreabilidade</span>
                      </div>
                    </label>

                    <label 
                      onClick={() => setEvalAbrirRnc('Não - Não realizar Análise / Contenção / Rastreabilidade')}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                        evalAbrirRnc.startsWith('Não')
                          ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 font-bold text-slate-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="abrirRnc" 
                        value="Não" 
                        checked={evalAbrirRnc.startsWith('Não')} 
                        onChange={() => setEvalAbrirRnc('Não - Não realizar Análise / Contenção / Rastreabilidade')}
                        className="text-slate-600 focus:ring-slate-500"
                      />
                      <div className="text-xs">
                        <strong>Não</strong> • Concluir Diretamente
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Aprova o apontamento e fecha o registro</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* 3. Feedback / Parecer do Aprovador */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0f172a] text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">3</span>
                  <span>Feedback do Gestor / Parecer da Qualidade *</span>
                </label>
                <textarea 
                  required
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition"
                  placeholder="Insira as orientações técnicas para a linha, confirmação do lote contido ou justifique a decisão tomada..."
                  value={evalComentario}
                  onChange={e => setEvalComentario(e.target.value)}
                />
              </div>

              {/* Rodapé de Ações do Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 shrink-0">
                <button 
                  type="button"
                  onClick={handleReprovarAvaliacao}
                  className="btn-secondary h-9 px-3.5 text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                  title="Reprovar este apontamento da produção"
                >
                  <X className="w-4 h-4 mr-1 text-rose-600 inline" />
                  Reprovar Registro
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalAvaliacaoOpen(false)} 
                    className="btn-secondary h-9 px-4 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary h-9 px-5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprovar Avaliação</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
      {modalDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">Confirmar Exclusão</h3>
                <p className="text-xs text-[#64748b]">Esta operação é irreversível</p>
              </div>
            </div>
            <p className="text-xs text-[#475569]">
              Deseja realmente excluir a ocorrência <strong>{rnc.field1 || `RNC #${rnc.id}`}</strong>? Todos os alertas e treinamentos vinculados também serão removidos.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
              <button 
                type="button" 
                onClick={() => setModalDeleteOpen(false)} 
                className="btn-secondary h-9 px-4 text-xs"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete} 
                className="btn-danger h-9 px-4 text-xs"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP DE VISUALIZAÇÃO RÁPIDA DE RNC DO HISTÓRICO */}
      {rncPopupVisualizar && (
        <RncDetalhesModal
          rnc={rncPopupVisualizar}
          onClose={() => setRncPopupVisualizar(null)}
          onOpenFullPage={id => {
            setRncPopupVisualizar(null);
            onNavigate('detalhes-8d', { rncId: id });
          }}
        />
      )}

    </div>
  );
};

export default Detalhes8DView;
