import React, { useState, useEffect, useRef } from "react";
import AuthLogin from "./components/AuthLogin";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import PublicDashboard from "./components/PublicDashboard";
import UserManagement from "./components/UserManagement";
import {
  initStorageSync,
  syncFromBackend,
  setStorage,
  clearSyncState,
} from "./utils/storage";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState("fedexShippingCapture");
  const activityTimer = useRef(null);
  const manualLogoutFlag = useRef(false);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

  // No iniciar sesión automáticamente
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("currentUser");
    if (token && user) {
      setCurrentUser(null); // No restaurar sesión automáticamente
    }
  }, []);

  // Sincronización inicial después de login
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    (async () => {
      try {
        setIsSyncing(true);
        await initStorageSync(token, [
          "finished_goods",
          "material_bom",
          "fedex_orders",
          "usps_orders",
          "fedex_shipping_records",
          "observations",
          "invoice_history",
          "invoice_search",
          "daily_report",
          "cuts_report",
          "retained_orders",
          "users",
          "part_numbers"
        ]);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Retraso visual
        console.log("✅ Sincronización inicial completada");
      } catch (error) {
        console.warn("⚠️ Error en sincronización inicial:", error);
      } finally {
        setIsSyncing(false);
      }
    })();

    // Sincronización automática cada minuto
    const syncInterval = setInterval(async () => {
      try {
        console.log("🔄 Verificando cambios en el backend...");
        await syncFromBackend();
      } catch (err) {
        console.warn("⚠️ Error al sincronizar automáticamente:", err);
      }
    }, 60000); // cada 60 segundos

    return () => clearInterval(syncInterval);
  }, [currentUser]);

  const resetActivityTimer = () => {
    clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(
      () => performLogout(false),
      INACTIVITY_TIMEOUT
    );
  };

  const performLogout = (isManual = false) => {
    localStorage.removeItem("authToken");
    clearSyncState();
    setCurrentUser(null);
    clearTimeout(activityTimer.current);

    if (!isManual) {
      alert("Sesión cerrada por inactividad o cierre de navegador.");
    }

    manualLogoutFlag.current = false;
  };

  const handleLogoutButtonClick = () => {
    manualLogoutFlag.current = true;
    performLogout(true);
  };

  useEffect(() => {
    if (currentUser) {
      resetActivityTimer();
      const events = ["mousemove", "keypress", "click"];
      events.forEach((e) => window.addEventListener(e, resetActivityTimer));
      return () =>
        events.forEach((e) => window.removeEventListener(e, resetActivityTimer));
    } else {
      clearTimeout(activityTimer.current);
    }
  }, [currentUser]);

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setCurrentPage("fedexShippingCapture");
    resetActivityTimer();

    try {
      setIsSyncing(true);
      await initStorageSync(localStorage.getItem("authToken"), [
        "finished_goods",
        "material_bom",
        "fedex_orders",
        "usps_orders",
        "fedex_shipping_records",
        "observations",
        "invoice_history",
        "invoice_search",
        "daily_report",
        "cuts_report",
        "retained_orders",
        "users",
        "part_numbers"
      ]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Retraso visual
      console.log("✅ Datos sincronizados tras inicio de sesión.");
    } catch (e) {
      console.warn("No se pudo sincronizar tras login:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    resetActivityTimer();
  };

  const handleNavigateToUserManagement = () => {
    if (currentUser?.role === "admin") {
      setCurrentPage("userManagement");
      resetActivityTimer();
    } else {
      alert("Acceso denegado: solo administradores.");
    }
  };

  if (!currentUser) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

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
        {currentPage === "userManagement" ? (
          <UserManagement />
        ) : (
          <PublicDashboard currentPage={currentPage} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default App;