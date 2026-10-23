import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ZoomIn, 
  X, 
  Eye, 
  Image as ImageIcon,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'ng' | 'ok' | 'neutral';
  emptyLabel?: string;
  showExternalLink?: boolean;
  allowZoom?: boolean;
  compact?: boolean;
  itemId?: number | string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Evidência fotográfica',
  className = '',
  style,
  variant = 'neutral',
  emptyLabel,
  showExternalLink = true,
  allowZoom = true,
  compact = false,
  itemId
}) => {
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Extração e normalização de fotos e anexos do SharePoint Online
  const extractUrlAndFileName = (rawSrc?: string): { url: string; fileName: string; isSharePoint: boolean } => {
    if (!rawSrc || !rawSrc.trim()) {
      return { url: '', fileName: '', isSharePoint: false };
    }
    const trimmed = rawSrc.trim();

    // 1. Caso Base64 (upload local de operador / captura de câmera)
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
      return { url: trimmed, fileName: 'foto-anexada.jpg', isSharePoint: false };
    }

    // 2. Caso JSON de coluna de imagem moderna do SharePoint
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const fileName = parsed.fileName || parsed.originalImageName || '';
        const serverRelativeUrl = parsed.serverRelativeUrl || parsed.serverUrl;

        if (serverRelativeUrl) {
          const fullUrl = serverRelativeUrl.startsWith('http') 
            ? serverRelativeUrl 
            : `https://gitservices.sharepoint.com${serverRelativeUrl}`;
          return { url: fullUrl, fileName, isSharePoint: true };
        }

        if (fileName) {
          const id = itemId || '';
          const attachmentUrl = `https://gitservices.sharepoint.com/sites/QualityGate/Lists/Resumo%20dos%20Incidentes%20de%20qualidade/Attachments/${id}/${fileName}`;
          return { url: attachmentUrl, fileName, isSharePoint: true };
        }
      } catch {
        // Ignora erro de JSON e segue
      }
    }

    // 3. Caso URL completa direta do SharePoint
    if (trimmed.includes('sharepoint.com')) {
      const parts = trimmed.split('/');
      const fileName = decodeURIComponent(parts[parts.length - 1] || 'anexo-sharepoint.jpg');
      return { url: trimmed, fileName, isSharePoint: true };
    }

    // 4. URL padrão (HTTP / HTTPS / CDN)
    return { url: trimmed, fileName: 'evidencia.jpg', isSharePoint: false };
  };

  const { url: displayUrl, fileName, isSharePoint } = extractUrlAndFileName(src);
  const hasValidContent = Boolean(displayUrl && (!hasError || isSharePoint));

  // Renderizador de Estado Sem Anexo ou Falha
  const renderEmptyOrFallback = () => {
    if (variant === 'ng') {
      return (
        <div 
          className={`flex flex-col items-center justify-center p-4 text-center bg-rose-50/80 border-2 border-dashed border-rose-200 rounded-xl text-rose-900 select-none transition-all ${className}`}
          style={style}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-2 text-rose-700 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
            {emptyLabel || 'Peça com Defeito (NG)'}
          </span>
          <span className="text-[11px] text-rose-600 font-medium mt-1">
            Nenhuma evidência fotográfica anexada
          </span>
        </div>
      );
    }

    if (variant === 'ok') {
      return (
        <div 
          className={`flex flex-col items-center justify-center p-4 text-center bg-emerald-50/80 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-900 select-none transition-all ${className}`}
          style={style}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-2 text-emerald-700 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
            {emptyLabel || 'Padrão Aprovado (OK)'}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1">
            Foto do padrão visual de conformidade
          </span>
        </div>
      );
    }

    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-600 select-none ${className}`}
        style={style}
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2 text-slate-500">
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-slate-700 uppercase">
          {emptyLabel || 'Sem Anexo'}
        </span>
      </div>
    );
  };

  if (!displayUrl) {
    return renderEmptyOrFallback();
  }

  // Se houver erro de CORS em URL do SharePoint (comportamento padrão de navegadores com domínios corporativos seguros)
  if (hasError && isSharePoint) {
    const isNg = variant === 'ng';
    const isOk = variant === 'ok';

    return (
      <div 
        className={`flex flex-col items-center justify-between p-4 rounded-xl border ${
          isNg ? 'bg-rose-50/90 border-rose-200 text-rose-950' :
          isOk ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' :
          'bg-slate-50 border-slate-200 text-slate-800'
        } ${className}`}
        style={style}
      >
        <div className="flex items-center gap-2 w-full justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-1.5">
            {isNg ? <ShieldAlert className="w-4 h-4 text-rose-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
            <span className="text-xs font-bold">
              {isNg ? 'Evidência NG Registrada' : isOk ? 'Padrão OK Registrado' : 'Foto Registrada'}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/90 shadow-2xs">
            SharePoint
          </span>
        </div>

        <div className="my-3 text-center w-full px-2">
          <div className="w-12 h-12 rounded-xl bg-white shadow-xs mx-auto flex items-center justify-center mb-2 border border-black/5">
            <ImageIcon className={`w-6 h-6 ${isNg ? 'text-rose-600' : isOk ? 'text-emerald-600' : 'text-slate-600'}`} />
          </div>
          <div className="text-xs font-semibold truncate max-w-[220px] mx-auto text-slate-800" title={fileName}>
            {fileName || 'Anexo da Ocorrência'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Armazenada no SharePoint corporativo da Gestamp
          </p>
        </div>

        <div className="w-full pt-2 flex items-center justify-center gap-2">
          {displayUrl && (
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition active:scale-95 ${
                isNg ? 'bg-rose-700 hover:bg-rose-800' :
                isOk ? 'bg-emerald-700 hover:bg-emerald-800' :
                'bg-[#0f6cbd] hover:bg-[#0b5a9e]'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver no SharePoint</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative group overflow-hidden rounded-xl border ${
          variant === 'ng' ? 'border-rose-300 bg-rose-50' :
          variant === 'ok' ? 'border-emerald-300 bg-emerald-50' :
          'border-slate-200 bg-slate-50'
        } ${className}`} 
        style={style}
      >
        <img
          src={displayUrl}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain transition duration-200 group-hover:scale-102"
        />
        
        {/* Overlay com Ações e Zoom */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[1px]">
          {allowZoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(true);
              }}
              className="p-2.5 bg-white text-slate-900 rounded-lg shadow-md hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              title="Ampliar evidência"
            >
              <ZoomIn className="w-4 h-4 text-[#0f6cbd]" />
            </button>
          )}

          {showExternalLink && displayUrl && (
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 bg-white text-slate-900 rounded-lg shadow-md hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              title="Abrir no SharePoint Online"
            >
              <ExternalLink className="w-4 h-4 text-slate-700" />
            </a>
          )}
        </div>
      </div>

      {/* Modal de Zoom Lightbox */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[92vh] w-full bg-white rounded-2xl shadow-2xl p-5 overflow-hidden flex flex-col border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0f6cbd]" />
                <span className="font-bold text-sm text-slate-900">{alt}</span>
              </div>
              <div className="flex items-center gap-2">
                {displayUrl && (
                  <a 
                    href={displayUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-secondary h-8 px-3 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Original</span>
                  </a>
                )}
                <button 
                  onClick={() => setIsZoomed(false)}
                  className="btn-icon w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-900/5 rounded-xl p-3 w-full">
              <img 
                src={displayUrl} 
                alt={alt} 
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageWithFallback;
