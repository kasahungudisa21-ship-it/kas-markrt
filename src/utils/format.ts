import {
  getGoodsTypeLabel,
  getPeriodLabel,
  getRoomClassLabel,
  getTenantPreferenceLabel,
  getVehicleTypeLabel,
} from '../i18n';
import { CurrencyCode, Language, Listing, PricePeriod } from '../types';

export function formatPrice(
  price: number,
  currency: CurrencyCode,
  period: PricePeriod,
  lang: Language
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price);
  const periodSuffix = getPeriodLabel(period, lang);
  const unit = currency === 'ETB' ? (lang === 'am' ? 'ብር' : 'ETB') : 'USD';
  return `${formatted} ${unit}${periodSuffix}`;
}

export function formatSpecsLine(listing: Listing, lang: Language): string {
  const s = listing.specs || {};
  const parts: string[] = [];

  if (
    listing.category === 'apartment' ||
    listing.category === 'condominium' ||
    listing.category === 'house'
  ) {
    if (s.roomClass) {
      parts.push(getRoomClassLabel(s.roomClass, lang));
    } else if (typeof s.bedrooms === 'number') {
      parts.push(lang === 'am' ? `${s.bedrooms} መኝታ` : `${s.bedrooms} Bed`);
    }
    if (s.tenantPreference) {
      parts.push(getTenantPreferenceLabel(s.tenantPreference, lang));
    }
    if (typeof s.bathrooms === 'number') {
      parts.push(lang === 'am' ? `${s.bathrooms} መታጠቢያ` : `${s.bathrooms} Bath`);
    }
    if (typeof s.areaSqm === 'number' && s.areaSqm > 0) {
      parts.push(`${s.areaSqm} m²`);
    }
    if (s.titleDeed) {
      parts.push(s.titleDeed);
    }
  } else if (listing.category === 'land') {
    if (typeof s.areaSqm === 'number' && s.areaSqm > 0) {
      parts.push(`${new Intl.NumberFormat('en-US').format(s.areaSqm)} m²`);
    }
    if (s.titleDeed) {
      parts.push(s.titleDeed);
    }
  } else if (listing.category === 'vehicle') {
    if (s.vehicleType) {
      parts.push(getVehicleTypeLabel(s.vehicleType, lang));
    }
    if (s.vehicleModel) {
      parts.push(s.vehicleModel);
    }
    if (typeof s.vehicleYear === 'number') {
      parts.push(String(s.vehicleYear));
    }
    if (typeof s.mileageKm === 'number') {
      parts.push(`${new Intl.NumberFormat('en-US').format(s.mileageKm)} km`);
    }
    if (s.fuelType) {
      parts.push(s.fuelType);
    }
    if (s.transmission) {
      parts.push(s.transmission);
    }
  } else if (listing.category === 'goods') {
    if (s.goodsType) {
      parts.push(getGoodsTypeLabel(s.goodsType, lang));
    }
    if (s.goodsModel) {
      parts.push(s.goodsModel);
    }
    if (s.itemCondition) {
      parts.push(s.itemCondition);
    }
    parts.push(listing.city);
  }

  return parts.join(' · ') || `${listing.neighborhood} · ${listing.city}`;
}

const VEHICLE_TYPE_KEYWORDS: Record<string, string[]> = {
  suv: ['suv', '4x4', 'rav4', 'tucson', 'sportage', 'land cruiser', 'prado', 'song', 'cross', 'highlander'],
  sedan: ['sedan', 'corolla', 'elantra', 'dzire', 'camry', 'accord', 'civic'],
  compact: ['compact', 'hatchback', 'vitz', 'yaris', 'swift', 'seagull', 'picanto', 'alto'],
  pickup: ['pickup', 'hilux', 'ranger', 'navara', 'd-max', 'tacoma'],
  van: ['van', 'minibus', 'hiace', 'minivan', 'dolphin'],
  truck: ['truck', 'isuzu', 'npr', 'sino', 'cargo', 'lorry'],
};

