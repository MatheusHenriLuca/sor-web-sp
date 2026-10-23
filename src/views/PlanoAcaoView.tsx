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
  ChevronRight
} from 'lucide-react';
import { UsuarioQualidade, PlanoAcaoMestre, PlanoAcaoItem, StatusAcao } from '../types';
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

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState<string>(idprograma || 'Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('Todas');
  const [filtroMinhasAcoes, setFiltroMinhasAcoes] = useState<boolean>(false);

  // Modais
  const [modalNovoPlanoOpen, setModalNovoPlanoOpen] = useState(false);
  const [modalNovaAcaoOpen, setModalNovaAcaoOpen] = useState(false);
  const [modalConcluirOpen, setModalConcluirOpen] = useState(false);
  const [modalValidarOpen, setModalValidarOpen] = useState(false);
  const [acaoAtiva, setAcaoAtiva] = useState<PlanoAcaoItem | null>(null);

  // Forms
  const [formNovoPlano, setFormNovoPlano] = useState({
    indicador_programa_estrategico: 'ATENDIMENTO AO CLIENTE',
    setor_: 'QUALIDADE',
    prioridade: 'Alta' as any,
    descricao_problema_oportunidade: '',
    posto_: '',
    produto_: ''
  });

  const [formNovaAcao, setFormNovaAcao] = useState<Partial<PlanoAcaoItem>>({
    contra_medida: '',
    responsavel_acao: currentUser.nome,
    email: currentUser.email,
    data_planejada: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    data_acompanhamento: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    tipo_acao: 'CORRETIVA',
    evidencia_obrigatoria: 'SIM',
    validacao_acao: 'SIM'
  });

  const [formConclusao, setFormConclusao] = useState({
    comentarios_evidencia: '',
    data_conclusao: new Date().toISOString().split('T')[0]
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

  // Lista filtrada
  const acoesFiltradas = useMemo(() => {
    return acoes.filter(acao => {
      // Busca texto
      if (search) {
        const q = search.toLowerCase();
        const contra = (acao.contra_medida || '').toLowerCase();
        const resp = (acao.responsavel_acao || '').toLowerCase();
        const idStr = String(acao.id);
        const refProg = (acao.id_programa_acoes || '').toLowerCase();
        if (!contra.includes(q) && !resp.includes(q) && !idStr.includes(q) && !refProg.includes(q)) {
          return false;
        }
      }

      // Filtro Minhas Ações
      if (filtroMinhasAcoes) {
        const resp = (acao.responsavel_acao || '').toLowerCase();
        const userNome = (currentUser.nome || '').toLowerCase();
        if (!resp.includes(userNome)) return false;
      }

      return true;
    });
  }, [acoes, search, filtroMinhasAcoes, currentUser]);

  // Contadores para KPIs
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

  // Colunas do Kanban
  const kanbanColumns: { status: StatusAcao; label: string; color: string; badge: string }[] = [
    { status: 'Aberto', label: 'Aberto / Em Andamento', color: 'border-blue-200 bg-blue-50/30', badge: 'bg-blue-100 text-blue-800' },
    { status: 'Atrasado', label: 'Prazo Vencido (Atrasado)', color: 'border-rose-200 bg-rose-50/30', badge: 'bg-rose-100 text-rose-800' },
    { status: 'Concluído', label: 'Aguardando Validação', color: 'border-amber-200 bg-amber-50/30', badge: 'bg-amber-100 text-amber-800' },
    { status: 'Validado', label: 'Homologado / Eficaz', color: 'border-emerald-200 bg-emerald-50/30', badge: 'bg-emerald-100 text-emerald-800' }
  ];

  // Ações de criação e validação
  const handleCreatePlano = async () => {
    if (!formNovoPlano.descricao_problema_oportunidade.trim()) {
      alert('Informe a descrição do problema ou oportunidade.');
      return;
    }
    try {
      await actionPlanService.createPlano({
        ...formNovoPlano,
        status: 'Aberto',
        responsavel_abertura: currentUser.nome,
        data_abertura: new Date().toISOString()
      });
      setModalNovoPlanoOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Plano de Ação mestre criado com sucesso!' });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAcao = async () => {
    if (!formNovaAcao.contra_medida?.trim()) {
      alert('Informe a contramedida a ser realizada.');
      return;
    }
    try {
      await actionPlanService.createAcao({
        ...formNovaAcao,
        status: 'Aberto'
      });
      setModalNovaAcaoOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Contramedida adicionada com sucesso!' });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConcluirAcao = async () => {
    if (!acaoAtiva) return;
    try {
      await actionPlanService.concluirAcao(acaoAtiva.id, {
        comentarios_evidencia: formConclusao.comentarios_evidencia,
        data_conclusao: formConclusao.data_conclusao,
        validacao_acao: acaoAtiva.validacao_acao
      });
      setModalConcluirOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Ação concluída com sucesso!' });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleValidarAcao = async () => {
    if (!acaoAtiva) return;
    try {
      await actionPlanService.validarAcao(acaoAtiva.id, {
        aprovado: formValidacao.aprovado,
        comentarios_validacao: formValidacao.comentarios_validacao
      });
      setModalValidarOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Validação técnica registrada com sucesso!' });
      loadData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Módulo de Acompanhamento Fabril • Gestamp Brasil</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-3">
            Plano de Ação & Gestão de Contramedidas
            {idprograma && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold rounded-full">
                {idprograma}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de ações corretivas, preventivas e de melhoria para toda a planta, integrado às ocorrências de 8D.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            className="btn-secondary !h-9 text-xs flex items-center gap-1.5"
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
            <span>Novo Cabeçalho de Plano</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovaAcaoOpen(true)}
            className="btn-primary !h-9 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Ação</span>
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

      {/* Cards de KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total de Ações</span>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{kpis.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Abertas / Em Curso</span>
          <p className="text-2xl font-bold font-display text-blue-600 mt-1">{kpis.abertas}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Prazo Atrasado</span>
          <p className="text-2xl font-bold font-display text-rose-600 mt-1">{kpis.atrasadas}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Aguardando Validação</span>
          <p className="text-2xl font-bold font-display text-amber-600 mt-1">{kpis.concluidas}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Homologadas</span>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">{kpis.validadas}</p>
        </div>
      </div>

      {/* Barra de Filtros e Alternância de Visualização */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar contramedida, responsável, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filtroMinhasAcoes}
              onChange={e => setFiltroMinhasAcoes(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Minhas Ações</span>
          </label>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            <span>Lista</span>
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
        
        /* VISUALIZAÇÃO KANBAN */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const acoesDaColuna = acoesFiltradas.filter(a => getStatusDinamico(a) === col.status);

            return (
              <div 
                key={col.status} 
                className={`flex flex-col rounded-2xl border p-4 shadow-xs min-h-[500px] ${col.color}`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                    {col.label}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${col.badge}`}>
                    {acoesDaColuna.length}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                  {acoesDaColuna.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      Nenhuma ação neste status.
                    </div>
                  ) : (
                    acoesDaColuna.map(acao => (
                      <div
                        key={acao.id}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400">#{acao.id}</span>
                            {acao.id_programa_acoes && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                8D: {acao.id_programa_acoes}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {acao.contra_medida}
                          </p>

                          {acao.causa && (
                            <p className="text-[11px] text-slate-500 mt-1 italic truncate">
                              Causa: {acao.causa}
                            </p>
                          )}

                          <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-slate-800 truncate">{acao.responsavel_acao}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Prazo: <strong>{formatDateBR(acao.data_planejada)}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação no Card */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                          {col.status !== 'Validado' && col.status !== 'Concluído' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAcaoAtiva(acao);
                                setModalConcluirOpen(true);
                              }}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 border border-blue-100"
                            >
                              Concluir Ação
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
                              <span>Validar (Qualidade)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* VISUALIZAÇÃO EM TABELA */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Vínculo 8D</th>
                <th className="p-3.5">Contramedida</th>
                <th className="p-3.5">Responsável</th>
                <th className="p-3.5">Prazo Planejado</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {acoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Nenhuma ação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                acoesFiltradas.map(acao => {
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
                      <td className="p-3.5 font-semibold text-slate-900 max-w-xs">{acao.contra_medida}</td>
                      <td className="p-3.5 font-medium">{acao.responsavel_acao}</td>
                      <td className="p-3.5">{formatDateBR(acao.data_planejada)}</td>
                      <td className="p-3.5">{acao.tipo_acao}</td>
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
                        {status === 'Concluído' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAcaoAtiva(acao);
                              setModalValidarOpen(true);
                            }}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
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
                            className="text-xs text-blue-600 font-semibold hover:underline"
                          >
                            Concluir
                          </button>
                        ) : (
                          <span className="text-slate-400">Finalizado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: Novo Cabeçalho de Plano de Ação Mestre */}
      {modalNovoPlanoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Novo Plano de Ação (Mestre)</h3>
            <p className="text-xs text-slate-500 mb-4">Cria o cabeçalho mestre na lista 'Action plan' para agrupar contramedidas.</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Programa Estratégico</label>
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
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Setor</label>
                  <input
                    type="text"
                    value={formNovoPlano.setor_}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, setor_: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prioridade</label>
                  <select
                    value={formNovoPlano.prioridade}
                    onChange={e => setFormNovoPlano({ ...formNovoPlano, prioridade: e.target.value as any })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição do Problema ou Oportunidade</label>
                <textarea
                  rows={3}
                  value={formNovoPlano.descricao_problema_oportunidade}
                  onChange={e => setFormNovoPlano({ ...formNovoPlano, descricao_problema_oportunidade: e.target.value })}
                  placeholder="Descreva o desvio identificado..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
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
                Salvar Plano Mestre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Nova Ação Detalhada */}
      {modalNovaAcaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Nova Contramedida / Ação</h3>
            <p className="text-xs text-slate-500 mb-4">Cadastra a ação detalhada na lista 'Action plan_acoes'.</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contramedida a Ser Executada</label>
                <textarea
                  rows={3}
                  value={formNovaAcao.contra_medida}
                  onChange={e => setFormNovaAcao({ ...formNovaAcao, contra_medida: e.target.value })}
                  placeholder="Descreva a ação..."
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prazo Planejado</label>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Validação Obrigatória?</label>
                  <select
                    value={formNovaAcao.validacao_acao}
                    onChange={e => setFormNovaAcao({ ...formNovaAcao, validacao_acao: e.target.value as any })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SIM">SIM (Qualidade precisa validar)</option>
                    <option value="NÃO">NÃO (Auto-homologado ao concluir)</option>
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
                onClick={handleCreateAcao}
                className="btn-primary !h-9 text-xs"
              >
                Criar Ação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Concluir Ação pelo Responsável */}
      {modalConcluirOpen && acaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Concluir Ação #{acaoAtiva.id}</h3>
            <p className="text-xs text-slate-500 mb-4">Relate a contramedida executada e anexe as evidências técnicas.</p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs">
              <span className="font-bold text-slate-700 block">Ação:</span>
              <span className="text-slate-900 font-semibold">{acaoAtiva.contra_medida}</span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Data Efetiva de Conclusão</label>
                <input
                  type="date"
                  value={formConclusao.data_conclusao}
                  onChange={e => setFormConclusao({ ...formConclusao, data_conclusao: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Relato da Evidência Implementada</label>
                <textarea
                  rows={3}
                  value={formConclusao.comentarios_evidencia}
                  onChange={e => setFormConclusao({ ...formConclusao, comentarios_evidencia: e.target.value })}
                  placeholder="Descreva o que foi feito para sanar a causa..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                className="btn-primary !h-9 text-xs"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Validar Ação pela Qualidade */}
      {modalValidarOpen && acaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Validação Técnica (Qualidade)</h3>
            <p className="text-xs text-slate-500 mb-4">Auditoria da eficácia para a Ação #{acaoAtiva.id}.</p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs">
              <span className="font-bold text-slate-700 block">Contramedida:</span>
              <p className="text-slate-900 font-semibold">{acaoAtiva.contra_medida}</p>
              {acaoAtiva.comentarios_evidencia && (
                <p className="text-slate-600 mt-1 italic">Evidência: "{acaoAtiva.comentarios_evidencia}"</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Decisão do Auditor</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormValidacao({ ...formValidacao, aprovado: true })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                      formValidacao.aprovado ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Aprovar (Validar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormValidacao({ ...formValidacao, aprovado: false })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                      !formValidacao.aprovado ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Reprovar (Revisar)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Parecer Técnico / Justificativa</label>
                <textarea
                  rows={3}
                  value={formValidacao.comentarios_validacao}
                  onChange={e => setFormValidacao({ ...formValidacao, comentarios_validacao: e.target.value })}
                  placeholder="Informe os apontamentos da auditoria..."
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
                className="btn-primary !h-9 text-xs"
              >
                Gravar Parecer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default PlanoAcaoView;
