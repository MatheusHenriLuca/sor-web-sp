import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCw, 
  ArrowRight, 
  FileText, 
  Layers, 
  Building2, 
  Calendar, 
  Check, 
  X, 
  ExternalLink, 
  Printer, 
  TrendingUp, 
  Eye, 
  HelpCircle,
  GitBranch,
  ShieldAlert,
  ChevronRight,
  Filter
} from 'lucide-react';
import { UsuarioQualidade, EightDDetails, IshikawaItem, PlanoAcaoItem } from '../types';
import { eightDService } from '../services/eightDService';
import { actionPlanService } from '../services/actionPlanService';
import { formatDateBR } from '../utils/date';

interface Gestao8DViewProps {
  currentUser: UsuarioQualidade;
  onNavigate: (screen: string, params?: any) => void;
  initialId8d?: string;
  rncId?: number;
}

export const Gestao8DView: React.FC<Gestao8DViewProps> = ({
  currentUser,
  onNavigate,
  initialId8d,
  rncId
}) => {
  const [rncs8D, setRncs8D] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchRnc, setSearchRnc] = useState('');
  
  // 8D selecionado
  const [selectedRnc, setSelectedRnc] = useState<any | null>(null);
  const [id8d, setId8d] = useState<string>(initialId8d || '');
  const [details, setDetails] = useState<EightDDetails | null>(null);

  // Etapa ativa do 8D (1 a 8)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [subTab4D, setSubTab4D] = useState<'ishikawa' | 'henkaten' | 'entrevista'>('ishikawa');

  // Modais
  const [modalNovaCausaOpen, setModalNovaCausaOpen] = useState(false);
  const [modal5PQOpen, setModal5PQOpen] = useState(false);
  const [causaAtiva5PQ, setCausaAtiva5PQ] = useState<IshikawaItem | null>(null);
  
  // Modal Nova Ação (5D / 6D / 7D)
  const [modalNovaAcaoOpen, setModalNovaAcaoOpen] = useState(false);
  const [etapaOrigemAcao, setEtapaOrigemAcao] = useState<'5D' | '6D' | '7D'>('5D');
  const [causaPreDefinida, setCausaPreDefinida] = useState('');

  // Formulário Nova Causa Ishikawa
  const [novaCausa, setNovaCausa] = useState({
    seisms: 'Método',
    descricao_causa: '',
    ocnd: 'Ocorrência',
    okng: 'NG'
  });

  // Formulário 5 Porquês
  const [form5PQ, setForm5PQ] = useState({
    umpq: '',
    doispq: '',
    trespq: '',
    quatropq: '',
    cincopq: ''
  });

  // Formulário Nova Ação
  const [formNovaAcao, setFormNovaAcao] = useState<Partial<PlanoAcaoItem>>({
    contra_medida: '',
    responsavel_acao: currentUser.nome,
    email: currentUser.email,
    data_planejada: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    data_acompanhamento: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    tipo_acao: 'CORRETIVA',
    yokoten: 'NÃO',
    poka_yoke: 'NÃO',
    eight_d_seven_d: 'FMEA',
    evidencia_obrigatoria: 'SIM',
    validacao_acao: 'SIM'
  });

  // Notificações locais
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carrega lista inicial de 8D
  useEffect(() => {
    load8DList();
  }, []);

  const load8DList = async (forceRefresh = false) => {
    try {
      setLoadingList(true);
      const list = await eightDService.getRNCs8D(forceRefresh);
      setRncs8D(list);
      
      // Se tiver rncId ou initialId8d, seleciona automaticamente
      if (initialId8d) {
        select8D(initialId8d);
      } else if (rncId) {
        const found = list.find((it: any) => String(it.fields?.id || it.id) === String(rncId));
        if (found) {
          const autoId8d = getRncId8d(found);
          select8D(autoId8d, found);
        }
      } else if (list.length > 0) {
        // Seleciona a mais recente por padrão
        const autoId8d = getRncId8d(list[0]);
        select8D(autoId8d, list[0]);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao carregar RNCs do 8D' });
    } finally {
      setLoadingList(false);
    }
  };

  const getRncId8d = (rncItem: any): string => {
    const f = rncItem.fields || {};
    const classif = String(f.Classifica_x00e7__x00e3_o || f.classificacao || 'Qualidade').trim();
    const prefix = classif ? classif.charAt(0).toUpperCase() : 'Q';
    const num = f.id || rncItem.id || '0';
    return `${prefix} - ${num}`;
  };

  const select8D = async (targetId8d: string, rncItem?: any) => {
    try {
      setId8d(targetId8d);
      setLoadingDetails(true);
      
      if (!rncItem) {
        const found = rncs8D.find((it: any) => getRncId8d(it) === targetId8d);
        setSelectedRnc(found || null);
      } else {
        setSelectedRnc(rncItem);
      }

      const det = await eightDService.getEightDDetails(targetId8d);
      setDetails(det);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || `Erro ao carregar detalhes do 8D ${targetId8d}` });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filtragem de RNCs na barra lateral/seletor
  const filteredRncs = useMemo(() => {
    if (!searchRnc) return rncs8D;
    const q = searchRnc.toLowerCase();
    return rncs8D.filter(it => {
      const f = it.fields || {};
      const idStr = String(f.id || it.id);
      const peca = String(f.Pe_x00e7_a || f.produto || f.Title || '').toLowerCase();
      const cliente = String(f.Cliente || f.cliente || '').toLowerCase();
      return idStr.includes(q) || peca.includes(q) || cliente.includes(q);
    });
  }, [rncs8D, searchRnc]);

  // Salvar nova causa Ishikawa
  const handleSaveCausa = async () => {
    if (!novaCausa.descricao_causa.trim()) {
      alert('Por favor, informe a descrição da causa.');
      return;
    }
    try {
      await eightDService.addIshikawaCausa(id8d, novaCausa);
      setModalNovaCausaOpen(false);
      setNovaCausa({ seisms: 'Método', descricao_causa: '', ocnd: 'Ocorrência', okng: 'NG' });
      setFeedbackMsg({ type: 'success', text: 'Causa adicionada ao Ishikawa com sucesso!' });
      // Recarrega detalhes
      const det = await eightDService.getEightDDetails(id8d, true);
      setDetails(det);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Abrir modal de 5 Porquês
  const handleOpen5PQ = (causa: IshikawaItem) => {
    setCausaAtiva5PQ(causa);
    setForm5PQ({
      umpq: causa.umpq || '',
      doispq: causa.doispq || '',
      trespq: causa.trespq || '',
      quatropq: causa.quatropq || '',
      cincopq: causa.cincopq || ''
    });
    setModal5PQOpen(true);
  };

  // Salvar 5 Porquês
  const handleSave5PQ = async () => {
    if (!causaAtiva5PQ) return;
    try {
      await eightDService.updateIshikawaCausa(causaAtiva5PQ.id, form5PQ);
      setModal5PQOpen(false);
      setFeedbackMsg({ type: 'success', text: '5 Porquês atualizados com sucesso!' });
      const det = await eightDService.getEightDDetails(id8d, true);
      setDetails(det);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Automação: Gerar Contramedida no 5D a partir do 5º Porquê
  const handleGerarAcaoDo5PQ = (causa: IshikawaItem) => {
    const causaRaiz = causa.cincopq || causa.quatropq || causa.trespq || causa.descricao_causa;
    setCausaPreDefinida(causaRaiz);
    setEtapaOrigemAcao('5D');
    setFormNovaAcao({
      ...formNovaAcao,
      causa: causaRaiz,
      tipo_acao: 'CORRETIVA'
    });
    setModal5PQOpen(false);
    setModalNovaAcaoOpen(true);
  };

  // Salvar Nova Ação no Plano
  const handleSaveNovaAcao = async () => {
    if (!formNovaAcao.contra_medida?.trim()) {
      alert('Informe a contramedida a ser adotada.');
      return;
    }
    try {
      const payload: Partial<PlanoAcaoItem> = {
        ...formNovaAcao,
        id_programa_acoes: id8d,
        id_rel2: details?.plano?.id ? String(details.plano.id) : undefined,
        status: 'Aberto'
      };

      await actionPlanService.createAcao(payload);
      setModalNovaAcaoOpen(false);
      setFeedbackMsg({ type: 'success', text: `Ação para a etapa ${etapaOrigemAcao} criada com sucesso!` });
      const det = await eightDService.getEightDDetails(id8d, true);
      setDetails(det);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Validar Ação na etapa 8D
  const handleValidarAcao = async (acaoId: string | number, aprovado: boolean) => {
    const parecer = prompt(
      aprovado ? 'Parecer da Qualidade para aprovação:' : 'Motivo da reprovação técnica (solicitação de revisão):',
      aprovado ? 'Ação implementada e eficaz.' : 'Evidência insuficiente.'
    );
    if (parecer === null) return;

    try {
      await actionPlanService.validarAcao(acaoId, {
        aprovado,
        comentarios_validacao: parecer
      });
      setFeedbackMsg({ type: 'success', text: `Ação ${aprovado ? 'validada' : 'reprovada para revisão'} com sucesso!` });
      const det = await eightDService.getEightDDetails(id8d, true);
      setDetails(det);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const steps = [
    { num: 1, label: '1D Detalhes da Ocorrência', desc: 'Identificação & Contenção' },
    { num: 2, label: '2D Equipe de Trabalho', desc: 'Membros Multidisciplinares' },
    { num: 3, label: '3D Rastreabilidade', desc: 'Lotes & Etiqueta SAP' },
    { num: 4, label: '4D Causa Raiz', desc: 'Ishikawa & 5 Porquês' },
    { num: 5, label: '5D Ações Corretivas', desc: 'Contramedidas de Causa' },
    { num: 6, label: '6D Abrangência', desc: 'Yokoten & Poka-Yoke' },
    { num: 7, label: '7D Ações Preventivas', desc: 'FMEA, TP & Auditoria' },
    { num: 8, label: '8D Validação & Fechamento', desc: 'Homologação & Dossiê' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Top Banner & Header de Navegação */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo Corporativo IATF 16949 • Gestamp Brasil</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-3">
            Gestão de 8D & Análise de Causa Raiz
            {id8d && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold rounded-full">
                {id8d}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resolução estruturada de problemas de qualidade com integração direta ao Plano de Ação da fábrica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load8DList(true)}
            className="btn-secondary !h-9 text-xs flex items-center gap-2"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Atualizar Dados</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('impressao-8d', { id8d, rncId: selectedRnc?.id })}
            className="btn-primary !h-9 text-xs flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Dossiê 8D</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button type="button" onClick={() => setFeedbackMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid Principal: Seletor de 8D Lateral + Área de Trabalho Central */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Coluna 1: Lista / Seletor de 8D */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col h-[750px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              RNCs com 8D Aberto ({filteredRncs.length})
            </span>
          </div>

          <div className="relative mt-3 mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, peça, cliente..."
              value={searchRnc}
              onChange={e => setSearchRnc(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs gap-2">
                <RotateCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>Carregando RNCs do SharePoint...</span>
              </div>
            ) : filteredRncs.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-10">
                Nenhuma RNC com 8D encontrada.
              </div>
            ) : (
              filteredRncs.map(it => {
                const f = it.fields || {};
                const targetId = getRncId8d(it);
                const isSelected = targetId === id8d;
                return (
                  <div
                    key={it.id}
                    onClick={() => select8D(targetId, it)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 font-display">
                        {targetId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        RNC #{f.id || it.id}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {f.Pe_x00e7_a || f.produto || f.Title || 'Peça não informada'}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                      <span>{f.Cliente || f.cliente || 'Gestamp'}</span>
                      <span>{f.Data_x0020_da_x0020_ocorr_x00ea_ ? formatDateBR(f.Data_x0020_da_x0020_ocorr_x00ea_) : ''}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2, 3 e 4: Painel de Trabalho do 8D com as 8 Etapas */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Stepper Horizontal das 8 Etapas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] gap-2">
              {steps.map(s => {
                const isActive = activeStep === s.num;
                const isDone = activeStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setActiveStep(s.num)}
                    className={`flex-1 flex flex-col items-center p-2.5 rounded-xl transition cursor-pointer text-center relative ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : isDone 
                          ? 'bg-slate-50 text-slate-700 hover:bg-slate-100' 
                          : 'bg-transparent text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isActive ? 'bg-white text-blue-600' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                      </span>
                      <span>{s.num}D</span>
                    </div>
                    <span className={`text-[11px] mt-1 font-medium truncate max-w-[100px] ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {s.label.replace(`${s.num}D `, '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo da Etapa Ativa */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs min-h-[550px]">
            
            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400">
                <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Carregando dados unificados do 8D...</span>
              </div>
            ) : !details ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                Selecione uma RNC ao lado para visualizar a tratativa de 8D.
              </div>
            ) : (
              <div>
                
                {/* 1D: DETALHES DA OCORRÊNCIA */}
                {activeStep === 1 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          1D • Detalhes da Ocorrência e Ações de Contenção Imediatas
                        </h2>
                        <p className="text-xs text-slate-500">
                          Identificação técnica do desvio, peça afetada, cliente e contenção de estoque.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('detalhes-8d', { rncId: selectedRnc?.id })}
                        className="btn-secondary !h-8 text-xs flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir RNC Completa</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Peça / Produto</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedRnc?.fields?.Pe_x00e7_a || selectedRnc?.fields?.produto || 'N/A'}
                        </p>
                        <span className="text-xs text-slate-500 block mt-1">
                          Código: {selectedRnc?.fields?.Title || 'Sem código'}
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Cliente / Destino</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedRnc?.fields?.Cliente || selectedRnc?.fields?.cliente || 'Gestamp'}
                        </p>
                        <span className="text-xs text-slate-500 block mt-1">
                          Setor: {selectedRnc?.fields?.Setor_x0020_de_x0020_origem || selectedRnc?.fields?.setor || 'N/A'}
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Status do 8D</span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                            {details.participantes?.validar_8d || 'Em Andamento'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Descrição do Defeito</span>
                      <p className="text-sm text-slate-800 mt-1">
                        {selectedRnc?.fields?.Descri_x00e7__x00e3_o_x0020_do_x || selectedRnc?.fields?.detalhamentoOcorrencia || 'Sem descrição cadastrada.'}
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 2D (Equipe)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2D: EQUIPE DE TRABALHO */}
                {activeStep === 2 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          2D • Equipe Multidisciplinar de Resolução
                        </h2>
                        <p className="text-xs text-slate-500">
                          Equipe responsável pela investigação, contenção e implementação das contramedidas.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
                      <span className="text-xs font-bold text-blue-900 block mb-2">Participantes Atuais (Base SharePoint: lista_participantes):</span>
                      <div className="flex flex-wrap gap-2">
                        {details.participantes?.participantes_8d ? (
                          details.participantes.participantes_8d.split(',').map((p, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-xs">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                              {p.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">Nenhum participante registrado ainda.</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 1D
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 3D (Rastreabilidade)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3D: RASTREABILIDADE */}
                {activeStep === 3 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          3D • Ações de Rastreabilidade e Bloqueio
                        </h2>
                        <p className="text-xs text-slate-500">
                          Identificação de lotes suspeitos, etiquetas de apontamento e quarentena de materiais.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center py-12">
                      <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Etapa de Rastreabilidade Conforme Mapeamento</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        No Canvas App original esta tela foi mantida neutra. A rastreabilidade detalhada de etiquetas SAP e lotes pode ser acessada pelo módulo dedicado.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 2D
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 4D (Causa Raiz)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 4D: ANÁLISE DE CAUSA RAIZ (ISHIKAWA + 5PQ + HENKATEN) */}
                {activeStep === 4 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          4D • Análise de Causa Raiz (Ishikawa & 5 Porquês)
                        </h2>
                        <p className="text-xs text-slate-500">
                          Investigação dos 6M e decomposição dos 5 Porquês para identificação da causa raiz.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setModalNovaCausaOpen(true)}
                          className="btn-primary !h-9 text-xs flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Causa (6M)</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-abas do 4D */}
                    <div className="flex border-b border-slate-200 gap-6">
                      <button
                        type="button"
                        onClick={() => setSubTab4D('ishikawa')}
                        className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                          subTab4D === 'ishikawa' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Diagrama de Ishikawa ({details.ishikawa.length} causas)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubTab4D('henkaten')}
                        className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                          subTab4D === 'henkaten' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Matriz Henkaten (Pontos de Mudança)
                      </button>
                    </div>

                    {subTab4D === 'ishikawa' && (
                      <div className="flex flex-col gap-4">
                        {details.ishikawa.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            Nenhuma hipótese cadastrada no Ishikawa. Clique em "+ Adicionar Causa (6M)" para iniciar.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {details.ishikawa.map(causa => {
                              const isNG = causa.okng === 'NG';
                              const tem5PQ = Boolean(causa.umpq || causa.cincopq);

                              return (
                                <div 
                                  key={causa.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                                    isNG ? 'bg-rose-50/40 border-rose-200 shadow-xs' : 'bg-slate-50/60 border-slate-200'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                        {causa.seisms} • {causa.ocnd}
                                      </span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isNG ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        Status: {causa.okng}
                                      </span>
                                    </div>

                                    <p className="text-sm font-semibold text-slate-900">
                                      {causa.descricao_causa}
                                    </p>

                                    {/* 5 Porquês Resumo */}
                                    {causa.cincopq ? (
                                      <div className="mt-3 p-2.5 bg-white border border-rose-200 rounded-lg">
                                        <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider block">
                                          5º Porquê (Causa Raiz Identificada):
                                        </span>
                                        <p className="text-xs font-medium text-slate-800 mt-0.5">
                                          {causa.cincopq}
                                        </p>
                                      </div>
                                    ) : causa.umpq ? (
                                      <div className="mt-3 p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                                        1º Porquê: {causa.umpq}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => handleOpen5PQ(causa)}
                                      className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      <span>{tem5PQ ? 'Editar 5 Porquês' : 'Preencher 5 Porquês'}</span>
                                    </button>

                                    {isNG && (
                                      <button
                                        type="button"
                                        onClick={() => handleGerarAcaoDo5PQ(causa)}
                                        className="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-rose-700 flex items-center gap-1 shadow-xs"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Gerar Ação no 5D</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {subTab4D === 'henkaten' && (
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700 block mb-3 uppercase tracking-wider">
                          Matriz 6M de Pontos de Mudança (Henkaten)
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['Método', 'Máquina', 'Mão de obra', 'Material', 'Medição', 'Meio ambiente'].map((m, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                              <span className="text-[11px] font-bold text-slate-500">{m}</span>
                              <p className="text-xs font-semibold text-slate-800 mt-1">Nenhuma alteração de processo reportada</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(5)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 5D (Ações Corretivas)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 5D: AÇÕES CORRETIVAS */}
                {activeStep === 5 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          5D • Ações Corretivas (Plano de Ação Integrado)
                        </h2>
                        <p className="text-xs text-slate-500">
                          Contramedidas permanentes eliminando a causa raiz identificada no 4D.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEtapaOrigemAcao('5D');
                          setCausaPreDefinida('');
                          setFormNovaAcao({ ...formNovaAcao, tipo_acao: 'CORRETIVA' });
                          setModalNovaAcaoOpen(true);
                        }}
                        className="btn-primary !h-9 text-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nova Ação Corretiva</span>
                      </button>
                    </div>

                    {/* Lista de Ações do 5D */}
                    <div className="flex flex-col gap-3">
                      {details.acoes.filter(a => a.tipo_acao === 'CORRETIVA' || !a.tipo_acao).length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          Nenhuma ação corretiva registrada para este 8D. Clique no botão acima para adicionar.
                        </div>
                      ) : (
                        details.acoes.filter(a => a.tipo_acao === 'CORRETIVA' || !a.tipo_acao).map(acao => (
                          <div key={acao.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  acao.status === 'Validado' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : acao.status === 'Concluído' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {acao.status}
                                </span>
                                <span className="text-xs text-slate-400">ID #{acao.id}</span>
                                {acao.causa && (
                                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
                                    • Causa: {acao.causa}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-slate-900">{acao.contra_medida}</p>
                              <div className="text-xs text-slate-500 flex items-center gap-4 mt-2">
                                <span>Responsável: <strong>{acao.responsavel_acao}</strong></span>
                                <span>Prazo: <strong>{formatDateBR(acao.data_planejada)}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 4D
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(6)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 6D (Abrangência)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 6D: ABRANGÊNCIA (YOKOTEN) & POKA-YOKE */}
                {activeStep === 6 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          6D • Validação de Abrangência (Yokoten) & Poka-Yoke
                        </h2>
                        <p className="text-xs text-slate-500">
                          Disseminação da solução para outros postos, linhas semelhantes e adoção de dispositivos anti-erro.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEtapaOrigemAcao('6D');
                          setFormNovaAcao({ ...formNovaAcao, yokoten: 'SIM', tipo_acao: 'MELHORIA' });
                          setModalNovaAcaoOpen(true);
                        }}
                        className="btn-primary !h-9 text-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nova Ação Yokoten</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {details.acoes.filter(a => a.yokoten === 'SIM' || a.poka_yoke === 'SIM').length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          Nenhuma ação de abrangência/Yokoten registrada.
                        </div>
                      ) : (
                        details.acoes.filter(a => a.yokoten === 'SIM' || a.poka_yoke === 'SIM').map(acao => (
                          <div key={acao.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              Yokoten: {acao.yokoten} • Poka-Yoke: {acao.poka_yoke}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 mt-2">{acao.contra_medida}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(5)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 5D
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(7)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 7D (Prevenção)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 7D: AÇÕES PREVENTIVAS (FMEA, TP, AUDITORIA) */}
                {activeStep === 7 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          7D • Ações Preventivas (3 Eixos)
                        </h2>
                        <p className="text-xs text-slate-500">
                          Revisão obrigatória de FMEA, Trabalho Padronizado e Auditoria Escalonada.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEtapaOrigemAcao('7D');
                          setFormNovaAcao({ ...formNovaAcao, tipo_acao: 'PREVENTIVA' });
                          setModalNovaAcaoOpen(true);
                        }}
                        className="btn-primary !h-9 text-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nova Ação 7D</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['FMEA', 'Trabalho Padronizado', 'Auditoria Escalonada'].map((eixo, idx) => {
                        const count = details.acoes.filter(a => a.eight_d_seven_d === eixo).length;
                        return (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-xs font-bold text-slate-900 block font-display">{eixo}</span>
                            <span className="text-xs text-slate-500 mt-1 block">{count} ações cadastradas</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(6)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 6D
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(8)}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <span>Avançar para 8D (Homologação)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 8D: VALIDAÇÃO TÉCNICA E HOMOLOGAÇÃO FINAL */}
                {activeStep === 8 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 font-display">
                          8D • Validação Técnica de Eficácia & Homologação da Qualidade
                        </h2>
                        <p className="text-xs text-slate-500">
                          Auditoria das contramedidas executadas e homologação formal de encerramento do relatório.
                        </p>
                      </div>
                    </div>

                    {/* Ações Pendentes de Validação */}
                    <div className="flex flex-col gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Ações Concluídas aguardando Homologação da Qualidade:
                      </span>

                      {details.acoes.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                          Nenhuma ação cadastrada para este 8D.
                        </div>
                      ) : (
                        details.acoes.map(acao => (
                          <div key={acao.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  acao.status === 'Validado' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {acao.status}
                                </span>
                                <span className="text-xs font-semibold text-slate-800">{acao.responsavel_acao}</span>
                              </div>
                              <p className="text-sm font-semibold text-slate-900">{acao.contra_medida}</p>
                              {acao.comentarios_evidencia && (
                                <p className="text-xs text-slate-600 mt-1 italic">
                                  Evidência informada: "{acao.comentarios_evidencia}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleValidarAcao(acao.id, true)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Validar Ação</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleValidarAcao(acao.id, false)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Solicitar Revisão</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(7)}
                        className="btn-secondary !h-10 text-xs"
                      >
                        Voltar para 7D
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('impressao-8d', { id8d, rncId: selectedRnc?.id })}
                        className="btn-primary !h-10 text-xs flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Concluir e Emitir Dossiê 8D em PDF</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL 1: Nova Causa Ishikawa (6M) */}
      {modalNovaCausaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Adicionar Hipótese ao Ishikawa (6M)</h3>
            <p className="text-xs text-slate-500 mb-4">Classifique a causa conforme a metodologia dos 6M e defina o status inicial.</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Categoria 6M</label>
                <select
                  value={novaCausa.seisms}
                  onChange={e => setNovaCausa({ ...novaCausa, seisms: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Método">Método</option>
                  <option value="Máquina">Máquina</option>
                  <option value="Mão de obra">Mão de obra</option>
                  <option value="Material">Material</option>
                  <option value="Medição">Medição</option>
                  <option value="Meio ambiente">Meio ambiente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Eixo de Análise</label>
                <select
                  value={novaCausa.ocnd}
                  onChange={e => setNovaCausa({ ...novaCausa, ocnd: e.target.value as any })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Ocorrência">Ocorrência (Por que ocorreu o defeito?)</option>
                  <option value="Não Detecção">Não Detecção (Por que o defeito não foi pego na linha?)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição Detalhada da Hipótese</label>
                <textarea
                  rows={3}
                  value={novaCausa.descricao_causa}
                  onChange={e => setNovaCausa({ ...novaCausa, descricao_causa: e.target.value })}
                  placeholder="Ex: Folga no gabarito de fixação da peça..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Status Inicial da Validação</label>
                <select
                  value={novaCausa.okng}
                  onChange={e => setNovaCausa({ ...novaCausa, okng: e.target.value as any })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="NG">NG (Hipótese Procedente - Requer 5 Porquês)</option>
                  <option value="OK">OK (Hipótese Descartada após verificação)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalNovaCausaOpen(false)}
                className="btn-secondary !h-9 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCausa}
                className="btn-primary !h-9 text-xs"
              >
                Salvar Causa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 5 Porquês Interativo */}
      {modal5PQOpen && causaAtiva5PQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Análise dos 5 Porquês (5PQ)</h3>
            <p className="text-xs text-slate-500 mb-4">
              Investigação para a causa: <strong>{causaAtiva5PQ.descricao_causa}</strong>
            </p>

            <div className="flex flex-col gap-3">
              {[
                { key: 'umpq', label: '1º Porquê' },
                { key: 'doispq', label: '2º Porquê' },
                { key: 'trespq', label: '3º Porquê' },
                { key: 'quatropq', label: '4º Porquê' },
                { key: 'cincopq', label: '5º Porquê (Causa Raiz Final)' }
              ].map(pq => (
                <div key={pq.key}>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">{pq.label}</label>
                  <input
                    type="text"
                    value={(form5PQ as any)[pq.key]}
                    onChange={e => setForm5PQ({ ...form5PQ, [pq.key]: e.target.value })}
                    placeholder={`Por que...?`}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={() => handleGerarAcaoDo5PQ(causaAtiva5PQ)}
                className="text-xs bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-3 py-2 rounded-xl hover:bg-rose-100 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gerar Contramedida no 5D</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal5PQOpen(false)}
                  className="btn-secondary !h-9 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave5PQ}
                  className="btn-primary !h-9 text-xs"
                >
                  Salvar 5PQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Nova Ação Integrada (5D, 6D, 7D) */}
      {modalNovaAcaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">
              Nova Ação • Etapa {etapaOrigemAcao}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Esta contramedida será gravada na lista 'Action plan_acoes' vinculada ao 8D ({id8d}).
            </p>

            <div className="flex flex-col gap-3">
              {formNovaAcao.causa && (
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                  <span className="font-bold text-blue-900 block">Causa Vinculada:</span>
                  <span className="text-blue-800">{formNovaAcao.causa}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contramedida / Ação a Executar</label>
                <textarea
                  rows={3}
                  value={formNovaAcao.contra_medida}
                  onChange={e => setFormNovaAcao({ ...formNovaAcao, contra_medida: e.target.value })}
                  placeholder="Descreva detalhadamente a ação..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Responsável</label>
                  <input
                    type="text"
                    value={formNovaAcao.responsavel_acao}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, responsavel_acao: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Data Planejada</label>
                  <input
                    type="date"
                    value={formNovaAcao.data_planejada}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, data_planejada: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Ação</label>
                  <select
                    value={formNovaAcao.tipo_acao}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, tipo_acao: e.target.value as any })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="CONTENÇÃO">CONTENÇÃO</option>
                    <option value="CORRETIVA">CORRETIVA</option>
                    <option value="PREVENTIVA">PREVENTIVA</option>
                    <option value="MELHORIA">MELHORIA</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Exige Evidência?</label>
                  <select
                    value={formNovaAcao.evidencia_obrigatoria}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, evidencia_obrigatoria: e.target.value as any })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalNovaAcaoOpen(false)}
                className="btn-secondary !h-9 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNovaAcao}
                className="btn-primary !h-9 text-xs"
              >
                Gravar Ação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Gestao8DView;
