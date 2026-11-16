import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Building2,
  Car,
  CheckCircle2,
  Home,
  Lock,
  LogOut,
  MapPin,
  Package,
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
import { formatPrice, formatSpecsLine } from '../utils/format';
import {
  createEmptyPhotoSlots,
  MultiAnglePhotoUploader,
  PhotoSlotsState,
  slotsToPhotosArray,
} from './MultiAnglePhotoUploader';
import { ResilientImage } from './ResilientImage';
import { VoiceDescriptionRecorder } from './VoiceDescriptionRecorder';

interface SellViewProps {
  lang: Language;
  user: User | null;
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
    if (category === 'apartment' || category === 'house') {
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
        specs: buildSpecs(),
        sellerPhone: sellerPhone.trim(),
      });
      setTitle('');
      setDescription('');
      setDescriptionVoiceUrl('');
      setDescriptionVoiceDurationSec(0);
      setPhotoSlots(createEmptyPhotoSlots());
      setPublishedSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to publish listing.');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t.sellerPageTitle}</h1>
          <p className="text-sm text-zinc-600 max-w-2xl">{t.sellerPageSubtitle}</p>
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onGoToOrders}
              className="px-4 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 whitespace-nowrap"
            >
              {t.tabMyListings} ({myListings.length}) · {t.tabOrders} ({incomingOrdersCount})
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-medium text-zinc-700 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 1: Standalone Top Selector for For Sale vs For Rent */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">{t.chooseSaleOrRentLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTransactionChange('sale')}
            className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
              transactionType === 'sale'
                ? 'border-emerald-800 bg-emerald-50/70 ring-1 ring-emerald-800'
                : 'border-zinc-200 bg-white hover:bg-zinc-50'
            }`}
          >
            <div className="text-base font-bold text-zinc-900">{t.txSale}</div>
            <p className="text-xs text-zinc-600 mt-1">{t.sellOptionDesc}</p>
          </button>

          <button
            type="button"
            onClick={() => handleTransactionChange('rent')}
            className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
              transactionType === 'rent'
                ? 'border-emerald-800 bg-emerald-50/70 ring-1 ring-emerald-800'
                : 'border-zinc-200 bg-white hover:bg-zinc-50'
            }`}
          >
            <div className="text-base font-bold text-zinc-900">{t.txRent}</div>
            <p className="text-xs text-zinc-600 mt-1">{t.rentOptionDesc}</p>
          </button>
        </div>
      </div>

      {/* Step 2: Directly Underneath — Enter What You Are Selling or Renting Out */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 sm:p-8">
          {!user ? (
            <div className="py-10 text-center space-y-4">
              <p className="text-sm text-zinc-600 max-w-md mx-auto">{t.publishStarterPrompt}</p>
              <button
                type="button"
                onClick={onSignIn}
                className="px-6 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium transition-colors"
              >
                {t.signInGoogle}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {publishedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{t.sellerPostSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onBackToBrowse}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-medium whitespace-nowrap shrink-0"
                  >
                    {t.navExplore}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-900">
                  {transactionType === 'sale' ? t.whatSellingLabel : t.whatRentingLabel}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {categoryTiles.map(({ key, label, Icon }) => {
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategoryChange(key)}
                        className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                          active
                            ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${active ? 'text-emerald-800' : 'text-zinc-500'}`}
                        />
                        <span className="text-xs font-medium truncate">{label}</span>
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

              {(category === 'apartment' || category === 'house') && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
                    <div className="text-xs font-semibold text-zinc-900">
                      {t.rentalOptionsHeading}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-zinc-700">
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
                            className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                              roomClass === opt.key
                                ? 'border-emerald-800 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-800'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {transactionType === 'rent' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-700">
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
                              className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                                tenantPreference === opt.key
                                  ? 'border-emerald-800 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-800'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
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

              <div className="pt-2 border-t border-zinc-200">
                <MultiAnglePhotoUploader
                  lang={lang}
                  category={category}
                  slots={photoSlots}
                  onChangeSlots={setPhotoSlots}
                />
              </div>

              {errorMsg && <p className="text-xs text-red-700">{errorMsg}</p>}

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onBackToBrowse}
                  className="px-4 py-2.5 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {t.submitListing}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Buyer Card Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="text-xs font-medium text-zinc-500">{t.livePreviewLabel}</div>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="relative aspect-[4/3] w-full bg-zinc-100">
              <ResilientImage
                src={previewListing.imageUrl}
                alt={previewListing.title}
                category={previewListing.category}
                className="w-full h-full object-cover"
              />
              {uploadedPhotos.length > 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 py-2.5 flex items-center justify-between text-xs text-white">
                  <span className="truncate">{uploadedPhotos[0].angleLabel}</span>
                  <span className="font-mono tabular-nums shrink-0">
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
                    className="aspect-[4/3] rounded overflow-hidden border border-zinc-200 bg-zinc-100"
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
              <div className="text-xs text-zinc-500">
                {getCategoryLabel(previewListing.category, lang)} ·{' '}
                {getTransactionLabel(previewListing.transactionType, lang)} ·{' '}
                {previewListing.neighborhood}
              </div>
              <h3 className="text-base font-semibold text-zinc-900 line-clamp-1">
                {previewListing.title}
              </h3>
              <p className="text-xs text-zinc-500 line-clamp-1 tabular-nums">
                {formatSpecsLine(previewListing, lang)}
              </p>
              {previewListing.descriptionVoiceUrl && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    <span>{t.voicePlayHeading}</span>
                  </div>
                  <audio controls src={previewListing.descriptionVoiceUrl} className="w-full h-8" />
                </div>
              )}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <span className="font-mono text-[15px] font-semibold text-emerald-900 tabular-nums">
                  {formatPrice(
                    previewListing.price,
                    previewListing.currency,
                    previewListing.pricePeriod,
                    lang
                  )}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-medium">
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
