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
      : 'text-[#0F5E48]';

  const txColorClass =
    listing.transactionType === 'rent' ? 'text-[#0369A1]' : 'text-[#9A3412]';

  const primaryBtnClass =
    listing.transactionType === 'rent'
      ? 'bg-[#1E40AF] hover:bg-[#1E3A8A] text-white'
      : 'bg-[#0F4C3A] hover:bg-[#0B3B2D] text-[#FFFDF8]';

  return (
    <article className="group bg-[#FFFDF8] border border-[#D8D0C1] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#B6AC99]">
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
        className="relative aspect-[4/3] w-full bg-[#E6DFD1] overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
      >
        <ResilientImage
          src={listing.imageUrl}
          alt={listing.title}
          category={listing.category}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {((listing.photoCount || 1) > 1 || listing.descriptionVoiceUrl || hasVideo) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
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

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate">
              <span className={`font-semibold ${categoryColorClass}`}>{categoryLabel}</span>
              <span className="text-[#8B8171]"> · </span>
              <span className={`font-medium ${txColorClass}`}>{txLabel}</span>
              <span className="text-[#8B8171]"> · </span>
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

          <h3 className="text-base font-bold text-[#102620] leading-snug line-clamp-1">
            <button
              type="button"
              onClick={() => onSelect(listing, 'order')}
              className="text-left hover:text-[#0F5E48] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {listing.title}
            </button>
          </h3>

          <p className="text-xs text-[#4C5C57] line-clamp-1 tabular-nums">{specsLine}</p>
        </div>

        <div className="pt-3 border-t border-[#EAE2D3] flex items-center justify-between gap-2">
          <span
            className={`font-mono text-[15px] font-bold tabular-nums whitespace-nowrap truncate ${
              listing.transactionType === 'rent' ? 'text-[#1E40AF]' : 'text-[#9A3412]'
            }`}
          >
            {formattedPrice}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(listing)}
              aria-label={isSaved ? t.savedListing : t.saveListing}
              className={`min-w-[36px] min-h-[36px] px-2 rounded-lg border text-xs font-medium inline-flex items-center justify-center transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 ${
                isSaved
                  ? 'border-amber-600 bg-amber-100 text-amber-900'
                  : 'border-[#CFC6B4] bg-[#F5F1E8] text-[#2F423B] hover:bg-[#EAE3D5]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              onClick={() => onSelect(listing, 'message')}
              className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0F4235] bg-[#E3EFE9] hover:bg-[#D2E6DC] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
            >
              {t.viewDetails}
            </button>

            <button
              type="button"
              disabled={listing.status !== 'available'}
              onClick={() => onSelect(listing, 'order')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold disabled:bg-[#D6CFC2] disabled:text-[#6F6A60] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 ${primaryBtnClass}`}
            >
              {listing.transactionType === 'rent' ? t.reserveNow : t.orderNow}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
