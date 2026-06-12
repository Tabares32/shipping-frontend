import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthLogin from "./components/AuthLogin";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import PublicDashboard from "./components/PublicDashboard";
import UserManagement from "./components/UserManagement";
import {
  initStorageSync,
  syncFromBackend,
  clearSyncState,
} from "./utils/storage";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutos

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing,   setIsSyncing]   = useState(false);
  const [mainPage,    setMainPage]    = useState("fedexShippingCapture");

  const activityTimer    = useRef(null);
  const manualLogoutFlag = useRef(false);

  // ── Logout ────────────────────────────────────────────────────────────────
  const performLogout = useCallback((isManual = false) => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    clearSyncState();
    setCurrentUser(null);
    clearTimeout(activityTimer.current);
    if (!isManual) alert("Sesión cerrada por inactividad.");
    manualLogoutFlag.current = false;
  }, []);

  // ── Timer de inactividad ──────────────────────────────────────────────────
  const resetActivityTimer = useCallback(() => {
    clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(() => performLogout(false), INACTIVITY_MS);
  }, [performLogout]);

  useEffect(() => {
    if (!currentUser) { clearTimeout(activityTimer.current); return; }
    resetActivityTimer();
    const events = ["mousemove", "keypress", "click", "scroll"];
    events.forEach(e => window.addEventListener(e, resetActivityTimer));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivityTimer));
      clearTimeout(activityTimer.current);
    };
  }, [currentUser, resetActivityTimer]);

  // ── Sync periódico cada 60 s ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(async () => {
      try { await syncFromBackend(); }
      catch (e) { console.warn("⚠️ sync periódico:", e); }
    }, 60_000);
    return () => clearInterval(id);
  }, [currentUser]);

  // ── Login exitoso ─────────────────────────────────────────────────────────
  const handleLoginSuccess = async ({ token, username, role }) => {
    const user = { username, role };
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setMainPage("fedexShippingCapture");
    resetActivityTimer();

    try {
      setIsSyncing(true);
      await initStorageSync(token);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.warn("⚠️ Error sync post-login:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Navegación ────────────────────────────────────────────────────────────
  const handleNavigate = useCallback((page) => {
    if (page === "userManagement" && currentUser?.role !== "admin") {
      alert("Acceso denegado: solo administradores.");
      return;
    }
    setMainPage(page);
    resetActivityTimer();
  }, [currentUser, resetActivityTimer]);

  // ── Pantallas ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold">Sincronizando datos…</p>
          <p className="text-gray-400 text-sm mt-1">Conectando con el servidor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
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
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {mainPage === "userManagement"
            ? <UserManagement />
            : <PublicDashboard currentPage={mainPage} currentUser={currentUser} />
          }
        </main>
      </div>
    </div>
  );
};

export default App;
