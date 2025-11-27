
import React from 'react';
import { X, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InterpretationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  content: string | null;
}

export const InterpretationSidebar: React.FC<InterpretationSidebarProps> = ({
  isOpen,
  onClose,
  isLoading,
  content
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-[72px] bottom-0 w-96 bg-mystic-900/95 border-l border-gold-500/20 shadow-2xl backdrop-blur-md z-30 flex flex-col transition-transform duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-mystic-950/50">
        <div className="flex items-center gap-2 text-gold-400">
           <Sparkles size={18} />
           <h3 className="font-serif font-bold text-sm uppercase tracking-wider">Interpretação</h3>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
             <X size={18} />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
         {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-mystic-400 opacity-70">
               <Loader2 className="animate-spin text-gold-500" size={32} />
               <p className="text-sm animate-pulse">Consultando os oráculos...</p>
            </div>
         ) : content ? (
            <div className="prose prose-invert prose-gold prose-sm max-w-none text-gray-200 leading-relaxed">
               <ReactMarkdown>{content}</ReactMarkdown>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-mystic-500 opacity-50">
               <MessageSquare size={32} />
               <p className="text-sm text-center px-4">
                 Nenhuma interpretação disponível.<br/>
                 Clique em "Interpretar" na barra superior.
               </p>
            </div>
         )}
      </div>
    </div>
  );
};
