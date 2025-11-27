
import React, { useState } from 'react';
import { MAJOR_ARCANA, getCardImageUrl } from '../constants';
import { CardComponent } from './CardComponent';
import { DragType, DeckStyle, CustomDeck } from '../types';
import { Search, ChevronDown, Layers } from 'lucide-react';

interface SidebarProps {
  deckStyle?: DeckStyle;
  customCardImages?: Record<string, string>;
  customDecks?: CustomDeck[];
  activeDeckId?: string;
  onSelectDeck?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  deckStyle = 'classic', 
  customCardImages = {}, 
  customDecks = [], 
  activeDeckId = 'major-arcana',
  onSelectDeck
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine which cards to show based on active deck
  const activeDeck = activeDeckId === 'major-arcana' 
      ? null 
      : customDecks.find(d => d.id === activeDeckId);

  // If active deck is custom, map its cards to a format compatible with rendering.
  // We need to ensure we can filter them.
  const cardsToRender = activeDeck 
      ? activeDeck.cards.map(c => ({ 
          id: c.id, 
          name: c.name, 
          description: c.description, 
          image: c.image // Custom cards carry their own image
        }))
      : MAJOR_ARCANA.map(c => ({
          ...c,
          image: undefined // Standard cards resolve image via style
      }));

  const filteredCards = cardsToRender.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('type', DragType.SIDEBAR_CARD);
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <>
      <div className="p-4 border-b border-white/5 bg-mystic-950/30">
        <h2 className="text-lg font-serif text-gold-400 mb-3 flex items-center gap-2">
           <Layers size={18} /> Biblioteca
        </h2>
        
        {/* DECK SELECTOR */}
        <div className="mb-4 relative">
           <select 
             className="w-full bg-mystic-800 border border-mystic-600 rounded-lg p-2 text-sm text-white appearance-none cursor-pointer hover:border-gold-500 focus:outline-none focus:border-gold-500 transition-colors"
             value={activeDeckId}
             onChange={(e) => onSelectDeck?.(e.target.value)}
           >
             <option value="major-arcana">Arcanos Maiores (Padrão)</option>
             {customDecks.length > 0 && (
               <optgroup label="Meus Baralhos">
                 {customDecks.map(deck => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                 ))}
               </optgroup>
             )}
           </select>
           <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar carta..." 
            className="w-full bg-mystic-800/50 border border-mystic-600 rounded-md py-2 pl-9 pr-3 text-sm text-white placeholder-mystic-400 focus:outline-none focus:border-gold-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-mystic-400" size={14} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scroll-smooth custom-scrollbar bg-mystic-900/20">
        <div className="grid grid-cols-2 gap-3">
          {filteredCards.map((card) => (
            <div key={card.id} className="flex justify-center">
              <CardComponent 
                card={card} 
                isPlaced={false}
                imageOverride={card.image || getCardImageUrl(card.id, deckStyle as DeckStyle, customCardImages)}
                className="transform scale-90 origin-top hover:scale-95 transition-transform" 
                onDragStart={(e) => handleDragStart(e, card.id)}
              />
            </div>
          ))}
          
          {filteredCards.length === 0 && (
            <div className="col-span-2 text-center py-8 text-mystic-400 text-sm italic">
              Nenhuma carta encontrada neste baralho.
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 border-t border-white/5 bg-mystic-950/50">
        <p className="text-[10px] text-center text-mystic-500">
          {activeDeck ? `Baralho: ${activeDeck.name}` : 'Baralho: Rider-Waite Padrão'}
        </p>
      </div>
    </>
  );
};
