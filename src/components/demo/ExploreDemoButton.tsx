import React from 'react';
import { useDemo } from './DemoProvider';

export const ExploreDemoButton: React.FC = () => {
  const { setScenario, isActive } = useDemo();

  // Hide button if already in demo mode
  if (isActive) return null;

  const handleExplore = () => {
    // Enter demo mode in scenario (b) "review" for strongest first impression
    setScenario('review');
  };

  return (
    <button
      onClick={handleExplore}
      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-6 py-3 rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <span className="text-xl">✨</span> Explore Demo
    </button>
  );
};
