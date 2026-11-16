import { useEffect, useState } from 'react';
import { Building2, Car, Home, MapPin, Package } from 'lucide-react';
import { ListingCategory } from '../types';

interface ResilientImageProps {
  src: string;
  alt: string;
  category: ListingCategory;
  className?: string;
}

export function ResilientImage({ src, alt, category, className = '' }: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    const Icon =
      category === 'apartment'
        ? Building2
        : category === 'house'
        ? Home
        : category === 'land'
        ? MapPin
        : category === 'vehicle'
        ? Car
        : Package;

    const fallbackTheme =
      category === 'land'
        ? { bg: 'from-[#FDF1DB] to-[#F7DDA9]', icon: 'text-[#B45309]', text: 'text-[#5C2D0C]' }
        : category === 'vehicle'
        ? { bg: 'from-[#E5F0FC] to-[#C8DDF7]', icon: 'text-[#1D4ED8]', text: 'text-[#142F66]' }
        : category === 'goods'
        ? { bg: 'from-[#F8EAF2] to-[#EBC8DC]', icon: 'text-[#9D174D]', text: 'text-[#591432]' }
        : { bg: 'from-[#E3F5EE] to-[#C5E8DA]', icon: 'text-[#0F5E48]', text: 'text-[#0B3B2E]' };

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br ${fallbackTheme.bg} p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon className={`w-8 h-8 mb-2 ${fallbackTheme.icon}`} strokeWidth={1.5} />
        <span className={`text-xs font-semibold line-clamp-2 max-w-[200px] ${fallbackTheme.text}`}>
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
