import React from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  content: string | null;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({ isOpen, onClose, isLoading, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-mystic-800 border border-gold-500/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-mystic-900/50">
          <div className="flex items-center gap-3">
            <Sparkles className="text-gold-400" size={24} />
            <h3 className="text-xl font-serif text-gold-100">Interpretação Mística</h3>
          </div>
          <button onClick={onClose} className="text-mystic-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-br from-mystic-800 to-mystic-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-mystic-300">
              <Loader2 className="animate-spin text-gold-500" size={48} />
              <p className="animate-pulse">Consultando os oráculos digitais...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-gold max-w-none text-gray-200 leading-relaxed">
              <ReactMarkdown>{content || "Nenhuma interpretação disponível."}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-mystic-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-mystic-700 hover:bg-mystic-600 text-white rounded-md transition-colors font-serif text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};