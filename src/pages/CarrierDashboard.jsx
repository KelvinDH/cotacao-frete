import React, { useState, useEffect } from 'react';
import { FreightMap, User, Carrier } from "@/api/entities";
import { Truck, FileText, MapPin, Weight, DollarSign, Percent, Shield } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CarrierDashboardPage() {
  const navigate = useNavigate();
  const [freightMaps, setFreightMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [carrierName, setCarrierName] = useState('');
  const [carrierType, setCarrierType] = useState('paletizados');
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingProposal, setSavingProposal] = useState(null);
  const [carrierSetupMode, setCarrierSetupMode] = useState(false);

  useEffect(() => {
    loadUserAndFreights();
  }, []);

  const loadUserAndFreights = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Check if user has carrier profile
      if (user.carrierName) {
        setCarrierName(user.carrierName);
        setCarrierType(user.carrierType || 'paletizados');
        await loadFreightMaps(user.carrierName, user.carrierType);
      } else if (user.role === 'admin') {
        setIsAdmin(true);
      } else {
        // New user, no carrier profile yet
        setCarrierSetupMode(true);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
    setLoading(false);
  };

  const loadFreightMaps = async (carrierName, type) => {
    try {
      // Get all negotiating freight maps that match the carrier's type
      const maps = await FreightMap.filter({ 
        status: 'negotiating',
        loadingMode: type 
      });
      setFreightMaps(maps);
    } catch (err) {
      console.error("Error loading freight maps:", err);
    }
  };

  const handleSetupCarrier = async (e) => {
    e.preventDefault();
    if (!carrierName) return;

    try {
      // Create carrier in Carrier entity
      await Carrier.create({
        name: carrierName,
        type: carrierType,
        active: true
      });

      // Update user profile
      await User.updateMyUserData({
        carrierName: carrierName,
        carrierType: carrierType,
        userType: 'carrier'
      });

      // Reload
      setCarrierSetupMode(false);
      await loadFreightMaps(carrierName, carrierType);
    } catch (err) {
      console.error("Error setting up carrier:", err);
      alert("Erro ao configurar transportadora. Tente novamente.");
    }
  };

  const handleProposalChange = async (freightId, value) => {
    setSavingProposal(freightId);
    
    try {
      const freight = freightMaps.find(map => map.id === freightId);
      if (!freight || !carrierName) return;

      const updatedProposals = {
        ...freight.carrierProposals,
        [carrierName]: value
      };

      await FreightMap.update(freightId, {
        carrierProposals: updatedProposals
      });

      // Update local state
      setFreightMaps(prev => prev.map(map => 
        map.id === freightId 
          ? { ...map, carrierProposals: updatedProposals }
          : map
      ));
    } catch (err) {
      console.error("Error updating proposal:", err);
    }
    
    setSavingProposal(null);
  };

  const calculatePercentage = (value, mapValue) => {
    if (mapValue === 0 || !value) return 0;
    return ((value - mapValue) / mapValue) * 100;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Área Administrativa</h2>
          <p className="text-gray-600 mb-6">
            Como administrador, você tem acesso ao sistema completo.
          </p>
          <button
            onClick={() => navigate(createPageUrl('Quote'))}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Ir para o Sistema
          </button>
        </div>
      </div>
    );
  }

  if (carrierSetupMode) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Configurar Transportadora</h2>
          <p className="text-gray-600 mt-2">
            Para acessar o sistema, preencha as informações da sua transportadora
          </p>
        </div>

        <form onSubmit={handleSetupCarrier} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nome da Transportadora
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Tipo de Carregamento
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-colors duration-200 flex flex-col items-center gap-2 ${
                  carrierType === 'paletizados'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                onClick={() => setCarrierType('paletizados')}
              >
                <Truck className="w-6 h-6" />
                <span className="font-medium">Paletizados</span>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-colors duration-200 flex flex-col items-center gap-2 ${
                  carrierType === 'bag'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                onClick={() => setCarrierType('bag')}
              >
                <Truck className="w-6 h-6" />
                <span className="font-medium">BAG</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            <Truck className="w-5 h-5 mr-2" />
            Configurar Transportadora
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Truck className="w-6 h-6 mr-2" />
            Propostas de Fretes
          </h2>
          <p className="text-gray-600">Transportadora: {carrierName}</p>
        </div>
      </div>

      {freightMaps.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum frete disponível para cotação no momento.
        </div>
      ) : (
        <div className="space-y-6">
          {freightMaps.map((map) => {
            const currentProposal = map.carrierProposals[carrierName] || 0;
            const percentage = calculatePercentage(currentProposal, map.mapValue);
            const percentageClass = percentage > 0 ? 'text-red-600' : 'text-green-600';
            
            return (
              <div key={map.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-600">Mapa: {map.mapNumber}</h3>
                    <p className="text-gray-600 text-sm">
                      {map.loadingMode === 'paletizados' ? 'Paletizados' : 'BAG'} • {map.truckType}
                    </p>
                  </div>
                  {map.mapImage && (
                    <a 
                      href={map.mapImage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Ver Mapa
                    </a>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      Origem
                    </label>
                    <p className="font-medium">{map.origin}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      Destino
                    </label>
                    <p className="font-medium">{map.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="flex items-center text-gray-600 text-sm">
                      <Weight className="w-4 h-4 mr-1" />
                      Peso (kg)
                    </label>
                    <p className="font-medium">{map.weight}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-gray-600 text-sm">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Valor de Referência
                    </label>
                    <p className="font-medium">R$ {map.mapValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {map.routeInfo && (
                  <div className="mb-6 bg-gray-50 p-3 rounded-lg">
                    <label className="text-gray-600 text-sm font-medium">Roteiro:</label>
                    <p className="text-gray-700 whitespace-pre-line">{map.routeInfo}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <label className="text-gray-700 font-medium mb-1 block">Sua Proposta (R$)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40"
                          value={currentProposal || ''}
                          onChange={(e) => handleProposalChange(map.id, parseFloat(e.target.value) || 0)}
                          disabled={savingProposal === map.id}
                        />
                        {savingProposal === map.id && (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                        )}
                      </div>
                    </div>
                    
                    {currentProposal > 0 && (
                      <div className={`${percentageClass} flex items-center`}>
                        <Percent className="w-5 h-5 mr-1" />
                        <span className="font-medium">
                          {percentage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% em relação ao valor de referência
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}