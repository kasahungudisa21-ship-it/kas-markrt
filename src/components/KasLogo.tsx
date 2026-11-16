import { useId } from 'react';

export type KasLogoVariant = 'emerald' | 'cobalt' | 'indigo' | 'amber';

interface KasLogoProps {
  variant?: KasLogoVariant;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<
  KasLogoVariant,
  {
    frameStart: string;
    frameEnd: string;
    innerBg: string;
    roofColor: string;
    letterColor: string;
    keystoneColor: string;
    brandLeadClass: string;
    brandAccentClass: string;
  }
> = {
  emerald: {
    frameStart: '#FDE68A',
    frameEnd: '#D97706',
    innerBg: '#0B2D25',
    roofColor: '#FBBF24',
    letterColor: '#FCF8EE',
    keystoneColor: '#34D399',
    brandLeadClass: 'text-[#FCF8EE]',
    brandAccentClass: 'text-amber-300',
  },
  cobalt: {
    frameStart: '#7DD3FC',
    frameEnd: '#0284C7',
    innerBg: '#0F172A',
    roofColor: '#38BDF8',
    letterColor: '#F8FAFC',
    keystoneColor: '#FBBF24',
    brandLeadClass: 'text-white',
    brandAccentClass: 'text-sky-400',
  },
  indigo: {
    frameStart: '#A5B4FC',
    frameEnd: '#4F46E5',
    innerBg: '#0D1026',
    roofColor: '#818CF8',
    letterColor: '#EEF2FF',
    keystoneColor: '#FBBF24',
    brandLeadClass: 'text-indigo-50',
    brandAccentClass: 'text-indigo-300',
  },
  amber: {
    frameStart: '#FDE68A',
    frameEnd: '#B45309',
    innerBg: '#171717',
    roofColor: '#F59E0B',
    letterColor: '#FAFAFA',
    keystoneColor: '#34D399',
    brandLeadClass: 'text-neutral-50',
    brandAccentClass: 'text-amber-400',
  },
};

const SIZE_MAP = {
  sm: { icon: 26, text: 'text-sm sm:text-base' },
  md: { icon: 34, text: 'text-lg sm:text-[20px]' },
  lg: { icon: 42, text: 'text-xl sm:text-2xl' },
};

export function KasLogo({
  variant = 'emerald',
  size = 'md',
  showWordmark = true,
  className = '',
}: KasLogoProps) {
  const uid = useId().replace(/:/g, '');
  const palette = VARIANT_STYLES[variant];
  const dims = SIZE_MAP[size];
  const gradId = `kas-frame-${uid}`;

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width={dims.icon}
        height={dims.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 drop-shadow-sm transition-transform duration-150 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={palette.frameStart} />
            <stop offset="100%" stopColor={palette.frameEnd} />
          </linearGradient>
        </defs>

        {/* Outer metallic frame */}
        <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill={`url(#${gradId})`} />

        {/* Inner deep architectural surface */}
        <rect x="4" y="4" width="32" height="32" rx="7.5" fill={palette.innerBg} />

        {/* Subtle inner hairline frame */}
        <rect
          x="4.5"
          y="4.5"
          width="31"
          height="31"
          rx="7"
          stroke={palette.frameStart}
          strokeOpacity="0.22"
          strokeWidth="1"
        />

        {/* Apex keystone diamond */}
        <path
          d="M20 6.8L22.4 9.2L20 11.6L17.6 9.2L20 6.8Z"
          fill={palette.keystoneColor}
        />

        {/* Architectural twin-slope roofline */}
        <path
          d="M9.5 18.2L20 9.6L30.5 18.2"
          stroke={palette.roofColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Foundation base sill */}
        <path
          d="M11 31.2H29"
          stroke={palette.roofColor}
          strokeOpacity="0.45"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Geometric "K" Monogram */}
        <path
          d="M14 17.5V28.5"
          stroke={palette.letterColor}
          strokeWidth="2.9"
          strokeLinecap="round"
        />
        <path
          d="M25.5 17.8L16.2 23.1L26 28.5"
          stroke={palette.letterColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Intersection accent node */}
        <circle cx="16.2" cy="23.1" r="1.4" fill={palette.keystoneColor} />
      </svg>

      {showWordmark && (
        <span className={`font-display font-bold tracking-tight leading-none ${dims.text}`}>
          <span className={palette.brandLeadClass}>Kas</span>{' '}
          <span className={palette.brandAccentClass}>Market</span>
        </span>
      )}
    </span>
  );
}
