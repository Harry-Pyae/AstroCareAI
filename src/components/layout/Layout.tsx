import { useI18n } from "../../i18n/LanguageProvider";
import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Brand, NavList } from './Nav';
import TopBar from './TopBar';
import { getUiPref, setUiPref } from '../../lib/storage';
import Icon from '../icons/Icon';

/** Shape-of-the-page placeholder while a route loads (pulse off under reduced motion). */
function PageSkeleton({ label }: { label: string }) {
  const block = 'animate-pulse rounded-xl bg-card-raised';
  return <div role="status" aria-label={label} className="space-y-6">
    <div className={`${block} h-4 w-40`} />
    <div className={`${block} h-9 w-72 max-w-full`} />
    <div className={`${block} h-4 w-56`} />
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6"><div className={`${block} h-64`} /><div className={`${block} h-48`} /></div>
      <div className="space-y-6"><div className={`${block} h-40`} /><div className={`${block} h-56`} /></div>
    </div>
  </div>;
}

export default function Layout() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(() => getUiPref('sidebar') === 'collapsed');
  function toggleSidebar() {
    const next = !collapsed;
    document.documentElement.dataset.sidebar = next ? 'collapsed' : 'expanded';
    setUiPref('sidebar', next ? 'collapsed' : 'expanded');
    setCollapsed(next);
  }
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-page text-primary">
      {/* Icons-only at ≤1024px, labels above; hidden on mobile (sheet instead). */}
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col gap-6 border-r border-default bg-card px-2 py-4 md:flex min-[1025px]:w-56 min-[1025px]:px-3 min-[1025px]:[html[data-sidebar=collapsed]_&]:w-16 min-[1025px]:[html[data-sidebar=collapsed]_&]:px-2 transition-[width] duration-[var(--dur-slow)] ease-[var(--ease)]">
        <Brand collapsible />
        <nav aria-label={t("Main")}>
          <NavList collapsible />
        </nav>
        {/* Only ≥1025px can expand; below that the rail/drawer applies. */}
        <button type="button" onClick={toggleSidebar} aria-label={t(collapsed ? 'Expand sidebar' : 'Collapse sidebar')} title={t(collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          className="mt-auto hidden min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-secondary hover:bg-card-raised hover:text-primary min-[1025px]:flex min-[1025px]:[html[data-sidebar=collapsed]_&]:justify-center">
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
          <span className="truncate min-[1025px]:[html[data-sidebar=collapsed]_&]:sr-only">{t(collapsed ? 'Expand sidebar' : 'Collapse sidebar')}</span>
        </button>
      </aside>

      {/* Mobile drawer: always mounted so it can slide out; hidden (and out of the
          tab order) via .drawer[data-open=false] once the slide finishes. */}
      <div className="drawer fixed inset-0 z-40 md:hidden" data-open={menuOpen} role="dialog" aria-modal="true" aria-label={t("Navigation")}>
        <button type="button" tabIndex={-1} aria-label={t("Close navigation")} className="drawer-backdrop absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
        <div className="drawer-panel relative flex h-full w-64 flex-col gap-6 border-r border-default bg-card p-4">
          <div className="flex items-center justify-between">
            <Brand collapsible={false} />
            <button
              ref={closeRef}
              type="button"
              aria-label={t("Close navigation")}
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary hover:text-primary"
            >
              <Icon name="close" />
            </button>
          </div>
          <nav aria-label={t("Main")}>
            <NavList collapsible={false} />
          </nav>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Suspense fallback={<PageSkeleton label={t("Loading…")} />}>
            <div key={pathname} className="motion-page"><Outlet /></div>
          </Suspense>
        </main>
        <footer className="border-t border-default px-4 py-3 text-center font-mono text-xs text-secondary md:px-8">
          {t('Synthetic demonstration data — not medical advice.')}
        </footer>
      </div>
    </div>
  );
}
