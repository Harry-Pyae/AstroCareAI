import { useI18n } from "../../i18n/LanguageProvider";
import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Brand, NavList, icons } from './Nav';
import TopBar from './TopBar';

export default function Layout() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
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
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col gap-6 border-r border-default bg-card px-2 py-4 md:flex min-[1025px]:w-56 min-[1025px]:px-3">
        <Brand collapsible />
        <nav aria-label={t("Main")}>
          <NavList collapsible />
        </nav>
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
              {icons.close}
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
          <Suspense fallback={<p className="font-mono text-sm text-secondary">{t("Loading…")}</p>}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="border-t border-default px-4 py-3 text-center font-mono text-xs text-secondary md:px-8">
          {t('Synthetic demonstration data — not medical advice.')}
        </footer>
      </div>
    </div>
  );
}
