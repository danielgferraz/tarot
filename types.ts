
export interface TarotCard {
  id: string;
  name: string;
  image?: string; // URL placeholder, optional as it is now dynamic
  description: string;
}

export interface PlacedCard extends TarotCard {
  instanceId: string; // Unique ID for the card on the canvas (allows duplicates)
  x: number;
  y: number;
  rotation: number;
  isReversed: boolean;
  image: string; // resolved image URL
}

export interface DragItem {
  id: string;
  type: 'SIDEBAR_CARD' | 'CANVAS_CARD';
  instanceId?: string; // Only for canvas cards
}

export enum DragType {
  SIDEBAR_CARD = 'SIDEBAR_CARD',
  CANVAS_CARD = 'CANVAS_CARD'
}

export interface SpreadSlot {
  id: string;
  label: string;
  x: number | string; // percentage or pixels
  y: number | string;
}

export interface SpreadLayout {
  id: string;
  name: string;
  description: string;
  slots: SpreadSlot[];
  isCustom?: boolean;
  connections?: { from: string; to: string }[]; // Links between slots
}

// --- CRM Types ---
export interface Client {
  id: string;
  name: string;
  email?: string;
  notes?: string;
  readingsHistory: SavedReading[];
}

export interface SavedReading {
  id: string;
  date: string;
  title?: string; // Session name or tag
  layoutName: string;
  layoutId?: string;
  cards: PlacedCard[];
  interpretation?: string;
  aiConfigSnapshot?: AIConfig;
}

export interface QuestionTemplate {
  id: string;
  label: string;
  questions: string;
}

// --- Custom Decks ---
export interface CustomCard {
  id: string;
  name: string;
  description: string; // Context for AI
  image: string; // Base64 string
}

export interface CustomDeck {
  id: string;
  name: string;
  cards: CustomCard[];
}

// --- PDF Settings ---
export interface PDFSettings {
  theme: 'light' | 'dark';
  logoImage?: string; // Base64
  headerText: string;
  subHeaderText?: string;
  showClientName: boolean;
  showDate: boolean;
  showCanvasSnapshot: boolean;
  showInterpretation: boolean;
  showIndividualSlots?: boolean; // New Option
  footerText: string;
  pdfAccentColor: string; // New: Hex code for lines/titles
  pdfFont: 'times' | 'helvetica' | 'courier'; // New: Font selection
}

// --- Chat Types ---
export interface ChatMessage {
  role: 'user' | 'model';
  message: string;
}

// --- AI & Visual Config Types ---
export type DeckStyle = 'classic' | 'mystic' | 'dark' | 'abstract';

export interface AIConfig {
  systemInstruction: string;
  contextFiles: { name: string; content: string }[];
  deckStyle: DeckStyle;
  customCardImages: Record<string, string>; // Map card ID to Base64 string
  sessionName?: string; // Tag for the next save
  customDecks: CustomDeck[];
  questionTemplates?: QuestionTemplate[]; 
  sessionQuestions?: string;
  pdfSettings?: PDFSettings;
  chatHistory?: ChatMessage[];
}
