import { lazy, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CrewSelectPage from './components/layout/CrewSelectPage';

// Screens are built in parallel by P3/P4. Glob so a not-yet-merged screen
// renders a placeholder instead of breaking the build.
const screens = import.meta.glob<Record<string, ComponentType>>('./screens/*.tsx');

function screen(name: string): ComponentType {
  const load = screens[`./screens/${name}.tsx`];
  if (!load) return () => <Placeholder name={name} />;
  return lazy(() => load().then((m) => ({ default: m.default ?? m[name] })));
}

const BriefScreen = screen('BriefScreen');
const CheckinScreen = screen('CheckinScreen');

function Placeholder({ name }: { name: string }) {
  return (
    <p className="font-mono text-sm text-neutral-500">
      {name} not merged yet.
    </p>
  );
}

const loading = <p className="font-mono text-sm text-neutral-500">Loading…</p>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CrewSelectPage />} />
        <Route path="/crew/:crewId" element={<BriefScreen />} />
        <Route path="/crew/:crewId/checkin" element={<CheckinScreen />} />
        <Route path="*" element={<Placeholder name="Page" />} />
      </Route>
    </Routes>
  );
}
