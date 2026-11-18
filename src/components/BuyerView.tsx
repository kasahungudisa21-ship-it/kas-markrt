import { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Building,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Home,
  Lock,
  LogOut,
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
  getGoodsConditionLabel,
  getGoodsTypeLabel,
  getRoomClassLabel,
  getTenantPreferenceLabel,
  getTransactionLabel,
  getVehicleTypeLabel,
  GOODS_CONDITION_KEYS,
  GOODS_ITEM_SUGGESTIONS,
  GOODS_MODEL_GROUPS,
  GOODS_MODEL_SUGGESTIONS,
  GOODS_TYPE_KEYS,
  translations,
  VEHICLE_MODEL_GROUPS,
  VEHICLE_MODEL_SUGGESTIONS,
  VEHICLE_TYPE_KEYS,
  VEHICLE_YEAR_SUGGESTIONS,
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
import {
  formatPrice,
  formatSpecsLine,
  matchesGoodsCondition,
  matchesGoodsItem,
  matchesGoodsType,
  matchesListingModel,
  matchesVehicleType,
  matchesVehicleYear,
} from '../utils/format';
import { ListingCard } from './ListingCard';

interface BuyerViewProps {
  lang: Language;
  user: User | null;
  isAdmin?: boolean;
  requestedTransactionType?: TransactionType;
  onTransactionTypeChange?: (tx: TransactionType) => void;
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
  onSignOut?: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export function BuyerView({
  lang,
  user,
  isAdmin = false,
  requestedTransactionType,
  onTransactionTypeChange,
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
  onSignOut,
  onOpenLegal,
}: BuyerViewProps) {
  const t = translations[lang];

  const [transactionType, setTransactionType] = useState<TransactionType>(
    requestedTransactionType || 'sale'
  );
  const [category, setCategory] = useState<'all' | ListingCategory>('all');
  const [roomClassFilter, setRoomClassFilter] = useState<'all' | RoomClass>('all');
  const [tenantPrefFilter, setTenantPrefFilter] = useState<'all' | 'late' | 'bale_tedar'>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [vehicleModelFilter, setVehicleModelFilter] = useState<string>('');
  const [vehicleYearFilter, setVehicleYearFilter] = useState<string>('');
  const [goodsTypeFilter, setGoodsTypeFilter] = useState<string>('all');
  const [goodsModelFilter, setGoodsModelFilter] = useState<string>('');
  const [goodsItemFilter, setGoodsItemFilter] = useState<string>('');
  const [goodsConditionFilter, setGoodsConditionFilter] = useState<string>('all');
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
  const [agreedWantedLegal, setAgreedWantedLegal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (savedPhone && !wantedPhone) {
      setWantedPhone(savedPhone);
    }
  }, [savedPhone, wantedPhone]);

  useEffect(() => {
    if (requestedTransactionType) {
      setTransactionType(requestedTransactionType);
      if (requestedTransactionType === 'sale') {
        setRoomClassFilter('all');
        setTenantPrefFilter('all');
      }
    }
  }, [requestedTransactionType]);

  const handleSelectTx = (nextTx: TransactionType) => {
    setTransactionType(nextTx);
    onTransactionTypeChange?.(nextTx);
    if (nextTx === 'sale') {
      setRoomClassFilter('all');
      setTenantPrefFilter('all');
    }
  };

  const categoryTiles: { key: ListingCategory; label: string; Icon: typeof Building2 }[] = [
    { key: 'apartment', label: t.catApartment, Icon: Building2 },
    { key: 'condominium', label: t.catCondominium, Icon: Building },
    { key: 'house', label: t.catHouse, Icon: Home },
    { key: 'land', label: t.catLand, Icon: MapPin },
    { key: 'vehicle', label: t.catVehicle, Icon: Car },
    { key: 'goods', label: t.catGoods, Icon: Package },
  ];

  const customVehicleModels = useMemo(() => {
    const known = new Set(VEHICLE_MODEL_SUGGESTIONS.map((m) => m.toLowerCase()));
    const map = new Map<string, string>();
    allListings.forEach((item) => {
      const m = item.category === 'vehicle' ? item.specs?.vehicleModel?.trim() : '';
      if (m && !known.has(m.toLowerCase()) && !map.has(m.toLowerCase())) {
        map.set(m.toLowerCase(), m);
      }
    });
    return Array.from(map.values());
  }, [allListings]);

  const vehicleModelOptions = useMemo(() => {
    return [...customVehicleModels, ...VEHICLE_MODEL_SUGGESTIONS];
  }, [customVehicleModels]);

  const vehicleYearOptions = useMemo(() => {
    const years = new Set<string>(VEHICLE_YEAR_SUGGESTIONS);
    allListings.forEach((item) => {
      if (item.category === 'vehicle' && typeof item.specs?.vehicleYear === 'number') {
        years.add(String(item.specs.vehicleYear));
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [allListings]);

  const customGoodsModels = useMemo(() => {
    const known = new Set(GOODS_MODEL_SUGGESTIONS.map((m) => m.toLowerCase()));
    const map = new Map<string, string>();
    allListings.forEach((item) => {
      const m = item.category === 'goods' ? item.specs?.goodsModel?.trim() : '';
      if (m && !known.has(m.toLowerCase()) && !map.has(m.toLowerCase())) {
        map.set(m.toLowerCase(), m);
      }
    });
    return Array.from(map.values());
  }, [allListings]);

  const goodsModelOptions = useMemo(() => {
    return [...customGoodsModels, ...GOODS_MODEL_SUGGESTIONS];
  }, [customGoodsModels]);

  const matchingListings = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const budgetNum = Number(maxBudget);
    const hasBudget = maxBudget.trim() !== '' && Number.isFinite(budgetNum) && budgetNum > 0;

    return allListings.filter((item) => {
      if (item.transactionType !== transactionType) return false;
      if (category !== 'all' && item.category !== category) return false;
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
      if (category === 'vehicle') {
        if (!matchesVehicleType(item, vehicleTypeFilter)) return false;
        if (!matchesListingModel(item, 'vehicle', vehicleModelFilter)) return false;
        if (!matchesVehicleYear(item, vehicleYearFilter)) return false;
      }
      if (category === 'goods') {
        if (!matchesGoodsType(item, goodsTypeFilter)) return false;
        if (!matchesListingModel(item, 'goods', goodsModelFilter)) return false;
        if (!matchesGoodsItem(item, goodsItemFilter)) return false;
        if (!matchesGoodsCondition(item, goodsConditionFilter)) return false;
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
        const hay = `${item.title} ${item.description} ${item.neighborhood} ${item.city} ${
          item.specs?.vehicleType || ''
        } ${item.specs?.vehicleModel || ''} ${item.specs?.vehicleYear ?? ''} ${
          item.specs?.goodsType || ''
        } ${item.specs?.goodsModel || ''} ${item.specs?.itemCondition || ''}`.toLowerCase();
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
    vehicleTypeFilter,
    vehicleModelFilter,
    vehicleYearFilter,
    goodsTypeFilter,
    goodsModelFilter,
    goodsItemFilter,
    goodsConditionFilter,
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
    if (!agreedWantedLegal) {
      setFormError(t.legalMustAcceptError);
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
          (wantedCategory === 'apartment' ||
            wantedCategory === 'condominium' ||
            wantedCategory === 'house') &&
          wantedRoomClass
            ? wantedRoomClass
            : undefined,
        tenantPreference:
          transactionType === 'rent' &&
          (wantedCategory === 'apartment' ||
            wantedCategory === 'condominium' ||
            wantedCategory === 'house') &&
          wantedTenantPref
            ? wantedTenantPref
            : undefined,
      });
      setWantedTitle('');
      setWantedNotes('');
      setWantedRoomClass('');
      setWantedTenantPref('');
      setAgreedWantedLegal(false);
      setPostedSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to post buyer request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2940] via-[#0F394C] to-[#0D4641] border border-[#1E586B] p-6 sm:p-8 text-[#F5FAFC] flex flex-col sm:flex-row sm:items-end justify-between gap-4 shadow-[0_14px_34px_-16px_rgba(10,40,56,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-12 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl"
        />
        <div className="relative space-y-2">
          <button
            type="button"
            onClick={onBackToBrowse}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToMarketplace}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FBF9F2]">
            {t.buyerStudioTitle}
          </h1>
          <p className="text-sm text-[#CBE3EC] max-w-2xl leading-relaxed">{t.buyerStudioSubtitle}</p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoToOrders}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-sky-100 whitespace-nowrap transition-colors"
          >
            {isAdmin ? `${t.tabOrders} (${myOrders.length}) · ` : ''}
            {t.tabSaved} ({savedIds.size})
          </button>
          {user && onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-red-900/70 hover:text-red-100 hover:border-red-400/50 text-xs font-medium text-sky-100 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOut}</span>
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Standalone Top Selector for Looking to Buy vs Looking to Rent */}
      <div className="bg-white border border-[#E5E0D6] rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
        <h2 className="text-sm font-bold text-[#143B5C]">{t.chooseBuyOrRentLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelectTx('sale')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              transactionType === 'sale'
                ? 'border-[#C2410C] bg-[#FFF8F2] ring-2 ring-[#C2410C]/25 shadow-sm'
                : 'border-[#E5E0D6] bg-[#FAF8F4] hover:bg-white hover:border-[#C9C1B2]'
            }`}
          >
            <div
              className={`text-base font-bold ${
                transactionType === 'sale' ? 'text-[#7C2D12]' : 'text-[#122620]'
              }`}
            >
              {t.buyOptionTitle}
            </div>
            <p
              className={`text-xs mt-1 ${
                transactionType === 'sale' ? 'text-[#9A3412]' : 'text-[#4C5C57]'
              }`}
            >
              {t.buyOptionDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTx('rent')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              transactionType === 'rent'
                ? 'border-[#1D4ED8] bg-[#F4F8FF] ring-2 ring-[#2563EB]/25 shadow-sm'
                : 'border-[#E5E0D6] bg-[#FAF8F4] hover:bg-white hover:border-[#C9C1B2]'
            }`}
          >
            <div
              className={`text-base font-bold ${
                transactionType === 'rent' ? 'text-[#1E3A8A]' : 'text-[#122620]'
              }`}
            >
              {t.rentBuyerOptionTitle}
            </div>
            <p
              className={`text-xs mt-1 ${
                transactionType === 'rent' ? 'text-[#1D4ED8]' : 'text-[#4C5C57]'
              }`}
            >
              {t.rentBuyerOptionDesc}
            </p>
          </button>
        </div>
      </div>

      {/* Step 2: Directly Underneath — Enter What You Want to Buy or Rent */}
      <div className="bg-white border border-[#E5E0D6] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
        <h2 className="text-sm font-bold text-[#0F4C3A]">
          {transactionType === 'sale' ? t.whatBuyingLabel : t.whatRentingBuyerLabel}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-center ${
              category === 'all'
                ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white font-semibold shadow-sm'
                : 'border-[#E5E0D6] bg-[#F7F5F0] text-[#2F423B] hover:bg-[#EFECE4]'
            }`}
          >
            <span className="text-xs font-semibold">{t.allCategories}</span>
          </button>
          {categoryTiles.map(({ key, label, Icon }) => {
            const active = category === key;
            const activeColors =
              key === 'land'
                ? 'border-[#B45309] bg-[#FDF1DB] text-[#5C2D0C]'
                : key === 'vehicle'
                ? 'border-[#1D4ED8] bg-[#E5F0FC] text-[#142F66]'
                : key === 'goods'
                ? 'border-[#9D174D] bg-[#F8EAF2] text-[#591432]'
                : key === 'condominium'
                ? 'border-[#0F766E] bg-[#E0F4F1] text-[#0D4D47]'
                : 'border-[#0F5E48] bg-[#E3F5EE] text-[#0B3B2E]';
            const iconColor =
              key === 'land'
                ? 'text-[#B45309]'
                : key === 'vehicle'
                ? 'text-[#1D4ED8]'
                : key === 'goods'
                ? 'text-[#9D174D]'
                : key === 'condominium'
                ? 'text-[#0F766E]'
                : 'text-[#0F5E48]';
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setCategory(key);
                  setWantedCategory(key);
                  if (key !== 'apartment' && key !== 'condominium' && key !== 'house') {
                    setRoomClassFilter('all');
                    setTenantPrefFilter('all');
                  }
                  if (key !== 'vehicle') {
                    setVehicleTypeFilter('all');
                    setVehicleModelFilter('');
                    setVehicleYearFilter('');
                  }
                  if (key !== 'goods') {
                    setGoodsTypeFilter('all');
                    setGoodsModelFilter('');
                    setGoodsItemFilter('');
                    setGoodsConditionFilter('all');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-colors flex flex-col gap-1.5 ${
                  active
                    ? `${activeColors} shadow-sm`
                    : 'border-[#E5E0D6] bg-[#F7F5F0] text-[#2F423B] hover:bg-[#EFECE4]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? iconColor : 'text-[#5A6B65]'}`} />
                <span className="text-xs font-semibold truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#0F5E48] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#D5CFC2] bg-[#FAF8F4] focus:bg-white text-sm text-[#102620] focus:outline-none focus:ring-2 focus:ring-emerald-800/30 focus:border-[#0F4C3A]"
            />
          </div>
          <div className="sm:col-span-3 relative">
            <MapPin className="w-4 h-4 text-[#B45309] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              list="buyer-filter-locations"
              aria-label="Preferred neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder={t.locationFilterPlaceholder}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#D5CFC2] bg-[#FAF8F4] focus:bg-white text-sm text-[#102620] placeholder:text-[#6B665A] focus:outline-none focus:ring-2 focus:ring-emerald-800/30 focus:border-[#0F4C3A]"
            />
            {neighborhood && (
              <button
                type="button"
                aria-label="Clear location"
                onClick={() => setNeighborhood('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B665A] hover:text-[#102620]"
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
              className="w-full h-10 px-3 rounded-xl border border-[#D5CFC2] bg-[#FAF8F4] focus:bg-white text-sm font-mono tabular-nums text-[#102620] focus:outline-none focus:ring-2 focus:ring-emerald-800/30 focus:border-[#0F4C3A]"
            />
          </div>
        </div>

        {transactionType === 'rent' &&
          (category === 'all' ||
            category === 'apartment' ||
            category === 'condominium' ||
            category === 'house') && (
            <div className="p-4 rounded-xl bg-[#E8F1FC] border border-[#B2CDF0] space-y-3">
              <div className="text-xs font-bold text-[#142F66]">{t.rentalOptionsHeading}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#1E40AF]">{t.roomClassLabel}</div>
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          roomClassFilter === opt.key
                            ? 'border-[#1E40AF] bg-[#1E40AF] text-white'
                            : 'border-[#B6CEE8] bg-[#FFFDF8] text-[#1E3A8A] hover:bg-[#DDEAF9]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#1E40AF]">{t.tenantPrefLabel}</div>
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          tenantPrefFilter === opt.key
                            ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white'
                            : 'border-[#B6CEE8] bg-[#FFFDF8] text-[#1E3A8A] hover:bg-[#DDEAF9]'
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

        {category === 'vehicle' && (
          <div className="p-4 rounded-xl bg-[#EEF4FF] border border-[#BFDBFE] space-y-3">
            <div className="text-xs font-bold text-[#142F66]">{t.vehicleNavHeading}</div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#1E40AF]">{t.vehicleTypeLabel}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                      vehicleTypeFilter === 'all'
                        ? 'border-[#1E40AF] bg-[#1E40AF] text-white'
                        : 'border-[#BFD6F6] bg-white text-[#1E3A8A] hover:bg-[#E0ECFD]'
                    }`}
                  >
                    {t.allVehicleTypes}
                  </button>
                  {VEHICLE_TYPE_KEYS.map((vk) => (
                    <button
                      key={vk}
                      type="button"
                      onClick={() => setVehicleTypeFilter(vk)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                        vehicleTypeFilter === vk
                          ? 'border-[#1E40AF] bg-[#1E40AF] text-white'
                          : 'border-[#BFD6F6] bg-white text-[#1E3A8A] hover:bg-[#E0ECFD]'
                      }`}
                    >
                      {getVehicleTypeLabel(vk, lang)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1E40AF] mb-1">
                    {t.vehicleModelLabel}
                  </label>
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
                    className="w-full h-9 px-3 rounded-lg border border-[#BFD6F6] bg-white text-xs font-semibold text-[#142F66]"
                  >
                    <option value="">{t.allModels}</option>
                    {customVehicleModels.length > 0 && (
                      <optgroup label="Listed">
                        {customVehicleModels.map((m) => (
                          <option key={`custom-${m}`} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {VEHICLE_MODEL_GROUPS.map((group) => (
                      <optgroup key={group.brand} label={group.brand}>
                        {group.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#1E40AF] mb-1">
                    {t.searchButton} · {t.vehicleModelLabel}
                  </label>
                  <input
                    type="text"
                    list="buyer-vehicle-models"
                    placeholder={t.vehicleModelPlaceholder}
                    value={vehicleModelFilter}
                    onChange={(e) => setVehicleModelFilter(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#BFD6F6] bg-white text-xs text-[#102620]"
                  />
                  {vehicleModelFilter && (
                    <button
                      type="button"
                      aria-label="Clear model filter"
                      onClick={() => setVehicleModelFilter('')}
                      className="absolute right-2.5 bottom-2 text-[#1E40AF] hover:text-[#142F66]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="buyer-vehicle-models">
                    {vehicleModelOptions.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E40AF] mb-1">
                    {t.vehicleYear}
                  </label>
                  <select
                    aria-label={t.vehicleYear}
                    value={
                      vehicleYearOptions.includes(vehicleYearFilter.trim())
                        ? vehicleYearFilter.trim()
                        : ''
                    }
                    onChange={(e) => setVehicleYearFilter(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#BFD6F6] bg-white text-xs font-semibold text-[#142F66] tabular-nums"
                  >
                    <option value="">{t.allYears}</option>
                    {vehicleYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#1E40AF] mb-1">
                    {t.searchButton} · {t.vehicleYear}
                  </label>
                  <Calendar className="w-3.5 h-3.5 text-[#1E40AF] absolute left-2.5 bottom-2.5 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    list="buyer-vehicle-years"
                    maxLength={12}
                    placeholder={t.vehicleYearFilterPlaceholder}
                    value={vehicleYearFilter}
                    onChange={(e) => setVehicleYearFilter(e.target.value)}
                    className="w-full h-9 pl-8 pr-8 rounded-lg border border-[#BFD6F6] bg-white text-xs tabular-nums text-[#102620]"
                  />
                  {vehicleYearFilter && (
                    <button
                      type="button"
                      aria-label="Clear year filter"
                      onClick={() => setVehicleYearFilter('')}
                      className="absolute right-2.5 bottom-2 text-[#1E40AF] hover:text-[#142F66]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="buyer-vehicle-years">
                    {vehicleYearOptions.map((y) => (
                      <option key={y} value={y} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>
        )}

        {category === 'goods' && (
          <div className="p-4 rounded-xl bg-[#FDF2F8] border border-[#F5C2DC] space-y-3">
            <div className="text-xs font-bold text-[#591432]">{t.goodsNavHeading}</div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#9D174D]">{t.goodsTypeLabel}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setGoodsTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                      goodsTypeFilter === 'all'
                        ? 'border-[#9D174D] bg-[#9D174D] text-white'
                        : 'border-[#F3C6DC] bg-white text-[#782B4E] hover:bg-[#FCE7F3]'
                    }`}
                  >
                    {t.allGoodsTypes}
                  </button>
                  {GOODS_TYPE_KEYS.map((gk) => (
                    <button
                      key={gk}
                      type="button"
                      onClick={() => setGoodsTypeFilter(gk)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                        goodsTypeFilter === gk
                          ? 'border-[#9D174D] bg-[#9D174D] text-white'
                          : 'border-[#F3C6DC] bg-white text-[#782B4E] hover:bg-[#FCE7F3]'
                      }`}
                    >
                      {getGoodsTypeLabel(gk, lang)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9D174D] mb-1">
                    {t.goodsModelLabel}
                  </label>
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
                    className="w-full h-9 px-3 rounded-lg border border-[#F3C6DC] bg-white text-xs font-semibold text-[#591432]"
                  >
                    <option value="">{t.allModels}</option>
                    {customGoodsModels.length > 0 && (
                      <optgroup label="Listed">
                        {customGoodsModels.map((m) => (
                          <option key={`custom-${m}`} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {GOODS_MODEL_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#9D174D] mb-1">
                    {t.searchButton} · {t.goodsModelLabel}
                  </label>
                  <input
                    type="text"
                    list="buyer-goods-models"
                    placeholder={t.goodsModelPlaceholder}
                    value={goodsModelFilter}
                    onChange={(e) => setGoodsModelFilter(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#F3C6DC] bg-white text-xs text-[#102620]"
                  />
                  {goodsModelFilter && (
                    <button
                      type="button"
                      aria-label="Clear model filter"
                      onClick={() => setGoodsModelFilter('')}
                      className="absolute right-2.5 bottom-2 text-[#9D174D] hover:text-[#591432]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="buyer-goods-models">
                    {goodsModelOptions.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#9D174D] mb-1">
                    {t.goodsNameLabel}
                  </label>
                  <Package className="w-3.5 h-3.5 text-[#9D174D] absolute left-2.5 bottom-2.5 pointer-events-none" />
                  <input
                    type="text"
                    list="buyer-goods-items"
                    placeholder={t.goodsNamePlaceholder}
                    value={goodsItemFilter}
                    onChange={(e) => setGoodsItemFilter(e.target.value)}
                    className="w-full h-9 pl-8 pr-8 rounded-lg border border-[#F3C6DC] bg-white text-xs text-[#102620]"
                  />
                  {goodsItemFilter && (
                    <button
                      type="button"
                      aria-label="Clear item filter"
                      onClick={() => setGoodsItemFilter('')}
                      className="absolute right-2.5 bottom-2 text-[#9D174D] hover:text-[#591432]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="buyer-goods-items">
                    {GOODS_ITEM_SUGGESTIONS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9D174D] mb-1">
                    {t.condition}
                  </label>
                  <select
                    aria-label={t.condition}
                    value={goodsConditionFilter}
                    onChange={(e) => setGoodsConditionFilter(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#F3C6DC] bg-white text-xs font-semibold text-[#591432]"
                  >
                    <option value="all">{t.allConditions}</option>
                    {GOODS_CONDITION_KEYS.map((ck) => (
                      <option key={ck} value={ck}>
                        {getGoodsConditionLabel(ck, lang)}
                      </option>
                    ))}
                  </select>
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
            <div className="bg-white border border-[#E5E0D6] rounded-2xl p-5 space-y-4 overflow-x-auto shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#142F66]">
                  <Scale className="w-4 h-4 text-[#1D4ED8]" />
                  <span>
                    {t.comparingTitle} ({comparedListings.length}/3)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="text-xs font-semibold text-[#9A3412] hover:underline"
                >
                  {t.clearCompare}
                </button>
              </div>

              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-b border-[#E6DED0] text-[#56625E]">
                    <th className="py-2 pr-4 font-semibold w-28">{t.fieldTitle}</th>
                    {comparedListings.map((item) => (
                      <th key={item.id} className="py-2 px-3 font-bold text-[#102620]">
                        {item.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE8DA]">
                  <tr>
                    <td className="py-2.5 pr-4 text-[#56625E] font-medium">{t.fieldPrice}</td>
                    {comparedListings.map((item) => (
                      <td
                        key={item.id}
                        className="py-2.5 px-3 font-mono font-bold text-[#9A3412] tabular-nums"
                      >
                        {formatPrice(item.price, item.currency, item.pricePeriod, lang)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-[#56625E] font-medium">{t.locationLabel}</td>
                    {comparedListings.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 text-[#2B4039]">
                        {item.neighborhood}, {item.city}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-[#56625E] font-medium">{t.specsHeading}</td>
                    {comparedListings.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 text-[#2B4039] tabular-nums">
                        {formatSpecsLine(item, lang)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-[#56625E] font-medium">{t.sellerLabel}</td>
                    {comparedListings.map((item) => (
                      <td key={item.id} className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => onSelectListing(item, 'order')}
                          className="px-3 py-1.5 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3B2D] text-white text-xs font-semibold"
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

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-sm text-[#0F4C3A]">
              {t.matchingListingsTitle} ({matchingListings.length})
            </span>
            <span className="font-semibold text-[#9A3412]">
              {getTransactionLabel(transactionType, lang)}
              {category !== 'all' ? ` · ${getCategoryLabel(category, lang)}` : ''}
            </span>
          </div>

          {matchingListings.length === 0 ? (
            <div className="bg-white border border-[#E5E0D6] rounded-2xl p-10 text-center space-y-3 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.06)]">
              <p className="text-sm text-[#42544F]">{t.noListingsFound}</p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setRoomClassFilter('all');
                  setTenantPrefFilter('all');
                  setVehicleTypeFilter('all');
                  setVehicleModelFilter('');
                  setVehicleYearFilter('');
                  setGoodsTypeFilter('all');
                  setGoodsModelFilter('');
                  setGoodsItemFilter('');
                  setGoodsConditionFilter('all');
                  setNeighborhood('');
                  setMaxBudget('');
                  setKeyword('');
                }}
                className="px-4 py-2 rounded-lg bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-semibold"
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
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                          isCompared
                            ? 'bg-[#1E40AF] text-white'
                            : 'text-[#1E3A8A] bg-[#E5F0FC] hover:bg-[#D5E6FA]'
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
          <div className="bg-white border border-[#E5DCC7] rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_10px_30px_-14px_rgba(154,52,18,0.12)]">
            <div className="space-y-1 pb-3 border-b border-[#EFEAE0]">
              <h2 className="text-base font-bold text-[#7C2D12]">{t.postWantedTitle}</h2>
              <p className="text-xs text-[#6B462B] leading-relaxed">{t.postWantedSubtitle}</p>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full py-2.5 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3B2D] text-white text-xs font-semibold"
              >
                {t.signInGoogle}
              </button>
            ) : (
              <form onSubmit={handleWantedSubmit} className="space-y-3">
                {postedSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span className="font-medium">{t.wantedSuccess}</span>
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
                    <option value="condominium">{t.catCondominium}</option>
                    <option value="house">{t.catHouse}</option>
                    <option value="land">{t.catLand}</option>
                    <option value="vehicle">{t.catVehicle}</option>
                    <option value="goods">{t.catGoods}</option>
                  </select>
                </div>

                {transactionType === 'rent' &&
                  (wantedCategory === 'apartment' ||
                    wantedCategory === 'condominium' ||
                    wantedCategory === 'house') && (
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

                <label className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-700 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedWantedLegal}
                    onChange={(e) => {
                      setAgreedWantedLegal(e.target.checked);
                      if (e.target.checked && formError === t.legalMustAcceptError) {
                        setFormError('');
                      }
                    }}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-emerald-800 focus:ring-emerald-700 shrink-0"
                  />
                  <span>
                    {t.legalAgreePrefix}{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenLegal?.('terms');
                      }}
                      className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
                    >
                      {t.termsLink}
                    </button>{' '}
                    {t.legalAgreeAnd}{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenLegal?.('privacy');
                      }}
                      className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
                    >
                      {t.privacyLink}
                    </button>
                    {t.legalAgreeSuffix ? ` ${t.legalAgreeSuffix}` : '.'}
                  </span>
                </label>

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
            <div className="bg-white border border-[#E5E0D6] rounded-2xl p-5 space-y-4 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
              <h3 className="text-sm font-bold text-[#0F4C3A]">
                {t.activeWantedTitle} ({buyerRequests.length})
              </h3>
              <div className="divide-y divide-[#EFECE4]">
                {buyerRequests.map((req) => {
                  const isOwn = Boolean(user && req.buyerId === user.uid);
                  return (
                    <div key={req.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#56625E]">
                        <span>
                          <span className="font-semibold text-[#1D4ED8]">
                            {getTransactionLabel(req.transactionType, lang)}
                          </span>{' '}
                          ·{' '}
                          <span className="font-semibold text-[#0F5E48]">
                            {getCategoryLabel(req.category, lang)}
                          </span>{' '}
                          · {req.preferredNeighborhood}
                          {req.roomClass ? ` · ${getRoomClassLabel(req.roomClass, lang)}` : ''}
                          {req.tenantPreference
                            ? ` · ${getTenantPreferenceLabel(req.tenantPreference, lang)}`
                            : ''}
                        </span>
                        <span className="capitalize font-semibold text-[#B45309]">{req.status}</span>
                      </div>
                      <div className="text-sm font-bold text-[#102620]">{req.title}</div>
                      <div className="font-mono text-xs font-bold text-[#9A3412] tabular-nums">
                        ≤ {formatPrice(req.maxBudget, req.currency, 'total', lang)}
                      </div>
                      {req.notes && <p className="text-xs text-[#4C5C57]">{req.notes}</p>}
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
                              className="text-xs font-semibold text-[#0F5E48] hover:underline"
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
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
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