const GOODS_TYPE_KEYWORDS: Record<string, string[]> = {
  electronics: ['tv', 'television', 'speaker', 'audio', 'camera', 'projector', 'electronics', 'playstation'],
  phones_tech: ['phone', 'iphone', 'samsung', 'galaxy', 'laptop', 'macbook', 'computer', 'pc', 'tablet', 'ipad', 'hp', 'dell'],
  furniture: ['sofa', 'chair', 'table', 'bed', 'desk', 'cabinet', 'wardrobe', 'furniture', 'walnut', 'couch'],
  appliances: ['fridge', 'refrigerator', 'washer', 'washing', 'microwave', 'espresso', 'oven', 'stove', 'blender', 'appliance', 'hisense', 'lg', 'bosch'],
  machinery_tools: ['generator', 'drill', 'compressor', 'machine', 'machinery', 'tool', 'pump', 'welding'],
  fashion_home: ['watch', 'shoes', 'jacket', 'bag', 'dress', 'carpet', 'curtain', 'decor', 'lamp', 'perfume'],
};

export function matchesVehicleType(listing: Listing, typeFilter: string): boolean {
  if (!typeFilter || typeFilter === 'all') return true;
  if (listing.category !== 'vehicle') return false;
  const specType = (listing.specs?.vehicleType || '').trim().toLowerCase();
  if (specType) {
    return specType === typeFilter.toLowerCase();
  }
  const hay = `${listing.title} ${listing.description} ${listing.specs?.vehicleModel || ''}`.toLowerCase();
  const keywords = VEHICLE_TYPE_KEYWORDS[typeFilter.toLowerCase()] || [typeFilter.toLowerCase()];
  return keywords.some((kw) => hay.includes(kw));
}

export function matchesGoodsType(listing: Listing, typeFilter: string): boolean {
  if (!typeFilter || typeFilter === 'all') return true;
  if (listing.category !== 'goods') return false;
  const specType = (listing.specs?.goodsType || '').trim().toLowerCase();
  if (specType) {
    return specType === typeFilter.toLowerCase();
  }
  const hay = `${listing.title} ${listing.description} ${listing.specs?.goodsModel || ''}`.toLowerCase();
  if (typeFilter === 'other') {
    return true;
  }
  const keywords = GOODS_TYPE_KEYWORDS[typeFilter.toLowerCase()] || [typeFilter.toLowerCase()];
  return keywords.some((kw) => hay.includes(kw));
}

export function matchesListingModel(
  listing: Listing,
  category: 'vehicle' | 'goods',
  modelQuery: string
): boolean {
  const q = modelQuery.trim().toLowerCase();
  if (!q) return true;
  if (listing.category !== category) return false;
  const modelField =
    category === 'vehicle'
      ? (listing.specs?.vehicleModel || '').toLowerCase()
      : (listing.specs?.goodsModel || '').toLowerCase();
  const hay = `${modelField} ${listing.title} ${listing.description}`.toLowerCase();
  return hay.includes(q);
}

export function formatFirestoreUserError(err: unknown, lang: Language): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  let message = raw;
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed && typeof parsed.error === 'string') {
      message = parsed.error;
    }
  } catch {
    // Not JSON
  }

  const lower = message.toLowerCase();
  if (
    lower.includes('cloud firestore api has not been used') ||
    lower.includes('service_disabled') ||
    lower.includes('database') && lower.includes('does not exist')
  ) {
    return lang === 'am'
      ? 'የ Firebase Firestore ዳታቤዝ በፕሮጀክቱ ውስጥ አልተከፈተም። Firebase Console -> Firestore Database -> Create database በመክፈት ያብሩት።'
      : 'Firestore Database is not created/enabled in this Firebase project yet. Open Firebase Console -> Firestore Database -> Create database.';
  }

  if (
    lower.includes('permission-denied') ||
    lower.includes('missing or insufficient permissions')
  ) {
    return lang === 'am'
      ? 'የዳታቤዝ ፍቃድ ተከልክሏል። በGoogle መግባትዎን እና Firebase Console -> Firestore Database -> Rules ውስጥ የfirestore.rules ህግ መታተሙን (Publish) ያረጋግጡ።'
      : 'Database permission denied. Ensure you are signed in with Google and that firestore.rules is published in Firebase Console -> Firestore Database -> Rules.';
  }

  if (lower.includes('offline') || lower.includes('network') || lower.includes('unavailable')) {
    return lang === 'am'
      ? 'ከዳታቤዙ ጋር መገናኘት አልተቻለም። የኢንተርኔት ግንኙነትዎን ያረጋግጡ።'
      : 'Unable to reach the database right now. Please check your internet connection and try again.';
  }

  return message || (lang === 'am' ? 'ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።' : 'Something went wrong. Please try again.');
}
