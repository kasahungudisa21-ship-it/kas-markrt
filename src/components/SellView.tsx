import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Building,
  Building2,
  Car,
  CheckCircle2,
  Home,
  Lock,
  LogOut,
  MapPin,
  Package,
  Video,
  Volume2,
} from 'lucide-react';
import { CATEGORY_PRESET_IMAGES, NEIGHBORHOOD_OPTIONS } from '../data/showcaseListings';
import { createListing } from '../firebase';
import { getCategoryLabel, getTransactionLabel, translations } from '../i18n';
import {
  CurrencyCode,
  Language,
  Listing,
  ListingCategory,
  ListingSpecs,
  PricePeriod,
  RoomClass,
  TenantPreference,
  TransactionType,
} from '../types';
import { formatFirestoreUserError, formatPrice, formatSpecsLine } from '../utils/format';
import {
  createEmptyPhotoSlots,
  MultiAnglePhotoUploader,
  PhotoSlotsState,
  slotsToPhotosArray,
} from './MultiAnglePhotoUploader';
import { ResilientImage } from './ResilientImage';
import { ListingVideoRecorder } from './ListingVideoRecorder';
import { VoiceDescriptionRecorder } from './VoiceDescriptionRecorder';

interface SellViewProps {
  lang: Language;
  user: User | null;
  isAdmin?: boolean;
  savedPhone?: string;
  myListings: Listing[];
  incomingOrdersCount: number;
  onBackToBrowse: () => void;
  onGoToOrders: () => void;
  onSignIn: () => void;
  onSignOut?: () => void;
}

