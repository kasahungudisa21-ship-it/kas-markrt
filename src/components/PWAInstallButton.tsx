import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Laptop,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { translations } from '../i18n';
import { Language } from '../types';
import { KasLogo } from './KasLogo';

export type PWAInstallVariant = 'hero' | 'navbar' | 'drawer' | 'footer';

interface PWAInstallButtonProps {
  lang: Language;
  variant?: PWAInstallVariant;
  isDash?: boolean;
  className?: string;
  onAfterAction?: () => void;
}

export function PWAInstallButton({
  lang,
  variant = 'hero',
  isDash = false,
  className = '',
  onAfterAction,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const t = translations[lang];

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      onAfterAction?.();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const renderTrigger = () => {
    if (variant === 'navbar') {
      return (
        <button
          type="button"
          onClick={handleClick}
          aria-label={t.installAppButton}
          title={t.installAppButton}
          className={`inline-flex items-center gap-1.5 h-10 px-2.5 sm:px-3 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 ${
            isDash
              ? 'border-slate-700 bg-slate-800/80 text-sky-200 hover:bg-slate-800 focus-visible:ring-sky-400'
              : 'border-amber-300/45 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 focus-visible:ring-amber-300'
          } ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">{t.installAppShort}</span>
        </button>
      );
    }

    if (variant === 'drawer') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full min-h-[44px] px-3 py-2.5 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
            isDash
              ? 'border-sky-500/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25'
              : 'border-amber-300/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
          } ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{t.installAppButton}</span>
        </button>
      );
    }

    if (variant === 'footer') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 font-semibold transition-colors whitespace-nowrap shrink-0 ${
            isDash ? 'text-sky-300 hover:text-white' : 'text-amber-300 hover:text-amber-200'
          } ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{t.installAppButton}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-emerald-300/45 bg-emerald-400/15 hover:bg-emerald-400/25 text-xs font-semibold text-emerald-100 transition-colors whitespace-nowrap shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>{t.installAppButton}</span>
      </button>
    );
  };

  const directUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <>
      {renderTrigger()}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-[75] bg-[#061712]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-[#FAF8F4] border border-[#E5E0D6] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_28px_70px_-18px_rgba(7,26,21,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[#09261E] border-b border-[#18483B] px-5 sm:px-6 py-4 flex items-center justify-between gap-3 text-[#FCF9F2]">
              <div className="flex items-center gap-3 min-w-0">
                <KasLogo variant="emerald" size="sm" showWordmark={false} />
                <div className="min-w-0">
                  <h2
                    id="pwa-install-modal-title"
                    className="text-base font-bold tracking-tight text-amber-200 truncate"
                  >
                    {t.installModalTitle}
                  </h2>
                  <p className="text-[11px] text-emerald-200 truncate">{t.installModalSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={t.closeLabel}
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-emerald-100 hover:bg-[#134235] hover:text-white shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs leading-relaxed text-[#2C3E38]">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) {
                      setShowGuideModal(false);
                      onAfterAction?.();
                    }
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#0B3B2D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{t.installNowButton}</span>
                </button>
              )}

              {isInIframe && (
                <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-3.5 space-y-2.5">
                  <p className="text-[#6B4212] font-medium leading-relaxed">{t.installIframeNote}</p>
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0B2620] text-xs font-bold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.installOpenBrowser}</span>
                  </a>
                </div>
              )}

              <div className="space-y-3">
                <div
                  className={`rounded-xl border p-4 space-y-1.5 ${
                    isAndroid
                      ? 'border-[#0F4C3A] bg-emerald-50/70'
                      : 'border-[#E6DED0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[#0B3B2E] text-sm">
                    <Smartphone className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    <span>{t.installAndroidTitle}</span>
                  </div>
                  <p className="text-[#3A4D46]">{t.installAndroidSteps}</p>
                </div>

                <div
                  className={`rounded-xl border p-4 space-y-1.5 ${
                    isIOS
                      ? 'border-[#0F4C3A] bg-emerald-50/70'
                      : 'border-[#E6DED0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[#0B3B2E] text-sm">
                    <Share className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    <span>{t.installIOSTitle}</span>
                  </div>
                  <p className="text-[#3A4D46]">{t.installIOSSteps}</p>
                </div>

                <div
                  className={`rounded-xl border p-4 space-y-1.5 ${
                    !isAndroid && !isIOS
                      ? 'border-[#0F4C3A] bg-emerald-50/70'
                      : 'border-[#E6DED0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[#0B3B2E] text-sm">
                    <Laptop className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    <span>{t.installDesktopTitle}</span>
                  </div>
                  <p className="text-[#3A4D46]">{t.installDesktopSteps}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#DFD8CA] bg-[#F3EFE6] p-3.5 flex items-start gap-2.5 text-[#1F3A32]">
                <CheckCircle2 className="w-4 h-4 text-[#0F4C3A] shrink-0 mt-0.5" />
                <span>{t.installBenefitsNote}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full min-h-[40px] rounded-xl border border-[#D4CCB9] bg-white hover:bg-[#F3EFE6] text-[#17362D] text-xs font-semibold transition-colors"
              >
                {t.closeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
