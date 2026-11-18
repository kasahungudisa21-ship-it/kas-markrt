import {
  getGoodsConditionLabel,
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
      parts.push(getGoodsConditionLabel(s.itemCondition, lang));
    }
    parts.push(listing.city);
  }

  return parts.join(' · ') || `${listing.neighborhood} · ${listing.city}`;
}

const VEHICLE_TYPE_KEYWORDS: Record<string, string[]> = {
  suv: ['suv', '4x4', 'rav4', 'tucson', 'sportage', 'land cruiser', 'prado', 'fortuner', 'song', 'highlander', 'defender', 'pajero', 'x-trail', 'patrol'],
  sedan: ['sedan', 'corolla', 'elantra', 'dzire', 'camry', 'accord', 'civic', 'accent', 'belta', 'platz', 'sunny', 'sonata', 'ciaz', 'crown'],
  compact: ['compact', 'hatchback', 'vitz', 'yaris', 'swift', 'seagull', 'picanto', 'alto', 'i10', 'i20', 'atos', 'passo', 'celerio', 'fit', 'polo', 'golf'],
  crossover: ['crossover', 'cuv', 'corolla cross', 'c-hr', 'kona', 'creta', 'fronx', 'seltos', 'qashqai', 'juke', 'hr-v', 'rush', 'tiggo', 'jetour', 'atto'],
  pickup: ['pickup', 'hilux', 'ranger', 'navara', 'd-max', 'tacoma', 'l200', 'f-150', 'tunland'],
  van: ['van', 'minibus', 'hiace', 'minivan', 'dolphin', 'starex', 'staria', 'avanza', 'ertiga', 'urvan', 'sprinter', 'bongo'],
  bus: ['bus', 'coaster', 'yutong', 'king long'],
  truck: ['truck', 'isuzu', 'npr', 'nqr', 'fsr', 'sino', 'sinotruk', 'howo', 'cargo', 'lorry', 'iveco', 'fuso', 'canter', 'hd65', 'hd72'],
  electric: ['electric', 'ev', 'byd', 'seagull', 'dolphin', 'atto', 'id.4', 'id.6', 'id.3', 'bz4x', 'neta', 'tesla', 'eado'],
  hybrid: ['hybrid', 'prius', 'aqua', 'rav4 hybrid', 'corolla cross hybrid'],
  luxury: ['luxury', 'vip', 'mercedes', 'bmw', 'lexus', 'range rover', 'porsche', 'audi', 'g-class', 's-class', 'vogue', 'lx 570'],
  station_wagon: ['wagon', 'station wagon', 'probox', 'succeed', 'estate', 'touring'],
  coupe: ['coupe', 'sport', 'mustang', 'camaro', '2-door'],
  convertible: ['convertible', 'cabriolet', 'roadster'],
  motorcycle: ['motorcycle', 'motorbike', 'bajaj', 'tvs', 'lifan', 'yamaha', 'scooter', 'bike'],
  machinery: ['excavator', 'loader', 'backhoe', 'caterpillar', 'jcb', 'grader', 'crane', 'forklift', 'dozer', 'machinery'],
};

const GOODS_TYPE_KEYWORDS: Record<string, string[]> = {
  phones_tech: ['phone', 'iphone', 'samsung', 'galaxy', 'xiaomi', 'redmi', 'tecno', 'infinix', 'pixel', 'ipad', 'tablet', 'apple watch'],
  computers_office: ['laptop', 'macbook', 'computer', 'pc', 'hp', 'dell', 'lenovo', 'thinkpad', 'asus', 'acer', 'printer', 'router', 'starlink'],
  electronics: ['tv', 'television', 'oled', 'qled', 'speaker', 'audio', 'camera', 'projector', 'playstation', 'ps5', 'xbox', 'jbl', 'soundbar'],
  appliances: ['fridge', 'refrigerator', 'washer', 'washing', 'dishwasher', 'microwave', 'espresso', 'air fryer', 'oven', 'stove', 'blender', 'dispenser', 'hisense', 'beko'],
  furniture: ['sofa', 'chair', 'table', 'bed', 'mattress', 'desk', 'cabinet', 'wardrobe', 'closet', 'furniture', 'walnut', 'couch', 'carpet', 'rug'],
  solar_power: ['solar', 'inverter', 'ecoflow', 'anker', 'generator', 'ups', 'stabilizer', 'battery'],
  machinery_tools: ['drill', 'grinder', 'compressor', 'machine', 'machinery', 'tool', 'pump', 'welding', 'bosch'],
  auto_parts: ['tire', 'rim', 'alloy', 'dashcam', 'car screen', 'car battery', 'spare part', 'headlight', 'brake'],
  fashion_home: ['watch', 'shoes', 'sneaker', 'nike', 'adidas', 'jacket', 'bag', 'dress', 'suit', 'perfume', 'fashion'],
  beauty_health: ['beauty', 'skincare', 'hair', 'dryer', 'makeup', 'cosmetic', 'perfume', 'salon', 'massage'],
  baby_kids: ['baby', 'stroller', 'crib', 'kids', 'toy', 'car seat', 'walker'],
  sports_fitness: ['treadmill', 'gym', 'dumbbell', 'bicycle', 'bike', 'football', 'fitness', 'sport'],
  business_agro: ['bakery', 'cafe', 'pos', 'commercial', 'restaurant', 'agro', 'farm', 'incubator', 'mill'],
};

