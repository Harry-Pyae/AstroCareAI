const paths = {
  review: 'M12 3 2 21h20L12 3Zm0 6v5m0 3v.01', check: 'm5 12 4 4L19 6',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', arrow: 'M5 12h14m-5-5 5 5-5 5',
  recheck: 'M20 7v5h-5M4 17a8 8 0 0 0 14 2M20 7A8 8 0 0 0 6 5', note: 'M4 4h16v12H9l-5 4V4Zm4 5h8m-8 4h5',
  calendar: 'M5 5h14v16H5V5Zm3-3v6m8-6v6M5 11h14', info: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
export default function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="brief-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
