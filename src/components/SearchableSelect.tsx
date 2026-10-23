import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  disabledText?: string;
  error?: string;
  className?: string;
  allowClear?: boolean;
  maxDisplay?: number;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Selecione uma opção --',
  searchPlaceholder = 'Digite para pesquisar...',
  disabled = false,
  disabledText,
  error,
  className = '',
  allowClear = true,
  maxDisplay = 100,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Foco automático no input de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Opção selecionada atual com fallback inteligente para valores existentes
  const selectedOption = useMemo(() => {
    if (!value) return undefined;
    const direct = options.find(opt => opt.value === value);
    if (direct) return direct;
    const caseInsensitive = options.find(opt => 
      opt.value.toLowerCase() === value.toLowerCase() || 
      opt.label.toLowerCase() === value.toLowerCase()
    );
    if (caseInsensitive) return caseInsensitive;
    return {
      value: value,
      label: value,
      sublabel: 'Valor selecionado'
    };
  }, [options, value]);

  // Filtro de opções com termo de busca normalizado e inclusão do valor atual se necessário
  const filteredOptions = useMemo(() => {
    let base = options;
    if (value && !options.some(opt => opt.value === value)) {
      base = [{ value: value, label: value, sublabel: 'Valor selecionado' }, ...options];
    }
    if (!searchTerm.trim()) return base;
    const term = searchTerm.toLowerCase().trim();
    return base.filter(opt => {
      const matchLabel = opt.label.toLowerCase().includes(term);
      const matchValue = opt.value.toLowerCase().includes(term);
      const matchSub = opt.sublabel ? opt.sublabel.toLowerCase().includes(term) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(term) : false;
      return matchLabel || matchValue || matchSub || matchBadge;
    });
  }, [options, value, searchTerm]);

  // Limita o número de itens renderizados simultaneamente para máxima performance (60 FPS)
  const displayedOptions = useMemo(() => {
    return filteredOptions.slice(0, maxDisplay);
  }, [filteredOptions, maxDisplay]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} id={id}>
      {/* Botão de Disparo / Caixa de Seleção */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        onKeyDown={e => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full min-h-[40px] px-3 py-2 flex items-center justify-between gap-2 rounded-xl border text-xs sm:text-sm transition-all select-none ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed italic'
            : isOpen
            ? 'bg-white border-[#0b5796] ring-2 ring-[#0b5796]/15 shadow-sm cursor-pointer'
            : error
            ? 'bg-white border-rose-500 ring-1 ring-rose-200 cursor-pointer hover:border-rose-600'
            : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 cursor-pointer'
        }`}
      >
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          {disabled ? (
            <span className="truncate text-slate-400 font-normal">
              {disabledText || placeholder}
            </span>
          ) : selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${selectedOption.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                  {selectedOption.badge}
                </span>
              )}
              <span className="truncate font-medium text-slate-800">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                  • {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {!disabled && allowClear && selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0b5796]' : ''}`} />
        </div>
      </div>

      {/* Dropdown Flutuante Pesquisável */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-80 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Caixa de Pesquisa Fixa no Topo */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 px-2 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                } else if (e.key === 'Enter' && displayedOptions.length > 0) {
                  e.preventDefault();
                  handleSelect(displayedOptions[0].value);
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contador de Resultados */}
          <div className="px-3 py-1 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>
              {filteredOptions.length === 0
                ? 'Nenhum resultado'
                : filteredOptions.length > maxDisplay
                ? `Exibindo ${maxDisplay} de ${filteredOptions.length} resultados (digite para refinar)`
                : `${filteredOptions.length} opções disponíveis`}
            </span>
            {searchTerm && (
              <span className="text-slate-400 italic truncate max-w-[150px]">
                Busca: "{searchTerm}"
              </span>
            )}
          </div>

          {/* Lista de Opções Rolável */}
          <div className="overflow-y-auto max-h-60 p-1 divide-y divide-slate-50">
            {displayedOptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <span>Nenhum resultado encontrado</span>
                {searchTerm && <span className="font-semibold text-slate-600">"{searchTerm}"</span>}
              </div>
            ) : (
              displayedOptions.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={`${opt.value}-${opt.label}`}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <div className="flex items-center gap-2 truncate">
                        {opt.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${opt.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                            {opt.badge}
                          </span>
                        )}
                        <span className={`truncate ${isSelected ? 'text-[#0b5796] font-bold' : 'font-medium'}`}>
                          {opt.label}
                        </span>
                      </div>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0b5796] shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
