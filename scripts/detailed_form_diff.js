import fs from 'fs';

const paCards = JSON.parse(fs.readFileSync('scripts/audit_results.json', 'utf8'));
const regView = fs.readFileSync('src/views/Registro8DView.tsx', 'utf8');

// Let's analyze what controls are actually rendered in Registro8DView.tsx
// Let's inspect each card from Power Apps:

console.log('=== VERIFICAÇÃO DETALHADA: POWER APPS vs REGISTRO 8D VIEW (WEB) ===\n');

const missingInWeb = [];
const partiallyInWeb = [];
const presentInWeb = [];
const systemOrHidden = [];

paCards.forEach(c => {
  const cardName = c.card;
  const dataField = c.dataField;
  const label = c.label;
  const visible = c.visible;
  const required = c.required;
  const control = c.control;

  // Is it hidden system field?
  if (visible === '=false') {
    systemOrHidden.push({ cardName, dataField, label, reason: 'Visible: false no Power Apps' });
    return;
  }

  // Is it edicao-only?
  const isEdicaoOnly = visible.includes('edicao');

  // Let's check matching fields in Registro8DView:
  // Card 1: cliente_res -> radio group for cliente_res
  // Card 2: Tipo de RNC -> form.tipoRnc
  // Card 3: Origem do 8D interno -> form.setorDeteccao / area
  // Card 4: Cod. Reclamação -> form.field1 / codigoOcorrenciaCliente
  // Card 5: data_oficializacao -> form.dataOficializacao
  // Card 6: Classificação -> form.classificacaoSetor
  // Card 7: Data da reclamação -> form.dataOcorrencia
  // Card 8: Turno -> form.turno
  // Card 9: Cliente -> form.cliente
  // Card 10: Participantes do atendimento -> Participantes_x0020_do_x0020_ate
  // Card 11: final_componente -> form.finalComponente
  // Card 12: Produto1 -> form.produto
  // Card 13: Componente -> form.componente
  // Card 14: Foto peça NG -> form.fotoPecaNg
  // Card 15: Quantidade -> form.quantidadeAfetada
  // Card 16: Reclamação do cliente -> form.descricaoProblema
  // Card 17: Local de detecção -> field_14
  // Card 18: Impacto no Cliente -> field_16
  // Card 19: DETALHAMENTO DA OCORRÊNCIA -> DETALHAMENTO_x0020_DA_x0020_OCOR
  // Card 20: Defeito -> field_12
  // Card 21: Co-Produto? -> form.coProduto
  // Card 22: A peça é Carry Over? -> form.carryOver
  // Card 23: Severidade FMEA -> form.caracteristicaSeguranca
  // Card 24: Reincidente -> form.reincidente
  // Card 25: data_reinc -> visible=false
  // Card 26: Reincidente2_DataCard3 -> Gallery1
  // Card 27: Tipo de documento para rastreabilidade -> form.documentoRastreabilidade
  // Card 28: Rastreabilidade da etiqueta -> form.codigoRastreabilidade
  // Card 29: Contenção de peças no cliente (Total de peças) -> form.qtdSuspeita
  // Card 30: Contenção de peças no cliente (Peças NG) -> form.qtdInspecionada
  // Card 31: Foto peça OK -> form.fotoPecaOk
  // Card 32: Posto1 -> form.posto
  // Card 33: fmds -> form.fmds
  // Card 34: gravidade -> gravidade
  // Card 35: possivel_detectar -> possivel_detectar
  // Card 36: tipo_deteccao -> tipo_deteccao
  // Card 37: Descrição do problema (Interno) -> field_17
  // Card 38: Ações de contenção -> form.acoesContencao
  // Card 39: Recomendações / Providências -> Recomenda_x00e7__x00f5_es_x0020_
  // Card 40: Status -> visible=false
  // Card 41: O que fazer? -> form.oQueFazer
  // Card 42: Como fazer? -> form.comoFazer
  // Card 43: Porque fazer? -> form.porQueFazer
  // Card 44: Quando fazer? -> form.quandoFara
  // Card 45: Onde fazer? -> form.ondeFara
  // Card 46: Quem vai fazer? -> form.quemFara
  // Card 47: Foto auxiliar -> form.fotoAuxiliar
  // Card 48-50: visible=false
  // Card 51: data_contencao -> form.dataContencao
  // Card 52: local_8d -> visible=false
  // Card 53: abrir_8d -> form.abrir8D
});

console.log('Cards count:', paCards.length);
