import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, CheckCircle2, ShieldAlert, FileText, Check } from 'lucide-react';
import { RNCRecord, RegistroTreinamento } from '../types';
import { spStore } from '../services/sharepointService';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { formatDateBR } from '../utils/date';

interface DetalhesImpressaoViewProps {
  rncId: number;
  onNavigate: (screen: any, params?: any) => void;
}

export const DetalhesImpressaoView: React.FC<DetalhesImpressaoViewProps> = ({ rncId, onNavigate }) => {
  const [rnc, setRnc] = useState<RNCRecord | undefined>(undefined);
  const [treinamentos, setTreinamentos] = useState<RegistroTreinamento[]>([]);

  useEffect(() => {
    const item = spStore.getRNCById(rncId);
    setRnc(item);
    const treins = spStore.getTreinamentos(rncId);
    setTreinamentos(treins);
  }, [rncId]);

  if (!rnc) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center">
        <h2 className="text-xl font-black text-slate-900">Ocorrência não encontrada</h2>
        <button 
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#092162] text-white font-bold text-sm"
          onClick={() => onNavigate('lista-8d')}
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Regra de Paginação de Detalhes impressao.pa.yaml:
  // Se houver menos de 14 treinamentos, preenche linhas vazias para manter o layout da folha A4 rígido!
  const rowsNeeded = 14;
  const paddedTreinamentos = [...treinamentos];
  while (paddedTreinamentos.length < rowsNeeded) {
    paddedTreinamentos.push({
      id: Math.random(),
      idRnc: rnc.id,
      re: 0,
      nomeColaborador: '',
      produto: '',
      defeito: '',
      dataTreinamento: '',
      responsavel: ''
    });
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-16 animate-in fade-in duration-150">
      
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => onNavigate('detalhes-8d', { rncId: rnc.id })}
            className="btn-secondary"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Detalhes da Ocorrência</span>
          </button>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Visualização de Ficha Física de Posto de Trabalho (A4)
          </span>
        </div>

        <button 
          type="button"
          onClick={handlePrint}
          className="btn-primary"
        >
          <Printer size={15} />
          <span>Imprimir Ficha A4</span>
        </button>
      </div>

      {/* A4 Landscape Printable Sheet Container */}
      <div 
        className="print-page-a4 bg-white border border-slate-300 shadow-xl rounded-md mx-auto text-slate-900 overflow-hidden"
        style={{
          padding: '12mm',
          maxWidth: '1100px',
          fontSize: '11px',
          lineHeight: 1.3
        }}
      >
        {/* Header Gestamp */}
        <div className="flex items-center justify-between border-b-2 border-[#092162] pb-2.5 mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#092162] text-white px-3.5 py-1.5 font-black text-base tracking-wider rounded">
              GESTAMP
            </div>
            <div>
              <h2 className="text-base font-black text-[#092162] leading-tight">
                ALERTA DA QUALIDADE & RASTREABILIDADE
              </h2>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                DIVISÃO DE QUALIDADE ASSEGURADA • PLANTA SOROCABA
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-black text-rose-600 font-mono">
              RNC #{rnc.id}
            </div>
            {rnc.field1 && rnc.field1 !== `RNC #${rnc.id}` && (
              <div className="text-xs font-mono font-bold text-slate-700">
                Código: {rnc.field1}
              </div>
            )}
            <div className="text-[10px] text-slate-500 font-medium">Data: {formatDateBR(rnc.dataOcorrencia)}</div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-200 mb-3 rounded text-xs">
          <div><strong className="text-slate-500">ID da RNC:</strong> <span className="font-bold text-blue-700 font-mono">#{rnc.id}</span></div>
          <div><strong className="text-slate-500">Cliente:</strong> <span className="font-bold">{rnc.cliente}</span></div>
          <div><strong className="text-slate-500">Veículo / Projeto:</strong> <span className="font-bold">{rnc.produto}</span></div>
          <div><strong className="text-slate-500">Componente:</strong> <span className="font-bold">{rnc.componente}</span></div>
          <div><strong className="text-slate-500">Setor:</strong> <span className="font-bold">{rnc.classificacaoSetor}</span></div>
          <div><strong className="text-slate-500">Posto / FMDS:</strong> <span>{rnc.posto || 'N/A'}</span></div>
          <div><strong className="text-slate-500">Turno:</strong> <span>{rnc.turno}</span></div>
          <div><strong className="text-slate-500">Qtd. Afetada:</strong> <span className="font-bold">{rnc.quantidadeAfetada} pçs</span></div>
          <div>
            <strong className="text-slate-500">Item de Segurança:</strong>{' '}
            <span className={`font-bold ${rnc.caracteristicaSeguranca === 'Sim' ? 'text-rose-600' : ''}`}>
              {rnc.caracteristicaSeguranca}
            </span>
          </div>
        </div>

        {/* Comparativo de Fotos OK vs NG com ImageWithFallback (proxy do SharePoint) */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          
          {/* Box NG */}
          <div className="border-2 border-rose-500 rounded overflow-hidden flex flex-col">
            <div className="bg-rose-600 text-white px-2.5 py-1 font-black text-[11px] text-center tracking-wide">
              PEÇA NÃO CONFORME (DEFEITO REGISTRADO)
            </div>
            <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              <ImageWithFallback 
                src={rnc.fotoPecaNg} 
                alt="Peça NG" 
                variant="ng"
                className="w-full h-full object-contain"
                emptyLabel="Sem foto do defeito cadastrada"
                allowZoom={false}
              />
            </div>
            <div className="p-2 bg-rose-50 text-rose-950 font-bold text-xs min-h-[38px] border-t border-rose-200">
              <span className="text-[10px] uppercase font-black text-rose-700 block">Sintoma / Falha:</span>
              {rnc.descricaoProblema || 'Defeito não detalhado'}
            </div>
          </div>

          {/* Box OK */}
          <div className="border-2 border-emerald-500 rounded overflow-hidden flex flex-col">
            <div className="bg-emerald-600 text-white px-2.5 py-1 font-black text-[11px] text-center tracking-wide">
              PEÇA CONFORME (PADRÃO APROVADO)
            </div>
            <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              <ImageWithFallback 
                src={rnc.fotoPecaOk} 
                alt="Peça OK" 
                variant="ok"
                className="w-full h-full object-contain"
                emptyLabel="Sem foto padrão cadastrada"
                allowZoom={false}
              />
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-950 font-bold text-xs min-h-[38px] border-t border-emerald-200">
              <span className="text-[10px] uppercase font-black text-emerald-700 block">Critério de Aceitação:</span>
              Livre de rebarbas, trincas, solda com fusão 100% e conformidade geométrica.
            </div>
          </div>

        </div>

        {/* Ações de Contenção e Disposição 5W2H */}
        <div className="border border-slate-200 p-2.5 mb-3 bg-slate-50 rounded">
          <div className="font-black text-[#092162] text-xs mb-1">
            AÇÕES DE CONTENÇÃO IMEDIATA (D3):
          </div>
          <p className="text-slate-800 text-xs m-0">
            {rnc.acoesContencao || 'Retenção preventiva de estoque, triagem 100% e inspeção com torquímetro / gabarito.'}
          </p>
        </div>

        {/* Tabela de Colaboradores Treinados (Fixed 14 Rows Layout) */}
        <div className="mb-3">
          <div className="font-black text-[#092162] text-xs mb-1">
            REGISTRO DE OPERADORES TREINADOS NO POSTO (DISSEMINAÇÃO DO ALERTA):
          </div>
          <table className="w-full border-collapse text-left text-[10px]">
            <thead>
              <tr className="bg-[#092162] text-white">
                <th className="p-1.5 border border-[#092162] w-16 text-center">RE</th>
                <th className="p-1.5 border border-[#092162]">NOME DO OPERADOR</th>
                <th className="p-1.5 border border-[#092162] w-24 text-center">DATA</th>
                <th className="p-1.5 border border-[#092162] w-36 text-center">VISTO DO COLABORADOR</th>
              </tr>
            </thead>
            <tbody>
              {paddedTreinamentos.map((t, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                  <td className="p-1 border border-slate-300 font-mono font-bold text-center">
                    {t.re > 0 ? t.re : ''}
                  </td>
                  <td className="p-1 border border-slate-300 font-medium">
                    {t.nomeColaborador}
                  </td>
                  <td className="p-1 border border-slate-300 font-mono text-center">
                    {formatDateBR(t.dataTreinamento)}
                  </td>
                  <td className="p-1 border border-slate-300"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer com Assinaturas */}
        <div className="grid grid-cols-3 gap-6 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-600">
          <div>
            <div className="border-t border-slate-400 w-4/5 mx-auto mb-1" />
            <span className="font-bold">Emitente / Inspetor da Qualidade</span>
          </div>
          <div>
            <div className="border-t border-slate-400 w-4/5 mx-auto mb-1" />
            <span className="font-bold">Supervisor / Líder de Produção</span>
          </div>
          <div>
            <div className="border-t border-slate-400 w-4/5 mx-auto mb-1" />
            <span className="font-bold">Engenharia da Qualidade</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetalhesImpressaoView;
