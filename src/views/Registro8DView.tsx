import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Save, 
  X, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Car, 
  Wrench, 
  Camera, 
  ShieldCheck, 
  ShieldAlert,
  Upload,
  ChevronDown,
  Info,
  Check,
  AlertCircle,
  Trash2,
  Eye,
  Sparkles,
  Clock,
  User,
  Users,
  FileText,
  ChevronRight,
  ChevronUp,
  History,
  ExternalLink,
  Layers,
  Calendar,
  CalendarDays,
  Search,
  Plus
} from 'lucide-react';
import { RNCRecord, UsuarioQualidade, PecaCatalogo, TipoRNC } from '../types';
import { spStore } from '../services/sharepointService';
import { CLIENTES_LIST, DEFAULT_CLIENTE, getClientBadgeInfo } from '../constants/clientes';
import { MODOS_FALHA_LIST, IMPACTOS_CLIENTE_LIST, GRAVIDADE_LIST, ACOES_CONTENCAO_LIST } from '../constants/defeitos';
import { SearchableSelect } from '../components/SearchableSelect';
import { RncDetalhesModal } from '../components/RncDetalhesModal';
import { formatDateBR } from '../utils/date';

interface Registro8DViewProps {
  onNavigate: (screen: any, params?: any) => void;
  currentUser: UsuarioQualidade;
  rncId?: number;
  edicao?: boolean;
  fromScreen?: string;
}

// Determina o turno industrial de trabalho com base no horário local atual
export const getTurnoPorHorario = (): '1º Turno' | '2º Turno' | '3º Turno' => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  // 1º Turno: 06:00 (360 min) até 14:40 (880 min)
  // 2º Turno: 14:40 (880 min) até 23:15 (1395 min)
  // 3º Turno: 23:15 (1395 min) até 06:00 (360 min)
  if (minutes >= 360 && minutes < 880) {
    return '1º Turno';
  } else if (minutes >= 880 && minutes < 1395) {
    return '2º Turno';
  } else {
    return '3º Turno';
  }
};

