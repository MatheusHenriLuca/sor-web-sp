import React, { useState, useMemo } from 'react';
import { 
  Barcode, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Tag, 
  Lock, 
  Unlock,
  ArrowLeft,
  X,
  FileText,
  RotateCw,
  FileCheck2,
  MinusCircle,
  Pencil,
  Eraser,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RastreabilidadeItem, EtiquetaVivaParsed, LoteSAPParsed, RastCabeceiraParsed, UsuarioQualidade } from '../types';
import { spStore } from '../services/sharepointService';
import { formatDateBR } from '../utils/date';

interface RastreabilidadeViewProps {
  onNavigate: (screen: any, params?: any) => void;
  currentUser: UsuarioQualidade;
  rncId?: number;
}

export const RastreabilidadeView: React.FC<RastreabilidadeViewProps> = ({ onNavigate, currentUser, rncId }) => {
  const rncs = useMemo(() => spStore.getRNCs(), []);
  
  // Resolve o ID da ocorrência ativa vindo de Detalhes8DView (com fallback robusto para 6119 ou primeira RNC)
  const targetRncId = useMemo(() => {
    if (rncId) {
      const parsed = Number(rncId);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const found6119 = rncs.find(r => r.id === 6119);
    return found6119 ? 6119 : (rncs[0]?.id || 6119);
  }, [rncId, rncs]);

  const currentRnc = useMemo(() => {
    return rncs.find(r => r.id === targetRncId) || rncs[0] || {
      id: targetRncId,
      cliente: 'HYUNDAI',
      produto: 'U005000B6 - 69100-BX500 - 69100BX500 PNL ASSY-BACK COMPLETE',
      componente: '69100-BX000',
      codigoRastreabilidade: '668360689',
      documentoRastreabilidade: 'Etiqueta SAP'
    } as any;
  }, [rncs, targetRncId]);

  const prodCode = useMemo(() => {
    if (!currentRnc.produto) return 'PRODUTO';
    return currentRnc.produto.split(' - ')[0].trim();
  }, [currentRnc]);

  // Estados locais
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoComp, setNovoComp] = useState(currentRnc.componente ? currentRnc.componente.split(' - ')[0] : '');
  const [novoLote, setNovoLote] = useState('');
  const [novaQtd, setNovaQtd] = useState<number>(Number(currentRnc.quantidadeAfetada) || 1);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dados sincronizados da ocorrência ativa
  const solicitacoes = useMemo(() => spStore.getRastreabilidades(targetRncId), [targetRncId, refreshTrigger]);
  const lotes = useMemo(() => spStore.getLotesSAP(targetRncId), [targetRncId, refreshTrigger]);
  const etiquetas = useMemo(() => spStore.getEtiquetasVivas(targetRncId), [targetRncId, refreshTrigger]);
  const cabeceiras = useMemo(() => spStore.getRastCabeceiras(targetRncId), [targetRncId, refreshTrigger]);

  // Contadores totais de peças
  const totalPecasLotes = useMemo(() => lotes.reduce((acc, l) => acc + (Number(l.qtd) || 0), 0), [lotes]);
  const totalPecasCabeceiras = useMemo(() => cabeceiras.reduce((acc, c) => acc + (Number(c.qtd) || 0), 0), [cabeceiras]);
  const totalPecasEtiquetas = useMemo(() => etiquetas.reduce((acc, e) => acc + (Number(e.qtd) || 0), 0), [etiquetas]);

  const handleCadastrarRastreio = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLote = novoLote.trim();
    if (trimmedLote.length < 5) {
      setNotification({
        type: 'error',
        message: 'O código do lote deve conter pelo menos 5 dígitos numéricos!'
      });
      return;
    }

    const nextSeq = solicitacoes.length + 1;

    spStore.addRastreabilidade({
      idRnc: targetRncId,
      codComp: novoComp || currentRnc.componente || '',
      produto: prodCode,
      tipoRastreamento: currentRnc.finalComponente || 'Peça Final',
      codRastreabilidade: trimmedLote,
      docRastreabilidade: 'Etiqueta SAP',
      seqRelacionada: nextSeq,
      comando: 'rp',
      statusGeral: 'R',
      statusVerif: 'OK',
      dataHora: new Date().toISOString().split('T')[0],
      ocorrenciaAbrangencia: 'Ocorrência',
      observacao: '',
      bloqueado: true
    });

    // Adiciona o lote encontrado correspondente
    spStore.addLoteSAP({
      idRnc: targetRncId,
      seqRel: String(nextSeq),
      produto: prodCode,
      lote: trimmedLote,
      qtd: Number(novaQtd) || 1,
      data: new Date().toISOString().split('T')[0]
    });

    setNotification({
      type: 'success',
      message: `Solicitação #${nextSeq} e Lote SAP ${trimmedLote} cadastrados com sucesso!`
    });
    setNovoLote('');
    setShowNovoForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-16 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-inherit opacity-70 hover:opacity-100 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CABEÇALHO DA TELA DE RASTREABILIDADE
          - Botão Voltar direto para os detalhes da ocorrência
          - Contexto fixo da RNC ativa (sem dropdown de troca conforme solicitação)
          - Botão de Nova Solicitação e Atualizar
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => onNavigate('detalhes-8d', { rncId: targetRncId })}
            className="btn-secondary h-9 px-3 text-xs font-semibold gap-1.5 shrink-0"
            title="Voltar para Detalhes da Ocorrência"
          >
            <ArrowLeft size={16} />
            <span>Voltar para Detalhes</span>
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0b5796] flex items-center justify-center border border-blue-100 shadow-xs shrink-0">
            <Barcode size={22} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-display font-bold text-slate-900 tracking-tight">
                Lista de rastreabilidade
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Rastreamento de lotes SAP, bloqueio em fábrica e histórico de cabeceiras
            </p>
          </div>
        </div>

        {/* Card Fixo de Identificação da Ocorrência Ativa (Sem lista para escolher outras) */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-2xs px-3 py-1.5 rounded-lg text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-mono font-bold text-slate-900">
              RNC #{currentRnc.id}
            </span>
            {currentRnc.field1 && currentRnc.field1 !== `RNC-${currentRnc.id}` && (
              <span className="text-slate-400 font-normal">({currentRnc.field1})</span>
            )}
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">{currentRnc.cliente}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-600 font-semibold">{prodCode}</span>
          </div>

          <button
            type="button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="btn-secondary h-8 px-2.5 text-xs font-semibold gap-1 shrink-0"
            title="Recarregar dados"
          >
            <RotateCw size={13} className="text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => setShowNovoForm(!showNovoForm)}
            className="btn-primary h-8 px-3 text-xs font-bold gap-1.5 shrink-0 shadow-sm"
            title="Adicionar nova solicitação de rastreio"
          >
            <Plus size={14} />
            <span>Nova Solicitação</span>
            {showNovoForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Formulário Colapsável: Nova Solicitação de Rastreio no SAP */}
      {showNovoForm && (
        <div className="card-saas p-4 sm:p-5 border-blue-200 bg-blue-50/20 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-[#0b5796]" />
              <h2 className="text-xs font-display font-bold text-slate-900 uppercase tracking-wide">
                Cadastrar Nova Solicitação de Rastreamento no SAP
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowNovoForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleCadastrarRastreio} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="form-label block mb-1 text-xs">
                Código do Componente / Peça
              </label>
              <input 
                type="text" 
                className="form-input text-xs font-mono" 
                value={novoComp} 
                onChange={e => setNovoComp(e.target.value)}
                placeholder={`Ex: ${prodCode}`}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="form-label block mb-1 text-xs">
                Código do Lote SAP (Mín. 5 Dígitos) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                className="form-input text-xs font-mono font-bold" 
                value={novoLote} 
                onChange={e => setNovoLote(e.target.value)}
                placeholder="Ex: 28926"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label block mb-1 text-xs">
                Quantidade
              </label>
              <input 
                type="number" 
                className="form-input text-xs font-mono font-semibold" 
                value={novaQtd} 
                onChange={e => setNovaQtd(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="sm:col-span-2">
              <button 
                type="submit" 
                className="btn-primary w-full h-9 text-xs font-bold gap-1.5"
              >
                <Barcode size={14} />
                <span>Rastrear</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TABELA SUPERIOR: SOLICITAÇÕES DE RASTREABILIDADE
          Layout e colunas fiéis à tela do PowerApps (imagem 2):
          Seq. | Data Solic. | Prod. | Comp. | Tipo Rast. | Doc. Rast. | Rast. | Bloq. | Verif. | Ocorr. / Abrang. | Obs. | Ações
          ========================================================================= */}
      <div className="card-saas border-slate-200 overflow-hidden shadow-2xs bg-white">
        <div className="bg-[#002f6c] text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-4 h-4 text-sky-200" />
            <span className="text-xs font-bold tracking-wide uppercase">
              Solicitações de Rastreabilidade ({solicitacoes.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-100">
            Ocorrência #{currentRnc.id}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#004b87] text-white text-[11px] font-bold uppercase tracking-wider select-none border-b border-[#003b6e]">
                <th className="py-2.5 px-3 text-center w-12">Seq.</th>
                <th className="py-2.5 px-3">Data Solic.</th>
                <th className="py-2.5 px-3">Prod.</th>
                <th className="py-2.5 px-3">Comp.</th>
                <th className="py-2.5 px-3">Tipo Rast.</th>
                <th className="py-2.5 px-3">Doc. Rast.</th>
                <th className="py-2.5 px-2 text-center w-14">Rast.</th>
                <th className="py-2.5 px-2 text-center w-14">Bloq.</th>
                <th className="py-2.5 px-2 text-center w-14">Verif.</th>
                <th className="py-2.5 px-3">Ocorr. / Abrang.</th>
                <th className="py-2.5 px-3">Obs.</th>
                <th className="py-2.5 px-3 text-center w-12">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    Nenhuma solicitação de rastreabilidade cadastrada para esta ocorrência.
                  </td>
                </tr>
              ) : (
                solicitacoes.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                      {item.seqRelacionada || idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {formatDateBR(item.dataHora)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                      {item.produto || prodCode}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {item.codComp || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {item.tipoRastreamento || currentRnc.finalComponente || 'Peça Final'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.docRastreabilidade || 'Etiqueta SAP'}: {item.codRastreabilidade || currentRnc.codigoRastreabilidade || '-'} -
                    </td>
                    
                    {/* Status Rast.: Ícone Verde Documento com Texto (idêntico ao PowerApps) */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-600 text-white shadow-2xs" title="Rastreamento Realizado">
                        <FileCheck2 size={13} strokeWidth={2.5} />
                      </div>
                    </td>

                    {/* Status Bloq.: Ícone Verde Bloqueio com Traço (idêntico ao PowerApps) */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-600 text-white shadow-2xs" title="Bloqueio de Qualidade Ativo">
                        <MinusCircle size={13} strokeWidth={2.5} />
                      </div>
                    </td>

                    {/* Status Verif.: Ícone Lupa de Pesquisa (idêntico ao PowerApps) */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer" title="Verificar Rastreamento">
                        <Search size={13} strokeWidth={2.5} />
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {item.ocorrenciaAbrangencia || 'Ocorrência'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic">
                      {item.observacao || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button 
                        type="button"
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"
                        title="Editar solicitação"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          BARRA DIVISÓRIA: PRODUTO SELECIONADO & BORRACHA (REFERÊNCIA FOTO 2)
          ========================================================================= */}
      <div className="bg-slate-200/90 border border-slate-300/80 rounded-lg px-4 py-1.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-300/60 rounded transition cursor-pointer"
            title="Limpar seleção / Recarregar"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
          >
            <Eraser size={15} />
          </button>
          <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">
            {prodCode}
          </span>
        </div>
        <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">
          {currentRnc.produto}
        </span>
      </div>

      {/* =========================================================================
          3 BLOCOS INFERIORES: LOTES ENCONTRADOS, CABECEIRAS E ETIQUETAS ATIVAS
          Layout lado a lado exatamente como na Foto 2 do PowerApps
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* BLOCO 1: LOTES ENCONTRADOS (CABEÇALHO AZUL ESCURO) */}
        <div className="card-saas border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between bg-white">
          <div>
            <div className="bg-[#1a4b8c] text-white px-3.5 py-2 font-display font-bold text-xs uppercase tracking-wide flex items-center justify-between">
              <span>Lotes encontrados</span>
              <span className="text-[10px] font-mono bg-blue-950/40 px-2 py-0.5 rounded">
                {lotes.length} item(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#245fa8] text-white text-[10px] font-bold uppercase tracking-wider select-none">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Lote</th>
                    <th className="py-2 px-3 text-right">Qtd</th>
                    <th className="py-2 px-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {lotes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic text-[11px]">
                        Nenhum lote encontrado.
                      </td>
                    </tr>
                  ) : (
                    lotes.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {l.produto}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#0b5796] font-bold">
                          {l.lote}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900 tabular-nums">
                          {l.qtd}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600 font-mono text-[11px]">
                          {formatDateBR(l.data)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 flex items-center justify-between font-mono">
            <span>Peças:</span>
            <span className="text-slate-900 font-extrabold text-sm tabular-nums">
              {totalPecasLotes || ''}
            </span>
          </div>
        </div>

        {/* BLOCO 2: PEÇAS EM CABECEIRAS (CABEÇALHO VERMELHO) */}
        <div className="card-saas border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between bg-white">
          <div>
            <div className="bg-[#c51f1f] text-white px-3.5 py-2 font-display font-bold text-xs uppercase tracking-wide flex items-center justify-between">
              <span>Peças em cabeceiras</span>
              <span className="text-[10px] font-mono bg-red-950/40 px-2 py-0.5 rounded">
                {cabeceiras.length} item(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#dd3333] text-white text-[10px] font-bold uppercase tracking-wider select-none">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Lote</th>
                    <th className="py-2 px-3 text-right">Qtd</th>
                    <th className="py-2 px-3">Local</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {cabeceiras.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic text-[11px]">
                        Nenhuma peça em cabeceira retida.
                      </td>
                    </tr>
                  ) : (
                    cabeceiras.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {c.produto}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {c.lote}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900 tabular-nums">
                          {c.qtd}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {c.estoque || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 flex items-center justify-between font-mono">
            <span>Peças:</span>
            <span className="text-slate-900 font-extrabold text-sm tabular-nums">
              {totalPecasCabeceiras || ''}
            </span>
          </div>
        </div>

        {/* BLOCO 3: PEÇAS COM ETIQUETAS ATIVAS (CABEÇALHO LARANJA) */}
        <div className="card-saas border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between bg-white">
          <div>
            <div className="bg-[#e06500] text-white px-3.5 py-2 font-display font-bold text-xs uppercase tracking-wide flex items-center justify-between">
              <span>Peças com etiquetas ativas</span>
              <span className="text-[10px] font-mono bg-orange-950/40 px-2 py-0.5 rounded">
                {etiquetas.length} item(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f07510] text-white text-[10px] font-bold uppercase tracking-wider select-none">
                    <th className="py-2 px-2.5">Item</th>
                    <th className="py-2 px-2.5">Etiquetas SAP</th>
                    <th className="py-2 px-2">Lote</th>
                    <th className="py-2 px-2 text-right">Qtd</th>
                    <th className="py-2 px-2 text-center">Bloq.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {etiquetas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic text-[11px]">
                        Nenhuma etiqueta ativa retida.
                      </td>
                    </tr>
                  ) : (
                    etiquetas.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-900">
                          {e.produto}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-slate-800 font-bold">
                          {e.etiquetasap}
                        </td>
                        <td className="py-2 px-2 font-mono text-slate-600">
                          {e.lote}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-slate-900 tabular-nums">
                          {e.qtd}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {e.statusBloqueio === 'bloq' ? (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              BLOQ
                            </span>
                          ) : (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              LIB
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 flex items-center justify-between font-mono">
            <span>Peças:</span>
            <span className="text-slate-900 font-extrabold text-sm tabular-nums">
              {totalPecasEtiquetas || ''}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
