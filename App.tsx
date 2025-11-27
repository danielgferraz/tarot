
import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CardsLayer } from './components/CardsLayer';
import { ChatSidebar } from './components/ChatSidebar';
import { CRMModal } from './components/CRMModal';
import { AISettingsModal as SessionConfigModal } from './components/AISettingsModal';
import { SettingsPage } from './components/SettingsPage';
import { LayoutBuilder } from './components/LayoutBuilder';
import { Confetti } from './components/Confetti';
import { PlacedCard, DragType, SpreadLayout, Client, AIConfig, SavedReading, CustomDeck, PDFSettings } from './types';
import { MAJOR_ARCANA, SPREAD_LAYOUTS, getCardImageUrl } from './constants';
import { Download, Trash2, Sparkles, AlertCircle, Save, Upload, LayoutGrid, Users, Settings, Undo2, Redo2, ZoomIn, ZoomOut, Bot, MessageSquare, PlusCircle } from 'lucide-react';
import { interpretSpread } from './services/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_PDF_SETTINGS: PDFSettings = {
    theme: 'light',
    headerText: 'Leitura de Tarô',
    subHeaderText: 'Orientação Mística',
    showClientName: true,
    showDate: true,
    showCanvasSnapshot: true,
    showInterpretation: true,
    footerText: 'Gerado por MysticTarot Canvas',
    showIndividualSlots: false,
    pdfAccentColor: '#D4AF37',
    pdfFont: 'times'
};

const DEFAULT_AI_CONFIG: AIConfig = {
  systemInstruction: '',
  contextFiles: [],
  deckStyle: 'classic',
  customCardImages: {},
  customDecks: [],
  pdfSettings: DEFAULT_PDF_SETTINGS,
  chatHistory: []
};

// Helper to get Base64 from URL for PDF
const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to convert image for PDF", e);
        return "";
    }
};

