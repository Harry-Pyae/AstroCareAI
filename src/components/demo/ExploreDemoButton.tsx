import { useDemo } from './DemoProvider';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import { useNavigate } from 'react-router-dom';

export function ExploreDemoButton() {
  const { active, enter } = useDemo();
  const { t } = useI18n();
  const navigate = useNavigate();
  if (active) return null;
  return <button type="button" onClick={() => { if (enter('reviewing')) navigate('/crew/ac-cmdr-01'); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-on-accent focus-ring hover:opacity-90"><Icon name="arrow" size={18} />{t('Explore Demo')}</button>;
}
