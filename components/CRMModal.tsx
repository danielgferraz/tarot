
import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Search, CheckCircle, User, Calendar, Eye, ArrowLeft, Clock, Layout, FileText, MapPin, Trash2, Edit2, PlayCircle, Save, PlusCircle, ArrowRight, BookTemplate } from 'lucide-react';
import { Client, SavedReading } from '../types';
import { DEFAULT_QUESTION_TEMPLATES } from '../constants';
import ReactMarkdown from 'react-markdown';

interface CRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onStartReading: (client: Client) => void;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onDeleteReading: (clientId: string, readingId: string) => void;
  onUpdateReading: (clientId: string, reading: SavedReading) => void;
  onLoadReading: (reading: SavedReading) => void;
}

export const CRMModal: React.FC<CRMModalProps> = ({ 
  isOpen, onClose, clients, activeClient, onSelectClient, onStartReading, onAddClient,
  onUpdateClient, onDeleteClient, onDeleteReading, onUpdateReading, onLoadReading
}) => {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'history'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // History View State
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedReading, setSelectedReading] = useState<SavedReading | null>(null);
  const [isEditingReadingTitle, setIsEditingReadingTitle] = useState(false);
  const [tempReadingTitle, setTempReadingTitle] = useState('');

  // Form States (Add/Edit)
  const [formData, setFormData] = useState({ name: '', email: '', notes: '' });

  // Safety check
  useEffect(() => {
      if (view === 'history' && viewingClient) {
          const exists = clients.find(c => c.id === viewingClient.id);
          if (!exists) {
              setViewingClient(null);
              setView('list');
          }
      }
  }, [clients, view, viewingClient]);

  useEffect(() => {
    if (view === 'history' && selectedReading && viewingClient) {
      const updatedClient = clients.find(c => c.id === viewingClient.id);
      if (updatedClient) {
        const updatedReading = updatedClient.readingsHistory.find(r => r.id === selectedReading.id);
        if (updatedReading) {
          setSelectedReading(updatedReading);
        }
      }
    }
  }, [clients, view, viewingClient, selectedReading]);

  if (!isOpen) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredReadings = (client: Client) => {
    if (!dateFilter) return client.readingsHistory;
    return client.readingsHistory.filter(reading => {
      const readingDate = new Date(reading.date).toISOString().split('T')[0];
      return readingDate === dateFilter;
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };
  
  const getShortDate = (isoString: string) => {
      return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const startEdit = (client: Client) => {
      setViewingClient(client);
      setFormData({ name: client.name, email: client.email || '', notes: client.notes || '' });
      setView('edit');
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (view === 'add') {
        const newClient: Client = {
            id: Date.now().toString(),
            name: formData.name,
            email: formData.email,
            notes: formData.notes,
            readingsHistory: []
        };
        onAddClient(newClient);
    } else if (view === 'edit' && viewingClient) {
        onUpdateClient({
            ...viewingClient,
            name: formData.name,
            email: formData.email,
            notes: formData.notes
        });
    }

    setFormData({ name: '', email: '', notes: '' });
    setView('list');
  };

  const handleDeleteClient = (client: Client, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`Tem certeza que deseja excluir ${client.name}? Todo o histórico será perdido.`)) {
          onDeleteClient(client.id);
          if (activeClient?.id === client.id) onSelectClient(null);
      }
  };

  const openHistory = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingClient(client);
    setView('history');
    setDateFilter('');
    setSelectedReading(null);
  };

  const handleDeleteReading = () => {
      if (viewingClient && selectedReading) {
          if (window.confirm("Excluir esta leitura permanentemente?")) {
              onDeleteReading(viewingClient.id, selectedReading.id);
              setSelectedReading(null);
          }
      }
  };

  const handleUpdateReadingTitle = () => {
    if (viewingClient && selectedReading && tempReadingTitle.trim() !== '') {
        const updatedReading = { ...selectedReading, title: tempReadingTitle };
        onUpdateReading(viewingClient.id, updatedReading);
        setIsEditingReadingTitle(false);
    }
  };

  const handleLoadReading = () => {
      if (selectedReading) {
          if (window.confirm("Retomar esta leitura substituirá as cartas atuais na mesa. Continuar?")) {
              onLoadReading(selectedReading);
              onClose(); // Go to canvas
          }
      }
  };

  const handleBack = () => {
    if (selectedReading) {
      setSelectedReading(null);
    } else if (view === 'history' || view === 'edit') {
      setView('list');
      setViewingClient(null);
    } else if (view === 'add') {
      setView('list');
    }
  };

  const startEditReadingTitle = () => {
      if (selectedReading) {
          setTempReadingTitle(selectedReading.title || selectedReading.layoutName);
          setIsEditingReadingTitle(true);
      }
  };

  const applyTemplate = (questions: string) => {
    setFormData(prev => ({
      ...prev,
      notes: (prev.notes ? prev.notes + "\n\n" : "") + "--- Roteiro de Perguntas ---\n" + questions
    }));
  };

  const currentClient = view === 'history' && viewingClient 
      ? clients.find(c => c.id === viewingClient.id) || viewingClient 
      : null;

  return (
    <div className="w-full h-full flex flex-col bg-mystic-900 animate-in fade-in duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-mystic-800/50 shrink-0">
          <div className="flex items-center gap-3">
             {view !== 'list' && (
                <button onClick={handleBack} className="mr-2 text-gold-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
             )}
            <Users className="text-gold-400" size={28} />
            <h3 className="text-2xl font-serif text-gold-100">
                {view === 'add' ? 'Novo Querente' : 
                 view === 'edit' ? 'Editar Querente' :
                 view === 'history' && currentClient ? `Histórico de ${currentClient.name}` : 
                 'Gestão de Querentes'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-mystic-800 hover:bg-mystic-700 border border-gold-500/30 text-gold-200 rounded-md transition-colors"
          >
            <span>Ir para Mesa</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-mystic-900/80 relative">
          
          {selectedReading ? (
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 bg-mystic-950/50 border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 bg-mystic-900">
                         <h4 className="text-gold-300 font-serif flex items-center gap-2">
                            <Layout size={16} /> Cartas ({selectedReading.cards.length})
                         </h4>
                         <p className="text-xs text-gray-400 mt-1">{selectedReading.layoutName}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-3">
                            {selectedReading.cards.map((card, idx) => (
                                <div key={idx} className="flex gap-3 bg-mystic-800 p-2 rounded border border-white/5 items-center">
                                    <div className="w-12 h-16 bg-black rounded overflow-hidden shrink-0 border border-gold-500/30">
                                        <img src={card.image} className={`w-full h-full object-cover ${card.isReversed ? 'rotate-180' : ''}`} alt={card.name} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gold-100 truncate">{card.name}</p>
                                        <p className="text-xs text-red-300">{card.isReversed ? 'Invertida' : 'Normal'}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                            <MapPin size={10} />
                                            <span>Pos: {Math.round(card.x)}, {Math.round(card.y)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-mystic-800/30">
                    <div className="p-4 border-b border-white/10 bg-mystic-900 flex justify-between items-center">
                         <div className="flex-1 mr-4">
                            <h4 className="text-gold-300 font-serif flex items-center gap-2 mb-1">
                                <FileText size={16} /> Detalhes & Interpretação
                            </h4>
                            {isEditingReadingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={tempReadingTitle}
                                        onChange={(e) => setTempReadingTitle(e.target.value)}
                                        className="bg-mystic-800 border border-gold-500/50 rounded px-2 py-1 text-sm text-white w-full max-w-xs focus:outline-none"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateReadingTitle} className="text-green-400 hover:text-green-300"><CheckCircle size={16}/></button>
                                    <button onClick={() => setIsEditingReadingTitle(false)} className="text-red-400 hover:text-red-300"><X size={16}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                    <span className="text-sm font-bold text-gold-500 block truncate max-w-[200px] md:max-w-md">
                                        {selectedReading.title || selectedReading.layoutName}
                                    </span>
                                    <button 
                                        onClick={startEditReadingTitle}
                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gold-400 transition-opacity"
                                        title="Editar Título"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>
                            )}
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                             <button 
                                onClick={handleLoadReading}
                                className="flex items-center gap-1 px-3 py-1 bg-mystic-700 hover:bg-gold-600 hover:text-mystic-900 text-gold-400 text-xs rounded transition-colors font-bold border border-gold-500/30"
                                title="Carregar na Mesa"
                             >
                                 <PlayCircle size={14} /> <span className="hidden sm:inline">Retomar</span>
                             </button>
                             <button 
                                onClick={handleDeleteReading}
                                className="flex items-center gap-1 px-3 py-1 bg-red-900/20 hover:bg-red-900 text-red-400 text-xs rounded transition-colors font-bold border border-red-500/30"
                                title="Excluir Leitura"
                             >
                                 <Trash2 size={14} /> <span className="hidden sm:inline">Excluir</span>
                             </button>
                         </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="prose prose-invert prose-gold max-w-none text-sm text-gray-200">
                            <ReactMarkdown>{selectedReading.interpretation || "*Nenhuma interpretação salva para esta leitura.*"}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
          ) : view === 'history' && currentClient ? (
            <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b border-white/5 bg-mystic-800/30 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={16} className="text-gold-400" />
                        <span>Filtrar por data:</span>
                        <input 
                            type="date" 
                            className="bg-mystic-900 border border-mystic-600 rounded px-2 py-1 text-white focus:border-gold-500 outline-none"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onStartReading(currentClient)}
                            className="bg-gold-600 hover:bg-gold-500 text-mystic-900 px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-gold-500/10"
                        >
                            <PlusCircle size={16} /> Nova Leitura
                        </button>
                        <div className="text-xs text-gray-500 border-l border-white/10 pl-3">
                            {getFilteredReadings(currentClient).length} leituras
                        </div>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {getFilteredReadings(currentClient).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-mystic-400 opacity-50">
                            <Layout size={48} className="mb-2" />
                            <p>Nenhuma leitura encontrada {dateFilter ? 'nesta data' : ''}.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-4xl mx-auto">
                            {getFilteredReadings(currentClient).map(reading => (
                                <div 
                                    key={reading.id} 
                                    className="bg-mystic-800 hover:bg-mystic-700 border border-white/5 hover:border-gold-500/30 rounded-lg p-6 flex items-center justify-between transition-all group shadow-md"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="bg-mystic-900 p-3 rounded-lg border border-white/5">
                                            <Layout size={24} className="text-gold-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-gold-100 font-bold text-lg">{reading.layoutName}</h4>
                                                {reading.title && (
                                                    <span className="text-xs bg-gold-500/10 text-gold-300 px-2 py-0.5 rounded border border-gold-500/20">{reading.title}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(reading.date)}</span>
                                                <span>• {reading.cards.length} cartas</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setSelectedReading(reading)}
                                        className="flex items-center gap-2 px-4 py-2 bg-mystic-900 hover:bg-gold-600 hover:text-mystic-900 text-gold-400 text-sm rounded transition-colors font-bold border border-gold-500/10"
                                    >
                                        <Eye size={16} /> Ver Detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            </div>
          ) : view === 'list' ? (
            <>
              <div className="p-6 flex gap-4 border-b border-white/5 bg-mystic-800/30 items-center justify-center">
                <div className="relative w-full max-w-2xl">
                  <input 
                    type="text" 
                    placeholder="Buscar querente por nome ou email..." 
                    className="w-full bg-mystic-800 border border-mystic-600 rounded-lg py-3 pl-10 pr-4 text-base text-white focus:border-gold-500 focus:outline-none shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3.5 text-mystic-400" size={18} />
                </div>
                <button 
                  onClick={() => { setView('add'); setFormData({ name: '', email: '', notes: '' }); }}
                  className="bg-gold-600 hover:bg-gold-500 text-mystic-900 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-gold-500/10"
                >
                  <UserPlus size={18} />
                  <span>Novo Querente</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-20 text-mystic-400 opacity-60">
                    <Users size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhum querente encontrado.</p>
                    <p className="text-sm">Adicione um novo querente para começar.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 max-w-5xl mx-auto">
                    {filteredClients.map(client => (
                      <div 
                        key={client.id} 
                        className={`p-6 rounded-xl border transition-all flex justify-between items-center group bg-mystic-800 border-mystic-700 hover:border-gold-500/30 shadow-lg`}
                      >
                        <div 
                            className="flex items-center gap-5 flex-1 cursor-pointer"
                            onClick={() => onStartReading(client)}
                        >
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg bg-mystic-700 text-gold-500 group-hover:bg-gold-500 group-hover:text-mystic-900`}>
                            <User size={28} />
                          </div>
                          <div>
                            <h4 className={`text-lg font-serif font-bold transition-colors flex items-center gap-3 text-gray-200 group-hover:text-gold-200`}>
                                {client.name}
                                {activeClient?.id === client.id && <span className="bg-gold-500 text-mystic-900 text-[10px] px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={10}/> Ativo</span>}
                            </h4>
                            {client.email && <p className="text-sm text-gray-500 mb-1">{client.email}</p>}
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                <span className="flex items-center gap-1"><FileText size={12}/> {client.readingsHistory.length} leituras</span>
                                {client.readingsHistory.length > 0 && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span className="text-gold-500/70">Última: {getShortDate(client.readingsHistory[0].date)}</span>
                                    </>
                                )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onStartReading(client); }}
                                className="bg-gold-600/10 hover:bg-gold-600 hover:text-mystic-900 text-gold-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors border border-gold-500/20 mr-4"
                            >
                                <PlusCircle size={16} /> Nova Leitura
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); startEdit(client); }}
                                className="p-3 text-blue-300 hover:text-white hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                                title="Editar Dados"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={(e) => openHistory(client, e)}
                                className="p-3 text-gold-300 hover:text-white hover:bg-gold-900/30 rounded-lg transition-colors border border-transparent hover:border-gold-500/30"
                                title="Ver Histórico Completo"
                            >
                                <Eye size={18} />
                            </button>
                             <button 
                                onClick={(e) => handleDeleteClient(client, e)}
                                className="p-3 text-red-400 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                title="Excluir Querente"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 flex-1 overflow-y-auto bg-mystic-900/50 flex flex-col items-center pt-10">
              <div className="w-full max-w-lg bg-mystic-800 p-8 rounded-xl border border-gold-500/20 shadow-2xl">
                  <h4 className="text-2xl font-serif text-gold-100 mb-8 text-center flex items-center justify-center gap-3">
                      <UserPlus size={24} className="text-gold-500"/>
                      {view === 'add' ? 'Cadastrar Novo Querente' : 'Editar Querente'}
                  </h4>
                  <form onSubmit={handleSaveClient} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Nome Completo</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-mystic-900 border border-mystic-600 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
                        placeholder="Ex: Maria Silva"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Email (Opcional)</label>
                      <input 
                        type="email" 
                        className="w-full bg-mystic-900 border border-mystic-600 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
                        placeholder="exemplo@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-300">Notas / Observações</label>
                        <span className="text-[10px] text-gray-500">Modelos de Perguntas:</span>
                      </div>
                      
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                        {DEFAULT_QUESTION_TEMPLATES.map(template => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => applyTemplate(template.questions)}
                            className="text-xs bg-mystic-700 hover:bg-gold-600 hover:text-mystic-900 text-gold-300 px-2 py-1 rounded border border-gold-500/20 whitespace-nowrap transition-colors flex items-center gap-1"
                          >
                            <BookTemplate size={10} /> {template.label}
                          </button>
                        ))}
                      </div>

                      <textarea 
                        className="w-full bg-mystic-900 border border-mystic-600 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50 h-40 resize-none text-sm leading-relaxed"
                        placeholder="Detalhes importantes sobre o querente..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setView('list')}
                        className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="px-8 py-3 bg-gold-600 hover:bg-gold-500 text-mystic-900 font-bold rounded-lg flex items-center gap-2 shadow-lg hover:shadow-gold-500/20 transition-all"
                      >
                        <Save size={18} />
                        {view === 'add' ? 'Cadastrar' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};
