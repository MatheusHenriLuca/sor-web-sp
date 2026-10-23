// ============================================================================
// Tipos e Interfaces: Sistema SOR - Tratativa de Produto Não Conforme
// Espelha fielmente as 14 bases de dados SharePoint da Gestamp Brasil
// ============================================================================

export type UserRole = 
  | 'Admin'
  | 'Adminqual'
  | 'Liderqual'
  | 'Inspqual'
  | 'Processos'
  | 'Produção'
  | 'Adminsesmt'
  | 'User';

export type TipoRNC = 'Formal' | 'Informal' | 'Improcedente' | 'Interno';
export type StatusRNC = 'Relatório Inicial' | 'RNC Emitida' | 'Em Andamento' | 'Concluído' | 'Reprovado';
export type StatusProtecaoCliente = 'Sim' | 'Não' | 'Aprovado' | 'Reprovado' | 'Registro Pago';

export type ActiveScreen = 
  | 'app-on-start'
  | 'verif-user'
  | 'menu-2'
  | 'lista-8d'
  | 'registro-8d'
  | 'detalhes-8d'
  | 'impressao-8d'
  | 'registro-protcli'
  | 'rastreabilidade'
  | 'falha-entrega'
  | 'pagamento-protcli'
  | 'cadastro-usuarios'
  | 'gestao-8d'
  | 'plano-acao';

export interface UsuarioQualidade {
  id: number;
  nome: string;
  reAcesso: number;
  perfil: UserRole;
  senha?: string;
  email?: string;
  cargo?: string;
  setor?: string;
}

export interface ColaboradorBaseAtivos {
  numPessoal: number;
  nome: string;
  unidadeOrg: string;
  posicao: string;
}

export interface PecaCatalogo {
  identificacao: number;
  material: string;
  descricao: string;
  cliente: string;
  cliente1?: string;
  posto: string;
  fmds: string;
  nestingLevel: number;
  codCliText: string;
  componente?: string;
  carryOver?: string;
  coProduto?: 'Sim' | 'Não';
  caracteristicaSeguranca?: 'Sim' | 'Não';
}

export interface SharePointConfig {
  siteUrl: string;
  accessToken?: string;
  authMode: 'local_storage' | 'sharepoint_online';
  lastSyncTime?: string;
  listsStatus: {
    pecasCount: number;
    ativosCount: number;
    usuariosCount: number;
    rncsCount: number;
    treinamentosCount: number;
  };
}

export interface RNCRecord {
  id: number;
  title: string; // Sequencial
  field1?: string; // Código Ocorrência (ex: RNC-2026-0042)
  tipoRnc: TipoRNC;
  status: StatusRNC;
  cliente: string;
  dataOcorrencia: string; // ISO Date YYYY-MM-DD
  dataOficializacao?: string;
  codOcorrenciaCliente?: string; // Código Ocorrência Montadora (Portal Cliente)
  impactoCliente?: string; // Impacto na Linha da Montadora
  detalhamentoOcorrencia?: string; // Detalhes adicionais do cliente
  classificacaoSetor: string; // ex: SOLDA 1 - ESTACIONÁRIAS
  setorDeteccao: string;
  turno: '1º Turno' | '2º Turno' | '3º Turno' | 'Central';
  produto: string; // Veículo / Projeto
  componente: string; // Peça estampada / montada
  subcomponente?: string;
  finalComponente?: 'Peça Final' | 'Componente' | 'Peça Final + Componente' | 'SubComponente + Componente';
  quantidadeAfetada: number;
  modoFalha?: string; // Modo de Falha / Classificação Padronizada
  descricaoProblema: string;
  descricaoCompleta?: string;
  
  // Fotos de Evidência
  fotoPecaNg?: string; // Base64 ou URL
  fotoPecaOk?: string; // Base64 ou URL
  fotoAuxiliar?: string; // Base64 ou URL
  
  // Análise e Severidade
  caracteristicaSeguranca: 'Sim' | 'Não';
  coProduto: 'Sim' | 'Não';
  carryOver: 'Sim' | 'Não';
  reincidente: 'SIM' | 'NÃO';
  dataReincidente?: string;
  gravidade?: string;
  possivelDetectar?: string;
  tipoDeteccao?: string;
  