export function SellView({
  lang,
  user,
  isAdmin = false,
  savedPhone = '',
  myListings,
  incomingOrdersCount,
  onBackToBrowse,
  onGoToOrders,
  onSignIn,
  onSignOut,
}: SellViewProps) {
  const t = translations[lang];

  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [category, setCategory] = useState<ListingCategory>('apartment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionVoiceUrl, setDescriptionVoiceUrl] = useState('');
  const [descriptionVoiceDurationSec, setDescriptionVoiceDurationSec] = useState(0);
  const [videoDataUrl, setVideoDataUrl] = useState('');
  const [videoMimeType, setVideoMimeType] = useState('');
  const [videoDurationSec, setVideoDurationSec] = useState(0);
  const [price, setPrice] = useState('12500000');
  const [currency, setCurrency] = useState<CurrencyCode>('ETB');
  const [pricePeriod, setPricePeriod] = useState<PricePeriod>('total');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [sellerPhone, setSellerPhone] = useState(savedPhone);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlotsState>(() => createEmptyPhotoSlots());

  useEffect(() => {
    if (savedPhone && !sellerPhone) {
      setSellerPhone(savedPhone);
    }
  }, [savedPhone, sellerPhone]);

  const [roomClass, setRoomClass] = useState<RoomClass>('2_class');
  const [tenantPreference, setTenantPreference] = useState<TenantPreference>('any');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [areaSqm, setAreaSqm] = useState('145');
  const [titleDeed, setTitleDeed] = useState('Digital Carta');
  const [vehicleYear, setVehicleYear] = useState('2024');
  const [mileageKm, setMileageKm] = useState('12000');
  const [transmission, setTransmission] = useState('Automatic');
  const [fuelType, setFuelType] = useState('Hybrid');
  const [itemCondition, setItemCondition] = useState('Like New');

  const [submitting, setSubmitting] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTransactionChange = (nextTx: TransactionType) => {
    setTransactionType(nextTx);
    if (nextTx === 'rent') {
      setPricePeriod('monthly');
      if (price === '12500000') setPrice('85000');
    } else {
      setPricePeriod('total');
      if (price === '85000') setPrice('12500000');
    }
  };

  const handleCategoryChange = (nextCat: ListingCategory) => {
    setCategory(nextCat);
  };

  const uploadedPhotos = slotsToPhotosArray(photoSlots);
  const fallbackPresetUrl = CATEGORY_PRESET_IMAGES[category]?.[0]?.url || '';
  const activeImage = uploadedPhotos[0]?.imageDataUrl || fallbackPresetUrl;

  const categoryTiles: { key: ListingCategory; label: string; Icon: typeof Building2 }[] = [
    { key: 'apartment', label: t.catApartment, Icon: Building2 },
    { key: 'condominium', label: t.catCondominium, Icon: Building },
    { key: 'house', label: t.catHouse, Icon: Home },
    { key: 'land', label: t.catLand, Icon: MapPin },
    { key: 'vehicle', label: t.catVehicle, Icon: Car },
    { key: 'goods', label: t.catGoods, Icon: Package },
  ];

  const handleRoomClassSelect = (rc: RoomClass) => {
    setRoomClass(rc);
    if (rc === '1_class') setBedrooms('1');
    else if (rc === '2_class') setBedrooms('2');
    else setBedrooms('3');
  };

  const buildSpecs = (): ListingSpecs => {
    const specs: ListingSpecs = {};
    if (category === 'apartment' || category === 'condominium' || category === 'house') {
      specs.bedrooms = Number(bedrooms) || 0;
      specs.bathrooms = Number(bathrooms) || 0;
      specs.areaSqm = Number(areaSqm) || 0;
      specs.roomClass = roomClass;
      if (transactionType === 'rent') {
        specs.tenantPreference = tenantPreference;
      }
      if (titleDeed.trim()) specs.titleDeed = titleDeed.trim();
    } else if (category === 'land') {
      specs.areaSqm = Number(areaSqm) || 0;
      if (titleDeed.trim()) specs.titleDeed = titleDeed.trim();
    } else if (category === 'vehicle') {
      specs.vehicleYear = Number(vehicleYear) || 2020;
      specs.mileageKm = Number(mileageKm) || 0;
      specs.transmission = transmission.trim();
      specs.fuelType = fuelType.trim();
    } else if (category === 'goods') {
      specs.itemCondition = itemCondition.trim();
    }
    return specs;
  };

  const previewListing: Listing = {
    id: 'preview',
    ownerId: user?.uid || 'preview',
    sellerName: user?.displayName || 'Your Name',
    category,
    transactionType,
    title:
      title.trim() ||
      (category === 'vehicle'
        ? transactionType === 'rent'
          ? '2024 Toyota RAV4 Hybrid — Daily / Monthly Rental'
          : '2024 Toyota Corolla Cross Hybrid'
        : category === 'land'
        ? '450 m² Residential Plot in CMC'
        : category === 'goods'
        ? 'Modern Solid Walnut Lounge Chair'
        : category === 'condominium'
        ? transactionType === 'rent'
          ? '2-Bedroom Condominium for Rent in Ayat'
          : '2-Bedroom Condominium for Sale in Jemo'
        : transactionType === 'rent'
        ? '3-Bedroom Sunlit Apartment for Rent in Bole'
        : '3-Bedroom Sunlit Apartment for Sale in Bole'),
    description: description.trim() || t.sellerPageSubtitle,
    descriptionVoiceUrl: descriptionVoiceUrl || undefined,
    descriptionVoiceDurationSec: descriptionVoiceDurationSec || undefined,
    price: Number(price) > 0 ? Number(price) : 100000,
    currency,
    pricePeriod,
    neighborhood: neighborhood.trim() || 'Bole',
    city: city.trim() || 'Addis Ababa',
    imageUrl: activeImage,
    photoCount: Math.max(1, uploadedPhotos.length),
    photos: uploadedPhotos,
    videoUrl: videoDataUrl || undefined,
    videoMimeType: videoMimeType || undefined,
    videoDurationSec: videoDurationSec || undefined,
    videoChunkCount: videoDataUrl ? 1 : undefined,
    status: 'available',
    specs: buildSpecs(),
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignIn();
      return;
    }

    const numericPrice = Number(price);
    if (title.trim().length < 3) {
      setErrorMsg(
        lang === 'am' ? 'ርዕስ ቢያንስ 3 ፊደላት መሆን አለበት።' : 'Headline must be at least 3 characters.'
      );
      return;
    }
    if (description.trim().length < 10 && descriptionVoiceUrl.length < 20) {
      setErrorMsg(t.voiceOrTextError);
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setErrorMsg(lang === 'am' ? 'ትክክለኛ ዋጋ ያስገቡ።' : 'Enter a valid price greater than 0.');
      return;
    }
    if (neighborhood.trim().length < 2) {
      setErrorMsg(
        lang === 'am'
          ? 'እባክዎ አካባቢውን በትክክል ይጻፉ (ቢያንስ 2 ፊደላት)።'
          : 'Neighborhood must be at least 2 characters.'
      );
      return;
    }
    if (city.trim().length < 2) {
      setErrorMsg(
        lang === 'am'
          ? 'እባክዎ ከተማውን በትክክል ይጻፉ (ቢያንስ 2 ፊደላት)።'
          : 'City must be at least 2 characters.'
      );
      return;
    }
    if (sellerPhone.trim().length < 6) {
      setErrorMsg(t.phoneValidationError);
      return;
    }
    if (uploadedPhotos.length === 0) {
      setErrorMsg(t.photoRequiredError);
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    setPublishedSuccess(false);

    try {
      await createListing(user, {
        category,
        transactionType,
        title,
        description,
        descriptionVoiceUrl,
        descriptionVoiceDurationSec,
        price: numericPrice,
        currency,
        pricePeriod,
        neighborhood,
        city,
        imageUrl: activeImage,
        photos: uploadedPhotos,
        videoDataUrl: videoDataUrl || undefined,
        videoMimeType: videoMimeType || undefined,
        videoDurationSec: videoDurationSec || undefined,
        specs: buildSpecs(),
        sellerPhone: sellerPhone.trim(),
      });
      setTitle('');
      setDescription('');
      setDescriptionVoiceUrl('');
      setDescriptionVoiceDurationSec(0);
      setVideoDataUrl('');
      setVideoMimeType('');
      setVideoDurationSec(0);
      setPhotoSlots(createEmptyPhotoSlots());
      setPublishedSuccess(true);
    } catch (err) {
      setErrorMsg(formatFirestoreUserError(err, lang));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#092C23] via-[#0F3D32] to-[#133847] border border-[#1F5648] p-6 sm:p-8 text-[#FCF9F2] flex flex-col sm:flex-row sm:items-end justify-between gap-4 shadow-[0_14px_34px_-16px_rgba(9,44,35,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-12 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl"
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FCF8EE]">
            {t.sellerPageTitle}
          </h1>
          <p className="text-sm text-[#CCE5DC] max-w-2xl leading-relaxed">{t.sellerPageSubtitle}</p>
        </div>

        {user && (
          <div className="relative flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onGoToOrders}
              className="px-4 py-2 rounded-xl border border-amber-300/40 bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 whitespace-nowrap transition-colors"
            >
              {t.tabMyListings} ({myListings.length}) ·{' '}
              {isAdmin ? `${t.tabOrders} (${incomingOrdersCount})` : t.tabInbox}
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-red-900/70 hover:text-red-100 hover:border-red-400/50 text-xs font-medium text-emerald-100 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 1: Standalone Top Selector for For Sale vs For Rent */}
      <div className="bg-white border border-[#E5E0D6] rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
        <h2 className="text-sm font-bold text-[#0F4C3A]">{t.chooseSaleOrRentLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTransactionChange('sale')}
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
              {t.txSale}
            </div>
            <p
              className={`text-xs mt-1 ${
                transactionType === 'sale' ? 'text-[#9A3412]' : 'text-[#4C5C57]'
              }`}
            >
              {t.sellOptionDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTransactionChange('rent')}
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
              {t.txRent}
            </div>
            <p
              className={`text-xs mt-1 ${
                transactionType === 'rent' ? 'text-[#1D4ED8]' : 'text-[#4C5C57]'
              }`}
            >
              {t.rentOptionDesc}
            </p>
          </button>
        </div>
      </div>

      {/* Step 2: Directly Underneath — Enter What You Are Selling or Renting Out */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E5E0D6] rounded-2xl p-6 sm:p-8 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
          {!user ? (
            <div className="py-10 text-center space-y-4">
              <p className="text-sm text-[#394D46] max-w-md mx-auto">{t.publishStarterPrompt}</p>
              <button
                type="button"
                onClick={onSignIn}
                className="px-6 py-2.5 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3B2D] text-white text-sm font-semibold transition-colors"
              >
                {t.signInGoogle}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {publishedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <span className="font-medium">{t.sellerPostSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onBackToBrowse}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0F4C3A] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    {t.navExplore}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#0F4C3A]">
                  {transactionType === 'sale' ? t.whatSellingLabel : t.whatRentingLabel}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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
                        onClick={() => handleCategoryChange(key)}
                        className={`p-3 rounded-xl border text-left transition-colors flex flex-col gap-1.5 ${
                          active
                            ? `${activeColors} font-semibold shadow-sm`
                            : 'border-[#E5E0D6] bg-[#F7F5F0] text-[#2F423B] hover:bg-[#EFECE4]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? iconColor : 'text-[#5A6B65]'}`} />
                        <span className="text-xs font-semibold truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  {t.fieldTitle} ({getTransactionLabel(transactionType, lang)} ·{' '}
                  {getCategoryLabel(category, lang)})
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === 'vehicle'
                      ? transactionType === 'rent'
                        ? '2024 Toyota RAV4 Hybrid for Rent'
                        : '2024 Toyota RAV4 Hybrid AWD for Sale'
                      : category === 'land'
                      ? '500 m² Corner Plot in CMC'
                      : category === 'goods'
                      ? 'Solid Walnut Lounge Chair & Espresso Machine'
                      : category === 'condominium'
                      ? transactionType === 'rent'
                        ? '2-Bedroom Condominium for Rent in Ayat'
                        : '2-Bedroom Condominium for Sale in Jemo'
                      : transactionType === 'rent'
                      ? '3-Bedroom Apartment for Rent in Bole'
                      : '3-Bedroom Apartment for Sale in Bole'
                  }
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldPrice}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10000000000}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldCurrency}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldPeriod}
                  </label>
                  <select
                    value={pricePeriod}
                    onChange={(e) => setPricePeriod(e.target.value as PricePeriod)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="total">{t.periodTotal}</option>
                    <option value="monthly">{t.periodMonthly}</option>
                    <option value="yearly">{t.periodYearly}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldNeighborhood}
                  </label>
                  <input
                    type="text"
                    list="seller-neighborhoods"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder={t.locationPlaceholder}
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                  <datalist id="seller-neighborhoods">
                    {NEIGHBORHOOD_OPTIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldCity}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  {t.phoneInputLabel}
                </label>
                <input
                  type="tel"
                  required
                  minLength={6}
                  maxLength={30}
                  placeholder={t.phonePlaceholder}
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                <p className="mt-1.5 text-xs text-zinc-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span>{t.phonePrivacyNote}</span>
                </p>
              </div>

              {(category === 'apartment' || category === 'condominium' || category === 'house') && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl bg-[#E8F3EE] border border-[#B7DACA] space-y-4">
                    <div className="text-xs font-bold text-[#0B3B2E]">
                      {t.rentalOptionsHeading}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#184E3E]">
                        {t.roomClassLabel}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(
                          [
                            { key: '1_class', label: t.roomClass1 },
                            { key: '2_class', label: t.roomClass2 },
                            { key: '3_plus', label: t.roomClass3Plus },
                          ] as { key: RoomClass; label: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleRoomClassSelect(opt.key)}
                            className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                              roomClass === opt.key
                                ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white shadow-sm'
                                : 'border-[#B9D4C8] bg-[#FFFDF8] text-[#173D32] hover:bg-[#F1F8F4]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {transactionType === 'rent' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#184E3E]">
                          {t.tenantPrefLabel}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(
                            [
                              { key: 'late', label: t.tenantPrefLate },
                              { key: 'bale_tedar', label: t.tenantPrefBaleTedar },
                              { key: 'any', label: t.tenantPrefAny },
                            ] as { key: TenantPreference; label: string }[]
                          ).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setTenantPreference(opt.key)}
                              className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                                tenantPreference === opt.key
                                  ? 'border-[#1E40AF] bg-[#1E40AF] text-white shadow-sm'
                                  : 'border-[#B9D4C8] bg-[#FFFDF8] text-[#173D32] hover:bg-[#F1F8F4]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.bedrooms}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.bathrooms}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.areaSqm} (m²)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000000}
                        value={areaSqm}
                        onChange={(e) => setAreaSqm(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.titleDeed}
                      </label>
                      <input
                        type="text"
                        maxLength={60}
                        value={titleDeed}
                        onChange={(e) => setTitleDeed(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'land' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.areaSqm} (m²)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.titleDeed}
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={titleDeed}
                      onChange={(e) => setTitleDeed(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                    />
                  </div>
                </div>
              )}

              {category === 'vehicle' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.vehicleYear}
                    </label>
                    <input
                      type="number"
                      min={1960}
                      max={2030}
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.mileageKm} (km)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={2000000}
                      value={mileageKm}
                      onChange={(e) => setMileageKm(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.transmission}
                    </label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm bg-white"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      {t.fuelType}
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm bg-white"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </div>
                </div>
              )}

              {category === 'goods' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {t.condition}
                  </label>
                  <select
                    value={itemCondition}
                    onChange={(e) => setItemCondition(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm bg-white"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Gently Used">Gently Used</option>
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldDescription}
                  </label>
                  <textarea
                    rows={4}
                    required={descriptionVoiceUrl.length < 20}
                    minLength={descriptionVoiceUrl.length < 20 ? 10 : 0}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <VoiceDescriptionRecorder
                  lang={lang}
                  voiceUrl={descriptionVoiceUrl}
                  durationSec={descriptionVoiceDurationSec}
                  onChange={(url, secs) => {
                    setDescriptionVoiceUrl(url);
                    setDescriptionVoiceDurationSec(secs);
                  }}
                />
              </div>

              <div className="pt-2 border-t border-zinc-200 space-y-5">
                <MultiAnglePhotoUploader
                  lang={lang}
                  category={category}
                  slots={photoSlots}
                  onChangeSlots={setPhotoSlots}
                />
                <ListingVideoRecorder
                  lang={lang}
                  videoUrl={videoDataUrl}
                  durationSec={videoDurationSec}
                  onChange={(url, mime, secs) => {
                    setVideoDataUrl(url);
                    setVideoMimeType(mime);
                    setVideoDurationSec(secs);
                  }}
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div className="pt-3 border-t border-[#E6DED0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onBackToBrowse}
                  className="px-4 py-2.5 rounded-lg border border-[#CEC5B3] bg-[#F7F3EA] text-sm font-medium text-[#2F423B] hover:bg-[#EDE6D8]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3B2D] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {t.submitListing}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Buyer Card Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#9A3412]">
            {t.livePreviewLabel}
          </div>
          <div className="bg-white border border-[#E5E0D6] rounded-2xl overflow-hidden shadow-[0_12px_32px_-16px_rgba(10,40,32,0.14)]">
            <div className="relative aspect-[4/3] w-full bg-[#EFECE4]">
              <ResilientImage
                src={previewListing.imageUrl}
                alt={previewListing.title}
                category={previewListing.category}
                className="w-full h-full object-cover"
              />
              {uploadedPhotos.length > 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 py-2.5 flex items-center justify-between text-xs text-white">
                  <span className="truncate text-amber-200">{uploadedPhotos[0].angleLabel}</span>
                  <span className="font-mono tabular-nums text-emerald-200 shrink-0">
                    {uploadedPhotos.length} / 6 {t.photosCountSuffix}
                  </span>
                </div>
              )}
            </div>
            {uploadedPhotos.length > 1 && (
              <div className="px-3 pt-3 grid grid-cols-6 gap-1.5">
                {uploadedPhotos.map((p) => (
                  <div
                    key={p.slotIndex}
                    className="aspect-[4/3] rounded overflow-hidden border border-[#D8D0C1] bg-[#E6DFD1]"
                  >
                    <ResilientImage
                      src={p.imageDataUrl}
                      alt={p.angleLabel}
                      category={previewListing.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="p-5 space-y-2.5">
              <div className="text-xs font-medium text-[#0F5E48]">
                {getCategoryLabel(previewListing.category, lang)} ·{' '}
                <span className="text-[#9A3412]">
                  {getTransactionLabel(previewListing.transactionType, lang)}
                </span>{' '}
                · <span className="text-[#4C5C57]">{previewListing.neighborhood}</span>
              </div>
              <h3 className="text-base font-bold text-[#102620] line-clamp-1">
                {previewListing.title}
              </h3>
              <p className="text-xs text-[#4C5C57] line-clamp-1 tabular-nums">
                {formatSpecsLine(previewListing, lang)}
              </p>
              {previewListing.descriptionVoiceUrl && (
                <div className="p-2.5 rounded-lg bg-[#E3F5EE] border border-[#A7D9C6] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0B3B2E]">
                    <Volume2 className="w-3.5 h-3.5 text-[#0F5E48] shrink-0" />
                    <span>{t.voicePlayHeading}</span>
                  </div>
                  <audio controls src={previewListing.descriptionVoiceUrl} className="w-full h-8" />
                </div>
              )}
              {previewListing.videoUrl && (
                <div className="p-2.5 rounded-lg bg-[#E5F0FC] border border-[#AECCEF] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#142F66]">
                    <Video className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                    <span>{t.videoPlayHeading}</span>
                  </div>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    src={previewListing.videoUrl}
                    className="w-full max-h-48 rounded-md bg-black"
                  />
                </div>
              )}
              <div className="pt-3 border-t border-[#EAE2D3] flex items-center justify-between gap-2">
                <span
                  className={`font-mono text-[15px] font-bold tabular-nums ${
                    previewListing.transactionType === 'rent' ? 'text-[#1E40AF]' : 'text-[#9A3412]'
                  }`}
                >
                  {formatPrice(
                    previewListing.price,
                    previewListing.currency,
                    previewListing.pricePeriod,
                    lang
                  )}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold ${
                    previewListing.transactionType === 'rent' ? 'bg-[#1E40AF]' : 'bg-[#0F4C3A]'
                  }`}
                >
                  {previewListing.transactionType === 'rent' ? t.reserveNow : t.orderNow}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
