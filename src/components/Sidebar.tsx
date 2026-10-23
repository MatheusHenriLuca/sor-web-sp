import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  Barcode, 
  Truck, 
  Settings, 
  PlusCircle, 
  Users, 
  ChevronDown, 
  ChevronRight,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { UsuarioQualidade } from '../types';

export type ActiveScreen = 
  | 'dashboard'
  | 'lista-8d'
  | 'registro-8d'
  | 'detalhes-8d'
  | 'registro-protcli'
  | 'rastreabilidade'
  | 'falha-entrega'
  | 'cadastro-usuarios'
  | 'impressao-8d';

interface SidebarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen, params?: any) => void;
  currentUser: UsuarioQualidade;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentScreen, 
  onNavigate, 
  currentUser 
}) => {
  // Acordeons espelhando as variáveis de Menu_2.pa.yaml:
  // varocultarOcorr, varocultarprotcli, varocultarfalhaentrega, varocultarconfig
  const [openOcorr, setOpenOcorr] = useState(true);
  const [openProtCli, setOpenProtCli] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  const role = currentUser.perfil;
  const isAdmin = role === 'Admin';
  const isAdminQual = role === 'Admin' || role === 'Adminqual';
  const isLider = isAdminQual || role === 'Liderqual';
  const isOperator = role === 'User';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #004b97 0%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '1.1rem'
        }}>
          G
        </div>
        <div className="brand-text">
          <h1>GESTAMP</h1>
          <span>QUALIDADE & 8D</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard */}
        <div 
          className={`nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Visão Geral</span>
        </div>

        {/* 1. SEÇÃO: OCORRÊNCIAS & 8D */}
        <div className="nav-section-title">Tratativa de Não Conformidade</div>
        <div 
          className="nav-item" 
          onClick={() => setOpenOcorr(!openOcorr)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={18} />
            <span>Ocorrências 8D</span>
          </div>
          {openOcorr ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {openOcorr && (
          <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div 
              className={`nav-item ${currentScreen === 'lista-8d' ? 'active' : ''}`}
              onClick={() => onNavigate('lista-8d', { tipo: 'Tudo' })}
            >
              <ClipboardList size={16} />
              <span>{isOperator ? 'Minhas Ocorrências' : 'Todas Ocorrências'}</span>
            </div>

            {!isOperator && (
              <>
                <div 
                  className="nav-item"
                  onClick={() => onNavigate('lista-8d', { tipo: 'Cliente' })}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>•</span>
                  <span>Clientes (Montadoras)</span>
                </div>

                <div 
                  className="nav-item"
                  onClick={() => onNavigate('lista-8d', { tipo: 'Interno' })}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>•</span>
                  <span>Ocorrências Internas</span>
                </div>

                <div 
                  className="nav-item"
                  onClick={() => onNavigate('registro-8d', { edicao: false })}
                  style={{ color: 'var(--primary)', fontWeight: 600 }}
                >
                  <PlusCircle size={16} />
                  <span>Nova ocorrência</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. SEÇÃO: PROTEÇÃO AO CLIENTE */}
        <div className="nav-section-title">Contenção e Risco</div>
        <div 
          className="nav-item" 
          onClick={() => setOpenProtCli(!openProtCli)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={18} />
            <span>Proteção ao Cliente</span>
          </div>
          {openProtCli ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {openProtCli && (
          <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div 
              className="nav-item"
              onClick={() => onNavigate('lista-8d', { tipo: 'protcliente' })}
            >
              <span>Ver Proteções</span>
            </div>

            <div 
              className="nav-item"
              onClick={() => onNavigate('registro-protcli')}
            >
              <PlusCircle size={16} />
              <span>Registrar Proteção</span>
            </div>

          </div>
        )}

        {/* 3. SEÇÃO: RASTREABILIDADE SAP */}
        <div 
          className={`nav-item ${currentScreen === 'rastreabilidade' ? 'active' : ''}`}
          onClick={() => onNavigate('rastreabilidade')}
        >
          <Barcode size={18} />
          <span>Rastreabilidade SAP</span>
        </div>

        {/* 4. SEÇÃO: FALHA DE ENTREGA (Restrita ao Admin) */}
        {isAdmin && (
          <div 
            className={`nav-item ${currentScreen === 'falha-entrega' ? 'active' : ''}`}
            onClick={() => onNavigate('falha-entrega')}
          >
            <Truck size={18} />
            <span>Falhas de Entrega</span>
          </div>
        )}

        {/* 5. SEÇÃO: CONFIGURAÇÕES & ADMIN (Admin / Adminqual) */}
        {isAdminQual && (
          <>
            <div className="nav-section-title">Administração</div>
            <div 
              className="nav-item"
              onClick={() => setOpenConfig(!openConfig)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings size={18} />
                <span>Configurações</span>
              </div>
              {openConfig ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {openConfig && (
              <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div 
                  className={`nav-item ${currentScreen === 'cadastro-usuarios' ? 'active' : ''}`}
                  onClick={() => onNavigate('cadastro-usuarios')}
                >
                  <Users size={16} />
                  <span>Gestão de Usuários</span>
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Footer do Usuário Logado */}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">
            {currentUser.nome.charAt(0)}
          </div>
          <div className="user-info">
            <div className="user-name">{currentUser.nome}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RE: {currentUser.reAcesso}</div>
          </div>
          <span className="user-role-badge">{currentUser.perfil}</span>
        </div>
      </div>
    </aside>
  );
};
