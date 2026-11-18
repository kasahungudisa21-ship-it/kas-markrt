import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Trash2,
  UserCheck,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { fetchListingPhotos, fetchListingVideo, placeOrder, sendListingInquiry } from '../firebase';
import {
  getCategoryLabel,
  getGoodsConditionLabel,
  getGoodsTypeLabel,
  getRoomClassLabel,
  getStatusLabel,
  getTenantPreferenceLabel,
  getTransactionLabel,
  getVehicleTypeLabel,
  translations,
} from '../i18n';
import { Language, Listing, ListingPhoto, PaymentMethod } from '../types';
import { formatFirestoreUserError, formatPrice } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface ListingDetailModalProps {
  listing: Listing | null;
  initialTab?: 'order' | 'message';
  lang: Language;
  user: User | null;
  isAdmin?: boolean;
  savedPhone?: string;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (listing: Listing) => void;
  onDeleteListing?: (listing: Listing) => Promise<void> | void;
  onRequireSignIn: () => void;
  onViewOrders: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export function ListingDetailModal({
  listing,
  initialTab = 'order',
  lang,
  user,
  isAdmin = false,
  savedPhone = '',
  isSaved,
  onClose,
  onToggleSave,
  onDeleteListing,
  onRequireSignIn,
  onViewOrders,
  onOpenLegal,
}: ListingDetailModalProps) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'order' | 'message'>(initialTab);

  // Order form state
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState(user?.displayName || '');
  const [buyerPhone, setBuyerPhone] = useState(savedPhone);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const [agreedOrderLegal, setAgreedOrderLegal] = useState(false);

  // Message form state
  const [senderName, setSenderName] = useState(user?.displayName || '');
  const [senderContact, setSenderContact] = useState(savedPhone);
  const [message, setMessage] = useState('');
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [agreedMsgLegal, setAgreedMsgLegal] = useState(false);

  // Multi-angle gallery & video state
  const [galleryPhotos, setGalleryPhotos] = useState<ListingPhoto[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setQuantity(1);
    setConfirmedOrderNumber(null);
    setOrderError('');
    setAgreedOrderLegal(false);
    setMsgSentSuccess(false);
    setMsgError('');
    setAgreedMsgLegal(false);
    setActivePhotoIdx(0);
    setVideoSrc(null);
    setVideoLoading(false);

    if (!listing) {
      setGalleryPhotos([]);
      return;
    }

    const fallback: ListingPhoto[] = [
      {
        slotIndex: 0,
        angleLabel: getCategoryLabel(listing.category, lang),
        imageDataUrl: listing.imageUrl,
      },
    ];

    if (listing.photos && listing.photos.length > 0) {
      setGalleryPhotos(listing.photos);
    } else {
      setGalleryPhotos(fallback);
    }

    let cancelled = false;
    let activeBlobUrl: string | null = null;

    if (!listing.photos || listing.photos.length === 0) {
      fetchListingPhotos(listing.id)
        .then((loaded) => {
          if (!cancelled && loaded.length > 0) {
            setGalleryPhotos(loaded);
          }
        })
        .catch(() => {
          // Keep cover photo fallback
        });
    }

    if (listing.videoUrl) {
      setVideoSrc(listing.videoUrl);
    } else if ((listing.videoChunkCount || 0) > 0) {
      setVideoLoading(true);
      fetchListingVideo(listing.id, listing.videoMimeType || 'video/webm')
        .then((blobUrl) => {
          if (cancelled) {
            if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
            return;
          }
          if (blobUrl) {
            activeBlobUrl = blobUrl;
            setVideoSrc(blobUrl);
          }
        })
        .catch(() => {
          // Ignore unavailable video
        })
        .finally(() => {
          if (!cancelled) setVideoLoading(false);
        });
    }

    return () => {
      cancelled = true;
      if (activeBlobUrl && activeBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [listing, initialTab, lang]);

  useEffect(() => {
    if (savedPhone) {
      if (!buyerPhone) setBuyerPhone(savedPhone);
      if (!senderContact) setSenderContact(savedPhone);
    }
  }, [savedPhone, buyerPhone, senderContact]);

  if (!listing) return null;

  const isOwner = Boolean(user && listing.ownerId === user.uid);
  const formattedPrice = formatPrice(listing.price, listing.currency, listing.pricePeriod, lang);
  const totalAmount = listing.price * quantity;
  const formattedTotal = formatPrice(totalAmount, listing.currency, listing.pricePeriod, lang);
  const categoryLabel = getCategoryLabel(listing.category, lang);
  const txLabel = getTransactionLabel(listing.transactionType, lang);
  const statusLabel = getStatusLabel(listing.status, lang);

  const specRows: { label: string; value: string }[] = [];
  const s = listing.specs || {};
  const isHousingListing =
    listing.category === 'apartment' ||
    listing.category === 'condominium' ||
    listing.category === 'house';
  if (isHousingListing && s.roomClass) {
    specRows.push({ label: t.roomClassLabel, value: getRoomClassLabel(s.roomClass, lang) });
  }
  if (isHousingListing && s.tenantPreference) {
    specRows.push({
      label: t.tenantPrefLabel,
      value: getTenantPreferenceLabel(s.tenantPreference, lang),
    });
  }
  if (typeof s.bedrooms === 'number') specRows.push({ label: t.bedrooms, value: String(s.bedrooms) });
  if (typeof s.bathrooms === 'number') specRows.push({ label: t.bathrooms, value: String(s.bathrooms) });
  if (typeof s.areaSqm === 'number' && s.areaSqm > 0) {
    specRows.push({
      label: t.areaSqm,
      value: `${new Intl.NumberFormat('en-US').format(s.areaSqm)} m²`,
    });
  }
  if (s.titleDeed) specRows.push({ label: t.titleDeed, value: s.titleDeed });
  if (s.vehicleType) {
    specRows.push({
      label: t.vehicleTypeLabel,
      value: getVehicleTypeLabel(s.vehicleType, lang),
    });
  }
  if (s.vehicleModel) {
    specRows.push({ label: t.vehicleModelLabel, value: s.vehicleModel });
  }
  if (typeof s.vehicleYear === 'number') {
    specRows.push({ label: t.vehicleYear, value: String(s.vehicleYear) });
  }
  if (typeof s.mileageKm === 'number') {
    specRows.push({
      label: t.mileageKm,
      value: `${new Intl.NumberFormat('en-US').format(s.mileageKm)} km`,
    });
  }
  if (s.transmission) specRows.push({ label: t.transmission, value: s.transmission });
  if (s.fuelType) specRows.push({ label: t.fuelType, value: s.fuelType });
  if (s.goodsType) {
    specRows.push({
      label: t.goodsTypeLabel,
      value: getGoodsTypeLabel(s.goodsType, lang),
    });
  }
  if (s.goodsModel) {
    specRows.push({ label: t.goodsModelLabel, value: s.goodsModel });
  }
  if (s.itemCondition) {
    specRows.push({ label: t.condition, value: getGoodsConditionLabel(s.itemCondition, lang) });
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn();
      return;
    }
    if (isOwner || listing.status !== 'available') return;

    const cleanName = (buyerName || user.displayName || user.email?.split('@')[0] || '').trim();
    const cleanPhone = buyerPhone.trim();
    const cleanAddress = deliveryAddress.trim();

    if (cleanName.length < 1 || cleanPhone.length < 6 || cleanAddress.length < 2) {
      setOrderError(
        cleanPhone.length < 6
          ? t.phoneValidationError
          : lang === 'am'
          ? 'እባክዎ ስም፣ ስልክ ቁጥር እና የማድረሻ አድራሻ በትክክል ያስገቡ።'
          : 'Please enter your full name, phone number, and delivery/meeting address.'
      );
      return;
    }
    if (!agreedOrderLegal) {
      setOrderError(t.legalMustAcceptError);
      return;
    }

    setOrderError('');
    setOrderSubmitting(true);
    try {
      const result = await placeOrder(user, {
        listing,
        buyerName: cleanName,
        buyerPhone: cleanPhone,
        deliveryAddress: cleanAddress,
        paymentMethod,
        quantity,
        notes: orderNotes,
      });
      setConfirmedOrderNumber(result.orderNumber);
      setOrderNotes('');
      setAgreedOrderLegal(false);
    } catch (err) {
      setOrderError(formatFirestoreUserError(err, lang));
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireSignIn();
      return;
    }
    if (isOwner) return;

    const cleanName = (senderName || user.displayName || user.email?.split('@')[0] || '').trim();
    const cleanContact = senderContact.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 1 || cleanContact.length < 6 || cleanMessage.length < 3) {
      setMsgError(
        cleanContact.length < 6
          ? t.phoneValidationError
          : lang === 'am'
          ? 'እባክዎ ስም፣ ስልክ ቁጥር እና መልዕክት በትክክል ያስገቡ።'
          : 'Please provide your name, phone number, and a short message.'
      );
      return;
    }
    if (!agreedMsgLegal) {
      setMsgError(t.legalMustAcceptError);
      return;
    }

    setMsgError('');
    setMsgSubmitting(true);
    try {
      await sendListingInquiry(user, listing, cleanName, cleanContact, cleanMessage);
      setMsgSentSuccess(true);
      setMessage('');
      setAgreedMsgLegal(false);
    } catch (err) {
      setMsgError(formatFirestoreUserError(err, lang));
    } finally {
      setMsgSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#061712]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
    >
      <div className="bg-white border border-[#E5E0D6] rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-[0_28px_70px_-18px_rgba(7,26,21,0.45)]">
        <div className="sticky top-0 z-10 bg-[#09261E] border-b border-[#18483B] px-6 py-4 flex items-center justify-between gap-4 text-[#FCF9F2]">
          <div className="text-xs font-semibold tracking-wide text-amber-200 truncate">
            {categoryLabel} · {txLabel} · {listing.neighborhood}, {listing.city}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[40px] min-h-[40px] rounded-xl border border-white/15 bg-white/10 flex items-center justify-center text-emerald-100 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {(() => {
              const safeIdx = Math.min(activePhotoIdx, Math.max(0, galleryPhotos.length - 1));
              const activePhoto = galleryPhotos[safeIdx] || {
                slotIndex: 0,
                angleLabel: listing.title,
                imageDataUrl: listing.imageUrl,
              };
              const hasMultiple = galleryPhotos.length > 1;
              return (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#F4F1EA] border border-[#E5E0D6]">
                    <ResilientImage
                      src={activePhoto.imageDataUrl}
                      alt={`${listing.title} — ${activePhoto.angleLabel}`}
                      category={listing.category}
                      className="w-full h-full object-cover"
                    />

                    {hasMultiple && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActivePhotoIdx((prev) =>
                              prev === 0 ? galleryPhotos.length - 1 : prev - 1
                            )
                          }
                          aria-label="Previous photo"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActivePhotoIdx((prev) => (prev + 1) % galleryPhotos.length)
                          }
                          aria-label="Next photo"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 py-2.5 flex items-center justify-between text-xs text-white">
                      <span className="truncate font-medium">{activePhoto.angleLabel}</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {safeIdx + 1} / {galleryPhotos.length}
                      </span>
                    </div>
                  </div>

                  {hasMultiple && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {galleryPhotos.map((photo, idx) => (
                        <button
                          key={`${photo.slotIndex}-${idx}`}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`text-left rounded-lg overflow-hidden border transition-all ${
                            safeIdx === idx
                              ? 'border-emerald-800 ring-2 ring-emerald-800/40'
                              : 'border-zinc-200 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="aspect-[4/3] w-full bg-zinc-100">
                            <ResilientImage
                              src={photo.imageDataUrl}
                              alt={photo.angleLabel}
                              category={listing.category}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-1.5 py-1 text-[10px] font-medium text-zinc-700 truncate bg-white">
                            {photo.angleLabel}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {((listing.videoChunkCount || 0) > 0 || videoSrc || videoLoading) && (
              <div className="p-4 rounded-xl bg-[#E5F0FC] border border-[#AECCEF] space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#142F66] flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                    <span>{t.videoPlayHeading}</span>
                  </span>
                  {typeof listing.videoDurationSec === 'number' && listing.videoDurationSec > 0 && (
                    <span className="font-mono font-semibold text-[#1E40AF] tabular-nums">
                      {Math.floor(listing.videoDurationSec / 60)}:
                      {(listing.videoDurationSec % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                {videoLoading ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#1E3A8A]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                    <span>{t.videoLoadingLabel}</span>
                  </div>
                ) : videoSrc ? (
                  <div className="rounded-lg overflow-hidden bg-black border border-[#9BBDE6]">
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      src={videoSrc}
                      className="w-full max-h-[380px] object-contain mx-auto"
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div className="space-y-4">
              {listing.descriptionVoiceUrl && (
                <div className="p-4 rounded-xl bg-[#E3F5EE] border border-[#A7D9C6] space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#0B3B2E] flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#0F5E48] shrink-0" />
                      <span>{t.voicePlayHeading}</span>
                    </span>
                    {typeof listing.descriptionVoiceDurationSec === 'number' &&
                      listing.descriptionVoiceDurationSec > 0 && (
                        <span className="font-mono font-semibold text-[#0F5E48] tabular-nums">
                          {Math.floor(listing.descriptionVoiceDurationSec / 60)}:
                          {(listing.descriptionVoiceDurationSec % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                  </div>
                  <audio controls src={listing.descriptionVoiceUrl} className="w-full h-10" />
                </div>
              )}

              {listing.description.trim() && (
                <p className="text-[15px] leading-relaxed text-[#253B34] whitespace-pre-line">
                  {listing.description}
                </p>
              )}
            </div>

            {specRows.length > 0 && (
              <div className="pt-4 border-t border-[#EAE6DC]">
                <h4 className="text-sm font-bold text-[#0B3B2E] mb-3">{t.specsHeading}</h4>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 bg-[#F7F5F0] p-4 rounded-2xl border border-[#E5E0D6]">
                  {specRows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-[#6B5B45] font-medium">{row.label}</dt>
                      <dd className="text-sm font-bold text-[#102620] tabular-nums mt-0.5">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 bg-[#FAF8F4] border border-[#E5E0D6] rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_6px_24px_-12px_rgba(12,46,38,0.08)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#0F5E48]">
                  <span>{statusLabel}</span>
                </div>
                <h2
                  id="listing-detail-title"
                  className="text-xl sm:text-2xl font-bold text-[#102620] leading-snug tracking-tight"
                >
                  {listing.title}
                </h2>
                <div
                  className={`font-mono text-2xl font-bold tabular-nums pt-1 ${
                    listing.transactionType === 'rent' ? 'text-[#1E40AF]' : 'text-[#9A3412]'
                  }`}
                >
                  {formattedPrice}
                </div>
              </div>

              <div className="pt-4 border-t border-[#D8CEBC] grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[#6B5B45]">{t.locationLabel}</div>
                    <div className="font-semibold text-[#102620]">
                      {listing.neighborhood}, {listing.city}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-[#0F5E48] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[#6B5B45]">{t.sellerLabel}</div>
                    <div className="font-semibold text-[#102620] truncate">{listing.sellerName}</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleSave(listing)}
                className={`w-full min-h-[40px] px-4 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  isSaved
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                    : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? t.savedListing : t.saveListing}</span>
              </button>

              {(isOwner || isAdmin) && onDeleteListing && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await onDeleteListing(listing);
                      onClose();
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.deleteListing}</span>
                </button>
              )}

              <div className="pt-4 border-t border-[#E5E0D6] space-y-4">
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#EAE6DC] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('order')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'order'
                        ? 'bg-white text-[#0F241E] shadow-sm'
                        : 'text-[#4F615B] hover:text-[#0F241E]'
                    }`}
                  >
                    {t.placeOrderTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('message')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'message'
                        ? 'bg-white text-[#0F241E] shadow-sm'
                        : 'text-[#4F615B] hover:text-[#0F241E]'
                    }`}
                  >
                    {t.askSellerTab}
                  </button>
                </div>

                {isOwner ? (
                  <p className="text-xs leading-relaxed text-zinc-600">
                    {isAdmin ? t.ownListingNotice : t.ownListingNoticeUser}
                  </p>
                ) : activeTab === 'order' ? (
                  listing.status !== 'available' ? (
                    <p className="text-xs text-amber-800">{statusLabel}</p>
                  ) : !user ? (
                    <div className="space-y-3">
                      <p className="text-xs leading-relaxed text-zinc-600">{t.signInToOrder}</p>
                      <button
                        type="button"
                        onClick={onRequireSignIn}
                        className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium transition-colors"
                      >
                        {t.signInGoogle}
                      </button>
                    </div>
                  ) : confirmedOrderNumber ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <div className="flex items-start gap-2.5 text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">
                            {t.orderConfirmedTitle} ·{' '}
                            <span className="font-mono">{confirmedOrderNumber}</span>
                          </div>
                          <p className="text-xs text-emerald-800">
                            {isAdmin ? t.orderConfirmedBody : t.orderConfirmedBuyerBody}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewOrders();
                          }}
                          className="w-full py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium"
                        >
                          {t.viewMyOrders}
                        </button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleOrderSubmit} className="space-y-3">
                      {listing.category === 'goods' && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-700">
                            {t.quantityLabel}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 rounded-lg border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm font-medium tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                              aria-label="Increase quantity"
                              className="w-8 h-8 rounded-lg border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          {t.paymentMethodLabel}
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                        >
                          <option value="cash_on_delivery">{t.payCashOnDelivery}</option>
                          <option value="telebirr">{t.payTelebirr}</option>
                          <option value="bank_transfer">{t.payBankTransfer}</option>
                          <option value="inspection_escrow">{t.payInspectionEscrow}</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1">
                            {t.yourName}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={80}
                            value={buyerName || user.displayName || ''}
                            onChange={(e) => setBuyerName(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                          />
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
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-800 shrink-0" />
                        <span>{t.phonePrivacyNote}</span>
                      </p>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          {t.deliveryAddressLabel}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={200}
                          placeholder={t.deliveryAddressPlaceholder}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                          {t.orderNotesLabel}
                        </label>
                        <input
                          type="text"
                          maxLength={500}
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                        />
                      </div>

                      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700">{t.orderTotalLabel}</span>
                        <span className="font-mono font-bold text-emerald-900 tabular-nums">
                          {formattedTotal}
                        </span>
                      </div>

                      <label className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-700 leading-relaxed cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreedOrderLegal}
                          onChange={(e) => {
                            setAgreedOrderLegal(e.target.checked);
                            if (e.target.checked && orderError === t.legalMustAcceptError) {
                              setOrderError('');
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

                      {orderError && <p className="text-xs text-red-700">{orderError}</p>}

                      <button
                        type="submit"
                        disabled={orderSubmitting}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t.confirmOrderButton}</span>
                      </button>
                    </form>
                  )
                ) : !user ? (
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed text-zinc-600">{t.signInToConnect}</p>
                    <button
                      type="button"
                      onClick={onRequireSignIn}
                      className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium transition-colors"
                    >
                      {t.signInGoogle}
                    </button>
                  </div>
                ) : msgSentSuccess ? (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                    <span>{t.inquirySent}</span>
                  </div>
                ) : (
                  <form onSubmit={handleMessageSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.yourName}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={senderName || user.displayName || ''}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                      />
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
                        value={senderContact}
                        onChange={(e) => setSenderContact(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-mono tabular-nums text-zinc-900"
                      />
                      <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-800 shrink-0" />
                        <span>{t.phonePrivacyNote}</span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        {t.yourMessage}
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={1000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900"
                      />
                    </div>

                    <label className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-700 leading-relaxed cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedMsgLegal}
                        onChange={(e) => {
                          setAgreedMsgLegal(e.target.checked);
                          if (e.target.checked && msgError === t.legalMustAcceptError) {
                            setMsgError('');
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

                    {msgError && <p className="text-xs text-red-700">{msgError}</p>}

                    <button
                      type="submit"
                      disabled={msgSubmitting}
                      className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>{t.sendInquiry}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
