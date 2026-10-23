import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  RotateCw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  User, 
  Building2, 
  Check, 
  X, 
  LayoutGrid, 
  List as ListIcon,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Paperclip,
  Tag,
  AlertCircle,
  FileText,
  Mail,
  HelpCircle,
  UploadCloud,
  FileCheck2,
  Workflow,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { UsuarioQualidade, PlanoAcaoMestre, PlanoAcaoItem, StatusAcao, PrioridadeAcao, TipoAcao } from '../types';
import { actionPlanService } from '../services/actionPlanService';
import { formatDateBR } from '../utils/date';

interface PlanoAcaoViewProps {
  currentUser: UsuarioQualidade;
  onNavigate: (screen: string, params?: any) => void;
  idprograma?: string;
}

export const PlanoAcaoView: React.FC<PlanoAcaoViewProps> = ({
  currentUser,
  onNavigate,
  idprograma
}) => {
  const [acoes, setAcoes] = useState<PlanoAcaoItem[]>([]);
  const [planos, setPlanos] = useState<PlanoAcaoMestre[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filtros Globais
  const [search, setSearch] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [filtroMinhasAcoes, setFiltroMinhasAcoes] = useState<boolean>(false);
  const [filtroTipoAcao, setFiltroTipoAcao] = useState<string>('Todos');
  const [escopoTemporal, setEscopoTemporal] = useState<'ativas_recentes' | '30d' | '90d' | 'ano' | 'todas'>('ativas_recentes');

  // Fila de Validação Prioritária da Qualidade (Controle de Visualização e Paginação)
  const [filaValidacaoExpandida, setFilaValidacaoExpandida] = useState(true);
  const [searchFilaValidacao, setSearchFilaValidacao] = useState('');
  const [paginaValidacao, setPaginaValidacao] = useState(1);
  const ITENS_POR_PAGINA_VALIDACAO = 6;

  // Limite de itens renderizados por coluna no Kanban (Prevenção de congelamento de DOM)
  const [limiteColuna, setLimiteColuna] = useState<Record<StatusAcao, number>>({
    'Aberto': 25,
    'Atrasado': 25,
    'Concluído': 25,
    'Validado': 25,
    'Revisar': 25
  });

  // Paginação na visualização em Tabela
  const [paginaTabela, setPaginaTabela] = useState(1);
  const ITENS_POR_PAGINA_TABELA = 25;

  // Modais de Controle
  const [modalNovoPlanoOpen, setModalNovoPlanoOpen] = useState(false);
  const [modalNovaAcaoOpen, setModalNovaAcaoOpen] = useState(false);
  const [isEditingAcao, setIsEditingAcao] = useState(false);
  const [modalConcluirOpen, setModalConcluirOpen] = useState(false);
  const [modalValidarOpen, setModalValidarOpen] = useState(false);
  
  // Modal de Exclusão Auditada
  const [modalExcluirAcaoOpen, setModalExcluirAcaoOpen] = useState(false);
  const [motivoExclusao, setMotivoExclusao] = useState('');

  // Item ativo em operação
  const [acaoAtiva, setAcaoAtiva] = useState<PlanoAcaoItem | null>(null);

  // Forms
  const [formNovoPlano, setFormNovoPlano] = useState<Partial<PlanoAcaoMestre>>({
    responsavel_abertura: currentUser.nome,
    indicador_programa_estrategico: 'ATENDIMENTO AO CLIENTE',
    sub1: '8D - Ocorrência Cliente',
    sub2: 'Reclamação Operacional',
    setor_: 'QUALIDADE',
    posto_: 'MONTAGEM / SOLDA',
    produto_: '',
    prioridade: 'Alta',
    descricao_problema_oportunidade: '',
    foto_acao: '',
    idprograma: idprograma || '',
    status: 'Aberto'
  });

  const [formNovaAcao, setFormNovaAcao] = useState<Partial<PlanoAcaoItem>>({
    causa: '',
    contra_medida: '',
    comentarios_observacoes: '',
    responsavel_acao: currentUser.nome,
    email: currentUser.email,
    email_super: '',
    data_planejada: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    data_acompanhamento: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    tipo_acao: 'CORRETIVA',
    yokoten: 'NÃO',
    poka_yoke: 'NÃO',
    eight_d_seven_d: 'IT',
    oc_nd: 'OCORRÊNCIA',
    evidencia_obrigatoria: 'SIM',
    validacao_acao: 'SIM',
    id_programa_acoes: idprograma || ''
  });

  const [formConclusao, setFormConclusao] = useState({
    comentarios_evidencia: '',
    data_conclusao: new Date().toISOString().split('T')[0],
    anexos_evidencia: [] as string[]
  });

  const [formValidacao, setFormValidacao] = useState({
    comentarios_validacao: '',
    aprovado: true
  });

  // Notificações
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [idprograma]);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [acoesData, planosData] = await Promise.all([
        actionPlanService.getAcoes(idprograma ? { idprograma } : undefined, forceRefresh),
        actionPlanService.getPlanos(idprograma, forceRefresh)
      ]);
      setAcoes(acoesData);
      setPlanos(planosData);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao carregar dados do plano de ação' });
    } finally {
      setLoading(false);
    }
  };

  // Classifica ações em status visual dinâmico (considerando atraso por data)
  const getStatusDinamico = (acao: PlanoAcaoItem): StatusAcao => {
    if (acao.status === 'Validado') return 'Validado';
    if (acao.status === 'Concluído') return 'Concluído';
    if (acao.status_revisar2 === 'Revisar') return 'Revisar';
    
    // Checa se está atrasado pela data planejada
    if (acao.data_planejada) {
      const planDate = new Date(acao.data_planejada);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (planDate < today) {
        return 'Atrasado';
      }
    }
    return 'Aberto';
  };

  // Contadores para KPIs corporativos (calculados sobre o TOTAL da fábrica)
  const kpis = useMemo(() => {
    let abertas = 0;
    let atrasadas = 0;
    let concluidas = 0;
    let validadas = 0;

    acoes.forEach(a => {
      const st = getStatusDinamico(a);
      if (st === 'Aberto') abertas++;
      else if (st === 'Atrasado') atrasadas++;
      else if (st === 'Concluído') concluidas++;
      else if (st === 'Validado') validadas++;
    });

    return { total: acoes.length, abertas, atrasadas, concluidas, validadas };
  }, [acoes]);

  // Ações pendentes de validação técnica pela qualidade (Banner prioritário)
  const todasAcoesPendentesValidacao = useMemo(() => {
    return acoes.filter(a => a.status === 'Concluído');
  }, [acoes]);

  // Filtro na Fila de Validação
  const acoesValidacaoFiltradas = useMemo(() => {
    if (!searchFilaValidacao.trim()) return todasAcoesPendentesValidacao;
    const q = searchFilaValidacao.toLowerCase();
    return todasAcoesPendentesValidacao.filter(a => 
      (a.contra_medida || '').toLowerCase().includes(q) ||
      (a.responsavel_acao || '').toLowerCase().includes(q) ||
      (a.id_programa_acoes || '').toLowerCase().includes(q) ||
      String(a.id).includes(q)
    );
  }, [todasAcoesPendentesValidacao, searchFilaValidacao]);

  // Paginação da Fila de Validação
  const totalPaginasValidacao = Math.ceil(acoesValidacaoFiltradas.length / ITENS_POR_PAGINA_VALIDACAO) || 1;
  const acoesValidacaoExibidas = useMemo(() => {
    const inicio = (paginaValidacao - 1) * ITENS_POR_PAGINA_VALIDACAO;
    return acoesValidacaoFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA_VALIDACAO);
  }, [acoesValidacaoFiltradas, paginaValidacao]);

  // Otimização de Performance: Filtro inteligente de ações a renderizar
  const acoesFiltradas = useMemo(() => {
    const now = Date.now();
    const trintaDiasMs = 30 * 86400000;
    const noventaDiasMs = 90 * 86400000;
    const anoAtual = new Date().getFullYear();

    return acoes.filter(acao => {
      // 1. Filtro Temporal / Escopo
      if (escopoTemporal === 'ativas_recentes') {
        // Se já está validada e não é recente, oculta do Kanban padrão para não explodir o DOM com 8.275 cards
        if (acao.status === 'Validado') {
          if (acao.data_conclusao) {
            const dataConcl = new Date(acao.data_conclusao).getTime();
            if (now - dataConcl > trintaDiasMs) return false;
          }
        }
      } else if (escopoTemporal === '30d') {
        const refData = acao.data_conclusao || acao.data_planejada;
        if (refData) {
          const t = new Date(refData).getTime();
          if (now - t > trintaDiasMs) return false;
        }
      } else if (escopoTemporal === '90d') {
        const refData = acao.data_conclusao || acao.data_planejada;
        if (refData) {
          const t = new Date(refData).getTime();
          if (now - t > noventaDiasMs) return false;
        }
      } else if (escopoTemporal === 'ano') {
        const refData = acao.data_conclusao || acao.data_planejada;
        if (refData) {
          const y = new Date(refData).getFullYear();
          if (y !== anoAtual) return false;
        }
      }

      // 2. Busca texto
      if (search) {
        const q = search.toLowerCase();
        const contra = (acao.contra_medida || '').toLowerCase();
        const causa = (acao.causa || '').toLowerCase();
        const resp = (acao.responsavel_acao || '').toLowerCase();
        const idStr = String(acao.id);
        const refProg = (acao.id_programa_acoes || '').toLowerCase();
        if (!contra.includes(q) && !causa.includes(q) && !resp.includes(q) && !idStr.includes(q) && !refProg.includes(q)) {
          return false;
        }
      }

      // 3. Filtro Minhas Ações
      if (filtroMinhasAcoes) {
        const resp = (acao.responsavel_acao || '').toLowerCase();
        const userNome = (currentUser.nome || '').toLowerCase();
        if (!resp.includes(userNome)) return false;
      }

      // 4. Filtro Tipo de Ação
      if (filtroTipoAcao !== 'Todos' && acao.tipo_acao !== filtroTipoAcao) {
        return false;
      }

      return true;
    });
  }, [acoes, escopoTemporal, search, filtroMinhasAcoes, filtroTipoAcao, currentUser]);

  // Paginação na Tabela
  const totalPaginasTabela = Math.ceil(acoesFiltradas.length / ITENS_POR_PAGINA_TABELA) || 1;
  const acoesTabelaExibidas = useMemo(() => {
    const inicio = (paginaTabela - 1) * ITENS_POR_PAGINA_TABELA;
    return acoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA_TABELA);
  }, [acoesFiltradas, paginaTabela]);

  // Colunas do Kanban
  const kanbanColumns: { status: StatusAcao; label: string; color: string; badge: string }[] = [
    { status: 'Aberto', label: 'Aberto / Em Andamento', color: 'border-blue-200 bg-blue-50/20', badge: 'bg-blue-100 text-blue-800' },
    { status: 'Atrasado', label: 'Prazo Vencido (Atrasado)', color: 'border-rose-200 bg-rose-50/20', badge: 'bg-rose-100 text-rose-800' },
    { status: 'Concluído', label: 'Aguardando Validação', color: 'border-amber-200 bg-amber-50/20', badge: 'bg-amber-100 text-amber-800' },
    { status: 'Validado', label: 'Homologado / Eficaz', color: 'border-emerald-200 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-800' }
  ];

  const handleCreatePlano = async () => {
    if (!formNovoPlano.descricao_problema_oportunidade?.trim()) {
      alert('Informe a descrição do problema ou oportunidade.');
      return;
    }
    try {
      await actionPlanService.createPlano({
        ...formNovoPlano,
        status: 'Aberto',
        responsavel_abertura: formNovoPlano.responsavel_abertura || currentUser.nome,
        data_abertura: new Date().toISOString()
      });
      setModalNovoPlanoOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Plano de Ação mestre criado com sucesso na lista Action plan!' });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenNovaAcaoModal = () => {
    setIsEditingAcao(false);
    setFormNovaAcao({
      causa: '',
      contra_medida: '',
      comentarios_observacoes: '',
      responsavel_acao: currentUser.nome,
      email: currentUser.email,
      email_super: '',
      data_planejada: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      data_acompanhamento: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      tipo_acao: 'CORRETIVA',
      yokoten: 'NÃO',
      poka_yoke: 'NÃO',
      eight_d_seven_d: 'IT',
      oc_nd: 'OCORRÊNCIA',
      evidencia_obrigatoria: 'SIM',
      validacao_acao: 'SIM',
      id_programa_acoes: idprograma || ''
    });
    setModalNovaAcaoOpen(true);
  };

  const handleOpenEditAcaoModal = (acao: PlanoAcaoItem) => {
    setIsEditingAcao(true);
    setAcaoAtiva(acao);
    setFormNovaAcao({
      ...acao,
      id_programa_acoes: acao.id_programa_acoes || idprograma || ''
    });
    setModalNovaAcaoOpen(true);
  };

  const handleSaveAcao = async () => {
    if (!formNovaAcao.contra_medida?.trim()) {
      alert('Informe a contramedida a ser realizada.');
      return;
    }
    try {
      const payload: Partial<PlanoAcaoItem> = {
        ...formNovaAcao,
        OData__x0038_d_7d: formNovaAcao.eight_d_seven_d
      };

      if (isEditingAcao && acaoAtiva) {
        await actionPlanService.updateAcao(acaoAtiva.id, payload);
        setFeedbackMsg({ type: 'success', text: `Ação #${acaoAtiva.id} atualizada com sucesso!` });
      } else {
        await actionPlanService.createAcao({
          ...payload,
          status: 'Aberto'
        });
        setFeedbackMsg({ type: 'success', text: 'Contramedida adicionada com sucesso ao plano!' });
      }
      setModalNovaAcaoOpen(false);
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConcluirAcao = async () => {
    if (!acaoAtiva) return;
    if (acaoAtiva.evidencia_obrigatoria === 'SIM' && !formConclusao.comentarios_evidencia.trim()) {
      alert('Para esta ação, o relato detalhado da evidência é obrigatório.');
      return;
    }
    try {
      await actionPlanService.concluirAcao(acaoAtiva.id, {
        comentarios_evidencia: formConclusao.comentarios_evidencia,
        data_conclusao: formConclusao.data_conclusao,
        validacao_acao: acaoAtiva.validacao_acao
      });
      setModalConcluirOpen(false);
      setFeedbackMsg({ 
        type: 'success', 
        text: acaoAtiva.validacao_acao === 'NÃO' 
          ? 'Ação concluída e homologada automaticamente!' 
          : 'Ação concluída pelo responsável e enviada para a fila de validação da Qualidade!' 
      });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleValidarAcao = async () => {
    if (!acaoAtiva) return;
    if (!formValidacao.comentarios_validacao.trim()) {
      alert('Informe o parecer técnico da validação.');
      return;
    }
    try {
      await actionPlanService.validarAcao(acaoAtiva.id, {
        aprovado: formValidacao.aprovado,
        comentarios_validacao: formValidacao.comentarios_validacao
      });
      setModalValidarOpen(false);
      setFeedbackMsg({ 
        type: 'success', 
        text: formValidacao.aprovado 
          ? 'Ação homologada como eficaz com sucesso!' 
          : 'Ação reprovada e devolvida para revisão do responsável com alerta.' 
      });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmExclusaoAcao = async () => {
    if (!acaoAtiva) return;
    if (!motivoExclusao.trim()) {
      alert('É obrigatório informar o motivo da exclusão para registro no log corporativo.');
      return;
    }
    try {
      await actionPlanService.deleteAcao(acaoAtiva.id, motivoExclusao, currentUser.nome);
      setModalExcluirAcaoOpen(false);
      setMotivoExclusao('');
      setFeedbackMsg({ type: 'success', text: `Ação #${acaoAtiva.id} excluída e auditada com sucesso!` });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-12">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Módulo de Acompanhamento Fabril • Gestamp Brasil</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-3">
            Plano de Ação & Gestão de Contramedidas
            {idprograma && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold rounded-full flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-blue-600" />
                <span>8D: {idprograma}</span>
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Painel de alta performance com paginação inteligente e sincronização direta com o SharePoint.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadData(true)}
            className="btn-secondary !h-9 text-xs flex items-center gap-1.5"
            title="Sincronizar com SharePoint Online"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoPlanoOpen(true)}
            className="btn-secondary !h-9 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Plano Mestre</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNovaAcaoModal}
            className="btn-primary !h-9 text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Ação</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-xs ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cards de KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total de Ações</span>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{kpis.total.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Abertas / Em Curso</span>
          <p className="text-2xl font-bold font-display text-blue-600 mt-1">{kpis.abertas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Prazo Vencido</span>
          <p className="text-2xl font-bold font-display text-rose-600 mt-1">{kpis.atrasadas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Aguardando Validação</span>
          <p className="text-2xl font-bold font-display text-amber-600 mt-1">{kpis.concluidas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Homologadas</span>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{kpis.validadas.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* BANNER PRIORITÁRIO OTIMIZADO: Galleryvalidacao com Paginação e Colapso */}
      {todasAcoesPendentesValidacao.length > 0 && (
        <div className="bg-amber-50/40 border border-amber-300/80 rounded-2xl p-4 shadow-xs transition">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950 font-display">
                    Fila de Validação Prioritária da Qualidade
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                    {todasAcoesPendentesValidacao.length} pendentes
                  </span>
                </div>
                <p className="text-xs text-amber-800/80">
                  Ações concluídas pelos responsáveis que requerem parecer formal do auditor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Mini busca na fila */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-amber-600" />
                <input
                  type="text"
                  placeholder="Filtrar fila..."
                  value={searchFilaValidacao}
                  onChange={e => {
                    setSearchFilaValidacao(e.target.value);
                    setPaginaValidacao(1);
                  }}
                  className="pl-7 pr-2.5 py-1 text-xs bg-white border border-amber-200 rounded-lg text-slate-800 w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Botão Recolher/Expandir */}
              <button
                type="button"
                onClick={() => setFilaValidacaoExpandida(!filaValidacaoExpandida)}
                className="p-1.5 rounded-lg border border-amber-200 bg-white text-amber-800 hover:bg-amber-100/50 text-xs font-semibold flex items-center gap-1 transition"
                title={filaValidacaoExpandida ? "Minimizar visualização da fila" : "Expandir visualização da fila"}
              >
                {filaValidacaoExpandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="hidden md:inline">{filaValidacaoExpandida ? "Minimizar" : "Expandir"}</span>
              </button>
            </div>
          </div>

          {filaValidacaoExpandida && (
            <div className="mt-3.5 flex flex-col gap-3">
              {/* Grid Compacto Limitado a 6 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {acoesValidacaoExibidas.length === 0 ? (
                  <div className="col-span-3 text-center py-6 text-xs text-amber-800 italic bg-white/60 rounded-xl border border-dashed border-amber-200">
                    Nenhuma ação encontrada com o filtro "{searchFilaValidacao}".
                  </div>
                ) : (
                  acoesValidacaoExibidas.map(acao => (
                    <div 
                      key={acao.id}
                      className="bg-white border border-amber-200 hover:border-amber-400 rounded-xl p-3 shadow-xs flex flex-col justify-between transition gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-600">#{acao.id}</span>
                          {acao.id_programa_acoes && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              8D: {acao.id_programa_acoes}
                            </span>
                          )}
                          <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                            Concluída
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug" title={acao.contra_medida}>
                          {acao.contra_medida}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          Resp: <strong>{acao.responsavel_acao}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoAtiva(acao);
                            setFormValidacao({ comentarios_validacao: '', aprovado: true });
                            setModalValidarOpen(true);
                          }}
                          className="text-xs font-semibold px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Auditar & Validar</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Paginação da Fila de Validação */}
              {totalPaginasValidacao > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-amber-900 border-t border-amber-200/50">
                  <span className="font-medium text-[11px]">
                    Exibindo <strong>{(paginaValidacao - 1) * ITENS_POR_PAGINA_VALIDACAO + 1}</strong> a <strong>{Math.min(paginaValidacao * ITENS_POR_PAGINA_VALIDACAO, acoesValidacaoFiltradas.length)}</strong> de <strong>{acoesValidacaoFiltradas.length}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={paginaValidacao === 1}
                      onClick={() => setPaginaValidacao(p => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded bg-white border border-amber-200 hover:bg-amber-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-semibold flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>
                    <span className="px-2 py-1 font-bold text-[11px]">
                      {paginaValidacao} / {totalPaginasValidacao}
                    </span>
                    <button
                      type="button"
                      disabled={paginaValidacao === totalPaginasValidacao}
                      onClick={() => setPaginaValidacao(p => Math.min(totalPaginasValidacao, p + 1))}
                      className="px-2 py-1 rounded bg-white border border-amber-200 hover:bg-amber-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-semibold flex items-center gap-0.5"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Barra de Filtros e Alternância de Visualização */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar contramedida, causa, responsável, ID..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPaginaTabela(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Seletor Inteligente de Escopo Temporal */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              <span>Escopo:</span>
            </span>
            <select
              value={escopoTemporal}
              onChange={e => {
                setEscopoTemporal(e.target.value as any);
                setPaginaTabela(1);
              }}
              className="bg-white border border-slate-200 rounded-lg text-xs font-semibold py-1 px-2 text-slate-700 focus:outline-none"
            >
              <option value="ativas_recentes">Ativas & Recentes (Padrão Rápido)</option>
              <option value="30d">Últimos 30 Dias</option>
              <option value="90d">Últimos 90 Dias</option>
              <option value="ano">Ano Atual</option>
              <option value="todas">Todas ({acoes.length})</option>
            </select>
          </div>

          <select
            value={filtroTipoAcao}
            onChange={e => {
              setFiltroTipoAcao(e.target.value);
              setPaginaTabela(1);
            }}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="Todos">Todos os Tipos de Ação</option>
            <option value="CONTENÇÃO">Contenção</option>
            <option value="CORRETIVA">Corretiva</option>
            <option value="PREVENTIVA">Preventiva</option>
            <option value="MELHORIA">Melhoria</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filtroMinhasAcoes}
              onChange={e => {
                setFiltroMinhasAcoes(e.target.checked);
                setPaginaTabela(1);
              }}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Minhas Ações</span>
          </label>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Tabela ({acoesFiltradas.length})</span>
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: KANBAN OU TABELA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Carregando ações do SharePoint...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* VISUALIZAÇÃO KANBAN COM LIMITE INCREMENTAL ANTI-FREEZE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map(col => {
            const acoesDaColuna = acoesFiltradas.filter(a => getStatusDinamico(a) === col.status);
            const limiteAtual = limiteColuna[col.status] || 25;
            const acoesVisiveis = acoesDaColuna.slice(0, limiteAtual);
            const temMais = acoesDaColuna.length > limiteAtual;

            return (
              <div 
                key={col.status} 
                className={`flex flex-col rounded-2xl border p-3.5 shadow-xs ${col.color}`}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                    {col.label}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {acoesDaColuna.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {acoesDaColuna.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic bg-white/40 rounded-xl border border-dashed border-slate-200">
                      Nenhuma ação neste status.
                    </div>
                  ) : (
                    acoesVisiveis.map(acao => (
                      <div
                        key={acao.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-slate-300 transition flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                            <span className="text-[10px] font-bold text-slate-400">#{acao.id}</span>
                            
                            <div className="flex items-center gap-1">
                              {acao.id_programa_acoes && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                  8D: {acao.id_programa_acoes}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                                {acao.tipo_acao}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-3">
                            {acao.contra_medida}
                          </p>

                          {acao.causa && (
                            <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                              Causa: {acao.causa}
                            </p>
                          )}

                          {/* Badges de Qualidade */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {acao.yokoten === 'SIM' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                Yokoten
                              </span>
                            )}
                            {acao.poka_yoke === 'SIM' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                Poka-Yoke
                              </span>
                            )}
                            {acao.eight_d_seven_d && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-50 text-slate-600 border border-slate-200 font-semibold">
                                {acao.eight_d_seven_d}
                              </span>
                            )}
                            {acao.status_revisar2 === 'Revisar' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Revisar</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-0.5 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">{acao.responsavel_acao}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Prazo: <strong>{formatDateBR(acao.data_planejada)}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação no Card */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAcaoModal(acao)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                              title="Editar Ação"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAcaoAtiva(acao);
                                setMotivoExclusao('');
                                setModalExcluirAcaoOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                              title="Excluir Ação (Auditado)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {col.status !== 'Validado' && col.status !== 'Concluído' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoAtiva(acao);
                                  setFormConclusao({
                                    comentarios_evidencia: acao.comentarios_evidencia || '',
                                    data_conclusao: new Date().toISOString().split('T')[0],
                                    anexos_evidencia: []
                                  });
                                  setModalConcluirOpen(true);
                                }}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 border border-blue-200"
                              >
                                Concluir
                              </button>
                            )}

                            {col.status === 'Concluído' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoAtiva(acao);
                                  setFormValidacao({ comentarios_validacao: '', aprovado: true });
                                  setModalValidarOpen(true);
                                }}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Validar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Botão de Carga Incremental */}
                  {temMais && (
                    <button
                      type="button"
                      onClick={() => {
                        setLimiteColuna(prev => ({
                          ...prev,
                          [col.status]: (prev[col.status] || 25) + 25
                        }));
                      }}
                      className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs mt-1"
                    >
                      Carregar mais (+25) • {acoesDaColuna.length - limiteAtual} restantes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* VISUALIZAÇÃO EM TABELA PAGINADA */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Vínculo 8D</th>
                  <th className="p-3.5">Causa / Contramedida</th>
                  <th className="p-3.5">Responsável</th>
                  <th className="p-3.5">Prazo Final</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Controles</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {acoesTabelaExibidas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                      Nenhuma ação encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  acoesTabelaExibidas.map(acao => {
                    const status = getStatusDinamico(acao);
                    return (
                      <tr key={acao.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-bold text-slate-900">#{acao.id}</td>
                        <td className="p-3.5">
                          {acao.id_programa_acoes ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-semibold text-[11px]">
                              {acao.id_programa_acoes}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <div className="font-semibold text-slate-900 leading-snug line-clamp-2">{acao.contra_medida}</div>
                          {acao.causa && <div className="text-[11px] text-slate-400 truncate italic">Causa: {acao.causa}</div>}
                        </td>
                        <td className="p-3.5 font-medium">{acao.responsavel_acao}</td>
                        <td className="p-3.5 font-semibold">{formatDateBR(acao.data_planejada)}</td>
                        <td className="p-3.5 font-medium">{acao.tipo_acao}</td>
                        <td className="p-3.5">
                          <div className="flex gap-1 flex-wrap">
                            {acao.yokoten === 'SIM' && <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 text-[10px] rounded font-semibold border border-purple-200">Yokoten</span>}
                            {acao.poka_yoke === 'SIM' && <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[10px] rounded font-semibold border border-emerald-200">Poka-Yoke</span>}
                            {acao.eight_d_seven_d && <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold">{acao.eight_d_seven_d}</span>}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                            status === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                            status === 'Atrasado' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAcaoModal(acao)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAcaoAtiva(acao);
                                setMotivoExclusao('');
                                setModalExcluirAcaoOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {status === 'Concluído' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoAtiva(acao);
                                  setModalValidarOpen(true);
                                }}
                                className="text-xs text-emerald-600 font-semibold hover:underline ml-1"
                              >
                                Validar
                              </button>
                            ) : status !== 'Validado' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoAtiva(acao);
                                  setModalConcluirOpen(true);
                                }}
                                className="text-xs text-blue-600 font-semibold hover:underline ml-1"
                              >
                                Concluir
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Eficaz</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação Inferior da Tabela */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              Exibindo <strong>{(paginaTabela - 1) * ITENS_POR_PAGINA_TABELA + 1}</strong> a <strong>{Math.min(paginaTabela * ITENS_POR_PAGINA_TABELA, acoesFiltradas.length)}</strong> de <strong>{acoesFiltradas.length}</strong> ações filtradas
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaTabela === 1}
                onClick={() => setPaginaTabela(1)}
                className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                title="Primeira página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={paginaTabela === 1}
                onClick={() => setPaginaTabela(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold"
              >
                Anterior
              </button>
              <span className="px-2 font-bold text-slate-800">
                {paginaTabela} de {totalPaginasTabela}
              </span>
              <button
                type="button"
                disabled={paginaTabela === totalPaginasTabela}
                onClick={() => setPaginaTabela(p => Math.min(totalPaginasTabela, p + 1))}
                className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold"
              >
                Próxima
              </button>
              <button
                type="button"
                disabled={paginaTabela === totalPaginasTabela}
                onClick={() => setPaginaTabela(totalPaginasTabela)}
                className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS (MANTIDOS E COMPLETOS)                                             */}
      {/* ========================================================================= */}
      
      {/* MODAL 1: Novo Plano de Ação Mestre */}
      {modalNovoPlanoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Novo Plano de Ação (Cabeçalho Mestre)</h3>
                <p className="text-xs text-slate-500">Formulário correspondente ao 'Formactionplan' da lista 'Action plan'.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalNovoPlanoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Responsável pela Abertura *</label>
                  <input
                    type="text"
                    value={formNovoPlano.responsavel_abertura || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, responsavel_abertura: e.target.value })}
                    placeholder="Nome e RE do colaborador..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vínculo com Programa / 8D (idprograma)</label>
                  <input
                    type="text"
                    value={formNovoPlano.idprograma || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, idprograma: e.target.value })}
                    placeholder="Ex: Q - 6192 ou I - 4520"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Indicador / Prog. Estratégico *</label>
                  <select
                    value={formNovoPlano.indicador_programa_estrategico}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, indicador_programa_estrategico: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="ATENDIMENTO AO CLIENTE">ATENDIMENTO AO CLIENTE (8D)</option>
                    <option value="FAST RESPONSE">FAST RESPONSE</option>
                    <option value="AUDITORIA DE PROCESSO">AUDITORIA DE PROCESSO</option>
                    <option value="RETRABALHO CORDÕES">RETRABALHO CORDÕES</option>
                    <option value="MELHORIA CONTÍNUA">MELHORIA CONTÍNUA</option>
                    <option value="SCRAP / SUCATA">SCRAP / SUCATA</option>
                    <option value="SEGURANÇA DO TRABALHO">SEGURANÇA DO TRABALHO</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Sub Indicador 1 (Title)</label>
                  <input
                    type="text"
                    value={formNovoPlano.sub1 || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, sub1: e.target.value })}
                    placeholder="Subindicador 1..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Sub Indicador 2 (sub2)</label>
                  <input
                    type="text"
                    value={formNovoPlano.sub2 || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, sub2: e.target.value })}
                    placeholder="Subindicador 2..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Posto de Trabalho</label>
                  <input
                    type="text"
                    value={formNovoPlano.posto_ || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, posto_: e.target.value })}
                    placeholder="Ex: OP-10, Solda 2..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Produto / Peça</label>
                  <input
                    type="text"
                    value={formNovoPlano.produto_ || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, produto_: e.target.value })}
                    placeholder="Código ou Nome..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Área / Setor *</label>
                  <input
                    type="text"
                    value={formNovoPlano.setor_ || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, setor_: e.target.value })}
                    placeholder="Ex: SOLDA, ESTAMPARIA..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prioridade</label>
                  <select
                    value={formNovoPlano.prioridade}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, prioridade: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Descrição, Problema ou Oportunidade *
                </label>
                <textarea
                  rows={3}
                  value={formNovoPlano.descricao_problema_oportunidade}
                  onChange={e => setFormNovoPlano({ ...formNovoPlano, descricao_problema_oportunidade: e.target.value })}
                  placeholder="Detalhamento técnico do problema identificado ou oportunidade de melhoria..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Foto Auxiliar / Evidência Inicial (foto_acao)
                </label>
                <input
                  type="text"
                  value={formNovoPlano.foto_acao || ''}
                  onChange={e => setFormNovoPlano({ ...formNovoPlano, foto_acao: e.target.value })}
                  placeholder="URL ou identificador da imagem..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalNovoPlanoOpen(false)}
                className="btn-secondary !h-9 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreatePlano}
                className="btn-primary !h-9 text-xs"
              >
                Salvar Cabeçalho Mestre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Nova / Edição de Ação (25 campos) */}
      {modalNovaAcaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {isEditingAcao ? `Editar Contramedida #${formNovaAcao.id}` : 'Nova Contramedida / Ação'}
                </h3>
                <p className="text-xs text-slate-500">
                  Formulário correspondente ao 'Formnovaacao' da lista 'Action plan_acoes'.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalNovaAcaoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Definição da Causa & Contramedida
                </span>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Causa Raiz (Ishikawa / 5 Porquês)
                  </label>
                  <input
                    type="text"
                    value={formNovaAcao.causa || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, causa: e.target.value })}
                    placeholder="Informe a causa raiz identificada no 8D ou na análise de falha..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Contramedida / Ação a Executar *
                  </label>
                  <textarea
                    rows={2}
                    value={formNovaAcao.contra_medida || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, contra_medida: e.target.value })}
                    placeholder="Descreva detalhadamente a contramedida prática..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Comentários / Observações Adicionais
                  </label>
                  <input
                    type="text"
                    value={formNovaAcao.comentarios_observacoes || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, comentarios_observacoes: e.target.value })}
                    placeholder="Instruções complementares ou observações de campo..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  2. Responsáveis & Prazos
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Responsável pela Ação *</label>
                    <input
                      type="text"
                      value={formNovaAcao.responsavel_acao || ''}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, responsavel_acao: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email do Responsável</label>
                    <input
                      type="email"
                      value={formNovaAcao.email || ''}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, email: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email do Supervisor</label>
                    <input
                      type="email"
                      value={formNovaAcao.email_super || ''}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, email_super: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Prazo Final Planejado *</label>
                    <input
                      type="date"
                      value={formNovaAcao.data_planejada || ''}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, data_planejada: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Data de Acompanhamento</label>
                    <input
                      type="date"
                      value={formNovaAcao.data_acompanhamento || ''}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, data_acompanhamento: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  3. Parâmetros de Engenharia da Qualidade
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Ação</label>
                    <select
                      value={formNovaAcao.tipo_acao}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, tipo_acao: e.target.value as any })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="CONTENÇÃO">CONTENÇÃO</option>
                      <option value="CORRETIVA">CORRETIVA</option>
                      <option value="PREVENTIVA">PREVENTIVA</option>
                      <option value="MELHORIA">MELHORIA</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Yokoten?</label>
                    <select
                      value={formNovaAcao.yokoten}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, yokoten: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="NÃO">NÃO</option>
                      <option value="SIM">SIM (Abrangência)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Poka-Yoke?</label>
                    <select
                      value={formNovaAcao.poka_yoke}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, poka_yoke: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="NÃO">NÃO</option>
                      <option value="SIM">SIM (Dispositivo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Modo de Falha</label>
                    <select
                      value={formNovaAcao.oc_nd}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, oc_nd: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="OCORRÊNCIA">OCORRÊNCIA</option>
                      <option value="NÃO DETECÇÃO">NÃO DETECÇÃO</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Doc. 8D/7D a Atualizar</label>
                    <select
                      value={formNovaAcao.eight_d_seven_d}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, eight_d_seven_d: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="IT">IT (Instrução de Trabalho)</option>
                      <option value="FMEA">FMEA</option>
                      <option value="PCP">PCP (Plano de Controle)</option>
                      <option value="FOLHA DE PROCESSO">FOLHA DE PROCESSO</option>
                      <option value="DESENHO">DESENHO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Evidência Obrigatória?</label>
                    <select
                      value={formNovaAcao.evidencia_obrigatoria}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, evidencia_obrigatoria: e.target.value as any })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="SIM">SIM</option>
                      <option value="NÃO">NÃO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Validação Qualidade?</label>
                    <select
                      value={formNovaAcao.validacao_acao}
                      onChange={e => setFormNovaAcao({ ...formNovaAcao, validacao_acao: e.target.value as any })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="SIM">SIM (Auditoria)</option>
                      <option value="NÃO">NÃO</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalNovaAcaoOpen(false)}
                className="btn-secondary !h-9 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAcao}
                className="btn-primary !h-9 text-xs shadow-xs"
              >
                {isEditingAcao ? 'Salvar Alterações' : 'Gravar Ação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Concluir Ação */}
      {modalConcluirOpen && acaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Concluir Ação #{acaoAtiva.id}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registre as contramedidas executadas e anexe as evidências para homologação.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs flex flex-col gap-1">
              <div>
                <span className="font-bold text-slate-700">Contramedida: </span>
                <span className="text-slate-900 font-semibold">{acaoAtiva.contra_medida}</span>
              </div>
              {acaoAtiva.causa && (
                <div className="text-slate-500 text-[11px] italic">
                  Causa: {acaoAtiva.causa}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Data Efetiva de Conclusão *</label>
                <input
                  type="date"
                  value={formConclusao.data_conclusao}
                  onChange={e => setFormConclusao({ ...formConclusao, data_conclusao: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Relato da Evidência Implementada *
                </label>
                <textarea
                  rows={3}
                  value={formConclusao.comentarios_evidencia}
                  onChange={e => setFormConclusao({ ...formConclusao, comentarios_evidencia: e.target.value })}
                  placeholder="Descreva o que foi alterado na máquina/processo, ensaios realizados..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Anexos Comprobatórios (Fotos, Laudos, PDFs)
                </label>
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition">
                  <UploadCloud className="w-5 h-5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-blue-600">Clique para selecionar arquivos</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, PDF</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalConcluirOpen(false)}
                className="btn-secondary !h-9 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConcluirAcao}
                className="btn-primary !h-9 text-xs shadow-xs"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Validar Ação */}
      {modalValidarOpen && acaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">
              Auditoria & Validação Técnica (Qualidade)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Avaliação de eficácia da contramedida para a Ação #{acaoAtiva.id}.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs flex flex-col gap-1.5">
              <div>
                <span className="font-bold text-slate-700 block">Contramedida:</span>
                <p className="text-slate-900 font-semibold">{acaoAtiva.contra_medida}</p>
              </div>
              {acaoAtiva.comentarios_evidencia && (
                <div className="mt-1 pt-1 border-t border-slate-200/60">
                  <span className="font-bold text-slate-700 block">Evidência Apresentada:</span>
                  <p className="text-slate-700 italic">"{acaoAtiva.comentarios_evidencia}"</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Decisão do Auditor da Qualidade *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormValidacao({ ...formValidacao, aprovado: true })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      formValidacao.aprovado ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Aprovar (Validar Ação)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormValidacao({ ...formValidacao, aprovado: false })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      !formValidacao.aprovado ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Solicitar Revisão</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parecer da Validação Técnica *
                </label>
                <textarea
                  rows={3}
                  value={formValidacao.comentarios_validacao}
                  onChange={e => setFormValidacao({ ...formValidacao, comentarios_validacao: e.target.value })}
                  placeholder={
                    formValidacao.aprovado 
                      ? "Ação homologada conforme especificado, ensaio aprovado sem desvios." 
                      : "Informe os motivos da rejeição técnica e o que o responsável precisa corrigir..."
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalValidarOpen(false)}
                className="btn-secondary !h-9 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleValidarAcao}
                className="btn-primary !h-9 text-xs shadow-xs"
              >
                Gravar Decisão da Qualidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Exclusão Auditada */}
      {modalExcluirAcaoOpen && acaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Confirmar a exclusão do item?</h3>
                <p className="text-xs text-slate-500">
                  Esta operação é irreversível e será registrada no log de auditoria.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
              <span className="font-bold text-slate-700 block">Ação #{acaoAtiva.id}:</span>
              <p className="text-slate-900 font-semibold mt-0.5">{acaoAtiva.contra_medida}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Informe o motivo da exclusão: *
              </label>
              <textarea
                rows={3}
                value={motivoExclusao}
                onChange={e => setMotivoExclusao(e.target.value)}
                placeholder="Ex: Ação duplicada, cancelamento aprovado pela coordenação, etc."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setModalExcluirAcaoOpen(false);
                  setMotivoExclusao('');
                }}
                className="btn-secondary !h-9 text-xs"
              >
                Não, Cancelar
              </button>
              <button
                type="button"
                disabled={!motivoExclusao.trim()}
                onClick={handleConfirmExclusaoAcao}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Sim, Excluir Ação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlanoAcaoView;
