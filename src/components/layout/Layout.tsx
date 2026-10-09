import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { resetAll } from '../../lib/storage';

function resetDemo() {
  try {
    localStorage.clear();
  } catch {
    // storage unavailable — nothing to clear
  }
  location.reload();
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-200">
      <header className="flex items-center justify-between border-b border-neutral-800 px-8 py-4">
        <Link to="/" className="font-mono text-lg tracking-widest text-amber-400">
          ASTROCARE <span className="text-neutral-500">· BASELINE BRIEF</span>
        </Link>
        <button
          onClick={resetDemo}
          className="rounded border border-neutral-700 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:border-amber-400 hover:text-amber-400"
        >
          Reset demo
        </button>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-10">
        <Suspense fallback={<p className="font-mono text-sm text-neutral-500">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-neutral-800 px-8 py-3 text-center font-mono text-xs text-neutral-500">
        Synthetic demonstration data — not medical advice.
      </footer>
    </div>
  );
}
