import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../../i18n/LanguageProvider';

export interface CrewQRProps { crewId: string; size?: number; className?: string; }

export default function CrewQR({ crewId, size = 160, className = '' }: CrewQRProps) {
  const { t } = useI18n();
  const [result, setResult] = useState<{ url: string; image: string; error: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const url = typeof window === 'undefined' ? '' : new URL(`/crew/${encodeURIComponent(crewId)}`, window.location.origin).href;

  useEffect(() => {
    let active = true;
    if (!url || !crewId) return;
    QRCode.toDataURL(url, { width: size, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then(image => { if (active) setResult({ url, image, error: false }); })
      .catch(() => { if (active) setResult({ url, image: '', error: true }); });
    return () => { active = false; };
  }, [crewId, size, url]);

  const current = result?.url === url ? result : null;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('qr.copied');
    } catch {
      setMessage('qr.copyFailed');
    }
  }

  function downloadImage() {
    if (!current?.image) return;
    const link = document.createElement('a');
    link.href = current.image;
    link.download = `astrocare-${crewId.replace(/[^a-zA-Z0-9_-]/g, '-')}-qr.png`;
    link.click();
    setMessage('qr.downloadStarted');
  }

  return <div className={`flex min-w-0 flex-col items-center gap-2 text-center ${className}`}>
    {current?.image ? <img src={current.image} width={size} height={size} className="rounded" alt={t('qr.alt', { id: crewId })} /> :
      <div role="status" className="flex items-center justify-center rounded border border-default bg-card p-3 text-xs text-secondary" style={{ width: size, height: size }}>
        {current?.error ? t('QR unavailable. Use the crew card or link.') : t('Generating crew QR…')}
      </div>}
    <p className="font-mono text-xs text-secondary">{t('Scan badge')} · {crewId}</p>
    <div className="flex w-full flex-wrap justify-center gap-2">
      <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void copyLink(); }} disabled={!url} className="min-h-11 rounded-lg border border-default bg-card px-3 py-2 text-xs font-medium text-primary focus-ring disabled:opacity-50">{t('qr.copy')}</button>
      <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); downloadImage(); }} disabled={!current?.image} className="min-h-11 rounded-lg border border-default bg-card px-3 py-2 text-xs font-medium text-primary focus-ring disabled:opacity-50">{t('qr.download')}</button>
    </div>
    {message ? <p role="status" aria-live="polite" className="text-xs text-secondary">{t(message)}</p> : null}
    {url ? <p className="max-w-full break-all text-xs text-accent" aria-label={t('qr.openCrew', { id: crewId })}>{url}</p> : null}
  </div>;
}
