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
  Sparkles,
  ArrowLeft,
  FolderOpen,
  Eye,
  ExternalLink,
  BarChart3,
  Target,
  Wrench,
  Package
} from 'lucide-react';
import { UsuarioQualidade, PlanoAcaoMestre, PlanoAcaoItem, StatusAcao, PrioridadeAcao, TipoAcao } from '../types';
import { actionPlanService } from '../services/actionPlanService';
import { formatDateBR } from '../utils/date';

interface PlanoAcaoViewProps {
  currentUser: UsuarioQualidade;
  onNavigate: (screen: string, params?: any) => void;
  idprograma?: string;
  initialPlanoId?: string | number;
}

export const PlanoAcaoView: React.FC<PlanoAcaoViewProps> = ({
  currentUser,
  onNavigate,
  idprograma,
  initialPlanoId
}) => {
  // Dados Principais
  const [acoes, setAcoes] = useState<PlanoAcaoItem[]>([]);
  const [planos, setPlanos] = useState<PlanoAcaoMestre[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegação de Visão: 'planos' (Controle dos Planos - Padrão) ou 'acoes_gerais' (Quadro Geral de Ações)
  const [mainTab, setMainTab] = useState<'planos' | 'acoes_gerais'>('planos');

  // Plano Ativo Selecionado (quando não é null, exibe a TELA ÚNICA DO PLANO com cabeçalho mestre e ações)
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAcaoMestre | null>(null);

  // Modos de Visualização
  const [viewModePlanos, setViewModePlanos] = useState<'cards' | 'table'>('cards');
  const [viewModeAcoes, setViewModeAcoes] = useState<'kanban' | 'table'>('kanban');
  const [viewModeDetalheAcoes, setViewModeDetalheAcoes] = useState<'cards' | 'table'>('cards');

  // Edição Inline do Cabeçalho do Plano na Tela Única
  const [isEditingPlanoHeader, setIsEditingPlanoHeader] = useState(false);
  const [formEditarPlano, setFormEditarPlano] = useState<Partial<PlanoAcaoMestre>>({});

  // Filtros da Visão de Planos
  const [searchPlanos, setSearchPlanos] = useState('');
  const [filtroStatusPlano, setFiltroStatusPlano] = useState<string>('Todos');
  const [filtroPrioridadePlano, setFiltroPrioridadePlano] = useState<string>('Todas');
  const [paginaPlanos, setPaginaPlanos] = useState(1);
  const ITENS_POR_PAGINA_PLANOS = 24;

  // Filtros Globais da Visão de Ações Gerais
  const [searchAcoes, setSearchAcoes] = useState('');
  const [filtroPrioridadeAcao, setFiltroPrioridadeAcao] = useState<string>('Todas');
  const [filtroMinhasAcoes, setFiltroMinhasAcoes] = useState<boolean>(false);
  const [filtroTipoAcao, setFiltroTipoAcao] = useState<string>('Todos');
  const [escopoTemporal, setEscopoTemporal] = useState<'ativas_recentes' | '30d' | '90d' | 'ano' | 'todas'>('ativas_recentes');

  // Fila de Validação Prioritária da Qualidade (Visão Ações Gerais)
  const [filaValidacaoExpandida, setFilaValidacaoExpandida] = useState(true);
  const [searchFilaValidacao, setSearchFilaValidacao] = useState('');
  const [paginaValidacao, setPaginaValidacao] = useState(1);
  const ITENS_POR_PAGINA_VALIDACAO = 6;

  // Limite de itens renderizados por coluna no Kanban (Prevenção de DOM freeze)
  const [limiteColuna, setLimiteColuna] = useState<Record<StatusAcao, number>>({
    'Aberto': 25,
    'Atrasado': 25,
    'Concluído': 25,
    'Validado': 25,
    'Revisar': 25
  });

  // Paginação na visualização em Tabela de Ações
  const [paginaTabelaAcoes, setPaginaTabelaAcoes] = useState(1);
  const ITENS_POR_PAGINA_TABELA_ACOES = 25;

  // Modais de Controle
  const [modalNovoPlanoOpen, setModalNovoPlanoOpen] = useState(false);
  const [modalNovaAcaoOpen, setModalNovaAcaoOpen] = useState(false);
  const [isEditingAcao, setIsEditingAcao] = useState(false);
  const [modalConcluirOpen, setModalConcluirOpen] = useState(false);
  const [modalValidarOpen, setModalValidarOpen] = useState(false);
  
  // Modal de Exclusão Auditada de Ação
  const [modalExcluirAcaoOpen, setModalExcluirAcaoOpen] = useState(false);
  const [motivoExclusaoAcao, setMotivoExclusaoAcao] = useState('');

  // Modal de Exclusão Auditada de Plano Completo
  const [modalExcluirPlanoOpen, setModalExcluirPlanoOpen] = useState(false);
  const [motivoExclusaoPlano, setMotivoExclusaoPlano] = useState('');

  // Modal de Ficha Técnica Completa da Ação (Detalhes dos 25 campos)
  const [modalDetalhesAcaoOpen, setModalDetalhesAcaoOpen] = useState(false);
  const [acaoDetalhesAtiva, setAcaoDetalhesAtiva] = useState<PlanoAcaoItem | null>(null);

  // Item ativo em operação rápida
  const [acaoAtiva, setAcaoAtiva] = useState<PlanoAcaoItem | null>(null);

  // Formulários
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

      // Se houver initialPlanoId, abre diretamente o plano
      if (initialPlanoId) {
        const found = planosData.find(p => String(p.id) === String(initialPlanoId) || String(p.id_rel1) === String(initialPlanoId));
        if (found) {
          setPlanoSelecionado(found);
        }
      }
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

  // Mapeamento em O(1) de Ações vinculadas a cada Plano mestre
  const acoesPorPlanoMap = useMemo(() => {
    const map = new Map<string, PlanoAcaoItem[]>();
    acoes.forEach(a => {
      // Vinculação primária por id_rel2 (ID do Plano)
      if (a.id_rel2) {
        const k = String(a.id_rel2).trim();
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(a);
      }
    });
    return map;
  }, [acoes]);

  // Função auxiliar para buscar todas as ações de um plano específico
  const getAcoesDoPlano = (plano: PlanoAcaoMestre): PlanoAcaoItem[] => {
    const byIdRel = acoesPorPlanoMap.get(String(plano.id).trim()) || [];
    if (byIdRel.length > 0) return byIdRel;

    // Fallback: se houver idprograma compartilhado (ex: 'Q - 795')
    if (plano.idprograma) {
      const progUpper = String(plano.idprograma).trim().toUpperCase();
      return acoes.filter(a => a.id_programa_acoes && String(a.id_programa_acoes).trim().toUpperCase() === progUpper);
    }
    return [];
  };

  // Calcula o status e estatísticas consolidadas de um Plano de Ação a partir de suas ações filhas
  const getEstatisticasPlano = (plano: PlanoAcaoMestre) => {
    const acoesDoPlano = getAcoesDoPlano(plano);
    let abertas = 0;
    let atrasadas = 0;
    let concluidas = 0;
    let validadas = 0;

    acoesDoPlano.forEach(a => {
      const st = getStatusDinamico(a);
      if (st === 'Aberto') abertas++;
      else if (st === 'Atrasado') atrasadas++;
      else if (st === 'Concluído') concluidas++;
      else if (st === 'Validado') validadas++;
    });

    const total = acoesDoPlano.length;
    let statusConsolidado = plano.status || 'Aberto';

    if (total > 0) {
      if (atrasadas > 0) statusConsolidado = 'Atrasado';
      else if (concluidas > 0) statusConsolidado = 'Concluído';
      else if (abertas > 0) statusConsolidado = 'Aberto';
      else if (validadas === total) statusConsolidado = 'Validado';
    }

    const taxaConclusao = total > 0 ? Math.round((validadas / total) * 100) : 0;

    return {
      total,
      abertas,
      atrasadas,
      concluidas,
      validadas,
      statusConsolidado,
      taxaConclusao
    };
  };

  // Contadores para KPIs corporativos de Planos Mestres
  const kpisPlanos = useMemo(() => {
    let abertos = 0;
    let atrasados = 0;
    let aguardando = 0;
    let validados = 0;

    planos.forEach(p => {
      const stats = getEstatisticasPlano(p);
      if (stats.statusConsolidado === 'Atrasado') atrasados++;
      else if (stats.statusConsolidado === 'Concluído') aguardando++;
      else if (stats.statusConsolidado === 'Validado') validados++;
      else abertos++;
    });

    return {
      total: planos.length,
      abertos,
      atrasados,
      aguardando,
      validados
    };
  }, [planos, acoesPorPlanoMap]);

  // Contadores para KPIs corporativos de Ações individuais
  const kpisAcoes = useMemo(() => {
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

  // Ações pendentes de validação técnica pela qualidade (Banner prioritário da visão geral)
  const todasAcoesPendentesValidacao = useMemo(() => {
    return acoes.filter(a => a.status === 'Concluído');
  }, [acoes]);

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

  const totalPaginasValidacao = Math.ceil(acoesValidacaoFiltradas.length / ITENS_POR_PAGINA_VALIDACAO) || 1;
  const acoesValidacaoExibidas = useMemo(() => {
    const inicio = (paginaValidacao - 1) * ITENS_POR_PAGINA_VALIDACAO;
    return acoesValidacaoFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA_VALIDACAO);
  }, [acoesValidacaoFiltradas, paginaValidacao]);

  // Filtro Inteligente de Planos Mestres
  const planosFiltrados = useMemo(() => {
    return planos.filter(plano => {
      // 1. Busca por texto
      if (searchPlanos) {
        const q = searchPlanos.toLowerCase();
        const idStr = String(plano.id);
        const indicador = (plano.indicador_programa_estrategico || '').toLowerCase();
        const setor = (plano.setor_ || '').toLowerCase();
        const posto = (plano.posto_ || '').toLowerCase();
        const prod = (plano.produto_ || '').toLowerCase();
        const resp = (plano.responsavel_abertura || '').toLowerCase();
        const desc = (plano.descricao_problema_oportunidade || '').toLowerCase();
        const prog = (plano.idprograma || '').toLowerCase();

        if (
          !idStr.includes(q) &&
          !indicador.includes(q) &&
          !setor.includes(q) &&
          !posto.includes(q) &&
          !prod.includes(q) &&
          !resp.includes(q) &&
          !desc.includes(q) &&
          !prog.includes(q)
        ) {
          return false;
        }
      }

      // 2. Filtro de Status Consolidado do Plano
      if (filtroStatusPlano !== 'Todos') {
        const stats = getEstatisticasPlano(plano);
        if (filtroStatusPlano === 'Atrasado' && stats.statusConsolidado !== 'Atrasado') return false;
        if (filtroStatusPlano === 'Concluído' && stats.statusConsolidado !== 'Concluído') return false;
        if (filtroStatusPlano === 'Validado' && stats.statusConsolidado !== 'Validado') return false;
        if (filtroStatusPlano === 'Aberto' && stats.statusConsolidado !== 'Aberto') return false;
      }

      // 3. Filtro de Prioridade
      if (filtroPrioridadePlano !== 'Todas' && plano.prioridade !== filtroPrioridadePlano) {
        return false;
      }

      return true;
    });
  }, [planos, searchPlanos, filtroStatusPlano, filtroPrioridadePlano, acoesPorPlanoMap]);

  // Paginação dos Planos
  const totalPaginasPlanos = Math.ceil(planosFiltrados.length / ITENS_POR_PAGINA_PLANOS) || 1;
  const planosExibidos = useMemo(() => {
    const inicio = (paginaPlanos - 1) * ITENS_POR_PAGINA_PLANOS;
    return planosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA_PLANOS);
  }, [planosFiltrados, paginaPlanos]);

  // Filtro de Ações Gerais (Visão Quadro Geral de Ações)
  const acoesGeraisFiltradas = useMemo(() => {
    const now = Date.now();
    const trintaDiasMs = 30 * 86400000;
    const noventaDiasMs = 90 * 86400000;
    const anoAtual = new Date().getFullYear();

    return acoes.filter(acao => {
      // 1. Filtro Temporal / Escopo
      if (escopoTemporal === 'ativas_recentes') {
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
      if (searchAcoes) {
        const q = searchAcoes.toLowerCase();
        const contra = (acao.contra_medida || '').toLowerCase();
        const causa = (acao.causa || '').toLowerCase();
        const resp = (acao.responsavel_acao || '').toLowerCase();
        const idStr = String(acao.id);
        const refProg = (acao.id_programa_acoes || '').toLowerCase();
        const relPlano = String(acao.id_rel2 || '').toLowerCase();
        if (!contra.includes(q) && !causa.includes(q) && !resp.includes(q) && !idStr.includes(q) && !refProg.includes(q) && !relPlano.includes(q)) {
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
  }, [acoes, escopoTemporal, searchAcoes, filtroMinhasAcoes, filtroTipoAcao, currentUser]);

  // Paginação na Tabela de Ações Gerais
  const totalPaginasTabelaAcoes = Math.ceil(acoesGeraisFiltradas.length / ITENS_POR_PAGINA_TABELA_ACOES) || 1;
  const acoesTabelaExibidas = useMemo(() => {
    const inicio = (paginaTabelaAcoes - 1) * ITENS_POR_PAGINA_TABELA_ACOES;
    return acoesGeraisFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA_TABELA_ACOES);
  }, [acoesGeraisFiltradas, paginaTabelaAcoes]);

  // Ações pertencentes ao Plano Ativo (Tela Única)
  const acoesDoPlanoAtivo = useMemo(() => {
    if (!planoSelecionado) return [];
    return getAcoesDoPlano(planoSelecionado);
  }, [planoSelecionado, acoes, acoesPorPlanoMap]);

  // Colunas do Kanban
  const kanbanColumns: { status: StatusAcao; label: string; color: string; badge: string }[] = [
    { status: 'Aberto', label: 'Aberto / Em Andamento', color: 'border-blue-200 bg-blue-50/20', badge: 'bg-blue-100 text-blue-800' },
    { status: 'Atrasado', label: 'Prazo Vencido (Atrasado)', color: 'border-rose-200 bg-rose-50/20', badge: 'bg-rose-100 text-rose-800' },
    { status: 'Concluído', label: 'Aguardando Validação', color: 'border-amber-200 bg-amber-50/20', badge: 'bg-amber-100 text-amber-800' },
    { status: 'Validado', label: 'Homologado / Eficaz', color: 'border-emerald-200 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-800' }
  ];

  // Helper para abrir Tela Única do Plano correspondente a uma ação
  const handleAbrirPlanoDaAcao = (acao: PlanoAcaoItem) => {
    let target = planos.find(p => String(p.id).trim() === String(acao.id_rel2 || '').trim());
    if (!target && acao.id_programa_acoes) {
      target = planos.find(p => p.idprograma && String(p.idprograma).trim().toUpperCase() === String(acao.id_programa_acoes).trim().toUpperCase());
    }

    if (target) {
      setPlanoSelecionado(target);
      setIsEditingPlanoHeader(false);
      setFormEditarPlano(target);
    } else {
      alert(`O Plano Mestre #${acao.id_rel2 || 'N/A'} não foi localizado na base.`);
    }
  };

  // Abrir Plano
  const handleAcessarPlano = (plano: PlanoAcaoMestre) => {
    setPlanoSelecionado(plano);
    setIsEditingPlanoHeader(false);
    setFormEditarPlano(plano);
  };

  // Criação de Plano Mestre
  const handleCreatePlano = async () => {
    if (!formNovoPlano.descricao_problema_oportunidade?.trim()) {
      alert('Informe a descrição do problema ou oportunidade.');
      return;
    }
    try {
      const created = await actionPlanService.createPlano({
        ...formNovoPlano,
        status: 'Aberto',
        responsavel_abertura: formNovoPlano.responsavel_abertura || currentUser.nome,
        data_abertura: new Date().toISOString()
      });
      setModalNovoPlanoOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Plano de Ação mestre criado com sucesso na lista Action plan!' });
      await loadData(true);
      if (created?.id) {
        setPlanoSelecionado({ ...formNovoPlano, id: created.id } as PlanoAcaoMestre);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Salvar Edição do Cabeçalho do Plano
  const handleSalvarEdicaoPlano = async () => {
    if (!planoSelecionado) return;
    try {
      await actionPlanService.updatePlano(planoSelecionado.id, formEditarPlano);
      setPlanoSelecionado(prev => prev ? ({ ...prev, ...formEditarPlano }) : null);
      setIsEditingPlanoHeader(false);
      setFeedbackMsg({ type: 'success', text: `Cabeçalho do Plano #${planoSelecionado.id} atualizado com sucesso!` });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Exclusão Auditada do Plano
  const handleConfirmExclusaoPlano = async () => {
    if (!planoSelecionado) return;
    if (!motivoExclusaoPlano.trim()) {
      alert('É obrigatório informar o motivo da exclusão para registro no log corporativo.');
      return;
    }
    try {
      await actionPlanService.deletePlano(planoSelecionado.id, motivoExclusaoPlano, currentUser.nome);
      setModalExcluirPlanoOpen(false);
      setMotivoExclusaoPlano('');
      setPlanoSelecionado(null);
      setFeedbackMsg({ type: 'success', text: `Plano #${planoSelecionado.id} e suas ações foram excluídos e auditados com sucesso!` });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Nova Ação
  const handleOpenNovaAcaoModal = (planoTarget?: PlanoAcaoMestre) => {
    const alvoPlano = planoTarget || planoSelecionado;
    setIsEditingAcao(false);
    setFormNovaAcao({
      causa: alvoPlano?.descricao_problema_oportunidade || '',
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
      id_rel2: alvoPlano?.id ? String(alvoPlano.id) : undefined,
      id_programa_acoes: alvoPlano?.idprograma || idprograma || ''
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
    if (!motivoExclusaoAcao.trim()) {
      alert('É obrigatório informar o motivo da exclusão para registro no log corporativo.');
      return;
    }
    try {
      await actionPlanService.deleteAcao(acaoAtiva.id, motivoExclusaoAcao, currentUser.nome);
      setModalExcluirAcaoOpen(false);
      setMotivoExclusaoAcao('');
      setFeedbackMsg({ type: 'success', text: `Ação #${acaoAtiva.id} excluída e auditada com sucesso!` });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ==========================================================================
  // RENDERIZAÇÃO: SE UM PLANO ESPECÍFICO ESTIVER SELECIONADO -> TELA ÚNICA
  // ==========================================================================
  if (planoSelecionado) {
    const statsPlano = getEstatisticasPlano(planoSelecionado);

    return (
      <div className="flex flex-col gap-5 w-full pb-16">
        
        {/* Barra Superior da Tela Única */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPlanoSelecionado(null);
                setIsEditingPlanoHeader(false);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Retornar ao Painel Principal de Planos"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>Voltar aos Planos</span>
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-600">Planos de Ação</span>
                <span>/</span>
                <span>Plano #{planoSelecionado.id}</span>
                {planoSelecionado.idprograma && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    Origem 8D: {planoSelecionado.idprograma}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                {planoSelecionado.indicador_programa_estrategico || 'Plano de Contramedidas'}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  statsPlano.statusConsolidado === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                  statsPlano.statusConsolidado === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                  statsPlano.statusConsolidado === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {statsPlano.statusConsolidado}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {planoSelecionado.idprograma && (
              <button
                type="button"
                onClick={() => onNavigate('gestao-8d', { id8d: planoSelecionado.idprograma })}
                className="btn-secondary !h-9 text-xs flex items-center gap-1.5"
                title="Abrir o Dossiê 8D desta ocorrência"
              >
                <Workflow className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver Dossiê 8D</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isEditingPlanoHeader) {
                  setIsEditingPlanoHeader(false);
                } else {
                  setFormEditarPlano(planoSelecionado);
                  setIsEditingPlanoHeader(true);
                }
              }}
              className={`!h-9 text-xs flex items-center gap-1.5 px-3 rounded-xl border font-semibold transition ${
                isEditingPlanoHeader ? 'bg-amber-50 text-amber-800 border-amber-300' : 'btn-secondary'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingPlanoHeader ? 'Cancelar Edição' : 'Editar Cabeçalho'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMotivoExclusaoPlano('');
                setModalExcluirPlanoOpen(true);
              }}
              className="!h-9 text-xs flex items-center gap-1.5 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold transition"
              title="Excluir este plano de ação completo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Plano</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenNovaAcaoModal(planoSelecionado)}
              className="btn-primary !h-9 text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Ação para este Plano</span>
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

        {/* CABEÇALHO MESTRE DO PLANO (Formactionplan do Power Apps) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  Cabeçalho Mestre do Plano de Ação
                </h2>
                <p className="text-xs text-slate-500">
                  Definição macro do desvio industrial, localização física e programa estratégico
                </p>
              </div>
            </div>

            {isEditingPlanoHeader && (
              <button
                type="button"
                onClick={handleSalvarEdicaoPlano}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            )}
          </div>

          {/* MODO VISUALIZAÇÃO OU MODO EDIÇÃO DO CABEÇALHO */}
          {isEditingPlanoHeader ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Indicador / Programa Estratégico</label>
                <input
                  type="text"
                  value={formEditarPlano.indicador_programa_estrategico || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, indicador_programa_estrategico: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sub Indicador 1</label>
                <input
                  type="text"
                  value={formEditarPlano.sub1 || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, sub1: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sub Indicador 2</label>
                <input
                  type="text"
                  value={formEditarPlano.sub2 || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, sub2: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Setor / Área Fabril</label>
                <input
                  type="text"
                  value={formEditarPlano.setor_ || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, setor_: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Posto de Trabalho</label>
                <input
                  type="text"
                  value={formEditarPlano.posto_ || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, posto_: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Produto / Peça</label>
                <input
                  type="text"
                  value={formEditarPlano.produto_ || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, produto_: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prioridade</label>
                <select
                  value={formEditarPlano.prioridade || 'Alta'}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, prioridade: e.target.value as PrioridadeAcao })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Responsável de Abertura</label>
                <input
                  type="text"
                  value={formEditarPlano.responsavel_abertura || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, responsavel_abertura: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status do Plano</label>
                <select
                  value={formEditarPlano.status || 'Aberto'}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, status: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Validado">Validado</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="font-semibold text-slate-700 block mb-1">Descrição do Problema / Oportunidade</label>
                <textarea
                  rows={3}
                  value={formEditarPlano.descricao_problema_oportunidade || ''}
                  onChange={e => setFormEditarPlano({ ...formEditarPlano, descricao_problema_oportunidade: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Setor / Posto</span>
                <p className="text-slate-900 font-bold mt-1 text-sm">{planoSelecionado.setor_ || 'N/A'}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{planoSelecionado.posto_ || 'Sem Posto'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Produto / Projeto</span>
                <p className="text-slate-900 font-bold mt-1 text-sm">{planoSelecionado.produto_ || 'N/A'}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Indicador: {planoSelecionado.indicador_programa_estrategico}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Abertura</span>
                <p className="text-slate-900 font-bold mt-1 truncate" title={planoSelecionado.responsavel_abertura}>
                  {planoSelecionado.responsavel_abertura || 'N/A'}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {planoSelecionado.data_abertura ? formatDateBR(planoSelecionado.data_abertura) : 'Data não informada'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Prioridade & Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      planoSelecionado.prioridade === 'Alta' ? 'bg-rose-100 text-rose-800' :
                      planoSelecionado.prioridade === 'Média' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {planoSelecionado.prioridade}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">{planoSelecionado.status || 'Aberto'}</span>
                  </div>
                </div>
                {planoSelecionado.idprograma && (
                  <span className="text-[10px] text-blue-700 font-semibold mt-1">
                    Vínculo 8D: {planoSelecionado.idprograma}
                  </span>
                )}
              </div>

              <div className="md:col-span-4 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                  Descrição do Problema / Oportunidade
                </span>
                <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
                  {planoSelecionado.descricao_problema_oportunidade || 'Nenhuma descrição detalhada informada.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* METRICAS E PROGRESSO DAS AÇÕES DESTE PLANO */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total de Ações</span>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1">{statsPlano.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Abertas / Em Curso</span>
            <p className="text-2xl font-bold font-display text-blue-600 mt-1">{statsPlano.abertas}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Prazo Vencido</span>
            <p className="text-2xl font-bold font-display text-rose-600 mt-1">{statsPlano.atrasadas}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Aguardando Validação</span>
            <p className="text-2xl font-bold font-display text-amber-600 mt-1">{statsPlano.concluidas}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Homologadas (Eficazes)</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              {statsPlano.validadas} <span className="text-xs text-slate-400 font-normal">({statsPlano.taxaConclusao}%)</span>
            </p>
          </div>
        </div>

        {/* LISTAGEM DAS AÇÕES VINCULADAS AO PLANO ATIVO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Contramedidas & Ações Vinculadas ({acoesDoPlanoAtivo.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Ações de contenção, corretivas e preventivas cadastradas para este plano
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewModeDetalheAcoes('cards')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewModeDetalheAcoes === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Detalhados</span>
              </button>
              <button
                type="button"
                onClick={() => setViewModeDetalheAcoes('table')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewModeDetalheAcoes === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </button>
            </div>
          </div>

          {acoesDoPlanoAtivo.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Nenhuma ação cadastrada para este plano</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Adicione contramedidas para investigar causas, sanar o problema e definir responsáveis e prazos.
              </p>
              <button
                type="button"
                onClick={() => handleOpenNovaAcaoModal(planoSelecionado)}
                className="mt-2 btn-primary !h-8 text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Primeira Ação</span>
              </button>
            </div>
          ) : viewModeDetalheAcoes === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acoesDoPlanoAtivo.map(acao => {
                const st = getStatusDinamico(acao);
                return (
                  <div
                    key={acao.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500">#{acao.id}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                            {acao.tipo_acao}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            st === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                            st === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                            st === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {st}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-3" title={acao.contra_medida}>
                        {acao.contra_medida}
                      </p>

                      {acao.causa && (
                        <p className="text-[11px] text-slate-500 mt-1.5 italic line-clamp-2">
                          <strong className="not-italic text-slate-600">Causa:</strong> {acao.causa}
                        </p>
                      )}

                      {/* Badges Técnicos */}
                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {acao.yokoten === 'SIM' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                            Yokoten
                          </span>
                        )}
                        {acao.poka_yoke === 'SIM' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                            Poka-Yoke
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Responsável:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={acao.responsavel_acao}>
                            {acao.responsavel_acao}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Prazo:</span>
                          <span className={`font-semibold ${st === 'Atrasado' ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                            {acao.data_planejada ? formatDateBR(acao.data_planejada) : 'Sem data'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoDetalhesAtiva(acao);
                            setModalDetalhesAcaoOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                          title="Ficha completa com os 25 campos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditAcaoModal(acao)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                          title="Editar contramedida"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAcaoAtiva(acao);
                            setMotivoExclusaoAcao('');
                            setModalExcluirAcaoOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Excluir ação com auditoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {st === 'Concluído' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAcaoAtiva(acao);
                              setFormValidacao({ comentarios_validacao: '', aprovado: true });
                              setModalValidarOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Validar</span>
                          </button>
                        ) : st !== 'Validado' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAcaoAtiva(acao);
                              setFormConclusao({
                                comentarios_evidencia: '',
                                data_conclusao: new Date().toISOString().split('T')[0],
                                anexos_evidencia: []
                              });
                              setModalConcluirOpen(true);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Concluir</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Auditado</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Contramedida & Causa</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-3">Prazo</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acoesDoPlanoAtivo.map(acao => {
                    const st = getStatusDinamico(acao);
                    return (
                      <tr key={acao.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-bold text-slate-500">#{acao.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{acao.tipo_acao}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 line-clamp-1">{acao.contra_medida}</p>
                          {acao.causa && <p className="text-[11px] text-slate-400 italic line-clamp-1">Causa: {acao.causa}</p>}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{acao.responsavel_acao}</td>
                        <td className="py-3 px-3">
                          <span className={st === 'Atrasado' ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {acao.data_planejada ? formatDateBR(acao.data_planejada) : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            st === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                            st === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                            st === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {st}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAcaoDetalhesAtiva(acao);
                                setModalDetalhesAcaoOpen(true);
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Ficha completa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {st === 'Concluído' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoAtiva(acao);
                                  setFormValidacao({ comentarios_validacao: '', aprovado: true });
                                  setModalValidarOpen(true);
                                }}
                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                              >
                                Validar
                              </button>
                            )}
                            {st !== 'Validado' && st !== 'Concluído' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoAtiva(acao);
                                  setFormConclusao({
                                    comentarios_evidencia: '',
                                    data_conclusao: new Date().toISOString().split('T')[0],
                                    anexos_evidencia: []
                                  });
                                  setModalConcluirOpen(true);
                                }}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                              >
                                Concluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAIS COMPARTILHADOS (definidos no final do componente) */}
        {renderModaisCompartilhados()}

      </div>
    );
  }

  // ==========================================================================
  // RENDERIZAÇÃO: DASHBOARD PRINCIPAL (PLANOS DE AÇÃO vs QUADRO GERAL DE AÇÕES)
  // ==========================================================================
  return (
    <div className="flex flex-col gap-5 w-full pb-16">
      
      {/* Top Banner & Header com Alternância de Abas Principais */}
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
            Controle mestre dos Planos de Ação e contramedidas com sincronização em tempo real com o SharePoint.
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
            className="btn-primary !h-9 text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Novo Cabeçalho de Plano</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNovaAcaoModal()}
            className="btn-secondary !h-9 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Ação</span>
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

      {/* SELETOR DE ABAS PRINCIPAIS: 'Planos de Ação' (Mestres) vs 'Quadro Geral de Ações' (Kanban) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setMainTab('planos')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            mainTab === 'planos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Gestão dos Planos ({planos.length.toLocaleString('pt-BR')})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('acoes_gerais')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            mainTab === 'acoes_gerais'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Quadro Geral de Ações ({acoes.length.toLocaleString('pt-BR')})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: GESTÃO DOS PLANOS DE AÇÃO (VISÃO PRINCIPAL MESTRE-DETALHE)      */}
      {/* ===================================================================== */}
      {mainTab === 'planos' && (
        <>
          {/* Cards de KPI de Planos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total de Planos</span>
              <p className="text-2xl font-bold font-display text-slate-900 mt-1">{kpisPlanos.total.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Abertos / Em Curso</span>
              <p className="text-2xl font-bold font-display text-blue-600 mt-1">{kpisPlanos.abertos.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Planos c/ Atraso</span>
              <p className="text-2xl font-bold font-display text-rose-600 mt-1">{kpisPlanos.atrasados.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Aguardando Validação</span>
              <p className="text-2xl font-bold font-display text-amber-600 mt-1">{kpisPlanos.aguardando.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Homologados</span>
              <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{kpisPlanos.validados.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Barra de Filtros de Planos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, indicador, produto, posto, setor, responsável..."
                  value={searchPlanos}
                  onChange={e => {
                    setSearchPlanos(e.target.value);
                    setPaginaPlanos(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={filtroStatusPlano}
                onChange={e => {
                  setFiltroStatusPlano(e.target.value);
                  setPaginaPlanos(1);
                }}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Aberto">Aberto / Em Curso</option>
                <option value="Atrasado">Com Ações Atrasadas</option>
                <option value="Concluído">Aguardando Validação</option>
                <option value="Validado">Validado / Homologado</option>
              </select>

              <select
                value={filtroPrioridadePlano}
                onChange={e => {
                  setFiltroPrioridadePlano(e.target.value);
                  setPaginaPlanos(1);
                }}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="Todas">Todas as Prioridades</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <button
                type="button"
                onClick={() => setViewModePlanos('cards')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewModePlanos === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards ({planosFiltrados.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewModePlanos('table')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewModePlanos === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </button>
            </div>
          </div>

          {/* GRID DE CARDS OU TABELA DE PLANOS */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Carregando planos de ação do SharePoint...</span>
            </div>
          ) : viewModePlanos === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {planosExibidos.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Nenhum plano de ação encontrado para os filtros selecionados.
                </div>
              ) : (
                planosExibidos.map(plano => {
                  const stats = getEstatisticasPlano(plano);
                  return (
                    <div
                      key={plano.id}
                      onClick={() => handleAcessarPlano(plano)}
                      className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-4 shadow-xs transition flex flex-col justify-between cursor-pointer group gap-3"
                    >
                      <div>
                        {/* Header do Card */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition">
                            Plano #{plano.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              plano.prioridade === 'Alta' ? 'bg-rose-100 text-rose-800' :
                              plano.prioridade === 'Média' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {plano.prioridade}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              stats.statusConsolidado === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                              stats.statusConsolidado === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                              stats.statusConsolidado === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {stats.statusConsolidado}
                            </span>
                          </div>
                        </div>

                        {/* Indicador Estratégico */}
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1 leading-snug">
                          {plano.indicador_programa_estrategico || 'Sem Indicador'}
                        </h3>

                        {/* Descrição do Problema */}
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed" title={plano.descricao_problema_oportunidade}>
                          {plano.descricao_problema_oportunidade || 'Sem descrição cadastrada.'}
                        </p>

                        {/* Localização Fabril */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Setor:</span>
                            <span className="font-medium text-slate-700 truncate max-w-[150px]">{plano.setor_ || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Posto / Produto:</span>
                            <span className="font-medium text-slate-700 truncate max-w-[150px]">
                              {plano.posto_ || plano.produto_ || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Abertura:</span>
                            <span className="text-slate-600 truncate max-w-[150px]" title={plano.responsavel_abertura}>
                              {plano.responsavel_abertura ? plano.responsavel_abertura.split(' ')[0] : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Vínculo 8D */}
                        {plano.idprograma && (
                          <div className="mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 inline-flex items-center gap-1">
                              <Workflow className="w-3 h-3" />
                              <span>8D: {plano.idprograma}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rodapé do Card: Progresso de Ações */}
                      <div className="pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>{stats.total} {stats.total === 1 ? 'Ação' : 'Ações'}</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {stats.taxaConclusao}% concluído
                          </span>
                        </div>

                        {/* Mini Barra de Progresso */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div style={{ width: `${stats.taxaConclusao}%` }} className="bg-emerald-500 h-full" />
                          {stats.concluidas > 0 && (
                            <div style={{ width: `${(stats.concluidas / (stats.total || 1)) * 100}%` }} className="bg-amber-400 h-full" />
                          )}
                          {stats.atrasadas > 0 && (
                            <div style={{ width: `${(stats.atrasadas / (stats.total || 1)) * 100}%` }} className="bg-rose-500 h-full" />
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                          <span>Acessar Plano & Ações</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                      <th className="py-3 px-3.5">ID</th>
                      <th className="py-3 px-3.5">Indicador Estratégico</th>
                      <th className="py-3 px-3.5">Setor / Posto</th>
                      <th className="py-3 px-3.5">Produto</th>
                      <th className="py-3 px-3.5">Prioridade</th>
                      <th className="py-3 px-3.5">Responsável Abertura</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Ações do Plano</th>
                      <th className="py-3 px-3.5 text-right">Acessar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {planosExibidos.map(plano => {
                      const stats = getEstatisticasPlano(plano);
                      return (
                        <tr 
                          key={plano.id} 
                          onClick={() => handleAcessarPlano(plano)}
                          className="hover:bg-blue-50/30 transition cursor-pointer"
                        >
                          <td className="py-3 px-3.5 font-bold text-slate-500">#{plano.id}</td>
                          <td className="py-3 px-3.5 font-bold text-slate-900 max-w-[200px] truncate" title={plano.indicador_programa_estrategico}>
                            {plano.indicador_programa_estrategico || '-'}
                            {plano.idprograma && (
                              <span className="block text-[10px] text-blue-600 font-semibold">8D: {plano.idprograma}</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700">
                            <div>{plano.setor_ || '-'}</div>
                            <div className="text-[10px] text-slate-400">{plano.posto_ || '-'}</div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 font-medium">{plano.produto_ || '-'}</td>
                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              plano.prioridade === 'Alta' ? 'bg-rose-100 text-rose-800' :
                              plano.prioridade === 'Média' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {plano.prioridade}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 truncate max-w-[150px]" title={plano.responsavel_abertura}>
                            {plano.responsavel_abertura || '-'}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              stats.statusConsolidado === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                              stats.statusConsolidado === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                              stats.statusConsolidado === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {stats.statusConsolidado}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-800">{stats.total}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({stats.validadas} validadas)</span>
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcessarPlano(plano);
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold text-xs rounded-lg transition"
                            >
                              Ver Plano →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paginação dos Planos */}
          {totalPaginasPlanos > 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">
                Exibindo <strong>{(paginaPlanos - 1) * ITENS_POR_PAGINA_PLANOS + 1}</strong> a <strong>{Math.min(paginaPlanos * ITENS_POR_PAGINA_PLANOS, planosFiltrados.length)}</strong> de <strong>{planosFiltrados.length}</strong> planos
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={paginaPlanos === 1}
                  onClick={() => setPaginaPlanos(1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  title="Primeira Página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={paginaPlanos === 1}
                  onClick={() => setPaginaPlanos(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold"
                >
                  Anterior
                </button>
                <span className="px-2 font-bold text-slate-800">
                  Página {paginaPlanos} de {totalPaginasPlanos}
                </span>
                <button
                  type="button"
                  disabled={paginaPlanos === totalPaginasPlanos}
                  onClick={() => setPaginaPlanos(p => Math.min(totalPaginasPlanos, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold"
                >
                  Próxima
                </button>
                <button
                  type="button"
                  disabled={paginaPlanos === totalPaginasPlanos}
                  onClick={() => setPaginaPlanos(totalPaginasPlanos)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  title="Última Página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: QUADRO GERAL DE AÇÕES (KANBAN CORPORATIVO + TABELA GERAL)        */}
      {/* ===================================================================== */}
      {mainTab === 'acoes_gerais' && (
        <>
          {/* Cards de KPI de Ações */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total de Ações</span>
              <p className="text-2xl font-bold font-display text-slate-900 mt-1">{kpisAcoes.total.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Abertas / Em Curso</span>
              <p className="text-2xl font-bold font-display text-blue-600 mt-1">{kpisAcoes.abertas.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Prazo Vencido</span>
              <p className="text-2xl font-bold font-display text-rose-600 mt-1">{kpisAcoes.atrasadas.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Aguardando Validação</span>
              <p className="text-2xl font-bold font-display text-amber-600 mt-1">{kpisAcoes.concluidas.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Homologadas</span>
              <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{kpisAcoes.validadas.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* BANNER PRIORITÁRIO OTIMIZADO: Fila de Validação Prioritária da Qualidade */}
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
                              <div className="flex items-center gap-1">
                                {acao.id_rel2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirPlanoDaAcao(acao)}
                                    className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold border border-slate-200"
                                    title="Abrir Plano Mestre deste item"
                                  >
                                    Plano #{acao.id_rel2}
                                  </button>
                                )}
                                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                                  Concluída
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug" title={acao.contra_medida}>
                              {acao.contra_medida}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1 truncate">
                              Resp: <strong>{acao.responsavel_acao}</strong>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleAbrirPlanoDaAcao(acao)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Ver Plano</span>
                            </button>

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
                        <span className="px-2 font-bold text-[11px]">
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

          {/* Barra de Filtros da Visão de Ações Gerais */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar contramedida, causa, responsável, ID, plano..."
                  value={searchAcoes}
                  onChange={e => {
                    setSearchAcoes(e.target.value);
                    setPaginaTabelaAcoes(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={escopoTemporal}
                onChange={e => {
                  setEscopoTemporal(e.target.value as any);
                  setPaginaTabelaAcoes(1);
                }}
                className="text-xs py-1.5 px-3 bg-blue-50/70 border border-blue-200 rounded-xl font-bold text-blue-900"
              >
                <option value="ativas_recentes">Ativas & Recentes (Padrão)</option>
                <option value="30d">Últimos 30 Dias</option>
                <option value="90d">Últimos 90 Dias</option>
                <option value="ano">Ano Atual</option>
                <option value="todas">Todas as Ações (Completo)</option>
              </select>

              <select
                value={filtroTipoAcao}
                onChange={e => {
                  setFiltroTipoAcao(e.target.value);
                  setPaginaTabelaAcoes(1);
                }}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="Todos">Todos os Tipos</option>
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
                    setPaginaTabelaAcoes(1);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Minhas Ações</span>
              </label>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <button
                type="button"
                onClick={() => setViewModeAcoes('kanban')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewModeAcoes === 'kanban' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewModeAcoes('table')}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewModeAcoes === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Tabela ({acoesGeraisFiltradas.length})</span>
              </button>
            </div>
          </div>

          {/* ÁREA KANBAN OU TABELA GERAL DE AÇÕES */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Carregando ações do SharePoint...</span>
            </div>
          ) : viewModeAcoes === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {kanbanColumns.map(col => {
                const acoesDaColuna = acoesGeraisFiltradas.filter(a => getStatusDinamico(a) === col.status);
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
                                  {acao.id_rel2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleAbrirPlanoDaAcao(acao)}
                                      className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold border border-slate-200 transition"
                                      title="Abrir a tela única do plano mestre correspondente"
                                    >
                                      Plano #{acao.id_rel2}
                                    </button>
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

                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {acao.yokoten === 'SIM' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                                    Yokoten
                                  </span>
                                )}
                                {acao.poka_yoke === 'SIM' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                    Poka-Yoke
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="truncate max-w-[120px] font-medium" title={acao.responsavel_acao}>
                                {acao.responsavel_acao}
                              </span>
                              <span className={`font-semibold ${col.status === 'Atrasado' ? 'text-rose-600 font-bold' : ''}`}>
                                {acao.data_planejada ? formatDateBR(acao.data_planejada) : '-'}
                              </span>
                            </div>

                            {/* Botões Operacionais e Botão de Acesso ao Plano Mestre */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirPlanoDaAcao(acao)}
                                  className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition flex items-center gap-1"
                                  title="Abrir tela única com cabeçalho do plano e todas as suas ações"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>Ver Plano</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAcaoDetalhesAtiva(acao);
                                    setModalDetalhesAcaoOpen(true);
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                  title="Ficha técnica completa"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                {col.status === 'Concluído' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAcaoAtiva(acao);
                                      setFormValidacao({ comentarios_validacao: '', aprovado: true });
                                      setModalValidarOpen(true);
                                    }}
                                    className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs transition"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Validar</span>
                                  </button>
                                ) : col.status !== 'Validado' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAcaoAtiva(acao);
                                      setFormConclusao({
                                        comentarios_evidencia: '',
                                        data_conclusao: new Date().toISOString().split('T')[0],
                                        anexos_evidencia: []
                                      });
                                      setModalConcluirOpen(true);
                                    }}
                                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs transition"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Concluir</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Auditado</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {temMais && (
                        <button
                          type="button"
                          onClick={() => setLimiteColuna(prev => ({ ...prev, [col.status]: limiteAtual + 25 }))}
                          className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1 shadow-xs mt-1"
                        >
                          <span>Carregar mais (+25)</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({acoesDaColuna.length - limiteAtual} restantes)
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                      <th className="py-3 px-3.5">ID</th>
                      <th className="py-3 px-3.5">Plano Mestre</th>
                      <th className="py-3 px-3.5">Tipo</th>
                      <th className="py-3 px-3.5">Contramedida & Causa</th>
                      <th className="py-3 px-3.5">Responsável</th>
                      <th className="py-3 px-3.5">Prazo</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {acoesTabelaExibidas.map(acao => {
                      const st = getStatusDinamico(acao);
                      return (
                        <tr key={acao.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3.5 font-bold text-slate-500">#{acao.id}</td>
                          <td className="py-3 px-3.5">
                            {acao.id_rel2 ? (
                              <button
                                type="button"
                                onClick={() => handleAbrirPlanoDaAcao(acao)}
                                className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                <Layers className="w-3 h-3 text-blue-500" />
                                <span>Plano #{acao.id_rel2}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 font-semibold text-slate-700">{acao.tipo_acao}</td>
                          <td className="py-3 px-3.5">
                            <p className="font-bold text-slate-900 line-clamp-1">{acao.contra_medida}</p>
                            {acao.causa && <p className="text-[11px] text-slate-400 italic line-clamp-1">Causa: {acao.causa}</p>}
                          </td>
                          <td className="py-3 px-3.5 font-medium text-slate-800">{acao.responsavel_acao}</td>
                          <td className="py-3 px-3.5">
                            <span className={st === 'Atrasado' ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                              {acao.data_planejada ? formatDateBR(acao.data_planejada) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              st === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                              st === 'Concluído' ? 'bg-amber-100 text-amber-800' :
                              st === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {st}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAbrirPlanoDaAcao(acao)}
                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded text-[11px] font-semibold transition flex items-center gap-1"
                                title="Abrir Tela Única do Plano"
                              >
                                <Layers className="w-3 h-3" />
                                <span>Plano</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setAcaoDetalhesAtiva(acao);
                                  setModalDetalhesAcaoOpen(true);
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-600"
                                title="Ver Ficha Completa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {st === 'Concluído' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAcaoAtiva(acao);
                                    setFormValidacao({ comentarios_validacao: '', aprovado: true });
                                    setModalValidarOpen(true);
                                  }}
                                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                                >
                                  Validar
                                </button>
                              )}
                              {st !== 'Validado' && st !== 'Concluído' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAcaoAtiva(acao);
                                    setFormConclusao({
                                      comentarios_evidencia: '',
                                      data_conclusao: new Date().toISOString().split('T')[0],
                                      anexos_evidencia: []
                                    });
                                    setModalConcluirOpen(true);
                                  }}
                                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                                >
                                  Concluir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação na Tabela Geral de Ações */}
              {totalPaginasTabelaAcoes > 1 && (
                <div className="bg-white border-t border-slate-200 p-3 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-500">
                    Exibindo <strong>{(paginaTabelaAcoes - 1) * ITENS_POR_PAGINA_TABELA_ACOES + 1}</strong> a <strong>{Math.min(paginaTabelaAcoes * ITENS_POR_PAGINA_TABELA_ACOES, acoesGeraisFiltradas.length)}</strong> de <strong>{acoesGeraisFiltradas.length}</strong> ações
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={paginaTabelaAcoes === 1}
                      onClick={() => setPaginaTabelaAcoes(1)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={paginaTabelaAcoes === 1}
                      onClick={() => setPaginaTabelaAcoes(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold"
                    >
                      Anterior
                    </button>
                    <span className="px-2 font-bold text-slate-800">
                      Página {paginaTabelaAcoes} de {totalPaginasTabelaAcoes}
                    </span>
                    <button
                      type="button"
                      disabled={paginaTabelaAcoes === totalPaginasTabelaAcoes}
                      onClick={() => setPaginaTabelaAcoes(p => Math.min(totalPaginasTabelaAcoes, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold"
                    >
                      Próxima
                    </button>
                    <button
                      type="button"
                      disabled={paginaTabelaAcoes === totalPaginasTabelaAcoes}
                      onClick={() => setPaginaTabelaAcoes(totalPaginasTabelaAcoes)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Renderiza todos os Modais Compartilhados */}
      {renderModaisCompartilhados()}

    </div>
  );

  // ==========================================================================
  // FUNÇÃO DE RENDERIZAÇÃO DOS MODAIS COMPARTILHADOS (25 CAMPOS, VALIDAÇÃO, ETC)
  // ==========================================================================
  function renderModaisCompartilhados() {
    return (
      <>
        {/* MODAL 1: Novo Plano Mestre ('Action plan') */}
        {modalNovoPlanoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Novo Cabeçalho de Plano de Ação</h3>
                    <p className="text-xs text-slate-500">Cadastro de registro mestre na lista SharePoint 'Action plan'</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalNovoPlanoOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Responsável pela Abertura *</label>
                  <input
                    type="text"
                    value={formNovoPlano.responsavel_abertura || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, responsavel_abertura: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vínculo com 8D / Programa Externo</label>
                  <input
                    type="text"
                    placeholder="Ex: Q - 6192, SA - 125..."
                    value={formNovoPlano.idprograma || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, idprograma: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Indicador / Programa Estratégico *</label>
                  <input
                    type="text"
                    value={formNovoPlano.indicador_programa_estrategico || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, indicador_programa_estrategico: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prioridade *</label>
                  <select
                    value={formNovoPlano.prioridade || 'Alta'}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, prioridade: e.target.value as PrioridadeAcao })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sub Indicador 1</label>
                  <input
                    type="text"
                    value={formNovoPlano.sub1 || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, sub1: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sub Indicador 2</label>
                  <input
                    type="text"
                    value={formNovoPlano.sub2 || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, sub2: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Setor / Área Fabril *</label>
                  <input
                    type="text"
                    value={formNovoPlano.setor_ || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, setor_: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Posto de Trabalho</label>
                  <input
                    type="text"
                    value={formNovoPlano.posto_ || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, posto_: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Produto / Código do Componente</label>
                  <input
                    type="text"
                    value={formNovoPlano.produto_ || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, produto_: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Descrição do Problema / Oportunidade *</label>
                  <textarea
                    rows={4}
                    value={formNovoPlano.descricao_problema_oportunidade || ''}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, descricao_problema_oportunidade: e.target.value })}
                    placeholder="Descreva o problema industrial, histórico da falha e objetivo da contenção/melhoria..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalNovoPlanoOpen(false)} className="btn-secondary !h-9 text-xs">
                  Cancelar
                </button>
                <button type="button" onClick={handleCreatePlano} className="btn-primary !h-9 text-xs shadow-xs">
                  Salvar e Abrir Plano
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Nova / Edição de Ação (Estrutura Completa dos 25 Campos) */}
        {modalNovaAcaoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      {isEditingAcao ? `Editar Ação #${acaoAtiva?.id}` : 'Nova Contramedida / Ação'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Formulário com todos os 25 campos mapeados e sincronização na lista 'Action plan_acoes'
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalNovaAcaoOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                {/* 1. Vínculo com Plano Mestre */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ID do Plano Mestre (id_rel2)</label>
                  <input
                    type="text"
                    value={formNovaAcao.id_rel2 || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, id_rel2: e.target.value })}
                    placeholder="ID do Plano Mestre..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                  />
                </div>

                {/* 2. Vínculo 8D */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ID do Programa (8D)</label>
                  <input
                    type="text"
                    value={formNovaAcao.id_programa_acoes || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, id_programa_acoes: e.target.value })}
                    placeholder="Ex: Q - 6192"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 3. Tipo de Ação */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Ação *</label>
                  <select
                    value={formNovaAcao.tipo_acao || 'CORRETIVA'}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, tipo_acao: e.target.value as TipoAcao })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="CONTENÇÃO">Contenção</option>
                    <option value="CORRETIVA">Corretiva</option>
                    <option value="PREVENTIVA">Preventiva</option>
                    <option value="MELHORIA">Melhoria</option>
                  </select>
                </div>

                {/* 4. Causa Raiz */}
                <div className="md:col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">Causa Raiz (Ishikawa / 5 Porquês) *</label>
                  <textarea
                    rows={2}
                    value={formNovaAcao.causa || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, causa: e.target.value })}
                    placeholder="Descreva a causa fundamental identificada para a qual a contramedida será aplicada..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 5. Contramedida / Ação */}
                <div className="md:col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">Contramedida a ser Adotada *</label>
                  <textarea
                    rows={3}
                    value={formNovaAcao.contra_medida || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, contra_medida: e.target.value })}
                    placeholder="Descreva a ação prática e contramedida com clareza operacional..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>

                {/* 6. Responsável */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Responsável da Ação *</label>
                  <input
                    type="text"
                    value={formNovaAcao.responsavel_acao || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, responsavel_acao: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 7. Email */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">E-mail do Responsável</label>
                  <input
                    type="email"
                    value={formNovaAcao.email || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 8. Email Supervisor */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">E-mail do Supervisor</label>
                  <input
                    type="email"
                    value={formNovaAcao.email_super || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, email_super: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 9. Data Planejada */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prazo Planejado (Data Final) *</label>
                  <input
                    type="date"
                    value={formNovaAcao.data_planejada || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, data_planejada: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 10. Data Acompanhamento */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data de Acompanhamento</label>
                  <input
                    type="date"
                    value={formNovaAcao.data_acompanhamento || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, data_acompanhamento: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* 11. Etapa 8D/7D */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Etapa de Origem</label>
                  <select
                    value={formNovaAcao.eight_d_seven_d || 'IT'}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, eight_d_seven_d: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="5D">5D - Contramedidas Permanentes</option>
                    <option value="6D">6D - Implementação & Validação</option>
                    <option value="7D">7D - Prevenção de Recorrência</option>
                    <option value="IT">IT - Ação Avulsa</option>
                  </select>
                </div>

                {/* Metadados de Engenharia */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Yokoten (Abrangência)?</label>
                  <select
                    value={formNovaAcao.yokoten || 'NÃO'}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, yokoten: e.target.value as any })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="NÃO">NÃO</option>
                    <option value="SIM">SIM</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Poka-Yoke (Dispositivo)?</label>
                  <select
                    value={formNovaAcao.poka_yoke || 'NÃO'}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, poka_yoke: e.target.value as any })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="NÃO">NÃO</option>
                    <option value="SIM">SIM</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Validação Qualidade?</label>
                  <select
                    value={formNovaAcao.validacao_acao || 'SIM'}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, validacao_acao: e.target.value as any })}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="SIM">SIM (Requer Parecer do Auditor)</option>
                    <option value="NÃO">NÃO (Homologação Automática)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">Comentários & Observações Adicionais</label>
                  <textarea
                    rows={2}
                    value={formNovaAcao.comentarios_observacoes || ''}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, comentarios_observacoes: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalNovaAcaoOpen(false)} className="btn-secondary !h-9 text-xs">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveAcao} className="btn-primary !h-9 text-xs shadow-xs">
                  {isEditingAcao ? 'Salvar Alterações' : 'Gravar Ação'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Concluir Ação (Evidências) */}
        {modalConcluirOpen && acaoAtiva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Conclusão de Ação</h3>
                    <p className="text-xs text-slate-500">Registro de evidência operacional da contramedida</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalConcluirOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Contramedida:</span>
                  <p className="text-slate-900 font-semibold mt-0.5">{acaoAtiva.contra_medida}</p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data Efetiva da Conclusão *</label>
                  <input
                    type="date"
                    value={formConclusao.data_conclusao}
                    onChange={e => setFormConclusao({ ...formConclusao, data_conclusao: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Comentários da Evidência Realizada {acaoAtiva.evidencia_obrigatoria === 'SIM' && '*'}
                  </label>
                  <textarea
                    rows={4}
                    value={formConclusao.comentarios_evidencia}
                    onChange={e => setFormConclusao({ ...formConclusao, comentarios_evidencia: e.target.value })}
                    placeholder="Descreva detalhadamente o que foi executado, resultados práticos e testes realizados..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalConcluirOpen(false)} className="btn-secondary !h-9 text-xs">
                  Cancelar
                </button>
                <button type="button" onClick={handleConcluirAcao} className="btn-primary !h-9 text-xs shadow-xs">
                  Confirmar Conclusão
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Validar Ação pela Qualidade */}
        {modalValidarOpen && acaoAtiva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Auditoria & Validação Técnica</h3>
                    <p className="text-xs text-slate-500">Parecer formal da Qualidade sobre a contramedida</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalValidarOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Contramedida:</span>
                  <p className="text-slate-900 font-semibold mt-0.5">{acaoAtiva.contra_medida}</p>
                </div>

                {acaoAtiva.comentarios_evidencia && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <span className="font-bold text-amber-900 block">Evidência submetida pelo Responsável:</span>
                    <p className="text-amber-950 mt-1 whitespace-pre-wrap">{acaoAtiva.comentarios_evidencia}</p>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Decisão Técnica da Qualidade *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormValidacao({ ...formValidacao, aprovado: true })}
                      className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                        formValidacao.aprovado ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validar (Aprovar)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormValidacao({ ...formValidacao, aprovado: false })}
                      className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                        !formValidacao.aprovado ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Solicitar Revisão</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parecer da Validação Técnica *</label>
                  <textarea
                    rows={4}
                    value={formValidacao.comentarios_validacao}
                    onChange={e => setFormValidacao({ ...formValidacao, comentarios_validacao: e.target.value })}
                    placeholder={formValidacao.aprovado 
                      ? "Ação homologada conforme especificado, ensaio aprovado sem desvios." 
                      : "Informe os motivos da rejeição técnica e o que o responsável precisa corrigir..."}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalValidarOpen(false)} className="btn-secondary !h-9 text-xs">
                  Cancelar
                </button>
                <button type="button" onClick={handleValidarAcao} className="btn-primary !h-9 text-xs shadow-xs">
                  Gravar Decisão da Qualidade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: Exclusão Auditada de Ação */}
        {modalExcluirAcaoOpen && acaoAtiva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Confirmar a exclusão da ação?</h3>
                  <p className="text-xs text-slate-500">Esta operação é irreversível e será registrada no log de auditoria.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
                <span className="font-bold text-slate-700 block">Ação #{acaoAtiva.id}:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{acaoAtiva.contra_medida}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Informe o motivo da exclusão: *</label>
                <textarea
                  rows={3}
                  value={motivoExclusaoAcao}
                  onChange={e => setMotivoExclusaoAcao(e.target.value)}
                  placeholder="Ex: Ação duplicada, cancelamento aprovado pela coordenação, etc."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalExcluirAcaoOpen(false);
                    setMotivoExclusaoAcao('');
                  }}
                  className="btn-secondary !h-9 text-xs"
                >
                  Não, Cancelar
                </button>
                <button
                  type="button"
                  disabled={!motivoExclusaoAcao.trim()}
                  onClick={handleConfirmExclusaoAcao}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Sim, Excluir Ação
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: Exclusão Auditada de Plano Completo */}
        {modalExcluirPlanoOpen && planoSelecionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Confirmar exclusão do plano completo?</h3>
                  <p className="text-xs text-slate-500">
                    O cabeçalho e todas as ações vinculadas serão removidos e auditados no SharePoint.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
                <span className="font-bold text-slate-700 block">Plano #{planoSelecionado.id}:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{planoSelecionado.indicador_programa_estrategico}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{planoSelecionado.descricao_problema_oportunidade}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Informe o motivo da exclusão: *</label>
                <textarea
                  rows={3}
                  value={motivoExclusaoPlano}
                  onChange={e => setMotivoExclusaoPlano(e.target.value)}
                  placeholder="Ex: Plano duplicado, evento cancelado pela gestão, etc."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalExcluirPlanoOpen(false);
                    setMotivoExclusaoPlano('');
                  }}
                  className="btn-secondary !h-9 text-xs"
                >
                  Não, Cancelar
                </button>
                <button
                  type="button"
                  disabled={!motivoExclusaoPlano.trim()}
                  onClick={handleConfirmExclusaoPlano}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Sim, Excluir Plano Completo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 7: Ficha Técnica Completa da Ação (Detalhes dos 25 Campos) */}
        {modalDetalhesAcaoOpen && acaoDetalhesAtiva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      Ficha da Ação #{acaoDetalhesAtiva.id}
                    </h3>
                    <p className="text-xs text-slate-500">Detalhamento dos 25 campos da contramedida</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalDetalhesAcaoOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 mt-4 text-xs">
                {/* Vínculo de Plano */}
                {acaoDetalhesAtiva.id_rel2 && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 block text-xs">Plano Mestre Vinculado</span>
                      <span className="text-[11px] text-blue-700">Esta contramedida pertence ao Plano #{acaoDetalhesAtiva.id_rel2}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalDetalhesAcaoOpen(false);
                        handleAbrirPlanoDaAcao(acaoDetalhesAtiva);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Abrir Tela do Plano</span>
                    </button>
                  </div>
                )}

                {/* Status e Tipo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                    <span className="text-xs font-bold text-slate-900">{getStatusDinamico(acaoDetalhesAtiva)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tipo</span>
                    <span className="text-xs font-bold text-slate-900">{acaoDetalhesAtiva.tipo_acao}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Prazo Final</span>
                    <span className="text-xs font-bold text-slate-900">
                      {acaoDetalhesAtiva.data_planejada ? formatDateBR(acaoDetalhesAtiva.data_planejada) : '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Acompanhamento</span>
                    <span className="text-xs font-bold text-slate-900">
                      {acaoDetalhesAtiva.data_acompanhamento ? formatDateBR(acaoDetalhesAtiva.data_acompanhamento) : '-'}
                    </span>
                  </div>
                </div>

                {/* Contramedida */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Contramedida</span>
                  <p className="text-slate-900 font-semibold text-xs leading-relaxed whitespace-pre-wrap">
                    {acaoDetalhesAtiva.contra_medida}
                  </p>
                </div>

                {/* Causa */}
                {acaoDetalhesAtiva.causa && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">Causa Raiz</span>
                    <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                      {acaoDetalhesAtiva.causa}
                    </p>
                  </div>
                )}

                {/* Responsabilidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Responsável</span>
                    <p className="font-bold text-slate-900 mt-0.5">{acaoDetalhesAtiva.responsavel_acao}</p>
                    {acaoDetalhesAtiva.email && <p className="text-slate-500 text-[11px]">{acaoDetalhesAtiva.email}</p>}
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Supervisor</span>
                    <p className="font-medium text-slate-800 mt-0.5">{acaoDetalhesAtiva.email_super || 'Não informado'}</p>
                  </div>
                </div>

                {/* Badges de Engenharia */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    acaoDetalhesAtiva.yokoten === 'SIM' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    Yokoten: {acaoDetalhesAtiva.yokoten || 'NÃO'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                    acaoDetalhesAtiva.poka_yoke === 'SIM' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    Poka-Yoke: {acaoDetalhesAtiva.poka_yoke || 'NÃO'}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                    Validação Qualidade: {acaoDetalhesAtiva.validacao_acao || 'SIM'}
                  </span>
                </div>

                {/* Evidência e Parecer */}
                {acaoDetalhesAtiva.comentarios_evidencia && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs">
                    <span className="font-bold text-blue-900 block mb-1">Evidência Operacional Submetida:</span>
                    <p className="text-slate-800 whitespace-pre-wrap">{acaoDetalhesAtiva.comentarios_evidencia}</p>
                    {acaoDetalhesAtiva.data_conclusao && (
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Concluído em: {formatDateBR(acaoDetalhesAtiva.data_conclusao)}
                      </span>
                    )}
                  </div>
                )}

                {acaoDetalhesAtiva.comentarios_validacao && (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-900 block mb-1">Parecer Formal da Qualidade:</span>
                    <p className="text-slate-800 whitespace-pre-wrap">{acaoDetalhesAtiva.comentarios_validacao}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalDetalhesAcaoOpen(false)}
                  className="btn-secondary !h-9 text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
};

export default PlanoAcaoView;