const App: React.FC = () => {
  const [placedCards, setPlacedCards] = useState<PlacedCard[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  
  const [currentLayoutId, setCurrentLayoutId] = useState<string>('free');
  const [customLayouts, setCustomLayouts] = useState<SpreadLayout[]>([]);
  const [layoutPresets, setLayoutPresets] = useState<SpreadLayout[]>([]); 
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [activeDeckId, setActiveDeckId] = useState<string>('major-arcana');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const isPanningRef = useRef(false);
  const [isPanningState, setIsPanningState] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const currentPanRef = useRef({ x: 0, y: 0 });
  
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'crm' | 'settings' | 'builder'>('canvas');

  const [history, setHistory] = useState<PlacedCard[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [readingLoading, setReadingLoading] = useState(false);
  const [readingContent, setReadingContent] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [isSessionConfigOpen, setIsSessionConfigOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const allLayouts = [...SPREAD_LAYOUTS, ...customLayouts];
  const currentLayout = allLayouts.find(l => l.id === currentLayoutId) || SPREAD_LAYOUTS[0];

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    try {
      const storedClients = localStorage.getItem('mysticTarotClients');
      if (storedClients) setClients(JSON.parse(storedClients));
      
      const storedAI = localStorage.getItem('mysticTarotAIConfig');
      if (storedAI) {
         setAiConfig({ ...DEFAULT_AI_CONFIG, ...JSON.parse(storedAI) });
      }

      const storedLayouts = localStorage.getItem('mysticTarotCustomLayouts');
      if (storedLayouts) setCustomLayouts(JSON.parse(storedLayouts));
      
      const storedPresets = localStorage.getItem('mysticTarotLayoutPresets');
      if (storedPresets) setLayoutPresets(JSON.parse(storedPresets));

      const aiConfigObj = storedAI ? JSON.parse(storedAI) : DEFAULT_AI_CONFIG;
      const hasStandardDeck = aiConfigObj.customDecks?.some((d: CustomDeck) => d.id === 'major-arcana-standard');
      
      if (!hasStandardDeck) {
         const standardDeck: CustomDeck = {
             id: 'major-arcana-standard',
             name: 'Arcanos Maiores (Padrão)',
             cards: MAJOR_ARCANA.map(c => ({
                 id: c.id,
                 name: c.name,
                 description: c.description,
                 image: getCardImageUrl(c.id, 'classic', {}) 
             }))
         };
         setAiConfig(prev => ({
             ...prev,
             customDecks: [standardDeck, ...(prev.customDecks || [])]
         }));
         setActiveDeckId('major-arcana-standard');
      }

    } catch (e) {
      console.error("Failed to load initial data", e);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { localStorage.setItem('mysticTarotClients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('mysticTarotAIConfig', JSON.stringify(aiConfig)); }, [aiConfig]);
  useEffect(() => { localStorage.setItem('mysticTarotCustomLayouts', JSON.stringify(customLayouts)); }, [customLayouts]);
  useEffect(() => { localStorage.setItem('mysticTarotLayoutPresets', JSON.stringify(layoutPresets)); }, [layoutPresets]);

  useEffect(() => {
    currentPanRef.current = pan;
    if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    }
  }, [pan, zoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isPanningRef.current = false;
        setIsPanningState(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updateCardsWithHistory = (newCards: PlacedCard[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory.length === 0) newHistory.push([]); 
      newHistory.push(newCards);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setPlacedCards(newCards);
  };
  
  useEffect(() => {
      if (history.length === 0) {
          setHistory([[]]);
          setHistoryIndex(0);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSaveAnimation = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const saveReading = () => {
    if (placedCards.length === 0) return;
    try {
      const newReading: SavedReading = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: aiConfig.sessionName,
        layoutName: currentLayout.name,
        layoutId: currentLayout.id,
        cards: placedCards,
        interpretation: readingContent || undefined,
        aiConfigSnapshot: aiConfig
      };

      if (activeClient) {
        const updatedClients = clients.map(c => {
          if (c.id === activeClient.id) return { ...c, readingsHistory: [newReading, ...c.readingsHistory] };
          return c;
        });
        setClients(updatedClients);
        const updatedActive = updatedClients.find(c => c.id === activeClient.id) || null;
        setActiveClient(updatedActive);
        triggerSaveAnimation();
      } else {
        const confirmSave = window.confirm("Nenhum querente selecionado. Salvar leitura anônima localmente?");
        if (confirmSave) {
            localStorage.setItem('mysticTarotLastState', JSON.stringify({
                cards: placedCards, layoutId: currentLayoutId, date: new Date().toISOString(), aiConfigSnapshot: aiConfig
            }));
            triggerSaveAnimation();
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar leitura.');
    }
  };

  const loadLastState = () => {
    try {
      const saved = localStorage.getItem('mysticTarotLastState');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.cards) updateCardsWithHistory(data.cards);
        if (data.layoutId) setCurrentLayoutId(data.layoutId);
        if (data.aiConfigSnapshot) setAiConfig(prev => ({ ...prev, ...data.aiConfigSnapshot }));
      } else {
        alert('Nenhuma leitura anônima salva encontrada.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar leitura.');
    }
  };

  const handleAddClient = (client: Client) => setClients(prev => [client, ...prev]);
  const handleUpdateClient = (updatedClient: Client) => {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      if (activeClient?.id === updatedClient.id) setActiveClient(updatedClient);
  };
  const handleDeleteClient = (clientId: string) => {
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (activeClient?.id === clientId) setActiveClient(null);
  };
  const handleDeleteReading = (clientId: string, readingId: string) => {
      const updatedClients = clients.map(client => {
          if (client.id === clientId) return { ...client, readingsHistory: client.readingsHistory.filter(r => r.id !== readingId) };
          return client;
      });
      setClients(updatedClients);
      if (activeClient?.id === clientId) {
          const updatedActive = updatedClients.find(c => c.id === clientId);
          if (updatedActive) setActiveClient(updatedActive);
      }
  };
  const handleUpdateReading = (clientId: string, updatedReading: SavedReading) => {
    const updatedClients = clients.map(client => {
      if (client.id === clientId) return { ...client, readingsHistory: client.readingsHistory.map(r => r.id === updatedReading.id ? updatedReading : r) };
      return client;
    });
    setClients(updatedClients);
    if (activeClient?.id === clientId) {
        const updatedActive = updatedClients.find(c => c.id === clientId);
        if (updatedActive) setActiveClient(updatedActive);
    }
  };

  const handleLoadReading = (reading: SavedReading) => {
      updateCardsWithHistory(reading.cards);
      if (reading.layoutId) setCurrentLayoutId(reading.layoutId);
      if (reading.interpretation) {
          setReadingContent(reading.interpretation);
          setIsChatOpen(true);
      }
      if (reading.aiConfigSnapshot) {
          setAiConfig(prev => ({ ...prev, ...reading.aiConfigSnapshot }));
      } else if (reading.title) {
          setAiConfig(prev => ({ ...prev, sessionName: reading.title }));
      }
      setViewMode('canvas'); 
  };

  const handleStartNewReading = (client: Client) => {
      setActiveClient(client);
      updateCardsWithHistory([]);
      setReadingContent(null);
      setIsChatOpen(false);
      setAiConfig(prev => ({ ...prev, sessionName: '', sessionQuestions: '', chatHistory: [] }));
      setViewMode('canvas');
  };

  const handleSaveCustomLayout = (layout: SpreadLayout) => {
    setCustomLayouts(prev => [...prev, layout]);
    setCurrentLayoutId(layout.id);
    setViewMode('canvas');
    alert(`Layout "${layout.name}" criado com sucesso!`);
  };

  const handleDeleteCustomLayout = (layoutId: string) => {
    if (window.confirm("Deseja realmente excluir este layout personalizado?")) {
      setCustomLayouts(prev => prev.filter(l => l.id !== layoutId));
      setCurrentLayoutId('free');
    }
  };
  
  const handleSavePreset = (preset: SpreadLayout) => { setLayoutPresets(prev => [...prev, preset]); alert(`Preset "${preset.name}" salvo!`); };
  const handleDeletePreset = (presetId: string) => { if (window.confirm("Excluir este preset?")) setLayoutPresets(prev => prev.filter(p => p.id !== presetId)); };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const settings = aiConfig.pdfSettings || DEFAULT_PDF_SETTINGS;
    const isDark = settings.theme === 'dark';
    const textColor = isDark ? [255, 255, 255] : [0, 0, 0];
    const secondaryColor = isDark ? [200, 200, 200] : [80, 80, 80];
    const accentColorHex = settings.pdfAccentColor || '#D4AF37';
    // Simple hex to rgb converter
    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return [r, g, b];
    };
    const accentColor = hexToRgb(accentColorHex);
    const fontName = settings.pdfFont || 'times';

    const originalTransform = canvasRef.current.style.transform;
    canvasRef.current.style.transform = 'scale(1)'; 
    
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 15;
      
      // Theme Background
      if (isDark) { pdf.setFillColor(26, 16, 37); pdf.rect(0, 0, pageWidth, pageHeight, 'F'); }
      else { pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, pageWidth, pageHeight, 'F'); }

      if (settings.logoImage) {
          const logoDim = 20;
          pdf.addImage(settings.logoImage, 'PNG', 15, currentY, logoDim, logoDim);
      }

      pdf.setFont(fontName, 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      const textX = settings.logoImage ? 40 : 15;
      pdf.text(settings.headerText, textX, currentY + 8);
      
      if (settings.subHeaderText) {
         pdf.setFontSize(12);
         pdf.setFont(fontName, 'italic');
         pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
         pdf.text(settings.subHeaderText, textX, currentY + 16);
      }
      currentY += 30;

      // Divider
      pdf.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(15, currentY - 5, pageWidth - 15, currentY - 5);

      pdf.setFontSize(10);
      pdf.setFont(fontName, 'normal');
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      if (settings.showClientName && activeClient) { pdf.text(`Querente: ${activeClient.name}`, 15, currentY); currentY += 6; }
      if (settings.showDate) { pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, currentY); currentY += 10; }

      if (settings.showCanvasSnapshot) {
          // SMART CROP CALCULATION
          // 1. Find bounding box of cards
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          placedCards.forEach(c => {
             if (c.x < minX) minX = c.x;
             if (c.y < minY) minY = c.y;
             if (c.x + 120 > maxX) maxX = c.x + 120; // 120 = card width
             if (c.y + 200 > maxY) maxY = c.y + 200; // 200 = card height
          });
          
          // Add padding
          const padding = 50;
          minX -= padding; minY -= padding; maxX += padding; maxY += padding;
          
          // Ensure valid bounds within canvas size
          // We capture from the element, so coordinates need to be relative to element 0,0
          // NOTE: html2canvas captures based on viewport if not carefully restricted.
          // We will use the 'width' and 'height' options of html2canvas and 'x', 'y' window scroll
          // However, simpler is to set options to capture specific rect.

          const captureOptions = {
              backgroundColor: null, // Transparent!
              scale: 2,
              useCORS: true,
              logging: false,
              ignoreElements: (element: Element) => element.classList.contains('slot-placeholder'),
              // Restrict capture to the bounding box if possible, 
              // but cards are absolute positioned. 
              // Easier Strategy: Capture whole, but crop in PDF? No, file size.
              // We'll trust html2canvas to capture the visible DOM. 
              // To avoid dark background, we temporarily set the background of wrapper to transparent.
          };
          
          // Hack: Force transparent background on canvas container for screenshot
          if (canvasRef.current.parentElement) {
              const oldBg = canvasRef.current.parentElement.style.backgroundImage;
              const oldColor = canvasRef.current.parentElement.style.backgroundColor;
              canvasRef.current.parentElement.style.backgroundImage = 'none';
              canvasRef.current.parentElement.style.backgroundColor = 'transparent';
              
              // Also hide slot placeholders via class logic in options, done.
              
              const canvas = await html2canvas(canvasRef.current, {
                  ...captureOptions,
                  x: Math.max(0, minX),
                  y: Math.max(0, minY),
                  width: maxX - minX,
                  height: maxY - minY
              });

              // Restore background
              canvasRef.current.parentElement.style.backgroundImage = oldBg;
              canvasRef.current.parentElement.style.backgroundColor = oldColor;

              const imgData = canvas.toDataURL('image/png');
              const imgProps = pdf.getImageProperties(imgData);
              const ratio = imgProps.width / imgProps.height;
              const imgWidth = pageWidth - 40; 
              const imgHeight = imgWidth / ratio;
              
              if (currentY + imgHeight > pageHeight - 20) { pdf.addPage(); if (isDark) { pdf.setFillColor(26, 16, 37); pdf.rect(0, 0, pageWidth, pageHeight, 'F'); } currentY = 15; }
              
              // Center the image
              const xPos = (pageWidth - imgWidth) / 2;
              pdf.addImage(imgData, 'PNG', xPos, currentY, imgWidth, imgHeight);
              currentY += imgHeight + 15;
          }
      }
      
      if (settings.showIndividualSlots) {
         if (currentY + 20 > pageHeight - 20) { pdf.addPage(); if(isDark) { pdf.setFillColor(26,16,37); pdf.rect(0,0,pageWidth,pageHeight,'F'); } currentY = 15; }
         pdf.setFont(fontName, 'bold');
         pdf.setFontSize(14);
         pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
         pdf.text("Análise Detalhada", 15, currentY);
         pdf.setLineWidth(0.3);
         pdf.line(15, currentY + 1, 60, currentY + 1);
         currentY += 15;

         // Load images sequentially
         for (let i = 0; i < placedCards.length; i++) {
             const card = placedCards[i];
             const slotName = currentLayout.slots.find(s => {
                   // Calculate distance to find which slot this card occupies
                   // Approximate logic due to scaling, but generally works if snapped
                   const cx = card.x + 60; const cy = card.y + 100;
                   const sx = parseFloat(s.x as string) / 100 * (canvasRef.current?.offsetWidth || 0);
                   const sy = parseFloat(s.y as string) / 100 * (canvasRef.current?.offsetHeight || 0);
                   const dist = Math.sqrt(Math.pow(cx-sx, 2) + Math.pow(cy-sy, 2));
                   return dist < 50; 
             })?.label || `Carta ${i + 1}`;
             
             // Check page break for Card Block (Image + Text)
             // Approx height needed: 40mm
             if (currentY + 45 > pageHeight - 20) { pdf.addPage(); if(isDark) { pdf.setFillColor(26,16,37); pdf.rect(0,0,pageWidth,pageHeight,'F'); } currentY = 15; }

             // 1. Draw Card Image (Thumbnail)
             try {
                const base64Img = await imageUrlToBase64(card.image);
                if (base64Img) {
                    const imgW = 20; const imgH = 33; // ~ 3:5 ratio
                    pdf.addImage(base64Img, 'PNG', 15, currentY, imgW, imgH, undefined, 'FAST', card.isReversed ? 180 : 0);
                }
             } catch (e) { /* ignore image error */ }

             // 2. Draw Text next to image
             pdf.setFontSize(11);
             pdf.setFont(fontName, 'bold');
             pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
             pdf.text(`${slotName}`, 40, currentY + 5);
             
             pdf.setFont(fontName, 'normal');
             pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
             pdf.text(`${card.name} ${card.isReversed ? '(Invertida)' : ''}`, 40, currentY + 10);
             
             pdf.setFontSize(10);
             pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
             const descLines = pdf.splitTextToSize(card.description, pageWidth - 55);
             pdf.text(descLines, 40, currentY + 16);
             
             const textBlockHeight = (descLines.length * 5) + 16;
             currentY += Math.max(35, textBlockHeight) + 10; // Ensure minimal spacing even if text is short
         }
      }

      if (settings.showInterpretation && readingContent) {
          if (currentY + 20 > pageHeight - 20) { pdf.addPage(); if (isDark) { pdf.setFillColor(26, 16, 37); pdf.rect(0, 0, pageWidth, pageHeight, 'F'); } currentY = 15; }
          pdf.setFont(fontName, 'bold');
          pdf.setFontSize(14);
          pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          pdf.text("Interpretação Completa", 15, currentY);
          pdf.line(15, currentY + 1, 60, currentY + 1);
          currentY += 10;
          
          pdf.setFont(fontName, 'normal');
          pdf.setFontSize(11);
          pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          const cleanText = readingContent.replace(/[#*]/g, '');
          const splitText = pdf.splitTextToSize(cleanText, pageWidth - 30);
          const lineHeight = 5;
          for (let i = 0; i < splitText.length; i++) {
              if (currentY + lineHeight > pageHeight - 20) { pdf.addPage(); if (isDark) { pdf.setFillColor(26, 16, 37); pdf.rect(0, 0, pageWidth, pageHeight, 'F'); } currentY = 15; }
              pdf.text(splitText[i], 15, currentY);
              currentY += lineHeight;
          }
      }

      const pageCount = pdf.internal.pages.length - 1; 
      for(let i = 1; i <= pageCount; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text(settings.footerText, pageWidth / 2, pageHeight - 10, { align: 'center' }); }
      pdf.save(`tarot-${activeClient ? activeClient.name.replace(/\s+/g, '-') : 'leitura'}.pdf`);
    } catch (error) { console.error("Erro ao exportar PDF:", error); alert("Erro ao exportar PDF."); } finally { if (canvasRef.current) canvasRef.current.style.transform = originalTransform; }
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); if (e.currentTarget === e.target) setIsDraggingOver(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!isDraggingOver) setIsDraggingOver(true); };

  const getSnappedCoordinates = (rawX: number, rawY: number, canvasWidth: number, canvasHeight: number) => {
    const SNAP_THRESHOLD = 150; 
    const CARD_WIDTH = 120; const CARD_HEIGHT = 200;
    const cardCenterX = rawX + (CARD_WIDTH / 2); const cardCenterY = rawY + (CARD_HEIGHT / 2);
    if (currentLayout.id === 'free') return { x: rawX, y: rawY, snapped: true };
    let bestX = rawX; let bestY = rawY; let minDistance = Infinity; let hasValidSnap = false; let snappedSlotId = null;
    currentLayout.slots.forEach(slot => {
        let slotCenterX = 0; let slotCenterY = 0;
        if (typeof slot.x === 'string' && slot.x.includes('%')) { slotCenterX = (parseFloat(slot.x) / 100) * canvasWidth; } else { slotCenterX = Number(slot.x); }
        if (typeof slot.y === 'string' && slot.y.includes('%')) { slotCenterY = (parseFloat(slot.y) / 100) * canvasHeight; } else { slotCenterY = Number(slot.y); }
        const dist = Math.sqrt(Math.pow(cardCenterX - slotCenterX, 2) + Math.pow(cardCenterY - slotCenterY, 2));
        if (dist < minDistance) { minDistance = dist; bestX = slotCenterX - (CARD_WIDTH / 2); bestY = slotCenterY - (CARD_HEIGHT / 2); snappedSlotId = slot.id; }
        if (dist < SNAP_THRESHOLD) { hasValidSnap = true; }
    });
    return hasValidSnap ? { x: bestX, y: bestY, snapped: true, slotId: snappedSlotId } : { x: rawX, y: rawY, snapped: false, slotId: null };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingOver(false);
    const type = e.dataTransfer.getData('type');
    const containerRect = canvasRef.current?.parentElement?.getBoundingClientRect();
    if (!containerRect || !canvasRef.current) return;
    const relativeX = e.clientX - containerRect.left; const relativeY = e.clientY - containerRect.top;
    const correctedX = (relativeX - currentPanRef.current.x) / zoom; const correctedY = (relativeY - currentPanRef.current.y) / zoom;
    const unscaledWidth = canvasRef.current.offsetWidth; const unscaledHeight = canvasRef.current.offsetHeight;
    const dropX = correctedX - 60; const dropY = correctedY - 100;
    const snapResult = getSnappedCoordinates(dropX, dropY, unscaledWidth, unscaledHeight);
    if (!snapResult.snapped && currentLayout.id !== 'free') return; 

    let existingCards = [...placedCards];
    if (snapResult.snapped && snapResult.slotId) {
        const TOLERANCE = 10;
        const occupiedCard = existingCards.find(c => Math.abs(c.x - snapResult.x) < TOLERANCE && Math.abs(c.y - snapResult.y) < TOLERANCE);
        if (occupiedCard) existingCards = existingCards.filter(c => c.instanceId !== occupiedCard.instanceId);
    }

    if (type === DragType.SIDEBAR_CARD) {
      const cardId = e.dataTransfer.getData('cardId');
      let cardData;
      const deck = aiConfig.customDecks.find(d => d.id === activeDeckId) || aiConfig.customDecks[0];
      if (deck) { const customCard = deck.cards.find(c => c.id === cardId); if (customCard) cardData = { ...customCard, image: customCard.image }; }
      if (cardData) {
        const newCard: PlacedCard = {
          ...cardData,
          instanceId: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: snapResult.x, y: snapResult.y, rotation: 0, isReversed: false,
          image: cardData.image || getCardImageUrl(cardData.id, aiConfig.deckStyle, aiConfig.customCardImages)
        };
        updateCardsWithHistory([...existingCards, newCard]);
      }
    } else if (type === DragType.CANVAS_CARD) {
      const instanceId = e.dataTransfer.getData('instanceId');
      const cardToMove = placedCards.find(c => c.instanceId === instanceId);
      if (cardToMove) {
          const otherCards = existingCards.filter(c => c.instanceId !== instanceId);
          const updatedCard = { ...cardToMove, x: snapResult.x, y: snapResult.y };
          // Push to end for z-index
          updateCardsWithHistory([...otherCards, updatedCard]);
      }
    }
  };

  const updateCard = (instanceId: string, updates: Partial<PlacedCard>) => {
    const newCards = placedCards.map(c => c.instanceId === instanceId ? { ...c, ...updates } : c);
    updateCardsWithHistory(newCards);
  };
  const removeCard = (instanceId: string) => { const newCards = placedCards.filter(c => c.instanceId !== instanceId); updateCardsWithHistory(newCards); };
  const handleClearTable = () => { if (placedCards.length > 0) updateCardsWithHistory([]); };
  const handleCanvasCardDragStart = (e: React.DragEvent, instanceId: string) => { e.dataTransfer.setData('type', DragType.CANVAS_CARD); e.dataTransfer.setData('instanceId', instanceId); };
  
  const handleUndo = () => { if (historyIndex > 0) { const newIndex = historyIndex - 1; setHistoryIndex(newIndex); setPlacedCards(history[newIndex]); } };
  const handleRedo = () => { if (historyIndex < history.length - 1) { const newIndex = historyIndex + 1; setHistoryIndex(newIndex); setPlacedCards(history[newIndex]); } };
  const handleWheel = (e: React.WheelEvent) => { if (viewMode === 'canvas') { const direction = e.deltaY > 0 ? -1 : 1; setZoom(prev => Math.max(0.5, Math.min(prev + (direction * 0.1), 2.0))); } };
  
  const handleMouseDown = (e: React.MouseEvent) => {
      const isMiddleClick = e.button === 1; const isLeftClickAndSpace = e.button === 0 && isSpacePressed;
      if (isMiddleClick || isLeftClickAndSpace) {
        if ((e.target as HTMLElement).closest('.card-element') && !isSpacePressed) return;
        e.preventDefault(); isPanningRef.current = true; setIsPanningState(true); panStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - panStartRef.current.x; const dy = e.clientY - panStartRef.current.y;
      const newX = currentPanRef.current.x + dx; const newY = currentPanRef.current.y + dy;
      if (canvasWrapperRef.current) canvasWrapperRef.current.style.transform = `translate(${newX}px, ${newY}px) scale(${zoom})`;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
      if (isPanningRef.current) {
          isPanningRef.current = false; setIsPanningState(false);
          const dx = e.clientX - panStartRef.current.x; const dy = e.clientY - panStartRef.current.y;
          setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
  };

  const handleInterpret = async () => {
    if (placedCards.length === 0) { alert("Por favor, coloque cartas na mesa."); return; }
    setReadingLoading(true); if (!isChatOpen) setIsChatOpen(true);
    try { const response = await interpretSpread(placedCards, aiConfig, currentLayout); setReadingContent(response); } catch (error) { setReadingContent("Erro ao interpretar."); } finally { setReadingLoading(false); }
  };

  return (
    <div className="flex h-screen w-full bg-mystic-900 text-gray-100 font-sans overflow-hidden relative">
      {showConfetti && <Confetti />}
      {viewMode === 'canvas' && (<div className="h-full flex flex-col glass-panel border-r border-gold-500/20 w-80 shrink-0 z-20 transition-all"><SidebarWrapper aiConfig={aiConfig} activeDeckId={activeDeckId} onSelectDeck={setActiveDeckId} /></div>)}
      <main className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        {viewMode !== 'builder' && (
          <header className="h-18 flex items-center justify-between px-6 border-b border-gold-500/10 bg-mystic-950/90 backdrop-blur-md z-10 shadow-xl">
            <div className="flex items-center gap-6 h-full">
               <div className="flex items-center gap-2 text-gold-400 font-serif font-bold text-xl mr-2"><Sparkles className="fill-gold-500/20" /><span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 to-gold-500 hidden xl:block">MysticTarot</span></div>
               <div className="flex bg-mystic-900/50 p-1 rounded-lg border border-white/5">{[{ id: 'crm', label: 'Clientes', icon: Users }, { id: 'canvas', label: 'Mesa', icon: LayoutGrid }, { id: 'settings', label: 'Config', icon: Settings }].map(item => (<button key={item.id} onClick={() => setViewMode(item.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${viewMode === item.id ? 'bg-gradient-to-b from-gold-500 to-gold-600 text-mystic-950 shadow-lg shadow-gold-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><item.icon size={14} /><span className="hidden lg:inline">{item.label}</span></button>))}</div>
            </div>
            {viewMode === 'canvas' && (
               <div className="flex items-center gap-4 bg-mystic-800/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner mx-4 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1"><button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><Undo2 size={18} /></button><button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><Redo2 size={18} /></button></div>
                  <div className="w-px h-6 bg-white/10 mx-2"></div>
                  <div className="flex items-center gap-2"><LayoutGrid size={16} className="text-gold-500/50" /><select value={currentLayoutId} onChange={(e) => setCurrentLayoutId(e.target.value)} className="bg-transparent text-sm font-bold text-gray-300 focus:outline-none cursor-pointer w-32 xl:w-48 appearance-none truncate hover:text-white transition-colors"><optgroup label="Padrão">{SPREAD_LAYOUTS.map(layout => (<option key={layout.id} value={layout.id} className="bg-mystic-900 text-gray-300">{layout.name}</option>))}</optgroup>{customLayouts.length > 0 && (<optgroup label="Meus Layouts">{customLayouts.map(layout => (<option key={layout.id} value={layout.id} className="bg-mystic-900 text-gold-400">{layout.name}</option>))}</optgroup>)}</select></div>
                  {currentLayout.isCustom && (<button onClick={() => handleDeleteCustomLayout(currentLayout.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"><Trash2 size={14}/></button>)}
                  <button onClick={() => setViewMode('builder')} className="p-1.5 hover:bg-gold-500/20 text-gold-400 rounded transition-colors" title="Novo Layout"><PlusCircle size={14}/></button>
               </div>
            )}
            <div className="flex items-center gap-3">
              {viewMode === 'canvas' && (
                <>
                  <button onClick={() => setIsSessionConfigOpen(true)} className="flex items-center gap-2 px-3 py-2 text-gold-300 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all text-xs font-bold"><Bot size={16} /><span className="hidden xl:inline">{aiConfig.sessionName || 'Sessão'}</span></button>
                  <div className="flex items-center gap-1 bg-mystic-900 p-1 rounded-lg border border-white/10"><button onClick={loadLastState} className="p-2 text-gray-400 hover:text-gold-300 hover:bg-white/5 rounded-md transition-colors" title="Restaurar"><Upload size={16} /></button><button onClick={saveReading} className="p-2 text-gray-400 hover:text-gold-300 hover:bg-white/5 rounded-md transition-colors" title="Salvar"><Save size={16} /></button><button onClick={handleClearTable} className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors" title="Limpar"><Trash2 size={16} /></button></div>
                  <div className="w-px h-6 bg-white/10 mx-2"></div>
                  <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2.5 rounded-lg border transition-all relative ${isChatOpen ? 'bg-mystic-800 text-gold-400 border-gold-500/50' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'}`} title="Chat de Interpretação"><MessageSquare size={18} />{readingContent && !isChatOpen && <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>}</button>
                  <button onClick={handleExportPDF} disabled={placedCards.length === 0} className="p-2.5 bg-gold-500 hover:bg-gold-400 text-mystic-950 rounded-lg shadow-lg shadow-gold-500/20 transition-all disabled:opacity-50" title="Exportar PDF"><Download size={18} /></button>
                </>
              )}
            </div>
          </header>
        )}
        {viewMode === 'canvas' ? (
          <div className="flex-1 relative overflow-hidden bg-radial-gradient from-mystic-800 to-mystic-950 flex">
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"><div className="w-[500px] h-[500px] rounded-full border-[20px] border-white"></div><div className="absolute w-[300px] h-[300px] border border-white rotate-45"></div><div className="absolute w-[300px] h-[300px] border border-white"></div></div>
             {activeClient && (<div className="absolute top-12 left-0 right-0 text-center pointer-events-none z-0"><h2 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold-500/40 to-transparent drop-shadow-md tracking-widest uppercase select-none opacity-30 mask-image-gradient">{activeClient.name}</h2></div>)}
            <div className={`flex-1 h-full relative overflow-hidden ${isPanningState ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
               <div ref={canvasWrapperRef} className={`w-full h-full relative transition-transform duration-75 origin-top-left ${isDraggingOver ? 'bg-gold-500/10 ring-4 ring-inset ring-gold-500/30 shadow-[inset_0_0_100px_rgba(212,175,55,0.2)]' : ''}`} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                  <div ref={canvasRef} className="w-full h-full"> 
                      {placedCards.length === 0 && currentLayoutId === 'free' && (<div className="absolute inset-0 flex items-center justify-center text-mystic-500/40 pointer-events-none"><div className="text-center animate-pulse" style={{ transform: `scale(${1/zoom})` }}><AlertCircle size={48} className="mx-auto mb-2 opacity-50" /><p className="text-lg font-serif">Arraste cartas do menu esquerdo para iniciar</p><p className="text-xs mt-2 opacity-60">Espaço + Clique ou Clique Central para mover a mesa</p></div></div>)}
                      {currentLayout.slots.map(slot => (
                          <div key={slot.id} className={`slot-placeholder absolute border-2 border-dashed rounded-lg flex items-center justify-center pointer-events-none transition-all duration-300 ${isDraggingOver ? 'border-gold-400 bg-gold-500/20 shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105' : 'border-gold-500/20 bg-gradient-to-br from-mystic-900/80 via-purple-900/20 to-gold-900/10 shadow-lg hover:border-gold-500/40'}`} style={{ width: '120px', height: '200px', left: slot.x, top: slot.y, transform: 'translate(-50%, -50%)', zIndex: 1 }}>
                              <span className={`font-serif text-sm font-bold tracking-widest text-center px-2 ${isDraggingOver ? 'text-gold-200' : 'text-gold-300/40'}`}>{slot.label}</span>
                          </div>
                      ))}
                      <CardsLayer cards={placedCards} onDragStart={handleCanvasCardDragStart} onRemove={removeCard} onFlip={(id) => updateCard(id, { isReversed: !placedCards.find(c => c.instanceId === id)?.isReversed })} onRotate={(id) => updateCard(id, { rotation: ((placedCards.find(c => c.instanceId === id)?.rotation || 0) + 45) % 360 })} pan={pan} zoom={zoom} containerSize={windowSize} />
                  </div>
              </div>
            </div>
            <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} isLoading={readingLoading} content={readingContent} activeDeckId={activeDeckId} customDecks={aiConfig.customDecks} aiConfig={aiConfig} onInterpret={handleInterpret} />
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-mystic-900/90 p-2 rounded-lg border border-gold-500/20 shadow-xl backdrop-blur-sm z-40"><button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.0))} className="p-2 hover:bg-gold-500/20 rounded text-gold-400 hover:text-gold-200 transition-colors"><ZoomIn size={20} /></button><button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 hover:bg-gold-500/20 rounded text-gold-400 hover:text-gold-200 transition-colors font-bold text-xs">{Math.round(zoom * 100)}%</button><button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} className="p-2 hover:bg-gold-500/20 rounded text-gold-400 hover:text-gold-200 transition-colors"><ZoomOut size={20} /></button></div>
          </div>
        ) : viewMode === 'crm' ? (
          <CRMModal isOpen={true} onClose={() => setViewMode('canvas')} clients={clients} activeClient={activeClient} onSelectClient={setActiveClient} onStartReading={handleStartNewReading} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} onDeleteReading={handleDeleteReading} onUpdateReading={handleUpdateReading} onLoadReading={handleLoadReading} />
        ) : viewMode === 'builder' ? (
          <LayoutBuilder onSave={handleSaveCustomLayout} onBack={() => setViewMode('canvas')} presets={layoutPresets} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset} />
        ) : (
          <SettingsPage config={aiConfig} onSave={(newConfig) => { setAiConfig(newConfig); setViewMode('canvas'); }} onBack={() => setViewMode('canvas')} />
        )}
      </main>
      <SessionConfigModal isOpen={isSessionConfigOpen} onClose={() => setIsSessionConfigOpen(false)} config={aiConfig} onSave={setAiConfig} />
    </div>
  );
};

const SidebarWrapper: React.FC<{ aiConfig: AIConfig; activeDeckId: string; onSelectDeck: (id: string) => void; }> = ({ aiConfig, activeDeckId, onSelectDeck }) => {
    return ( <Sidebar deckStyle={aiConfig.deckStyle} customCardImages={aiConfig.customCardImages} customDecks={aiConfig.customDecks} activeDeckId={activeDeckId} onSelectDeck={onSelectDeck} /> );
};

export default App;
