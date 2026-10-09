import { useI18n } from "./i18n/LanguageProvider";
import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CrewSelectPage from './components/layout/CrewSelectPage';

const BriefScreen = lazy(() => import('./screens/BriefScreen').then((m) => ({ default: m.BriefScreen })));
const CheckinScreen = lazy(() => import('./screens/CheckinScreen'));

export default function AppRoutes() {
  const { t, language, date } = useI18n();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CrewSelectPage />} />
        <Route path="/crew/:crewId" element={<BriefScreen />} />
        <Route path="/crew/:crewId/checkin" element={<CheckinScreen />} />
        <Route path="*" element={<p className="font-mono text-sm text-neutral-500">{t("Page not found.")}</p>} />
      </Route>
    </Routes>
  );
}
