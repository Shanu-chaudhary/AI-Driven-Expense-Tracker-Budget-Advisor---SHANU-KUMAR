import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import axios from '../../api/axios';
import MessageBubble from './MessageBubble';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * ChatWindow - Conversational AI Financial Advisor
 * 
 * Features:
 * - Free-form user input (no questionnaire steps)
 * - Initial suggestions displayed in first message
 * - Sends complete transaction context to Gemini
 * - Inline options within messages (not separate panel)
 * - Persistent conversation with full financial data
 * - Real-time transaction data updates
 */

export default function ChatWindow({ onClose }) {
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  
  const token = authContext?.token || localStorage.getItem('token');
  const showToast = toastContext?.showToast || ((msg, type) => console.log(msg, type));
  const useMockMode = import.meta.env.VITE_USE_CHAT_MOCK === 'true';
  
  console.log('[ChatWindow] Token available:', !!token, 'Mock mode:', useMockMode);

  // Chat state
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);

  // User data
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load user's transaction data on mount
  useEffect(() => {
    loadUserTransactions();
  }, [token]);

  const loadUserTransactions = async () => {
    if (!token || useMockMode) {
      // Initialize with empty state for demo
      initializeChat();
      return;
    }

    try {
      setTransactionsLoading(true);
      const txnResponse = await axios.get('/transactions');
      const transactions = txnResponse.data || [];
      setAllTransactions(transactions);
      
      // Calculate financial summary
      calculateSummary(transactions);
      
      console.log('Loaded transactions:', transactions.length);
      
      // Initialize chat with welcome message
      initializeChat();
    } catch (error) {
      console.error('Error loading transactions:', error.message);
      showToast('Unable to load transaction data', 'info');
      initializeChat();
    } finally {
      setTransactionsLoading(false);
    }
  };

  const calculateSummary = (transactions) => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    transactions.forEach(txn => {
      if (txn.type?.toLowerCase() === 'income') {
        totalIncome += txn.amount || 0;
      } else if (txn.type?.toLowerCase() === 'expense') {
        totalExpense += txn.amount || 0;
        const cat = txn.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (txn.amount || 0);
      }
    });

    setFinancialSummary({
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      netSavings: (totalIncome - totalExpense).toFixed(2),
      categoryTotals,
      transactionCount: transactions.length,
    });
  };

  // Initialize chat with welcome and initial suggestions
  const initializeChat = async () => {
    try {
      if (useMockMode || !token) {
        // Mock mode - just show welcome message
        const welcomeMsg = {
          role: 'assistant',
          text: `👋 Welcome to BudgetPilot! I'm your financial advisor. How can I help you today?

Here are some things I can help with:`,
          options: [
            'Analyze my spending report',
            'Give me budget suggestions',
            'Check budget alerts'
          ],
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMsg]);
        return;
      }

      // Real mode - start conversation via API
      const response = await axios.post('/chat/start', { message: 'Start conversation' });
      const newConvId = response.data.conversationId || response.data.conversation?.id;
      if (newConvId) setConversationId(newConvId);

      // Build welcome message with initial suggestions
      const assistantMsg = response.data.assistantMessage || response.data.assistantMessage || {};
      const welcomeMsg = {
        role: 'assistant',
        text: assistantMsg.text || `👋 Welcome to BudgetPilot! I'm your financial advisor. How can I help you today?

Here are some things I can help with:`,
        options: [
          'Analyze my spending report',
          'Give me budget suggestions',
          'Check budget alerts'
        ],
        timestamp: new Date().toISOString(),
      };

      setMessages([welcomeMsg]);
    } catch (error) {
      console.error('Error initializing chat:', error, error?.response?.data || 'no response body');
      // Fallback to welcome message
      const welcomeMsg = {
        role: 'assistant',
        text: `👋 Welcome to BudgetPilot! I'm your AI financial advisor.

What would you like to explore?`,
        options: [
          'Analyze my spending',
          'Budget suggestions',
          'Spending trends'
        ],
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    }
  };

  // Handle option/suggestion selection - send to chat
  const handleOptionSelect = (option) => {
    handleSendMessage(option);
  };

  // Send user message to chat
  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || userInput.trim();
    
    if (!textToSend) return;

    // Clear input
    setUserInput('');

    // Add user message to chat
    const userMsg = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsLoading(true);

    try {
      if (useMockMode || !token) {
        // Mock response
        setTimeout(() => {
          const mockResponses = {
            'analyze': `📊 **Your Spending Analysis**\n\nBased on your transactions, here's what I found:\n\n**Top Spending Categories:**\n• Food & Dining: ₹2,450\n• Transportation: ₹1,890\n• Shopping: ₹3,220\n\n**Insights:**\n✓ Your spending has increased by 12% this month\n✓ Food & Dining is your highest expense\n✓ Consider setting category budgets\n\nWhat else would you like to know?`,
            'budget': `💡 **Budget Suggestions**\n\nHere are personalized recommendations:\n\n1. **Reduce Shopping Costs**\n   - Current: ₹3,220/month\n   - Suggested: ₹2,500/month\n   - Potential savings: ₹720\n\n2. **Food & Dining**\n   - Track spending more carefully\n   - Consider meal planning\n\n3. **Create Emergency Fund**\n   - Save 20% of income monthly\n\nWould you like more detailed suggestions?`,
            'alert': `⚠️ **Budget Alerts**\n\n**Active Alerts:**\n• Shopping exceeded budget by 28%\n• Entertainment spending trending up\n\n**Recommendations:**\n✓ Review recent shopping transactions\n✓ Set stricter spending limits\n✓ Review entertainment expenses\n\nWould you like help creating a budget?`,
          };

          let response = `I understand you asked about "${textToSend}". Here's my analysis:\n\n📈 You have been spending consistently. Keep monitoring your expenses!\n\nAnything else I can help with?`;
          
          for (const [key, value] of Object.entries(mockResponses)) {
            if (textToSend.toLowerCase().includes(key)) {
              response = value;
              break;
            }
          }

          const assistantMsg = {
            role: 'assistant',
            text: response,
            options: ['Analyze my spending', 'Budget tips', 'Set budgets'],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }, 800);
        setIsLoading(false);
        return;
      }

      // Real API call
      if (!conversationId) {
        // Start new conversation
        const startResponse = await axios.post(
          '/chat/start',
          { message: textToSend }
        );
        const newConvId = startResponse.data.conversationId || startResponse.data.conversation?.id;
        if (newConvId) setConversationId(newConvId);

        const assistantMsg = {
          role: 'assistant',
          text: startResponse.data.assistantMessage?.text || 'Got it! Let me analyze your data.',
          options: ['Analyze my spending', 'Budget tips', 'Set budgets'],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Continue existing conversation
        const response = await axios.post(
          `/chat/${conversationId}/message`,
          { 
            text: textToSend,
            option: null
          }
        );

        const assistantMsg = {
          role: 'assistant',
          text: response.data.assistantMessage?.text || 'Let me help you with that.',
          options: response.data.assistantMessage?.options || [],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error, error?.response?.data || 'no response body');
      // If backend returned an error message, surface it in the chat for debugging
      const backendError = error?.response?.data?.error || error?.response?.data || error.message;
      showToast('Error sending message: ' + (typeof backendError === 'string' ? backendError : 'See chat.'), 'info');

      const errorText = typeof backendError === 'string'
        ? `❌ ${backendError}`
        : `❌ Unable to process your request. (${error.message})`;

      const errorMsg = {
        role: 'assistant',
        text: errorText,
        options: ['Try again', 'Go back'],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const hasOptions = lastMessage && lastMessage.options && lastMessage.options.length > 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden bp-fade-in">
      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div>
          <h2 className="font-bold text-base bp-gradient-text">💬 BudgetPilot Chat</h2>
        </div>
        <button onClick={onClose} className="text-slate-900 hover:bg-slate-200 rounded-lg px-2 py-1 text-lg transition" aria-label="Close chat">✕</button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-gradient-to-b from-white via-blue-50 to-slate-50">
        {messages.length === 0 ? (
          <div className="text-slate-600 py-6 text-center">
            <p className="text-xs">🚀 Loading chat...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx}>
              <MessageBubble message={msg} />
              {/* Inline options directly after message */}
              {msg.options && msg.options.length > 0 && msg.role === 'assistant' && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.options.map((option, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionSelect(option)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition border border-blue-300 truncate"
                      disabled={isLoading}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-1.5 p-2 bg-blue-100 border border-blue-300 rounded-lg w-fit">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* User Input Section */}
      <div className="px-3 py-3 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex gap-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && userInput.trim()) {
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything... (Ctrl+Enter to send)"
            className="flex-1 h-16 p-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 resize-none focus:outline-none focus:border-blue-400 placeholder-slate-400"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!userInput.trim() || isLoading}
            className="px-3 py-2 h-16"
          >
            ✈️
          </Button>
        </div>
      </div>
    </Card>
  );
}
