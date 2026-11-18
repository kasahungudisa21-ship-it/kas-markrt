import { useState } from 'react';
import { User } from 'firebase/auth';
import { KeyRound, LogOut, Menu, Plus, ShoppingBag, X } from 'lucide-react';
import { translations } from '../i18n';
import { Language, TransactionType } from '../types';
import { DashboardTheme } from './DashboardView';
import { KasLogo } from './KasLogo';
import { PWAInstallButton } from './PWAInstallButton';

export type NavSection =
  | 'explore'
  | 'dashboard'
  | 'buyer'
  | 'properties'
  | 'vehicles'
  | 'goods'
  | 'connections'
  | 'sell';

interface NavbarProps {
  lang: Language;
  activeNav: NavSection;
  activeBuyerMode?: TransactionType;
  dashboardTheme?: DashboardTheme;
  unreadNotifCount?: number;
  isAdmin?: boolean;
  user?: User | null;
  onSelectNav: (nav: NavSection) => void;
  onOpenBuyMode: () => void;
  onOpenRentMode: () => void;
  onOpenSellPage: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export function Navbar({
  lang,
  activeNav,
  activeBuyerMode = 'sale',
  dashboardTheme = 'cobalt',
  unreadNotifCount = 0,
  isAdmin = false,
  user = null,
  onSelectNav,
  onOpenBuyMode,
  onOpenRentMode,
  onOpenSellPage,
  onSignIn,
  onSignOut,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = translations[lang];
  const isDash = activeNav === 'dashboard';
  const isBuyActive = activeNav === 'buyer' && activeBuyerMode === 'sale';
  const isRentActive = activeNav === 'buyer' && activeBuyerMode === 'rent';

  const links: { key: Exclude<NavSection, 'sell'>; label: string }[] = [
    { key: 'explore', label: t.navExplore },
    { key: 'dashboard', label: t.navDashboard },
    { key: 'buyer', label: t.navBuyerStudio },
    { key: 'properties', label: t.navProperties },
    { key: 'vehicles', label: t.navVehicles },
    { key: 'goods', label: t.navGoods },
    { key: 'connections', label: isAdmin ? t.navConnections : t.navConnectionsUser },
  ];

  const handleNavClick = (key: NavSection) => {
    onSelectNav(key);
    setMobileOpen(false);
  };

  const dashHeaderBg =
    dashboardTheme === 'indigo'
      ? 'bg-[#12142B]/95 border-b-indigo-950 border-t-indigo-500 text-indigo-50'
      : dashboardTheme === 'amber'
      ? 'bg-neutral-900/95 border-b-neutral-800 border-t-amber-500 text-neutral-50'
      : 'bg-slate-900/95 border-b-slate-800 border-t-sky-500 text-slate-50';

  const dashAccentBtn =
    dashboardTheme === 'indigo'
      ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-indigo-400'
      : dashboardTheme === 'amber'
      ? 'bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-amber-400'
      : 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-sky-400';

  const dashIndicatorColor =
    dashboardTheme === 'indigo'
      ? 'after:bg-indigo-400 text-white font-semibold'
      : dashboardTheme === 'amber'
      ? 'after:bg-amber-400 text-white font-semibold'
      : 'after:bg-sky-400 text-white font-semibold';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-lg border-t-2 border-b transition-colors ${
        isDash
          ? dashHeaderBg
          : 'bg-[#09231C]/95 border-t-amber-400 border-b-[#17463A] text-[#FBF9F4] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.45)]'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Custom Kas Market Architectural Crest & Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('explore')}
          aria-label={t.brand}
          className={`group inline-flex items-center whitespace-nowrap shrink-0 rounded-lg py-1 pr-1 focus-visible:outline-none focus-visible:ring-2 ${
            isDash ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-amber-300'
          }`}
        >
          <KasLogo variant={isDash ? dashboardTheme : 'emerald'} size="md" />
        </button>

        {/* Zone 2: Clean Single-Line Typographic Navigation Track */}
        <nav
          aria-label="Primary navigation"
          className={`hidden lg:flex items-stretch h-16 gap-3.5 xl:gap-5 text-[13px] xl:text-sm font-medium ${
            isDash ? 'text-slate-300' : 'text-emerald-100/85'
          }`}
        >
          {links.map((link) => {
            const isActive = activeNav === link.key;
            return (
              <button
                key={link.key}
                type="button"
                onClick={() => handleNavClick(link.key)}
                className={`relative h-full inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:transition-opacity after:duration-150 ${
                  isDash ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-amber-300'
                } ${
                  isActive
                    ? isDash
                      ? `${dashIndicatorColor} after:opacity-100`
                      : 'text-amber-300 font-semibold after:bg-amber-400 after:opacity-100'
                    : isDash
                    ? 'hover:text-white after:bg-slate-400 after:opacity-0 hover:after:opacity-50'
                    : 'hover:text-amber-200 after:bg-emerald-300 after:opacity-0 hover:after:opacity-50'
                }`}
              >
                <span>{link.label}</span>
                {link.key === 'connections' && isAdmin && unreadNotifCount > 0 ? (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isDash ? 'text-sky-300' : 'text-amber-300 font-semibold'
                    }`}
                  >
                    ({unreadNotifCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Buy · Rent · Sell Action Group + Mobile Drawer Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5" role="group" aria-label="Buy, Rent, and Sell">
            <button
              type="button"
              onClick={() => {
                onOpenBuyMode();
                setMobileOpen(false);
              }}
              aria-current={isBuyActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDash
                  ? isBuyActive
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 focus-visible:ring-emerald-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-800 focus-visible:ring-sky-400'
                  : isBuyActive
                  ? 'bg-emerald-400 border-emerald-300 text-[#07261E] shadow-sm focus-visible:ring-emerald-300'
                  : 'bg-[#13463A] hover:bg-[#195A4B] border-[#27705E] text-[#FCF8EE] focus-visible:ring-emerald-300'
              }`}
            >
              <ShoppingBag
                className={`w-3.5 h-3.5 shrink-0 ${
                  isBuyActive
                    ? isDash
                      ? 'text-slate-950'
                      : 'text-[#07261E]'
                    : 'text-emerald-300'
                }`}
              />
              <span>{t.navBuy}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenRentMode();
                setMobileOpen(false);
              }}
              aria-current={isRentActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDash
                  ? isRentActive
                    ? 'bg-sky-400 border-sky-300 text-slate-950 focus-visible:ring-sky-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-800 focus-visible:ring-sky-400'
                  : isRentActive
                  ? 'bg-sky-400 border-sky-300 text-[#071F2E] shadow-sm focus-visible:ring-sky-300'
                  : 'bg-[#123D4E] hover:bg-[#184E64] border-[#25667E] text-[#F2F9FD] focus-visible:ring-sky-300'
              }`}
            >
              <KeyRound
                className={`w-3.5 h-3.5 shrink-0 ${
                  isRentActive
                    ? isDash
                      ? 'text-slate-950'
                      : 'text-[#071F2E]'
                    : 'text-sky-300'
                }`}
              />
              <span>{t.navRent}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenSellPage();
                setMobileOpen(false);
              }}
              aria-current={activeNav === 'sell' ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 h-10 px-4 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDash
                  ? dashAccentBtn
                  : activeNav === 'sell'
                  ? 'bg-[#FCF8EE] text-[#0C2E26] ring-2 ring-amber-300 focus-visible:ring-amber-300'
                  : 'bg-amber-400 hover:bg-amber-300 text-[#0B2620] focus-visible:ring-amber-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>{t.navSell}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenSellPage();
              setMobileOpen(false);
            }}
            className={`sm:hidden inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDash
                ? dashAccentBtn
                : activeNav === 'sell'
                ? 'bg-[#FCF8EE] text-[#0C2E26] focus-visible:ring-amber-300'
                : 'bg-amber-400 hover:bg-amber-300 text-[#0B2620] focus-visible:ring-amber-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>{t.navSell}</span>
          </button>

          <PWAInstallButton lang={lang} variant="navbar" isDash={isDash} />

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className={`lg:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg border flex items-center justify-center transition-colors ${
              isDash
                ? 'text-slate-200 hover:text-white border-slate-700 hover:bg-slate-800'
                : 'text-emerald-100 hover:text-amber-200 border-[#226151] hover:bg-[#144338]'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className={`lg:hidden border-t px-4 py-3 divide-y ${
            isDash
              ? 'border-slate-800 bg-slate-900 divide-slate-800/70'
              : 'border-[#1B5244] bg-[#0F372E] divide-[#1C5144]'
          }`}
        >
          <div className="sm:hidden grid grid-cols-3 gap-2 pb-3">
            <button
              type="button"
              onClick={() => {
                onOpenBuyMode();
                setMobileOpen(false);
              }}
              className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isBuyActive
                  ? 'bg-emerald-400 border-emerald-300 text-[#07261E]'
                  : isDash
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#13463A] border-[#27705E] text-[#FCF8EE]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>{t.navBuy}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenRentMode();
                setMobileOpen(false);
              }}
              className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isRentActive
                  ? 'bg-sky-400 border-sky-300 text-[#071F2E]'
                  : isDash
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#123D4E] border-[#25667E] text-[#F2F9FD]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>{t.navRent}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenSellPage();
                setMobileOpen(false);
              }}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeNav === 'sell'
                  ? 'bg-[#FCF8EE] text-[#0C2E26]'
                  : 'bg-amber-400 text-[#0B2620]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>{t.navSell}</span>
            </button>
          </div>
          {links.map((link) => {
            const isActive = activeNav === link.key;
            return (
              <button
                key={link.key}
                type="button"
                onClick={() => handleNavClick(link.key)}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? isDash
                      ? 'text-white font-semibold'
                      : 'text-amber-300 font-semibold'
                    : isDash
                    ? 'text-slate-300 hover:text-white'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                {link.key === 'connections' && isAdmin && unreadNotifCount > 0 ? (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isDash ? 'text-sky-300' : 'text-amber-300 font-semibold'
                    }`}
                  >
                    ({unreadNotifCount})
                  </span>
                ) : null}
              </button>
            );
          })}
          <div className="pt-2.5 pb-1.5 px-3">
            <PWAInstallButton
              lang={lang}
              variant="drawer"
              isDash={isDash}
              onAfterAction={() => setMobileOpen(false)}
            />
          </div>
          {(onSignOut || onSignIn) && (
            <div className="pt-2 pb-1 px-3 flex items-center justify-between gap-3">
              {user ? (
                <>
                  <span
                    className={`text-xs truncate max-w-[180px] ${
                      isDash ? 'text-slate-300' : 'text-emerald-100'
                    }`}
                  >
                    {user.displayName || user.email || t.signedInAs}
                  </span>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                        setMobileOpen(false);
                      }}
                      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        isDash
                          ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                          : 'border-[#2B6E5E] text-emerald-100 hover:bg-red-900/60 hover:text-red-200 hover:border-red-400/50'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.signOut}</span>
                    </button>
                  )}
                </>
              ) : (
                onSignIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignIn();
                      setMobileOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isDash
                        ? `${dashAccentBtn}`
                        : 'bg-amber-400 hover:bg-amber-300 text-[#0B2620]'
                    }`}
                  >
                    {t.signInGoogle}
                  </button>
                )
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
