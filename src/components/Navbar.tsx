import { useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, Menu, Plus, X } from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';
import { DashboardTheme } from './DashboardView';

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
  dashboardTheme?: DashboardTheme;
  unreadNotifCount?: number;
  user?: User | null;
  onSelectNav: (nav: NavSection) => void;
  onOpenSellPage: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export function Navbar({
  lang,
  activeNav,
  dashboardTheme = 'cobalt',
  unreadNotifCount = 0,
  user = null,
  onSelectNav,
  onOpenSellPage,
  onSignIn,
  onSignOut,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = translations[lang];
  const isDash = activeNav === 'dashboard';

  const links: { key: Exclude<NavSection, 'sell' | 'goods' | 'vehicles'>; label: string }[] = [
    { key: 'explore', label: t.navExplore },
    { key: 'dashboard', label: t.navDashboard },
    { key: 'buyer', label: t.navBuyerStudio },
    { key: 'properties', label: t.navProperties },
    { key: 'connections', label: t.navConnections },
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

  const emblemBgFill = isDash
    ? dashboardTheme === 'indigo'
      ? '#4f46e5'
      : dashboardTheme === 'amber'
      ? '#d97706'
      : '#0284c7'
    : '#065f46';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-t-2 border-b transition-colors ${
        isDash
          ? dashHeaderBg
          : 'bg-white/95 border-t-emerald-800 border-b-zinc-200/90 text-zinc-900'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Custom Kas Market Monogram & Display Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('explore')}
          className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-md py-1 pr-1 focus-visible:outline-none focus-visible:ring-2 ${
            isDash
              ? 'text-white focus-visible:ring-sky-400'
              : 'text-zinc-950 focus-visible:ring-emerald-800'
          }`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="32" height="32" rx="7" fill={emblemBgFill} />
            <path
              d="M7.5 14.5L16 7.5L24.5 14.5"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 14.5V24M11.5 19.2L19.5 14.5M14.8 17.3L20.5 24"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-lg sm:text-[19px] font-bold tracking-tight">
            {t.brand}
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Typographic Navigation Track */}
        <nav
          aria-label="Primary navigation"
          className={`hidden md:flex items-stretch h-16 gap-6 lg:gap-8 text-sm font-medium ${
            isDash ? 'text-slate-300' : 'text-zinc-600'
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
                  isDash ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-emerald-800'
                } ${
                  isActive
                    ? isDash
                      ? `${dashIndicatorColor} after:opacity-100`
                      : 'text-zinc-950 font-semibold after:bg-emerald-800 after:opacity-100'
                    : isDash
                    ? 'hover:text-white after:bg-slate-400 after:opacity-0 hover:after:opacity-50'
                    : 'hover:text-zinc-950 after:bg-zinc-400 after:opacity-0 hover:after:opacity-50'
                }`}
              >
                <span>{link.label}</span>
                {link.key === 'connections' && unreadNotifCount > 0 ? (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isDash ? 'text-sky-300' : 'text-emerald-800 font-semibold'
                    }`}
                  >
                    ({unreadNotifCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Drawer Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenSellPage();
              setMobileOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDash
                ? dashAccentBtn
                : activeNav === 'sell'
                ? 'bg-zinc-900 text-white focus-visible:ring-emerald-800'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white focus-visible:ring-emerald-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.25] shrink-0" />
            <span>{t.postListing}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className={`md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg border flex items-center justify-center transition-colors ${
              isDash
                ? 'text-slate-200 hover:text-white border-slate-700 hover:bg-slate-800'
                : 'text-zinc-700 hover:text-zinc-950 border-zinc-200 hover:bg-zinc-100'
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
          className={`md:hidden border-t px-4 py-2 divide-y ${
            isDash
              ? 'border-slate-800 bg-slate-900 divide-slate-800/70'
              : 'border-zinc-200 bg-white divide-zinc-100'
          }`}
        >
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
                      : 'text-emerald-900 font-semibold'
                    : isDash
                    ? 'text-slate-300 hover:text-white'
                    : 'text-zinc-700 hover:text-zinc-950'
                }`}
              >
                <span>{link.label}</span>
                {link.key === 'connections' && unreadNotifCount > 0 ? (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isDash ? 'text-sky-300' : 'text-emerald-800 font-semibold'
                    }`}
                  >
                    ({unreadNotifCount})
                  </span>
                ) : null}
              </button>
            );
          })}
          {(onSignOut || onSignIn) && (
            <div className="pt-2 pb-1 px-3 flex items-center justify-between gap-3">
              {user ? (
                <>
                  <span
                    className={`text-xs truncate max-w-[180px] ${
                      isDash ? 'text-slate-300' : 'text-zinc-600'
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
                          : 'border-zinc-200 text-zinc-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
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
                    className={`w-full min-h-[44px] px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors ${
                      isDash ? dashAccentBtn : 'bg-emerald-800 hover:bg-emerald-900'
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
