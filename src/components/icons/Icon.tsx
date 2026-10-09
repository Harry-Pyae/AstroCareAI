import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'metrics'
  | 'sleep'
  | 'heart-pulse'
  | 'checkin'
  | 'schedule'
  | 'research'
  | 'spaceweather'
  | 'qr-scan'
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon'
  | 'crew'
  | 'arrow'
  | 'check'
  | 'info'
  | 'note'
  | 'calendar'
  | 'recheck'
  | 'review'
  | 'clock'
  | 'brief'
  | 'copy'
  | 'download';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
  label?: string;
  className?: string;
}

const glyphs: Record<IconName, ReactElement> = {
  // Project monotone icons from astrocare-icons.zip
  'heart-pulse': (
    <>
      <path d="M12 20.2 4.9 13A4.8 4.8 0 0 1 12 6.4 4.8 4.8 0 0 1 19.1 13Z" />
      <path d="M6.8 12.5h2.9l1.2-2.4 2.2 4.4 1.2-2h2.9" />
    </>
  ),
  'qr-scan': (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <rect x="8.2" y="8.2" width="3" height="3" rx="0.5" />
      <path d="M13.3 8.2h2.5" />
      <path d="M15.8 10.7v2.5h-2.5" />
      <path d="M8.2 13.8v2" />
      <path d="M11.2 15.8h2" />
    </>
  ),
  spaceweather: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 4.2v1.6" />
      <path d="M12 18.2v1.6" />
      <path d="M4.2 12h1.6" />
      <path d="M18.2 12h1.6" />
      <path d="m6.5 6.5 1.1 1.1" />
      <path d="m16.4 16.4 1.1 1.1" />
      <path d="m17.5 6.5-1.1 1.1" />
      <path d="m7.6 16.4-1.1 1.1" />
    </>
  ),
  schedule: (
    <>
      <circle cx="12" cy="12" r="6.2" />
      <path d="M12 8.8V12l2.3 2.3" />
      <path d="M20.4 8.5a9.4 9.4 0 0 1-11.9 11.4" />
      <path d="M3.6 15.5A9.4 9.4 0 0 1 15.5 4.1" />
      <circle cx="19.2" cy="17.8" r="0.4" fill="currentColor" />
      <circle cx="4.8" cy="6.2" r="0.4" fill="currentColor" />
    </>
  ),
  research: (
    <>
      <path d="M10 4h4" />
      <path d="M10.5 4v5.2L5.4 18a2 2 0 0 0 1.8 3h9.6a2 2 0 0 0 1.8-3l-5.1-8.8V4" />
      <path d="M7.2 15.5h9.6" />
    </>
  ),
  metrics: (
    <>
      <path d="M4 20h16" />
      <path d="M6.5 16.5v-4" />
      <path d="M11 16.5V8.5" />
      <path d="M15.5 16.5v-6" />
      <path d="M20 16.5v-10" />
    </>
  ),
  sleep: (
    <>
      <path d="M19.2 14.2A7.6 7.6 0 0 1 9.8 4.8a7.6 7.6 0 1 0 9.4 9.4Z" />
      <path d="M17 4.5v4" />
      <path d="M15 6.5h4" />
    </>
  ),
  checkin: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9.5 4.5a2.5 2.5 0 0 1 5 0" />
      <path d="M9 11h6" />
      <path d="M9 14.5h3" />
      <path d="m13.5 17 1.6 1.6 3-3.1" />
    </>
  ),

  // UI glyphs from Nav.tsx and brief/Icon.tsx
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  crew: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5 12 4 4L19 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v6m0-10v.01" />
    </>
  ),
  note: <path d="M4 4h16v12H9l-5 4V4Zm4 5h8m-8 4h5" />,
  calendar: <path d="M5 5h14v16H5V5Zm3-3v6m8-6v6M5 11h14" />,
  recheck: <path d="M20 7v5h-5M4 17a8 8 0 0 0 14 2M20 7A8 8 0 0 0 6 5" />,
  review: <path d="M12 3 2 21h20L12 3Zm0 6v5m0 3v.01" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  brief: <path d="M3 12h4l3-7 4 14 3-7h4" />,

  // Glyphs for P4 (copy + download)
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  label,
  className = '',
  ...props
}: IconProps) {
  const glyph = glyphs[name];
  if (!glyph) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className={className}
      {...props}
    >
      {glyph}
    </svg>
  );
}
