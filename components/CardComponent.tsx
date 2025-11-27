
import React, { useState } from 'react';
import { TarotCard } from '../types';
import { RotateCw, X, Repeat, Share2, Check } from 'lucide-react';

interface CardComponentProps {
  card: TarotCard & { image?: string };
  isPlaced: boolean;
  isReversed?: boolean;
  rotation?: number;
  onRemove?: () => void;
  onRotate?: () => void;
  onFlip?: () => void;
  style?: React.CSSProperties;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
  imageOverride?: string;
}

// Named function for display name in DevTools
const CardComponentBase: React.FC<CardComponentProps> = ({
  card,
  isPlaced,
  isReversed = false,
  rotation = 0,
  onRemove,
  onRotate,
  onFlip,
  style,
  onDragStart,
  className = '',
  imageOverride
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayImage = imageOverride || card.image;

  // Separate the transform style passed via props (from drag/drop positioning)
  const { transform, ...restStyle } = style || {};

  const handleCopyImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImage) {
      navigator.clipboard.writeText(displayImage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => isPlaced && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`
        relative group select-none transition-all duration-300
        ${className} 
        ${isPlaced 
          ? 'cursor-move animate-drop z-10 hover:z-50' 
          : 'cursor-grab hover:scale-105 hover:shadow-gold-400/50'
        }
        active:cursor-grabbing
      `}
      style={{
        ...restStyle,
        width: '120px',
        height: '200px',
        transform: transform, 
      }}
    >
      {/* Tooltip - Placed outside the rotation container to maintain horizontal orientation */}
      {showTooltip && (
        <div 
          className="absolute z-[100] top-[-10px] left-1/2 -translate-x-1/2 -translate-y-full mb-3 w-48 p-2 bg-mystic-900/95 border border-gold-500/30 text-white text-xs rounded shadow-xl backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in duration-200"
        >
          <p className="font-bold text-gold-400 mb-1 text-center">{card.name}</p>
          <p className="text-gray-300 leading-tight text-justify">{card.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-mystic-900/95" />
        </div>
      )}

      {/* Inner Container for Rotation and Visuals */}
      <div 
        className={`
          w-full h-full relative transition-transform duration-300 ease-out
          ${isPlaced ? 'group-hover:scale-[1.03]' : ''}
        `}
        style={{
          transform: `rotate(${rotation}deg) ${isReversed ? 'rotate(180deg)' : ''}`,
        }}
      >
        {/* Visual Feedback for dragging active placed card */}
        <div className="absolute inset-0 rounded-lg group-active:ring-2 group-active:ring-gold-400/80 transition-all pointer-events-none z-10" />

        {/* Card Image/Back */}
        <div className={`
          w-full h-full rounded-lg overflow-hidden border-2 
          ${isPlaced 
            ? 'border-gold-500/50 shadow-xl group-hover:shadow-gold-500/30 group-hover:border-gold-400' 
            : 'border-gold-500/30 shadow-md'} 
          bg-mystic-800 relative transition-all duration-300
          ${isPlaced && isReversed ? 'brightness-90 sepia-[.3] grayscale-[.2]' : ''}
        `}>
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={card.name} 
              className="w-full h-full object-cover pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
             <div className="w-full h-full bg-mystic-700 flex items-center justify-center">
                <span className="text-xs text-gray-400">Sem Imagem</span>
             </div>
          )}
          
          {/* Overlay Gradient for readability */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-mystic-900 to-transparent pointer-events-none" />
          
          {/* Name Label */}
          <div className={`absolute bottom-2 left-0 right-0 text-center px-1 pointer-events-none ${isReversed ? 'rotate-180' : ''}`}>
            <span className="text-xs font-serif font-bold text-gold-300 drop-shadow-md tracking-wide">
              {card.name}
            </span>
          </div>
        </div>
      </div>

      {/* Controls - Fixed at bottom of card container (Does NOT rotate with card) */}
      {isPlaced && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-mystic-900/90 border border-gold-500/20 rounded-full p-1 z-50 pointer-events-auto shadow-lg backdrop-blur-md">
          <button 
            onClick={(e) => { e.stopPropagation(); onFlip?.(); }} 
            className="p-1.5 hover:bg-mystic-700 rounded-full text-gold-300 transition-colors"
            title="Inverter (180°)"
          >
            <Repeat size={14} className="rotate-90" />
          </button>
           <button 
            onClick={(e) => { e.stopPropagation(); onRotate?.(); }} 
            className="p-1.5 hover:bg-mystic-700 rounded-full text-gold-300 transition-colors"
            title="Rotacionar (+45°)"
          >
            <RotateCw size={14} />
          </button>
          <button 
            onClick={handleCopyImage} 
            className="p-1.5 hover:bg-mystic-700 rounded-full text-blue-300 transition-colors"
            title="Copiar Link da Imagem"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }} 
            className="p-1.5 hover:bg-red-900/50 hover:text-red-400 rounded-full text-red-300 transition-colors"
            title="Remover"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// Optimization: Only re-render if props change significantly
export const CardComponent = React.memo(CardComponentBase, (prev, next) => {
  return (
    prev.card.id === next.card.id &&
    prev.isPlaced === next.isPlaced &&
    prev.isReversed === next.isReversed &&
    prev.rotation === next.rotation &&
    prev.imageOverride === next.imageOverride &&
    // Check style transform (coordinates) specifically if passed
    prev.style?.transform === next.style?.transform
  );
});
