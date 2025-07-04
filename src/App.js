import React, { useState, useEffect, useRef } from 'react';
import AuthLogin from './components/AuthLogin';
import DashboardHeader from './components/DashboardHeader';
import DashboardSidebar from './components/DashboardSidebar';
import PublicDashboard from './components/PublicDashboard';
import { getStorage, setStorage } from './utils/storage';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('fedexShippingCapture');
  const activityTimer = useRef(null);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos
  const manualLogoutFlag = useRef(false); // Flag to suppress alert on manual logout

  const performLogout = (isManual = false) => {
    setStorage('currentUser', null);
    setCurrentUser(null);
    clearTimeout(activityTimer.current);
    if (!isManual) {
      alert('Sesión cerrada por inactividad o cierre de navegador.');
    }
    manualLogoutFlag.current = false; // Reset flag after logout
  };

  const handleLogoutButtonClick = () => {
    manualLogoutFlag.current = true; // Set flag for manual logout
    performLogout(true); // Perform manual logout
  };

  useEffect(() => {
    const storedUser = getStorage('currentUser');
    if (storedUser) {
      setCurrentUser(storedUser);
      resetActivityTimer();
    }

    const handleBeforeUnload = () => {
      // Only clear storage if it's not a manual logout already handled
      if (!manualLogoutFlag.current) {
        setStorage('currentUser', null);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(activityTimer.current);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      resetActivityTimer();
      const events = ['mousemove', 'keypress', 'click'];
      events.forEach(event => window.addEventListener(event, resetActivityTimer));
    } else {
      clearTimeout(activityTimer.current);
      const events = ['mousemove', 'keypress', 'click'];
      events.forEach(event => window.removeEventListener(event, resetActivityTimer));
    }
    return () => {
      clearTimeout(activityTimer.current);
    };
  }, [currentUser]);

  const resetActivityTimer = () => {
    clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(() => performLogout(false), INACTIVITY_TIMEOUT);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('fedexShippingCapture'); // Default page after login
    resetActivityTimer();
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    resetActivityTimer(); // Reset timer on navigation
  };

  // Si currentUser es null, mostrar solo el componente de login
  if (!currentUser) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Si currentUser existe, mostrar el dashboard completo
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <DashboardHeader currentUser={currentUser} onLogout={handleLogoutButtonClick} />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar currentPage={currentPage} onNavigate={handleNavigate} currentUser={currentUser} />
        <PublicDashboard currentPage={currentPage} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default App;

// DONE