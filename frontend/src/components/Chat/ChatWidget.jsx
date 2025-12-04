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
    <>
      {/* Background Blur Overlay - shown when chat is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat overlay"
        />
      )}

      {/* Chat Window - Centered on screen */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="w-96 h-[600px] rounded-lg shadow-2xl relative pointer-events-auto">
            <ChatWindow onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Floating Action Button - Bottom Right */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-2xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50"
        aria-label={isOpen ? 'Close chat' : 'Open BudgetPilot Chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  );
}
