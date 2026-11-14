import { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Car,
  ClipboardList,
  Globe,
  Home,
  LayoutDashboard,
  Lock,
  MapPin,
  Package,
  Palette,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
} from 'lucide-react';
import {
  deleteBuyerRequest,
  deleteContactEntry,
  markAllNotificationsRead,
  removeListing,
  removeOrder,
  updateOrderStatus,
} from '../firebase';
import {
  getCategoryLabel,
  getNotificationEventTitle,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getStatusLabel,
  getTransactionLabel,
  translations,
} from '../i18n';
import {
  AppNotification,
  BuyerRequest,
  ContactActionType,
  ContactEntry,
  ContactRole,
  Language,
  Listing,
  ListingCategory,
  ListingStatus,
  Order,
  TransactionType,
} from '../types';
import { formatPrice } from '../utils/format';

export type DashboardTheme = 'cobalt' | 'indigo' | 'amber';
type DashboardTab = 'overview' | 'listings' | 'orders' | 'demand' | 'contacts';

interface DashboardViewProps {
  lang: Language;
  onToggleLang: () => void;
  theme: DashboardTheme;
  onChangeTheme: (theme: DashboardTheme) => void;
  user: User | null;
  isAdmin: boolean;
  contactDirectory: ContactEntry[];
  allListings: Listing[];
  listingsLoaded: boolean;
  savedIds: Set<string>;
  orders: Order[];
  notifications?: AppNotification[];
  buyerRequests: BuyerRequest[];
  onSelectListing: (listing: Listing, initialTab?: 'order' | 'message') => void;
  onOpenSellPage: () => void;
  onOpenBuyerStudio: () => void;
  onOpenNotifications?: () => void;
  onDeleteListing?: (listing: Listing) => Promise<void> | void;
  onSignIn: () => void;
}

interface ThemeTokens {
  canvas: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBg: string;
  accentBgHover: string;
  accentText: string;
  accentBar: string;
  accentSoft: string;
  inputBg: string;
  rowHover: string;
}

const THEME_TOKENS: Record<DashboardTheme, ThemeTokens> = {
  cobalt: {
    canvas: 'bg-slate-950',
    surface: 'bg-slate-900',
    surfaceAlt: 'bg-slate-800/80',
    border: 'border-slate-800',
    divider: 'divide-slate-800',
    textPrimary: 'text-slate-50',
    textSecondary: 'text-slate-200',
    textMuted: 'text-slate-400',
    accentBg: 'bg-blue-600',
    accentBgHover: 'hover:bg-blue-500',
    accentText: 'text-sky-400',
    accentBar: 'bg-sky-500',
    accentSoft: 'bg-blue-950/70 border-blue-800/70 text-sky-200',
    inputBg: 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500',
    rowHover: 'hover:bg-slate-800/60',
  },
  indigo: {
    canvas: 'bg-[#090A1A]',
    surface: 'bg-[#12142B]',
    surfaceAlt: 'bg-[#1B1E3D]',
    border: 'border-indigo-950',
    divider: 'divide-indigo-950/90',
    textPrimary: 'text-indigo-50',
    textSecondary: 'text-indigo-100',
    textMuted: 'text-indigo-300/75',
    accentBg: 'bg-indigo-600',
    accentBgHover: 'hover:bg-indigo-500',
    accentText: 'text-indigo-300',
    accentBar: 'bg-indigo-400',
    accentSoft: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-200',
    inputBg: 'bg-[#090A1A] border-indigo-900 text-indigo-50 placeholder:text-indigo-400/50',
    rowHover: 'hover:bg-[#1B1E3D]/70',
  },
  amber: {
    canvas: 'bg-neutral-950',
    surface: 'bg-neutral-900',
    surfaceAlt: 'bg-neutral-800/80',
    border: 'border-neutral-800',
    divider: 'divide-neutral-800',
    textPrimary: 'text-neutral-50',
    textSecondary: 'text-neutral-200',
    textMuted: 'text-neutral-400',
    accentBg: 'bg-amber-600',
    accentBgHover: 'hover:bg-amber-500',
    accentText: 'text-amber-400',
    accentBar: 'bg-amber-500',
    accentSoft: 'bg-amber-950/60 border-amber-800/70 text-amber-200',
    inputBg: 'bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-500',
    rowHover: 'hover:bg-neutral-800/60',
  },
};

