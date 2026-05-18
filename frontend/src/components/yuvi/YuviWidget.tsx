import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/authStore';
import './YuviWidget.css';

interface Message {
  role: 'user' | 'model';
  content: string;
}

// Assuming we receive this globally from the Dashboard context or local storage
// In a real app, this would be passed via a context provider
interface YuviWidgetProps {
  farmState: any;
}

const YuviWidget: React.FC<YuviWidgetProps> = ({ farmState }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm YUVI, your personal Farm Assistant. How can I help you with your crop today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const suggestions = [
    "Should I irrigate today?",
    "Why is growth slow?",
    "What's my yield gap?",
    "What should I do this week?"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003';
      const response = await fetch(`${baseUrl}/api/v1/yuvi/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.uid || "guest",
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          farm_state: farmState || {}
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages([...newMessages, { role: 'model', content: data.reply }]);
      } else {
        throw new Error(data.detail || "Failed to get response");
      }
    } catch (error) {
      console.error("YUVI Error:", error);
      setMessages([...newMessages, { role: 'model', content: "I'm having trouble connecting to the network right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDynamicGreeting = () => {
    const crop = farmState?.crop || 'crop';
    const gap = farmState?.insights?.yield_gap;
    if (gap) {
       return `Monitoring your ${crop} • Yield Gap: ${gap}`;
    }
    return `Monitoring your ${crop} closely.`;
  };

  return (
    <>
      {!isOpen && (
        <div 
          className="yuvi-fab pulsing" 
          onClick={() => setIsOpen(true)}
          title="Talk to YUVI"
        >
          <MessageSquare size={24} />
        </div>
      )}

      {isOpen && (
        <div className="yuvi-panel">
          <div className="yuvi-header">
            <div className="yuvi-greeting">
              <h3>
                <Bot size={18} /> YUVI Assistant
              </h3>
              <p>{getDynamicGreeting()}</p>
            </div>
            <button className="btn-close-yuvi" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="yuvi-suggestions">
            {suggestions.map((sug, idx) => (
              <div 
                key={idx} 
                className="suggestion-pill"
                onClick={() => handleSend(sug)}
              >
                {sug}
              </div>
            ))}
          </div>

          <div className="yuvi-chat-area">
            {messages.map((msg, idx) => (
              <div key={idx} className={`yuvi-msg ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="yuvi-msg model">
                <div className="msg-avatar"><Bot size={16} /></div>
                <div className="msg-bubble">
                  <Loader2 size={16} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="yuvi-input-area">
            <input 
              type="text" 
              className="yuvi-input" 
              placeholder="Ask YUVI about your farm..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            />
            <button 
              className="btn-send" 
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default YuviWidget;
