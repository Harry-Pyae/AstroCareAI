import { useI18n } from "../../i18n/LanguageProvider";
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface CrewQRProps { crewId: string; size?: number; className?: string; }

export default function CrewQR({ crewId, size = 160, className = '' }: CrewQRProps) {
  const { t, language, date } = useI18n();
  const [result, setResult] = useState<{ url: string; image: string; error: boolean } | null>(null);
  const path = `/crew/${encodeURIComponent(crewId)}`;
  const url = typeof window === 'undefined' ? '' : window.location.origin + path;
  useEffect(() => {
    let active = true;
    if (!url || !crewId) return;
    QRCode.toDataURL(url, { width: size, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then(image => { if (active) setResult({ url, image, error: false }); })
      .catch(() => { if (active) setResult({ url, image: '', error: true }); });
    return () => { active = false; };
  }, [crewId, size, url]);
  const current = result?.url === url ? result : null;
  return <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
    {current?.image ? <img src={current.image} width={size} height={size} className='rounded' alt={t('qr.alt', { id: crewId })} /> :
      current?.error ? <span role='status' className='flex items-center justify-center rounded border border-default bg-card p-3 text-center text-xs text-secondary' style={{width:size,height:size}}>{t("QR unavailable. Use the crew card or link.")}</span>
      : <span role='status' aria-label={t("Generating crew QR\u2026")} className='skeleton block' style={{width:size,height:size}} />}
    <span className='font-mono text-xs text-secondary'>{t('Scan badge')} · {crewId}</span>
  </span>;
}
