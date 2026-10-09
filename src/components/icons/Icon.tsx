// The ONLY icon system: 24x24 grid, stroke 1.75, currentColor. Color comes from
// the parent's text-* token class; size via the size prop.
const paths = {
  // UI glyphs
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  crew: 'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5',
  brief: 'M3 12h4l3-7 4 14 3-7h4',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  'arrow-left': 'M19 12H5m5 5-5-5 5-5',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  info: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  review: 'M12 3 2 21h20L12 3Zm0 6v5m0 3v.01',
  note: 'M4 4h16v12H9l-5 4V4Zm4 5h8m-8 4h5',
  calendar: 'M5 5h14v16H5V5Zm3-3v6m8-6v6M5 11h14',
  recheck: 'M20 7v5h-5M4 17a8 8 0 0 0 14 2M20 7A8 8 0 0 0 6 5',
  copy: 'M9 9h11v11H9V9ZM5 15H4V4h11v1',
  download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-left': 'm15 6-6 6 6 6',
  'chevron-right': 'm9 6 6 6-6 6',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6m0 3.5v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  play: 'M7 5v14l11-7L7 5Z',
  exit: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  // Project / metric icons
  metrics: 'M5 20V12m5 8V6m5 14v-9m5 9V4',
  sleep: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5ZM15 4h4l-4 4h4',
  'heart-pulse': 'M20.8 11A5.5 5.5 0 0 0 12 5.6 5.5 5.5 0 0 0 3.2 11M3 13h4l2-3 3 6 2-3h7M5.5 16.5 12 21l6.5-4.5',
  schedule: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  spaceweather: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  checkin: 'M8 3h8v3H8V3ZM6 5H5v16h14V5h-1M8.5 13l2.5 2.5 4.5-5',
  'qr-scan': 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 8h3v3H8V8Zm5 5h3v3h-3v-3Zm0-5h3v3M8 13v3h3',
  research: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9',
  activity: 'M13 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0ZM7 21l3-6 3 2 1 4M9 11l3-3 3 3 3 1M10 15l2-7',
  wellbeing: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 14.5a4 4 0 0 0 7 0M9 9.5v.01M15 9.5v.01',
  water: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
} as const;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible name. Omit for decorative icons (default: aria-hidden). */
  label?: string;
}

export default function Icon({ name, size = 20, className = '', label }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={paths[name]} />
    </svg>
  );
}
