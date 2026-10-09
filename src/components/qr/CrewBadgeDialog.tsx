import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../../i18n/LanguageProvider';
import type { CrewMember } from '../../lib/types';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import CrewQR from './CrewQR';

/** Explicit, opt-in sharing: the deep-link QR lives here, not on the crew list. */
export default function CrewBadgeDialog({ member }: { member: CrewMember }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const url = `${typeof window === 'undefined' ? '' : window.location.origin}/crew/${encodeURIComponent(member.id)}`;

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Link copied.');
    } catch {
      setNotice('Copy is unavailable here. Select the link above instead.');
    }
  }

  async function download() {
    try {
      const link = document.createElement('a');
      link.href = await QRCode.toDataURL(url, { width: 512, margin: 4, errorCorrectionLevel: 'M' });
      link.download = `astrocare-badge-${member.id}.png`;
      link.click();
      setNotice('Badge image downloaded.');
    } catch {
      setNotice('The badge image could not be created.');
    }
  }

  return <>
    <Button variant="secondary" onClick={() => { setNotice(''); setOpen(true); }}><Icon name="qr-scan" size={18} />{t('Crew badge')}</Button>
    <dialog ref={ref} onClose={() => setOpen(false)} aria-labelledby="badge-title" className="modal w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-default bg-card p-0 text-primary shadow-xl">
      {open && <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="badge-title" className="text-lg font-semibold">{t('Crew badge')}</h2>
            <p className="text-sm text-secondary">{member.name} · {t(member.role)}</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label={t('Close')} className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary hover:bg-card-raised hover:text-primary">
            <Icon name="close" />
          </button>
        </div>
        <div className="mt-5 flex justify-center rounded-xl bg-white p-3"><CrewQR crewId={member.id} size={200} /></div>
        <p className="mt-3 text-sm text-secondary">{t("Share this badge to open this crew member's brief on another device.")}</p>
        <p className="mt-2 select-all break-all rounded-lg bg-card-raised px-3 py-2 font-mono text-xs">{url}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={copy}><Icon name="copy" size={18} />{t('Copy link')}</Button>
          <Button variant="secondary" onClick={download}><Icon name="download" size={18} />{t('Download PNG')}</Button>
        </div>
        <p role="status" aria-live="polite" className="mt-3 min-h-5 text-xs text-accent">{notice ? t(notice) : ''}</p>
      </div>}
    </dialog>
  </>;
}
