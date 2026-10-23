/**
 * Utilitários para Padronização Global de Datas - Gestamp SOR
 * Formato Padrão de Exibição: DD/MM/AA (ex: 05/10/26)
 * Preserva valores originais para ordenação, filtros e persistência.
 */

export function formatDateBR(
  dateInput: string | Date | null | undefined, 
  options: { includeTime?: boolean } = {}
): string {
  if (!dateInput) return '-';

  try {
    const str = String(dateInput).trim();
    if (!str) return '-';

    // Se já estiver no formato DD/MM/AA ou DD/MM/YYYY
    const brDateMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{2,4})(?:\s+(\d{2}:\d{2}))?/);
    if (brDateMatch) {
      const [, day, month, year, time] = brDateMatch;
      const shortYear = year.length === 4 ? year.slice(-2) : year;
      if (options.includeTime && time) {
        return `${day}/${month}/${shortYear} ${time}`;
      }
      return `${day}/${month}/${shortYear}`;
    }

    // Se estiver no formato ISO YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
    const isoDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}))?/);
    if (isoDateMatch) {
      const [, year, month, day, time] = isoDateMatch;
      const shortYear = year.slice(-2);
      if (options.includeTime && time) {
        return `${day}/${month}/${shortYear} ${time}`;
      }
      return `${day}/${month}/${shortYear}`;
    }

    // Fallback utilizando objeto Date
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const shortYear = String(d.getFullYear()).slice(-2);

    if (options.includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${shortYear} ${hours}:${minutes}`;
    }

    return `${day}/${month}/${shortYear}`;
  } catch {
    return String(dateInput);
  }
}
