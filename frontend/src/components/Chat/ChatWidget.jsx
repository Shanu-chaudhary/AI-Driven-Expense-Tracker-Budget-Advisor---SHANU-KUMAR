import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

/**
 * ChatWidget - Floating button that toggles the chat window.
 * Positioned fixed at bottom-right. Uses orange_peel color for visibility.
 * Integrates into any page layout globally.
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window - shown when open */}
      {isOpen && (
        <div className="mb-4 w-96 h-96 rounded-lg shadow-2xl">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className="w-16 h-16 rounded-full bg-orange_peel text-white font-bold text-2xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open BudgetPilot Chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
