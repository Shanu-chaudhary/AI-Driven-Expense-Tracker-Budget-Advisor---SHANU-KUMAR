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
        className={`max-w-xs px-2.5 py-1.5 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-slate-100 text-slate-900 rounded-bl-none'
        }`}
      >
        <p className="text-xs leading-relaxed">{message.text}</p>
        <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-slate-600'} block mt-0.5`}>
          {timestamp}
        </span>

        {/* Show options if this is an assistant message with options */}
        {!isUser && message.options && message.options.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {message.options.map((opt, idx) => (
              <button
                key={idx}
                className="block w-full text-left text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors font-medium"
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
