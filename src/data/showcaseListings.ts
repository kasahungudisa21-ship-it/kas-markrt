import heroModernAddis from '../assets/images/hero_modern_addis_residence_1794645758546.jpg';
import listingApartmentBole from '../assets/images/listing_apartment_bole_1794645758334.jpg';
import listingCarSuv from '../assets/images/listing_car_suv_1794645760395.jpg';
import listingGoodsFurniture from '../assets/images/listing_goods_furniture_1794645760516.jpg';
import listingLandPlot from '../assets/images/listing_land_plot_1794645759864.jpg';
import listingVillaOldAirport from '../assets/images/listing_villa_old_airport_1794645759376.jpg';
import { Listing, ListingCategory } from '../types';

export const HERO_IMAGE = heroModernAddis;

export const CATEGORY_PRESET_IMAGES: Record<ListingCategory, { label: string; url: string }[]> = {
  apartment: [
    {
      label: 'Contemporary Penthouse Living',
      url: listingApartmentBole,
    },
    {
      label: 'Modern Residence Facade',
      url: heroModernAddis,
    },
  ],
  house: [
    {
      label: 'Two-Story Family Villa',
      url: listingVillaOldAirport,
    },
    {
      label: 'Courtyard Residence',
      url: heroModernAddis,
    },
  ],
  land: [
    {
      label: 'Surveyed Residential Plot',
      url: listingLandPlot,
    },
  ],
  vehicle: [
    {
      label: 'Hybrid Compact SUV',
      url: listingCarSuv,
    },
  ],
  goods: [
    {
      label: 'Furniture & Espresso Studio',
      url: listingGoodsFurniture,
    },
  ],
};

export const NEIGHBORHOOD_OPTIONS = [
  'Bole',
  'Old Airport',
  'Kazanchis',
  'CMC',
  'Sarbet',
  'Ayat',
  'Lebu',
  'Summit',
  'Piassa',
];

export const SHOWCASE_LISTINGS: Listing[] = [];
