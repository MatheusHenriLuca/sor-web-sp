import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  UserCheck, 
  ChevronDown, 
  RefreshCw,
  LogOut
} from 'lucide-react';
import { UsuarioQualidade, UserRole } from '../types';
import { spStore } from '../services/sharepointService';

interface TopBarProps {
  title: string;
  currentUser: UsuarioQualidade;
  onUserChange: (user: UsuarioQualidade) => void;
  onRefreshData: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  title, 
  currentUser, 
  onUserChange,
  onRefreshData
}) => {
  const [users, setUsers] = useState<UsuarioQualidade[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [heartbeat, setHeartbeat] = useState<{ online: boolean; lastSync: Date; latencyMs: number }>({
    online: true,
    lastSync: new Date(),
    latencyMs: 18
  });

  useEffect(() => {
    setUsers(spStore.getUsuarios());
    const interval = setInterval(() => {
      const lag = spStore.getServerLagMinutes();
      setHeartbeat({
        online: lag < 10,
        lastSync: new Date(),
        latencyMs: lag * 10 + 18
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSelect = (u: UsuarioQualidade) => {
    spStore.setCurrentUser(u);
    onUserChange(u);
    setDropdownOpen(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="page-title">{title}</h2>
        
        {/* Heartbeat Badge - Replicando o Timer 5s do Power Apps */}
        <div 
          className="heartbeat-badge" 
          title={`Última sincronização com SharePoint: ${heartbeat.lastSync.toLocaleTimeString()} (${heartbeat.latencyMs}ms)`}
        >
          <span className="heartbeat-dot" />
          <span>SharePoint Online: Conectado</span>
        </div>
      </div>

      <div className="topbar-right">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onRefreshData}
          title="Recarregar dados do SharePoint"
        >
          <RefreshCw size={15} />
          <span>Atualizar Base</span>
        </button>

        {/* Simulador de Perfil / Usuário */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserCheck size={16} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>{currentUser.nome}</span>
            <span className="user-role-badge">{currentUser.perfil}</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.5rem',
                width: '280px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                padding: '0.5rem'
              }}
            >
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                ALTERNAR PERFIL DE TESTE (RBAC):
              </div>
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleRoleSelect(u)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: currentUser.id === u.id ? 'var(--primary-light)' : 'transparent',
                      color: currentUser.id === u.id ? 'var(--primary)' : 'var(--text-main)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.nome}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RE: {u.reAcesso}</div>
                    </div>
                    <span className="user-role-badge">{u.perfil}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
