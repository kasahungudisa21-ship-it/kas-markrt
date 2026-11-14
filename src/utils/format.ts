import { getPeriodLabel, getRoomClassLabel, getTenantPreferenceLabel } from '../i18n';
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

  if (listing.category === 'apartment' || listing.category === 'house') {
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
    if (s.itemCondition) {
      parts.push(s.itemCondition);
    }
    parts.push(listing.city);
  }

  return parts.join(' · ') || `${listing.neighborhood} · ${listing.city}`;
}
