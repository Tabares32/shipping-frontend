import React, { useState, useEffect, useRef } from "react";
import AuthLogin from "./components/AuthLogin";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import PublicDashboard from "./components/PublicDashboard";
import UserManagement from "./components/UserManagement";
import NormalDashboard from "./components/NormalDashboard";
import {
  initStorageSync,
  syncFromBackend,
  clearSyncState,
} from "./utils/storage";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mainPage, setMainPage] = useState("fedexShippingCapture");
  const [subPage, setSubPage] = useState(null);
  const activityTimer = useRef(null);
  const manualLogoutFlag = useRef(false);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("currentUser");
    if (token && user) {
      setCurrentUser(null); // No restaurar sesión automáticamente
    }
  }, []);

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
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Sincronización inicial completada");
      } catch (error) {
        console.warn("⚠️ Error en sincronización inicial:", error);
      } finally {
        setIsSyncing(false);
      }
    })();

    const syncInterval = setInterval(async () => {
      try {
        console.log("🔄 Verificando cambios en el backend...");
        await syncFromBackend();
      } catch (err) {
        console.warn("⚠️ Error al sincronizar automáticamente:", err);
      }
    }, 60000);

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

  const handleLoginSuccess = async ({ token, username, role }) => {
    setCurrentUser({ username, role });
    setMainPage("fedexShippingCapture");
    resetActivityTimer();

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("✅ Datos sincronizados tras inicio de sesión.");
    } catch (e) {
      console.warn("No se pudo sincronizar tras login:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNavigate = (page) => {
    if (page === "userManagement") {
      if (currentUser?.role === "admin") {
        setMainPage("userManagement");
      } else {
        alert("Acceso denegado: solo administradores.");
        return;
      }
    } else if (["inventoryCapture", "shippingRegister"].includes(page)) {
      setMainPage("normalDashboard");
      setSubPage(page);
    } else {
      setMainPage(page);
      setSubPage(null);
    }

    resetActivityTimer();
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
        onNavigateToUserManagement={() => handleNavigate("userManagement")}
      />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          currentPage={mainPage}
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />
        {mainPage === "userManagement" ? (
          <UserManagement />
        ) : mainPage === "normalDashboard" ? (
          <NormalDashboard currentPage={subPage} />
        ) : (
          <PublicDashboard currentPage={mainPage} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default App;