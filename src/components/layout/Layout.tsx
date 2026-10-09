import { useI18n } from "../../i18n/LanguageProvider";
import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Brand, NavList } from './Nav';
import TopBar from './TopBar';
import { getUiPref, setUiPref } from '../../lib/storage';
import Icon from '../icons/Icon';

/** Shape-of-the-page placeholder while a route loads (pulse off under reduced motion). */
function PageSkeleton({ label }: { label: string }) {
  const block = 'skeleton rounded-xl bg-card-raised';
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
  const { t, language } = useI18n();
  const mainRef = useRef<HTMLElement>(null);
  const firstLanguage = useRef(language);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeMobileDrawer = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeMobileDrawer);
    return () => desktop.removeEventListener('change', closeMobileDrawer);
  }, []);

  // Brief crossfade when the language changes (skipped on load and under reduced motion).
  useEffect(() => {
    if (language === firstLanguage.current) return;
    firstLanguage.current = language;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const styles = getComputedStyle(document.documentElement);
    mainRef.current?.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: Number.parseFloat(styles.getPropertyValue('--dur-base')) || 200, easing: styles.getPropertyValue('--ease').trim() || 'ease' });
  }, [language]);

  useEffect(() => {
    if (drawerRef.current) drawerRef.current.inert = !menuOpen;
    if (!menuOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (contentRef.current) contentRef.current.inert = true;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        setMenuOpen(false);
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (contentRef.current) contentRef.current.inert = false;
      previousFocus?.focus();
    };
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
      <div ref={drawerRef} className="drawer fixed inset-0 z-40 md:hidden" data-open={menuOpen} role="dialog" aria-modal="true" aria-hidden={!menuOpen} aria-label={t("Navigation")}>
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

      <div ref={contentRef} className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main ref={mainRef} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
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
