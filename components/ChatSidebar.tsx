
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Loader2, MessageSquare, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, AIConfig, CustomDeck } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  content: string | null;
  activeDeckId: string;
  customDecks: CustomDeck[];
  aiConfig: AIConfig;
  onInterpret: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  isLoading,
  content,
  aiConfig,
  onInterpret
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial content (interpretation) to chat
  useEffect(() => {
    if (content && messages.length === 0) {
        setMessages([{ role: 'model', message: content }]);
    } else if (content && messages.length > 0 && messages[0].message !== content) {
        // If content changed drastically (new reading), reset
        setMessages([{ role: 'model', message: content }]);
    }
  }, [content]);

  // Restore history if available
  useEffect(() => {
      if (aiConfig.chatHistory && aiConfig.chatHistory.length > 0 && messages.length === 0) {
          setMessages(aiConfig.chatHistory);
      }
  }, [aiConfig.chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
      if (!input.trim()) return;
      const userMsg: ChatMessage = { role: 'user', message: input };
      const newHistory = [...messages, userMsg];
      setMessages(newHistory);
      setInput('');
      setIsSending(true);

      try {
          const response = await chatWithGemini(messages, input, aiConfig);
          const aiMsg: ChatMessage = { role: 'model', message: response };
          setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSending(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-mystic-900/95 border-l border-gold-500/20 shadow-2xl backdrop-blur-md z-[100] flex flex-col transition-transform duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="h-16 px-4 border-b border-white/10 flex justify-between items-center bg-mystic-950/50 shrink-0">
        <div className="flex items-center gap-2 text-gold-400">
           <Bot size={20} />
           <h3 className="font-serif font-bold text-sm uppercase tracking-wider">Oráculo Digital</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
             <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
         {/* Empty State / Interpret Button */}
         {messages.length === 0 && !isLoading && (
             <div className="h-full flex flex-col items-center justify-center text-center gap-6 p-6 opacity-80">
                 <Sparkles size={48} className="text-gold-500 animate-pulse" />
                 <div>
                     <h4 className="text-gold-100 font-serif font-bold text-lg mb-2">Pronto para Interpretar?</h4>
                     <p className="text-sm text-gray-400">As cartas estão na mesa. Clique abaixo para receber a leitura completa.</p>
                 </div>
                 <button 
                    onClick={onInterpret}
                    className="bg-gold-600 hover:bg-gold-500 text-mystic-900 px-8 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all transform hover:scale-105"
                 >
                    Interpretar Tiragem
                 </button>
             </div>
         )}

         {isLoading && (
             <div className="flex flex-col items-center justify-center py-10 gap-4">
                 <Loader2 className="animate-spin text-gold-500" size={32} />
                 <p className="text-xs text-gold-300/70 animate-pulse uppercase tracking-widest">Conectando...</p>
             </div>
         )}

         {messages.map((msg, idx) => (
             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`
                    max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg
                    ${msg.role === 'user' 
                        ? 'bg-mystic-700 text-white rounded-tr-sm' 
                        : 'bg-gradient-to-br from-mystic-800 to-mystic-900 border border-gold-500/20 text-gray-200 rounded-tl-sm'}
                 `}>
                    {msg.role === 'model' ? (
                        <div className="prose prose-invert prose-gold prose-sm max-w-none">
                            <ReactMarkdown>{msg.message}</ReactMarkdown>
                        </div>
                    ) : (
                        msg.message
                    )}
                 </div>
             </div>
         ))}
         
         {isSending && (
             <div className="flex justify-start">
                 <div className="bg-mystic-800 rounded-2xl p-3 flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                 </div>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {(messages.length > 0 || isLoading) && (
          <div className="p-4 bg-mystic-950/80 border-t border-white/5 backdrop-blur-sm">
             <div className="relative flex items-center gap-2">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isSending || isLoading}
                    placeholder="Faça uma pergunta sobre a leitura..."
                    className="w-full bg-mystic-800 border border-mystic-600 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:border-gold-500 focus:outline-none shadow-inner"
                 />
                 <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || isLoading}
                    className="absolute right-2 p-2 bg-gold-600 hover:bg-gold-500 text-mystic-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                     <Send size={16} />
                 </button>
             </div>
          </div>
      )}
    </div>
  );
};