  // Contenção e Triagem (Foto 4 do Power Apps)
  posto?: string;
  fmds?: string;
  descricaoProblemaInterno?: string; // Card 36: field_17 (Descrição do problema interno)
  acoesContencao?: string; // Card 37: Ações de contenção (Chips / Escolha)
  recomendacoesProvidencias?: string; // Card 38: Recomendações / Providências
  dataContencao?: string; // Card 50: Data Final de Contenção
  qtdInspecionada?: number;
  qtdSuspeita?: number;
  qtdBloqueada?: number;
  
  // Disposição e 5W2H (Cards 40 a 45 - Foto 4)
  oQueFazer?: string;
  comoFazer?: string;
  porQueFazer?: string;
  quemFara?: string;
  quandoFara?: string;
  ondeFara?: string;
  
  // Participantes do Atendimento (Lista BASE_ATIVOS concatenada com ';')
  participantesAtendimento?: string;
  
  // Rastreabilidade e Proteção ao Cliente
  documentoRastreabilidade?: 'Não Informado' | 'Etiqueta SAP' | 'Order Cliente' | 'NF' | string;
  codigoRastreabilidade?: string;
  dataInicioRastreabilidade?: string;
  dataFimRastreabilidade?: string;
  protcliente?: StatusProtecaoCliente;
  dataPagamento?: string;
  abrir8D?: 'Sim' | 'Não';
  local8d?: string;
  
  // Avaliação da Qualidade (Produção / Cliente)
  criticidade?: 'A' | 'B' | 'C' | string;
  abrirRnc?: string; // "Sim - Realizar Análise / Contenção / Rastreabilidade" | "Não - Não realizar Análise / Contenção / Rastreabilidade"
  comentarioGestor?: string;

  // Responsáveis e Auditoria
  detector: string;
  reDetector?: number;
  responsavelConclusao?: string;
  dataConclusao?: string;
  observacoesConclusao?: string;
}

export interface RastreabilidadeItem {
  id: number;
  idRnc: number;
  codComp: string;
  codRastreabilidade: string;
  docRastreabilidade: string;
  seqRelacionada: number;
  comando?: string; // "rp", "vp", "bp"
  statusGeral?: 'E' | 'R' | 'P'; // E = Erro, R = Realizado, P = Pendente
  statusVerif?: 'NR' | 'E' | 'OK'; // NR = Não Realizado, E = Em Espera, OK = Verificado
  dataHora: string;
  produto?: string;
  tipoRastreamento?: string;
  ocorrenciaAbrangencia?: string;
  observacao?: string;
  bloqueado?: boolean;
}

export interface LoteSAPParsed {
  idRnc: number;
  seqRel: string;
  produto: string;
  lote: string;
  qtd: number;
  data: string;
}

export interface EtiquetaVivaParsed {
  idRnc: number;
  seqRel: string;
  produto: string;
  etiquetasap: string;
  lote: string;
  qtd: number;
  deposito: string;
  data: string;
  bloqueio: string;
  statusBloqueio: 'bloq' | 'desbloq';
}

export interface RastCabeceiraParsed {
  idRnc: number;
  seqRel: string;
  produto: string;
  lote: string;
  qtd: number;
  estoque: string;
}

export interface RegistroTreinamento {
  id: number;
  idRnc: number;
  re: number;
  nomeColaborador: string;
  produto: string;
  defeito: string;
  dataTreinamento: string;
  responsavel: string;
}

export interface AlertaQualidadeRegistro {
  id: number;
  idRnc: number;
  produto: string;
  componente: string;
  defeito: string;
  dataDivulgacao: string;
  responsavel: string;
  postosDivulgados: string;
}

export interface FalhaEntregaRecord {
  id: number;
  data: string;
  cliente: string;
  produto: string;
  turno: string;
  qtdFalha: number;
  motivoFalha: string;
  areaFmds: string;
  observacao?: string;
  anexos?: string[];
}

export interface Abrir8DRecord {
  id: number;
  idRnc: number;
  abrir8D: 'Sim' | 'Não';
  motivoNaoAbertura?: string;
  responsavel: string;
  dataAbertura: string;
}

export interface ListFiltersState {
  tipoFilter: string;
  statusFilter: string;
  setorFilter: string;
  tipoRncFilter: string;
  clienteFilter: string;
  areaFilter: string;
  searchInput: string;
  viewMode: 'grid' | 'list';
  currentPage: number;
}

