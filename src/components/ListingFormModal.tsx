import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Lock, X } from 'lucide-react';
import { NEIGHBORHOOD_OPTIONS } from '../data/showcaseListings';
import { createListing, fetchListingPhotos, fetchListingVideo, updateListingDetails } from '../firebase';
import { translations } from '../i18n';
import { formatFirestoreUserError } from '../utils/format';
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
import {
  createEmptyPhotoSlots,
  MultiAnglePhotoUploader,
  PhotoSlotsState,
  slotsToPhotosArray,
} from './MultiAnglePhotoUploader';
import { ListingVideoRecorder } from './ListingVideoRecorder';
import { VoiceDescriptionRecorder } from './VoiceDescriptionRecorder';

interface ListingFormModalProps {
  isOpen: boolean;
  editingListing: Listing | null;
  savedPhone?: string;
  lang: Language;
  user: User | null;
  onClose: () => void;
  onRequireSignIn: () => void;
  onSuccess: () => void;
}

export function ListingFormModal({
  isOpen,
  editingListing,
  savedPhone = '',
  lang,
  user,
  onClose,
  onRequireSignIn,
  onSuccess,
}: ListingFormModalProps) {
  const t = translations[lang];

  const [category, setCategory] = useState<ListingCategory>('apartment');
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionVoiceUrl, setDescriptionVoiceUrl] = useState('');
  const [descriptionVoiceDurationSec, setDescriptionVoiceDurationSec] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoMimeType, setVideoMimeType] = useState('');
  const [videoDurationSec, setVideoDurationSec] = useState(0);
  const [videoModified, setVideoModified] = useState(false);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('ETB');
  const [pricePeriod, setPricePeriod] = useState<PricePeriod>('total');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [sellerPhone, setSellerPhone] = useState(savedPhone);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlotsState>(() => createEmptyPhotoSlots());

  const [roomClass, setRoomClass] = useState<RoomClass>('2_class');
  const [tenantPreference, setTenantPreference] = useState<TenantPreference>('any');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [areaSqm, setAreaSqm] = useState('120');
  const [titleDeed, setTitleDeed] = useState('Digital Carta');
  const [vehicleYear, setVehicleYear] = useState('2023');
  const [mileageKm, setMileageKm] = useState('25000');
  const [transmission, setTransmission] = useState('Automatic');
  const [fuelType, setFuelType] = useState('Hybrid');
  const [itemCondition, setItemCondition] = useState('Like New');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (savedPhone) setSellerPhone(savedPhone);
    if (editingListing) {
      setCategory(editingListing.category);
      setTransactionType(editingListing.transactionType);
      setTitle(editingListing.title);
      setDescription(editingListing.description);
      setDescriptionVoiceUrl(editingListing.descriptionVoiceUrl || '');
      setDescriptionVoiceDurationSec(editingListing.descriptionVoiceDurationSec || 0);
      setPrice(String(editingListing.price));
      setCurrency(editingListing.currency);
      setPricePeriod(editingListing.pricePeriod);
      setNeighborhood(editingListing.neighborhood);
      setCity(editingListing.city);

      const fallbackSlots = createEmptyPhotoSlots();
      fallbackSlots[0] = {
        slotIndex: 0,
        angleLabel: 'Cover Photo',
        imageDataUrl: editingListing.imageUrl,
      };
      setPhotoSlots(fallbackSlots);

      let cancelled = false;
      let loadedBlobUrl: string | null = null;
      fetchListingPhotos(editingListing.id)
        .then((existingPhotos) => {
          if (cancelled || existingPhotos.length === 0) return;
          const loaded = createEmptyPhotoSlots();
          existingPhotos.slice(0, 6).forEach((p, idx) => {
            loaded[idx] = { ...p, slotIndex: idx };
          });
          setPhotoSlots(loaded);
        })
        .catch(() => {
          // Keep cover fallback if subcollection empty
        });

      setVideoUrl('');
      setVideoMimeType(editingListing.videoMimeType || '');
      setVideoDurationSec(editingListing.videoDurationSec || 0);
      setVideoModified(false);
      if ((editingListing.videoChunkCount || 0) > 0) {
        fetchListingVideo(editingListing.id, editingListing.videoMimeType || 'video/webm')
          .then((blobUrl) => {
            if (cancelled) {
              if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
              return;
            }
            if (blobUrl) {
              loadedBlobUrl = blobUrl;
              setVideoUrl(blobUrl);
            }
          })
          .catch(() => {
            // Keep empty if unable to fetch existing video
          });
      }

      const s = editingListing.specs || {};
      const inferredRc: RoomClass =
        s.roomClass ||
        (s.bedrooms === 1 ? '1_class' : s.bedrooms === 2 ? '2_class' : '3_plus');
      setRoomClass(inferredRc);
      setTenantPreference(s.tenantPreference || 'any');
      setBedrooms(s.bedrooms !== undefined ? String(s.bedrooms) : '2');
      setBathrooms(s.bathrooms !== undefined ? String(s.bathrooms) : '2');
      setAreaSqm(s.areaSqm !== undefined ? String(s.areaSqm) : '120');
      setTitleDeed(s.titleDeed || '');
      setVehicleYear(s.vehicleYear !== undefined ? String(s.vehicleYear) : '2023');
      setMileageKm(s.mileageKm !== undefined ? String(s.mileageKm) : '25000');
      setTransmission(s.transmission || 'Automatic');
      setFuelType(s.fuelType || 'Petrol');
      setItemCondition(s.itemCondition || 'Like New');

      return () => {
        cancelled = true;
        if (loadedBlobUrl && loadedBlobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(loadedBlobUrl);
        }
      };
    } else {
      setCategory('apartment');
      setTransactionType('sale');
      setRoomClass('2_class');
      setTenantPreference('any');
      setBedrooms('2');
      setTitle('');
      setDescription('');
      setDescriptionVoiceUrl('');
      setDescriptionVoiceDurationSec(0);
      setVideoUrl('');
      setVideoMimeType('');
      setVideoDurationSec(0);
      setVideoModified(false);
      setPrice('');
      setCurrency('ETB');
      setPricePeriod('total');
      setNeighborhood('');
      setCity('Addis Ababa');
      setPhotoSlots(createEmptyPhotoSlots());
      setErrorMsg('');
    }
  }, [isOpen, editingListing, savedPhone]);

  if (!isOpen) return null;

  const handleCategoryChange = (nextCat: ListingCategory) => {
    setCategory(nextCat);
    if (!editingListing) {
      if (nextCat === 'goods' || nextCat === 'land') {
        setTransactionType('sale');
        setPricePeriod('total');
      }
    }
  };

  const handleTransactionChange = (nextTx: TransactionType) => {
    setTransactionType(nextTx);
    if (nextTx === 'rent' && pricePeriod === 'total') {
      setPricePeriod('monthly');
    } else if (nextTx === 'sale') {
      setPricePeriod('total');
    }
  };

  const uploadedPhotos = slotsToPhotosArray(photoSlots);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn();
      return;
    }

    const numericPrice = Number(price);
    if (title.trim().length < 3) {
      setErrorMsg(lang === 'am' ? 'ርዕስ ቢያንስ 3 ፊደላት መሆን አለበት።' : 'Headline must be at least 3 characters.');
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
    if (!editingListing && sellerPhone.trim().length < 6) {
      setErrorMsg(t.phoneValidationError);
      return;
    }
    if (uploadedPhotos.length === 0) {
      setErrorMsg(t.photoRequiredError);
      return;
    }

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

    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
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
        imageUrl: uploadedPhotos[0].imageDataUrl,
        photos: uploadedPhotos,
        videoDataUrl: videoModified ? videoUrl : undefined,
        videoMimeType: videoModified ? videoMimeType : undefined,
        videoDurationSec: videoModified ? videoDurationSec : undefined,
        videoModified,
        specs,
        sellerPhone: sellerPhone.trim(),
      };
      if (editingListing) {
        await updateListingDetails(editingListing.id, payload, user);
      } else {
        await createListing(user, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(formatFirestoreUserError(err, lang));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#061712]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-form-title"
    >
      <div className="bg-white border border-[#E5E0D6] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-[0_28px_70px_-18px_rgba(7,26,21,0.45)]">
        <div className="sticky top-0 z-10 bg-[#09261E] border-b border-[#18483B] px-6 py-4 flex items-center justify-between text-[#FCF9F2]">
          <h2 id="listing-form-title" className="text-lg font-bold tracking-tight text-amber-200">
            {editingListing ? t.editListingTitle : t.createListingTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[40px] min-h-[40px] rounded-xl border border-white/15 bg-white/10 flex items-center justify-center text-emerald-100 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-sm text-zinc-600">{t.publishStarterPrompt}</p>
            <button
              type="button"
              onClick={onRequireSignIn}
              className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium transition-colors"
            >
              {t.signInGoogle}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {!editingListing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldCategory}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as ListingCategory)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="apartment">{t.catApartment}</option>
                    <option value="condominium">{t.catCondominium}</option>
                    <option value="house">{t.catHouse}</option>
                    <option value="land">{t.catLand}</option>
                    <option value="vehicle">{t.catVehicle}</option>
                    <option value="goods">{t.catGoods}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    {t.fieldTransaction}
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-lg h-10">
                    <button
                      type="button"
                      onClick={() => handleTransactionChange('sale')}
                      className={`text-xs font-medium rounded-md transition-colors ${
                        transactionType === 'sale'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {t.txSale}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTransactionChange('rent')}
                      className={`text-xs font-medium rounded-md transition-colors ${
                        transactionType === 'rent'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {t.txRent}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t.fieldTitle}</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'vehicle'
                    ? '2023 Toyota Corolla Cross Hybrid'
                    : category === 'land'
                    ? '450 m² Residential Plot in CMC'
                    : category === 'condominium'
                    ? '2-Bedroom Condominium in Ayat / Jemo'
                    : '3-Bedroom Modern Apartment in Bole'
                }
                className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t.fieldPrice}</label>
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
                  list="neighborhood-suggestions"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder={t.locationPlaceholder}
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                <datalist id="neighborhood-suggestions">
                  {NEIGHBORHOOD_OPTIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t.fieldCity}</label>
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
                required={!editingListing}
                minLength={editingListing ? 0 : 6}
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
                <div className="p-4 rounded-xl bg-[#E8F3EE] border border-[#B7DACA] space-y-3">
                  <div className="text-xs font-bold text-[#0B3B2E]">
                    {t.rentalOptionsHeading}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.roomClassLabel}
                      </label>
                      <select
                        value={roomClass}
                        onChange={(e) => {
                          const next = e.target.value as RoomClass;
                          setRoomClass(next);
                          if (next === '1_class') setBedrooms('1');
                          else if (next === '2_class') setBedrooms('2');
                          else setBedrooms('3');
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                      >
                        <option value="1_class">{t.roomClass1}</option>
                        <option value="2_class">{t.roomClass2}</option>
                        <option value="3_plus">{t.roomClass3Plus}</option>
                      </select>
                    </div>
                    {transactionType === 'rent' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          {t.tenantPrefLabel}
                        </label>
                        <select
                          value={tenantPreference}
                          onChange={(e) => setTenantPreference(e.target.value as TenantPreference)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                        >
                          <option value="late">{t.tenantPrefLate}</option>
                          <option value="bale_tedar">{t.tenantPrefBaleTedar}</option>
                          <option value="any">{t.tenantPrefAny}</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t.bedrooms}</label>
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
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t.bathrooms}</label>
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
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t.areaSqm} (m²)</label>
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
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t.titleDeed}</label>
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
                  <label className="block text-xs font-medium text-zinc-700 mb-1">{t.areaSqm} (m²)</label>
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
                  <label className="block text-xs font-medium text-zinc-700 mb-1">{t.titleDeed}</label>
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
                  <label className="block text-xs font-medium text-zinc-700 mb-1">{t.fuelType}</label>
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
                <label className="block text-xs font-medium text-zinc-700 mb-1">{t.condition}</label>
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
                videoUrl={videoUrl}
                durationSec={videoDurationSec}
                onChange={(nextUrl, nextMime, nextSecs) => {
                  setVideoUrl(nextUrl);
                  setVideoMimeType(nextMime);
                  setVideoDurationSec(nextSecs);
                  setVideoModified(true);
                }}
              />
            </div>

            {errorMsg && <p className="text-xs text-red-700">{errorMsg}</p>}

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {editingListing ? t.saveChanges : t.submitListing}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
