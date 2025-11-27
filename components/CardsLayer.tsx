import React, { useMemo } from 'react';
import { PlacedCard } from '../types';
import { CardComponent } from './CardComponent';

interface CardsLayerProps {
  cards: PlacedCard[];
  onDragStart: (e: React.DragEvent, instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onFlip: (instanceId: string) => void;
  onRotate: (instanceId: string) => void;
  pan: { x: number, y: number };
  zoom: number;
  containerSize: { width: number, height: number };
}

export const CardsLayer: React.FC<CardsLayerProps> = React.memo(({
  cards,
  onDragStart,
  onRemove,
  onFlip,
  onRotate,
  pan,
  zoom,
  containerSize
}) => {
  // Optimization: Filter cards that are outside the current viewport
  const visibleCards = useMemo(() => {
    // Large buffer to ensure cards don't pop out during dragging before the next render update
    const buffer = 800; 

    // Calculate visible rect in canvas space (accounting for pan and zoom)
    // Canvas transform is translate(pan.x, pan.y) scale(zoom)
    // To find the visible area in the card's coordinate system:
    // visibleLeft = -pan.x / zoom
    const visibleX = -pan.x / zoom;
    const visibleY = -pan.y / zoom;
    const visibleW = containerSize.width / zoom;
    const visibleH = containerSize.height / zoom;

    return cards.filter(card => {
        const cardWidth = 120;
        const cardHeight = 200;
        
        // Check intersection with buffer
        return (
            card.x + cardWidth > visibleX - buffer &&
            card.x < visibleX + visibleW + buffer &&
            card.y + cardHeight > visibleY - buffer &&
            card.y < visibleY + visibleH + buffer
        );
    });
  }, [cards, pan, zoom, containerSize]);

  return (
    <>
      {visibleCards.map((card, index) => (
        <div
          key={card.instanceId}
          className="card-element" // Marker class to prevent panning when clicking card
          style={{
            position: 'absolute',
            left: card.x,
            top: card.y,
            zIndex: 10 + index, // Explicit Z-Index based on array order
          }}
          onMouseDown={(e) => e.stopPropagation()} // Stop pan propagation
        >
          <CardComponent
            card={card}
            isPlaced={true}
            isReversed={card.isReversed}
            rotation={card.rotation}
            onDragStart={(e) => onDragStart(e, card.instanceId)}
            onRemove={() => onRemove(card.instanceId)}
            onFlip={() => onFlip(card.instanceId)}
            onRotate={() => onRotate(card.instanceId)}
          />
        </div>
      ))}
    </>
  );
});