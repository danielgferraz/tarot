
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, Tag, Bot } from 'lucide-react';
import { AIConfig } from '../types';

interface SessionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (newConfig: AIConfig) => void;
}

export const AISettingsModal: React.FC<SessionConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [systemInstruction, setSystemInstruction] = useState(config.systemInstruction);
  const [contextFiles, setContextFiles] = useState<{ name: string; content: string }[]>(config.contextFiles);
  const [sessionName, setSessionName] = useState(config.sessionName || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: { name: string; content: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      newFiles.push({ name: file.name, content: text });
    }

    setContextFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setContextFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ 
      ...config,
      systemInstruction, 
      contextFiles, 
      sessionName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-mystic-900 border border-gold-500/30 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-mystic-800/50">
          <div className="flex items-center gap-3">
            <Bot className="text-gold-400" size={24} />
            <h3 className="text-xl font-serif text-gold-100">Configuração da Sessão</h3>
          </div>
          <button onClick={onClose} className="text-mystic-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
          
           {/* Session Name */}
           <div className="bg-mystic-800/50 p-4 rounded-lg border border-gold-500/10">
            <label className="block text-gold-300 text-sm font-bold mb-2 flex items-center gap-2">
              <Tag size={14} /> Nome da Leitura / Sessão
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Identifique esta leitura para salvá-la no histórico do cliente.
            </p>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full bg-mystic-900 border border-mystic-600 rounded-md p-2 text-sm text-gray-200 focus:border-gold-500 focus:outline-none"
              placeholder="Ex: Amor e Carreira 2024"
            />
          </div>

          {/* Prompt Section */}
          <div>
            <label className="block text-gold-300 text-sm font-bold mb-2">
              Prompt Individual (Personalidade da IA para esta leitura)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Você pode instruir a IA a focar em amor, finanças, ser mais direta ou mais espiritual.
            </p>
            <textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full h-32 bg-mystic-800 border border-mystic-600 rounded-md p-3 text-sm text-gray-200 focus:border-gold-500 focus:outline-none resize-none"
              placeholder="Ex: Aja como um terapeuta junguiano focado em autoconhecimento..."
            />
          </div>

          {/* Context Upload Section */}
          <div>
            <label className="block text-gold-300 text-sm font-bold mb-2">
              Contexto Adicional (Arquivos de Texto)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Adicione notas sobre o cliente ou guias específicos para ajudar a IA.
            </p>
            
            <div className="grid grid-cols-1 gap-2 mb-3">
              {contextFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-mystic-800 p-2 rounded border border-mystic-700">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="text-gold-500 shrink-0" />
                    <span className="text-xs text-gray-300 truncate">{file.name}</span>
                  </div>
                  <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <input 
              type="file" 
              multiple 
              accept=".txt,.md,.json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-mystic-500 rounded-md text-mystic-400 hover:text-gold-300 hover:border-gold-500 transition-colors bg-mystic-800/30 hover:bg-mystic-800/50"
            >
              <Upload size={18} />
              <span>Adicionar Arquivo</span>
            </button>
          </div>

        </div>

        <div className="p-4 border-t border-white/10 bg-mystic-900 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-mystic-900 font-bold rounded-md transition-colors text-sm"
          >
            Aplicar à Sessão
          </button>
        </div>
      </div>
    </div>
  );
};
