import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import axios from '../../api/axios';
import MessageBubble from './MessageBubble';
import QuickOptions from './QuickOptions';

/**
 * ChatWindow - Main chat UI component.
 * Displays conversation history, handles user input and option selection.
 * Integrates with backend /api/chat endpoints.
 * Shows typing indicator while awaiting Gemini response.
 * 
 * Mock Mode:
 * Set REACT_APP_USE_CHAT_MOCK=true in .env to use canned responses for development.
 * Useful for frontend testing without backend dependency.
 */

const MOCK_RESPONSES = [
  {
    text: 'Hello! I\'m BudgetPilot, your financial advisor. Let\'s help you manage your money better.',
    options: ['Review my budget', 'Track expenses', 'Plan savings goal', 'Get AI advice']
  },
  {
    text: 'Great! Let\'s review your spending patterns from the last 3 months.',
    options: ['Show summary', 'Detailed breakdown', 'Compare months']
  },
  {
    text: 'Your total spending is trending upward. I recommend setting savings alerts.',
    options: ['Set alert', 'View recommendations', 'Continue chat']
  },
];

let mockResponseIndex = 0;

const getCannedResponse = () => {
  const response = MOCK_RESPONSES[mockResponseIndex % MOCK_RESPONSES.length];
  mockResponseIndex++;
  return response;
};

export default function ChatWindow({ onClose }) {
  const { token } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const useMockMode = import.meta.env.VITE_USE_CHAT_MOCK === 'true';

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize chat on mount
  useEffect(() => {
    if (!token && !useMockMode) return;

    // Check localStorage for existing conversation
    const savedConvId = localStorage.getItem('chatConversationId');
    if (useMockMode) {
      startMockConversation();
    } else if (savedConvId) {
      fetchConversation(savedConvId);
    } else {
      startNewConversation();
    }
  }, [token, useMockMode]);

  // Start mock conversation (development mode)
  const startMockConversation = () => {
    mockResponseIndex = 0;
    const mockResponse = getCannedResponse();
    const assistantMsg = {
      role: 'assistant',
      text: mockResponse.text,
      options: mockResponse.options,
      timestamp: new Date().toISOString(),
    };
    setConversationId('mock-conv-123');
    setMessages([assistantMsg]);
  };

  // Fetch existing conversation
  const fetchConversation = async (convId) => {
    try {
      const response = await axios.get(`/api/chat/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationId(convId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      showToast('Failed to load conversation', 'error');
      startNewConversation();
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        '/api/chat/start',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { conversationId: newConvId, assistantMessage } = response.data;
      setConversationId(newConvId);
      localStorage.setItem('chatConversationId', newConvId);
      setMessages([assistantMessage]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      showToast('Failed to start chat', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Send user message or selected option (mock or real)
  const handleSendMessage = async () => {
    if (!conversationId || (!inputText.trim() && !selectedOption)) return;

    const userMessageText = selectedOption || inputText;
    const userMsg = {
      role: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInputText('');
    setSelectedOption(null);

    if (useMockMode) {
      // Simulate network delay
      setTimeout(() => {
        const mockResponse = getCannedResponse();
        const assistantMsg = {
          role: 'assistant',
          text: mockResponse.text,
          options: mockResponse.options,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
      }, 800);
    } else {
      try {
        const response = await axios.post(
          `/api/chat/${conversationId}/message`,
          { text: userMessageText, option: selectedOption ? true : undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages((prev) => [...prev, response.data.assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const lastMessage = messages[messages.length - 1];
  const hasOptions = lastMessage && lastMessage.options && lastMessage.options.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-orange_peel text-white px-4 py-3 flex items-center justify-between">
        <h2 className="font-bold text-lg">BudgetPilot Chat {useMockMode && '(Mock)'}</h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-orange-600 rounded px-2 py-1 text-lg"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with BudgetPilot!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg w-fit">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Options Section - Show if last message has options */}
      {hasOptions && !isLoading && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <QuickOptions
            options={lastMessage.options}
            onSelect={(option) => {
              setSelectedOption(option);
              handleSendMessage();
            }}
          />
        </div>
      )}

      {/* Input Section */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isLoading || hasOptions}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange_peel focus:ring-1 focus:ring-orange_peel disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputText.trim() && !selectedOption)}
            className="bg-orange_peel text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
