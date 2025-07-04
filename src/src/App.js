import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import DashboardSidebar from './components/DashboardSidebar';
import PublicDashboard from './components/PublicDashboard';
import { setStorage } from './utils/storage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('fedexShippingCapture');

  // Simular un "login" automático para que siempre haya un usuario
  useEffect(() => {
    setStorage('currentUser', { username: 'Invitado', role: 'public' });
  }, []);

  const handleLogout = () => {
    alert('¡Gracias por usar el sistema! No hay login para cerrar sesión.');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <DashboardHeader onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar currentPage={currentPage} onNavigate={handleNavigate} />
        <PublicDashboard currentPage={currentPage} />
      </div>
    </div>
  );
};

export default App;

// DONE