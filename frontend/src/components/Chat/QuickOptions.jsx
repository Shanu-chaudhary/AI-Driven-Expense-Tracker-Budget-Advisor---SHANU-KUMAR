import React from 'react';

/**
 * QuickOptions - Renders clickable option buttons for guided conversation flow.
 * Each option is a pill-shaped button with mint_green background.
 * Clicking an option sends it as a user message to the backend.
 */
export default function QuickOptions({ options, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option)}
          className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-xs font-medium hover:from-blue-700 hover:to-cyan-600 active:from-blue-800 active:to-cyan-700 transition-all shadow-sm"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
