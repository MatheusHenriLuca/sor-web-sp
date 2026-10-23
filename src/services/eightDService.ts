import { 
  EightDDetails, 
  Participantes8DRecord, 
  IshikawaItem, 
  HenkatenItem, 
  Entrevista8DItem,
  RNCRecord
} from '../types';

export const eightDService = {
  /**
   * Busca todas as RNCs marcadas para abertura de 8D
   */
  async getRNCs8D(forceRefresh = false): Promise<any[]> {
    const url = `/api/sp/8d/rncs${forceRefresh ? '?refresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao buscar RNCs do 8D (${res.status})`);
    const data = await res.json();
    return data.value || [];
  },

  /**
   * Busca os detalhes agregados de um 8D (1D a 8D: Participantes, Ishikawa, Henkaten, Entrevista, Planos e Ações)
   */
  async getEightDDetails(id8d: string, forceRefresh = false): Promise<EightDDetails> {
    const encodedId = encodeURIComponent(id8d);
    const url = `/api/sp/8d/${encodedId}/detalhes${forceRefresh ? '?refresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao buscar detalhes do 8D ${id8d} (${res.status})`);
    return await res.json();
  },

  /**
   * Salva os participantes e revisões de etapas do 8D (2D, 4D, 5D, 6D, 7D, 8D)
   */
  async saveParticipantes(id8d: string, payload: Partial<Participantes8DRecord>): Promise<any> {
    const encodedId = encodeURIComponent(id8d);
    const res = await fetch(`/api/sp/8d/${encodedId}/participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao salvar participantes (${res.status})`);
    return await res.json();
  },

  /**
   * Adiciona uma nova causa ao Ishikawa (4D)
   */
  async addIshikawaCausa(id8d: string, causa: Partial<IshikawaItem>): Promise<any> {
    const encodedId = encodeURIComponent(id8d);
    const res = await fetch(`/api/sp/8d/${encodedId}/ishikawa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(causa)
    });
    if (!res.ok) throw new Error(`Falha ao adicionar causa ao Ishikawa (${res.status})`);
    return await res.json();
  },

  /**
   * Atualiza uma causa do Ishikawa (ex: 5 Porquês, OK/NG)
   */
  async updateIshikawaCausa(itemId: string, payload: Partial<IshikawaItem>): Promise<any> {
    const res = await fetch(`/api/sp/8d/ishikawa/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao atualizar causa (${res.status})`);
    return await res.json();
  },

  /**
   * Exclui uma causa do Ishikawa
   */
  async deleteIshikawaCausa(itemId: string): Promise<any> {
    const res = await fetch(`/api/sp/8d/ishikawa/${itemId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Falha ao excluir causa (${res.status})`);
    return await res.json();
  }
};
