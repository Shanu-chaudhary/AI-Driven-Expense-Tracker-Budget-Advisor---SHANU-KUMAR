import React from 'react';

/**
 * QuickOptions - Renders clickable option buttons for guided conversation flow.
 * Each option is a pill-shaped button with mint_green background.
 * Clicking an option sends it as a user message to the backend.
 */
export default function QuickOptions({ options, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option)}
          className="px-3 py-2 bg-mint_green text-gray-900 rounded-full text-sm font-medium hover:bg-green-400 active:bg-green-500 transition-colors shadow-sm"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
