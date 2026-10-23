import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  CheckCircle2, 
  Search, 
  X,
  ShieldCheck,
  Building,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { UsuarioQualidade, ColaboradorBaseAtivos, UserRole } from '../types';
import { spStore } from '../services/sharepointService';

interface CadastroUsuariosViewProps {
  onNavigate: (screen: any) => void;
  currentUser: UsuarioQualidade;
}

export const CadastroUsuariosView: React.FC<CadastroUsuariosViewProps> = ({ onNavigate, currentUser }) => {
  const [users, setUsers] = useState<UsuarioQualidade[]>([]);
  const [baseAtivos, setBaseAtivos] = useState<ColaboradorBaseAtivos[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / New state
  const [form, setForm] = useState<Partial<UsuarioQualidade>>({
    nome: '',
    reAcesso: undefined,
    perfil: 'Inspqual',
    cargo: '',
    email: ''
  });

  const loadData = () => {
    setUsers(spStore.getUsuarios());
    setBaseAtivos(spStore.getBaseAtivos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectColaborador = (numPessoal: number) => {
    const colab = baseAtivos.find(a => a.numPessoal === numPessoal);
    if (colab) {
      setForm(prev => ({
        ...prev,
        nome: colab.nome,
        reAcesso: colab.numPessoal,
        cargo: colab.posicao,
        email: `${colab.nome.toLowerCase().replace(/\s+/g, '.')}@br.gestamp.com`
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.reAcesso) {
      setNotification({ type: 'error', message: 'Nome e RE são obrigatórios!' });
      return;
    }

    spStore.saveUsuario(form);
    setNotification({ type: 'success', message: 'Usuário salvo com sucesso!' });
    setModalOpen(false);
    loadData();
  };

  const handleDelete = () => {
    if (deleteId) {
      spStore.deleteUsuario(deleteId);
      setNotification({ type: 'success', message: 'Usuário removido com sucesso.' });
      setDeleteId(null);
      loadData();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Adminqual':
        return 'bg-[#7c3aed] text-white';
      case 'Liderqual':
        return 'bg-[#0f6cbd] text-white';
      case 'Inspqual':
        return 'bg-[#059669] text-white';
      case 'Processos':
        return 'bg-[#d97706] text-white';
      case 'Produção':
        return 'bg-[#dc2626] text-white';
      default:
        return 'bg-[#616161] text-white';
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(u.reAcesso).includes(searchTerm) ||
    (u.cargo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-4 pb-16 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <CheckCircle2 size={16} />
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-inherit opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="btn-secondary h-9 px-3 text-xs font-semibold"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0f6cbd] flex items-center justify-center border border-blue-100 shadow-xs">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-[#0f172a] tracking-tight">
              Gestão de Usuários & Perfis
            </h1>
            <p className="text-xs text-[#64748b]">
              Controle de acesso por papel (RBAC) integrado ao SharePoint
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              setForm({ nome: '', reAcesso: undefined, perfil: 'Inspqual', cargo: '', email: '' });
              setModalOpen(true);
            }}
            className="btn-primary h-9 px-4 text-xs font-semibold"
          >
            <Plus size={15} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            className="form-input !h-9 !pl-9 !pr-8 text-xs"
            placeholder="Buscar por nome, cargo ou RE..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span className="text-xs text-[#64748b] font-medium hidden sm:inline tabular-nums">
          {filteredUsers.length} de {users.length} usuários
        </span>
      </div>

      {/* Tabela SaaS */}
      <div className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]/90 text-xs font-display font-semibold text-[#64748b]">
                <th className="py-3 px-4 w-12 text-center font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Nome Completo</th>
                <th className="py-3 px-4 font-semibold">Matrícula (RE)</th>
                <th className="py-3 px-4 font-semibold">Cargo / Posição</th>
                <th className="py-3 px-4 font-semibold">Perfil RBAC</th>
                <th className="py-3 px-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#64748b] text-xs">
                    Nenhum colaborador encontrado para o termo pesquisado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const initials = getInitials(u.nome);
                  const badgeColor = getBadgeColor(u.perfil);
                  return (
                    <tr key={u.id || idx} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="py-3 px-4 text-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${badgeColor} shadow-2xs`}>
                          {initials}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0f172a]">{u.nome}</div>
                        <div className="text-[11px] text-[#64748b] font-normal">{u.email || 'Sem e-mail'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#0f172a]">
                        {u.reAcesso}
                      </td>
                      <td className="py-3 px-4 text-[#64748b]">
                        {u.cargo || 'Não especificado'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {u.perfil}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={() => {
                              setForm(u);
                              setModalOpen(true);
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0f6cbd] hover:bg-blue-50 transition-colors"
                            title="Editar usuário"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDeleteId(u.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remover usuário"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-saas !p-0 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f6cbd] flex items-center justify-center border border-blue-100">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="font-display font-bold text-[#0f172a] text-sm sm:text-base">
                  {form.id ? 'Editar Permissões de Usuário' : 'Novo Usuário de Qualidade'}
                </h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              
              {/* Seleção rápida pela Base de Ativos */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <label className="form-label block mb-1.5 text-[#475569]">
                  Preenchimento Automático via Base Geral ({baseAtivos.length})
                </label>
                <select 
                  className="form-input text-xs"
                  onChange={e => handleSelectColaborador(Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="" disabled>Selecione um colaborador da lista...</option>
                  {baseAtivos.slice(0, 100).map(a => (
                    <option key={a.numPessoal} value={a.numPessoal}>
                      {a.numPessoal} - {a.nome} ({a.posicao})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label block mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  className="form-input text-xs"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do colaborador"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="form-label block mb-1">
                    Matrícula (RE) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number"
                    className="form-input text-xs font-mono"
                    value={form.reAcesso || ''}
                    onChange={e => setForm({ ...form, reAcesso: Number(e.target.value) })}
                    placeholder="Ex: 88123"
                    required
                  />
                </div>

                <div>
                  <label className="form-label block mb-1">
                    Perfil RBAC <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    className="form-input text-xs"
                    value={form.perfil}
                    onChange={e => setForm({ ...form, perfil: e.target.value as UserRole })}
                  >
                    <option value="Admin">Admin (Acesso Total)</option>
                    <option value="Adminqual">Adminqual (Engenharia)</option>
                    <option value="Liderqual">Liderqual (Líder da Qualidade)</option>
                    <option value="Inspqual">Inspqual (Inspetor)</option>
                    <option value="Processos">Processos (Eng. Processos)</option>
                    <option value="Produção">Produção (Supervisão)</option>
                    <option value="User">User (Operador)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label block mb-1">Cargo / Posição</label>
                <input 
                  type="text"
                  className="form-input text-xs"
                  value={form.cargo}
                  onChange={e => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Analista da Qualidade"
                />
              </div>

              <div>
                <label className="form-label block mb-1">E-mail Corporativo</label>
                <input 
                  type="email"
                  className="form-input text-xs"
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="nome.sobrenome@br.gestamp.com"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e2e8f0] mt-2">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="btn-secondary h-9 px-4 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary h-9 px-4 text-xs font-semibold"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-saas !p-6 shadow-2xl w-full max-w-sm overflow-hidden text-center flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#0f172a] text-base">Remover Usuário?</h3>
              <p className="text-xs text-[#64748b] mt-1">
                Tem certeza que deseja remover este colaborador da lista de permissões da qualidade?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setDeleteId(null)}
                className="btn-secondary h-9 px-4 text-xs font-semibold flex-1"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleDelete}
                className="btn-primary !bg-rose-600 hover:!bg-rose-700 !border-rose-600 h-9 px-4 text-xs font-semibold flex-1"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CadastroUsuariosView;