// ============================================================================
// ESTRUTURAS DO 8D (GESTAO DE 8D GESTAMP)
// ============================================================================

export interface Participantes8DRecord {
  id?: string;
  id8d: string;
  participantes_8d: string;
  lider_8d?: string;
  champion_8d?: string;
  yokoten?: string;
  fmea_revisar?: string;
  status_revisao_4d?: string;
  comentarios_revisao_4d?: string;
  status_revisao_5d?: string;
  comentarios_revisao_5d?: string;
  status_revisao_6d?: string;
  comentarios_revisao_6d?: string;
  status_revisao_7d?: string;
  comentarios_revisao_7d?: string;
  validar_8d?: string;
  comentarios_validacao?: string;
}

export interface IshikawaItem {
  id: string;
  id8d: string;
  seisms: 'Método' | 'Máquina' | 'Mão de obra' | 'Material' | 'Medição' | 'Meio ambiente' | string;
  descricao_causa: string;
  ocnd: 'Ocorrência' | 'Não Detecção';
  okng: 'OK' | 'NG';
  seq?: number;
  umpq?: string;
  doispq?: string;
  trespq?: string;
  quatropq?: string;
  cincopq?: string; // 5º Porquê - Causa Raiz
  anexos?: string[];
}

export interface HenkatenItem {
  id?: string;
  id8d: string;
  maqhkt?: string;
  mohkt?: string;
  methkt?: string;
  mathkt?: string;
  medhkt?: string;
  mambhkt?: string;
  comentarios?: string;
}

export interface Entrevista8DItem {
  id?: string;
  id8d: string;
  observacoes_gemba?: string;
  depoimentos?: string;
  simulacao?: string;
}

export interface EightDDetails {
  id8d: string;
  rnc?: RNCRecord;
  participantes: Participantes8DRecord | null;
  ishikawa: IshikawaItem[];
  henkaten: HenkatenItem | null;
  entrevista: Entrevista8DItem | null;
  plano: PlanoAcaoMestre | null;
  acoes: PlanoAcaoItem[];
}

// ============================================================================
// ESTRUTURAS DO PLANO DE AÇÃO ('Action plan' e 'Action plan_acoes')
// ============================================================================

export type StatusAcao = 'Aberto' | 'Atrasado' | 'Concluído' | 'Validado' | 'Revisar';
export type PrioridadeAcao = 'Alta' | 'Média' | 'Baixa';
export type TipoAcao = 'CONTENÇÃO' | 'CORRETIVA' | 'PREVENTIVA' | 'MELHORIA';

export interface PlanoAcaoMestre {
  id: string | number;
  id_rel1?: string;
  idprograma?: string; // Chave externa (ex: varid8d -> "I - 4520")
  indicador_programa_estrategico: string;
  sub1?: string;
  sub2?: string;
  posto_?: string;
  produto_?: string;
  setor_?: string;
  prioridade: PrioridadeAcao;
  descricao_problema_oportunidade: string;
  foto_acao?: string;
  status: string;
  data_abertura?: string;
  responsavel_abertura?: string;
}

export interface PlanoAcaoItem {
  id: string | number;
  id_rel2?: string; // FK Cabeçalho ('Action plan'.id)
  id_programa_acoes?: string; // FK Externa (ex: varid8d -> "I - 4520")
  causa?: string; // Causa raiz dos 5 Porquês
  contra_medida: string;
  comentarios_observacoes?: string;
  data_planejada: string;
  data_acompanhamento: string;
  data_conclusao?: string;
  responsavel_acao: string;
  email?: string;
  email_super?: string;
  tipo_acao: TipoAcao;
  yokoten?: 'SIM' | 'NÃO' | string;
  poka_yoke?: 'SIM' | 'NÃO' | string;
  eight_d_seven_d?: 'FMEA' | 'Trabalho Padronizado' | 'Auditoria Escalonada' | string;
  oc_nd?: 'Ocorrência' | 'Não Detecção' | string;
  evidencia_obrigatoria?: 'SIM' | 'NÃO' | 'Sim' | 'Não';
  validacao_acao?: 'SIM' | 'NÃO' | 'Sim' | 'Não';
  status: StatusAcao;
  comentarios_evidencia?: string;
  comentarios_validacao?: string;
  finalizacao?: 'Sim' | 'Não';
  status_revisar2?: string;
  revisao_data?: string;
  data_plan_anterior?: string;
}
