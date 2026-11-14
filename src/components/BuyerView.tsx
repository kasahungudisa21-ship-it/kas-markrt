import { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Building2,
  Car,
  CheckCircle2,
  Home,
  Lock,
  MapPin,
  Package,
  Scale,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { NEIGHBORHOOD_OPTIONS } from '../data/showcaseListings';
import {
  createBuyerRequest,
  deleteBuyerRequest,
  updateBuyerRequestStatus,
} from '../firebase';
import {
  getCategoryLabel,
  getRoomClassLabel,
  getTenantPreferenceLabel,
  getTransactionLabel,
  translations,
} from '../i18n';
import {
  BuyerRequest,
  CurrencyCode,
  Language,
  Listing,
  ListingCategory,
  Order,
  RoomClass,
  TenantPreference,
  TransactionType,
} from '../types';
import { formatPrice, formatSpecsLine } from '../utils/format';
import { ListingCard } from './ListingCard';

interface BuyerViewProps {
  lang: Language;
  user: User | null;
  isAdmin?: boolean;
  savedPhone?: string;
  allListings: Listing[];
  savedIds: Set<string>;
  myOrders: Order[];
  buyerRequests: BuyerRequest[];
  onBackToBrowse: () => void;
  onGoToOrders: () => void;
  onSelectListing: (listing: Listing, initialTab?: 'order' | 'message') => void;
  onToggleSave: (listing: Listing) => void;
  onSignIn: () => void;
}

export function BuyerView({
  lang,
  user,
  isAdmin = false,
  savedPhone = '',
  allListings,
  savedIds,
  myOrders,
  buyerRequests,
  onBackToBrowse,
  onGoToOrders,
  onSelectListing,
  onToggleSave,
  onSignIn,
}: BuyerViewProps) {
  const t = translations[lang];

  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [category, setCategory] = useState<'all' | ListingCategory>('all');
  const [roomClassFilter, setRoomClassFilter] = useState<'all' | RoomClass>('all');
  const [tenantPrefFilter, setTenantPrefFilter] = useState<'all' | 'late' | 'bale_tedar'>('all');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Buyer Wanted Request form state
  const [wantedCategory, setWantedCategory] = useState<ListingCategory>('apartment');
  const [wantedRoomClass, setWantedRoomClass] = useState<'' | RoomClass>('');
  const [wantedTenantPref, setWantedTenantPref] = useState<'' | TenantPreference>('');
  const [wantedTitle, setWantedTitle] = useState('');
  const [wantedBudget, setWantedBudget] = useState('');
  const [wantedCurrency, setWantedCurrency] = useState<CurrencyCode>('ETB');
  const [wantedLocation, setWantedLocation] = useState('');
  const [wantedPhone, setWantedPhone] = useState(savedPhone);
  const [wantedNotes, setWantedNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (savedPhone && !wantedPhone) {
      setWantedPhone(savedPhone);
    }
  }, [savedPhone, wantedPhone]);

  const categoryTiles: { key: ListingCategory; label: string; Icon: typeof Building2 }[] = [
    { key: 'apartment', label: t.catApartment, Icon: Building2 },
    { key: 'house', label: t.catHouse, Icon: Home },
    { key: 'land', label: t.catLand, Icon: MapPin },
    { key: 'vehicle', label: t.catVehicle, Icon: Car },
    { key: 'goods', label: t.catGoods, Icon: Package },
  ];

  const matchingListings = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const budgetNum = Number(maxBudget);
    const hasBudget = maxBudget.trim() !== '' && Number.isFinite(budgetNum) && budgetNum > 0;

    return allListings.filter((item) => {
      if (item.transactionType !== transactionType) return false;
      if (category !== 'all' && item.category !== category) return false;
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
      const locQ = neighborhood.trim().toLowerCase();
      if (
        locQ &&
        !item.neighborhood.toLowerCase().includes(locQ) &&
        !item.city.toLowerCase().includes(locQ)
      ) {
        return false;
      }
      if (hasBudget && item.price > budgetNum) return false;
      if (q) {
        const hay = `${item.title} ${item.description} ${item.neighborhood} ${item.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allListings,
    transactionType,
    category,
    roomClassFilter,
    tenantPrefFilter,
    neighborhood,
    maxBudget,
    keyword,
  ]);

  const comparedListings = useMemo(() => {
    return compareIds
      .map((id) => allListings.find((l) => l.id === id))
      .filter((item): item is Listing => Boolean(item));
  }, [compareIds, allListings]);

  const toggleCompare = (listingId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(listingId)) return prev.filter((id) => id !== listingId);
      if (prev.length >= 3) return [...prev.slice(1), listingId];
      return [...prev, listingId];
    });
  };

  const handleWantedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignIn();
      return;
    }

    const numericBudget = Number(wantedBudget);
    if (wantedTitle.trim().length < 3) {
      setFormError(
        lang === 'am' ? 'ርዕስ ቢያንስ 3 ፊደላት መሆን አለበት።' : 'Please enter at least 3 characters.'
      );
      return;
    }
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      setFormError(lang === 'am' ? 'ትክክለኛ በጀት ያስገቡ።' : 'Enter a valid budget greater than 0.');
      return;
    }
    if (wantedPhone.trim().length < 6) {
      setFormError(t.phoneValidationError);
      return;
    }

    setFormError('');
    setSubmitting(true);
    setPostedSuccess(false);
    try {
      await createBuyerRequest(user, {
        transactionType,
        category: wantedCategory,
        title: wantedTitle,
        maxBudget: numericBudget,
        currency: wantedCurrency,
        preferredNeighborhood: wantedLocation,
        notes: wantedNotes,
        buyerPhone: wantedPhone.trim(),
        roomClass:
          transactionType === 'rent' &&
          (wantedCategory === 'apartment' || wantedCategory === 'house') &&
          wantedRoomClass
            ? wantedRoomClass
            : undefined,
        tenantPreference:
          transactionType === 'rent' &&
          (wantedCategory === 'apartment' || wantedCategory === 'house') &&
          wantedTenantPref
            ? wantedTenantPref
            : undefined,
      });
      setWantedTitle('');
      setWantedNotes('');
      setWantedRoomClass('');
      setWantedTenantPref('');
      setPostedSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to post buyer request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBackToBrowse}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToMarketplace}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t.buyerStudioTitle}</h1>
          <p className="text-sm text-zinc-600 max-w-2xl">{t.buyerStudioSubtitle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onGoToOrders}
            className="px-4 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 whitespace-nowrap"
          >
            {t.tabOrders} ({myOrders.length}) · {t.tabSaved} ({savedIds.size})
          </button>
        </div>
      </div>

      {/* Step 1: Standalone Top Selector for Looking to Buy vs Looking to Rent */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">{t.chooseBuyOrRentLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setTransactionType('sale');
              setRoomClassFilter('all');
              setTenantPrefFilter('all');
            }}
            className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
              transactionType === 'sale'
                ? 'border-emerald-800 bg-emerald-50/70 ring-1 ring-emerald-800'
                : 'border-zinc-200 bg-white hover:bg-zinc-50'
            }`}
          >
            <div className="text-base font-bold text-zinc-900">{t.buyOptionTitle}</div>
            <p className="text-xs text-zinc-600 mt-1">{t.buyOptionDesc}</p>
          </button>

          <button
            type="button"
            onClick={() => setTransactionType('rent')}
            className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
              transactionType === 'rent'
                ? 'border-emerald-800 bg-emerald-50/70 ring-1 ring-emerald-800'
                : 'border-zinc-200 bg-white hover:bg-zinc-50'
            }`}
          >
            <div className="text-base font-bold text-zinc-900">{t.rentBuyerOptionTitle}</div>
            <p className="text-xs text-zinc-600 mt-1">{t.rentBuyerOptionDesc}</p>
          </button>
        </div>
      </div>

      {/* Step 2: Directly Underneath — Enter What You Want to Buy or Rent */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          {transactionType === 'sale' ? t.whatBuyingLabel : t.whatRentingBuyerLabel}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-center ${
              category === 'all'
                ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950 font-semibold'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <span className="text-xs font-medium">{t.allCategories}</span>
          </button>
          {categoryTiles.map(({ key, label, Icon }) => {
            const active = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setCategory(key);
                  setWantedCategory(key);
                  if (key !== 'apartment' && key !== 'house') {
                    setRoomClassFilter('all');
                    setTenantPrefFilter('all');
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                  active
                    ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-800' : 'text-zinc-500'}`} />
                <span className="text-xs font-medium truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>
          <div className="sm:col-span-3 relative">
            <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              list="buyer-filter-locations"
              aria-label="Preferred neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder={t.locationFilterPlaceholder}
              className="w-full h-10 pl-9 pr-8 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
            {neighborhood && (
              <button
                type="button"
                aria-label="Clear location"
                onClick={() => setNeighborhood('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <datalist id="buyer-filter-locations">
              {NEIGHBORHOOD_OPTIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-3">
            <input
              type="number"
              min={0}
              placeholder={`${t.maxBudgetLabel} (ETB/USD)`}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900"
            />
          </div>
        </div>

        {transactionType === 'rent' &&
          (category === 'all' || category === 'apartment' || category === 'house') && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="text-xs font-semibold text-zinc-900">{t.rentalOptionsHeading}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-zinc-600">{t.roomClassLabel}</div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: 'all', label: t.roomClassAll },
                        { key: '1_class', label: t.roomClass1 },
                        { key: '2_class', label: t.roomClass2 },
                        { key: '3_plus', label: t.roomClass3Plus },
                      ] as { key: 'all' | RoomClass; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setRoomClassFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          roomClassFilter === opt.key
                            ? 'border-emerald-800 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-800'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-zinc-600">{t.tenantPrefLabel}</div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: 'all', label: t.tenantPrefAll },
                        { key: 'late', label: t.tenantPrefLate },
                        { key: 'bale_tedar', label: t.tenantPrefBaleTedar },
                      ] as { key: 'all' | 'late' | 'bale_tedar'; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setTenantPrefFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          tenantPrefFilter === opt.key
                            ? 'border-emerald-800 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-800'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Main 2-Column Buyer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Side-by-Side Comparison Strip when 2+ items selected */}
          {comparedListings.length >= 2 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 overflow-x-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Scale className="w-4 h-4 text-emerald-800" />
                  <span>
                    {t.comparingTitle} ({comparedListings.length}/3)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                >
                  {t.clearCompare}
                </button>
              </div>

              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 pr-4 font-medium w-28">{t.fieldTitle}</th>
                    {comparedListings.map((item) => (
                      <th key={item.id} className="py-2 px-3 font-semibold text-zinc-900">
                        {item.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="py-2.5 pr-4 text-zinc-500">{t.fieldPrice}</td>
                    {comparedListings.map((item) => (
                      <td
                        key={item.id}
                        className="py-2.5 px-3 font-mono font-semibold text-emerald-900 tabular-nums"
                      >
                        {formatPrice(item.price, item.currency, item.pricePeriod, lang)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-zinc-500">{t.locationLabel}</td>
                    {comparedListings.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 text-zinc-700">
                        {item.neighborhood}, {item.city}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-zinc-500">{t.specsHeading}</td>
                    {comparedListings.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 text-zinc-700 tabular-nums">
                        {formatSpecsLine(item, lang)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-zinc-500">{t.sellerLabel}</td>
                    {comparedListings.map((item) => (
                      <td key={item.id} className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => onSelectListing(item, 'order')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium"
                        >
                          {item.transactionType === 'rent' ? t.reserveNow : t.orderNow}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold text-sm text-zinc-900">
              {t.matchingListingsTitle} ({matchingListings.length})
            </span>
            <span>
              {getTransactionLabel(transactionType, lang)}
              {category !== 'all' ? ` · ${getCategoryLabel(category, lang)}` : ''}
            </span>
          </div>

          {matchingListings.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-3">
              <p className="text-sm text-zinc-600">{t.noListingsFound}</p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setRoomClassFilter('all');
                  setTenantPrefFilter('all');
                  setNeighborhood('');
                  setMaxBudget('');
                  setKeyword('');
                }}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium"
              >
                {t.resetFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchingListings.map((item) => {
                const isCompared = compareIds.includes(item.id);
                return (
                  <div key={item.id} className="space-y-2">
                    <ListingCard
                      listing={item}
                      lang={lang}
                      isSaved={savedIds.has(item.id)}
                      onSelect={onSelectListing}
                      onToggleSave={onToggleSave}
                    />
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => toggleCompare(item.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                          isCompared
                            ? 'bg-emerald-800 text-white'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{t.compareLabel}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sticky Column: Post a Buyer Request + Live Buyer Requests Feed */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-900">{t.postWantedTitle}</h2>
              <p className="text-xs text-zinc-600 leading-relaxed">{t.postWantedSubtitle}</p>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium"
              >
                {t.signInGoogle}
              </button>
            ) : (
              <form onSubmit={handleWantedSubmit} className="space-y-3">
                {postedSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{t.wantedSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {t.fieldCategory}
                  </label>
                  <select
                    value={wantedCategory}
                    onChange={(e) => setWantedCategory(e.target.value as ListingCategory)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                  >
                    <option value="apartment">{t.catApartment}</option>
                    <option value="house">{t.catHouse}</option>
                    <option value="land">{t.catLand}</option>
                    <option value="vehicle">{t.catVehicle}</option>
                    <option value="goods">{t.catGoods}</option>
                  </select>
                </div>

                {transactionType === 'rent' &&
                  (wantedCategory === 'apartment' || wantedCategory === 'house') && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          {t.roomClassLabel}
                        </label>
                        <select
                          value={wantedRoomClass}
                          onChange={(e) => setWantedRoomClass(e.target.value as '' | RoomClass)}
                          className="w-full h-10 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900"
                        >
                          <option value="">{t.roomClassAll}</option>
                          <option value="1_class">{t.roomClass1}</option>
                          <option value="2_class">{t.roomClass2}</option>
                          <option value="3_plus">{t.roomClass3Plus}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          {t.tenantPrefLabel}
                        </label>
                        <select
                          value={wantedTenantPref}
                          onChange={(e) =>
                            setWantedTenantPref(e.target.value as '' | TenantPreference)
                          }
                          className="w-full h-10 px-2.5 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900"
                        >
                          <option value="">{t.tenantPrefAll}</option>
                          <option value="late">{t.tenantPrefLate}</option>
                          <option value="bale_tedar">{t.tenantPrefBaleTedar}</option>
                          <option value="any">{t.tenantPrefAny}</option>
                        </select>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {t.wantedTitleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={wantedTitle}
                    onChange={(e) => setWantedTitle(e.target.value)}
                    placeholder={
                      transactionType === 'rent'
                        ? '2-Bedroom Apartment in Bole'
                        : 'Toyota Yaris or Vitz 2020+'
                    }
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.maxBudgetLabel}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000000000}
                      value={wantedBudget}
                      onChange={(e) => setWantedBudget(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.fieldCurrency}
                    </label>
                    <select
                      value={wantedCurrency}
                      onChange={(e) => setWantedCurrency(e.target.value as CurrencyCode)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                    >
                      <option value="ETB">ETB</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {t.fieldNeighborhood}
                  </label>
                  <input
                    type="text"
                    list="buyer-neighborhoods"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder={t.locationPlaceholder}
                    value={wantedLocation}
                    onChange={(e) => setWantedLocation(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400"
                  />
                  <datalist id="buyer-neighborhoods">
                    {NEIGHBORHOOD_OPTIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {t.phoneInputLabel}
                  </label>
                  <input
                    type="tel"
                    required
                    minLength={6}
                    maxLength={30}
                    placeholder={t.phonePlaceholder}
                    value={wantedPhone}
                    onChange={(e) => setWantedPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-800 shrink-0" />
                    <span>{t.phonePrivacyNote}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {t.orderNotesLabel}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={wantedNotes}
                    onChange={(e) => setWantedNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                  />
                </div>

                {formError && <p className="text-xs text-red-700">{formError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                >
                  {t.wantedButton}
                </button>
              </form>
            )}
          </div>

          {buyerRequests.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900">
                {t.activeWantedTitle} ({buyerRequests.length})
              </h3>
              <div className="divide-y divide-zinc-100">
                {buyerRequests.map((req) => {
                  const isOwn = Boolean(user && req.buyerId === user.uid);
                  return (
                    <div key={req.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                        <span>
                          {getTransactionLabel(req.transactionType, lang)} ·{' '}
                          {getCategoryLabel(req.category, lang)} · {req.preferredNeighborhood}
                          {req.roomClass ? ` · ${getRoomClassLabel(req.roomClass, lang)}` : ''}
                          {req.tenantPreference
                            ? ` · ${getTenantPreferenceLabel(req.tenantPreference, lang)}`
                            : ''}
                        </span>
                        <span className="capitalize font-medium text-zinc-700">{req.status}</span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">{req.title}</div>
                      <div className="font-mono text-xs font-semibold text-emerald-900 tabular-nums">
                        ≤ {formatPrice(req.maxBudget, req.currency, 'total', lang)}
                      </div>
                      {req.notes && <p className="text-xs text-zinc-600">{req.notes}</p>}
                      {(isOwn || isAdmin) && (
                        <div className="pt-1 flex items-center gap-2">
                          {req.status === 'active' && (
                            <button
                              type="button"
                              disabled={busyId === req.id}
                              onClick={async () => {
                                setBusyId(req.id);
                                try {
                                  await updateBuyerRequestStatus(req.id, 'fulfilled');
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="text-xs font-medium text-emerald-800 hover:underline"
                            >
                              {t.markFulfilled}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === req.id}
                            onClick={async () => {
                              setBusyId(req.id);
                              try {
                                await deleteBuyerRequest(req.id);
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t.deleteListing}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
