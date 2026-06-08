import React, { useState, useEffect, useRef, useCallback } from "react";
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

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing,   setIsSyncing]   = useState(false);
  const [mainPage,    setMainPage]     = useState("fedexShippingCapture");
  const [subPage,     setSubPage]      = useState(null);

  const activityTimer      = useRef(null);
  const manualLogoutFlag   = useRef(false);

  // ── Logout ────────────────────────────────────────────────────
  const performLogout = useCallback((isManual = false) => {
    localStorage.removeItem("authToken");
    clearSyncState();
    setCurrentUser(null);
    clearTimeout(activityTimer.current);
    if (!isManual) {
      alert("Sesión cerrada por inactividad.");
    }
    manualLogoutFlag.current = false;
  }, []);

  // ── Timer de inactividad ──────────────────────────────────────
  const resetActivityTimer = useCallback(() => {
    clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(
      () => performLogout(false),
      INACTIVITY_TIMEOUT
    );
  }, [performLogout]);

  useEffect(() => {
    if (!currentUser) {
      clearTimeout(activityTimer.current);
      return;
    }
    resetActivityTimer();
    const events = ["mousemove", "keypress", "click"];
    events.forEach((e) => window.addEventListener(e, resetActivityTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivityTimer));
      clearTimeout(activityTimer.current);
    };
  }, [currentUser, resetActivityTimer]);

  // ── Sync periódico cada 60 s ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(async () => {
      try { await syncFromBackend(); }
      catch (err) { console.warn("⚠️ sync automático:", err); }
    }, 60_000);
    return () => clearInterval(id);
  }, [currentUser]);

  // ── Login exitoso ─────────────────────────────────────────────
  const handleLoginSuccess = async ({ token, username, role }) => {
    setCurrentUser({ username, role });
    setMainPage("fedexShippingCapture");
    setSubPage(null);
    resetActivityTimer();

    try {
      setIsSyncing(true);
      await initStorageSync(token);
      await new Promise((r) => setTimeout(r, 800));
    } catch (e) {
      console.warn("⚠️ Error en sync post-login:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Navegación ────────────────────────────────────────────────
  const handleNavigate = (page) => {
    if (page === "userManagement") {
      if (currentUser?.role !== "admin") {
        alert("Acceso denegado: solo administradores.");
        return;
      }
      setMainPage("userManagement");
      setSubPage(null);
    } else if (["inventoryCapture", "shippingRegister"].includes(page)) {
      setMainPage("normalDashboard");
      setSubPage(page);
    } else {
      setMainPage(page);
      setSubPage(null);
    }
    resetActivityTimer();
  };

  // ── Pantallas ─────────────────────────────────────────────────
  if (!currentUser) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-black mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold">Sincronizando datos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <DashboardHeader
        currentUser={currentUser}
        onLogout={() => { manualLogoutFlag.current = true; performLogout(true); }}
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
