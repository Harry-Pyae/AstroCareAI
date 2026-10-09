import React from 'react';
import { useDemo } from './DemoProvider';

export function ExploreDemoEntry() {
  const { active, enter } = useDemo();

  if (active) return null;

  return (
    <div className="mt-8 rounded-xl border border-default bg-page p-6 text-center shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-primary">Try the Judge Demo</h3>
      <p className="mb-4 text-sm text-secondary">
        Explore interactive scenarios with synthetic data. No real records will be affected.
      </p>
      <button
        onClick={() => enter('reviewing')}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-review px-6 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <span aria-hidden="true">✨</span> Explore Demo
      </button>
    </div>
  );
}
