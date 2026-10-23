import React, { useEffect, useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Wrench, 
  FileText, 
  Layers, 
  ShieldAlert, 
  Users, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Camera,
  Maximize2,
  Hash
} from 'lucide-react';
import { RNCRecord } from '../types';
import { ImageWithFallback } from './ImageWithFallback';
import { formatDateBR } from '../utils/date';

interface RncDetalhesModalProps {
  rnc: RNCRecord | null | undefined;
  onClose: () => void;
  onOpenFullPage?: (id: number) => void;
}

export const RncDetalhesModal: React.FC<RncDetalhesModalProps> = ({ 
  rnc, 
  onClose,
  onOpenFullPage
}) => {
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fotoAmpliada) {
          setFotoAmpliada(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fotoAmpliada, onClose]);

  if (!rnc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* CABEÇALHO DO POPUP */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0b5796] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 text-[#0b5796] border border-blue-200 font-mono-numbers shrink-0">
                  RNC #{rnc.id}
                </span>
                {rnc.field1 && rnc.field1 !== `RNC #${rnc.id}` && (
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate font-mono">
                    {rnc.field1}
                  </h2>
                )}
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  rnc.status === 'Concluído' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : rnc.status === 'Em Andamento' 
                    ? 'bg-amber-50 text-amber-900 border-amber-200' 
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {rnc.status || 'Em Andamento'}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {rnc.tipoRnc}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {rnc.cliente} • {rnc.produto || rnc.componente}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenFullPage && (
              <button
                type="button"
                onClick={() => onOpenFullPage(rnc.id)}
                className="btn-secondary h-8 px-2.5 text-xs gap-1 hidden sm:inline-flex"
                title="Abrir página completa"
              >
                <span>Tela Cheia</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO POPUP COM SCROLL */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* CARDS DE RESUMO RÁPIDO: 5 COLUNAS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 flex flex-col gap-1">
              <span className="text-[11px] text-[#0b5796] font-medium flex items-center gap-1">
                <Hash className="w-3 h-3 text-[#0f6cbd]" />
                ID do Registro
              </span>
              <span className="font-black text-[#0b5796] text-sm font-mono-numbers">
                #{rnc.id}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {rnc.field1 || 'SharePoint'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 font-medium">Data Ocorrência</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{formatDateBR(rnc.dataOcorrencia)}</span>
              </span>
              <span className="text-[10px] text-slate-400">{rnc.turno || '1º Turno'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 font-medium">Montadora (Cliente)</span>
              <span className="font-bold text-slate-900 truncate">{rnc.cliente}</span>
              <span className="text-[10px] text-slate-400 truncate">{rnc.setorDeteccao || 'Chão de Fábrica'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 font-medium">Qtd Não Conforme</span>
              <span className="font-bold text-rose-700 text-sm">
                {rnc.quantidadeAfetada || 1} peça(s)
              </span>
              <span className="text-[10px] text-slate-400">
                {rnc.caracteristicaSeguranca === 'Sim' ? 'Item de Segurança (FMEA)' : 'Padrão'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 font-medium">Reincidência</span>
              <span className={`font-bold inline-flex items-center gap-1 ${
                rnc.reincidente === 'SIM' ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {rnc.reincidente === 'SIM' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                <span>{rnc.reincidente === 'SIM' ? 'SIM (Reincidente)' : 'NÃO'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {rnc.gravidade ? `Gravidade: ${rnc.gravidade}` : 'Análise Histórica'}
              </span>
            </div>
          </div>

          {/* DEFEITO & DETALHAMENTO */}
          <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200/80 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Modo de Falha / Defeito Registrado</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {rnc.modoFalha || rnc.descricaoProblema || 'Não especificado'}
            </div>
            {rnc.descricaoProblema && rnc.descricaoProblema !== rnc.modoFalha && (
              <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-100">
                {rnc.descricaoProblema}
              </p>
            )}
            {rnc.descricaoCompleta && (
              <p className="text-xs text-slate-600 italic">
                {rnc.descricaoCompleta}
              </p>
            )}
          </div>

          {/* PEÇA, COMPONENTE & POSTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#0b5796]" />
                <span>Identificação da Peça</span>
              </span>
              <div className="text-xs text-slate-700 space-y-1">
                <div><strong className="text-slate-900">Produto / Conjunto:</strong> {rnc.produto || 'N/A'}</div>
                {rnc.componente && <div><strong className="text-slate-900">Componente:</strong> {rnc.componente}</div>}
                <div><strong className="text-slate-900">Tipo:</strong> {rnc.finalComponente || 'Peça Final'}</div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#0b5796]" />
                <span>Origem Fabril & Posto</span>
              </span>
              <div className="text-xs text-slate-700 space-y-1">
                <div><strong className="text-slate-900">Setor:</strong> {rnc.classificacaoSetor || 'N/A'}</div>
                <div><strong className="text-slate-900">Posto:</strong> {rnc.posto || 'Não especificado'}</div>
                <div><strong className="text-slate-900">Área / FMDS:</strong> {rnc.fmds || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* RASTREABILIDADE */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Rastreabilidade de Produção</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <strong className="text-slate-900">Documento:</strong> {rnc.documentoRastreabilidade || 'Não Informado'}
              </div>
              {rnc.codigoRastreabilidade && (
                <div>
                  <strong className="text-slate-900">Código / Lote:</strong> {rnc.codigoRastreabilidade}
                </div>
              )}
              {rnc.dataInicioRastreabilidade && (
                <div>
                  <strong className="text-slate-900">Período de Contenção:</strong> {formatDateBR(rnc.dataInicioRastreabilidade)} até {formatDateBR(rnc.dataFimRastreabilidade) || 'Atual'}
                </div>
              )}
            </div>
          </div>

          {/* AÇÕES DE CONTENÇÃO E 5W2H (SE PREENCHIDO) */}
          {(rnc.acoesContencao || rnc.recomendacoesProvidencias || rnc.oQueFazer) && (
            <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-[#0b5796] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#0b5796]" />
                <span>Contenção Imediata & Disposição</span>
              </span>
              {rnc.acoesContencao && (
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900">Ações de Contenção:</strong> {rnc.acoesContencao}
                </div>
              )}
              {rnc.recomendacoesProvidencias && (
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900">Recomendações / Providências:</strong> {rnc.recomendacoesProvidencias}
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-semibold text-slate-700">
                {rnc.qtdInspecionada !== undefined && <span>Inspecionadas: <strong>{rnc.qtdInspecionada}</strong></span>}
                {rnc.qtdSuspeita !== undefined && <span className="text-amber-700">Suspeitas: <strong>{rnc.qtdSuspeita}</strong></span>}
                {rnc.qtdBloqueada !== undefined && <span className="text-rose-700">Bloqueadas: <strong>{rnc.qtdBloqueada}</strong></span>}
              </div>
              {rnc.quemFara && (
                <div className="text-xs text-slate-600 pt-1 border-t border-blue-100">
                  <strong>Responsável:</strong> {rnc.quemFara} {rnc.quandoFara ? `(${rnc.quandoFara})` : ''}
                </div>
              )}
            </div>
          )}

          {/* FOTOS DE EVIDÊNCIA */}
          {(rnc.fotoPecaNg || rnc.fotoPecaOk || rnc.fotoAuxiliar) && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-700" />
                <span>Evidências Fotográficas</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rnc.fotoPecaNg && (
                  <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Foto Peça NG
                    </span>
                    <div 
                      className="relative h-40 bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setFotoAmpliada(rnc.fotoPecaNg!)}
                    >
                      <ImageWithFallback
                        src={rnc.fotoPecaNg}
                        alt="Peça NG"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}

                {rnc.fotoPecaOk && (
                  <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Foto Peça OK
                    </span>
                    <div 
                      className="relative h-40 bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setFotoAmpliada(rnc.fotoPecaOk!)}
                    >
                      <ImageWithFallback
                        src={rnc.fotoPecaOk}
                        alt="Peça OK"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}

                {rnc.fotoAuxiliar && (
                  <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Foto Auxiliar / Retrabalho
                    </span>
                    <div 
                      className="relative h-40 bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setFotoAmpliada(rnc.fotoAuxiliar!)}
                    >
                      <ImageWithFallback
                        src={rnc.fotoAuxiliar}
                        alt="Foto Auxiliar"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDITORIA & DETECTOR */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong className="text-slate-800">Emissor / Detector:</strong> {rnc.detector || 'Não informado'} {rnc.reDetector ? `(RE: ${rnc.reDetector})` : ''}
            </div>
            {rnc.participantesAtendimento && (
              <div className="w-full">
                <strong className="text-slate-800">Participantes do Atendimento:</strong> {rnc.participantesAtendimento}
              </div>
            )}
          </div>

        </div>

        {/* RODAPÉ DO POPUP */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Pressione <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-200 rounded font-mono">Esc</kbd> para fechar sem perder o preenchimento da ocorrência atual.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary h-9 px-5 text-xs font-semibold cursor-pointer"
          >
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* MODAL DE FOTO MAXIMIZADA */}
      {fotoAmpliada && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setFotoAmpliada(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <ImageWithFallback
              src={fotoAmpliada}
              alt="Ampliada"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
