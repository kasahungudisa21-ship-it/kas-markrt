import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { BellRing, Building2, Car, Globe, LogOut, MapPin, Package, Search, X } from 'lucide-react';
import { BuyerView } from './components/BuyerView';
import { ConnectionsTab, ConnectionsView } from './components/ConnectionsView';
import { DashboardTheme, DashboardView } from './components/DashboardView';
import { KasLogo } from './components/KasLogo';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { ListingFormModal } from './components/ListingFormModal';
import { Navbar, NavSection } from './components/Navbar';
import { ResilientImage } from './components/ResilientImage';
import { SellView } from './components/SellView';
import { HERO_IMAGE, NEIGHBORHOOD_OPTIONS } from './data/showcaseListings';
import {
  auth,
  getMySavedPhone,
  isAdminUser,
  markNotificationRead,
  removeListing,
  signInWithGoogle,
  signOutAccount,
  subscribeAdminNotifications,
  subscribeAdminOrders,
  subscribeBuyerRequests,
  subscribeContactDirectory,
  subscribeListings,
  subscribeSavedItems,
  subscribeUserInquiries,
  syncUserProfile,
  toggleSavedListing,
} from './firebase';
import { getNotificationEventTitle, translations } from './i18n';
import {
  AppNotification,
  BuyerRequest,
  ContactEntry,
  Inquiry,
  Language,
  Listing,
  ListingCategory,
  Order,
  RoomClass,
  TransactionType,
} from './types';
import { formatFirestoreUserError, formatPrice } from './utils/format';
import { playOrderChime, showBrowserOrderNotification } from './utils/notifications';