export function DashboardView({
  lang,
  onToggleLang,
  theme,
  onChangeTheme,
  user,
  isAdmin,
  contactDirectory,
  allListings,
  listingsLoaded,
  savedIds,
  orders,
  notifications = [],
  buyerRequests,
  onSelectListing,
  onOpenSellPage,
  onOpenBuyerStudio,
  onOpenNotifications,
  onDeleteListing,
  onSignIn,
}: DashboardViewProps) {
  const t = translations[lang];
  const palette = THEME_TOKENS[theme];

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | TransactionType>('all');
  const [catFilter, setCatFilter] = useState<'all' | ListingCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [contactRoleFilter, setContactRoleFilter] = useState<'all' | ContactRole>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [busyContactId, setBusyContactId] = useState<string | null>(null);
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const metrics = useMemo(() => {
    const activeListings = allListings.filter((l) => l.status !== 'closed');
    const saleCount = activeListings.filter((l) => l.transactionType === 'sale').length;
    const rentCount = activeListings.filter((l) => l.transactionType === 'rent').length;

    const categoryCounts: Record<ListingCategory, number> = {
      apartment: 0,
      house: 0,
      land: 0,
      vehicle: 0,
      goods: 0,
    };
    const neighborhoodMap = new Map<string, number>();

    activeListings.forEach((l) => {
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
      const hood = l.neighborhood || 'Addis Ababa';
      neighborhoodMap.set(hood, (neighborhoodMap.get(hood) || 0) + 1);
    });

    const topNeighborhoods = Array.from(neighborhoodMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const confirmedOrders = orders.filter(
      (o) => o.status === 'confirmed' || o.status === 'completed'
    ).length;

    const orderEtb = activeOrders
      .filter((o) => o.currency === 'ETB')
      .reduce((acc, o) => acc + o.totalAmount, 0);
    const orderUsd = activeOrders
      .filter((o) => o.currency === 'USD')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const activeRequests = buyerRequests.filter((r) => r.status === 'active').length;

    return {
      totalListings: activeListings.length,
      saleCount,
      rentCount,
      categoryCounts,
      topNeighborhoods,
      totalOrders: orders.length,
      pendingOrders,
      confirmedOrders,
      orderEtb,
      orderUsd,
      activeRequests,
    };
  }, [allListings, orders, buyerRequests]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allListings.filter((item) => {
      if (txFilter !== 'all' && item.transactionType !== txFilter) return false;
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.neighborhood} ${item.city} ${item.sellerName} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allListings, searchQuery, txFilter, catFilter, statusFilter]);

  const incomingOrders = useMemo(
    () => (user ? orders.filter((o) => o.sellerId === user.uid) : []),
    [orders, user]
  );
  const placedOrders = useMemo(
    () => (user ? orders.filter((o) => o.buyerId === user.uid) : []),
    [orders, user]
  );
  const otherAdminOrders = useMemo(
    () =>
      user && isAdmin
        ? orders.filter((o) => o.sellerId !== user.uid && o.buyerId !== user.uid)
        : [],
    [orders, user, isAdmin]
  );

  const filteredContacts = useMemo(() => {
    if (!isAdmin) return [];
    const q = contactSearch.trim().toLowerCase();
    return contactDirectory.filter((entry) => {
      if (contactRoleFilter !== 'all' && entry.role !== contactRoleFilter) return false;
      if (q) {
        const hay = `${entry.userName} ${entry.userEmail} ${entry.phone} ${entry.listingTitle} ${entry.neighborhood}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [isAdmin, contactDirectory, contactRoleFilter, contactSearch]);

  const effectiveTab: DashboardTab = !isAdmin && activeTab === 'contacts' ? 'overview' : activeTab;

  const sidebarItems: {
    key: DashboardTab;
    label: string;
    count?: number;
    Icon: typeof LayoutDashboard;
  }[] = [
    { key: 'overview', label: t.dashNavOverview, Icon: LayoutDashboard },
    { key: 'listings', label: t.dashNavListings, count: allListings.length, Icon: ClipboardList },
    { key: 'orders', label: t.dashNavOrders, count: orders.length, Icon: ShoppingBag },
    { key: 'demand', label: t.dashNavDemand, count: buyerRequests.length, Icon: Users },
    ...(isAdmin
      ? [{ key: 'contacts' as const, label: t.dashNavContacts, count: contactDirectory.length, Icon: Phone }]
      : []),
  ];

  const categoryRows: { key: ListingCategory; Icon: typeof Building2 }[] = [
    { key: 'apartment', Icon: Building2 },
    { key: 'house', Icon: Home },
    { key: 'land', Icon: MapPin },
    { key: 'vehicle', Icon: Car },
    { key: 'goods', Icon: Package },
  ];

  const activeBreadcrumbLabel =
    sidebarItems.find((i) => i.key === effectiveTab)?.label || t.dashNavOverview;

  const formatCompactCurrency = (amount: number, currency: 'ETB' | 'USD') => {
    const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
    return currency === 'USD' ? `$${formatted}` : `${formatted} ETB`;
  };

  const listingStatusTextColor = (status: ListingStatus) => {
    if (status === 'available') return 'text-emerald-400';
    if (status === 'reserved') return 'text-amber-400';
    return 'text-rose-400';
  };

  const orderStatusTextColor = (status: Order['status']) => {
    if (status === 'confirmed' || status === 'completed') return 'text-emerald-400';
    if (status === 'pending') return 'text-amber-400';
    return 'text-rose-400';
  };

  const getContactRoleLabel = (role: ContactRole) => {
    if (role === 'seller') return lang === 'am' ? 'ሻጭ' : 'Seller';
    return lang === 'am' ? 'ገዥ' : 'Buyer';
  };

  const getContactActionLabel = (actionType: ContactActionType) => {
    if (lang === 'am') {
      switch (actionType) {
        case 'listing_post':
          return 'ማስታወቂያ ለጠፈ';
        case 'order':
          return 'ትዕዛዝ ሰጠ';
        case 'inquiry':
          return 'ለሻጭ ጻፈ';
        case 'buyer_request':
          return 'የገዥ ፍላጎት';
      }
    }
    switch (actionType) {
      case 'listing_post':
        return 'Listing Post';
      case 'order':
        return 'Order Placed';
      case 'inquiry':
        return 'Seller Inquiry';
      case 'buyer_request':
        return 'Buyer Request';
    }
  };

  const formatContactDate = (ms: number) => {
    if (!ms) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  };

  return (
    <div className={`${palette.canvas} ${palette.textPrimary} min-h-[calc(100vh-4rem)]`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Workspace Sidebar */}
          <aside
            className={`w-full lg:w-[240px] shrink-0 rounded-xl border ${palette.border} ${palette.surface} p-4 space-y-5`}
          >
            <div className="space-y-1 px-2">
              <div className={`text-xs font-medium ${palette.textMuted}`}>{t.brand}</div>
              <div className={`text-sm font-semibold ${palette.textPrimary}`}>{t.dashTitle}</div>
            </div>

            <nav aria-label="Dashboard sections" className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
              {sidebarItems.map(({ key, label, count, Icon }) => {
                const isActive = effectiveTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? `${palette.accentBg} text-white`
                        : `${palette.textSecondary} ${palette.rowHover}`
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    {typeof count === 'number' && (
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isActive ? 'text-white/90' : palette.textMuted
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className={`pt-4 border-t ${palette.border} space-y-2.5 px-1`}>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${palette.textMuted}`}>
                <Palette className="w-3.5 h-3.5" />
                <span>{t.dashThemeLabel}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    { key: 'cobalt', label: t.dashThemeCobalt, swatch: 'bg-blue-500' },
                    { key: 'indigo', label: t.dashThemeIndigo, swatch: 'bg-indigo-400' },
                    { key: 'amber', label: t.dashThemeAmber, swatch: 'bg-amber-500' },
                  ] as { key: DashboardTheme; label: string; swatch: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onChangeTheme(opt.key)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      theme === opt.key
                        ? palette.accentSoft
                        : `border-transparent ${palette.textSecondary} ${palette.rowHover}`
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-sm shrink-0 ${opt.swatch}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Dashboard Viewport */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {/* Contextual Header & Primary Actions */}
            <div
              className={`rounded-xl border ${palette.border} ${palette.surface} px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
              <div className="space-y-1 min-w-0">
                <div className={`text-xs ${palette.textMuted} flex items-center gap-1.5`}>
                  <span>{t.brand}</span>
                  <span aria-hidden="true">/</span>
                  <span>{t.dashBreadcrumbRoot}</span>
                  <span aria-hidden="true">/</span>
                  <span className={palette.accentText}>{activeBreadcrumbLabel}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight [text-wrap:balance]">
                  {t.dashTitle}
                </h1>
                <p className={`text-xs sm:text-sm ${palette.textMuted}`}>{t.dashSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={onToggleLang}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border ${palette.border} ${palette.surfaceAlt} text-xs font-medium ${palette.textSecondary} hover:opacity-90 whitespace-nowrap shrink-0`}
                >
                  <Globe className={`w-3.5 h-3.5 ${palette.accentText}`} />
                  <span>{lang === 'en' ? 'አማርኛ' : 'English'}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenBuyerStudio}
                  className={`px-3.5 py-2 rounded-lg border ${palette.border} ${palette.surfaceAlt} text-xs font-medium ${palette.textSecondary} hover:opacity-90 whitespace-nowrap shrink-0`}
                >
                  {t.navBuyerStudio}
                </button>

                <button
                  type="button"
                  onClick={onOpenSellPage}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg ${palette.accentBg} ${palette.accentBgHover} text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.postListing}</span>
                </button>
              </div>
            </div>

            {/* 4-Column KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className={`rounded-xl border ${palette.border} ${palette.surface} p-4 space-y-2`}>
                <div className={`text-xs font-medium ${palette.textMuted}`}>{t.dashKpiListings}</div>
                <div className="font-mono text-2xl font-bold tabular-nums">
                  {metrics.totalListings}
                </div>
                <div className={`text-xs ${palette.textMuted} tabular-nums`}>
                  {metrics.saleCount} {t.txSale} · {metrics.rentCount} {t.txRent}
                </div>
              </div>

              <div className={`rounded-xl border ${palette.border} ${palette.surface} p-4 space-y-2`}>
                <div className={`text-xs font-medium ${palette.textMuted}`}>{t.dashKpiOrders}</div>
                <div className="font-mono text-2xl font-bold tabular-nums">
                  {metrics.totalOrders}
                </div>
                <div className={`text-xs ${palette.textMuted} tabular-nums`}>
                  {user
                    ? `${metrics.pendingOrders} Pending · ${metrics.confirmedOrders} Confirmed`
                    : t.signInGoogle}
                </div>
              </div>

              <div className={`rounded-xl border ${palette.border} ${palette.surface} p-4 space-y-2`}>
                <div className={`text-xs font-medium ${palette.textMuted}`}>{t.dashKpiVolume}</div>
                <div className={`font-mono text-2xl font-bold tabular-nums ${palette.accentText}`}>
                  {formatCompactCurrency(metrics.orderEtb, 'ETB')}
                </div>
                <div className={`text-xs ${palette.textMuted} font-mono tabular-nums`}>
                  + {formatCompactCurrency(metrics.orderUsd, 'USD')}
                </div>
              </div>

              <div className={`rounded-xl border ${palette.border} ${palette.surface} p-4 space-y-2`}>
                <div className={`text-xs font-medium ${palette.textMuted}`}>{t.dashKpiDemand}</div>
                <div className="font-mono text-2xl font-bold tabular-nums">
                  {metrics.activeRequests}
                </div>
                <div className={`text-xs ${palette.textMuted} tabular-nums`}>
                  {savedIds.size} {t.tabSaved}
                </div>
              </div>
            </div>

            {effectiveTab === 'overview' && (
              <>
                {/* 2-Column Analytics Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div
                    className={`lg:col-span-7 rounded-xl border ${palette.border} ${palette.surface} p-5 space-y-4`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className={`w-4 h-4 ${palette.accentText}`} />
                        <span>{t.dashCategoryMix}</span>
                      </h2>
                      <span className={`text-xs font-mono tabular-nums ${palette.textMuted}`}>
                        {metrics.totalListings} {t.resultsCount}
                      </span>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      {categoryRows.map(({ key, Icon }) => {
                        const count = metrics.categoryCounts[key] || 0;
                        const pct =
                          metrics.totalListings > 0
                            ? Math.round((count / metrics.totalListings) * 100)
                            : 0;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setCatFilter(key);
                              setActiveTab('listings');
                            }}
                            className={`w-full text-left space-y-1.5 p-2 -mx-2 rounded-lg transition-colors ${palette.rowHover}`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className={`flex items-center gap-2 font-medium ${palette.textSecondary}`}>
                                <Icon className={`w-3.5 h-3.5 ${palette.accentText}`} />
                                <span>{getCategoryLabel(key, lang)}</span>
                              </span>
                              <span className={`font-mono tabular-nums ${palette.textMuted}`}>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className={`w-full h-2 rounded-full ${palette.surfaceAlt} overflow-hidden`}>
                              <div
                                className={`h-full rounded-full ${palette.accentBar} transition-all duration-200`}
                                style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className={`lg:col-span-5 rounded-xl border ${palette.border} ${palette.surface} p-5 flex flex-col justify-between gap-6`}
                  >
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold">{t.dashSaleVsRent}</h2>
                      {(() => {
                        const total = metrics.saleCount + metrics.rentCount;
                        const salePct = total > 0 ? Math.round((metrics.saleCount / total) * 100) : 50;
                        const rentPct = total > 0 ? 100 - salePct : 50;
                        return (
                          <div className="space-y-2.5">
                            <div className={`w-full h-3 rounded-full ${palette.surfaceAlt} overflow-hidden flex`}>
                              <div
                                className={`h-full ${palette.accentBar}`}
                                style={{ width: `${salePct}%` }}
                              />
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${rentPct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs tabular-nums">
                              <span className={palette.textSecondary}>
                                {t.txSale}: <strong className="font-mono">{metrics.saleCount}</strong> ({salePct}%)
                              </span>
                              <span className={palette.textSecondary}>
                                {t.txRent}: <strong className="font-mono">{metrics.rentCount}</strong> ({rentPct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className={`pt-4 border-t ${palette.border} space-y-3`}>
                      <h3 className="text-sm font-semibold">{t.dashNeighborhoodMix}</h3>
                      <div className={`divide-y ${palette.divider}`}>
                        {metrics.topNeighborhoods.map(([hood, count]) => (
                          <div
                            key={hood}
                            className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                          >
                            <span className={palette.textSecondary}>{hood}</span>
                            <span className={`font-mono tabular-nums ${palette.textMuted}`}>
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Listings Preview Table */}
                <div className={`rounded-xl border ${palette.border} ${palette.surface} overflow-hidden`}>
                  <div
                    className={`px-5 py-4 border-b ${palette.border} flex items-center justify-between gap-4`}
                  >
                    <h2 className="text-sm font-semibold">{t.dashRecentActivity}</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('listings')}
                      className={`text-xs font-medium ${palette.accentText} hover:underline inline-flex items-center gap-1 whitespace-nowrap`}
                    >
                      <span>{t.dashNavListings}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!listingsLoaded ? (
                    <div className="p-5 space-y-3 animate-pulse">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={`h-9 rounded ${palette.surfaceAlt}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                        <thead>
                          <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                            <th className="py-2.5 px-5 font-medium">{t.dashColItem}</th>
                            <th className="py-2.5 px-3 font-medium">{t.dashColCategory}</th>
                            <th className="py-2.5 px-3 font-medium">{t.dashColType}</th>
                            <th className="py-2.5 px-3 font-medium">{t.dashColLocation}</th>
                            <th className="py-2.5 px-3 font-medium">{t.dashColStatus}</th>
                            <th className="py-2.5 px-3 font-medium text-right">{t.dashColPrice}</th>
                            <th className="py-2.5 px-5 font-medium text-right">{t.dashColAction}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${palette.divider}`}>
                          {allListings.slice(0, 6).map((item) => (
                            <tr key={item.id} className={`h-11 transition-colors ${palette.rowHover}`}>
                              <td className="py-2 px-5 font-medium max-w-[260px] truncate">
                                {item.title}
                              </td>
                              <td className={`py-2 px-3 ${palette.textMuted} whitespace-nowrap`}>
                                {getCategoryLabel(item.category, lang)}
                              </td>
                              <td className={`py-2 px-3 ${palette.textSecondary} whitespace-nowrap`}>
                                {getTransactionLabel(item.transactionType, lang)}
                              </td>
                              <td className={`py-2 px-3 ${palette.textMuted} whitespace-nowrap`}>
                                {item.neighborhood}
                              </td>
                              <td
                                className={`py-2 px-3 font-medium whitespace-nowrap ${listingStatusTextColor(
                                  item.status
                                )}`}
                              >
                                {getStatusLabel(item.status, lang)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                                {formatPrice(item.price, item.currency, item.pricePeriod, lang)}
                              </td>
                              <td className="py-2 px-5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => onSelectListing(item, 'order')}
                                  className={`text-xs font-medium ${palette.accentText} hover:underline`}
                                >
                                  {t.dashOpenDetails}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {effectiveTab === 'listings' && (
              <div className={`rounded-xl border ${palette.border} ${palette.surface} overflow-hidden`}>
                <div className={`p-4 sm:p-5 border-b ${palette.border} flex flex-col lg:flex-row lg:items-center justify-between gap-3`}>
                  <div className="relative flex-1 max-w-md">
                    <Search className={`w-4 h-4 ${palette.textMuted} absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`} />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className={`w-full h-9 pl-9 pr-3 rounded-lg border text-xs ${palette.inputBg} focus:outline-none`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`inline-flex items-center gap-1 p-1 rounded-lg ${palette.surfaceAlt}`}>
                      {(
                        [
                          { key: 'all', label: t.txAll },
                          { key: 'sale', label: t.txSale },
                          { key: 'rent', label: t.txRent },
                        ] as { key: 'all' | TransactionType; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setTxFilter(opt.key)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                            txFilter === opt.key
                              ? `${palette.accentBg} text-white`
                              : `${palette.textMuted} hover:text-white`
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <select
                      aria-label="Filter dashboard category"
                      value={catFilter}
                      onChange={(e) => setCatFilter(e.target.value as 'all' | ListingCategory)}
                      className={`h-9 px-3 rounded-lg border text-xs ${palette.inputBg}`}
                    >
                      <option value="all">{t.allCategories}</option>
                      <option value="apartment">{t.catApartment}</option>
                      <option value="house">{t.catHouse}</option>
                      <option value="land">{t.catLand}</option>
                      <option value="vehicle">{t.catVehicle}</option>
                      <option value="goods">{t.catGoods}</option>
                    </select>

                    <select
                      aria-label="Filter dashboard status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | ListingStatus)}
                      className={`h-9 px-3 rounded-lg border text-xs ${palette.inputBg}`}
                    >
                      <option value="all">{t.dashAllStatuses}</option>
                      <option value="available">{t.statusAvailable}</option>
                      <option value="reserved">{t.statusReserved}</option>
                      <option value="closed">{t.statusClosed}</option>
                    </select>
                  </div>
                </div>

                {filteredListings.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <p className={`text-xs ${palette.textMuted}`}>{t.dashNoActivity}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setTxFilter('all');
                        setCatFilter('all');
                        setStatusFilter('all');
                      }}
                      className={`px-4 py-2 rounded-lg ${palette.accentBg} text-white text-xs font-medium`}
                    >
                      {t.resetFilters}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[740px]">
                      <thead>
                        <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                          <th className="py-2.5 px-5 font-medium">{t.dashColItem}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColCategory}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColType}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColLocation}</th>
                          <th className="py-2.5 px-3 font-medium">{t.sellerLabel}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColStatus}</th>
                          <th className="py-2.5 px-3 font-medium text-right">{t.dashColPrice}</th>
                          <th className="py-2.5 px-5 font-medium text-right">{t.dashColAction}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${palette.divider}`}>
                        {filteredListings.map((item) => (
                          <tr key={item.id} className={`h-11 transition-colors ${palette.rowHover}`}>
                            <td className="py-2 px-5 font-medium max-w-[240px] truncate">
                              {item.title}
                            </td>
                            <td className={`py-2 px-3 ${palette.textMuted} whitespace-nowrap`}>
                              {getCategoryLabel(item.category, lang)}
                            </td>
                            <td className={`py-2 px-3 ${palette.textSecondary} whitespace-nowrap`}>
                              {getTransactionLabel(item.transactionType, lang)}
                            </td>
                            <td className={`py-2 px-3 ${palette.textMuted} whitespace-nowrap`}>
                              {item.neighborhood}
                            </td>
                            <td className={`py-2 px-3 ${palette.textMuted} max-w-[140px] truncate`}>
                              {item.sellerName}
                            </td>
                            <td
                              className={`py-2 px-3 font-medium whitespace-nowrap ${listingStatusTextColor(
                                item.status
                              )}`}
                            >
                              {getStatusLabel(item.status, lang)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                              {formatPrice(item.price, item.currency, item.pricePeriod, lang)}
                            </td>
                            <td className="py-2 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => onSelectListing(item, 'order')}
                                  className={`text-xs font-medium ${palette.accentText} hover:underline`}
                                >
                                  {t.dashOpenDetails}
                                </button>
                                {(isAdmin ||
                                  (user && !item.isShowcase && item.ownerId === user.uid)) && (
                                  <button
                                    type="button"
                                    disabled={busyListingId === item.id}
                                    onClick={async () => {
                                      setBusyListingId(item.id);
                                      try {
                                        if (onDeleteListing) {
                                          await onDeleteListing(item);
                                        } else if (!item.isShowcase) {
                                          await removeListing(item.id);
                                        }
                                      } finally {
                                        setBusyListingId(null);
                                      }
                                    }}
                                    aria-label={t.deleteListing}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{t.deleteListing}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {effectiveTab === 'orders' && (
              <div className={`rounded-xl border ${palette.border} ${palette.surface} p-5 space-y-6`}>
                {user && notifications.length > 0 && (
                  <div
                    className={`rounded-lg border ${palette.border} ${palette.surfaceAlt} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Bell className={`w-4 h-4 ${palette.accentText}`} />
                        <span>
                          {t.tabNotifications}
                          {unreadNotifications.length > 0 && (
                            <span className={`ml-1.5 font-mono tabular-nums ${palette.accentText}`}>
                              ({unreadNotifications.length} {t.notifUnreadLabel})
                            </span>
                          )}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${palette.textMuted}`}>
                        {notifications[0].orderNumber} ·{' '}
                        {getNotificationEventTitle(notifications[0].eventType, lang)} ·{' '}
                        {notifications[0].listingTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unreadNotifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            markAllNotificationsRead(unreadNotifications.map((n) => n.id)).catch(
                              () => {}
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg border ${palette.border} text-xs font-medium ${palette.textSecondary} hover:opacity-90`}
                        >
                          {t.notifMarkAllRead}
                        </button>
                      )}
                      {onOpenNotifications && (
                        <button
                          type="button"
                          onClick={onOpenNotifications}
                          className={`px-3 py-1.5 rounded-lg ${palette.accentBg} ${palette.accentBgHover} text-white text-xs font-medium`}
                        >
                          {t.tabNotifications}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!user ? (
                  <div className="py-10 text-center space-y-4">
                    <p className={`text-sm ${palette.textMuted}`}>{t.dashSignInForOrders}</p>
                    <button
                      type="button"
                      onClick={onSignIn}
                      className={`px-5 py-2.5 rounded-lg ${palette.accentBg} ${palette.accentBgHover} text-white text-xs font-medium`}
                    >
                      {t.signInGoogle}
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-10 text-center space-y-4">
                    <p className={`text-sm ${palette.textMuted}`}>{t.emptyOrders}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {incomingOrders.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold">{t.incomingOrdersTitle}</h2>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                            <thead>
                              <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                                <th className="py-2 pr-3 font-medium">#</th>
                                <th className="py-2 px-3 font-medium">{t.dashColItem}</th>
                                <th className="py-2 px-3 font-medium">{t.yourName}</th>
                                <th className="py-2 px-3 font-medium">{t.paymentMethodLabel}</th>
                                <th className="py-2 px-3 font-medium">{t.dashColStatus}</th>
                                <th className="py-2 px-3 font-medium text-right">{t.orderTotalLabel}</th>
                                <th className="py-2 pl-3 font-medium text-right">{t.dashColAction}</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${palette.divider}`}>
                              {incomingOrders.map((ord) => (
                                <tr key={ord.id} className={`h-11 ${palette.rowHover}`}>
                                  <td className="py-2 pr-3 font-mono tabular-nums">{ord.orderNumber}</td>
                                  <td className="py-2 px-3 font-medium max-w-[200px] truncate">{ord.listingTitle}</td>
                                  <td className={`py-2 px-3 ${palette.textMuted}`}>{ord.buyerName}</td>
                                  <td className={`py-2 px-3 ${palette.textMuted}`}>
                                    {getPaymentMethodLabel(ord.paymentMethod, lang)}
                                  </td>
                                  <td className={`py-2 px-3 font-medium ${orderStatusTextColor(ord.status)}`}>
                                    {getOrderStatusLabel(ord.status, lang)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                                    {formatPrice(ord.totalAmount, ord.currency, 'total', lang)}
                                  </td>
                                  <td className="py-2 pl-3 text-right whitespace-nowrap space-x-2">
                                    {ord.status === 'pending' && (
                                      <button
                                        type="button"
                                        disabled={busyOrderId === ord.id}
                                        onClick={async () => {
                                          setBusyOrderId(ord.id);
                                          try {
                                            await updateOrderStatus(ord.id, 'confirmed');
                                          } finally {
                                            setBusyOrderId(null);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded ${palette.accentBg} text-white text-xs font-medium`}
                                      >
                                        {t.confirmOrderAction}
                                      </button>
                                    )}
                                    {ord.status === 'confirmed' && (
                                      <button
                                        type="button"
                                        disabled={busyOrderId === ord.id}
                                        onClick={async () => {
                                          setBusyOrderId(ord.id);
                                          try {
                                            await updateOrderStatus(ord.id, 'completed');
                                          } finally {
                                            setBusyOrderId(null);
                                          }
                                        }}
                                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium"
                                      >
                                        {t.completeOrderAction}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={busyOrderId === ord.id}
                                      onClick={async () => {
                                        setBusyOrderId(ord.id);
                                        try {
                                          await removeOrder(ord.id);
                                        } finally {
                                          setBusyOrderId(null);
                                        }
                                      }}
                                      aria-label={t.deleteOrderAction}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-medium disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{t.deleteListing}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {placedOrders.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold">{t.placedOrdersTitle}</h2>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                            <thead>
                              <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                                <th className="py-2 pr-3 font-medium">#</th>
                                <th className="py-2 px-3 font-medium">{t.dashColItem}</th>
                                <th className="py-2 px-3 font-medium">{t.sellerLabel}</th>
                                <th className="py-2 px-3 font-medium">{t.paymentMethodLabel}</th>
                                <th className="py-2 px-3 font-medium">{t.dashColStatus}</th>
                                <th className="py-2 px-3 font-medium text-right">{t.orderTotalLabel}</th>
                                <th className="py-2 pl-3 font-medium text-right">{t.dashColAction}</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${palette.divider}`}>
                              {placedOrders.map((ord) => (
                                <tr key={ord.id} className={`h-11 ${palette.rowHover}`}>
                                  <td className="py-2 pr-3 font-mono tabular-nums">{ord.orderNumber}</td>
                                  <td className="py-2 px-3 font-medium max-w-[220px] truncate">{ord.listingTitle}</td>
                                  <td className={`py-2 px-3 ${palette.textMuted}`}>{ord.sellerName}</td>
                                  <td className={`py-2 px-3 ${palette.textMuted}`}>
                                    {getPaymentMethodLabel(ord.paymentMethod, lang)}
                                  </td>
                                  <td className={`py-2 px-3 font-medium ${orderStatusTextColor(ord.status)}`}>
                                    {getOrderStatusLabel(ord.status, lang)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                                    {formatPrice(ord.totalAmount, ord.currency, 'total', lang)}
                                  </td>
                                  <td className="py-2 pl-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      disabled={busyOrderId === ord.id}
                                      onClick={async () => {
                                        setBusyOrderId(ord.id);
                                        try {
                                          await removeOrder(ord.id);
                                        } finally {
                                          setBusyOrderId(null);
                                        }
                                      }}
                                      aria-label={t.deleteOrderAction}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-medium disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{t.deleteListing}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {otherAdminOrders.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold">
                          {t.allOrdersTitle} ({otherAdminOrders.length})
                        </h2>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse min-w-[740px]">
                            <thead>
                              <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                                <th className="py-2 pr-3 font-medium">#</th>
                                <th className="py-2 px-3 font-medium">{t.dashColItem}</th>
                                <th className="py-2 px-3 font-medium">{t.yourName}</th>
                                <th className="py-2 px-3 font-medium">{t.sellerLabel}</th>
                                <th className="py-2 px-3 font-medium">{t.dashColStatus}</th>
                                <th className="py-2 px-3 font-medium text-right">{t.orderTotalLabel}</th>
                                <th className="py-2 pl-3 font-medium text-right">{t.dashColAction}</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${palette.divider}`}>
                              {otherAdminOrders.map((ord) => (
                                <tr key={ord.id} className={`h-11 ${palette.rowHover}`}>
                                  <td className="py-2 pr-3 font-mono tabular-nums">{ord.orderNumber}</td>
                                  <td className="py-2 px-3 font-medium max-w-[200px] truncate">{ord.listingTitle}</td>
                                  <td className={`py-2 px-3 ${palette.textMuted}`}>{ord.buyerName}</td>
                                  <td className={`py-2 px-3 ${palette.textMuted}`}>{ord.sellerName}</td>
                                  <td className={`py-2 px-3 font-medium ${orderStatusTextColor(ord.status)}`}>
                                    {getOrderStatusLabel(ord.status, lang)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                                    {formatPrice(ord.totalAmount, ord.currency, 'total', lang)}
                                  </td>
                                  <td className="py-2 pl-3 text-right whitespace-nowrap space-x-2">
                                    {ord.status === 'pending' && (
                                      <button
                                        type="button"
                                        disabled={busyOrderId === ord.id}
                                        onClick={async () => {
                                          setBusyOrderId(ord.id);
                                          try {
                                            await updateOrderStatus(ord.id, 'confirmed');
                                          } finally {
                                            setBusyOrderId(null);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded ${palette.accentBg} text-white text-xs font-medium`}
                                      >
                                        {t.confirmOrderAction}
                                      </button>
                                    )}
                                    {ord.status === 'confirmed' && (
                                      <button
                                        type="button"
                                        disabled={busyOrderId === ord.id}
                                        onClick={async () => {
                                          setBusyOrderId(ord.id);
                                          try {
                                            await updateOrderStatus(ord.id, 'completed');
                                          } finally {
                                            setBusyOrderId(null);
                                          }
                                        }}
                                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-medium"
                                      >
                                        {t.completeOrderAction}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={busyOrderId === ord.id}
                                      onClick={async () => {
                                        setBusyOrderId(ord.id);
                                        try {
                                          await removeOrder(ord.id);
                                        } finally {
                                          setBusyOrderId(null);
                                        }
                                      }}
                                      aria-label={t.deleteOrderAction}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-medium disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{t.deleteListing}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {effectiveTab === 'demand' && (
              <div className={`rounded-xl border ${palette.border} ${palette.surface} overflow-hidden`}>
                <div className={`px-5 py-4 border-b ${palette.border} flex items-center justify-between gap-4`}>
                  <h2 className="text-sm font-semibold">
                    {t.activeWantedTitle} ({buyerRequests.length})
                  </h2>
                  <button
                    type="button"
                    onClick={onOpenBuyerStudio}
                    className={`px-3.5 py-1.5 rounded-lg ${palette.accentBg} ${palette.accentBgHover} text-white text-xs font-medium whitespace-nowrap`}
                  >
                    {t.wantedButton}
                  </button>
                </div>

                {buyerRequests.length === 0 ? (
                  <div className={`p-10 text-center text-xs ${palette.textMuted}`}>{t.dashNoActivity}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                      <thead>
                        <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                          <th className="py-2.5 px-5 font-medium">{t.wantedTitleLabel}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColCategory}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColType}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColLocation}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColStatus}</th>
                          <th className="py-2.5 px-3 font-medium text-right">{t.maxBudgetLabel}</th>
                          <th className="py-2.5 px-5 font-medium text-right">{t.dashColAction}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${palette.divider}`}>
                        {buyerRequests.map((req) => (
                          <tr key={req.id} className={`h-11 ${palette.rowHover}`}>
                            <td className="py-2 px-5 font-medium max-w-[260px] truncate">{req.title}</td>
                            <td className={`py-2 px-3 ${palette.textMuted}`}>
                              {getCategoryLabel(req.category, lang)}
                            </td>
                            <td className={`py-2 px-3 ${palette.textSecondary}`}>
                              {getTransactionLabel(req.transactionType, lang)}
                            </td>
                            <td className={`py-2 px-3 ${palette.textMuted}`}>{req.preferredNeighborhood}</td>
                            <td
                              className={`py-2 px-3 font-medium capitalize ${
                                req.status === 'active' ? 'text-emerald-400' : palette.textMuted
                              }`}
                            >
                              {req.status}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                              {formatPrice(req.maxBudget, req.currency, 'total', lang)}
                            </td>
                            <td className="py-2 px-5 text-right whitespace-nowrap">
                              {(isAdmin || (user && req.buyerId === user.uid)) && (
                                <button
                                  type="button"
                                  disabled={busyRequestId === req.id}
                                  onClick={async () => {
                                    setBusyRequestId(req.id);
                                    try {
                                      await deleteBuyerRequest(req.id);
                                    } finally {
                                      setBusyRequestId(null);
                                    }
                                  }}
                                  aria-label={t.deleteListing}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.deleteListing}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {effectiveTab === 'contacts' && isAdmin && (
              <div className={`rounded-xl border ${palette.border} ${palette.surface} overflow-hidden`}>
                <div className={`p-5 border-b ${palette.border} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <Lock className={`w-4 h-4 ${palette.accentText}`} />
                      <span>{t.dashContactsTitle}</span>
                    </h2>
                    <p className={`text-xs ${palette.textMuted}`}>{t.dashContactsSubtitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      <Search
                        className={`w-3.5 h-3.5 ${palette.textMuted} absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`}
                      />
                      <input
                        type="search"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className={`h-9 w-56 pl-8 pr-3 rounded-lg border text-xs ${palette.inputBg} focus:outline-none`}
                      />
                    </div>

                    <div className={`inline-flex items-center gap-1 p-1 rounded-lg ${palette.surfaceAlt}`}>
                      {(
                        [
                          { key: 'all', label: t.dashRoleAll },
                          { key: 'seller', label: t.dashRoleSeller },
                          { key: 'buyer', label: t.dashRoleBuyer },
                        ] as { key: 'all' | ContactRole; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setContactRoleFilter(opt.key)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            contactRoleFilter === opt.key
                              ? `${palette.accentBg} text-white`
                              : `${palette.textMuted} hover:text-white`
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className={`p-10 text-center text-xs ${palette.textMuted}`}>
                    {contactDirectory.length === 0 ? t.dashNoContacts : t.dashNoActivity}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                      <thead>
                        <tr className={`border-b ${palette.border} ${palette.textMuted}`}>
                          <th className="py-2.5 px-5 font-medium">{t.dashColUser}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColRole}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColPhone}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColSource}</th>
                          <th className="py-2.5 px-3 font-medium">{t.dashColDate}</th>
                          <th className="py-2.5 px-5 font-medium text-right">{t.dashColAction}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${palette.divider}`}>
                        {filteredContacts.map((entry) => (
                          <tr key={entry.id} className={`h-12 transition-colors ${palette.rowHover}`}>
                            <td className="py-2 px-5 max-w-[220px]">
                              <div className="font-medium truncate">{entry.userName}</div>
                              <div className={`text-[11px] truncate ${palette.textMuted}`}>
                                {entry.userEmail}
                              </div>
                            </td>
                            <td
                              className={`py-2 px-3 font-medium whitespace-nowrap ${
                                entry.role === 'seller' ? palette.accentText : 'text-emerald-400'
                              }`}
                            >
                              {getContactRoleLabel(entry.role)}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <a
                                href={`tel:${entry.phone}`}
                                className={`font-mono font-semibold tabular-nums ${palette.accentText} hover:underline`}
                              >
                                {entry.phone}
                              </a>
                            </td>
                            <td className="py-2 px-3 max-w-[260px]">
                              <div className={`font-medium truncate ${palette.textSecondary}`}>
                                {getContactActionLabel(entry.actionType)}
                                {entry.neighborhood ? ` · ${entry.neighborhood}` : ''}
                              </div>
                              {entry.listingTitle && (
                                <div className={`text-[11px] truncate ${palette.textMuted}`}>
                                  {entry.listingTitle}
                                </div>
                              )}
                            </td>
                            <td className={`py-2 px-3 font-mono tabular-nums whitespace-nowrap ${palette.textMuted}`}>
                              {formatContactDate(entry.createdAtMs)}
                            </td>
                            <td className="py-2 px-5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                disabled={busyContactId === entry.id}
                                onClick={async () => {
                                  setBusyContactId(entry.id);
                                  try {
                                    await deleteContactEntry(entry.id);
                                  } finally {
                                    setBusyContactId(null);
                                  }
                                }}
                                aria-label={t.deleteListing}
                                className={`inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t.deleteListing}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
