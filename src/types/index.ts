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
  | 'cadastro-usuarios';

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
