
import React, { useState, useEffect } from 'react';
import { HandshakeIcon, Percent, CheckCircle, DollarSign, Weight, MapPin, FileText, Truck, Route, CalendarDays, Search, ChevronDown, ChevronUp, Image as ImageIcon, Info, Edit, X, Save } from "lucide-react"; // Added Edit, X, and Save icons
import { FreightMap, User } from "@/api/entities";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function NegotiationPage() {
  const [freightMaps, setFreightMaps] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [finalValue, setFinalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [carrierName, setCarrierName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDetails, setExpandedDetails] = useState({}); // To manage expanded Roteiro/Mapa
  const [editingFreight, setEditingFreight] = useState(null); // ID of freight being edited
  const [editedValues, setEditedValues] = useState({}); // Values being edited

  useEffect(() => {
    checkUserAndLoadFreights();
  }, []);

  const checkUserAndLoadFreights = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const isAdminUser = user.email === 'vini.becati28@gmail.com';
      setIsAdmin(isAdminUser);
      
      if (user.email === 'anasdinato@gmail.com') {
        setCarrierName('Ana Transportes');
        await loadAllFreights();
      } else if (!isAdminUser && user.carrierName) {
        setCarrierName(user.carrierName);
        await loadCarrierFreights(user.carrierName, user.carrierType);
      } else {
        await loadFreightMaps(); // Should only be admin now
      }
    } catch (err) {
      console.error("Error checking user:", err);
      await loadFreightMaps(); // Fallback for non-logged in or error
    }
    setLoading(false);
  };

  const loadFreightMaps = async () => {
    const maps = await FreightMap.filter({ status: 'negotiating' });
    setFreightMaps(maps);
  };

  const loadAllFreights = async () => {
    const maps = await FreightMap.filter({ status: 'negotiating' });
    setFreightMaps(maps);
  };

  const loadCarrierFreights = async (name, type) => {
    const maps = await FreightMap.filter({ 
      status: 'negotiating',
      loadingMode: type
    });
    setFreightMaps(maps);
  };

  const handleCarrierProposalChange = async (freightId, value) => {
    if (!carrierName) return;

    const freight = freightMaps.find(map => map.id === freightId);
    if (!freight) return;

    const updatedProposals = {
      ...freight.carrierProposals,
      [carrierName]: value
    };

    await FreightMap.update(freightId, {
      carrierProposals: updatedProposals
    });

    // Reload appropriate freight list
    const user = currentUser; // Use state
    if (user?.email === 'anasdinato@gmail.com') {
      await loadAllFreights();
    } else if (user?.carrierName) {
      await loadCarrierFreights(carrierName, user.carrierType);
    } else if (isAdmin) { // If admin made the change (not typical, but for consistency)
      await loadFreightMaps();
    }
  };

  const startEditing = (freight) => {
    setEditingFreight(freight.id);
    setEditedValues({
      loadingDate: freight.loadingDate,
      mapValue: freight.mapValue,
      weight: freight.weight
    });
  };

  const cancelEditing = () => {
    setEditingFreight(null);
    setEditedValues({});
  };

  const saveEdits = async (freightId) => {
    try {
      await FreightMap.update(freightId, editedValues);
      
      // Update local state with the edited values
      setFreightMaps(prevMaps => 
        prevMaps.map(map => 
          map.id === freightId ? { ...map, ...editedValues } : map
        )
      );
      
      setEditingFreight(null);
      setEditedValues({});
    } catch (error) {
      console.error("Error saving edits:", error);
      alert("Erro ao salvar alterações. Tente novamente.");
    }
  };

  const calculatePercentage = (value, mapValue) => {
    if (mapValue === 0) return 0;
    return ((value - mapValue) / mapValue) * 100;
  };

  const finalizeNegotiation = async (freightId) => {
    if (!selectedProposal || finalValue <= 0 || !isAdmin) return;

    await FreightMap.update(freightId, {
      selectedCarrier: selectedProposal.carrier,
      finalValue: finalValue,
      status: 'contracted',
      contractedAt: new Date().toISOString()
    });

    await checkUserAndLoadFreights(); // Reload all data
    setSelectedProposal(null);
    setFinalValue(0);
  };

  const getFilteredMaps = () => {
    if (!searchTerm) return freightMaps;
    return freightMaps.filter(map => 
      map.mapNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  const toggleDetails = (mapId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [mapId]: !prev[mapId]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando fretes...</p>
        </div>
      </div>
    );
  }

  // Admin view
  if (isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <HandshakeIcon className="w-6 h-6 mr-2 text-green-600" />
            Negociação de Fretes
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar por Nº Mapa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full md:w-64"
            />
          </div>
        </div>

        {getFilteredMaps().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {freightMaps.length === 0 ? (
              <>
                Nenhum mapa disponível para negociação.
                <p className="mt-2 text-sm">
                  Adicione mapas através da aba de Cotação.
                </p>
              </>
            ) : (
              <>
                Nenhum mapa encontrado com o número "{searchTerm}".
                <p className="mt-2 text-sm">
                  Tente outro número de mapa.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {getFilteredMaps().map((map) => (
              <div key={map.id} className="border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow bg-white">
                {/* Basic Info Section with Edit Capability */}
                <div className="flex flex-wrap items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="font-semibold text-gray-800">
                      Mapa Nº: {map.mapNumber}
                    </h3>
                  </div>
                  
                  {editingFreight === map.id ? (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelEditing}
                        className="text-gray-600"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => saveEdits(map.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEditing(map)}
                      className="text-blue-600"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-500">Data Carreg.</label>
                    {editingFreight === map.id ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {editedValues.loadingDate ? 
                              format(new Date(editedValues.loadingDate), "dd/MM/yy", { locale: ptBR }) : 
                              'Selecionar data'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={editedValues.loadingDate ? new Date(editedValues.loadingDate) : undefined}
                            onSelect={(date) => setEditedValues({
                              ...editedValues, 
                              loadingDate: date ? date.toISOString().split('T')[0] : ''
                            })}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="font-semibold text-gray-800">
                        {map.loadingDate ? format(new Date(map.loadingDate), "dd/MM/yy", { locale: ptBR }) : 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Origem</label>
                    <p className="font-semibold text-gray-800 truncate" title={map.origin}>{map.origin}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Destino</label>
                    <p className="font-semibold text-gray-800 truncate" title={map.destination}>{map.destination}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Peso (kg)</label>
                    {editingFreight === map.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={editedValues.weight || ''}
                        onChange={e => setEditedValues({...editedValues, weight: parseFloat(e.target.value) || 0})}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{map.weight}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Valor Mapa (R$)</label>
                    {editingFreight === map.id ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editedValues.mapValue || ''}
                        onChange={e => setEditedValues({...editedValues, mapValue: parseFloat(e.target.value) || 0})}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-gray-800">{map.mapValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Caminhão</label>
                    <p className="font-semibold text-gray-800 truncate" title={map.truckType}>{map.truckType}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">KM Total</label>
                    <p className="font-semibold text-gray-800">{map.totalKm}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Modalidade</label>
                    <p className="font-semibold text-gray-800">
                      {map.loadingMode === 'paletizados' ? 'Paletizados' : 'BAG'}
                    </p>
                  </div>
                </div>

                {/* Expandable Roteiro and Mapa */}
                {(map.routeInfo || map.mapImage) && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDetails(map.id)}
                      className="w-full flex items-center justify-between text-gray-600 hover:text-gray-800"
                    >
                      <span className="flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Detalhes Adicionais (Roteiro/Mapa)
                      </span>
                      {expandedDetails[map.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    {expandedDetails[map.id] && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md bg-gray-50">
                        {map.routeInfo && (
                          <div>
                            <label className="text-sm text-gray-600 mb-1 block font-medium">Roteiro</label>
                            <p className="bg-white p-3 rounded-md text-gray-700 whitespace-pre-line text-sm border max-h-32 overflow-y-auto">
                              {map.routeInfo}
                            </p>
                          </div>
                        )}
                        {map.mapImage && (
                          <div>
                            <label className="text-sm text-gray-600 mb-1 block font-medium">Mapa</label>
                            <a href={map.mapImage} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={map.mapImage}
                                alt="Mapa do frete"
                                className="max-h-48 w-full object-contain rounded-md border hover:opacity-80 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Carrier Proposals */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Propostas das Transportadoras:</h4>
                  {Object.keys(map.carrierProposals).length === 0 || Object.values(map.carrierProposals).every(val => val <=0) ? (
                     <p className="text-sm text-gray-500">Nenhuma proposta recebida ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(map.carrierProposals).map(([carrier, proposalValue]) => {
                        if (proposalValue <= 0) return null; // Don't show zero/empty proposals
                        
                        return (
                          <div key={carrier} className="relative">
                            <div 
                              className={`border rounded-lg p-3 cursor-pointer transition-all duration-150 ${
                                selectedProposal?.freightId === map.id && selectedProposal?.carrier === carrier
                                  ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                                  : 'hover:border-gray-400 hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedProposal({ freightId: map.id, carrier })}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">{carrier}</span>
                              </div>
                              <div className="bg-white px-2 py-1 rounded-md border border-gray-200">
                                <span className="font-medium text-sm text-gray-800">
                                  R$ {proposalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Finalize Negotiation Section */}
                {selectedProposal?.freightId === map.id && (
                  <div className="mt-6 p-4 border-t border-dashed bg-green-50 rounded-b-lg">
                    <h3 className="text-md font-semibold mb-3 text-green-700">Finalizar Negociação para Mapa {map.mapNumber}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Transportadora Selecionada
                        </label>
                        <p className="text-md font-semibold text-blue-600">
                          {selectedProposal.carrier}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Proposta Original: R$ {map.carrierProposals[selectedProposal.carrier].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Valor Final do Frete (R$)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Valor final"
                            className="flex-1 px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={finalValue || ''}
                            onChange={(e) => setFinalValue(parseFloat(e.target.value) || 0)}
                          />
                          <Button
                            size="sm"
                            onClick={() => finalizeNegotiation(map.id)}
                            disabled={finalValue <= 0}
                            className={`px-3 py-2 transition-colors duration-200 ${
                              finalValue <= 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Carrier view
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <HandshakeIcon className="w-6 h-6 mr-2 text-green-600" />
          Fretes Disponíveis
          {carrierName && <span className="ml-2 text-sm font-normal text-gray-500">({carrierName})</span>}
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            type="text"
            placeholder="Pesquisar por Nº Mapa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full md:w-64"
          />
        </div>
      </div>

      {getFilteredMaps().length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {freightMaps.length === 0 ? (
            "Nenhum frete disponível para cotação no momento."
          ) : (
            <>
              Nenhum mapa encontrado com o número "{searchTerm}".
              <p className="mt-2 text-sm">
                Tente outro número de mapa.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {getFilteredMaps().map((map) => {
            const currentProposal = carrierName ? (map.carrierProposals[carrierName] || 0) : 0;
            
            return (
              <div key={map.id} className="border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 mb-4">
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Nº Mapa
                    </label>
                    <p className="font-medium text-gray-800">{map.mapNumber}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Data Carreg.
                    </label>
                    <p className="font-medium text-gray-800">
                      {map.loadingDate ? format(new Date(map.loadingDate), "dd/MM/yy", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      Origem
                    </label>
                    <p className="font-medium text-gray-800">{map.origin}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      Destino
                    </label>
                    <p className="font-medium text-gray-800">{map.destination}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <Weight className="w-3 h-3 mr-1" />
                      Peso (kg)
                    </label>
                    <p className="font-medium text-gray-800">{map.weight}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Valor Mapa (R$)
                    </label>
                    <p className="font-medium text-gray-800">{map.mapValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <Truck className="w-3 h-3 mr-1" />
                      Caminhão
                    </label>
                    <p className="font-medium text-gray-800">{map.truckType}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-500 text-xs">
                      <Route className="w-3 h-3 mr-1" />
                      KM Total
                    </label>
                    <p className="font-medium text-gray-800">{map.totalKm}</p>
                  </div>
                </div>

                {map.mapImage && (
                  <div className="mb-4">
                    <label className="flex items-center text-gray-500 text-xs mb-1 font-medium">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Mapa
                    </label>
                    <a href={map.mapImage} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={map.mapImage}
                      alt="Mapa do frete"
                      className="max-h-48 w-full object-contain rounded-md border hover:opacity-80 transition-opacity"
                    />
                    </a>
                  </div>
                )}

                {map.routeInfo && (
                  <div className="mb-6">
                    <label className="flex items-center text-gray-500 text-xs mb-1 font-medium">
                      <Info className="w-3 h-3 mr-1" />
                      Roteiro
                    </label>
                    <p className="bg-gray-50 p-3 rounded-md text-gray-700 whitespace-pre-line text-sm border">
                      {map.routeInfo}
                    </p>
                  </div>
                )}

                {carrierName && (
                  <div className="border-t pt-4">
                    <label className="text-gray-700 font-medium mb-2 block text-sm">Sua Proposta (R$)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="px-3 py-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 text-sm"
                        value={currentProposal || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          // Only update local state, don't save yet
                          const updatedMaps = freightMaps.map(m => {
                            if (m.id === map.id) {
                              return {
                                ...m,
                                carrierProposals: {
                                  ...m.carrierProposals,
                                  [carrierName]: value
                                }
                              };
                            }
                            return m;
                          });
                          setFreightMaps(updatedMaps);
                        }}
                      />
                      <Button 
                        onClick={() => handleCarrierProposalChange(map.id, currentProposal)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={currentProposal <= 0}
                      >
                        Salvar Proposta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