export const Registro8DView: React.FC<Registro8DViewProps> = ({ 
  onNavigate, 
  currentUser,
  rncId,
  edicao = false,
  fromScreen
}) => {
  // Navegação de retorno inteligente e contextual
  const handleBack = () => {
    // 1. Se for uma nova ocorrência (não é edição), volta ao menu principal
    if (!edicao) {
      onNavigate('menu-2');
      return;
    }

    // 2. Se for edição:
    // Se veio da tela de detalhes ou se tem rncId (e não veio explicitamente da lista)
    if (fromScreen === 'detalhes-8d' || fromScreen === 'detalhes' || (rncId && fromScreen !== 'lista-8d')) {
      onNavigate('detalhes-8d', { rncId: rncId || form.id });
      return;
    }

    // Se veio do menu principal
    if (fromScreen === 'menu-2' || fromScreen === 'menu') {
      onNavigate('menu-2');
      return;
    }

    // Padrão para edição vinda da lista ou tabela
    onNavigate('lista-8d');
  };

  const [pecasCatalogo, setPecasCatalogo] = useState<PecaCatalogo[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewFoto, setPreviewFoto] = useState<{ url: string; titulo: string } | null>(null);
  const [qualidadeExpandida, setQualidadeExpandida] = useState<boolean>(edicao);
  const [mostrarHistorico, setMostrarHistorico] = useState<boolean>(false);
  const [rncVisualizarModal, setRncVisualizarModal] = useState<RNCRecord | null>(null);

  // Participantes do Atendimento (Card 9 - Foto 4)
  const [participantesSelecionados, setParticipantesSelecionados] = useState<string[]>([currentUser.nome]);
  const [buscaParticipante, setBuscaParticipante] = useState<string>('');
  const [dropdownParticipantesAberto, setDropdownParticipantesAberto] = useState<boolean>(false);
  const participantesRef = useRef<HTMLDivElement>(null);

  const fileInputNgRef = useRef<HTMLInputElement>(null);
  const fileInputOkRef = useRef<HTMLInputElement>(null);
  const fileInputAuxiliarRef = useRef<HTMLInputElement>(null);

  // Form State - Estritamente limpo na criação: campos que dependem de escolha iniciam vazios
  const [form, setForm] = useState<Partial<RNCRecord>>({
    tipoRnc: '' as any,
    status: 'Relatório Inicial',
    cliente: '',
    dataOcorrencia: new Date().toISOString().split('T')[0],
    dataOficializacao: new Date().toISOString().split('T')[0],
    codOcorrenciaCliente: '',
    impactoCliente: '',
    detalhamentoOcorrencia: '',
    classificacaoSetor: '',
    setorDeteccao: '',
    turno: getTurnoPorHorario(),
    produto: '',
    componente: '',
    finalComponente: 'Peça Final',
    quantidadeAfetada: '' as any,
    modoFalha: '',
    descricaoProblema: '',
    descricaoProblemaInterno: '',
    recomendacoesProvidencias: '',
    descricaoCompleta: '',
    caracteristicaSeguranca: 'Não',
    coProduto: 'Não',
    carryOver: 'Não',
    reincidente: 'NÃO',
    gravidade: 'Média',
    possivelDetectar: 'Sim',
    posto: '',
    fmds: '',
    acoesContencao: '',
    dataContencao: '',
    qtdInspecionada: 0,
    qtdSuspeita: 0,
    qtdBloqueada: 0,
    oQueFazer: '',
    comoFazer: '',
    porQueFazer: '',
    quemFara: '',
    quandoFara: '',
    ondeFara: '',
    documentoRastreabilidade: 'Não Informado',
    codigoRastreabilidade: '',
    dataInicioRastreabilidade: '',
    dataFimRastreabilidade: '',
    participantesAtendimento: currentUser.nome,
    abrir8D: 'Sim',
    protcliente: 'Não',
    detector: currentUser.nome,
    reDetector: currentUser.reAcesso,
    fotoPecaNg: '',
    fotoPecaOk: '',
    fotoAuxiliar: ''
  });

  // Fecha dropdown de participantes ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (participantesRef.current && !participantesRef.current.contains(e.target as Node)) {
        setDropdownParticipantesAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Carregamento de catálogo e dados iniciais
  useEffect(() => {
    const catalogo = spStore.getColPecasGeraisAA3();
    setPecasCatalogo(catalogo);

    if (edicao && rncId) {
      const existente = spStore.getRNCById(rncId);
      if (existente) {
        const detalhamento = existente.detalhamentoOcorrencia || existente.descricaoCompleta || existente.descricaoProblema || '';
        setForm({
          ...existente,
          detalhamentoOcorrencia: detalhamento,
          descricaoProblema: detalhamento,
          descricaoCompleta: detalhamento,
          descricaoProblemaInterno: existente.descricaoProblemaInterno || ''
        });
        setQualidadeExpandida(true);
        if (existente.participantesAtendimento) {
          const list = existente.participantesAtendimento.split(';').map(s => s.trim()).filter(Boolean);
          if (list.length > 0) {
            setParticipantesSelecionados(list);
          }
        } else if (existente.detector) {
          setParticipantesSelecionados([existente.detector]);
        }
      }
    } else {
      // Novo apontamento: 100% limpo! Somente data de hoje e turno automático pelo horário vêm preenchidos
      setParticipantesSelecionados([currentUser.nome]);
      setForm({
        tipoRnc: '' as any,
        status: 'Relatório Inicial',
        cliente: '',
        dataOcorrencia: new Date().toISOString().split('T')[0],
        dataOficializacao: new Date().toISOString().split('T')[0],
        codOcorrenciaCliente: '',
        impactoCliente: '',
        detalhamentoOcorrencia: '',
        classificacaoSetor: '',
        setorDeteccao: '',
        turno: getTurnoPorHorario(),
        produto: '',
        componente: '',
        finalComponente: 'Peça Final',
        quantidadeAfetada: '' as any,
        modoFalha: '',
        descricaoProblema: '',
        descricaoProblemaInterno: '',
        recomendacoesProvidencias: '',
        descricaoCompleta: '',
        caracteristicaSeguranca: 'Não',
        coProduto: 'Não',
        carryOver: 'Não',
        reincidente: 'NÃO',
        gravidade: 'Média',
        possivelDetectar: 'Sim',
        posto: '',
        fmds: '',
        acoesContencao: '',
        dataContencao: '',
        qtdInspecionada: 0,
        qtdSuspeita: 0,
        qtdBloqueada: 0,
        oQueFazer: '',
        comoFazer: '',
        porQueFazer: '',
        quemFara: '',
        quandoFara: '',
        ondeFara: '',
        documentoRastreabilidade: 'Não Informado',
        codigoRastreabilidade: '',
        dataInicioRastreabilidade: '',
        dataFimRastreabilidade: '',
        participantesAtendimento: currentUser.nome,
        abrir8D: 'Sim',
        protcliente: 'Não',
        detector: currentUser.nome,
        reDetector: currentUser.reAcesso,
        fotoPecaNg: '',
        fotoPecaOk: '',
        fotoAuxiliar: ''
      });
    }
  }, [edicao, rncId, currentUser]);

  const baseAtivos = useMemo(() => spStore.getBaseAtivos(), []);

  const colaboradoresFiltrados = useMemo(() => {
    if (!buscaParticipante.trim()) return baseAtivos;
    const term = buscaParticipante.toLowerCase();
    return baseAtivos.filter(c => 
      c.nome.toLowerCase().includes(term) ||
      c.unidadeOrg.toLowerCase().includes(term) ||
      c.posicao.toLowerCase().includes(term) ||
      String(c.numPessoal).includes(term)
    );
  }, [baseAtivos, buscaParticipante]);

  const toggleParticipante = (nome: string) => {
    setParticipantesSelecionados(prev => {
      const updated = prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome];
      setForm(f => ({ ...f, participantesAtendimento: updated.join('; ') }));
      return updated;
    });
  };

  const removerParticipante = (nome: string) => {
    setParticipantesSelecionados(prev => {
      const updated = prev.filter(n => n !== nome);
      setForm(f => ({ ...f, participantesAtendimento: updated.join('; ') }));
      return updated;
    });
  };

  const produtosDoCliente = useMemo(() => {
    if (!form.cliente) return [];
    return spStore.getProdutosPorCliente(form.cliente);
  }, [form.cliente]);

  const componentesDoProduto = useMemo(() => {
    if (!form.produto) return [];
    return spStore.getComponentesPorProduto(form.produto);
  }, [form.produto]);

  // Todos os componentes do catálogo (usado para Componente Isolado e SubComponente + Componente)
  const todosComponentesCatalogo = useMemo(() => {
    return spStore.getColPecasGeraisAA3().filter(p => p.componente || p.descricao);
  }, []);

  // Ocorrências anteriores para esta peça/componente (para listar histórico geral de defeitos da peça)
  const ocorrenciasAnterioresPeca = useMemo(() => {
    if (!form.produto && !form.componente) return [];
    const todas = spStore.getRNCs();
    const prod9 = form.produto ? form.produto.trim().substring(0, 9).toLowerCase() : '';
    const comp9 = form.componente ? form.componente.trim().substring(0, 9).toLowerCase() : '';
    
    return todas.filter(r => {
      if (rncId && r.id === rncId) return false;
      const rProd = (r.produto || '').trim().substring(0, 9).toLowerCase();
      const rComp = (r.componente || '').trim().substring(0, 9).toLowerCase();
      const matchProd = prod9 && rProd && prod9 === rProd;
      const matchComp = comp9 && rComp && comp9 === rComp;
      return matchProd || matchComp;
    });
  }, [form.produto, form.componente, rncId]);

  // Apuração de quais defeitos já ocorreram anteriormente nesta peça no passado
  const defeitosHistoricoPeca = useMemo(() => {
    const mapDefeitos = new Map<string, number>();
    ocorrenciasAnterioresPeca.forEach(r => {
      const def = r.modoFalha || r.classificacaoSetor || 'Modo não especificado';
      mapDefeitos.set(def, (mapDefeitos.get(def) || 0) + 1);
    });
    return Array.from(mapDefeitos.entries()).map(([defeito, count]) => ({ defeito, count }));
  }, [ocorrenciasAnterioresPeca]);

  // Histórico de reincidências: exige estritamente o MESMO DEFEITO (modoFalha) E a MESMA PEÇA/COMPONENTE (Left 9)
  const historicoReincidencias = useMemo(() => {
    if (!form.modoFalha || !form.modoFalha.trim()) return [];
    if (!form.produto && !form.componente) return [];
    return spStore.getHistoricoReincidencias(form.produto, form.modoFalha, rncId, form.componente);
  }, [form.produto, form.componente, form.modoFalha, rncId]);

  // Histórico ordenado estritamente da mais recente para a mais antiga
  const historicoReincidenciasOrdenado = useMemo(() => {
    return [...historicoReincidencias].sort((a, b) => {
      const dateA = a.dataOcorrencia || '';
      const dateB = b.dataOcorrencia || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.id || 0) - (a.id || 0);
    });
  }, [historicoReincidencias]);

  // Reatividade automática da reincidência conforme o defeito e peça são preenchidos
  useEffect(() => {
    if (form.modoFalha && (form.produto || form.componente)) {
      const reincList = spStore.getHistoricoReincidencias(form.produto, form.modoFalha, rncId, form.componente);
      const isReinc = reincList.length > 0 ? 'SIM' : 'NÃO';
      setForm(prev => prev.reincidente === isReinc ? prev : { ...prev, reincidente: isReinc });
    } else {
      setForm(prev => prev.reincidente === 'NÃO' ? prev : { ...prev, reincidente: 'NÃO' });
    }
  }, [form.modoFalha, form.produto, form.componente, rncId]);

  const postosDisponiveis = useMemo(() => spStore.getDistinctPostos(), []);
  const fmdsDisponiveis = useMemo(() => spStore.getDistinctFMDS(), []);

  // Opções para SearchableSelect de Clientes (Montadoras)
  const optionsClientes = useMemo(() => {
    return CLIENTES_LIST.map(cli => ({
      value: cli,
      label: cli,
      badge: getClientBadgeInfo(cli).code
    }));
  }, []);

  // Opções para SearchableSelect de Produto / Conjunto (Catálogo de Peças)
  const optionsProduto = useMemo(() => {
    const list = form.finalComponente === 'SubComponente + Componente' 
      ? todosComponentesCatalogo 
      : produtosDoCliente;
    const opts = list.map(p => ({
      value: p.codCliText || p.material,
      label: `${p.codCliText ? `${p.codCliText} - ` : ''}${p.descricao || p.componente || ''}`,
      sublabel: `SAP: ${p.material} • Posto: ${p.posto || 'N/A'} • FMDS: ${p.fmds || 'N/A'}`,
      badge: p.cliente || undefined
    }));
    if (form.produto && !opts.some(o => o.value.toLowerCase() === form.produto!.toLowerCase())) {
      opts.unshift({
        value: form.produto,
        label: form.produto,
        sublabel: 'Produto gravado nesta ocorrência',
        badge: undefined
      });
    }
    return opts;
  }, [form.finalComponente, form.produto, todosComponentesCatalogo, produtosDoCliente]);

  // Opções para SearchableSelect de Componente (Peças Filhas ou Catálogo Geral)
  const optionsComponente = useMemo(() => {
    if (form.finalComponente === 'Peça Final') return [];
    const list = (form.finalComponente === 'Componente' || form.finalComponente === 'SubComponente + Componente')
      ? todosComponentesCatalogo
      : componentesDoProduto;

    const opts: { value: string; label: string; sublabel?: string; badge?: string }[] = [];
    const seen = new Set<string>();

    list.forEach(c => {
      // Prioriza c.componente (ex: L17922EB6) se existir
      const val = c.componente || c.descricao || c.codCliText || c.material;
      if (val && !seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase());
        const displayLabel = c.componente && c.descricao && c.componente !== c.descricao
          ? `${c.componente} - ${c.descricao}`
          : (c.codCliText ? `${c.codCliText} - ` : '') + (c.descricao || c.componente || c.material);
        opts.push({
          value: val,
          label: displayLabel,
          sublabel: `SAP: ${c.material} • Nível: ${c.nestingLevel ?? 1}`,
          badge: c.cliente || undefined
        });
      }
    });

    // Se a ocorrência já possui um componente gravado (ex: RNC-6146 com "L17922EB6"):
    if (form.componente) {
      const alreadyHas = opts.some(o => 
        o.value.toLowerCase() === form.componente!.toLowerCase() ||
        o.label.toLowerCase() === form.componente!.toLowerCase()
      );
      if (!alreadyHas) {
        const found = todosComponentesCatalogo.find(p => 
          (p.componente && p.componente.toLowerCase() === form.componente!.toLowerCase()) ||
          (p.material && p.material.toLowerCase() === form.componente!.toLowerCase()) ||
          (p.descricao && p.descricao.toLowerCase() === form.componente!.toLowerCase()) ||
          (p.codCliText && p.codCliText.toLowerCase().includes(form.componente!.toLowerCase()))
        );
        if (found) {
          opts.unshift({
            value: form.componente,
            label: `${found.componente || form.componente} - ${found.descricao || ''}`,
            sublabel: `SAP: ${found.material} • Catálogo Geral`,
            badge: found.cliente || undefined
          });
        } else {
          opts.unshift({
            value: form.componente,
            label: form.componente,
            sublabel: 'Componente gravado nesta ocorrência'
          });
        }
      }
    }

    return opts;
  }, [form.finalComponente, form.componente, todosComponentesCatalogo, componentesDoProduto]);

  // Opções para SearchableSelect de Modos de Falha Padronizados (SharePoint field_12)
  const optionsModosFalha = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = MODOS_FALHA_LIST.map(m => ({
      value: m,
      label: m
    }));
    if (form.modoFalha && !opts.some(o => o.value.toLowerCase() === form.modoFalha!.toLowerCase())) {
      opts.unshift({
        value: form.modoFalha,
        label: form.modoFalha
      });
    }
    return opts;
  }, [form.modoFalha]);

  // Opções para SearchableSelect de Equipe Responsável pelo 8D (Foto 4)
  const optionsEquipe8D = useMemo(() => {
    const list = baseAtivos.map(c => ({
      value: c.nome,
      label: c.nome,
      sublabel: `RE: ${c.numPessoal} • ${c.posicao}`
    }));
    if (form.quemFara && !list.some(o => o.value.toLowerCase() === form.quemFara!.toLowerCase())) {
      list.unshift({
        value: form.quemFara,
        label: form.quemFara,
        sublabel: 'Responsável selecionado'
      });
    }
    return list;
  }, [baseAtivos, form.quemFara]);

  // Opções para SearchableSelect de Abrir 8D (Foto 4)
  const optionsAbrir8D = useMemo(() => [
    { value: 'Sim', label: 'Sim' },
    { value: 'Não', label: 'Não' }
  ], []);

  // Opções para SearchableSelect de Postos de Trabalho
  const optionsPostos = useMemo(() => {
    const set = new Set(postosDisponiveis);
    if (form.posto) set.add(form.posto);
    return Array.from(set).map(p => ({
      value: p,
      label: p
    }));
  }, [postosDisponiveis, form.posto]);

  // Opções para SearchableSelect de FMDS
  const optionsFMDS = useMemo(() => {
    const set = new Set(fmdsDisponiveis);
    if (form.fmds) set.add(form.fmds);
    return Array.from(set).map(f => ({
      value: f,
      label: f
    }));
  }, [fmdsDisponiveis, form.fmds]);

  // Opções para SearchableSelect de Tipo de Ocorrência
  const optionsTipoRnc = useMemo(() => [
    { value: 'Formal', label: 'Formal (Reclamação Oficial do Cliente)', badge: 'Oficial' },
    { value: 'Informal', label: 'Informal (Alerta / Contato da Montadora)', badge: 'Alerta' },
    { value: 'Interno', label: 'Interno (Detecção Interna na Linha de Produção)', badge: 'Linha' },
  ], []);

  // Opções para SearchableSelect de Turno
  const optionsTurno = useMemo(() => [
    { value: '1º Turno', label: '1º Turno (06:00 - 14:40)' },
    { value: '2º Turno', label: '2º Turno (14:40 - 23:15)' },
    { value: '3º Turno', label: '3º Turno (23:15 - 06:00)' },
    { value: 'Central', label: 'Turno Central / Administrativo' },
  ], []);

  // Opções para SearchableSelect de Tipo de Componente / Peça Rastreada
  const optionsTipoComponente = useMemo(() => [
    { value: 'Peça Final', label: 'Produto Final / Peça Final (Conjunto Completo)' },
    { value: 'Peça Final + Componente', label: 'Peça Final + Componente' },
    { value: 'Componente', label: 'Componente Isolado' },
    { value: 'SubComponente + Componente', label: 'SubComponente + Componente' },
  ], []);

  // Opções para SearchableSelect de Impactos no Cliente
  const optionsImpactosCliente = useMemo(() => {
    return IMPACTOS_CLIENTE_LIST.map(imp => ({
      value: imp,
      label: imp
    }));
  }, []);

  // Opções para SearchableSelect de Documento para Rastreabilidade
  const optionsDocumentoRastreabilidade = useMemo(() => [
    { value: 'Não Informado', label: 'Não Informado' },
    { value: 'Etiqueta SAP', label: 'Etiqueta SAP' },
    { value: 'Order Cliente', label: 'Order Cliente' },
    { value: 'NF', label: 'NF' },
  ], []);

  // Opções para SearchableSelect de Gravidade
  const optionsGravidade = useMemo(() => {
    return GRAVIDADE_LIST.map(g => ({
      value: g,
      label: g
    }));
  }, []);

  // Opções para SearchableSelect de Detecção na Origem
  const optionsPossivelDetectar = useMemo(() => [
    { value: 'Sim', label: 'Sim (Falha de Inspeção / Padrão)' },
    { value: 'Não', label: 'Não (Defeito Latente / Oculto)' },
  ], []);

  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      if (!prev[fieldName]) return prev;
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  // Regra ProEPS: Troca de Cliente apenas disponibiliza a lista de peças daquele cliente.
  const handleClienteChange = (novoCliente: string) => {
    clearFieldError('cliente');
    clearFieldError('produto');
    clearFieldError('componente');
    setForm(prev => ({
      ...prev,
      cliente: novoCliente,
      produto: '',
      componente: '',
      posto: '',
      fmds: '',
      classificacaoSetor: '',
      carryOver: 'Não',
      coProduto: 'Não',
      caracteristicaSeguranca: 'Não',
      reincidente: 'NÃO'
    }));
  };

  // Regra ProEPS: Troca do Tipo de Componente
  const handleTipoComponenteChange = (novoTipo: 'Peça Final' | 'Componente' | 'Peça Final + Componente' | 'SubComponente + Componente') => {
    clearFieldError('produto');
    clearFieldError('componente');
    setForm(prev => {
      let novoComponente = prev.componente;
      let novoProduto = prev.produto;

      if (novoTipo === 'Peça Final') {
        const peca = pecasCatalogo.find(p => p.codCliText === prev.produto || p.material === prev.produto);
        novoComponente = peca?.descricao || peca?.componente || prev.componente;
      } else if (novoTipo === 'Componente') {
        novoProduto = '';
      }

      return {
        ...prev,
        finalComponente: novoTipo,
        produto: novoProduto,
        componente: novoComponente
      };
    });
  };

  // Regra ProEPS: Somente quando o usuário escolhe a peça é que os dados associados são preenchidos automaticamente!
  const handlePecaChange = (codCliTextOuMaterial: string) => {
    clearFieldError('produto');
    if (!codCliTextOuMaterial) {
      setForm(prev => ({
        ...prev,
        produto: '',
        componente: '',
        posto: '',
        fmds: '',
        classificacaoSetor: '',
        carryOver: 'Não',
        coProduto: 'Não',
        caracteristicaSeguranca: 'Não',
        reincidente: 'NÃO'
      }));
      return;
    }

    const selecionada = pecasCatalogo.find(
      p => p.codCliText === codCliTextOuMaterial || p.material === codCliTextOuMaterial
    );

    if (selecionada) {
      const prodKey = selecionada.codCliText || selecionada.material;
      const compDesc = selecionada.descricao || selecionada.componente || '';
      
      const reincList = spStore.getHistoricoReincidencias(prodKey, form.modoFalha, rncId, compDesc);
      const isReinc = reincList.length > 0 ? 'SIM' : 'NÃO';

      setForm(prev => ({
        ...prev,
        produto: prodKey,
        componente: (prev.finalComponente === 'Peça Final' || !prev.componente) 
          ? compDesc 
          : prev.componente,
        posto: selecionada.posto || prev.posto,
        fmds: selecionada.fmds || prev.fmds,
        classificacaoSetor: selecionada.fmds || prev.classificacaoSetor,
        carryOver: selecionada.carryOver === 'Sim' ? 'Sim' : 'Não',
        coProduto: selecionada.coProduto === 'Sim' ? 'Sim' : 'Não',
        caracteristicaSeguranca: selecionada.caracteristicaSeguranca === 'Sim' ? 'Sim' : 'Não',
        reincidente: isReinc
      }));
    }
  };

  // Regra ProEPS: Troca do Componente Específico
  const handleComponenteChange = (novoComponente: string) => {
    clearFieldError('componente');
    if (!novoComponente) {
      setForm(prev => ({ ...prev, componente: '' }));
      return;
    }

    const compObj = pecasCatalogo.find(
      p => p.componente === novoComponente || p.descricao === novoComponente || p.codCliText === novoComponente
    );

    setForm(prev => ({
      ...prev,
      componente: novoComponente,
      posto: compObj?.posto || prev.posto,
      fmds: compObj?.fmds || prev.fmds,
      classificacaoSetor: compObj?.fmds || prev.classificacaoSetor,
      carryOver: compObj?.carryOver === 'Sim' ? 'Sim' : prev.carryOver,
      coProduto: compObj?.coProduto === 'Sim' ? 'Sim' : prev.coProduto,
      caracteristicaSeguranca: compObj?.caracteristicaSeguranca === 'Sim' ? 'Sim' : prev.caracteristicaSeguranca
    }));
  };

  // Upload de Evidências Fotográficas
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'fotoPecaNg' | 'fotoPecaOk' | 'fotoAuxiliar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'A imagem deve ter no máximo 10MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm(prev => ({ ...prev, [field]: base64 }));
      setNotification({ type: 'success', message: 'Evidência fotográfica anexada com sucesso!' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = (field: 'fotoPecaNg' | 'fotoPecaOk' | 'fotoAuxiliar') => {
    setForm(prev => ({ ...prev, [field]: '' }));
  };

  // Validação estrita baseada nas regras do Power Apps
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.cliente || !form.cliente.trim()) {
      newErrors.cliente = 'Selecione o Cliente / Montadora.';
    }
    if (!form.tipoRnc) {
      newErrors.tipoRnc = 'Selecione o Tipo de Ocorrência (Formal, Informal ou Interno).';
    }
    if (form.tipoRnc === 'Interno' && (!form.setorDeteccao || !form.setorDeteccao.trim())) {
      newErrors.setorDeteccao = 'Informe o Setor de Detecção (Chão de Fábrica).';
    }
    if (!form.dataOcorrencia || !form.dataOcorrencia.trim()) {
      newErrors.dataOcorrencia = 'Informe a data da ocorrência.';
    }

    const isComponenteIsolado = form.finalComponente === 'Componente';
    if (!isComponenteIsolado && (!form.produto || !form.produto.trim())) {
      newErrors.produto = 'Selecione o Produto / Conjunto da ocorrência.';
    }
    if ((isComponenteIsolado || form.finalComponente === 'Peça Final + Componente' || form.finalComponente === 'SubComponente + Componente') && (!form.componente || !form.componente.trim())) {
      newErrors.componente = 'Selecione o Componente da ocorrência.';
    }

    if (!form.modoFalha || !form.modoFalha.trim()) {
      newErrors.modoFalha = 'Selecione a classificação do defeito (modo de falha).';
    }
    if (!form.descricaoProblema || form.descricaoProblema.trim().length < 3) {
      newErrors.descricaoProblema = 'Informe o detalhamento técnico da não conformidade.';
    }
    if (form.quantidadeAfetada === undefined || form.quantidadeAfetada === null || String(form.quantidadeAfetada).trim() === '' || Number(form.quantidadeAfetada) <= 0) {
      newErrors.quantidadeAfetada = 'Informe a quantidade de peças afetadas (maior que zero).';
    }

    // Validação de rastreabilidade conforme Foto 5
    if (form.documentoRastreabilidade === 'Não Informado') {
      if (!form.dataInicioRastreabilidade) {
        newErrors.dataInicioRastreabilidade = 'Informe a Data Inicial para rastreabilidade de lote.';
      }
      if (!form.dataFimRastreabilidade) {
        newErrors.dataFimRastreabilidade = 'Informe a Data Final para rastreabilidade de lote.';
      }
    } else if (form.documentoRastreabilidade) {
      if (!form.codigoRastreabilidade || !form.codigoRastreabilidade.trim()) {
        newErrors.codigoRastreabilidade = `Informe o código ou número do documento (${form.documentoRastreabilidade}).`;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      setNotification({
        type: 'error',
        message: firstError || 'Preencha todos os campos obrigatórios do Relatório Inicial.'
      });
      return false;
    }

    return true;
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    try {
      const participantesStr = participantesSelecionados.length > 0 
        ? participantesSelecionados.join('; ') 
        : currentUser.nome;

      const detalhamentoFinal = form.detalhamentoOcorrencia || form.descricaoProblema || form.descricaoCompleta || '';
      const descInternaFinal = form.descricaoProblemaInterno || '';

      if (edicao && rncId) {
        spStore.updateRNC(rncId, {
          ...form,
          detalhamentoOcorrencia: detalhamentoFinal,
          descricaoProblema: detalhamentoFinal,
          descricaoCompleta: detalhamentoFinal,
          descricaoProblemaInterno: descInternaFinal,
          participantesAtendimento: participantesStr
        });
        setNotification({ type: 'success', message: `Ocorrência RNC #${rncId} atualizada com sucesso!` });
      } else {
        const payload: Omit<RNCRecord, 'id'> = {
          title: '',
          tipoRnc: form.tipoRnc || 'Formal',
          status: 'Relatório Inicial',
          cliente: form.cliente || DEFAULT_CLIENTE,
          dataOcorrencia: form.dataOcorrencia || new Date().toISOString().split('T')[0],
          dataOficializacao: form.dataOficializacao || new Date().toISOString().split('T')[0],
          codOcorrenciaCliente: form.codOcorrenciaCliente || '',
          impactoCliente: form.impactoCliente || '',
          detalhamentoOcorrencia: detalhamentoFinal,
          classificacaoSetor: form.classificacaoSetor || form.fmds || 'SOLDA 2 - CEL. TOYOTA',
          setorDeteccao: form.setorDeteccao || 'Chão de Fábrica',
          turno: form.turno || getTurnoPorHorario(),
          produto: form.produto || '',
          componente: form.componente || '',
          finalComponente: form.finalComponente || 'Peça Final',
          quantidadeAfetada: Number(form.quantidadeAfetada) || 1,
          modoFalha: form.modoFalha || '',
          descricaoProblema: detalhamentoFinal,
          descricaoCompleta: detalhamentoFinal,
          caracteristicaSeguranca: form.caracteristicaSeguranca || 'Não',
          coProduto: form.coProduto || 'Não',
          carryOver: form.carryOver || 'Não',
          reincidente: form.reincidente || 'NÃO',
          gravidade: form.gravidade || 'Média',
          possivelDetectar: form.possivelDetectar || 'Sim',
          posto: form.posto || 'POSTO 01',
          fmds: form.fmds || 'SOLDA GERAL',
          documentoRastreabilidade: form.documentoRastreabilidade || 'Não Informado',
          codigoRastreabilidade: form.codigoRastreabilidade || '',
          dataInicioRastreabilidade: form.dataInicioRastreabilidade || '',
          dataFimRastreabilidade: form.dataFimRastreabilidade || '',
          participantesAtendimento: participantesStr,
          protcliente: (form.documentoRastreabilidade !== 'Não Informado' && form.codigoRastreabilidade) ? 'Sim' : 'Não',
          abrir8D: form.abrir8D || 'Sim',
          detector: currentUser.nome,
          reDetector: currentUser.reAcesso,
          fotoPecaNg: form.fotoPecaNg || '',
          fotoPecaOk: form.fotoPecaOk || '',
          fotoAuxiliar: form.fotoAuxiliar || '',
          descricaoProblemaInterno: descInternaFinal,
          recomendacoesProvidencias: form.recomendacoesProvidencias || '',
          acoesContencao: form.acoesContencao || '',
          dataContencao: form.dataContencao || '',
          qtdInspecionada: Number(form.qtdInspecionada) || 0,
          qtdSuspeita: Number(form.qtdSuspeita) || 0,
          qtdBloqueada: Number(form.qtdBloqueada) || 0,
          oQueFazer: form.oQueFazer || '',
          comoFazer: form.comoFazer || '',
          porQueFazer: form.porQueFazer || '',
          quemFara: form.quemFara || '',
          quandoFara: form.quandoFara || '',
          ondeFara: form.ondeFara || ''
        };

        const novaRnc = spStore.addRNC(payload);
        setNotification({ 
          type: 'success', 
          message: `Relatório Inicial criado com sucesso! Código: ${novaRnc.field1 || `RNC #${novaRnc.id}`}` 
        });
      }

      setTimeout(() => {
        if (edicao) {
          if (fromScreen === 'detalhes-8d' || fromScreen === 'detalhes' || (rncId && fromScreen !== 'lista-8d')) {
            onNavigate('detalhes-8d', { rncId: rncId || form.id });
          } else {
            onNavigate('lista-8d');
          }
        } else {
          onNavigate('lista-8d');
        }
      }, 900);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Erro ao salvar: ${err.message || 'Falha desconhecida'}` });
    }
  };

  const clientBadge = form.cliente ? getClientBadgeInfo(form.cliente) : null;
  const isComponenteIsolado = form.finalComponente === 'Componente';
  const isPecaSelecionada = Boolean(
    isComponenteIsolado ? (form.componente && form.componente.trim()) : (form.produto && form.produto.trim())
  );

  return (
    <div className="w-full flex flex-col gap-5 pb-24 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 p-1 text-slate-400 hover:text-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Pré-visualização de Foto */}
      {previewFoto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 flex flex-col gap-3 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-display font-bold text-slate-900">{previewFoto.titulo}</h3>
              <button 
                type="button"
                onClick={() => setPreviewFoto(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full max-h-[75vh] flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden">
              <img 
                src={previewFoto.url} 
                alt={previewFoto.titulo} 
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1. BARRA SUPERIOR: CONTEXTO, TÍTULO E AÇÕES (LARGURA TOTAL) */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleBack}
            className="btn-secondary h-9 px-3 text-xs"
            title={!edicao ? "Voltar para o menu principal" : (fromScreen === 'detalhes-8d' || rncId) ? "Voltar para os detalhes da ocorrência" : "Voltar para a lista"}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          
          <div>
            <h1 className="text-base sm:text-2xl font-display font-bold text-slate-900">
              {edicao ? `Ocorrência: ${form.field1 || `RNC #${form.id}`}` : 'Relatório Inicial de Não Conformidade'}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Preenchimento inicial de fábrica. A equipe da Qualidade complementará a contenção e rastreabilidade posteriormente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button 
            type="button"
            onClick={handleBack}
            className="btn-secondary h-9 px-3.5 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="btn-primary h-9 px-4 text-xs font-semibold shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="font-display">
              {edicao ? 'Salvar Alterações' : 'Emitir Relatório Inicial'}
            </span>
          </button>
        </div>
      </div>

      {/* FORMULÁRIO RESPONSIVO DE LARGURA TOTAL */}
      <form onSubmit={handleSave} className="w-full flex flex-col gap-5">
        
        {/* =========================================================================
            CARD 1: DADOS GERAIS DA NÃO CONFORMIDADE & MONTADORA
            ========================================================================= */}
        <div className="w-full card-saas !p-3.5 sm:!p-5 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0b5796] flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900">
                  1. Dados Gerais & Montadora
                </h2>
                <p className="text-xs text-slate-500">
                  Identificação do cliente montadora, classificação da ocorrência e dados de emissão.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cliente / Montadora (Inicia vazio para o usuário escolher) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Cliente (Montadora) <strong className="text-rose-500">*</strong></span>
                {clientBadge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${clientBadge.bg} ${clientBadge.color}`}>
                    {form.cliente}
                  </span>
                )}
              </label>
              <SearchableSelect
                value={form.cliente || ''}
                onChange={handleClienteChange}
                placeholder="-- Selecione a Montadora --"
                searchPlaceholder="Pesquisar montadora (ex: Toyota, Honda, VW)..."
                error={errors.cliente}
                options={optionsClientes}
              />
              {errors.cliente && <span className="text-[11px] text-rose-500 font-medium">{errors.cliente}</span>}
            </div>

            {/* Tipo de Ocorrência (Inicia vazio para o usuário escolher) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Tipo de Ocorrência <strong className="text-rose-500">*</strong></span>
              </label>
              <SearchableSelect
                value={form.tipoRnc || ''}
                onChange={val => {
                  clearFieldError('tipoRnc');
                  setForm(prev => ({ ...prev, tipoRnc: val as TipoRNC }));
                }}
                placeholder="-- Selecione o Tipo --"
                searchPlaceholder="Pesquisar tipo de ocorrência..."
                error={errors.tipoRnc}
                options={optionsTipoRnc}
              />
              {errors.tipoRnc && <span className="text-[11px] text-rose-500 font-medium">{errors.tipoRnc}</span>}
            </div>

            {/* Data da Ocorrência (Vem data de hoje por padrão, editável) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Data da Ocorrência <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="date"
                value={form.dataOcorrencia || ''}
                onChange={e => {
                  clearFieldError('dataOcorrencia');
                  setForm(prev => ({ ...prev, dataOcorrencia: e.target.value }));
                }}
                className={`w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                  errors.dataOcorrencia ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                }`}
              />
              {errors.dataOcorrencia && <span className="text-[11px] text-rose-500 font-medium">{errors.dataOcorrencia}</span>}
            </div>

            {/* Turno de Detecção (Calculado automaticamente pelo horário atual) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">
                <span>Turno de Detecção</span>
              </label>
              <SearchableSelect
                value={form.turno || '1º Turno'}
                onChange={val => setForm(prev => ({ ...prev, turno: val as any }))}
                placeholder="Selecione o turno..."
                searchPlaceholder="Pesquisar turno..."
                options={optionsTurno}
              />
            </div>
          </div>

          {/* CAMPOS CONDICIONAIS PELO TIPO DE OCORRÊNCIA */}
          {form.tipoRnc && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 animate-in fade-in duration-200">
              
              {/* INTERNO: Mostra Setor de Detecção exatamente conforme Foto 2 */}
              {form.tipoRnc === 'Interno' && (
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 flex flex-col gap-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Wrench className="w-4 h-4 text-[#0b5796]" />
                      <span>Detecção em Linha Fabril Interna</span>
                    </div>
                    {/* Badge Chão de Fábrica idêntico à Foto 2 */}
                    <span className="text-[11px] font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                      Chão de Fábrica
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Setor de Detecção <strong className="text-rose-500">*</strong>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Ex: Linha de Solda, Estamparia...
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.setorDeteccao || ''}
                      onChange={e => {
                        clearFieldError('setorDeteccao');
                        setForm(prev => ({ ...prev, setorDeteccao: e.target.value }));
                      }}
                      placeholder="Ex: Linha de Solda, Estamparia..."
                      className={`w-full h-11 px-3.5 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                        errors.setorDeteccao ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                      }`}
                    />
                    {errors.setorDeteccao && <span className="text-[11px] text-rose-500 font-medium">{errors.setorDeteccao}</span>}
                  </div>
                </div>
              )}

              {/* FORMAL: Campos do Portal do Cliente */}
              {form.tipoRnc === 'Formal' && (
                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0b5796]">
                    <FileText className="w-4 h-4" />
                    <span>Dados Complementares do Registro Formal (Portal do Cliente / Montadora)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Código / ID no Portal do Cliente
                      </label>
                      <input
                        type="text"
                        value={form.codOcorrenciaCliente || ''}
                        onChange={e => setForm(prev => ({ ...prev, codOcorrenciaCliente: e.target.value }))}
                        placeholder="Ex: RECL-2026-VW-019 ou Q-NOTIF-TOYOTA"
                        className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Data de Oficialização no Portal
                      </label>
                      <input
                        type="date"
                        value={form.dataOficializacao || ''}
                        onChange={e => setForm(prev => ({ ...prev, dataOficializacao: e.target.value }))}
                        className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Local de detecção do cliente:
                      </label>
                      <input
                        type="text"
                        value={form.setorDeteccao || ''}
                        onChange={e => setForm(prev => ({ ...prev, setorDeteccao: e.target.value }))}
                        placeholder="Ex: montagem, linha final..."
                        className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Impacto no cliente:
                      </label>
                      <input
                        type="text"
                        value={form.impactoCliente || ''}
                        onChange={e => setForm(prev => ({ ...prev, impactoCliente: e.target.value }))}
                        placeholder="Ex: retrabalho, peça amassada..."
                        className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      * Detalhamento da ocorrência (cliente):
                    </label>
                    <textarea
                      rows={2}
                      value={form.detalhamentoOcorrencia || form.descricaoProblema || ''}
                      onChange={e => {
                        const val = e.target.value;
                        clearFieldError('descricaoProblema');
                        setForm(prev => ({ 
                          ...prev, 
                          detalhamentoOcorrencia: val,
                          descricaoProblema: val,
                          descricaoCompleta: val 
                        }));
                      }}
                      placeholder="Informações transmitidas pelo analista do cliente ou engenheiro residente da montadora..."
                      className="w-full p-2.5 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none resize-y"
                    />
                  </div>
                </div>
              )}

              {/* INFORMAL: Registro Informal / Alerta Preventivo (Foto 3 Power Apps) */}
              {form.tipoRnc === 'Informal' && (
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Registro Informal / Alerta Preventivo da Montadora</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        * Local de detecção do cliente:
                      </label>
                      <input
                        type="text"
                        value={form.setorDeteccao || ''}
                        onChange={e => setForm(prev => ({ ...prev, setorDeteccao: e.target.value }))}
                        placeholder="Ex: montagem"
                        className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        * Impacto no cliente:
                      </label>
                      <input
                        type="text"
                        value={form.impactoCliente || ''}
                        onChange={e => setForm(prev => ({ ...prev, impactoCliente: e.target.value }))}
                        placeholder="Ex: peça amassada, gerando montagem incorreta"
                        className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      * Detalhamento da ocorrência (cliente):
                    </label>
                    <textarea
                      rows={2}
                      value={form.detalhamentoOcorrencia || form.descricaoProblema || ''}
                      onChange={e => {
                        const val = e.target.value;
                        clearFieldError('descricaoProblema');
                        setForm(prev => ({ 
                          ...prev, 
                          detalhamentoOcorrencia: val,
                          descricaoProblema: val,
                          descricaoCompleta: val 
                        }));
                      }}
                      placeholder="Informações transmitidas pelo analista do cliente ou engenheiro residente da montadora..."
                      className="w-full p-2.5 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none resize-y"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PARTICIPANTES DO ATENDIMENTO (CARD 9 POWER APPS - FOTO 4)
              Permite multi-seleção de colaboradores envolvidos (BASE_ATIVOS)
              ========================================================================= */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 relative" ref={participantesRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-700" />
                <span>* Participantes do atendimento:</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {participantesSelecionados.length} participante(s) registrado(s) • Base Ativos Gestamp
              </span>
            </div>

            {/* Caixa de Seleção / Chips Estilo Foto 4 */}
            <div 
              onClick={() => setDropdownParticipantesAberto(!dropdownParticipantesAberto)}
              className="w-full min-h-[46px] p-2 bg-white rounded-xl border border-indigo-200/90 hover:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200 cursor-pointer flex flex-wrap items-center justify-between gap-1.5 shadow-2xs transition-all"
            >
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {participantesSelecionados.length === 0 ? (
                  <span className="text-xs text-slate-400 px-2">
                    Clique para selecionar colaboradores da equipe...
                  </span>
                ) : (
                  participantesSelecionados.map(nome => (
                    <span 
                      key={nome}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200/90 rounded-lg text-xs font-semibold shadow-2xs animate-in zoom-in-95"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{nome}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removerParticipante(nome);
                        }}
                        className="text-indigo-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Remover participante"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              
              <div className="flex items-center gap-1 text-slate-400 pl-2 shrink-0">
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownParticipantesAberto ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Dropdown Flutuante de Busca e Multi-Seleção da Base de Ativos */}
            {dropdownParticipantesAberto && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-indigo-200 shadow-xl overflow-hidden flex flex-col max-h-72 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={buscaParticipante}
                    onChange={e => setBuscaParticipante(e.target.value)}
                    placeholder="Pesquisar por nome, cargo ou RE..."
                    className="w-full h-8 px-2 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                    autoFocus
                  />
                  {buscaParticipante && (
                    <button 
                      type="button" 
                      onClick={() => setBuscaParticipante('')}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto max-h-56 p-1 flex flex-col gap-0.5">
                  {colaboradoresFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Nenhum colaborador encontrado para "{buscaParticipante}"
                    </div>
                  ) : (
                    colaboradoresFiltrados.map(colab => {
                      const isSelected = participantesSelecionados.includes(colab.nome);
                      return (
                        <div
                          key={colab.numPessoal}
                          onClick={() => toggleParticipante(colab.nome)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-indigo-50 text-indigo-950 font-bold' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">{colab.nome}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              RE {colab.numPessoal} • {colab.posicao} • {colab.unidadeOrg}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-indigo-700 shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 2: IDENTIFICAÇÃO DA PEÇA & POSTO (AUTOPREENCHIMENTO PROEPS)
            FOTO 1 & FOTO 3 DO POWER APPS
            ========================================================================= */}
        <div className="w-full card-saas !p-3.5 sm:!p-5 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900">
                  2. Peça, Posto & FMDS (Autopreenchimento ProEPS)
                </h2>
                <p className="text-xs text-slate-500">
                  Selecione o produto. As informações cadastradas de posto de trabalho e área FMDS serão preenchidas automaticamente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Tipo de Componente (Guia a regra e sequência dos campos) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">
                <span>Tipo de Peça Rastreada <strong className="text-rose-500">*</strong></span>
              </label>
              <SearchableSelect
                value={form.finalComponente || 'Peça Final'}
                onChange={val => handleTipoComponenteChange(val as any)}
                placeholder="Selecione o tipo de componente..."
                searchPlaceholder="Pesquisar tipo de componente..."
                options={optionsTipoComponente}
              />
            </div>

            {/* 2. Produto / Conjunto (Peça Final) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Produto / Conjunto {!isComponenteIsolado && <strong className="text-rose-500">*</strong>}</span>
              </label>

              <SearchableSelect
                disabled={isComponenteIsolado || (!form.cliente && form.finalComponente !== 'SubComponente + Componente')}
                disabledText={
                  isComponenteIsolado
                    ? '-- Não aplicável para Componente Isolado --'
                    : '-- Selecione a Montadora primeiro no Passo 1 --'
                }
                value={form.produto || ''}
                onChange={handlePecaChange}
                placeholder="-- Selecione o Produto / Conjunto --"
                searchPlaceholder="Pesquisar por descrição, código montadora ou SAP..."
                error={errors.produto}
                options={optionsProduto}
              />
              {errors.produto && !isComponenteIsolado && <span className="text-[11px] text-rose-500 font-medium">{errors.produto}</span>}
            </div>

            {/* 3. Componente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Componente</span>
                {/* Badge dinâmica idêntica às Fotos 1 e 3 */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded leading-none ${
                  form.finalComponente === 'Peça Final'
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/60'
                    : form.finalComponente === 'SubComponente + Componente'
                    ? 'text-indigo-800 bg-indigo-50 border border-indigo-200/60'
                    : isComponenteIsolado
                    ? 'text-amber-800 bg-amber-50 border border-amber-200/60'
                    : 'text-blue-800 bg-blue-50 border border-blue-200/60'
                }`}>
                  {form.finalComponente === 'Peça Final' 
                    ? 'Conjunto' 
                    : form.finalComponente === 'SubComponente + Componente'
                    ? 'Subcomponente'
                    : isComponenteIsolado
                    ? 'Componente'
                    : 'Subcomponente'}
                </span>
              </label>

              {/* Modo 1: Peça Final (Conjunto Completo) - Campo read-only preenchido automaticamente (Foto 1) */}
              {form.finalComponente === 'Peça Final' ? (
                <input
                  type="text"
                  readOnly
                  value={form.componente || (form.produto ? form.produto : '')}
                  placeholder="Preenchido automaticamente com o conjunto"
                  className="w-full h-10 px-3 bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 outline-none select-all"
                />
              ) : (
                <SearchableSelect
                  disabled={form.finalComponente === 'Peça Final + Componente' && !form.produto}
                  disabledText="-- Selecione o Produto primeiro --"
                  value={form.componente || ''}
                  onChange={handleComponenteChange}
                  placeholder={
                    isComponenteIsolado
                      ? '-- Selecione o Componente Isolado --'
                      : form.finalComponente === 'SubComponente + Componente'
                      ? '-- Selecione o Subcomponente --'
                      : '-- Selecione o Componente Filho --'
                  }
                  searchPlaceholder="Pesquisar componente..."
                  error={errors.componente}
                  options={optionsComponente}
                />
              )}
              {errors.componente && <span className="text-[11px] text-rose-500 font-medium">{errors.componente}</span>}
            </div>

            {/* Posto de Trabalho (Autopreenchido com badge verde ou selecionável com busca) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Posto de Trabalho Cadastrado</span>
                {isPecaSelecionada && form.posto && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 leading-none">
                    ✓ Autopreenchido
                  </span>
                )}
              </label>
              {!isPecaSelecionada ? (
                <input
                  type="text"
                  disabled
                  placeholder="Aguardando seleção da peça..."
                  className="w-full h-10 px-3 bg-slate-50 text-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200 cursor-not-allowed outline-none"
                />
              ) : (
                <SearchableSelect
                  value={form.posto || ''}
                  onChange={val => setForm(prev => ({ ...prev, posto: val }))}
                  placeholder="-- Selecione o Posto de Trabalho --"
                  searchPlaceholder="Pesquisar posto..."
                  options={optionsPostos}
                />
              )}
            </div>

            {/* Área FMDS / Setor Fabril (Autopreenchido com badge verde ou selecionável com busca) */}
            <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Área FMDS / Setor Fabril</span>
                {isPecaSelecionada && form.fmds && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 leading-none">
                    ✓ Autopreenchido
                  </span>
                )}
              </label>
              {!isPecaSelecionada ? (
                <input
                  type="text"
                  disabled
                  placeholder="Aguardando seleção da peça..."
                  className="w-full h-10 px-3 bg-slate-50 text-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200 cursor-not-allowed outline-none"
                />
              ) : (
                <SearchableSelect
                  value={form.fmds || ''}
                  onChange={val => setForm(prev => ({ 
                    ...prev, 
                    fmds: val,
                    classificacaoSetor: val 
                  }))}
                  placeholder="-- Selecione a Área FMDS --"
                  searchPlaceholder="Pesquisar área FMDS..."
                  options={optionsFMDS}
                />
              )}
            </div>

            {/* LINHA DE BADGES DE ATRIBUTOS DA PEÇA (CARRY OVER, CO-PRODUTO, SEGURANÇA, REINCIDENTE) - FOTO 1 */}
            <div className="flex flex-wrap items-center gap-3 pt-2.5 md:col-span-2 lg:col-span-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">Atributos da Peça:</span>
              
              {/* Carry Over */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-slate-50/50 text-xs font-semibold shadow-2xs">
                <span className="text-slate-500">Carry Over:</span>
                <span className={`font-bold ${
                  !isPecaSelecionada ? 'text-slate-400' :
                  form.carryOver === 'Sim' ? 'text-amber-700' : 'text-slate-700'
                }`}>
                  {isPecaSelecionada ? (form.carryOver || 'Não') : '-'}
                </span>
              </div>

              {/* Co-produto (Espelho) */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-slate-50/50 text-xs font-semibold shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-slate-500">Co-produto (Espelho):</span>
                <span className={`font-bold ${
                  !isPecaSelecionada ? 'text-slate-400' :
                  form.coProduto === 'Sim' ? 'text-purple-700' : 'text-slate-700'
                }`}>
                  {isPecaSelecionada ? (form.coProduto || 'Não') : '-'}
                </span>
              </div>

              {/* Peça de Segurança (FMEA) */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs ${
                isPecaSelecionada && form.caracteristicaSeguranca === 'Sim'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50/50 border-slate-200/80 text-slate-700'
              }`}>
                {isPecaSelecionada && form.caracteristicaSeguranca === 'Sim' ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Peça de Segurança (FMEA):</span>
                <span className="font-bold">
                  {isPecaSelecionada ? (form.caracteristicaSeguranca || 'Não') : '-'}
                </span>
              </div>

              {/* Reincidente: Apenas Visualização (Preenchimento Automático via Histórico) */}
              <div 
                className="flex items-center gap-2.5 ml-auto pl-2"
                title="Campo de visualização preenchido automaticamente com base no histórico da peça e modo de falha"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Reincidente:</span>
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Automático)</span>
                </div>
                <div className="flex items-center gap-2 select-none pointer-events-none">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-default">
                    <input
                      type="radio"
                      name="reincidente_readonly"
                      value="NÃO"
                      checked={form.reincidente !== 'SIM'}
                      disabled
                      readOnly
                      tabIndex={-1}
                      className="text-[#0b5796] opacity-80 cursor-default focus:ring-0"
                    />
                    <span className={form.reincidente !== 'SIM' ? 'font-medium text-slate-800' : 'text-slate-400'}>
                      Não
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-default">
                    <input
                      type="radio"
                      name="reincidente_readonly"
                      value="SIM"
                      checked={form.reincidente === 'SIM'}
                      disabled
                      readOnly
                      tabIndex={-1}
                      className="text-amber-600 opacity-80 cursor-default focus:ring-0"
                    />
                    <span className={form.reincidente === 'SIM' ? 'text-amber-800 font-bold' : 'text-slate-400'}>
                      Sim
                    </span>
                  </label>
                </div>

                {/* Badge Reincidência exata do defeito (Indica histórico no Card 3) */}
                {isPecaSelecionada && historicoReincidencias.length > 0 && (
                  <span 
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs"
                    title="Histórico de reincidências detalhado no Passo 3 abaixo"
                  >
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    <span>{historicoReincidencias.length} anterior(es)</span>
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            CARD 3: DESCRIÇÃO DO DEFEITO, QUANTIDADE & RASTREABILIDADE
            FOTO 5 DO POWER APPS
            ========================================================================= */}
        <div className="w-full card-saas !p-3.5 sm:!p-5 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900">
                  3. Descrição do Defeito, Quantidade & Rastreabilidade
                </h2>
                <p className="text-xs text-slate-500">
                  Classificação padronizada, detalhamento técnico e rastreabilidade conforme catálogo ProEPS.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Classificação / Modo de Falha Padronizado (Choices do SharePoint) */}
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Classificação do Defeito <strong className="text-rose-500">*</strong></span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium leading-none">
                  Modo de Falha
                </span>
              </label>
              <SearchableSelect
                value={form.modoFalha || ''}
                onChange={novoModo => {
                  clearFieldError('modoFalha');
                  setForm(prev => ({ 
                    ...prev, 
                    modoFalha: novoModo
                  }));
                }}
                placeholder="-- Selecione o Modo de Falha --"
                searchPlaceholder="Pesquisar defeito (ex: Trinca, Solda, Rebarba)..."
                error={errors.modoFalha}
                options={optionsModosFalha}
              />
              {errors.modoFalha && <span className="text-[11px] text-rose-500 font-medium">{errors.modoFalha}</span>}
              <span className="text-[10px] text-slate-400">
                Padrão corporativo de defeitos Gestamp
              </span>
            </div>

            {/* Descrição Detalhada do Defeito */}
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Detalhamento Técnico da Não Conformidade <strong className="text-rose-500">*</strong></span>
                <span className="text-[11px] text-slate-400 font-normal leading-none">
                  {(form.descricaoProblema || '').length} carac.
                </span>
              </label>
              <textarea
                rows={3}
                value={form.descricaoProblema || ''}
                onChange={e => {
                  clearFieldError('descricaoProblema');
                  setForm(prev => ({ ...prev, descricaoProblema: e.target.value }));
                }}
                placeholder="Descreva aqui o detalhamento técnico do problema (ex: local exato, dimensões fora da tolerância, número do cordão ou ponto de solda afetado)..."
                className={`w-full p-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all resize-y ${
                  errors.descricaoProblema ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                }`}
              />
              {errors.descricaoProblema && <span className="text-[11px] text-rose-500 font-medium">{errors.descricaoProblema}</span>}
            </div>

            {/* Quantidade Afetada */}
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
              <label className="text-xs font-semibold text-slate-700 h-5 flex items-center justify-between">
                <span>Quantidade Não Conforme <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="number"
                min={1}
                value={form.quantidadeAfetada ?? ''}
                onChange={e => {
                  clearFieldError('quantidadeAfetada');
                  const val = e.target.value;
                  setForm(prev => ({ ...prev, quantidadeAfetada: val === '' ? ('' as any) : Math.max(1, parseInt(val) || 1) }));
                }}
                placeholder="Ex: 1, 5, 10..."
                className={`w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                  errors.quantidadeAfetada ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                }`}
              />
              {errors.quantidadeAfetada && <span className="text-[11px] text-rose-500 font-medium">{errors.quantidadeAfetada}</span>}
            </div>

            {/* =========================================================================
                DOCUMENTO PARA RASTREABILIDADE
                Opções: Não Informado, Etiqueta SAP, Order Cliente, NF
                Se 'Não Informado' => Pede Data Inicial e Data Final para range de contenção
                Se outro documento => Pede Código/Número do documento
                ========================================================================= */}
            <div className="pt-3 border-t border-slate-100 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
              
              {/* Dropdown de Seleção de Documento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 h-5 flex items-center justify-between">
                  <span>Documento para rastreabilidade <strong className="text-rose-500">*</strong></span>
                </label>
                <SearchableSelect
                  value={form.documentoRastreabilidade || 'Não Informado'}
                  onChange={val => {
                    const novoDoc = val as any;
                    clearFieldError('codigoRastreabilidade');
                    clearFieldError('dataInicioRastreabilidade');
                    clearFieldError('dataFimRastreabilidade');
                    setForm(prev => ({
                      ...prev,
                      documentoRastreabilidade: novoDoc,
                      protcliente: novoDoc !== 'Não Informado' ? 'Sim' : 'Não'
                    }));
                  }}
                  placeholder="Selecione o documento..."
                  searchPlaceholder="Pesquisar documento..."
                  options={optionsDocumentoRastreabilidade}
                />
                <span className="text-[10px] text-slate-500">
                  {form.documentoRastreabilidade === 'Não Informado' 
                    ? 'Sem documento: informe o período de fabricação abaixo.' 
                    : `Documento selecionado: ${form.documentoRastreabilidade}`}
                </span>
              </div>

              {/* Condicional Foto 5: Se 'Não Informado' => Mostra Range de Datas (Data Início e Data Fim) */}
              {form.documentoRastreabilidade === 'Não Informado' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Data Inicial (Rastreabilidade) <strong className="text-rose-500">*</strong></span>
                    </label>
                    <input
                      type="date"
                      value={form.dataInicioRastreabilidade || ''}
                      onChange={e => {
                        clearFieldError('dataInicioRastreabilidade');
                        setForm(prev => ({ ...prev, dataInicioRastreabilidade: e.target.value }));
                      }}
                      className={`w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                        errors.dataInicioRastreabilidade ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                      }`}
                    />
                    {errors.dataInicioRastreabilidade && (
                      <span className="text-[11px] text-rose-500 font-medium">{errors.dataInicioRastreabilidade}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      <span>Data Final (Rastreabilidade) <strong className="text-rose-500">*</strong></span>
                    </label>
                    <input
                      type="date"
                      value={form.dataFimRastreabilidade || ''}
                      onChange={e => {
                        clearFieldError('dataFimRastreabilidade');
                        setForm(prev => ({ ...prev, dataFimRastreabilidade: e.target.value }));
                      }}
                      className={`w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                        errors.dataFimRastreabilidade ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                      }`}
                    />
                    {errors.dataFimRastreabilidade && (
                      <span className="text-[11px] text-rose-500 font-medium">{errors.dataFimRastreabilidade}</span>
                    )}
                  </div>
                </>
              ) : (
                /* Condicional Foto 5: Se Etiqueta SAP, Order Cliente ou NF => Pede o código do documento */
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Código / Número do Documento ({form.documentoRastreabilidade}) <strong className="text-rose-500">*</strong></span>
                    <span className="text-[10px] text-slate-400">Rastreabilidade do Lote</span>
                  </label>
                  <input
                    type="text"
                    value={form.codigoRastreabilidade || ''}
                    onChange={e => {
                      clearFieldError('codigoRastreabilidade');
                      setForm(prev => ({ 
                        ...prev, 
                        codigoRastreabilidade: e.target.value,
                        protcliente: 'Sim'
                      }));
                    }}
                    placeholder={
                      form.documentoRastreabilidade === 'Etiqueta SAP' ? 'Ex: ETQ-884102 ou 202610-01' :
                      form.documentoRastreabilidade === 'Order Cliente' ? 'Ex: ORD-99210-VW ou PO-2026-44' :
                      'Ex: NF-004921 / Série 1'
                    }
                    className={`w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                      errors.codigoRastreabilidade ? 'border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15'
                    }`}
                  />
                  {errors.codigoRastreabilidade && (
                    <span className="text-[11px] text-rose-500 font-medium">{errors.codigoRastreabilidade}</span>
                  )}
                </div>
              )}
            </div>

            {/* SELEÇÃO RÁPIDA: Sugestão de defeitos anteriores desta peça antes de selecionar o modo de falha */}
            {isPecaSelecionada && !form.modoFalha && defeitosHistoricoPeca.length > 0 && (
              <div className="md:col-span-2 lg:col-span-4 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col gap-2 text-xs">
                <span className="text-xs text-amber-950 font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>Defeitos registrados anteriormente para esta peça (clique para autocompletar):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defeitosHistoricoPeca.map(({ defeito, count }) => (
                    <button
                      key={defeito}
                      type="button"
                      onClick={() => {
                        clearFieldError('modoFalha');
                        setForm(prev => ({ ...prev, modoFalha: defeito }));
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 text-xs font-semibold rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>{defeito}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* HISTÓRICO DE REINCIDÊNCIAS EM LISTA (CARD 3: DA MAIS RECENTE PARA MAIS ANTIGA) */}
            {isPecaSelecionada && form.modoFalha && historicoReincidenciasOrdenado.length > 0 && (
              <div className="md:col-span-2 lg:col-span-4 mt-2 p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col gap-3 shadow-2xs animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-amber-200/70">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-bold text-amber-950">
                      Histórico de Reincidências Registradas para esta Peça / Modo de Falha
                    </span>
                    <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {historicoReincidenciasOrdenado.length} registro(s)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-medium">
                    Ordenado da mais recente para a mais antiga • Clique em "Ver RNC" para abrir o pop-up
                  </span>
                </div>

                {/* Exibição em LISTA LINEAR (da mais recente para a mais antiga) */}
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {historicoReincidenciasOrdenado.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="p-3 bg-white rounded-xl border border-amber-200/90 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        {/* Coluna 1: Código RNC e Data */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            {item.field1 || `RNC #${item.id}`}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDateBR(item.dataOcorrencia)}</span>
                          </span>
                        </div>

                        {/* Coluna 2: Defeito & Setor / Posto */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {item.modoFalha || item.descricaoProblema || 'Defeito registrado'}
                            </span>
                            {item.classificacaoSetor && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded hidden md:inline">
                                {item.classificacaoSetor}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.cliente} • {item.produto || item.componente} {item.posto ? `• Posto: ${item.posto}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Coluna 3: Status & Botão de Ver RNC (Pop-up sem perder preenchimento) */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'Concluído' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : item.status === 'Em Andamento' 
                            ? 'bg-amber-50 text-amber-900 border-amber-200' 
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {item.protcliente === 'Sim' ? 'Proteção ao cliente' : (item.status || 'Em Andamento')}
                        </span>

                        <button
                          type="button"
                          onClick={() => setRncVisualizarModal(item)}
                          className="btn-secondary h-8 px-3 text-xs font-bold text-[#0b5796] hover:bg-blue-50 border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Visualizar informações desta RNC em pop-up sem perder o preenchimento"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0b5796]" />
                          <span>Ver RNC</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* =========================================================================
            CARD 4: EVIDÊNCIA DA OCORRÊNCIA (FOTO PEÇA NG - CARD 13)
            Preenchimento no Relatório Inicial
            ========================================================================= */}
        <div className="w-full card-saas !p-3.5 sm:!p-5 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-display font-bold text-slate-900">
                    4. Evidência Fotográfica da Peça Não Conforme (NG)
                  </h2>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                    Relatório Inicial
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Fotografia da evidência de defeito / não conformidade detectada na peça ou componente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                A foto da peça OK é preenchida na etapa de contenção
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                Até 10MB
              </span>
            </div>
          </div>

          {/* Foto Peça NG (Não Conforme) */}
          <div className="flex flex-col gap-2 p-4 rounded-xl border border-rose-200/80 bg-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Evidência da Peça Defeituosa (NG)
              </span>
              {form.fotoPecaNg && (
                <button
                  type="button"
                  onClick={() => handleRemoveFoto('fotoPecaNg')}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-semibold"
                  title="Remover foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              )}
            </div>

            {form.fotoPecaNg ? (
              <div className="relative group rounded-xl overflow-hidden border border-rose-200 bg-white h-56 flex items-center justify-center">
                <img
                  src={form.fotoPecaNg}
                  alt="Peça NG"
                  className="w-full h-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFoto({ url: form.fotoPecaNg!, titulo: 'Foto da Peça Não Conforme (NG)' })}
                    className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer hover:bg-slate-100"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputNgRef.current?.click()}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer hover:bg-rose-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Trocar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputNgRef.current?.click()}
                className="h-44 rounded-xl border-2 border-dashed border-rose-300 hover:border-rose-500 bg-white/70 hover:bg-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center p-4"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-rose-900 block">
                    Clique para anexar foto da peça defeituosa
                  </span>
                  <span className="text-[11px] text-slate-400">
                    JPG, PNG ou WEBP • Máximo 10MB
                  </span>
                </div>
              </div>
            )}
            <input
              ref={fileInputNgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFileUpload(e, 'fotoPecaNg')}
            />
          </div>
        </div>

        {/* =========================================================================
            CARD 5: EMISSOR / DETECTOR CONECTADO (RASTREABILIDADE)
            ========================================================================= */}
        <div className="w-full card-saas !p-3.5 sm:!p-4 bg-gradient-to-r from-blue-50/60 via-white to-slate-50/60 border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0b5796] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-slate-900">
                  {currentUser.nome}
                </span>
                <span className="text-[10px] font-bold text-[#0b5796] bg-blue-100/80 px-2 py-0.5 rounded-full">
                  RE: {currentUser.reAcesso}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Detector registrado • Perfil: {currentUser.perfil} • {currentUser.cargo || 'Operação / Inspeção'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/70">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Assinatura Digital de Detecção Ativa</span>
          </div>
        </div>

        {/* =========================================================================
            CARD 5: CONTENÇÃO & PLANO DE AÇÃO IMEDIATO (QUALIDADE / 5W2H)
            Preenchimento posterior para completar o relatório inicial (Cards 30 a 52)
            ========================================================================= */}
        <div className="w-full card-saas !p-0 border-indigo-200/80 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setQualidadeExpandida(!qualidadeExpandida)}
            className="w-full p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 hover:bg-indigo-50/90 flex items-center justify-between text-left transition-colors cursor-pointer border-b border-indigo-100"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-bold text-indigo-950">
                    5. Contenção & Tratativa da Qualidade (Completar Relatório Inicial / 5W2H)
                  </h3>
                </div>
                <p className="text-xs text-indigo-800/80 mt-0.5">
                  Foto da peça OK (padrão de referência), ações de contenção imediatas, 5W2H e equipe responsável.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-800 font-semibold text-xs">
              <span className="hidden sm:inline">{qualidadeExpandida ? 'Recolher tratativa' : 'Completar preenchimento'}</span>
              {qualidadeExpandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {qualidadeExpandida && (
            <div className="p-3.5 sm:p-5 flex flex-col gap-3.5 sm:gap-5 bg-white">
              
              {/* ITEM: FOTO DA PEÇA OK (PADRÃO DE REFERÊNCIA) - CARD 30 */}
              <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Foto da Peça OK (Padrão de Referência / Aceitável)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Padrão de Conformidade
                    </span>
                  </div>
                  {form.fotoPecaOk && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto('fotoPecaOk')}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-semibold"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800/80">
                  Preenchido ao completar o relatório inicial: anexe a foto da peça boa/aprovada para servir como padrão de conformidade e referência de auditoria.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  {/* Comparativo de Referência: Peça NG preenchida no relatório inicial */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/90 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      Referência: Peça NG (Preenchida no Relatório Inicial)
                    </span>
                    {form.fotoPecaNg ? (
                      <div className="relative group rounded-lg overflow-hidden border border-rose-100 bg-rose-50/30 h-36 flex items-center justify-center">
                        <img
                          src={form.fotoPecaNg}
                          alt="Peça NG"
                          className="w-full h-full object-contain p-1"
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewFoto({ url: form.fotoPecaNg!, titulo: 'Foto da Peça Não Conforme (NG)' })}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ampliar NG</span>
                        </button>
                      </div>
                    ) : (
                      <div className="h-36 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center p-2 text-slate-400 text-xs">
                        <span>Nenhuma foto NG anexada no relatório inicial</span>
                      </div>
                    )}
                  </div>

                  {/* Upload da Peça OK (Card 30) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/90 border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Upload da Peça OK (Padrão Aceitável)
                    </span>
                    {form.fotoPecaOk ? (
                      <div className="relative group rounded-lg overflow-hidden border border-emerald-200 bg-emerald-50/30 h-36 flex items-center justify-center">
                        <img
                          src={form.fotoPecaOk}
                          alt="Peça OK"
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewFoto({ url: form.fotoPecaOk!, titulo: 'Foto do Padrão de Referência (OK)' })}
                            className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputOkRef.current?.click()}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Trocar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputOkRef.current?.click()}
                        className="h-36 rounded-lg border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center p-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-900 block">
                          Clique para anexar a Peça OK
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Padrão de referência
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputOkRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'fotoPecaOk')}
                    />
                  </div>
                </div>
              </div>
              
              {/* ITEM 1: DESCRIÇÃO DO PROBLEMA (INTERNO) - CARD 36 / field_17 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>* Descrição do problema (interno):</span>
                </label>
                <textarea
                  rows={2}
                  value={form.descricaoProblemaInterno || ''}
                  onChange={e => setForm(prev => ({ 
                    ...prev, 
                    descricaoProblemaInterno: e.target.value
                  }))}
                  placeholder="Descreva o problema sob a ótica interna de processo/fabricação..."
                  className="w-full p-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15 outline-none transition-all resize-y"
                />
              </div>

              {/* ITEM 2: AÇÕES DE CONTENÇÃO - CARD 37 / A_x00e7__x00f5_es_x0020_de_x0020 */}
              <div className="flex flex-col gap-2 p-3 sm:p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>* Ações de contenção:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Escolha Múltipla</span>
                </label>
                
                {/* Botões / Chips de Escolha Múltipla */}
                <div className="flex flex-wrap gap-2">
                  {ACOES_CONTENCAO_LIST.map(acao => {
                    const isSelected = (form.acoesContencao || '').includes(acao);
                    return (
                      <button
                        key={acao}
                        type="button"
                        onClick={() => {
                          const current = (form.acoesContencao || '').split(';').map(s => s.trim()).filter(Boolean);
                          const next = isSelected 
                            ? current.filter(s => s !== acao)
                            : [...current, acao];
                          setForm(prev => ({ ...prev, acoesContencao: next.join('; ') }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#0b5796] text-white border-[#0b5796] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{acao}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={form.acoesContencao || ''}
                  onChange={e => setForm(prev => ({ ...prev, acoesContencao: e.target.value }))}
                  placeholder="Ou digite detalhes complementares das ações de contenção..."
                  className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                />
              </div>

              {/* ITEM 3: RECOMENDAÇÕES / PROVIDÊNCIAS - CARD 38 / Recomenda_x00e7__x00f5_es_x0020_ */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>* Recomendações / Providências:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Providências Imediatas</span>
                </label>
                <textarea
                  rows={3}
                  value={form.recomendacoesProvidencias || ''}
                  onChange={e => setForm(prev => ({ ...prev, recomendacoesProvidencias: e.target.value }))}
                  placeholder="Informe recomendações e providências adotadas pela equipe para proteger o cliente e processo..."
                  className="w-full p-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15 outline-none transition-all resize-y"
                />
              </div>

              {/* TRIAGEM E QUANTIDADES BLOQUEADAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">Gravidade do Defeito</label>
                  <SearchableSelect
                    value={form.gravidade || 'Média'}
                    onChange={val => setForm(prev => ({ ...prev, gravidade: val }))}
                    placeholder="Selecione..."
                    options={optionsGravidade}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">Detecção no Processo?</label>
                  <SearchableSelect
                    value={form.possivelDetectar || 'Sim'}
                    onChange={val => setForm(prev => ({ ...prev, possivelDetectar: val }))}
                    placeholder="Selecione..."
                    options={optionsPossivelDetectar}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">Qtd Inspecionada</label>
                  <input
                    type="number"
                    value={form.qtdInspecionada || 0}
                    onChange={e => setForm(prev => ({ ...prev, qtdInspecionada: Number(e.target.value) }))}
                    className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">Qtd Suspeita</label>
                  <input
                    type="number"
                    value={form.qtdSuspeita || 0}
                    onChange={e => setForm(prev => ({ ...prev, qtdSuspeita: Number(e.target.value) }))}
                    className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 h-5 flex items-center">Qtd Bloqueada</label>
                  <input
                    type="number"
                    value={form.qtdBloqueada || 0}
                    onChange={e => setForm(prev => ({ ...prev, qtdBloqueada: Number(e.target.value) }))}
                    className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* 5W2H - PLANO DE AÇÃO IMEDIATO */}
              <div className="p-3 sm:p-4 bg-indigo-50/40 rounded-xl border border-indigo-200/70 flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      Plano de Ação Imediato (5W2H da Contenção)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* ITEM 4: O QUE FAZER? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 h-5 flex items-center">* O que fazer?</label>
                    <textarea
                      rows={3}
                      value={form.oQueFazer || ''}
                      onChange={e => setForm(prev => ({ ...prev, oQueFazer: e.target.value }))}
                      placeholder="Ex: Realizar contenção antes de colocar na embalagem..."
                      className="w-full p-2.5 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15 outline-none transition-all resize-y"
                    />
                  </div>

                  {/* ITEM 5: COMO FAZER */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 h-5 flex items-center">* Como fazer</label>
                    <textarea
                      rows={3}
                      value={form.comoFazer || ''}
                      onChange={e => setForm(prev => ({ ...prev, comoFazer: e.target.value }))}
                      placeholder="Ex: Inspecionar isento de amassado..."
                      className="w-full p-2.5 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15 outline-none transition-all resize-y"
                    />
                  </div>

                  {/* ITEM 6: PORQUE FAZER? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 h-5 flex items-center">* Porque fazer?</label>
                    <textarea
                      rows={3}
                      value={form.porQueFazer || ''}
                      onChange={e => setForm(prev => ({ ...prev, porQueFazer: e.target.value }))}
                      placeholder="Ex: Para garantir que na próxima operação peças estejam OK..."
                      className="w-full p-2.5 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] focus:ring-2 focus:ring-[#0b5796]/15 outline-none transition-all resize-y"
                    />
                  </div>

                  {/* ITEM 7: QUANDO FAZER? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 h-5 flex items-center">* Quando fazer?</label>
                    <input
                      type="date"
                      value={form.quandoFara || ''}
                      onChange={e => setForm(prev => ({ ...prev, quandoFara: e.target.value }))}
                      className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                    />
                  </div>

                  {/* ITEM 8: ONDE FAZER? */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 h-5 flex items-center">* Onde fazer?</label>
                    <input
                      type="text"
                      value={form.ondeFara || ''}
                      onChange={e => setForm(prev => ({ ...prev, ondeFara: e.target.value }))}
                      placeholder="Ex: Linha 3 / Posto de inspeção..."
                      className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                    />
                  </div>

                  {/* ITEM 9: EQUIPE RESPONSÁVEL PELO 8D */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 h-5 flex items-center">* Equipe responsável pelo 8D</label>
                    <SearchableSelect
                      value={form.quemFara || ''}
                      onChange={val => setForm(prev => ({ ...prev, quemFara: val }))}
                      placeholder="Selecione o responsável..."
                      searchPlaceholder="Pesquisar colaborador da base de ativos..."
                      options={optionsEquipe8D}
                    />
                  </div>
                </div>
              </div>

              {/* ITENS 10, 11 E 12: FOTO AUXILIAR, DATA FINAL DE CONTENÇÃO E ABRIR 8D */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {/* ITEM 10: FOTO AUXILIAR RETRABALHO / SELEÇÃO (CARD 46) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Foto auxiliar Retrabalho / Seleção:</span>
                    </label>
                    {form.fotoAuxiliar && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFoto('fotoAuxiliar')}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                  {form.fotoAuxiliar ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white h-28 flex items-center justify-center">
                      <img src={form.fotoAuxiliar} alt="Foto auxiliar" className="w-full h-full object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewFoto({ url: form.fotoAuxiliar!, titulo: 'Foto Auxiliar de Retrabalho / Seleção' })}
                          className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputAuxiliarRef.current?.click()}
                          className="px-2.5 py-1 bg-[#0b5796] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Trocar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputAuxiliarRef.current?.click()}
                      className="h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0b5796] bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center p-2"
                    >
                      <Camera className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">Anexar foto auxiliar</span>
                      <span className="text-[10px] text-slate-400">Retrabalho / Seleção</span>
                    </div>
                  )}
                  <input
                    ref={fileInputAuxiliarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'fotoAuxiliar')}
                  />
                </div>

                {/* ITEM 11: DATA FINAL DE CONTENÇÃO */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>* Data Final de Contenção</span>
                  </label>
                  <input
                    type="date"
                    value={form.dataContencao || ''}
                    onChange={e => setForm(prev => ({ ...prev, dataContencao: e.target.value }))}
                    className="w-full h-10 px-3 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0b5796] outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Prazo final estipulado para a contenção</span>
                </div>

                {/* ITEM 12: ABRIR 8D */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Abrir 8D</span>
                  </label>
                  <SearchableSelect
                    value={form.abrir8D || 'Sim'}
                    onChange={val => setForm(prev => ({ ...prev, abrir8D: val as any }))}
                    placeholder="Selecione..."
                    options={optionsAbrir8D}
                  />
                  <span className="text-[10px] text-slate-400">Define se gera relatório 8D oficial</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 6. BARRA INFERIOR DE BOTÕES (LARGURA TOTAL) */}
        <div className="w-full flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleBack}
            className="btn-secondary h-10 px-4 text-xs font-semibold"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary h-11 px-6 text-xs sm:text-sm font-semibold shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="font-display">
              {edicao ? 'Salvar Alterações da Ocorrência' : 'Emitir Relatório Inicial (NCC)'}
            </span>
          </button>
        </div>

      {/* MODAL POP-UP DE VISUALIZAÇÃO RÁPIDA DE RNC (PRESERVA FORMULÁRIO ATUAL) */}
      {rncVisualizarModal && (
        <RncDetalhesModal
          rnc={rncVisualizarModal}
          onClose={() => setRncVisualizarModal(null)}
          onOpenFullPage={id => {
            window.open(`?screen=detalhes-8d&rncId=${id}`, '_blank');
          }}
        />
      )}

      </form>
    </div>
  );
};

export default Registro8DView;
