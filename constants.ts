
import { TarotCard, SpreadLayout, DeckStyle, QuestionTemplate } from './types';

// Helper to generate consistent images based on style, checking custom images first
export const getCardImageUrl = (
  cardId: string, 
  style: DeckStyle, 
  customImages: Record<string, string> = {}
): string => {
  // 1. Check if user has a custom upload for this card
  if (customImages[cardId]) {
    return customImages[cardId];
  }

  // 2. Fallback to generated styles
  const seedPrefix = {
    classic: 'tarot',
    mystic: 'mystic',
    dark: 'darkfantasy',
    abstract: 'abstractart'
  };
  return `https://picsum.photos/seed/${seedPrefix[style]}${cardId}/300/500`;
};

export const MAJOR_ARCANA: TarotCard[] = [
  { id: '0', name: 'O Louco', description: 'Início, espontaneidade, fé.' },
  { id: '1', name: 'O Mago', description: 'Manifestação, poder, ação.' },
  { id: '2', name: 'A Sacerdotisa', description: 'Intuição, mistério, sabedoria.' },
  { id: '3', name: 'A Imperatriz', description: 'Fertilidade, natureza, abundância.' },
  { id: '4', name: 'O Imperador', description: 'Autoridade, estrutura, controle.' },
  { id: '5', name: 'O Hierofante', description: 'Tradição, crença, conformidade.' },
  { id: '6', name: 'Os Amantes', description: 'Amor, união, escolhas.' },
  { id: '7', name: 'O Carro', description: 'Controle, força de vontade, vitória.' },
  { id: '8', name: 'A Força', description: 'Coragem, compaixão, foco.' },
  { id: '9', name: 'O Eremita', description: 'Introspecção, busca, solidão.' },
  { id: '10', name: 'Roda da Fortuna', description: 'Mudança, ciclos, destino.' },
  { id: '11', name: 'Justiça', description: 'Verdade, causa e efeito, lei.' },
  { id: '12', name: 'O Enforcado', description: 'Sacrifício, liberação, novas perspectivas.' },
  { id: '13', name: 'A Morte', description: 'Fim, transformação, transição.' },
  { id: '14', name: 'A Temperança', description: 'Equilíbrio, moderação, paciência.' },
  { id: '15', name: 'O Diabo', description: 'Apegos, materialismo, sombra.' },
  { id: '16', name: 'A Torre', description: 'Mudança súbita, revelação, caos.' },
  { id: '17', name: 'A Estrela', description: 'Esperança, fé, propósito.' },
  { id: '18', name: 'A Lua', description: 'Ilusão, medo, subconsciente.' },
  { id: '19', name: 'O Sol', description: 'Alegria, sucesso, celebração.' },
  { id: '20', name: 'O Julgamento', description: 'Renascimento, chamado, absolvição.' },
  { id: '21', name: 'O Mundo', description: 'Conclusão, realização, viagem.' },
];

export const SPREAD_LAYOUTS: SpreadLayout[] = [
  {
    id: 'free',
    name: 'Estilo Livre',
    description: 'Sem posições definidas. Arraste para onde quiser.',
    slots: []
  },
  {
    id: 'three_card',
    name: 'Tiragem de 3 Cartas',
    description: 'Passado, Presente e Futuro.',
    slots: [
      { id: 'past', label: 'Passado', x: '20%', y: '50%' },
      { id: 'present', label: 'Presente', x: '50%', y: '50%' },
      { id: 'future', label: 'Futuro', x: '80%', y: '50%' },
    ]
  },
  {
    id: 'cross',
    name: 'Cruz Simples',
    description: 'Uma visão expandida do momento.',
    slots: [
      { id: 'center', label: 'O Cerne', x: '50%', y: '50%' },
      { id: 'left', label: 'Influência 1', x: '25%', y: '50%' },
      { id: 'right', label: 'Influência 2', x: '75%', y: '50%' },
      { id: 'top', label: 'Consciente', x: '50%', y: '20%' },
      { id: 'bottom', label: 'Inconsciente', x: '50%', y: '80%' },
    ]
  },
  {
    id: 'celtic_cross',
    name: 'Cruz Celta',
    description: 'Leitura profunda com 10 posições tradicionais.',
    slots: [
      // Central Cross
      { id: '1', label: '1. O Cerne', x: '40%', y: '50%' },
      { id: '2', label: '2. Obstáculo', x: '42%', y: '52%' }, // Slightly offset to show overlap
      
      // Surrounding
      { id: '3', label: '3. A Base', x: '40%', y: '80%' },
      { id: '4', label: '4. Passado', x: '20%', y: '50%' },
      { id: '5', label: '5. A Coroa', x: '40%', y: '20%' },
      { id: '6', label: '6. Futuro', x: '60%', y: '50%' },
      
      // Staff / Column on the right
      { id: '7', label: '7. Eu', x: '85%', y: '85%' },
      { id: '8', label: '8. Exterior', x: '85%', y: '65%' },
      { id: '9', label: '9. Esperanças', x: '85%', y: '45%' },
      { id: '10', label: '10. Resultado', x: '85%', y: '25%' },
    ]
  },
  {
    id: 'pearls_destiny',
    name: 'Pérolas do Destino',
    description: 'Uma jornada de 10 cartas revelando o despertar, o caminho e o elo perdido.',
    slots: [
      // Base (The Foundation/Start)
      { id: '1', label: '1. O Despertar', x: '20%', y: '80%' },
      { id: '2', label: '2. A Jornada', x: '50%', y: '80%' },
      { id: '3', label: '3. O Portal', x: '80%', y: '80%' },
      
      // Pillars (The Process)
      { id: '4', label: '4. Sabedoria Interior', x: '20%', y: '50%' },
      { id: '5', label: '5. Reflexo Externo', x: '80%', y: '50%' },
      { id: '6', label: '6. A Promessa', x: '20%', y: '20%' },
      { id: '7', label: '7. A Lição', x: '80%', y: '20%' },
      
      // Arch (The Future/Outcome)
      { id: '8', label: '8. Presente Iminente', x: '40%', y: '15%' },
      { id: '9', label: '9. Futuro Distante', x: '60%', y: '15%' },
      
      // Center (The Core)
      { id: '10', label: '10. O Elo Perdido', x: '50%', y: '45%' },
    ]
  }
];

export const DEFAULT_QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'general',
    label: 'Geral',
    questions: "1. Qual é a situação atual do querente?\n2. Qual é o maior desafio no momento?\n3. Qual é o melhor caminho a seguir?"
  },
  {
    id: 'love',
    label: 'Amor',
    questions: "1. Como está a energia do relacionamento?\n2. O que o querente precisa aprender sobre si mesmo no amor?\n3. Qual é o futuro provável desta relação?"
  },
  {
    id: 'career',
    label: 'Carreira',
    questions: "1. Qual é o potencial profissional atual?\n2. Existem obstáculos ocultos no ambiente de trabalho?\n3. Onde focar a energia para crescer?"
  },
  {
    id: 'decision',
    label: 'Tomada de Decisão',
    questions: "1. O que acontece se eu escolher a Opção A?\n2. O que acontece se eu escolher a Opção B?\n3. Qual conselho o universo oferece para esta escolha?"
  }
];
