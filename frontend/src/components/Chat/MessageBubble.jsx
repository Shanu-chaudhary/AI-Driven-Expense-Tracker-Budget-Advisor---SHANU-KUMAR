import React from 'react';

/**
 * MessageBubble - Renders a single message in the chat.
 * User messages appear on right with blue background.
 * Assistant messages appear on left with gray background.
 * Includes timestamp and optional options display.
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs px-3 py-2 rounded-lg ${
          isUser
            ? 'bg-light_sea_green text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-600'} block mt-1`}>
          {timestamp}
        </span>

        {/* Show options if this is an assistant message with options */}
        {!isUser && message.options && message.options.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.options.map((opt, idx) => (
              <button
                key={idx}
                className="block w-full text-left text-xs bg-mint_green text-gray-900 px-2 py-1 rounded hover:bg-green-400 transition-colors font-medium"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
