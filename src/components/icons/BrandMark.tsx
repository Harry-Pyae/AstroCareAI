import type { SVGProps } from 'react';

export interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * ASTROCARE official brand mark:
 * simplified crescent (space) + pulse-star (care), styled via currentColor.
 */
export default function BrandMark({
  size = 28,
  className = '',
  ...props
}: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Crescent (space) */}
      <path
        d="M19.5 20.5A9 9 0 1 1 7.5 8.5a7.5 7.5 0 0 0 12 12Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Pulse-star (care) */}
      <path
        d="M17.5 6l1.2 4.1 4.1 1.2-4.1 1.2-1.2 4.1-1.2-4.1-4.1-1.2 4.1-1.2 1.2-4.1Z"
        fill="currentColor"
      />
      {/* Pulse line crossing star */}
      <path
        d="M15 11.3h1.5l.8-1.5 1 3 .8-1.5H21"
        stroke="var(--page, currentColor)"
        strokeWidth="1.2"
      />
    </svg>
  );
}
