import { useDemo } from './DemoProvider';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';

export function DemoStatusChip() {
  const { active } = useDemo();
  const { t } = useI18n();
  if (!active) return null;
  return <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent-review/40 bg-accent-review/10 px-3 text-xs font-medium text-accent-review"><Icon name="info" size={14} />{t('Demo — Synthetic Data')}</span>;
}
