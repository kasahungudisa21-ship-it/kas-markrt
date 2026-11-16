import { Bookmark, Mic, Video } from 'lucide-react';
import { getCategoryLabel, getStatusLabel, getTransactionLabel, translations } from '../i18n';
import { Language, Listing } from '../types';
import { formatPrice, formatSpecsLine } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface ListingCardProps {
  listing: Listing;
  lang: Language;
  isSaved: boolean;
  onSelect: (listing: Listing, initialTab?: 'order' | 'message') => void;
  onToggleSave: (listing: Listing) => void;
}

export function ListingCard({
  listing,
  lang,
  isSaved,
  onSelect,
  onToggleSave,
}: ListingCardProps) {
  const t = translations[lang];
  const categoryLabel = getCategoryLabel(listing.category, lang);
  const txLabel = getTransactionLabel(listing.transactionType, lang);
  const statusLabel = getStatusLabel(listing.status, lang);
  const specsLine = formatSpecsLine(listing, lang);
  const formattedPrice = formatPrice(listing.price, listing.currency, listing.pricePeriod, lang);
  const hasVideo = (listing.videoChunkCount || 0) > 0;

  const categoryColorClass =
    listing.category === 'vehicle'
      ? 'text-[#1D4ED8]'
      : listing.category === 'land'
      ? 'text-[#B45309]'
      : listing.category === 'goods'
      ? 'text-[#9D174D]'
      : listing.category === 'condominium'
      ? 'text-[#0F766E]'
      : 'text-[#0F5E48]';

  const txColorClass =
    listing.transactionType === 'rent' ? 'text-[#0369A1]' : 'text-[#9A3412]';

  const primaryBtnClass =
    listing.transactionType === 'rent'
      ? 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm'
      : 'bg-[#0D4435] hover:bg-[#093227] text-white shadow-sm';

  return (
    <article className="group bg-white border border-[#E5E0D6] rounded-2xl overflow-hidden flex flex-col transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(10,40,32,0.16)] hover:border-[#CFC7B7]">
      <div
        onClick={() => onSelect(listing, 'order')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(listing, 'order');
          }
        }}
        className="relative aspect-[4/3] w-full bg-[#ECE8DF] overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
      >
        <ResilientImage
          src={listing.imageUrl}
          alt={listing.title}
          category={listing.category}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        {((listing.photoCount || 1) > 1 || listing.descriptionVoiceUrl || hasVideo) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {hasVideo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-200">
                  <Video className="w-3 h-3" />
                  <span>{t.videoAttachedBadge}</span>
                </span>
              )}
              {listing.descriptionVoiceUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-200">
                  <Mic className="w-3 h-3" />
                  <span>{t.voiceAttachedBadge}</span>
                </span>
              )}
            </div>
            {(listing.photoCount || 1) > 1 && (
              <span className="text-[11px] font-mono font-medium text-emerald-200 tabular-nums">
                {listing.photoCount} {t.photosCountSuffix}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate">
              <span className={`font-semibold ${categoryColorClass}`}>{categoryLabel}</span>
              <span className="text-[#9E9587]"> · </span>
              <span className={`font-semibold ${txColorClass}`}>{txLabel}</span>
              <span className="text-[#9E9587]"> · </span>
              <span className="text-[#56625E]">{listing.neighborhood}</span>
            </span>
            {listing.status !== 'available' && (
              <span
                className={`shrink-0 font-semibold ${
                  listing.status === 'closed' ? 'text-[#6B726E]' : 'text-[#B45309]'
                }`}
              >
                {statusLabel}
              </span>
            )}
          </div>

          <h3 className="text-[17px] font-bold text-[#0F241E] leading-snug line-clamp-1 tracking-[-0.01em]">
            <button
              type="button"
              onClick={() => onSelect(listing, 'order')}
              className="text-left hover:text-[#0F5E48] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {listing.title}
            </button>
          </h3>

          <p className="text-xs text-[#54645F] line-clamp-1 tabular-nums">{specsLine}</p>
        </div>

        <div className="pt-3.5 border-t border-[#EFECE4] flex items-center justify-between gap-2">
          <span
            className={`font-mono text-[15px] font-bold tabular-nums whitespace-nowrap truncate ${
              listing.transactionType === 'rent' ? 'text-[#1D4ED8]' : 'text-[#9A3412]'
            }`}
          >
            {formattedPrice}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(listing)}
              aria-label={isSaved ? t.savedListing : t.saveListing}
              className={`min-w-[38px] min-h-[38px] px-2 rounded-xl border text-xs font-medium inline-flex items-center justify-center transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 ${
                isSaved
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-[#E2DDD2] bg-[#FAF8F4] text-[#2F423B] hover:bg-[#EFECE4]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              onClick={() => onSelect(listing, 'message')}
              className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0F4235] bg-[#EAF4EF] hover:bg-[#D9ECE3] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
            >
              {t.viewDetails}
            </button>

            <button
              type="button"
              disabled={listing.status !== 'available'}
              onClick={() => onSelect(listing, 'order')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold disabled:bg-[#DDD8CE] disabled:text-[#736E64] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 ${primaryBtnClass}`}
            >
              {listing.transactionType === 'rent' ? t.reserveNow : t.orderNow}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
