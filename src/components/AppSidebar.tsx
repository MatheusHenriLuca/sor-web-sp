import React, { useState } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Truck, 
  Users, 
  UserCheck, 
  ChevronDown, 
  Layers,
  Building2,
  Factory,
  ShieldPlus,
  List,
  X
} from 'lucide-react';
import { ActiveScreen, UsuarioQualidade } from '../types';

interface AppSidebarProps {
  currentScreen: ActiveScreen;
  screenParams?: any;
  onNavigate: (screen: ActiveScreen, params?: any) => void;
  currentUser: UsuarioQualidade;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentScreen,
  screenParams,
  onNavigate,
  currentUser,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const isOperator = currentUser.perfil === 'User';
  const role = currentUser.perfil;

  // Estados dos grupos expansíveis (iniciam abertos conforme especificação)
  const [openOcorr, setOpenOcorr] = useState(true);
  const [openProtCli, setOpenProtCli] = useState(true);
  const [openFalha, setOpenFalha] = useState(true);
  const [openConfig, setOpenConfig] = useState(true);

  // Permissões conforme perfil do usuário
  const canSeeOcorrClienteInterna = role !== 'User';
  const canSeeFalha = ['Admin', 'Adminqual'].includes(role);
  const canSeeConfig = ['Admin', 'Adminqual'].includes(role);

