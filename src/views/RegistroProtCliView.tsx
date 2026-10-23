import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Barcode, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Check, 
  Info,
  Calendar,
  Layers,
  Wrench,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  Users
} from 'lucide-react';
import { UsuarioQualidade, TipoRNC } from '../types';
import { spStore } from '../services/sharepointService';
import { CLIENTES_LIST, DEFAULT_CLIENTE } from '../constants/clientes';
import { 
  MODOS_FALHA_LIST, 
  ACOES_CONTENCAO_LIST, 
  IMPACTOS_CLIENTE_LIST 
} from '../constants/defeitos';
import { SearchableSelect, SearchableOption } from '../components/SearchableSelect';
import { formatDateBR } from '../utils/date';
import { handleSafeClick } from '../utils/selection';

interface RegistroProtCliViewProps {
  onNavigate: (screen: any, params?: any) => void;
  currentUser: UsuarioQualidade;
  fromScreen?: string;
}

export const RegistroProtCliView: React.FC<RegistroProtCliViewProps> = ({ 
  onNavigate, 
  currentUser,
  fromScreen
}) => {
  const handleBack = () => {
    if (fromScreen === 'lista-8d' || fromScreen === 'lista') {
      onNavigate('lista-8d', { tipo: 'protcliente' });
    } else {
      onNavigate('menu-2');
    }
  };

  // 1. Etiqueta SAP (Crítica para Proteção ao Cliente)
  const [etiquetaSap, setEtiquetaSap] = useState('');

  // 2. Classificação & Ocorrência (Cards 1 a 6)
  const [cliente, setCliente] = useState<string>(DEFAULT_CLIENTE);
  const [tipoRnc, setTipoRnc] = useState<TipoRNC>('Formal');
  const [codOcorrenciaCliente, setCodOcorrenciaCliente] = useState('');
  const [dataOficializacao, setDataOficializacao] = useState(new Date().toISOString().split('T')[0]);
  const [setorDeteccao, setSetorDeteccao] = useState('');
  const [dataOcorrencia, setDataOcorrencia] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState<'1º Turno' | '2º Turno' | '3º Turno' | 'Central'>('1º Turno');
  const [classificacaoSetor, setClassificacaoSetor] = useState('SOLDA 1 - ESTACIONÁRIAS');

  // 3. Produto, Engenharia & Defeito (Cards 7 a 13)
  const [finalComponente, setFinalComponente] = useState<'Peça Final' | 'Componente'>('Peça Final');
  const [produto, setProduto] = useState('53201-0D120');
  const [componente, setComponente] = useState('PAINEL DIANTEIRO');
  const [quantidadeAfetada, setQuantidadeAfetada] = useState<number>(1);
  const [modoFalha, setModoFalha] = useState<string>(MODOS_FALHA_LIST[0]);
  const [posto, setPosto] = useState('');
  const [fmds, setFmds] = useState('');
  const [caracteristicaSeguranca, setCaracteristicaSeguranca] = useState<'Sim' | 'Não'>('Não');
  const [coProduto, setCoProduto] = useState<'Sim' | 'Não'>('Não');
  const [carryOver, setCarryOver] = useState<'Sim' | 'Não'>('Não');

  // 4. Detalhamento Técnico & Impacto no Cliente (Cards 10, 11)
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [impactoCliente, setImpactoCliente] = useState<string>(IMPACTOS_CLIENTE_LIST[0]);
  const [localDeteccaoCliente, setLocalDeteccaoCliente] = useState('');

  // 5. Contenção Imediata Inicial (Cards 21, 23)
  const [acoesContencao, setAcoesContencao] = useState<string>(ACOES_CONTENCAO_LIST[0]);
  const [oQueFazer, setOQueFazer] = useState('Bloquear peças com a etiqueta SAP informada e realizar triagem 100%.');

  // Estados de controle e feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Catálogos e opções
  const produtosDoCliente = spStore.getProdutosPorCliente(cliente);
  const componentesDoProduto = spStore.getComponentesPorProduto(produto);

  // Autopreenchimento de Posto / Setor / Características a partir da peça selecionada
  useEffect(() => {
    const selectedPeca = produtosDoCliente.find(p => (p.codCliText || p.material) === produto);
    if (selectedPeca) {
      if (selectedPeca.posto) setPosto(selectedPeca.posto);
      if (selectedPeca.fmds) setFmds(selectedPeca.fmds);
      if (selectedPeca.fmds) setClassificacaoSetor(selectedPeca.fmds);
      if (selectedPeca.caracteristicaSeguranca) {
        setCaracteristicaSeguranca(selectedPeca.caracteristicaSeguranca);
      }
      if (selectedPeca.coProduto) {
        setCoProduto(selectedPeca.coProduto);
      }
      if (selectedPeca.carryOver) {
        setCarryOver(selectedPeca.carryOver === 'Sim' ? 'Sim' : 'Não');
      }
    }
  }, [produto, cliente]);

  const optionsClientes: SearchableOption[] = useMemo(() => {
    return CLIENTES_LIST.map(c => ({
      value: c,
      label: c,
      badge: 'Montadora'
    }));
  }, []);

  const optionsProdutos: SearchableOption[] = useMemo(() => {
    return produtosDoCliente.map(p => ({
      value: p.codCliText || p.material,
      label: `${p.codCliText ? `${p.codCliText} • ` : ''}${p.descricao || p.componente}`,
      sublabel: `SAP: ${p.material || 'N/D'} | Posto: ${p.posto || 'N/D'} | FMDS: ${p.fmds || 'N/D'}`,
      badge: p.cliente || undefined
    }));
  }, [produtosDoCliente]);

  const optionsComponentes: SearchableOption[] = useMemo(() => {
    return componentesDoProduto.map(c => ({
      value: c.componente || c.descricao || c.codCliText || c.material,
      label: `${c.codCliText ? `${c.codCliText} • ` : ''}${c.componente || c.descricao}`,
      sublabel: `SAP: ${c.material || 'N/D'} | Nível: ${c.nestingLevel ?? 0}`,
      badge: c.carryOver === 'Sim' ? 'Carry-Over' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    }));
  }, [componentesDoProduto]);

  const optionsModosFalha: SearchableOption[] = useMemo(() => {
    return MODOS_FALHA_LIST.map(m => ({
      value: m,
      label: m
    }));
  }, []);

  const handleClienteChange = (novoCliente: string) => {
    setCliente(novoCliente);
    const produtos = spStore.getProdutosPorCliente(novoCliente);
    if (produtos.length > 0) {
      const firstProdCode = produtos[0].codCliText || produtos[0].material;
      setProduto(firstProdCode);
      const comps = spStore.getComponentesPorProduto(firstProdCode);
      setComponente(comps[0] ? (comps[0].componente || comps[0].descricao) : produtos[0].descricao);
    }
  };

  const handleProdutoChange = (novoProd: string) => {
    setProduto(novoProd);
    const comps = spStore.getComponentesPorProduto(novoProd);
    if (comps.length > 0) {
      setComponente(comps[0].componente || comps[0].descricao);
    }
  };

  const isValidSap = etiquetaSap.length === 9 && /^\d+$/.test(etiquetaSap);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedEtiqueta = etiquetaSap.trim();
    if (trimmedEtiqueta.length !== 9 || !/^\d+$/.test(trimmedEtiqueta)) {
      newErrors.etiquetaSap = 'A Etiqueta SAP deve conter exatamente 9 dígitos numéricos!';
    }

    if (tipoRnc === 'Formal' && !codOcorrenciaCliente.trim()) {
      newErrors.codOcorrenciaCliente = 'O código da ocorrência do cliente é obrigatório para ocorrências Formais.';
    }

    if (tipoRnc === 'Interno' && !setorDeteccao.trim()) {
      newErrors.setorDeteccao = 'Informe a área de detecção no chão de fábrica.';
    }

    if (!descricaoProblema.trim()) {
      newErrors.descricaoProblema = 'A descrição do defeito / sintoma é obrigatória.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({
        type: 'error',
        message: 'Por favor, corrija os campos obrigatórios destacados em vermelho.'
      });
      return;
    }

    setErrors({});

    const savedRecord = spStore.saveRNC({
      cliente,
      tipoRnc,
      status: 'Relatório Inicial',
      codOcorrenciaCliente: tipoRnc === 'Formal' ? codOcorrenciaCliente.trim() : undefined,
      dataOficializacao: tipoRnc === 'Formal' ? dataOficializacao : undefined,
      setorDeteccao: tipoRnc === 'Interno' ? setorDeteccao.trim() : 'Chão de Fábrica',
      dataOcorrencia,
      turno,
      classificacaoSetor: classificacaoSetor || fmds || 'SOLDA 1 - ESTACIONÁRIAS',
      finalComponente,
      produto,
      componente,
      quantidadeAfetada: Number(quantidadeAfetada) || 1,
      modoFalha,
      descricaoProblema: descricaoProblema.trim(),
      impactoCliente,
      posto: posto.trim() || localDeteccaoCliente.trim(),
      fmds: fmds.trim() || 'Geral',
      caracteristicaSeguranca,
      coProduto,
      carryOver,
      reincidente: 'NÃO',
      documentoRastreabilidade: 'Etiqueta SAP',
      codigoRastreabilidade: trimmedEtiqueta,
      protcliente: 'Sim',
      detector: currentUser.nome,
      reDetector: currentUser.reAcesso,
      acoesContencao,
      oQueFazer
    });

    setNotification({
      type: 'success',
      message: `Proteção ao Cliente registrada com sucesso! RNC #${savedRecord.id} gerada para a etiqueta SAP ${trimmedEtiqueta}.`
    });

    setTimeout(() => {
      onNavigate('detalhes-8d', { rncId: savedRecord.id });
    }, 1200);
  };

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
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 p-1 text-slate-400 hover:text-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. BARRA SUPERIOR: CONTEXTO, TÍTULO E AÇÕES (LARGURA TOTAL IGUAL AO NOVO 8D) */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleBack}
            className="btn-secondary h-9 px-3 text-xs"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-display font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                Novo Lançamento
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Proteção ao Cliente
              </span>
            </div>
            <h1 className="text-base sm:text-2xl font-display font-bold text-slate-900 mt-0.5">
              Nova Proteção ao Cliente
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Cadastro de contenção imediata e rastreabilidade SAP para bloqueio na fábrica e proteção das montadoras.
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
            onClick={handleSubmit}
            className="btn-primary h-9 px-4 text-xs font-semibold shadow-sm hover:shadow flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="font-display">
              Salvar e Acionar Contenção
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* ========================================================================= */}
        {/* CARD PRINCIPAL: ETIQUETA SAP (9 DÍGITOS NUMÉRICOS)                       */}
        {/* ========================================================================= */}
        <div className={`card-saas p-4 sm:p-5 transition-all border-2 ${
          isValidSap 
            ? 'bg-emerald-50/40 border-emerald-400' 
            : errors.etiquetaSap
            ? 'bg-rose-50/50 border-rose-400'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-[#0f6cbd]" />
              <span>Etiqueta SAP (Exatamente 9 Dígitos Numéricos)</span>
              <span className="text-rose-600 font-bold">*</span>
            </label>

            <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto ${
              isValidSap 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {isValidSap ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{etiquetaSap.length}/9 dígitos</span>
            </span>
          </div>

          <input 
            type="text"
            maxLength={9}
            inputMode="numeric"
            className={`w-full h-12 px-4 rounded-xl border font-mono font-bold text-center tracking-[0.25em] text-xl focus:outline-none transition shadow-inner ${
              isValidSap 
                ? 'border-emerald-500 bg-white text-emerald-800 focus:ring-2 focus:ring-emerald-500/20' 
                : 'border-rose-300 bg-white text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            }`}
            placeholder="000000000"
            value={etiquetaSap}
            onChange={e => {
              setEtiquetaSap(e.target.value.replace(/\D/g, ''));
              if (errors.etiquetaSap) {
                setErrors(prev => ({ ...prev, etiquetaSap: '' }));
              }
            }}
            required
            autoFocus
          />

          {errors.etiquetaSap && (
            <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.etiquetaSap}</span>
            </p>
          )}

          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Padrão Gestamp Sorocaba: Apenas números de série/etiqueta SAP com 9 posições numéricas são aceitos para bloqueio imediato no WMS e expedição.</span>
          </p>
        </div>

        {/* ========================================================================= */}
        {/* GRUPO 1: INFORMAÇÕES DO CLIENTE & OCORRÊNCIA (CARDS 1 A 6)               */}
        {/* ========================================================================= */}
        <div className="card-saas p-5 flex flex-col gap-4 bg-white border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-[#0f6cbd]" />
            <h2 className="text-sm font-bold text-slate-900">
              1. Informações do Cliente & Ocorrência (Cards 1 a 6)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Cliente / Montadora */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Cliente (Montadora) <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={cliente}
                onChange={val => handleClienteChange(val)}
                placeholder="Selecione a montadora..."
                searchPlaceholder="Pesquisar cliente/montadora..."
                options={optionsClientes}
              />
            </div>

            {/* Tipo de Ocorrência (Formal, Informal, Interno) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Tipo de Ocorrência <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(['Formal', 'Informal', 'Interno'] as TipoRNC[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoRnc(t)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer select-none ${
                      tipoRnc === t 
                        ? 'bg-white text-[#0f6cbd] shadow-2xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Turno */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Turno da Ocorrência <span className="text-rose-500">*</span>
              </label>
              <select
                className="form-input text-xs"
                value={turno}
                onChange={e => setTurno(e.target.value as any)}
              >
                <option value="1º Turno">1º Turno</option>
                <option value="2º Turno">2º Turno</option>
                <option value="3º Turno">3º Turno</option>
                <option value="Central">Central</option>
              </select>
            </div>

            {/* Se Formal: Código da Ocorrência Cliente */}
            {tipoRnc === 'Formal' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-700">
                  Código da Ocorrência (Cliente) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: RNC-TOYOTA-8492"
                  className={`form-input text-xs font-mono font-bold ${
                    errors.codOcorrenciaCliente ? 'border-rose-500' : ''
                  }`}
                  value={codOcorrenciaCliente}
                  onChange={e => {
                    setCodOcorrenciaCliente(e.target.value);
                    if (errors.codOcorrenciaCliente) {
                      setErrors(prev => ({ ...prev, codOcorrenciaCliente: '' }));
                    }
                  }}
                />
                {errors.codOcorrenciaCliente && (
                  <span className="text-[11px] text-rose-500">{errors.codOcorrenciaCliente}</span>
                )}
              </div>
            )}

            {/* Se Formal: Data de Oficialização */}
            {tipoRnc === 'Formal' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-700">
                  Data de Oficialização no Portal
                </label>
                <input
                  type="date"
                  className="form-input text-xs"
                  value={dataOficializacao}
                  onChange={e => setDataOficializacao(e.target.value)}
                />
              </div>
            )}

            {/* Se Interno: Área de Detecção */}
            {tipoRnc === 'Interno' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-slate-700">
                  Área de Detecção (Chão de Fábrica) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Montagem Robô 33, Inspeção Final"
                  className={`form-input text-xs ${errors.setorDeteccao ? 'border-rose-500' : ''}`}
                  value={setorDeteccao}
                  onChange={e => {
                    setSetorDeteccao(e.target.value);
                    if (errors.setorDeteccao) {
                      setErrors(prev => ({ ...prev, setorDeteccao: '' }));
                    }
                  }}
                />
                {errors.setorDeteccao && (
                  <span className="text-[11px] text-rose-500">{errors.setorDeteccao}</span>
                )}
              </div>
            )}

            {/* Data da Ocorrência */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Data da Ocorrência <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                className="form-input text-xs"
                value={dataOcorrencia}
                onChange={e => setDataOcorrencia(e.target.value)}
              />
            </div>

            {/* Setor Responsável */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Setor Fabril Responsável
              </label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Ex: SOLDA 1 - ESTACIONÁRIAS"
                value={classificacaoSetor}
                onChange={e => setClassificacaoSetor(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRUPO 2: PRODUTO, ENGENHARIA & DEFEITO (CARDS 7 A 13)                    */}
        {/* ========================================================================= */}
        <div className="card-saas p-5 flex flex-col gap-4 bg-white border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Wrench className="w-4 h-4 text-[#0f6cbd]" />
            <h2 className="text-sm font-bold text-slate-900">
              2. Dados do Produto, Engenharia & Defeito (Cards 7 a 13)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Peça Final vs Componente (Card 7) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Item detectado é Produto Final ou Componente?
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(['Peça Final', 'Componente'] as const).map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFinalComponente(tipo)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer select-none ${
                      finalComponente === tipo 
                        ? 'bg-white text-[#0f6cbd] shadow-2xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Produto / Conjunto (Card 8) */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Produto / Conjunto (colpecasgerais_AA3) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {produtosDoCliente.length} itens da montadora
                </span>
              </label>
              <SearchableSelect
                value={produto}
                onChange={val => handleProdutoChange(val)}
                placeholder="Selecione o produto / conjunto..."
                searchPlaceholder="Pesquisar código, descrição ou SAP..."
                options={optionsProdutos}
              />
            </div>

            {/* Componente Afetado (Card 9) */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Componente Afetado</span>
                {componentesDoProduto.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {componentesDoProduto.length} subcomponentes vinculados
                  </span>
                )}
              </label>
              {componentesDoProduto.length > 0 ? (
                <SearchableSelect
                  value={componente}
                  onChange={val => setComponente(val)}
                  placeholder="Selecione o componente afetado..."
                  searchPlaceholder="Pesquisar subcomponente..."
                  options={optionsComponentes}
                />
              ) : (
                <input 
                  type="text"
                  className="form-input text-xs"
                  value={componente}
                  onChange={e => setComponente(e.target.value)}
                  placeholder="Digite o componente afetado..."
                />
              )}
            </div>

            {/* Quantidade Afetada (Card 10) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Quantidade Afetada <span className="text-rose-500">*</span>
              </label>
              <input 
                type="number"
                min="1"
                required
                className="form-input font-mono font-bold text-xs"
                value={quantidadeAfetada}
                onChange={e => setQuantidadeAfetada(Math.max(1, Number(e.target.value)))}
              />
            </div>

            {/* Modo de Falha / Defeito (Card 12) */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Classificação da Ocorrência / Modo de Falha <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={modoFalha}
                onChange={val => setModoFalha(val)}
                placeholder="Selecione o defeito / modo de falha..."
                searchPlaceholder="Pesquisar defeito..."
                options={optionsModosFalha}
              />
            </div>

            {/* Posto e FMDS */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Posto de Trabalho
              </label>
              <input 
                type="text"
                className="form-input text-xs"
                placeholder="Ex: ROBÔ 33"
                value={posto}
                onChange={e => setPosto(e.target.value)}
              />
            </div>

            {/* Toggles de Engenharia (Cards 12, 13) */}
            <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Item de Segurança?</span>
                  <span className="text-[11px] text-slate-500">Severidade FMEA crítica</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCaracteristicaSeguranca(prev => prev === 'Sim' ? 'Não' : 'Sim')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    caracteristicaSeguranca === 'Sim' 
                      ? 'bg-rose-600 text-white shadow-2xs' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {caracteristicaSeguranca}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Co-produto?</span>
                  <span className="text-[11px] text-slate-500">Peças espelho (LD / LE)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCoProduto(prev => prev === 'Sim' ? 'Não' : 'Sim')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    coProduto === 'Sim' 
                      ? 'bg-indigo-600 text-white shadow-2xs' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {coProduto}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Carry Over?</span>
                  <span className="text-[11px] text-slate-500">Presente em outros modelos</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCarryOver(prev => prev === 'Sim' ? 'Não' : 'Sim')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    carryOver === 'Sim' 
                      ? 'bg-amber-600 text-white shadow-2xs' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {carryOver}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRUPO 3: DETALHAMENTO TÉCNICO & IMPACTO NO CLIENTE (CARDS 10, 11)        */}
        {/* ========================================================================= */}
        <div className="card-saas p-5 flex flex-col gap-4 bg-white border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              3. Detalhamento da Ocorrência & Impacto no Cliente (Cards 10 e 11)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Impacto no Cliente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Impacto no Cliente
              </label>
              <select
                className="form-input text-xs"
                value={impactoCliente}
                onChange={e => setImpactoCliente(e.target.value)}
              >
                {IMPACTOS_CLIENTE_LIST.map(imp => (
                  <option key={imp} value={imp}>{imp}</option>
                ))}
              </select>
            </div>

            {/* Local de Detecção no Cliente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Local de Detecção na Montadora (Posto / Doca)
              </label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Ex: Armação de Carroceria, Linha Principal"
                value={localDeteccaoCliente}
                onChange={e => setLocalDeteccaoCliente(e.target.value)}
              />
            </div>

            {/* Descrição Detalhada */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Descrição Detalhada do Problema / Sintoma Identificado <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows={3}
                required
                className={`form-input text-xs min-h-[80px] py-2.5 ${errors.descricaoProblema ? 'border-rose-500' : ''}`}
                placeholder="Descreva detalhadamente a não conformidade encontrada na peça ou relatada pelo cliente..."
                value={descricaoProblema}
                onChange={e => {
                  setDescricaoProblema(e.target.value);
                  if (errors.descricaoProblema) {
                    setErrors(prev => ({ ...prev, descricaoProblema: '' }));
                  }
                }}
              />
              {errors.descricaoProblema && (
                <span className="text-[11px] text-rose-500">{errors.descricaoProblema}</span>
              )}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRUPO 4: CONTENÇÃO IMEDIATA INICIAL (CARDS 21, 23)                       */}
        {/* ========================================================================= */}
        <div className="card-saas p-5 flex flex-col gap-4 bg-white border-slate-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              4. Ações Imediatas de Contenção & Diretrizes 5W2H (Cards 21 e 23)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Ações de Contenção */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Ação de Contenção Adotada
              </label>
              <select
                className="form-input text-xs font-bold text-slate-800"
                value={acoesContencao}
                onChange={e => setAcoesContencao(e.target.value)}
              >
                {ACOES_CONTENCAO_LIST.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* O Que Fazer (Instrução Inicial) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                O Que Fazer? (Instrução Operacional Imediata)
              </label>
              <input
                type="text"
                className="form-input text-xs font-medium"
                value={oQueFazer}
                onChange={e => setOQueFazer(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* RODAPÉ DO FORMULÁRIO COM METADADOS E BOTÕES                               */}
        {/* ========================================================================= */}
        <div className="card-saas p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              Registrado por: <strong className="text-slate-800">{currentUser.nome}</strong> (RE: {currentUser.reAcesso})
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button 
              type="button" 
              className="btn-secondary h-9 px-4 text-xs font-semibold"
              onClick={handleBack}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-primary h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 border-rose-600 shadow-sm gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Salvar Proteção ao Cliente</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};

export default RegistroProtCliView;