export function matchesVehicleType(listing: Listing, typeFilter: string): boolean {
  if (!typeFilter || typeFilter === 'all') return true;
  if (listing.category !== 'vehicle') return false;
  const target = typeFilter.toLowerCase();
  const specType = (listing.specs?.vehicleType || '').trim().toLowerCase();
  const fuel = (listing.specs?.fuelType || '').trim().toLowerCase();
  if (target === 'electric' && (specType === 'electric' || fuel === 'electric')) {
    return true;
  }
  if (target === 'hybrid' && (specType === 'hybrid' || fuel === 'hybrid')) {
    return true;
  }
  if (specType) {
    return specType === target;
  }
  const hay = `${listing.title} ${listing.description} ${listing.specs?.vehicleModel || ''} ${fuel}`.toLowerCase();
  const keywords = VEHICLE_TYPE_KEYWORDS[target] || [target];
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

export function matchesGoodsCondition(listing: Listing, conditionFilter: string): boolean {
  if (!conditionFilter || conditionFilter === 'all') return true;
  if (listing.category !== 'goods') return false;
  const target = conditionFilter.trim().toLowerCase();
  const cond = (listing.specs?.itemCondition || '').trim().toLowerCase();
  if (cond) {
    if (target.includes('used')) return cond.includes('used');
    return cond === target;
  }
  const hay = `${listing.title} ${listing.description}`.toLowerCase();
  if (target === 'brand new') return hay.includes('brand new') || hay.includes('አዲስ');
  if (target === 'like new') return hay.includes('like new');
  if (target.includes('used')) return hay.includes('used') || hay.includes('ያገለገለ');
  return true;
}

const GOODS_SYNONYM_GROUPS: string[][] = [
  ['ሶፋ', 'sofa', 'couch', 'sectional'],
  ['ፍሪጅ', 'fridge', 'refrigerator'],
  ['ስልክ', 'phone', 'smartphone', 'iphone', 'samsung', 'tecno', 'infinix', 'xiaomi'],
  ['ላፕቶፕ', 'laptop', 'macbook', 'hp', 'dell', 'lenovo', 'computer', 'pc'],
  ['ቲቪ', 'ቴሌቪዥን', 'tv', 'television', 'lg', 'hisense', 'sony'],
  ['አልጋ', 'bed', 'mattress', 'ፍራሽ'],
  ['ጠረጴዛ', 'table', 'desk'],
  ['ወንበር', 'chair'],
  ['ማጠቢያ', 'washer', 'washing'],
  ['ምድጃ', 'stove', 'oven'],
  ['ጀነሬተር', 'generator'],
  ['ሶላር', 'solar', 'inverter'],
  ['ጫማ', 'shoes', 'sneakers'],
  ['ሰዓት', 'watch'],
  ['ብስክሌት', 'bicycle', 'bike'],
  ['ፓምፕ', 'pump'],
];

export function matchesGoodsItem(listing: Listing, itemQuery: string): boolean {
  const raw = itemQuery.trim().toLowerCase();
  if (!raw) return true;
  if (listing.category !== 'goods') return false;

  const typeEn = listing.specs?.goodsType
    ? getGoodsTypeLabel(listing.specs.goodsType, 'en').toLowerCase()
    : '';
  const typeAm = listing.specs?.goodsType
    ? getGoodsTypeLabel(listing.specs.goodsType, 'am').toLowerCase()
    : '';

  const hay = `${listing.title} ${listing.description} ${listing.specs?.goodsModel || ''} ${
    listing.specs?.goodsType || ''
  } ${typeEn} ${typeAm} ${listing.specs?.itemCondition || ''}`.toLowerCase();

  // Split bilingual suggestion format like "Sofa / ሶፋ" into tokens
  const tokens = raw
    .split(/[/,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return tokens.some((tok) => {
    if (hay.includes(tok)) return true;
    const group = GOODS_SYNONYM_GROUPS.find((syns) => syns.some((s) => tok.includes(s) || s.includes(tok)));
    return group ? group.some((syn) => hay.includes(syn)) : false;
  });
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

export function matchesVehicleYear(listing: Listing, yearQuery: string): boolean {
  const q = yearQuery.trim();
  if (!q) return true;
  if (listing.category !== 'vehicle') return false;

  const year = listing.specs?.vehicleYear;
  const rangeMatch = q.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return typeof year === 'number' && year >= min && year <= max;
  }

  const digits = q.replace(/\D/g, '');
  if (!digits) return true;

  if (typeof year === 'number') {
    const yearStr = String(year);
    return digits.length >= 4 ? yearStr === digits.slice(0, 4) : yearStr.startsWith(digits);
  }

  const hay = `${listing.title} ${listing.description}`;
  return hay.includes(digits);
}

export function formatFirestoreUserError(err: unknown, lang: Language): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  let message = raw;
  let parsedInfo: {
    error?: string;
    operationType?: string;
    path?: string | null;
    authInfo?: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
    };
  } | null = null;

  try {
    const parsed = JSON.parse(raw) as {
      error?: string;
      operationType?: string;
      path?: string | null;
      authInfo?: {
        userId?: string | null;
        email?: string | null;
        emailVerified?: boolean | null;
      };
    };
    if (parsed && typeof parsed.error === 'string') {
      message = parsed.error;
      parsedInfo = parsed;
    }
  } catch {
    // Not JSON
  }

  const lower = message.toLowerCase();
  if (
    lower.includes('cloud firestore api has not been used') ||
    lower.includes('service_disabled') ||
    (lower.includes('database') && lower.includes('does not exist'))
  ) {
    return lang === 'am'
      ? 'የ Firebase Firestore ዳታቤዝ በፕሮጀክቱ ውስጥ አልተከፈተም። ከጥቂት ጊዜ በኋላ እንደገና ይሞክሩ።'
      : 'Firestore Database is not created/enabled in this Firebase project yet.';
  }

  if (
    lower.includes('permission-denied') ||
    lower.includes('missing or insufficient permissions')
  ) {
    const uid = parsedInfo?.authInfo?.userId;
    const emailVerified = parsedInfo?.authInfo?.emailVerified;

    if (!uid) {
      return lang === 'am'
        ? 'ይህን ተግባር ለመፈጸም በቅድሚያ በGoogle ይግቡ እና እንደገና ይሞክሩ።'
        : 'Please sign in with Google first, then try again.';
    }

    if (emailVerified === false) {
      return lang === 'am'
        ? 'የገቡበት የGoogle ኢሜል የተረጋገጠ (Verified) አይደለም። እባክዎ በተረጋገጠ የGmail መለያ ይግቡ።'
        : 'Your Google account email is not verified. Please sign in with a verified Gmail account.';
    }

    return lang === 'am'
      ? 'የዳታቤዝ ፍቃድ ተከልክሏል። ከመለያዎ ወጥተው (Sign out) ገጹን ያድሱና በGoogle እንደገና ይግቡ። ችግሩ ከቀጠለ የመተግበሪያው ባለቤት የFirestore ህጎችን (Rules) ማተሙን ያረጋግጡ።'
      : 'Database permission denied. Please sign out, refresh the page, and sign in with Google again. If the issue persists, ensure the latest Firestore Rules are published.';
  }

  if (lower.includes('offline') || lower.includes('network') || lower.includes('unavailable')) {
    return lang === 'am'
      ? 'ከዳታቤዙ ጋር መገናኘት አልተቻለም። የኢንተርኔት ግንኙነትዎን ያረጋግጡ።'
      : 'Unable to reach the database right now. Please check your internet connection and try again.';
  }

  return message || (lang === 'am' ? 'ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።' : 'Something went wrong. Please try again.');
}
