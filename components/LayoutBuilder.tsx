
import React, { useState, useRef } from 'react';
import { SpreadLayout, SpreadSlot } from '../types';
import { Save, Plus, Trash2, ArrowLeft, Move, Type, LayoutGrid, Bookmark, GripVertical, Link as LinkIcon, X } from 'lucide-react';

interface LayoutBuilderProps {
  onSave: (layout: SpreadLayout) => void;
  onBack: () => void;
  presets: SpreadLayout[];
  onSavePreset: (preset: SpreadLayout) => void;
  onDeletePreset: (id: string) => void;
}

export const LayoutBuilder: React.FC<LayoutBuilderProps> = ({ onSave, onBack, presets = [], onSavePreset, onDeletePreset }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slots, setSlots] = useState<SpreadSlot[]>([]);
  const [connections, setConnections] = useState<{ from: string; to: string }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  // Connection Mode State
  const [isLinking, setIsLinking] = useState(false);
  const [linkStartId, setLinkStartId] = useState<string | null>(null);
  
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addSlot = () => {
    const newSlot: SpreadSlot = {
      id: `slot-${Date.now()}`,
      label: `Posição ${slots.length + 1}`,
      x: '50%',
      y: '50%'
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newSlot.id);
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    if (selectedSlotId === id) setSelectedSlotId(null);
  };

  const updateSlotLabel = (id: string, label: string) => {
    setSlots(slots.map(s => s.id === id ? { ...s, label } : s));
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xFn = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const yFn = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const xPerc = (xFn / rect.width) * 100;
    const yPerc = (yFn / rect.height) * 100;
    setSlots(slots.map(s => s.id === id ? { ...s, x: `${xPerc.toFixed(1)}%`, y: `${yPerc.toFixed(1)}%` } : s));
  };

  const handleSlotClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (isLinking && linkStartId) {
          if (linkStartId !== id) {
             // Create connection
             setConnections([...connections, { from: linkStartId, to: id }]);
             setLinkStartId(null);
             setIsLinking(false);
          }
      } else {
          setSelectedSlotId(id);
      }
  };

  const startLinking = () => {
      if (selectedSlotId) {
          setIsLinking(true);
          setLinkStartId(selectedSlotId);
      } else {
          alert("Selecione um slot primeiro para iniciar a conexão.");
      }
  };
  
  const removeConnection = (index: number) => {
      const newConns = [...connections];
      newConns.splice(index, 1);
      setConnections(newConns);
  };

  const handleSaveLayout = () => {
    if (!name.trim()) return alert("Nome necessário.");
    if (slots.length === 0) return alert("Adicione slots.");

    const newLayout: SpreadLayout = {
      id: `custom-${Date.now()}`,
      name,
      description,
      slots,
      connections,
      isCustom: true
    };
    onSave(newLayout);
  };

  const handleSaveAsPreset = () => {
      if (slots.length === 0) {
          alert("Adicione slots antes de salvar como preset.");
          return;
      }
      const presetName = window.prompt("Nome do Preset:", name || "Meu Preset");
      if (presetName) {
          const newPreset: SpreadLayout = {
              id: `preset-${Date.now()}`,
              name: presetName,
              description: "Preset salvo pelo usuário",
              slots: [...slots], // clone slots
              isCustom: true
          };
          onSavePreset(newPreset);
      }
  };

  const loadPreset = (presetId: string) => {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
          if (slots.length > 0 && !window.confirm("Isso substituirá os slots atuais. Continuar?")) {
              return;
          }
          setSlots(preset.slots.map(s => ({ ...s, id: `slot-${Date.now()}-${Math.random()}` })));
          if (!name) setName(preset.name + " (Cópia)");
      }
  };

  const handleListDragStart = (e: React.DragEvent, index: number) => {
     setDraggedSlotIndex(index);
     e.dataTransfer.effectAllowed = "move";
  };
  const handleListDragOver = (e: React.DragEvent, index: number) => {
     e.preventDefault();
     if (draggedSlotIndex === null || draggedSlotIndex === index) return;
     const newSlots = [...slots];
     const draggedItem = newSlots[draggedSlotIndex];
     newSlots.splice(draggedSlotIndex, 1);
     newSlots.splice(index, 0, draggedItem);
     setSlots(newSlots);
     setDraggedSlotIndex(index);
  };
  const handleListDrop = () => { setDraggedSlotIndex(null); };

  const getSlotCenter = (slot: SpreadSlot) => {
     const xVal = typeof slot.x === 'string' ? parseFloat(slot.x) : slot.x;
     const yVal = typeof slot.y === 'string' ? parseFloat(slot.y) : slot.y;
     return { x: xVal, y: yVal };
  };

  return (
    <div className="w-full h-full flex flex-col bg-mystic-900 animate-in fade-in duration-300">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-mystic-800/50 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="mr-2 text-gold-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
          <LayoutGrid className="text-gold-400" size={24} />
          <h3 className="text-xl font-serif text-gold-100">Criador de Layouts</h3>
        </div>
        <button onClick={handleSaveLayout} className="flex items-center gap-2 px-6 py-2 bg-gold-600 hover:bg-gold-500 text-mystic-900 font-bold rounded-md transition-colors shadow-lg"><Save size={18} /> Salvar Layout</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-mystic-800 border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
           <div className="bg-mystic-900/50 p-3 rounded-lg border border-gold-500/10 mb-2">
              <h4 className="text-xs font-bold text-gold-300 mb-2 uppercase flex items-center gap-2"><Bookmark size={12} /> Meus Presets</h4>
              <div className="flex gap-2 mb-2">
                 <select className="flex-1 bg-mystic-800 border border-mystic-600 rounded p-1.5 text-xs text-white outline-none" onChange={(e) => loadPreset(e.target.value)} value="">
                    <option value="" disabled>Carregar Preset...</option>
                    {presets.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                 </select>
                 <button onClick={handleSaveAsPreset} className="bg-gold-600/20 text-gold-400 p-1.5 rounded hover:bg-gold-600 hover:text-mystic-900 transition-colors"><Save size={14} /></button>
              </div>
              {presets.length > 0 && (
                  <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">
                      {presets.map(p => (
                          <div key={p.id} className="flex justify-between items-center text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-mystic-800">
                              <span>{p.name}</span>
                              <button onClick={() => onDeletePreset(p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={10}/></button>
                          </div>
                      ))}
                  </div>
              )}
           </div>

           <div className="space-y-4">
              <input type="text" className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white focus:border-gold-500 outline-none" placeholder="Nome do Layout" value={name} onChange={(e) => setName(e.target.value)} />
              <textarea className="w-full bg-mystic-900 border border-mystic-600 rounded p-2 text-white focus:border-gold-500 outline-none h-20 text-sm resize-none" placeholder="Descrição..." value={description} onChange={(e) => setDescription(e.target.value)} />
           </div>

           <div className="flex gap-2">
               <button onClick={addSlot} className="flex-1 bg-gold-600/20 text-gold-400 hover:bg-gold-600 hover:text-mystic-900 py-2 rounded text-xs font-bold border border-gold-500/30 flex items-center justify-center gap-2"><Plus size={14}/> Add Slot</button>
               <button onClick={startLinking} disabled={!selectedSlotId || isLinking} className={`flex-1 py-2 rounded text-xs font-bold border flex items-center justify-center gap-2 transition-all ${isLinking ? 'bg-gold-500 text-mystic-900 animate-pulse' : 'bg-mystic-900 border-mystic-600 text-gray-400 hover:text-white'}`}><LinkIcon size={14} /> {isLinking ? 'Selecione Destino' : 'Criar Conexão'}</button>
           </div>
           
           {connections.length > 0 && (
               <div className="bg-mystic-900/50 p-2 rounded">
                   <h5 className="text-[10px] font-bold text-gold-500 uppercase mb-2">Conexões Ativas</h5>
                   <div className="space-y-1">
                       {connections.map((conn, idx) => {
                           const sA = slots.find(s => s.id === conn.from);
                           const sB = slots.find(s => s.id === conn.to);
                           return (
                               <div key={idx} className="flex justify-between items-center text-xs text-gray-400 bg-mystic-800 px-2 py-1 rounded">
                                   <span>{sA?.label || '?'} ↔ {sB?.label || '?'}</span>
                                   <button type="button" onClick={() => removeConnection(idx)} className="text-red-400 hover:text-white"><X size={10}/></button>
                               </div>
                           )
                       })}
                   </div>
               </div>
           )}

           <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
               {slots.map((slot, idx) => (
                 <div key={slot.id} draggable onDragStart={(e) => handleListDragStart(e, idx)} onDragOver={(e) => handleListDragOver(e, idx)} onDragEnd={handleListDrop} className={`p-2 rounded border flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all ${selectedSlotId === slot.id ? 'bg-gold-500/10 border-gold-500 text-gold-200' : 'bg-mystic-900 border-mystic-700 text-gray-400'}`} onClick={() => setSelectedSlotId(slot.id)}>
                    <GripVertical size={14} />
                    <div className="bg-mystic-950 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                    <input type="text" className="bg-transparent border-none outline-none w-full text-xs" value={slot.label} onChange={(e) => updateSlotLabel(slot.id, e.target.value)} />
                    <button onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }} className="hover:text-red-400"><Trash2 size={14} /></button>
                 </div>
               ))}
           </div>
        </div>

        <div className="flex-1 bg-mystic-950 relative overflow-hidden bg-[radial-gradient(#2d1b4e_1px,transparent_1px)] [background-size:20px_20px]">
           <div ref={containerRef} className="w-full h-full relative">
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                  {connections.map((conn, idx) => {
                      const sA = slots.find(s => s.id === conn.from);
                      const sB = slots.find(s => s.id === conn.to);
                      if (!sA || !sB) return null;
                      const pA = getSlotCenter(sA);
                      const pB = getSlotCenter(sB);
                      return (<line key={idx} x1={`${pA.x}%`} y1={`${pA.y}%`} x2={`${pB.x}%`} y2={`${pB.y}%`} stroke="#D4AF37" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />);
                  })}
              </svg>

              {slots.map((slot) => (
                <div key={slot.id} draggable onDragEnd={(e) => handleDragEnd(e, slot.id)} onClick={(e) => handleSlotClick(e, slot.id)} className={`absolute w-[120px] h-[200px] -translate-x-1/2 -translate-y-1/2 rounded-lg flex flex-col items-center justify-center cursor-move transition-all group hover:z-50 ${selectedSlotId === slot.id ? 'border-2 border-gold-400 bg-gold-500/20 shadow-[0_0_20px_rgba(212,175,55,0.3)] z-40' : 'border-2 border-dashed border-mystic-600 bg-mystic-900/50 hover:border-gold-500/50 z-10'} ${isLinking && selectedSlotId === slot.id ? 'ring-4 ring-gold-500/50' : ''}`} style={{ left: slot.x, top: slot.y }}>
                  {/* Ghost Card Preview */}
                  <div className="absolute inset-2 bg-mystic-800/50 rounded border border-white/5 opacity-50 pointer-events-none" />
                  <Move size={24} className={`mb-2 relative z-10 ${selectedSlotId === slot.id ? 'text-gold-400' : 'text-mystic-600 group-hover:text-mystic-400'}`} />
                  <span className={`text-xs font-bold text-center px-2 select-none relative z-10 ${selectedSlotId === slot.id ? 'text-gold-200' : 'text-mystic-500'}`}>{slot.label}</span>
                  <span className="absolute bottom-2 text-[10px] text-gray-600 font-mono z-10">{parseInt(slot.x as string)}%, {parseInt(slot.y as string)}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
