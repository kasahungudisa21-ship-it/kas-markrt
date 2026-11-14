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

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-500 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon className="w-8 h-8 mb-2 text-emerald-800/70" strokeWidth={1.5} />
        <span className="text-xs font-medium text-zinc-600 line-clamp-2 max-w-[200px]">{alt}</span>
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