type CategoryFilter = 'all' | 'properties' | ListingCategory;
type TxFilter = 'all' | TransactionType;
type SortOrder = 'newest' | 'price_asc' | 'price_desc';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activeNav, setActiveNav] = useState<NavSection>('explore');
  const [buyerMode, setBuyerMode] = useState<TransactionType>('sale');
  const [dashboardTheme, setDashboardTheme] = useState<DashboardTheme>('cobalt');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [roomClassFilter, setRoomClassFilter] = useState<'all' | RoomClass>('all');
  const [tenantPrefFilter, setTenantPrefFilter] = useState<'all' | 'late' | 'bale_tedar'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [firestoreListings, setFirestoreListings] = useState<Listing[]>([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [localSavedIds, setLocalSavedIds] = useState<Set<string>>(new Set());
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [savedPhone, setSavedPhone] = useState('');
  const [contactDirectory, setContactDirectory] = useState<ContactEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [connectionsRequestedTab, setConnectionsRequestedTab] = useState<ConnectionsTab | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const hydratedNotifKeyRef = useRef<string | null>(null);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const langRef = useRef<Language>(lang);
  langRef.current = lang;

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedInitialTab, setSelectedInitialTab] = useState<'order' | 'message'>('order');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const t = translations[lang];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        try {
          await syncUserProfile(nextUser);
        } catch {
          // Profile sync errors are logged inside syncUserProfile
        }
      } else {
        setSavedIds(new Set());
        setInquiries([]);
        setOrders([]);
        setSavedPhone('');
        setContactDirectory([]);
        setNotifications([]);
        setActiveToasts([]);
        hydratedNotifKeyRef.current = null;
        seenNotifIdsRef.current = new Set();
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubListings = subscribeListings(
      (items) => {
        setFirestoreListings(items);
        setListingsLoaded(true);
        setDataError(null);
      },
      (err) => {
        setListingsLoaded(true);
        setDataError(formatFirestoreUserError(err, langRef.current));
      }
    );
    const unsubRequests = subscribeBuyerRequests(
      (items) => {
        setBuyerRequests(items);
      },
      () => {
        // Logged in handleFirestoreError
      }
    );
    return () => {
      unsubListings();
      unsubRequests();
    };
  }, []);

  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!authReady || !user) return;
    let cancelled = false;
    getMySavedPhone(user.uid)
      .then((phone) => {
        if (!cancelled && phone) {
          setSavedPhone(phone);
        }
      })
      .catch(() => {
        // Logged inside handleFirestoreError
      });

    const unsubSaved = subscribeSavedItems(
      user.uid,
      (items) => {
        setSavedIds(new Set(items.map((i) => i.listingId)));
      },
      () => {
        // Logged in handleFirestoreError
      }
    );
    const unsubInquiries = subscribeUserInquiries(
      user.uid,
      (items) => {
        setInquiries(items);
      },
      () => {
        // Logged in handleFirestoreError
      }
    );
    let unsubOrders: () => void = () => {};
    if (isAdmin) {
      unsubOrders = subscribeAdminOrders(
        (items) => {
          setOrders(items);
        },
        () => {
          // Logged in handleFirestoreError
        }
      );
    } else {
      setOrders([]);
    }

    const unsubContacts = isAdmin
      ? subscribeContactDirectory(
          (entries) => {
            setContactDirectory(entries);
          },
          () => {
            // Logged in handleFirestoreError
          }
        )
      : () => {};

    const notifFeedKey = `${user.uid}:${isAdmin ? 'admin' : 'user'}`;
    if (hydratedNotifKeyRef.current !== notifFeedKey) {
      hydratedNotifKeyRef.current = null;
      seenNotifIdsRef.current = new Set();
    }

    const handleNotificationsSnapshot = (items: AppNotification[]) => {
      setNotifications(items);

      if (hydratedNotifKeyRef.current !== notifFeedKey) {
        hydratedNotifKeyRef.current = notifFeedKey;
        items.forEach((n) => seenNotifIdsRef.current.add(n.id));
        return;
      }

      const freshUnread = items.filter(
        (n) => !n.isRead && !seenNotifIdsRef.current.has(n.id)
      );
      items.forEach((n) => seenNotifIdsRef.current.add(n.id));

      if (freshUnread.length > 0) {
        playOrderChime();
        const currentLang = langRef.current;
        freshUnread.forEach((n) => {
          showBrowserOrderNotification(
            getNotificationEventTitle(n.eventType, currentLang),
            `${n.orderNumber} · ${n.listingTitle}`
          );
        });
        setActiveToasts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueFresh = freshUnread.filter((n) => !existingIds.has(n.id));
          return [...uniqueFresh, ...prev].slice(0, 3);
        });
      }
    };

    let unsubNotifications: () => void = () => {};
    if (isAdmin) {
      unsubNotifications = subscribeAdminNotifications(handleNotificationsSnapshot, () => {
        // Logged in handleFirestoreError
      });
    } else {
      setNotifications([]);
      setActiveToasts([]);
    }

    return () => {
      cancelled = true;
      unsubSaved();
      unsubInquiries();
      unsubOrders();
      unsubContacts();
      unsubNotifications();
    };
  }, [authReady, user, isAdmin]);

  const combinedListings = firestoreListings;

  const myListings = useMemo(() => {
    if (!user) return [];
    return firestoreListings.filter((l) => l.ownerId === user.uid);
  }, [firestoreListings, user]);

  const incomingOrdersCount = useMemo(() => {
    if (!user || !isAdmin) return 0;
    return orders.filter((o) => o.sellerId === user.uid).length;
  }, [orders, user, isAdmin]);

  const unreadNotificationsCount = useMemo(
    () => (isAdmin ? notifications.filter((n) => !n.isRead).length : 0),
    [notifications, isAdmin]
  );

  useEffect(() => {
    if (activeToasts.length === 0) return;
    const timer = window.setTimeout(() => {
      setActiveToasts((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [activeToasts]);

  const effectiveSavedIds = useMemo(() => {
    const merged = new Set(localSavedIds);
    savedIds.forEach((id) => merged.add(id));
    return merged;
  }, [savedIds, localSavedIds]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = combinedListings.filter((item) => {
      if (categoryFilter === 'properties') {
        if (item.category !== 'apartment' && item.category !== 'house' && item.category !== 'land') {
          return false;
        }
      } else if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (txFilter !== 'all' && item.transactionType !== txFilter) {
        return false;
      }

      const isHousing = item.category === 'apartment' || item.category === 'house';
      if (roomClassFilter !== 'all') {
        if (!isHousing) return false;
        const itemRc =
          item.specs?.roomClass ||
          (item.specs?.bedrooms === 1
            ? '1_class'
            : item.specs?.bedrooms === 2
            ? '2_class'
            : typeof item.specs?.bedrooms === 'number' && item.specs.bedrooms >= 3
            ? '3_plus'
            : undefined);
        if (itemRc !== roomClassFilter) return false;
      }

      if (tenantPrefFilter !== 'all') {
        if (!isHousing) return false;
        const itemTp = item.specs?.tenantPreference;
        if (itemTp !== tenantPrefFilter && itemTp !== 'any') return false;
      }

      const locQ = locationFilter.trim().toLowerCase();
      if (
        locQ &&
        !item.neighborhood.toLowerCase().includes(locQ) &&
        !item.city.toLowerCase().includes(locQ)
      ) {
        return false;
      }

      if (q) {
        const hay = `${item.title} ${item.description} ${item.neighborhood} ${item.city} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    const sorted = [...list];
    if (sortOrder === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
    }
    return sorted;
  }, [
    combinedListings,
    categoryFilter,
    txFilter,
    roomClassFilter,
    tenantPrefFilter,
    locationFilter,
    searchQuery,
    sortOrder,
  ]);

  const handleSelectNav = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'explore') {
      setCategoryFilter('all');
      setTxFilter('all');
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
    } else if (nav === 'properties') {
      setCategoryFilter('properties');
    } else if (nav === 'vehicles') {
      setCategoryFilter('vehicle');
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
    } else if (nav === 'goods') {
      setCategoryFilter('goods');
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
    }
  };

  const handleOpenBuyerMode = (mode: TransactionType) => {
    setBuyerMode(mode);
    setActiveNav('buyer');
  };

  const handleSelectListing = (listing: Listing, initialTab: 'order' | 'message' = 'order') => {
    setSelectedInitialTab(initialTab);
    setSelectedListing(listing);
  };

  const handleToggleSave = async (listing: Listing) => {
    const currentlySaved = effectiveSavedIds.has(listing.id);
    if (!user) {
      setLocalSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.delete(listing.id);
        else next.add(listing.id);
        return next;
      });
      return;
    }
    await toggleSavedListing(user.uid, listing.id, currentlySaved);
  };

  const handleDeleteListing = async (listing: Listing) => {
    await removeListing(listing.id);

    if (selectedListing?.id === listing.id) {
      setSelectedListing(null);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Popup closed or cancelled by user
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAccount();
      setPostModalOpen(false);
      setEditingListing(null);
    } catch {
      // Sign-out state handled by onAuthStateChanged
    }
  };

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setTxFilter('all');
    setRoomClassFilter('all');
    setTenantPrefFilter('all');
    setLocationFilter('');
    setSearchQuery('');
    setSortOrder('newest');
  };

  const locationSuggestions = useMemo(() => {
    const set = new Set<string>(NEIGHBORHOOD_OPTIONS);
    combinedListings.forEach((item) => {
      if (item.neighborhood) set.add(item.neighborhood);
      if (item.city) set.add(item.city);
    });
    return Array.from(set);
  }, [combinedListings]);

  const isDash = activeNav === 'dashboard';
  const rootWrapperBg = isDash
    ? dashboardTheme === 'indigo'
      ? 'bg-[#090A1A] text-indigo-50'
      : dashboardTheme === 'amber'
      ? 'bg-neutral-950 text-neutral-50'
      : 'bg-slate-950 text-slate-50'
    : 'bg-[#EDE8DF] text-[#122620]';

  const footerThemeClass = isDash
    ? dashboardTheme === 'indigo'
      ? 'bg-[#12142B] border-indigo-950 text-indigo-300'
      : dashboardTheme === 'amber'
      ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
      : 'bg-slate-900 border-slate-800 text-slate-400'
    : 'bg-[#0B1F1A] border-[#1A4338] text-[#B9D2C9]';

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${rootWrapperBg}`}>
      <Navbar
        lang={lang}
        activeNav={activeNav}
        activeBuyerMode={buyerMode}
        dashboardTheme={dashboardTheme}
        unreadNotifCount={isAdmin ? unreadNotificationsCount : 0}
        isAdmin={isAdmin}
        user={user}
        onSelectNav={handleSelectNav}
        onOpenBuyMode={() => handleOpenBuyerMode('sale')}
        onOpenRentMode={() => handleOpenBuyerMode('rent')}
        onOpenSellPage={() => setActiveNav('sell')}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        {activeNav === 'dashboard' ? (
          <DashboardView
            lang={lang}
            onToggleLang={() => setLang((prev) => (prev === 'en' ? 'am' : 'en'))}
            theme={dashboardTheme}
            onChangeTheme={setDashboardTheme}
            user={user}
            isAdmin={isAdmin}
            contactDirectory={contactDirectory}
            allListings={combinedListings}
            listingsLoaded={listingsLoaded}
            savedIds={effectiveSavedIds}
            orders={isAdmin ? orders : []}
            notifications={isAdmin ? notifications : []}
            buyerRequests={buyerRequests}
            onSelectListing={handleSelectListing}
            onOpenSellPage={() => setActiveNav('sell')}
            onOpenBuyerStudio={() => setActiveNav('buyer')}
            onOpenNotifications={() => {
              setConnectionsRequestedTab(isAdmin ? 'notifications' : 'listings');
              setActiveNav('connections');
            }}
            onDeleteListing={handleDeleteListing}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        ) : activeNav === 'buyer' ? (
          <BuyerView
            lang={lang}
            user={user}
            isAdmin={isAdmin}
            requestedTransactionType={buyerMode}
            onTransactionTypeChange={setBuyerMode}
            savedPhone={savedPhone}
            allListings={combinedListings}
            savedIds={effectiveSavedIds}
            myOrders={isAdmin ? orders.filter((o) => user && o.buyerId === user.uid) : []}
            buyerRequests={buyerRequests}
            onBackToBrowse={() => setActiveNav('explore')}
            onGoToOrders={() => {
              setConnectionsRequestedTab(isAdmin ? 'orders' : 'saved');
              setActiveNav('connections');
            }}
            onSelectListing={handleSelectListing}
            onToggleSave={handleToggleSave}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        ) : activeNav === 'sell' ? (
          <SellView
            lang={lang}
            user={user}
            isAdmin={isAdmin}
            savedPhone={savedPhone}
            myListings={myListings}
            incomingOrdersCount={isAdmin ? incomingOrdersCount : 0}
            onBackToBrowse={() => setActiveNav('explore')}
            onGoToOrders={() => {
              setConnectionsRequestedTab(isAdmin ? 'orders' : 'listings');
              setActiveNav('connections');
            }}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        ) : activeNav === 'connections' ? (
          <ConnectionsView
            lang={lang}
            user={user}
            isAdmin={isAdmin}
            allListings={combinedListings}
            savedIds={effectiveSavedIds}
            inquiries={inquiries}
            orders={isAdmin ? orders : []}
            notifications={isAdmin ? notifications : []}
            requestedTab={connectionsRequestedTab}
            onClearRequestedTab={() => setConnectionsRequestedTab(null)}
            onBack={() => setActiveNav('explore')}
            onSelectListing={handleSelectListing}
            onToggleSave={handleToggleSave}
            onEditListing={(item) => {
              setEditingListing(item);
              setPostModalOpen(true);
            }}
            onDeleteListing={handleDeleteListing}
            onOpenSellPage={() => setActiveNav('sell')}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        ) : (
          <>
            {/* Section 1: Architectural Hero Split + 4-Column Category Strip */}
            <section className="bg-gradient-to-br from-[#0D332A] via-[#114237] to-[#143A4A] border-b border-[#225C4E] text-[#FCF9F2]">
              <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-between gap-6 py-1">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-amber-300 tracking-wide">
                          {t.heroLocationCaption}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setLang((prev) => (prev === 'en' ? 'am' : 'en'))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2B6E5E] bg-[#164A3E] hover:bg-[#1D5C4E] text-xs font-medium text-[#FCF9F2] transition-colors whitespace-nowrap shrink-0"
                          >
                            <Globe className="w-3.5 h-3.5 text-amber-300" />
                            <span>{lang === 'en' ? 'አማርኛ' : 'English'}</span>
                          </button>

                          {user ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setActiveNav('connections')}
                                className="px-3 py-1.5 rounded-lg border border-[#2B6E5E] bg-[#164A3E] hover:bg-[#1D5C4E] text-xs font-medium text-emerald-100 truncate max-w-[140px]"
                              >
                                {user.displayName || t.signedInAs}
                              </button>
                              <button
                                type="button"
                                onClick={handleSignOut}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2B6E5E] bg-[#164A3E] hover:bg-red-900/70 hover:text-red-100 hover:border-red-400/50 text-xs font-medium text-emerald-100 transition-colors whitespace-nowrap shrink-0"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>{t.signOut}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSignIn}
                              className="px-3 py-1.5 rounded-lg border border-amber-300/60 bg-amber-400/15 hover:bg-amber-400/25 text-xs font-semibold text-amber-200 whitespace-nowrap shrink-0"
                            >
                              {t.signInGoogle}
                            </button>
                          )}
                        </div>
                      </div>

                      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#FCF8EE] leading-[1.12] [text-wrap:balance]">
                        {t.heroTitle}
                      </h1>

                      <p className="text-[15px] sm:text-base text-[#CCE5DC] leading-relaxed max-w-xl">
                        {t.heroSubtitle}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="inline-flex items-center gap-1 p-1 bg-[#08221C] border border-[#215A4C] rounded-lg w-fit">
                        {(
                          [
                            { key: 'all', label: t.txAll },
                            { key: 'sale', label: t.txSale },
                            { key: 'rent', label: t.txRent },
                          ] as { key: TxFilter; label: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setTxFilter(opt.key)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                              txFilter === opt.key
                                ? 'bg-amber-400 text-[#0B2620] shadow-sm'
                                : 'text-emerald-100 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const el = document.getElementById('marketplace-catalog');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex flex-col sm:flex-row gap-2.5"
                      >
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-[#125140] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#B9D0C6] bg-[#FFFDF8] text-sm text-[#102620] placeholder:text-[#5C7069] focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="h-11 px-6 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A231D] text-sm font-bold transition-colors whitespace-nowrap shrink-0 shadow-sm"
                        >
                          {t.searchButton}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-6 relative rounded-xl overflow-hidden bg-[#0A2620] border border-[#256254] min-h-[260px] lg:min-h-[340px]">
                    <ResilientImage
                      src={HERO_IMAGE}
                      alt={t.heroTitle}
                      category="house"
                      className="w-full h-full lg:h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 sm:p-6">
                      <p className="text-xs font-semibold text-amber-200">
                        {t.stripPropertiesTitle} · {t.stripLandTitle} · {t.stripVehiclesTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4-Column Quick Category Strip — Distinct Domain Color Surfaces */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('properties');
                      setActiveNav('properties');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      categoryFilter === 'properties' ||
                      categoryFilter === 'apartment' ||
                      categoryFilter === 'house'
                        ? 'border-emerald-300 bg-[#145C49] text-white ring-1 ring-emerald-300'
                        : 'border-[#A7D9C6] bg-[#E3F5EE] hover:bg-[#D2EFE4]'
                    }`}
                  >
                    <Building2
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        categoryFilter === 'properties' ||
                        categoryFilter === 'apartment' ||
                        categoryFilter === 'house'
                          ? 'text-emerald-200'
                          : 'text-[#0F5E48]'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          categoryFilter === 'properties' ||
                          categoryFilter === 'apartment' ||
                          categoryFilter === 'house'
                            ? 'text-white'
                            : 'text-[#0B3B2E]'
                        }`}
                      >
                        {t.stripPropertiesTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          categoryFilter === 'properties' ||
                          categoryFilter === 'apartment' ||
                          categoryFilter === 'house'
                            ? 'text-emerald-100'
                            : 'text-[#1F5947]'
                        }`}
                      >
                        {t.stripPropertiesSub}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('land');
                      setActiveNav('properties');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      categoryFilter === 'land'
                        ? 'border-amber-300 bg-[#92400E] text-white ring-1 ring-amber-300'
                        : 'border-[#E7C48B] bg-[#FDF1DB] hover:bg-[#FAE6C3]'
                    }`}
                  >
                    <MapPin
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        categoryFilter === 'land' ? 'text-amber-200' : 'text-[#B45309]'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          categoryFilter === 'land' ? 'text-white' : 'text-[#5C2D0C]'
                        }`}
                      >
                        {t.stripLandTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          categoryFilter === 'land' ? 'text-amber-100' : 'text-[#7C461B]'
                        }`}
                      >
                        {t.stripLandSub}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('vehicle');
                      setActiveNav('vehicles');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      categoryFilter === 'vehicle'
                        ? 'border-sky-300 bg-[#1E40AF] text-white ring-1 ring-sky-300'
                        : 'border-[#AECCEF] bg-[#E5F0FC] hover:bg-[#D5E6FA]'
                    }`}
                  >
                    <Car
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        categoryFilter === 'vehicle' ? 'text-sky-200' : 'text-[#1D4ED8]'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          categoryFilter === 'vehicle' ? 'text-white' : 'text-[#142F66]'
                        }`}
                      >
                        {t.stripVehiclesTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          categoryFilter === 'vehicle' ? 'text-sky-100' : 'text-[#294A87]'
                        }`}
                      >
                        {t.stripVehiclesSub}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('goods');
                      setActiveNav('goods');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      categoryFilter === 'goods'
                        ? 'border-rose-300 bg-[#9D174D] text-white ring-1 ring-rose-300'
                        : 'border-[#DFB9CE] bg-[#F8EAF2] hover:bg-[#F2DCE8]'
                    }`}
                  >
                    <Package
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        categoryFilter === 'goods' ? 'text-rose-200' : 'text-[#9D174D]'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          categoryFilter === 'goods' ? 'text-white' : 'text-[#591432]'
                        }`}
                      >
                        {t.stripGoodsTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          categoryFilter === 'goods' ? 'text-rose-100' : 'text-[#782B4E]'
                        }`}
                      >
                        {t.stripGoodsSub}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* Section 2: Filter Toolbar + 3-Column Catalog Grid */}
            <section
              id="marketplace-catalog"
              className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 space-y-6"
            >
              <div className="bg-[#F9F6F0] border border-[#D8D0C1] rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-1 p-1 bg-[#E5DED0] rounded-lg overflow-x-auto max-w-full">
                  {(
                    [
                      { key: 'all', label: t.allCategories },
                      { key: 'apartment', label: t.catApartment },
                      { key: 'house', label: t.catHouse },
                      { key: 'land', label: t.catLand },
                      { key: 'vehicle', label: t.catVehicle },
                      { key: 'goods', label: t.catGoods },
                    ] as { key: CategoryFilter; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setCategoryFilter(tab.key)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        categoryFilter === tab.key
                          ? 'bg-[#0F4C3A] text-[#FCF9F2] shadow-sm'
                          : 'text-[#394A44] hover:text-[#0F3D32] hover:bg-[#EFE9DC]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1 p-1 bg-[#E5DED0] rounded-lg">
                    {(
                      [
                        { key: 'all', label: t.txAll },
                        { key: 'sale', label: t.txSale },
                        { key: 'rent', label: t.txRent },
                      ] as { key: TxFilter; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setTxFilter(opt.key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          txFilter === opt.key
                            ? 'bg-[#B45309] text-white shadow-sm'
                            : 'text-[#394A44] hover:text-[#5C2D0C]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {(txFilter === 'rent' ||
                    categoryFilter === 'properties' ||
                    categoryFilter === 'apartment' ||
                    categoryFilter === 'house' ||
                    roomClassFilter !== 'all' ||
                    tenantPrefFilter !== 'all') && (
                    <>
                      <select
                        aria-label={t.roomClassLabel}
                        value={roomClassFilter}
                        onChange={(e) => setRoomClassFilter(e.target.value as 'all' | RoomClass)}
                        className="h-9 px-3 rounded-lg border border-[#CEC5B3] bg-[#FFFDF8] text-xs font-semibold text-[#173028] focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      >
                        <option value="all">{t.roomClassAll}</option>
                        <option value="1_class">{t.roomClass1}</option>
                        <option value="2_class">{t.roomClass2}</option>
                        <option value="3_plus">{t.roomClass3Plus}</option>
                      </select>

                      <select
                        aria-label={t.tenantPrefLabel}
                        value={tenantPrefFilter}
                        onChange={(e) =>
                          setTenantPrefFilter(
                            e.target.value as 'all' | 'late' | 'bale_tedar'
                          )
                        }
                        className="h-9 px-3 rounded-lg border border-[#CEC5B3] bg-[#FFFDF8] text-xs font-semibold text-[#173028] focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      >
                        <option value="all">{t.tenantPrefAll}</option>
                        <option value="late">{t.tenantPrefLate}</option>
                        <option value="bale_tedar">{t.tenantPrefBaleTedar}</option>
                      </select>
                    </>
                  )}

                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#B45309] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      list="browse-location-suggestions"
                      aria-label="Filter by location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder={t.locationFilterPlaceholder}
                      className="h-9 w-44 sm:w-48 pl-8 pr-7 rounded-lg border border-[#CEC5B3] bg-[#FFFDF8] text-xs font-medium text-[#173028] placeholder:text-[#6B665A] focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                    {locationFilter && (
                      <button
                        type="button"
                        aria-label="Clear location filter"
                        onClick={() => setLocationFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B665A] hover:text-[#173028]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <datalist id="browse-location-suggestions">
                      {locationSuggestions.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>

                  <select
                    aria-label="Sort listings"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="h-9 px-3 rounded-lg border border-[#CEC5B3] bg-[#FFFDF8] text-xs font-semibold text-[#173028] focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="newest">{t.sortNewest}</option>
                    <option value="price_asc">{t.sortPriceAsc}</option>
                    <option value="price_desc">{t.sortPriceDesc}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="tabular-nums font-semibold text-[#144537]">
                  {filteredListings.length} {t.resultsCount}
                </span>
                {(categoryFilter !== 'all' ||
                  txFilter !== 'all' ||
                  roomClassFilter !== 'all' ||
                  tenantPrefFilter !== 'all' ||
                  locationFilter.trim() !== '' ||
                  searchQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="font-semibold text-[#B45309] hover:text-[#78350F] hover:underline"
                  >
                    {t.resetFilters}
                  </button>
                )}
              </div>

              {dataError && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-100 text-xs font-medium text-amber-950">
                  {dataError}
                </div>
              )}

              {!listingsLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-[#FFFDF8] border border-[#D8D0C1] rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-[#DFD7C8]" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-[#E3DCCE] rounded w-1/2" />
                        <div className="h-4 bg-[#E3DCCE] rounded w-3/4" />
                        <div className="h-3 bg-[#E3DCCE] rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-[#FFFDF8] border border-[#D8D0C1] rounded-xl p-12 text-center space-y-4">
                  <p className="text-sm font-medium text-[#344A43]">
                    {firestoreListings.length === 0
                      ? lang === 'am'
                        ? 'እስካሁን የተለጠፈ ማስታወቂያ የለም። የመጀመሪያውን ትክክለኛ ማስታወቂያ ይለጥፉ!'
                        : 'No listings posted yet. Be the first to publish a real listing on Kas Market.'
                      : t.noListingsFound}
                  </p>
                  {firestoreListings.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveNav('sell')}
                      className="px-5 py-2.5 rounded-lg bg-[#0F4C3A] text-white text-xs font-semibold hover:bg-[#0B3B2D]"
                    >
                      {t.postListing}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-lg bg-[#9A3412] text-white text-xs font-semibold hover:bg-[#7C2D12]"
                    >
                      {t.resetFilters}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      lang={lang}
                      isSaved={effectiveSavedIds.has(item.id)}
                      onSelect={handleSelectListing}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Section 3: How Sellers Post & Buyers Order */}
            <section className="bg-[#132926] border-t border-[#214640] text-[#F5EFE3]">
              <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14 space-y-8">
                <h2 className="text-2xl font-bold text-amber-300 [text-wrap:balance]">
                  {t.howItWorksTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl bg-[#1A3934] border border-[#2B5D55] space-y-2">
                    <h3 className="text-base font-bold text-emerald-300">{t.step1Title}</h3>
                    <p className="text-sm text-[#D6EAE3] leading-relaxed">{t.step1Body}</p>
                  </div>
                  <div className="p-5 rounded-xl bg-[#1B3344] border border-[#2D526C] space-y-2">
                    <h3 className="text-base font-bold text-sky-300">{t.step2Title}</h3>
                    <p className="text-sm text-[#D7E6F2] leading-relaxed">{t.step2Body}</p>
                  </div>
                  <div className="p-5 rounded-xl bg-[#2E271E] border border-[#564733] space-y-2">
                    <h3 className="text-base font-bold text-amber-300">{t.step3Title}</h3>
                    <p className="text-sm text-[#EAE0D0] leading-relaxed">{t.step3Body}</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className={`border-t transition-colors ${footerThemeClass}`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="inline-flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <KasLogo variant={isDash ? dashboardTheme : 'emerald'} size="sm" />
            <span>· {t.footerNote}</span>
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'en' ? 'am' : 'en'))}
              className={isDash ? 'hover:text-white transition-colors' : 'hover:text-amber-300 transition-colors'}
            >
              {lang === 'en' ? 'አማርኛ' : 'English'}
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('dashboard')}
              className={isDash ? 'hover:text-white transition-colors' : 'hover:text-amber-300 transition-colors'}
            >
              {t.navDashboard}
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('buyer')}
              className={isDash ? 'hover:text-white transition-colors' : 'hover:text-amber-300 transition-colors'}
            >
              {t.navBuyerStudio}
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('sell')}
              className={isDash ? 'hover:text-white transition-colors' : 'hover:text-amber-300 transition-colors'}
            >
              {t.postListing}
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('connections')}
              className={isDash ? 'hover:text-white transition-colors' : 'hover:text-amber-300 transition-colors'}
            >
              {t.navConnections}
            </button>
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className={isDash ? 'hover:text-white transition-colors' : 'hover:text-red-300 transition-colors'}
              >
                {t.signOut}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className={isDash ? 'hover:text-white transition-colors' : 'hover:text-amber-300 transition-colors'}
              >
                {t.signInGoogle}
              </button>
            )}
          </div>
        </div>
      </footer>

      <ListingDetailModal
        listing={selectedListing}
        initialTab={selectedInitialTab}
        lang={lang}
        user={user}
        isAdmin={isAdmin}
        savedPhone={savedPhone}
        isSaved={selectedListing ? effectiveSavedIds.has(selectedListing.id) : false}
        onClose={() => setSelectedListing(null)}
        onToggleSave={handleToggleSave}
        onDeleteListing={handleDeleteListing}
        onRequireSignIn={handleSignIn}
        onViewOrders={() => {
          setConnectionsRequestedTab(isAdmin ? 'orders' : 'listings');
          setActiveNav('connections');
        }}
      />

      <ListingFormModal
        isOpen={postModalOpen}
        editingListing={editingListing}
        savedPhone={savedPhone}
        lang={lang}
        user={user}
        onClose={() => {
          setPostModalOpen(false);
          setEditingListing(null);
        }}
        onRequireSignIn={handleSignIn}
        onSuccess={() => {
          setActiveNav('explore');
        }}
      />

      {activeToasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-[350px] max-w-[calc(100vw-2rem)]"
        >
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-[#0F352C] border border-amber-400/60 rounded-xl shadow-lg p-4 text-[#FCF9F2] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BellRing className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-xs font-semibold text-amber-300 truncate">
                    {getNotificationEventTitle(toast.eventType, lang)}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() =>
                    setActiveToasts((prev) => prev.filter((item) => item.id !== toast.id))
                  }
                  className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-[#194E41] shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs text-emerald-200">
                  <span className="font-mono font-medium text-white">{toast.orderNumber}</span> ·{' '}
                  {toast.actorName}
                </div>
                <div className="text-sm font-semibold text-[#FCF9F2] truncate">
                  {toast.listingTitle}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                  {formatPrice(toast.amount, toast.currency, 'total', lang)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(toast.id).catch(() => {});
                    setActiveToasts((prev) => prev.filter((item) => item.id !== toast.id));
                    setConnectionsRequestedTab('orders');
                    setActiveNav('connections');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0B2620] text-xs font-bold whitespace-nowrap"
                >
                  {t.notifViewOrder}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
