import { 
  PlanoAcaoMestre, 
  PlanoAcaoItem, 
  StatusAcao 
} from '../types';

export const actionPlanService = {
  /**
   * Busca a lista de planos mestres ('Action plan')
   */
  async getPlanos(idprograma?: string, forceRefresh = false): Promise<PlanoAcaoMestre[]> {
    let url = `/api/sp/planos?${forceRefresh ? 'refresh=true&' : ''}`;
    if (idprograma) {
      url += `idprograma=${encodeURIComponent(idprograma)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao buscar planos de ação (${res.status})`);
    const data = await res.json();
    return data.value || [];
  },

  /**
   * Cria um novo plano mestre ('Action plan')
   */
  async createPlano(payload: Partial<PlanoAcaoMestre>): Promise<any> {
    const res = await fetch('/api/sp/planos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao criar plano mestre (${res.status})`);
    return await res.json();
  },

  /**
   * Atualiza um plano mestre ('Action plan')
   */
  async updatePlano(id: string | number, payload: Partial<PlanoAcaoMestre>): Promise<any> {
    const res = await fetch(`/api/sp/planos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao atualizar plano (${res.status})`);
    return await res.json();
  },

  /**
   * Busca a lista de ações detalhadas ('Action plan_acoes')
   */
  async getAcoes(params?: { idprograma?: string; idplano?: string | number }, forceRefresh = false): Promise<PlanoAcaoItem[]> {
    const q = new URLSearchParams();
    if (forceRefresh) q.set('refresh', 'true');
    if (params?.idprograma) q.set('idprograma', params.idprograma);
    if (params?.idplano) q.set('idplano', String(params.idplano));

    const res = await fetch(`/api/sp/acoes?${q.toString()}`);
    if (!res.ok) throw new Error(`Falha ao buscar ações (${res.status})`);
    const data = await res.json();
    return data.value || [];
  },

  /**
   * Cria uma nova contramedida/ação ('Action plan_acoes')
   */
  async createAcao(payload: Partial<PlanoAcaoItem>): Promise<any> {
    const res = await fetch('/api/sp/acoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao criar ação (${res.status})`);
    return await res.json();
  },

  /**
   * Edita uma ação existente
   */
  async updateAcao(id: string | number, payload: Partial<PlanoAcaoItem>): Promise<any> {
    const res = await fetch(`/api/sp/acoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao atualizar ação (${res.status})`);
    return await res.json();
  },

  /**
   * Conclui a ação pelo responsável (anexos e evidências)
   */
  async concluirAcao(id: string | number, payload: {
    data_conclusao?: string;
    comentarios_evidencia: string;
    validacao_acao?: string;
  }): Promise<any> {
    const res = await fetch(`/api/sp/acoes/${id}/concluir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao concluir ação (${res.status})`);
    return await res.json();
  },

  /**
   * Valida ou reprova a ação pela Qualidade
   */
  async validarAcao(id: string | number, payload: {
    aprovado: boolean;
    comentarios_validacao: string;
  }): Promise<any> {
    const res = await fetch(`/api/sp/acoes/${id}/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Falha ao validar ação (${res.status})`);
    return await res.json();
  },

  /**
   * Exclui uma ação com registro de motivo de auditoria
   */
  async deleteAcao(id: string | number, motivo?: string, usuario?: string): Promise<any> {
    const q = new URLSearchParams();
    if (motivo) q.set('motivo', motivo);
    if (usuario) q.set('usuario', usuario);
    const qs = q.toString() ? `?${q.toString()}` : '';

    const res = await fetch(`/api/sp/acoes/${id}${qs}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Falha ao excluir ação (${res.status})`);
    return await res.json();
  },

  /**
   * Exclui um plano mestre com registro de motivo de auditoria
   */
  async deletePlano(id: string | number, motivo?: string, usuario?: string): Promise<any> {
    const q = new URLSearchParams();
    if (motivo) q.set('motivo', motivo);
    if (usuario) q.set('usuario', usuario);
    const qs = q.toString() ? `?${q.toString()}` : '';

    const res = await fetch(`/api/sp/planos/${id}${qs}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Falha ao excluir plano (${res.status})`);
    return await res.json();
  }
};
