// ============================================================================
// LISTA OFICIAL DE CLIENTES (MONTADORAS) - SISTEMA SOR GESTAMP SOROCABA
// Validada diretamente contra as escolhas da coluna 'cliente' (field_6)
// da lista 'Resumo dos Incidentes de qualidade' e 'lista_geral_peças_aa3' do SharePoint Online
// ============================================================================

export const CLIENTES_LIST = [
  'TDB - SOROCABA',
  'TDB - INDAIATUBA',
  'KDB - SOROCABA',
  'KDB - SALTO',
  'HYUNDAI',
  'HONDA',
  'BOSHOKU',
  'GPA - PARANÁ',
  'GSN - SANTA ISABEL',
  'MBB - TAUBATÉ',
  'RENAULT',
  'AISIN'
] as const;

export type ClienteMontadora = typeof CLIENTES_LIST[number];

export const DEFAULT_CLIENTE: ClienteMontadora = 'TDB - SOROCABA';

export interface ClientBadgeInfo {
  label: string;
  code: string;
  bg: string;
  border: string;
  color: string;
}

/**
 * Retorna insígnia/cores padronizadas para cada cliente/montadora da Gestamp Sorocaba.
 */
export function getClientBadgeInfo(cliente: string): ClientBadgeInfo {
  const c = (cliente || '').trim().toUpperCase();

  if (c.includes('TDB - SOROCABA')) {
    return { label: 'TD', code: 'TDB', bg: 'bg-[#1e293b] text-white', border: 'border-[#1e293b]', color: 'bg-[#1e293b] text-white' };
  }
  if (c.includes('TDB - INDAIATUBA')) {
    return { label: 'TD', code: 'TDI', bg: 'bg-[#334155] text-white', border: 'border-[#334155]', color: 'bg-[#334155] text-white' };
  }
  if (c.includes('TDB') || c.includes('TOYOTA')) {
    return { label: 'TD', code: 'TDB', bg: 'bg-[#008080] text-white', border: 'border-[#008080]', color: 'bg-[#008080] text-white' };
  }
  if (c.includes('KDB - SOROCABA')) {
    return { label: 'KD', code: 'KDS', bg: 'bg-[#0369a1] text-white', border: 'border-[#0369a1]', color: 'bg-[#0369a1] text-white' };
  }
  if (c.includes('KDB - SALTO') || c.includes('KDB')) {
    return { label: 'KD', code: 'KDL', bg: 'bg-[#0284c7] text-white', border: 'border-[#0284c7]', color: 'bg-[#0284c7] text-white' };
  }
  if (c.includes('HONDA')) {
    return { label: 'HD', code: 'HND', bg: 'bg-[#15803d] text-white', border: 'border-[#15803d]', color: 'bg-[#15803d] text-white' };
  }
  if (c.includes('HYUNDAI')) {
    return { label: 'HY', code: 'HYU', bg: 'bg-[#6b21a8] text-white', border: 'border-[#6b21a8]', color: 'bg-[#6b21a8] text-white' };
  }
  if (c.includes('BOSHOKU')) {
    return { label: 'BS', code: 'BSH', bg: 'bg-[#0f766e] text-white', border: 'border-[#0f766e]', color: 'bg-[#0f766e] text-white' };
  }
  if (c.includes('GPA')) {
    return { label: 'GP', code: 'GPA', bg: 'bg-[#b45309] text-white', border: 'border-[#b45309]', color: 'bg-[#b45309] text-white' };
  }
  if (c.includes('GSN')) {
    return { label: 'GS', code: 'GSN', bg: 'bg-[#be185d] text-white', border: 'border-[#be185d]', color: 'bg-[#be185d] text-white' };
  }
  if (c.includes('MBB')) {
    return { label: 'MB', code: 'MBB', bg: 'bg-[#4338ca] text-white', border: 'border-[#4338ca]', color: 'bg-[#4338ca] text-white' };
  }
  if (c.includes('RENAULT')) {
    return { label: 'RN', code: 'REN', bg: 'bg-[#ca8a04] text-white', border: 'border-[#ca8a04]', color: 'bg-[#ca8a04] text-white' };
  }
  if (c.includes('AISIN')) {
    return { label: 'AI', code: 'AIS', bg: 'bg-[#0284c7] text-white', border: 'border-[#0284c7]', color: 'bg-[#0284c7] text-white' };
  }

  // Fallback para códigos com 2 letras
  const initials = c.replace(/[^A-Z]/g, '').slice(0, 2) || 'CL';
  return { label: initials, code: initials, bg: 'bg-slate-700 text-white', border: 'border-slate-700', color: 'bg-slate-700 text-white' };
}
