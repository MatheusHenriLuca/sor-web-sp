// ============================================================================
// Catálogo Padronizado de Modos de Falha e Defeitos - Gestamp Brasil
// Espelha Choices([@'Resumo dos Incidentes de qualidade'].classificacao_ocorrencia)
// ============================================================================

export const MODOS_FALHA_LIST = [
  'Falta / excesso de material',
  'Deformação',
  'Trinca (Produto)',
  'Contaminação / Respingos / Oxidação',
  'Marcas na superficie',
  'Falta de furação',
  'Rebarbas',
  'Solda fora do especificado',
  'Peças misturadas',
  'Solda fora de posição',
  'Falta de componente (V to V)',
  'V to V deslocado / Fora de posição',
  'V to V fora do especificado',
  'Falta de componente (Produto)',
  'Produto deslocado / Fora de posição',
  'Falta de Operação',
  'Processos terceiros',
  'Dimensional fora do especificado',
  'Peças juntas',
  'Ruído',
  'falta de sealer',
  'excesso de sealer',
  'Múltiplo incorreto',
  'Falta de identificação',
  'Identificação invertida',
  'Embalagem danificada',
  'Embalagem incorreta',
  'Falha Poka Yoke',
  'Gota Fria',
  'Falta de solda'
] as const;

export const ACOES_CONTENCAO_LIST = [
  'SELEÇÃO 100% LOTE SEGREGADO',
  'INSPEÇÃO 100% NO POSTO DE TRABALHO',
  'RETRABALHAR'
] as const;

export const IMPACTOS_CLIENTE_LIST = [
  'Parada de Linha (Montadora)',
  'Rejeição no Recebimento (Doca / Pátio)',
  'Alerta de Qualidade Oficial Emitido',
  'Retrabalho na Montadora',
  'Desvio Temporário Concedido',
  'Sem Impacto na Linha do Cliente'
] as const;

export const GRAVIDADE_LIST = [
  'Leve',
  'Média',
  'Grave',
  'Crítica'
] as const;
