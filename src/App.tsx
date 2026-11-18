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
  consumeRedirectSignInResult,
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
import {
  getGoodsTypeLabel,
  getNotificationEventTitle,
  getVehicleTypeLabel,
  GOODS_MODEL_SUGGESTIONS,
  GOODS_TYPE_KEYS,
  translations,
  VEHICLE_MODEL_SUGGESTIONS,
  VEHICLE_TYPE_KEYS,
} from './i18n';
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
import {
  formatFirestoreUserError,
  formatPrice,
  matchesGoodsType,
  matchesListingModel,
  matchesVehicleType,
} from './utils/format';
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
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [vehicleModelFilter, setVehicleModelFilter] = useState<string>('');
  const [goodsTypeFilter, setGoodsTypeFilter] = useState<string>('all');
  const [goodsModelFilter, setGoodsModelFilter] = useState<string>('');
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
  const [authError, setAuthError] = useState<string | null>(null);

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
    consumeRedirectSignInResult().catch(() => {});
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        setAuthError(null);
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
        if (
          item.category !== 'apartment' &&
          item.category !== 'condominium' &&
          item.category !== 'house' &&
          item.category !== 'land'
        ) {
          return false;
        }
      } else if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (txFilter !== 'all' && item.transactionType !== txFilter) {
        return false;
      }

      const isHousing =
        item.category === 'apartment' ||
        item.category === 'condominium' ||
        item.category === 'house';
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

      if (categoryFilter === 'vehicle') {
        if (!matchesVehicleType(item, vehicleTypeFilter)) return false;
        if (!matchesListingModel(item, 'vehicle', vehicleModelFilter)) return false;
      }

      if (categoryFilter === 'goods') {
        if (!matchesGoodsType(item, goodsTypeFilter)) return false;
        if (!matchesListingModel(item, 'goods', goodsModelFilter)) return false;
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
        const hay = `${item.title} ${item.description} ${item.neighborhood} ${item.city} ${
          item.category
        } ${item.specs?.vehicleType || ''} ${item.specs?.vehicleModel || ''} ${
          item.specs?.goodsType || ''
        } ${item.specs?.goodsModel || ''}`.toLowerCase();
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
    vehicleTypeFilter,
    vehicleModelFilter,
    goodsTypeFilter,
    goodsModelFilter,
    locationFilter,
    searchQuery,
    sortOrder,
  ]);

  const scrollToCatalog = () => {
    window.setTimeout(() => {
      document.getElementById('marketplace-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSelectNav = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'explore') {
      setCategoryFilter('all');
      setTxFilter('all');
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
      setVehicleTypeFilter('all');
      setVehicleModelFilter('');
      setGoodsTypeFilter('all');
      setGoodsModelFilter('');
    } else if (nav === 'properties') {
      setCategoryFilter('properties');
      setVehicleTypeFilter('all');
      setVehicleModelFilter('');
      setGoodsTypeFilter('all');
      setGoodsModelFilter('');
      scrollToCatalog();
    } else if (nav === 'vehicles') {
      setCategoryFilter('vehicle');
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
      setGoodsTypeFilter('all');
      setGoodsModelFilter('');
      scrollToCatalog();
    } else if (nav === 'goods') {
      setCategoryFilter('goods');
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
      setVehicleTypeFilter('all');
      setVehicleModelFilter('');
      scrollToCatalog();
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
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          lang === 'am'
            ? `ይህ ዶሜይን (${host}) በ Firebase Authorized Domains ውስጥ አልተመዘገበም። Firebase Console -> Authentication -> Settings -> Authorized domains ውስጥ "${host}" ይጨምሩ።`
            : `This domain (${host}) is not authorized in Firebase Auth. Add "${host}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else {
        const msg = err instanceof Error ? err.message : String(err || '');
        setAuthError(
          lang === 'am'
            ? `መግባት አልተቻለም (${code || msg})። በስልክ Chrome ወይም Safari ውስጥ መክፈትዎን ያረጋግጡ።`
            : `Unable to sign in (${code || msg}). Try opening in Chrome or Safari on your phone.`
        );
      }
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
    setVehicleTypeFilter('all');
    setVehicleModelFilter('');
    setGoodsTypeFilter('all');
    setGoodsModelFilter('');
    setLocationFilter('');
    setSearchQuery('');
    setSortOrder('newest');
  };

  const vehicleModelOptions = useMemo(() => {
    const map = new Map<string, string>();
    combinedListings.forEach((item) => {
      const m = item.category === 'vehicle' ? item.specs?.vehicleModel?.trim() : '';
      if (m && !map.has(m.toLowerCase())) map.set(m.toLowerCase(), m);
    });
    VEHICLE_MODEL_SUGGESTIONS.forEach((m) => {
      if (!map.has(m.toLowerCase())) map.set(m.toLowerCase(), m);
    });
    return Array.from(map.values());
  }, [combinedListings]);

  const goodsModelOptions = useMemo(() => {
    const map = new Map<string, string>();
    combinedListings.forEach((item) => {
      const m = item.category === 'goods' ? item.specs?.goodsModel?.trim() : '';
      if (m && !map.has(m.toLowerCase())) map.set(m.toLowerCase(), m);
    });
    GOODS_MODEL_SUGGESTIONS.forEach((m) => {
      if (!map.has(m.toLowerCase())) map.set(m.toLowerCase(), m);
    });
    return Array.from(map.values());
  }, [combinedListings]);

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
    : 'bg-[#F7F5F0] text-[#0F241E]';

  const footerThemeClass = isDash
    ? dashboardTheme === 'indigo'
      ? 'bg-[#12142B] border-indigo-950 text-indigo-300'
      : dashboardTheme === 'amber'
      ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
      : 'bg-slate-900 border-slate-800 text-slate-400'
    : 'bg-[#081C17] border-[#163C32] text-[#B7D0C7]';

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
        {authError && (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-4">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between gap-3">
              <span>{authError}</span>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                aria-label="Dismiss error"
                className="p-1 rounded-lg hover:bg-red-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
            <section className="relative overflow-hidden bg-gradient-to-br from-[#07211A] via-[#0B3127] to-[#0D2C3A] border-b border-[#1B4B3F] text-[#FCF9F2]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-amber-400/[0.06] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-28 -left-20 w-[440px] h-[440px] rounded-full bg-emerald-400/[0.07] blur-3xl"
              />

              <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-16 space-y-9">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-between gap-7 py-1">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-amber-300/95 tracking-wide">
                          {t.heroLocationCaption}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setLang((prev) => (prev === 'en' ? 'am' : 'en'))}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-[#FCF9F2] transition-colors whitespace-nowrap shrink-0"
                          >
                            <Globe className="w-3.5 h-3.5 text-amber-300" />
                            <span>{lang === 'en' ? 'አማርኛ' : 'English'}</span>
                          </button>

                          {user ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setActiveNav('connections')}
                                className="h-9 px-3 rounded-xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-emerald-100 truncate max-w-[140px] transition-colors"
                              >
                                {user.displayName || t.signedInAs}
                              </button>
                              <button
                                type="button"
                                onClick={handleSignOut}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/15 bg-white/[0.07] hover:bg-red-900/70 hover:text-red-100 hover:border-red-400/50 text-xs font-medium text-emerald-100 transition-colors whitespace-nowrap shrink-0"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>{t.signOut}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSignIn}
                              className="h-9 px-3.5 rounded-xl border border-amber-300/50 bg-amber-400/15 hover:bg-amber-400/25 text-xs font-semibold text-amber-200 transition-colors whitespace-nowrap shrink-0"
                            >
                              {t.signInGoogle}
                            </button>
                          )}
                        </div>
                      </div>

                      <h1 className="text-[clamp(2.1rem,3.6vw,3.15rem)] font-extrabold tracking-[-0.025em] text-[#FCF9F2] leading-[1.08] [text-wrap:balance]">
                        {t.heroTitle}
                      </h1>

                      <p className="text-[15px] sm:text-base text-[#C6E0D7] leading-relaxed max-w-xl">
                        {t.heroSubtitle}
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      <div className="inline-flex items-center gap-1 p-1 bg-[#061A15]/90 border border-white/12 rounded-xl w-fit">
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
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 ${
                              txFilter === opt.key
                                ? 'bg-amber-400 text-[#08211B] shadow-sm'
                                : 'text-emerald-100/85 hover:text-white'
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
                        className="flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-2xl bg-white shadow-[0_20px_44px_-16px_rgba(0,0,0,0.5)] border border-white/80"
                      >
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-[#0F5E48] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-transparent text-sm text-[#0F241E] placeholder:text-[#63756F] focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="h-11 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#08211B] text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                        >
                          {t.searchButton}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-[#08201A] ring-1 ring-white/15 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.55)] min-h-[270px] lg:min-h-[360px]">
                    <ResilientImage
                      src={HERO_IMAGE}
                      alt={t.heroTitle}
                      category="house"
                      className="w-full h-full lg:h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-5 sm:p-6 flex items-end justify-between gap-4">
                      <p className="text-xs font-semibold text-amber-200">
                        {t.stripPropertiesTitle} · {t.stripLandTitle} · {t.stripVehiclesTitle}
                      </p>
                      <span className="font-mono text-xs font-semibold text-emerald-200 tabular-nums whitespace-nowrap shrink-0">
                        {combinedListings.length} {t.resultsCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Column Quick Category Strip — Refined Architectural Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('properties');
                      setActiveNav('properties');
                    }}
                    className={`group p-4 rounded-2xl border text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 flex items-center gap-3.5 ${
                      categoryFilter === 'properties' ||
                      categoryFilter === 'apartment' ||
                      categoryFilter === 'condominium' ||
                      categoryFilter === 'house'
                        ? 'border-emerald-300 bg-[#145C49] text-white shadow-md ring-1 ring-emerald-300/80'
                        : 'border-white/85 bg-white/95 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        categoryFilter === 'properties' ||
                        categoryFilter === 'apartment' ||
                        categoryFilter === 'condominium' ||
                        categoryFilter === 'house'
                          ? 'bg-emerald-300/20 text-emerald-200'
                          : 'bg-[#E5F4EE] text-[#0F5E48]'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          categoryFilter === 'properties' ||
                          categoryFilter === 'apartment' ||
                          categoryFilter === 'condominium' ||
                          categoryFilter === 'house'
                            ? 'text-white'
                            : 'text-[#0B3B2E]'
                        }`}
                      >
                        {t.stripPropertiesTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
                          categoryFilter === 'properties' ||
                          categoryFilter === 'apartment' ||
                          categoryFilter === 'condominium' ||
                          categoryFilter === 'house'
                            ? 'text-emerald-100'
                            : 'text-[#3B6658]'
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
                    className={`group p-4 rounded-2xl border text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 flex items-center gap-3.5 ${
                      categoryFilter === 'land'
                        ? 'border-amber-300 bg-[#92400E] text-white shadow-md ring-1 ring-amber-300/80'
                        : 'border-white/85 bg-white/95 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        categoryFilter === 'land'
                          ? 'bg-amber-300/20 text-amber-200'
                          : 'bg-[#FEF0D6] text-[#B45309]'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          categoryFilter === 'land' ? 'text-white' : 'text-[#5C2D0C]'
                        }`}
                      >
                        {t.stripLandTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
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
                      handleSelectNav('vehicles');
                    }}
                    className={`group p-4 rounded-2xl border text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 flex items-center gap-3.5 ${
                      categoryFilter === 'vehicle'
                        ? 'border-sky-300 bg-[#1E40AF] text-white shadow-md ring-1 ring-sky-300/80'
                        : 'border-white/85 bg-white/95 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        categoryFilter === 'vehicle'
                          ? 'bg-sky-300/20 text-sky-200'
                          : 'bg-[#E6F0FD] text-[#1D4ED8]'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          categoryFilter === 'vehicle' ? 'text-white' : 'text-[#142F66]'
                        }`}
                      >
                        {t.stripVehiclesTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
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
                      handleSelectNav('goods');
                    }}
                    className={`group p-4 rounded-2xl border text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 flex items-center gap-3.5 ${
                      categoryFilter === 'goods'
                        ? 'border-rose-300 bg-[#9D174D] text-white shadow-md ring-1 ring-rose-300/80'
                        : 'border-white/85 bg-white/95 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        categoryFilter === 'goods'
                          ? 'bg-rose-300/20 text-rose-200'
                          : 'bg-[#FCEAF2] text-[#9D174D]'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          categoryFilter === 'goods' ? 'text-white' : 'text-[#591432]'
                        }`}
                      >
                        {t.stripGoodsTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
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
              className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 space-y-7"
            >
              <div className="bg-white border border-[#E5E0D6] rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.09)]">
                <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] rounded-xl overflow-x-auto max-w-full">
                  {(
                    [
                      { key: 'all', label: t.allCategories },
                      { key: 'apartment', label: t.catApartment },
                      { key: 'condominium', label: t.catCondominium },
                      { key: 'house', label: t.catHouse },
                      { key: 'land', label: t.catLand },
                      { key: 'vehicle', label: t.catVehicle },
                      { key: 'goods', label: t.catGoods },
                    ] as { key: CategoryFilter; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(tab.key);
                        if (tab.key !== 'vehicle') {
                          setVehicleTypeFilter('all');
                          setVehicleModelFilter('');
                        }
                        if (tab.key !== 'goods') {
                          setGoodsTypeFilter('all');
                          setGoodsModelFilter('');
                        }
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 ${
                        categoryFilter === tab.key
                          ? 'bg-[#0D4435] text-white shadow-sm'
                          : 'text-[#394A44] hover:text-[#0F3D32] hover:bg-white/70'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] rounded-xl">
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
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 ${
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
                    categoryFilter === 'condominium' ||
                    categoryFilter === 'house' ||
                    roomClassFilter !== 'all' ||
                    tenantPrefFilter !== 'all') && (
                    <>
                      <select
                        aria-label={t.roomClassLabel}
                        value={roomClassFilter}
                        onChange={(e) => setRoomClassFilter(e.target.value as 'all' | RoomClass)}
                        className="h-9 px-3 rounded-xl border border-[#DED8CC] bg-[#FAF8F4] text-xs font-semibold text-[#173028] focus:outline-none focus:ring-2 focus:ring-emerald-800"
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
                        className="h-9 px-3 rounded-xl border border-[#DED8CC] bg-[#FAF8F4] text-xs font-semibold text-[#173028] focus:outline-none focus:ring-2 focus:ring-emerald-800"
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
                      className="h-9 w-44 sm:w-48 pl-8 pr-7 rounded-xl border border-[#DED8CC] bg-[#FAF8F4] text-xs font-medium text-[#173028] placeholder:text-[#6B665A] focus:outline-none focus:ring-2 focus:ring-emerald-800"
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
                    className="h-9 px-3 rounded-xl border border-[#DED8CC] bg-[#FAF8F4] text-xs font-semibold text-[#173028] focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="newest">{t.sortNewest}</option>
                    <option value="price_asc">{t.sortPriceAsc}</option>
                    <option value="price_desc">{t.sortPriceDesc}</option>
                  </select>
                </div>
              </div>

              {/* Type & Model Sub-Navigation for Vehicles */}
              {categoryFilter === 'vehicle' && (
                <div className="bg-[#F4F8FF] border border-[#C7DCF9] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-[0_4px_18px_-12px_rgba(30,64,175,0.18)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#142F66] flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#1D4ED8]" />
                      <span>{t.vehicleNavHeading}</span>
                    </span>
                    {(vehicleTypeFilter !== 'all' || vehicleModelFilter.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleTypeFilter('all');
                          setVehicleModelFilter('');
                        }}
                        className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                      >
                        {t.resetFilters}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-white/90 border border-[#D4E4FA] rounded-xl overflow-x-auto max-w-full">
                      <button
                        type="button"
                        onClick={() => setVehicleTypeFilter('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          vehicleTypeFilter === 'all'
                            ? 'bg-[#1E40AF] text-white shadow-sm'
                            : 'text-[#1E3A8A] hover:bg-[#E8F1FE]'
                        }`}
                      >
                        {t.allVehicleTypes}
                      </button>
                      {VEHICLE_TYPE_KEYS.map((vk) => (
                        <button
                          key={vk}
                          type="button"
                          onClick={() => setVehicleTypeFilter(vk)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            vehicleTypeFilter === vk
                              ? 'bg-[#1E40AF] text-white shadow-sm'
                              : 'text-[#1E3A8A] hover:bg-[#E8F1FE]'
                          }`}
                        >
                          {getVehicleTypeLabel(vk, lang)}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={t.vehicleModelLabel}
                        value={
                          vehicleModelOptions.some(
                            (m) => m.toLowerCase() === vehicleModelFilter.trim().toLowerCase()
                          )
                            ? vehicleModelOptions.find(
                                (m) => m.toLowerCase() === vehicleModelFilter.trim().toLowerCase()
                              ) || ''
                            : ''
                        }
                        onChange={(e) => setVehicleModelFilter(e.target.value)}
                        className="h-9 px-3 rounded-xl border border-[#BFD6F6] bg-white text-xs font-semibold text-[#142F66] focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        <option value="">{t.allModels}</option>
                        {vehicleModelOptions.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <input
                          type="text"
                          list="browse-vehicle-models"
                          aria-label={t.vehicleModelLabel}
                          placeholder={t.vehicleModelPlaceholder}
                          value={vehicleModelFilter}
                          onChange={(e) => setVehicleModelFilter(e.target.value)}
                          className="h-9 w-52 sm:w-60 pl-3 pr-7 rounded-xl border border-[#BFD6F6] bg-white text-xs text-[#102620] placeholder:text-[#5B7099] focus:outline-none focus:ring-2 focus:ring-blue-700"
                        />
                        {vehicleModelFilter && (
                          <button
                            type="button"
                            aria-label="Clear vehicle model filter"
                            onClick={() => setVehicleModelFilter('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1D4ED8] hover:text-[#142F66]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <datalist id="browse-vehicle-models">
                          {vehicleModelOptions.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Type & Model Sub-Navigation for Goods */}
              {categoryFilter === 'goods' && (
                <div className="bg-[#FDF4F8] border border-[#F5C7DC] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-[0_4px_18px_-12px_rgba(157,23,77,0.16)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#591432] flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#9D174D]" />
                      <span>{t.goodsNavHeading}</span>
                    </span>
                    {(goodsTypeFilter !== 'all' || goodsModelFilter.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setGoodsTypeFilter('all');
                          setGoodsModelFilter('');
                        }}
                        className="text-xs font-semibold text-[#9D174D] hover:underline"
                      >
                        {t.resetFilters}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-white/90 border border-[#F4D0E2] rounded-xl overflow-x-auto max-w-full">
                      <button
                        type="button"
                        onClick={() => setGoodsTypeFilter('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          goodsTypeFilter === 'all'
                            ? 'bg-[#9D174D] text-white shadow-sm'
                            : 'text-[#782B4E] hover:bg-[#FCE8F2]'
                        }`}
                      >
                        {t.allGoodsTypes}
                      </button>
                      {GOODS_TYPE_KEYS.map((gk) => (
                        <button
                          key={gk}
                          type="button"
                          onClick={() => setGoodsTypeFilter(gk)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            goodsTypeFilter === gk
                              ? 'bg-[#9D174D] text-white shadow-sm'
                              : 'text-[#782B4E] hover:bg-[#FCE8F2]'
                          }`}
                        >
                          {getGoodsTypeLabel(gk, lang)}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={t.goodsModelLabel}
                        value={
                          goodsModelOptions.some(
                            (m) => m.toLowerCase() === goodsModelFilter.trim().toLowerCase()
                          )
                            ? goodsModelOptions.find(
                                (m) => m.toLowerCase() === goodsModelFilter.trim().toLowerCase()
                              ) || ''
                            : ''
                        }
                        onChange={(e) => setGoodsModelFilter(e.target.value)}
                        className="h-9 px-3 rounded-xl border border-[#F3C6DC] bg-white text-xs font-semibold text-[#591432] focus:outline-none focus:ring-2 focus:ring-rose-800"
                      >
                        <option value="">{t.allModels}</option>
                        {goodsModelOptions.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <input
                          type="text"
                          list="browse-goods-models"
                          aria-label={t.goodsModelLabel}
                          placeholder={t.goodsModelPlaceholder}
                          value={goodsModelFilter}
                          onChange={(e) => setGoodsModelFilter(e.target.value)}
                          className="h-9 w-52 sm:w-60 pl-3 pr-7 rounded-xl border border-[#F3C6DC] bg-white text-xs text-[#102620] placeholder:text-[#8E536E] focus:outline-none focus:ring-2 focus:ring-rose-800"
                        />
                        {goodsModelFilter && (
                          <button
                            type="button"
                            aria-label="Clear goods model filter"
                            onClick={() => setGoodsModelFilter('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D174D] hover:text-[#591432]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <datalist id="browse-goods-models">
                          {goodsModelOptions.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="tabular-nums font-semibold text-[#0F4235]">
                  {filteredListings.length} {t.resultsCount}
                </span>
                {(categoryFilter !== 'all' ||
                  txFilter !== 'all' ||
                  roomClassFilter !== 'all' ||
                  tenantPrefFilter !== 'all' ||
                  vehicleTypeFilter !== 'all' ||
                  vehicleModelFilter.trim() !== '' ||
                  goodsTypeFilter !== 'all' ||
                  goodsModelFilter.trim() !== '' ||
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
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-xs font-medium text-amber-950">
                  {dataError}
                </div>
              )}

              {!listingsLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-white border border-[#E5E0D6] rounded-2xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-[#EAE6DC]" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-[#EDEAE2] rounded w-1/2" />
                        <div className="h-4 bg-[#EDEAE2] rounded w-3/4" />
                        <div className="h-3 bg-[#EDEAE2] rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white border border-[#E5E0D6] rounded-2xl p-12 text-center space-y-4 shadow-sm">
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
                      className="px-5 py-2.5 rounded-xl bg-[#0D4435] text-white text-xs font-semibold hover:bg-[#093227] transition-colors"
                    >
                      {t.postListing}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-[#9A3412] text-white text-xs font-semibold hover:bg-[#7C2D12] transition-colors"
                    >
                      {t.resetFilters}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
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
            <section className="bg-[#0B221D] border-t border-[#1A4338] text-[#F5EFE3]">
              <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16 space-y-9">
                <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-amber-300 [text-wrap:balance]">
                  {t.howItWorksTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-[#11312A] border border-white/10 space-y-2.5">
                    <h3 className="text-base font-bold text-emerald-300">{t.step1Title}</h3>
                    <p className="text-sm text-[#D2E7DF] leading-relaxed">{t.step1Body}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#122937] border border-white/10 space-y-2.5">
                    <h3 className="text-base font-bold text-sky-300">{t.step2Title}</h3>
                    <p className="text-sm text-[#D4E3F0] leading-relaxed">{t.step2Body}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#241E16] border border-white/10 space-y-2.5">
                    <h3 className="text-base font-bold text-amber-300">{t.step3Title}</h3>
                    <p className="text-sm text-[#E7DDD0] leading-relaxed">{t.step3Body}</p>
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
