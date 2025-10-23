// src/App.js
const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

import React, { useState, useEffect, useRef } from 'react';
import AuthLogin from './components/AuthLogin';
import DashboardHeader from './components/DashboardHeader';
import DashboardSidebar from './components/DashboardSidebar';
import PublicDashboard from './components/PublicDashboard';
import { getStorage, setStorage, syncStorageFromBackend, initializeSync } from './utils/storage';

useEffect(() => {
  initializeSync();
}, []);

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false); // 🆕 indicador visual de sincronización

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("Error al leer usuario almacenado:", e);
      }
    }
  }, []);

  const [currentPage, setCurrentPage] = useState('fedexShippingCapture');
  const activityTimer = useRef(null);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  const manualLogoutFlag = useRef(false);

  const performLogout = (isManual = false) => {
    setStorage('currentUser', null);
    setCurrentUser(null);
    clearTimeout(activityTimer.current);
    if (!isManual) {
      alert('Sesión cerrada por inactividad o cierre de navegador.');
    }
    manualLogoutFlag.current = false;
  };

  const handleLogoutButtonClick = () => {
    manualLogoutFlag.current = true;
    performLogout(true);
  };

  // 🔄 Sincronización inicial al cargar App
  useEffect(() => {
    const storedUser = getStorage('currentUser');
    if (storedUser) {
      setCurrentUser(storedUser);
      resetActivityTimer();

      // 🔄 Sincronizar datos globales del backend
      (async () => {
        try {
          setIsSyncing(true);
          await syncStorageFromBackend();
          console.log("✅ Datos sincronizados al cargar la app.");
        } catch (e) {
          console.warn("No se pudo sincronizar al cargar la app:", e);
        } finally {
          setIsSyncing(false);
        }
      })();
    }

    const handleBeforeUnload = () => {
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

  // 🔐 Login exitoso
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setCurrentPage('fedexShippingCapture');
    resetActivityTimer();

    // 🔄 Sincronización global tras login
    try {
      setIsSyncing(true);
      await syncStorageFromBackend();
      console.log("✅ Datos sincronizados tras inicio de sesión.");
    } catch (e) {
      console.warn("No se pudo sincronizar al iniciar sesión:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    resetActivityTimer();
  };

  const handleNavigateToUserManagement = () => {
    setCurrentPage('userManagement');
    resetActivityTimer();
  };

  // 🚪 Si no hay sesión, mostrar login
  if (!currentUser) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 💡 Si está sincronizando, mostrar overlay de carga
  if (isSyncing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Sincronizando datos...</p>
        </div>
      </div>
    );
  }

  // 🧭 Vista principal del dashboard
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <DashboardHeader
        currentUser={currentUser}
        onLogout={handleLogoutButtonClick}
        onNavigateToUserManagement={handleNavigateToUserManagement}
      />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />
        <PublicDashboard currentPage={currentPage} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default App;