import { Bookmark, Mic } from 'lucide-react';
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

  return (
    <article className="group bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
        className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
      >
        <ResilientImage
          src={listing.imageUrl}
          alt={listing.title}
          category={listing.category}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {((listing.photoCount || 1) > 1 || listing.descriptionVoiceUrl) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 py-2 flex items-center justify-between gap-2">
            {listing.descriptionVoiceUrl ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white">
                <Mic className="w-3 h-3" />
                <span>{t.voiceAttachedBadge}</span>
              </span>
            ) : (
              <span />
            )}
            {(listing.photoCount || 1) > 1 && (
              <span className="text-[11px] font-mono font-medium text-white tabular-nums">
                {listing.photoCount} {t.photosCountSuffix}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="truncate">
              {categoryLabel} · {txLabel} · {listing.neighborhood}
            </span>
            {listing.status !== 'available' && (
              <span
                className={`shrink-0 font-medium ${
                  listing.status === 'closed' ? 'text-zinc-500' : 'text-amber-700'
                }`}
              >
                {statusLabel}
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-zinc-900 leading-snug line-clamp-1">
            <button
              type="button"
              onClick={() => onSelect(listing, 'order')}
              className="text-left hover:text-emerald-800 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {listing.title}
            </button>
          </h3>

          <p className="text-xs text-zinc-500 line-clamp-1 tabular-nums">{specsLine}</p>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <span className="font-mono text-[15px] font-semibold text-emerald-900 tabular-nums whitespace-nowrap truncate">
            {formattedPrice}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(listing)}
              aria-label={isSaved ? t.savedListing : t.saveListing}
              className={`min-w-[36px] min-h-[36px] px-2 rounded-lg border text-xs font-medium inline-flex items-center justify-center transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 ${
                isSaved
                  ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              onClick={() => onSelect(listing, 'message')}
              className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
            >
              {t.viewDetails}
            </button>

            <button
              type="button"
              disabled={listing.status !== 'available'}
              onClick={() => onSelect(listing, 'order')}
              className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:bg-zinc-300 disabled:text-zinc-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800"
            >
              {listing.transactionType === 'rent' ? t.reserveNow : t.orderNow}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
