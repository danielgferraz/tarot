
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, ArrowLeft, Save, Plus, Layers, AlertTriangle, Settings, FileText, LayoutTemplate, Palette, Type, Edit2, X } from 'lucide-react';
import { DeckStyle, AIConfig, CustomDeck, CustomCard, PDFSettings } from '../types';
import { MAJOR_ARCANA } from '../constants';

interface SettingsPageProps {
  config: AIConfig;
  onSave: (newConfig: AIConfig) => void;
  onBack: () => void;
}

const DEFAULT_PDF_SETTINGS: PDFSettings = {
  theme: 'light',
  headerText: 'Leitura de Tarô',
  subHeaderText: 'Orientação Mística',
  showClientName: true,
  showDate: true,
  showCanvasSnapshot: true,
  showInterpretation: true,
  showIndividualSlots: false,
  footerText: 'Gerado por MysticTarot Canvas',
  pdfAccentColor: '#D4AF37',
  pdfFont: 'times'
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ config, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'decks' | 'pdf'>('decks');
  
  // Custom Decks State
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(config.customDecks || []);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  
  // PDF Settings State
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
      ...DEFAULT_PDF_SETTINGS,
      ...config.pdfSettings
  });
  
  // Card Creation State
  const [newCardName, setNewCardName] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCardImage, setNewCardImage] = useState<string | null>(null);
  const newCardImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setPdfSettings(prev => ({ ...prev, logoImage: reader.result as string })); };
    reader.readAsDataURL(file);
  };

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck: CustomDeck = { id: `deck-${Date.now()}`, name: newDeckName, cards: [] };
    setCustomDecks(prev => [...prev, newDeck]);
    setNewDeckName('');
    setEditingDeckId(newDeck.id);
  };

  const handleDeleteDeck = (id: string) => {
    if (window.confirm("Excluir este baralho e todas as suas cartas?")) {
      setCustomDecks(prev => prev.filter(d => d.id !== id));
      if (editingDeckId === id) setEditingDeckId(null);
    }
  };

  const handleNewCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onloadend = () => { setNewCardImage(reader.result as string); };
     reader.readAsDataURL(file);
  };

  const handleAddCardToDeck = () => {
    if (!editingDeckId || !newCardName.trim() || !newCardDesc.trim() || !newCardImage) {
      alert("Preencha o nome, a descrição e envie uma imagem para criar a carta.");
      return;
    }
    const newCard: CustomCard = { id: `custom-card-${Date.now()}`, name: newCardName, description: newCardDesc, image: newCardImage };
    setCustomDecks(prev => prev.map(deck => { if (deck.id === editingDeckId) { return { ...deck, cards: [...deck.cards, newCard] }; } return deck; }));
    setNewCardName(''); setNewCardDesc(''); setNewCardImage(null);
  };

  const removeCardFromDeck = (deckId: string, cardId: string) => {
    setCustomDecks(prev => prev.map(deck => { if (deck.id === deckId) { return { ...deck, cards: deck.cards.filter(c => c.id !== cardId) }; } return deck; }));
  };

  const handleSave = () => {
    onSave({
      ...config,
      customDecks,
      pdfSettings
    });
    alert("Configurações salvas com sucesso!");
  };

  // PDF Preview Component
  const PDFPreview = () => {
      const isDark = pdfSettings.theme === 'dark';
      const bgColor = isDark ? '#1A1025' : '#ffffff';
      const textColor = isDark ? '#ffffff' : '#000000';
      const secondaryColor = isDark ? '#BDB0D0' : '#666666';
      
      const fontFamily = pdfSettings.pdfFont === 'helvetica' ? 'sans-serif' : pdfSettings.pdfFont === 'courier' ? 'monospace' : 'serif';

      return (
          <div className="w-full aspect-[1/1.414] bg-white shadow-2xl relative overflow-hidden transition-all duration-300 transform scale-95 origin-top" 
               style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
              
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: pdfSettings.pdfAccentColor }}>
                  <div className="flex items-center gap-4">
                      {pdfSettings.logoImage && (
                          <img src={pdfSettings.logoImage} className="w-12 h-12 object-contain" />
                      )}
                      <div>
                          <h1 className="text-xl font-bold" style={{ color: pdfSettings.pdfAccentColor }}>{pdfSettings.headerText}</h1>
                          {pdfSettings.subHeaderText && <p className="text-xs" style={{ color: secondaryColor }}>{pdfSettings.subHeaderText}</p>}
                      </div>
                  </div>
              </div>

              {/* Content Mockup */}
              <div className="p-6 space-y-4">
                  {pdfSettings.showClientName && <p className="text-xs">Querente: <strong>Maria Silva</strong></p>}
                  {pdfSettings.showDate && <p className="text-xs">Data: <strong>{new Date().toLocaleDateString()}</strong></p>}
                  
                  {pdfSettings.showCanvasSnapshot && (
                      <div className="w-full h-32 bg-gray-200/20 rounded flex items-center justify-center border-2 border-dashed" style={{ borderColor: pdfSettings.pdfAccentColor + '40' }}>
                          <span className="text-xs opacity-50">Imagem da Mesa (Snapshot)</span>
                      </div>
                  )}

                  {pdfSettings.showInterpretation && (
                      <div className="space-y-2">
                          <h2 className="text-sm font-bold border-b pb-1" style={{ borderColor: pdfSettings.pdfAccentColor }}>Interpretação</h2>
                          <div className="h-1 bg-gray-500/10 w-full rounded"></div>
                          <div className="h-1 bg-gray-500/10 w-5/6 rounded"></div>
                          <div className="h-1 bg-gray-500/10 w-4/6 rounded"></div>
                      </div>
                  )}

                  {pdfSettings.showIndividualSlots && (
                       <div className="space-y-2 mt-4">
                            <h2 className="text-sm font-bold border-b pb-1" style={{ borderColor: pdfSettings.pdfAccentColor }}>Análise Detalhada</h2>
                            <div className="flex gap-2">
                                <div className="w-10 h-14 bg-black/20 rounded"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-2 bg-gray-500/20 w-1/3 rounded"></div>
                                    <div className="h-1 bg-gray-500/10 w-full rounded"></div>
                                </div>
                            </div>
                       </div>
                  )}
              </div>

              {/* Footer */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-[8px] opacity-50">
                  {pdfSettings.footerText}
              </div>
          </div>
      )
  };

  return (
    <div className="w-full h-full flex flex-col bg-mystic-900 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-mystic-800/50 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="mr-2 text-gold-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
          <Settings size={28} className="text-gold-400" />
          <h3 className="text-2xl font-serif text-gold-100">Configurações & Customização</h3>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-gold-600 hover:bg-gold-500 text-mystic-900 font-bold rounded-md transition-colors"><Save size={18} /><span>Salvar Alterações</span></button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10 px-8 bg-mystic-900/50 overflow-x-auto">
         <button onClick={() => setActiveTab('decks')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'decks' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Layers size={16} /> Meus Baralhos</button>
         <button onClick={() => setActiveTab('pdf')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'pdf' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><FileText size={16} /> Exportação PDF</button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-mystic-950/30">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeTab === 'pdf' && (
             <div className="flex flex-col lg:flex-row gap-8 h-full">
                {/* PDF Controls */}
                <div className="w-full lg:w-1/2 bg-mystic-800 p-6 rounded-xl border border-gold-500/20 shadow-lg space-y-6">
                    <h4 className="text-xl font-bold text-gold-200 flex items-center gap-2 border-b border-white/5 pb-2"><LayoutTemplate size={20} /> Personalizar Layout</h4>
                    
                    <div>
                        <label className="block text-sm font-bold text-gold-400 mb-2">Logo</label>
                        <div className="flex items-center gap-4">
                            <div onClick={() => logoInputRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-mystic-600 hover:border-gold-500 cursor-pointer flex items-center justify-center bg-mystic-900 overflow-hidden">
                            {pdfSettings.logoImage ? (<img src={pdfSettings.logoImage} className="w-full h-full object-contain" />) : (<Upload size={16} className="text-gray-500" />)}
                            </div>
                            <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                            {pdfSettings.logoImage && <button onClick={() => setPdfSettings(prev => ({ ...prev, logoImage: undefined }))} className="text-xs text-red-400"><Trash2 size={12}/> Remover</button>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-gray-300">Título</label><input type="text" value={pdfSettings.headerText} onChange={(e) => setPdfSettings(prev => ({...prev, headerText: e.target.value}))} className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white text-xs" /></div>
                         <div><label className="text-xs font-bold text-gray-300">Subtítulo</label><input type="text" value={pdfSettings.subHeaderText || ''} onChange={(e) => setPdfSettings(prev => ({...prev, subHeaderText: e.target.value}))} className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white text-xs" /></div>
                    </div>

                    {/* New Functionalities: Accent & Font */}
                    <div className="grid grid-cols-2 gap-4 bg-mystic-900/50 p-3 rounded">
                        <div>
                            <label className="flex items-center gap-1 text-xs font-bold text-gold-300 mb-1"><Palette size={12}/> Cor de Destaque</label>
                            <div className="flex gap-2">
                                {['#D4AF37', '#7652d6', '#000000', '#1a365d', '#8b0000'].map(c => (
                                    <button key={c} onClick={() => setPdfSettings(prev => ({...prev, pdfAccentColor: c}))} className={`w-6 h-6 rounded-full border-2 ${pdfSettings.pdfAccentColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{backgroundColor: c}} />
                                ))}
                            </div>
                        </div>
                        <div>
                             <label className="flex items-center gap-1 text-xs font-bold text-gold-300 mb-1"><Type size={12}/> Tipografia</label>
                             <select value={pdfSettings.pdfFont} onChange={(e) => setPdfSettings(prev => ({...prev, pdfFont: e.target.value as any}))} className="w-full bg-mystic-800 text-xs text-white p-1 rounded border border-white/10">
                                 <option value="times">Serifa (Clássico)</option>
                                 <option value="helvetica">Sem Serifa (Moderno)</option>
                                 <option value="courier">Máquina de Escrever</option>
                             </select>
                        </div>
                    </div>

                    <div className="bg-mystic-900/50 p-4 rounded-lg border border-white/5">
                        <label className="block text-sm font-bold text-gold-400 mb-3">Conteúdo</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[{ key: 'showClientName', label: 'Nome do Querente' }, { key: 'showDate', label: 'Data da Leitura' }, { key: 'showCanvasSnapshot', label: 'Imagem da Mesa (Snapshot)' }, { key: 'showInterpretation', label: 'Texto da Interpretação' }].map(opt => (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={(pdfSettings as any)[opt.key]} onChange={(e) => setPdfSettings(prev => ({ ...prev, [opt.key]: e.target.checked }))} className="w-4 h-4 rounded bg-mystic-800 text-gold-500" /><span className="text-gray-300 text-sm">{opt.label}</span></label>
                            ))}
                            <label className="flex items-center gap-2 cursor-pointer group bg-gold-500/10 p-2 rounded border border-gold-500/20"><input type="checkbox" checked={pdfSettings.showIndividualSlots} onChange={(e) => setPdfSettings(prev => ({ ...prev, showIndividualSlots: e.target.checked }))} className="w-4 h-4 rounded bg-mystic-800 text-gold-500" /><span className="text-gold-200 text-sm font-bold">Posição Individual (+Imagens)</span></label>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-300 mb-1">Rodapé</label>
                        <input type="text" value={pdfSettings.footerText} onChange={(e) => setPdfSettings(prev => ({...prev, footerText: e.target.value}))} className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white text-xs" />
                    </div>
                    
                    <div className="flex gap-2">
                         <button onClick={() => setPdfSettings(prev => ({ ...prev, theme: 'light' }))} className={`flex-1 py-2 text-xs rounded font-bold transition-all border ${pdfSettings.theme === 'light' ? 'bg-gray-100 text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'}`}>Tema Claro</button>
                         <button onClick={() => setPdfSettings(prev => ({ ...prev, theme: 'dark' }))} className={`flex-1 py-2 text-xs rounded font-bold transition-all border ${pdfSettings.theme === 'dark' ? 'bg-mystic-900 text-gold-400 border-gold-500' : 'bg-transparent text-gray-400 border-gray-600'}`}>Tema Escuro</button>
                    </div>
                </div>

                {/* PDF Live Preview */}
                <div className="w-full lg:w-1/2 flex flex-col items-center">
                    <h4 className="text-gold-400 font-bold mb-4 uppercase tracking-widest text-xs">Pré-visualização Ao Vivo</h4>
                    <div className="border-8 border-gray-800 rounded-lg shadow-2xl overflow-hidden bg-gray-900 w-full max-w-md">
                        <PDFPreview />
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">A visualização é aproximada. O resultado final pode variar dependendo do conteúdo.</p>
                </div>
             </div>
          )}

          {activeTab === 'decks' && (
             <div className="flex flex-col gap-6">
                
                {/* Create Deck Section */}
                <div className="bg-mystic-800 p-6 rounded-xl border border-gold-500/20 shadow-lg">
                    <h4 className="text-xl font-bold text-gold-200 mb-4 flex items-center gap-2"><Plus size={20} /> Criar Novo Baralho</h4>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            className="flex-1 bg-mystic-900 border border-mystic-600 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none"
                            placeholder="Nome do baralho (Ex: Rider Waite, Thoth)"
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                        />
                        <button 
                            onClick={handleCreateDeck}
                            className="bg-gold-600 hover:bg-gold-500 text-mystic-900 px-6 rounded-lg font-bold shadow-lg transition-colors"
                        >
                            Criar
                        </button>
                    </div>
                </div>

                {/* Decks List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-mystic-800 p-6 rounded-xl border border-white/5 h-[600px] overflow-hidden flex flex-col">
                        <h4 className="text-gold-400 font-bold mb-4 uppercase text-xs tracking-wider border-b border-white/5 pb-2">Seus Baralhos</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {customDecks.map(deck => (
                                <div 
                                    key={deck.id}
                                    onClick={() => setEditingDeckId(deck.id)}
                                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all
                                        ${editingDeckId === deck.id ? 'bg-gold-600 text-mystic-900 font-bold' : 'bg-mystic-900 text-gray-300 hover:bg-mystic-700'}
                                    `}
                                >
                                    <span>{deck.name}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                                        className={`p-1 rounded hover:bg-red-500/20 transition-colors ${editingDeckId === deck.id ? 'text-mystic-900 hover:text-red-900' : 'text-gray-500 hover:text-red-400'}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {customDecks.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-10">Nenhum baralho criado.</p>}
                        </div>
                    </div>

                    {/* Deck Editor */}
                    <div className="col-span-2 bg-mystic-800 p-6 rounded-xl border border-white/5 h-[600px] flex flex-col">
                        {editingDeckId ? (
                            <>
                                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                    <h4 className="text-xl font-bold text-gold-100 flex items-center gap-2">
                                        <Edit2 size={20} className="text-gold-500" /> 
                                        Editando: {customDecks.find(d => d.id === editingDeckId)?.name}
                                    </h4>
                                    <span className="text-sm text-gray-400">{customDecks.find(d => d.id === editingDeckId)?.cards.length} cartas</span>
                                </div>

                                <div className="flex gap-6 h-full overflow-hidden">
                                    {/* Add Card Form */}
                                    <div className="w-1/2 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                                        <h5 className="text-gold-400 font-bold text-sm uppercase">Adicionar Carta</h5>
                                        
                                        <input 
                                            type="text" 
                                            placeholder="Nome da Carta (Ex: O Louco)" 
                                            className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                                            value={newCardName}
                                            onChange={(e) => setNewCardName(e.target.value)}
                                        />
                                        
                                        <textarea 
                                            placeholder="Descrição / Significado para a IA (Ex: Representa novos começos, inocência...)" 
                                            className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white text-sm focus:border-gold-500 outline-none h-24 resize-none"
                                            value={newCardDesc}
                                            onChange={(e) => setNewCardDesc(e.target.value)}
                                        />

                                        <div 
                                            onClick={() => newCardImageInputRef.current?.click()}
                                            className="border-2 border-dashed border-mystic-600 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gold-500 hover:bg-mystic-900/50 transition-colors relative overflow-hidden group"
                                        >
                                            {newCardImage ? (
                                                <>
                                                    <img src={newCardImage} className="w-full h-full object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">Trocar Imagem</div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={24} className="text-gray-400 mb-2" />
                                                    <span className="text-xs text-gray-500">Upload Imagem</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" ref={newCardImageInputRef} onChange={handleNewCardImageUpload} />
                                        </div>

                                        <button 
                                            onClick={handleAddCardToDeck}
                                            className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-mystic-900 font-bold rounded shadow-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Adicionar Carta
                                        </button>
                                    </div>

                                    {/* Cards Grid */}
                                    <div className="w-1/2 bg-mystic-900/50 rounded-lg border border-white/5 p-4 overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-3">
                                            {customDecks.find(d => d.id === editingDeckId)?.cards.map(card => (
                                                <div key={card.id} className="relative group aspect-[2/3] bg-mystic-950 rounded border border-white/10 overflow-hidden">
                                                    <img src={card.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
                                                        <p className="text-[10px] font-bold text-gold-300 truncate">{card.name}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeCardFromDeck(editingDeckId!, card.id)}
                                                        className="absolute top-1 right-1 p-1 bg-red-900/80 text-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {customDecks.find(d => d.id === editingDeckId)?.cards.length === 0 && (
                                                <div className="col-span-2 text-center py-10 text-gray-500 text-xs italic">
                                                    Nenhuma carta adicionada.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                <Layers size={48} className="opacity-20" />
                                <p>Selecione um baralho à esquerda para editar suas cartas.</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
