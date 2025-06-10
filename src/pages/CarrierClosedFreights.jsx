
import React, { useState, useEffect } from 'react';
import { FreightMap, User } from "@/api/entities";
import { FileText, MapPin, Weight, DollarSign, Truck, Route, CheckCircle, Package, CalendarDays, Info, MapIcon, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CarrierClosedFreightsPage() {
  const [freightMaps, setFreightMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carrierName, setCarrierName] = useState('');
  const [expandedMaps, setExpandedMaps] = useState({});

  useEffect(() => {
    loadCarrierAndFreights();
  }, []);

  const loadCarrierAndFreights = async () => {
    try {
      const user = await User.me();
      const name = user.email === 'anasdinato@gmail.com' ? 'Ana Transportes' : user.carrierName;
      setCarrierName(name);

      // Load only freights where this carrier was selected
      const maps = await FreightMap.filter({ 
        status: 'contracted',
        selectedCarrier: name
      });
      setFreightMaps(maps);
    } catch (err) {
      console.error("Error loading carrier freights:", err);
    }
    setLoading(false);
  };

  const toggleMapDetails = (mapId) => {
    setExpandedMaps(prev => ({
      ...prev,
      [mapId]: !prev[mapId]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando fretes fechados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
          Fretes Fechados
          {carrierName && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({carrierName})
            </span>
          )}
        </h2>
      </div>

      {freightMaps.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum frete fechado encontrado.
        </div>
      ) : (
        <div className="space-y-6">
          {freightMaps.map((map) => (
            <div key={map.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              {/* Header Section */}
              <div className="bg-green-50 p-4 border-b border-green-200 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full">
                    <FileText className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">Mapa: {map.mapNumber}</h3>
                    <p className="text-xs text-gray-500">
                      Fechado em: {format(new Date(map.contractedAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <Badge className={map.loadingMode === 'paletizados' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                  {map.loadingMode === 'paletizados' ? 'Paletizados' : 'BAG'}
                </Badge>
              </div>

              {/* Main Info Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* First Column */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <CalendarDays className="w-3 h-3 mr-1" /> Data Carregamento
                      </p>
                      <p className="font-medium">
                        {map.loadingDate ? format(new Date(map.loadingDate), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> Origem
                      </p>
                      <p className="font-medium">{map.origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> Destino
                      </p>
                      <p className="font-medium">{map.destination}</p>
                    </div>
                  </div>
                  
                  {/* Second Column */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Weight className="w-3 h-3 mr-1" /> Peso
                      </p>
                      <p className="font-medium">{map.weight.toLocaleString('pt-BR')} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Route className="w-3 h-3 mr-1" /> KM Total
                      </p>
                      <p className="font-medium">{map.totalKm.toLocaleString('pt-BR')} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Truck className="w-3 h-3 mr-1" /> Caminhão
                      </p>
                      <p className="font-medium">{map.truckType}</p>
                    </div>
                  </div>
                  
                  {/* Third Column */}
                  <div className="space-y-3 col-span-2 md:col-span-1">
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-gray-500 flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" /> Valor Final
                      </p>
                      <p className="font-bold text-green-700 text-lg">
                        R$ {map.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoice Section - This will show the button if a URL exists */}
                {map.invoiceUrls && map.invoiceUrls.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <p className="text-sm font-medium text-gray-600">Notas Fiscais Anexadas:</p>
                        {map.invoiceUrls.map((url, index) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <FileCheck className="w-5 h-5 mr-2" />
                                Visualizar Nota Fiscal {index + 1}
                            </a>
                        ))}
                    </div>
                )}

                {/* Expandable Details Button */}
                <button 
                  className="w-full mt-3 flex items-center justify-center py-2 text-gray-600 hover:text-gray-800 border-t border-gray-200"
                  onClick={() => toggleMapDetails(map.id)}
                >
                  <span className="text-sm mr-1">{expandedMaps[map.id] ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                  {expandedMaps[map.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {/* Expanded Details Section */}
                {expandedMaps[map.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-4">
                    {map.routeInfo && (
                      <div>
                        <p className="text-xs text-gray-500 flex items-center mb-1">
                          <Info className="w-3 h-3 mr-1" /> Roteiro
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md border text-sm">
                          {map.routeInfo}
                        </div>
                      </div>
                    )}
                    
                    {map.mapImage && (
                      <div>
                        <p className="text-xs text-gray-500 flex items-center mb-1">
                          <MapIcon className="w-3 h-3 mr-1" /> Mapa
                        </p>
                        <a href={map.mapImage} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={map.mapImage}
                            alt="Mapa do frete"
                            className="max-h-64 object-contain rounded-md border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
