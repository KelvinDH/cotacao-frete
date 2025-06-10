

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Truck, FileText, HandshakeIcon, CheckCircle, BarChart, LogOut, UserCircle } from "lucide-react";
import { User } from "@/api/entities";
import { BarChart as BarChartIconLucide } from "lucide-react"; // Renamed to avoid conflict

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // If user is a carrier and not on Negotiation page, redirect to it
      if (user.userType === 'carrier' && currentPageName !== 'Negotiation' && currentPageName !== 'CarrierClosedFreights') {
        navigate(createPageUrl('Negotiation'));
      }
    } catch (err) {
      console.log("User not authenticated");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = "/";
  };

  // Admin navigation (for admin users)
  const adminNavigation = [
    { name: 'Cotação', path: 'Quote', icon: FileText },
    { name: 'Negociação', path: 'Negotiation', icon: HandshakeIcon },
    { name: 'Contratados', path: 'Contracted', icon: CheckCircle },
    { name: 'Relatórios', path: 'Reports', icon: BarChart },
    { name: 'Gráficos', path: 'ChartsPage', icon: BarChartIconLucide }, // Added new page
  ];

  // Carrier navigation (only Negotiation)
  const carrierNavigation = [
    { name: 'Negociação', path: 'Negotiation', icon: HandshakeIcon },
    { name: 'Fretes Fechados', path: 'CarrierClosedFreights', icon: CheckCircle },
  ];

  // Choose navigation based on user type
  const getNavigation = () => {
    if (!currentUser) return [];
    if (currentUser.userType === 'carrier') return carrierNavigation;
    if (currentUser.email === 'vini.becati28@gmail.com') return adminNavigation;
    return adminNavigation;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <style jsx>{`
        :root {
          --primary-color: #008B45;
          --secondary-color: #8BC34A;
          --accent-color: #CDDC39;
          --background-start: #F1F8E9;
          --background-end: #E8F5E9;
          --text-dark: #2c3e50;
          --text-light: #f8fafc;
        }
      `}</style>
      
      {/* Header with UnionAgro background */}
      <div 
        className="bg-cover bg-center h-48 md:h-64 relative" 
        style={{ 
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/83f4dd_cabealho.jpeg)',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="flex items-center">
            <div className="bg-white p-1 rounded-full mr-4 h-16 w-16 flex items-center justify-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/964f10_LogoUnion.jpeg" 
                alt="UnionAgro Logo" 
                className="h-14 w-14 rounded-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white">
              UnionAgro (Cotação de Frete)
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-6">
        {currentUser && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-green-100 p-2 rounded-full">
                <Truck className="w-6 h-6 text-green-700" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Bem-vindo(a)</p>
                <p className="font-medium text-gray-800">
                  {currentUser.carrierName 
                    ? `${currentUser.carrierName} (Transportadora)`
                    : currentUser.userType === 'admin' 
                      ? 'Administrador'
                      : currentUser.full_name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}

        {currentUser && getNavigation().length > 0 && (
          <div className="flex justify-start mb-6">
            <div className="bg-white rounded-lg shadow-md p-1 border-t-4 border-green-600">
              {getNavigation().map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors duration-200 ${
                      currentPageName === item.path
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-green-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-green-600 ${currentPageName === 'ChartsPage' ? 'p-0' : ''}`}>
          {children}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} UnionAgro - Cotação de Fretes</p>
        </div>
      </div>
    </div>
  );
}