  const handleItemClick = (screen: ActiveScreen, params?: any) => {
    onNavigate(screen, params);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getLinkClasses = (isActive: boolean) => `
    relative group w-full flex items-center !gap-3 !px-3.5 !h-10 rounded-xl text-[13px] transition-all duration-200 cursor-pointer text-left select-none active:scale-[0.98]
    ${isActive 
      ? 'bg-[#0f6cbd]/10 text-[#0b5796] font-semibold shadow-xs' 
      : 'text-[#475569] hover:bg-slate-100/80 hover:text-[#0f172a] font-medium'}
  `.trim();

  const getIconClasses = (isActive: boolean) => `
    w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105
    ${isActive ? 'text-[#0f6cbd]' : 'text-[#64748b] group-hover:text-[#0f172a]'}
  `.trim();

  const renderNavContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col justify-between h-full select-none bg-white">
      
      {/* Área Superior com Navegação e Grupos */}
      <div className="flex flex-col !gap-5 !p-4 overflow-y-auto flex-1">
        
        {/* Header do Drawer Mobile (apenas em visualização mobile) */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between !pb-3 border-b border-[#e2e8f0]">
            <div className="flex items-center !gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0e67b0] to-[#09477d] text-white flex items-center justify-center font-display font-bold text-xs shadow-xs border border-white/20">
                G
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-[#0f172a] leading-tight">SOR Qualidade</span>
                <span className="text-[11px] text-[#64748b]">Gestamp Sorocaba</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="!p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition cursor-pointer"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 1. BOTÃO DE AÇÃO PRINCIPAL: + Nova RNC / 8D */}
        <div>
          <button
            type="button"
            onClick={() => handleItemClick('registro-8d', { edicao: false, rncId: undefined, timestamp: Date.now() })}
            className={`btn-primary w-full !h-10.5 text-[13px] font-semibold !justify-center shadow-sm hover:shadow ${
              currentScreen === 'registro-8d' ? 'ring-2 ring-[#0f6cbd] ring-offset-2' : ''
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-display">Nova ocorrência</span>
          </button>
        </div>

        {/* 2. CATEGORIA: ACESSO PRINCIPAL */}
        <div>
          <div className="!px-3 !pb-1.5 text-[11px] font-display font-semibold tracking-wider uppercase text-[#94a3b8] select-none">
            Acesso principal
          </div>
          <div className="flex flex-col !gap-1">
            <button
              type="button"
              onClick={() => handleItemClick('menu-2')}
              className={getLinkClasses(currentScreen === 'menu-2')}
            >
              {currentScreen === 'menu-2' && (
                <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
              )}
              <LayoutGrid className={getIconClasses(currentScreen === 'menu-2')} />
              <span className="truncate">Menu principal</span>
            </button>
          </div>
        </div>

        {/* 3. CATEGORIA: REGISTRO DE OCORRÊNCIAS */}
        <div>
          <button
            type="button"
            onClick={() => setOpenOcorr(!openOcorr)}
            className="w-full flex items-center justify-between !px-3 !py-1.5 text-[11px] font-display font-semibold tracking-wider uppercase text-[#94a3b8] hover:text-[#0f172a] rounded-lg hover:bg-slate-100/60 transition-colors select-none group cursor-pointer"
          >
            <span>Registro de ocorrências</span>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#64748b] ml-auto transition-transform duration-200 ${
                !openOcorr ? '-rotate-90' : ''
              }`} 
            />
          </button>

          {openOcorr && (
            <div className="flex flex-col !gap-1 !mt-1.5">
              {/* 1. Ocorrências gerais (Todas) */}
              {(() => {
                const isActive = currentScreen === 'lista-8d' && (!screenParams?.tipo || screenParams?.tipo === 'Tudo');
                return (
                  <button
                    type="button"
                    onClick={() => handleItemClick('lista-8d', { tipo: 'Tudo' })}
                    className={getLinkClasses(isActive)}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                    )}
                    <Layers className={getIconClasses(isActive)} />
                    <span className="truncate">Ocorrências gerais</span>
                  </button>
                );
              })()}

              {canSeeOcorrClienteInterna && (
                <>
                  {/* 2. Ocorrências cliente (Formal e Informal) */}
                  {(() => {
                    const isActive = currentScreen === 'lista-8d' && screenParams?.tipo === 'Cliente';
                    return (
                      <button
                        type="button"
                        onClick={() => handleItemClick('lista-8d', { tipo: 'Cliente' })}
                        className={getLinkClasses(isActive)}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                        )}
                        <Building2 className={getIconClasses(isActive)} />
                        <span className="truncate">Ocorrências cliente</span>
                      </button>
                    );
                  })()}

                  {/* 3. Ocorrências internas (Interno) */}
                  {(() => {
                    const isActive = currentScreen === 'lista-8d' && screenParams?.tipo === 'Interno';
                    return (
                      <button
                        type="button"
                        onClick={() => handleItemClick('lista-8d', { tipo: 'Interno' })}
                        className={getLinkClasses(isActive)}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                        )}
                        <Factory className={getIconClasses(isActive)} />
                        <span className="truncate">Ocorrências internas</span>
                      </button>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

        {/* 4. CATEGORIA: PROTEÇÃO AO CLIENTE */}
        <div>
          <button
            type="button"
            onClick={() => setOpenProtCli(!openProtCli)}
            className="w-full flex items-center justify-between !px-3 !py-1.5 text-[11px] font-display font-semibold tracking-wider uppercase text-[#94a3b8] hover:text-[#0f172a] rounded-lg hover:bg-slate-100/60 transition-colors select-none group cursor-pointer"
          >
            <span>Proteção ao cliente</span>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#64748b] ml-auto transition-transform duration-200 ${
                !openProtCli ? '-rotate-90' : ''
              }`} 
            />
          </button>

          {openProtCli && (
            <div className="flex flex-col !gap-1 !mt-1.5">
              <button
                type="button"
                onClick={() => handleItemClick('registro-protcli')}
                className={getLinkClasses(currentScreen === 'registro-protcli')}
              >
                {currentScreen === 'registro-protcli' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                )}
                <ShieldPlus className={getIconClasses(currentScreen === 'registro-protcli')} />
                <span className="truncate">Nova Proteção ao Cliente</span>
              </button>

              {(() => {
                const isActive = currentScreen === 'lista-8d' && screenParams?.tipo === 'protcliente';
                return (
                  <button
                    type="button"
                    onClick={() => handleItemClick('lista-8d', { tipo: 'protcliente' })}
                    className={getLinkClasses(isActive)}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                    )}
                    <List className={getIconClasses(isActive)} />
                    <span className="truncate">Lista Proteção ao Cliente</span>
                  </button>
                );
              })()}
            </div>
          )}
        </div>

        {/* 5. CATEGORIA: FALHA DE ENTREGA */}
        {canSeeFalha && (
          <div>
            <button
              type="button"
              onClick={() => setOpenFalha(!openFalha)}
              className="w-full flex items-center justify-between !px-3 !py-1.5 text-[11px] font-display font-semibold tracking-wider uppercase text-[#94a3b8] hover:text-[#0f172a] rounded-lg hover:bg-slate-100/60 transition-colors select-none group cursor-pointer"
            >
              <span>Falha de entrega</span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#64748b] ml-auto transition-transform duration-200 ${
                  !openFalha ? '-rotate-90' : ''
                }`} 
              />
            </button>

            {openFalha && (
              <div className="flex flex-col !gap-1 !mt-1.5">
                <button
                  type="button"
                  onClick={() => handleItemClick('falha-entrega')}
                  className={getLinkClasses(currentScreen === 'falha-entrega')}
                >
                  {currentScreen === 'falha-entrega' && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                  )}
                  <Truck className={getIconClasses(currentScreen === 'falha-entrega')} />
                  <span className="truncate">Incluir falha de entrega</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. CATEGORIA: CONFIGURAÇÕES */}
        {canSeeConfig && (
          <div>
            <button
              type="button"
              onClick={() => setOpenConfig(!openConfig)}
              className="w-full flex items-center justify-between !px-3 !py-1.5 text-[11px] font-display font-semibold tracking-wider uppercase text-[#94a3b8] hover:text-[#0f172a] rounded-lg hover:bg-slate-100/60 transition-colors select-none group cursor-pointer"
            >
              <span>Configurações</span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#64748b] ml-auto transition-transform duration-200 ${
                  !openConfig ? '-rotate-90' : ''
                }`} 
              />
            </button>

            {openConfig && (
              <div className="flex flex-col !gap-1 !mt-1.5">
                <button
                  type="button"
                  onClick={() => handleItemClick('cadastro-usuarios')}
                  className={getLinkClasses(currentScreen === 'cadastro-usuarios')}
                >
                  {currentScreen === 'cadastro-usuarios' && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                  )}
                  <Users className={getIconClasses(currentScreen === 'cadastro-usuarios')} />
                  <span className="truncate">Cadastro de usuários</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleItemClick('verif-user')}
                  className={getLinkClasses(currentScreen === 'verif-user')}
                >
                  {currentScreen === 'verif-user' && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.25 bg-[#0f6cbd] rounded-r-full shadow-[0_0_8px_rgba(15,108,189,0.5)]" />
                  )}
                  <UserCheck className={getIconClasses(currentScreen === 'verif-user')} />
                  <span className="truncate">Trocar usuário</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Rodapé Corporativo Discreto */}
      <div className="!p-4 border-t border-[#e2e8f0] text-xs text-[#64748b] bg-[#f8fafc]/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span className="font-display font-bold text-[#0f172a]">Gestamp Sorocaba</span>
        </div>
        <div className="text-[11px] text-[#64748b] mt-0.5 pl-4">Planta Sorocaba • Qualidade</div>
      </div>

    </div>
  );

  return (
    <>
      {/* 1. Versão Desktop Estática com largura de 268px e respiro garantido */}
      <aside className="hidden lg:block w-[268px] shrink-0 bg-white border-r border-[#e2e8f0] min-h-[calc(100vh-56px)] z-20">
        {renderNavContent(false)}
      </aside>

      {/* 2. Versão Mobile / Tablet (Slide-over Drawer com Backdrop) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs animate-in fade-in transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Painel Lateral Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default AppSidebar;
