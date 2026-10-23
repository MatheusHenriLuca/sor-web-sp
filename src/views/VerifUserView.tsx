import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  LogIn, 
  AlertCircle, 
  User, 
  CheckCircle2, 
  Delete, 
  ShieldCheck, 
  Building2, 
  Lock
} from 'lucide-react';
import { UsuarioQualidade } from '../types';
import { spStore } from '../services/sharepointService';

interface VerifUserViewProps {
  onLoginSuccess: (user: UsuarioQualidade) => void;
}

export const VerifUserView: React.FC<VerifUserViewProps> = ({ onLoginSuccess }) => {
  const [reInput, setReInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [varserver, setVarserver] = useState(0);

  const allUsers = spStore.getUsuarios();
  const allAtivos = spStore.getBaseAtivos();

  useEffect(() => {
    const timer = setInterval(() => {
      setVarserver(spStore.getServerLagMinutes());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    setErrorMessage('');
    const reNum = Number(reInput.trim());

    if (!reInput.trim() || isNaN(reNum)) {
      setErrorMessage("Por favor, digite um RE numérico válido!");
      return;
    }

    // Procura na lista 'Usuários ocorrências qualidade'
    const foundRegistered = allUsers.find(u => u.reAcesso === reNum);

    if (!foundRegistered) {
      // Se não estiver na lista de usuários especiais, entra como "User" (Operador)
      const ativo = allAtivos.find(a => a.numPessoal === reNum);
      const operadorUser: UsuarioQualidade = {
        id: Date.now(),
        nome: ativo ? ativo.nome : `Operador RE ${reNum}`,
        reAcesso: reNum,
        perfil: "User",
        cargo: ativo ? ativo.posicao : "Operador de Produção",
        setor: ativo ? ativo.unidadeOrg : "Chão de Fábrica"
      };

      spStore.setCurrentUser(operadorUser);
      onLoginSuccess(operadorUser);
    } else {
      // É um usuário registrado -> valida a senha
      if (foundRegistered.senha && foundRegistered.senha !== senhaInput) {
        setErrorMessage("ID ou senha incorretos!");
        return;
      }

      spStore.setCurrentUser(foundRegistered);
      onLoginSuccess(foundRegistered);
    }
  };

  const handleQuickSelect = (user: UsuarioQualidade) => {
    setReInput(String(user.reAcesso));
    setSenhaInput(user.senha || '');
    setErrorMessage('');
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'back') {
      setReInput(prev => prev.slice(0, -1));
    } else if (val === 'clear') {
      setReInput('');
    } else {
      if (reInput.length < 8) {
        setReInput(prev => prev + val);
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans text-[#0f172a]">
      
      {/* Top Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-[#e2e8f0] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0f6cbd] flex items-center justify-center font-display font-bold text-xs border border-blue-100 shadow-xs">
            G
          </div>
          <div>
            <span className="text-xs sm:text-sm font-display font-bold text-[#0f172a]">
              SOR • Gestão da Qualidade Automotiva
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <Building2 size={15} />
          <span className="hidden sm:inline">Gestamp Sorocaba • Planta Sorocaba</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="card-saas p-6 sm:p-8 w-full flex flex-col gap-5 shadow-lg">
          
          {/* Header Card */}
          <div className="text-center flex flex-col gap-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0f6cbd] flex items-center justify-center mx-auto mb-2 border border-blue-100 shadow-2xs">
              <KeyRound size={22} />
            </div>
            <h1 className="text-lg sm:text-xl font-display font-bold text-[#0f172a] tracking-tight">
              Identificação de Usuário
            </h1>
            <p className="text-xs text-[#64748b]">
              Insira sua matrícula (RE) ou utilize o teclado touch de fábrica
            </p>
          </div>

          {/* Erro */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Inputs Form */}
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="form-label block mb-1">
                Matrícula de Empregado (RE) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                value={reInput}
                onChange={e => setReInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Ex: 88123"
                className="form-input text-center font-mono text-lg font-bold tracking-wider"
                autoFocus
              />
            </div>

            <div>
              <label className="form-label block mb-1">
                Senha de Acesso <span className="text-[10px] text-slate-400 font-normal">(apenas cargos de chefia / engenharia)</span>
              </label>
              <input 
                type="password"
                value={senhaInput}
                onChange={e => setSenhaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••"
                className="form-input text-center text-sm font-medium"
              />
            </div>
          </div>

          {/* Botão Entrar */}
          <button 
            type="button"
            onClick={handleLogin}
            className="btn-primary w-full h-10 text-xs font-semibold gap-2 shadow-sm"
          >
            <LogIn size={15} />
            <span>Acessar o Cockpit</span>
          </button>

          {/* Teclado Numérico Virtual Compacto */}
          <div className="border-t border-[#e2e8f0] pt-4">
            <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-[#64748b] text-center mb-3">
              Teclado Numérico Touch
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(String(num))}
                  className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 font-mono font-bold text-sm text-[#0f172a] rounded-xl border border-slate-200 transition-colors shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="h-10 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 font-semibold text-xs text-rose-700 rounded-xl border border-rose-200 transition-colors"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 font-mono font-bold text-sm text-[#0f172a] rounded-xl border border-slate-200 transition-colors shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('back')}
                className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-[#64748b] hover:text-[#0f172a] rounded-xl border border-slate-200 flex items-center justify-center transition-colors shadow-2xs"
                title="Apagar"
              >
                <Delete size={16} />
              </button>
            </div>
          </div>

          {/* Perfis Rápidos */}
          <div className="border-t border-[#e2e8f0] pt-4 flex flex-col gap-2.5">
            <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-[#64748b] text-center">
              Acesso Rápido para Teste
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              {allUsers.slice(0, 4).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-[#0f6cbd] hover:bg-blue-50/50 transition-colors group flex items-center gap-2.5 bg-[#f8fafc]"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0f6cbd] flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-200/60">
                    {getInitials(u.nome)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#0f172a] group-hover:text-[#0f6cbd] truncate">
                      {u.nome.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-[#64748b] font-mono truncate">
                      RE: {u.reAcesso} • {u.perfil}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 px-6 flex items-center justify-between border-t border-[#e2e8f0] bg-white text-xs text-[#64748b]">
        <span>Gestamp Brasil • Indústria 4.0</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${varserver > 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span>Status: {varserver > 5 ? 'Oscilação de Rede' : 'Conectado'}</span>
        </div>
      </footer>

    </div>
  );
};

export default VerifUserView;
