import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon, { type IconName } from '../icons/Icon';
import Button from '../ui/Button';

const steps: { icon: IconName; title: string; body: string }[] = [
  { icon: 'play', title: 'guide.1.title', body: 'guide.1.body' },
  { icon: 'brief', title: 'guide.2.title', body: 'guide.2.body' },
  { icon: 'checkin', title: 'guide.3.title', body: 'guide.3.body' },
  { icon: 'note', title: 'guide.4.title', body: 'guide.4.body' },
];

const GuideContext = createContext<() => void>(() => {});
export const useDemoGuide = () => useContext(GuideContext);

/** 4-step "How this demo works" guide in a native modal <dialog>
 * (Escape, focus trap and backdrop come from the browser). */
export function DemoGuideProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const current = steps[step];
  const last = step === steps.length - 1;

  return <GuideContext.Provider value={() => { setStep(0); setOpen(true); }}>
    {children}
    <dialog ref={ref} onClose={() => setOpen(false)} aria-labelledby="guide-title" className="modal w-[min(30rem,calc(100vw-2rem))] rounded-2xl border border-default bg-card p-0 text-primary shadow-xl">
      {open && <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">{t('guide.progress', { step: step + 1, total: steps.length })}</p>
          <button type="button" onClick={() => setOpen(false)} aria-label={t('Close guide')} className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary hover:bg-card-raised hover:text-primary">
            <Icon name="close" />
          </button>
        </div>
        <div key={step} className="motion-mount">
          <span className="mt-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name={current.icon} /></span>
          <h2 id="guide-title" className="mt-4 text-xl font-semibold">{t('How this demo works')}: {t(current.title)}</h2>
          <p className="mt-3 text-sm leading-6 text-secondary">{t(current.body)}</p>
        </div>
        <div className="mt-6 flex items-center gap-1.5" aria-hidden>
          {steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-card-raised'}`} />)}
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}><Icon name="arrow-left" size={18} />{t('Back')}</Button>
          <Button variant="primary" autoFocus onClick={() => (last ? setOpen(false) : setStep(step + 1))}>{t(last ? 'Done' : 'Next')}{!last && <Icon name="arrow" size={18} />}</Button>
        </div>
      </div>}
    </dialog>
  </GuideContext.Provider>;
}
