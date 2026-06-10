import React, { useState, useEffect } from "react";
import { clearSyncState } from "../utils/storage";

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// ─── Google Client ID — pon el tuyo en .env como REACT_APP_GOOGLE_CLIENT_ID ───
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID || "TU_GOOGLE_CLIENT_ID_AQUI";

// Carga el SDK de Google una sola vez
function loadGoogleSDK(callback) {
  if (window.google?.accounts) {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
}

// ─── Modal de Términos y Condiciones ──────────────────────────────────────────
const TermsModal = ({ onAccept, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Términos y Condiciones de Uso
      </h3>
      <div className="h-56 overflow-y-auto text-sm text-gray-600 border rounded-lg p-4 mb-6 leading-relaxed">
        <p className="font-semibold mb-2">1. Uso del sistema</p>
        <p className="mb-3">
          Este sistema es de uso exclusivo para operaciones de envío autorizadas.
          El acceso es personal e intransferible.
        </p>
        <p className="font-semibold mb-2">2. Privacidad de datos</p>
        <p className="mb-3">
          Los datos ingresados serán almacenados de forma segura y usados
          únicamente para la gestión logística interna.
        </p>
        <p className="font-semibold mb-2">3. Responsabilidad</p>
        <p className="mb-3">
          El usuario es responsable de la información que registra. El uso
          indebido del sistema puede resultar en la revocación del acceso.
        </p>
        <p className="font-semibold mb-2">4. Seguridad</p>
        <p>
          No compartas tus credenciales. Reporta cualquier acceso sospechoso al
          administrador del sistema.
        </p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onAccept}
          className="px-5 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
        >
          Acepto los términos
        </button>
      </div>
    </div>
  </div>
);

// ─── Banner de actualización ───────────────────────────────────────────────────
const UpdateBanner = ({ newVersion, onUpdate }) => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-3 px-6 flex items-center justify-between shadow-lg">
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span className="font-semibold">
        Nueva versión disponible — v{newVersion}
      </span>
    </div>
    <button
      onClick={onUpdate}
      className="bg-white text-blue-600 font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
    >
      Actualizar ahora
    </button>
  </div>
);

// ─── Pantalla de progreso de actualización ─────────────────────────────────────
const UpdateProgress = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const steps = [
    "Descargando actualización...",
    "Instalando componentes...",
    "Aplicando cambios...",
    "Actualización completa ✓",
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2600),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => { onDone(); }, 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <svg className="w-16 h-16 text-blue-600 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-80" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {step < 3 ? "Actualizando sistema" : "¡Actualización completa!"}
        </h2>
        <p className="text-gray-500 text-sm mb-6">{steps[step]}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
        {step === 3 && (
          <p className="text-sm text-gray-600 mt-4">
            Inicia sesión de nuevo para continuar.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const AuthLogin = ({ onLoginSuccess }) => {
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  // términos
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
  const [showTerms, setShowTerms]                   = useState(false);

  // actualizaciones
  const [newVersion, setNewVersion]         = useState(null);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);

  // ── Verificar actualizaciones al montar ────────────────────────
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res  = await fetch(`${BACKEND}/api/version`);
        if (!res.ok) return;
        const data = await res.json();
        const stored = localStorage.getItem("appVersion");
        if (stored && stored !== data.version) {
          setNewVersion(data.version);
        } else if (!stored) {
          localStorage.setItem("appVersion", data.version);
        }
      } catch (_) {}
    };
    checkVersion();
  }, []);

  // ── Google SDK ────────────────────────────────────────────────
  useEffect(() => {
    if (GOOGLE_CLIENT_ID === "TU_GOOGLE_CLIENT_ID_AQUI") return;
    loadGoogleSDK(() => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          // Al recibir el token de Google, mostrar modal de términos
          setPendingGoogleToken(response.credential);
          setShowTerms(true);
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: "100%", text: "signin_with" }
      );
    });
  }, []);

  // ── Update: iniciar progreso ──────────────────────────────────
  const handleUpdate = () => {
    setNewVersion(null);
    setShowUpdateProgress(true);
  };

  // ── Update: cuando termina la animación, volver a login ───────
  const handleUpdateDone = () => {
    localStorage.clear();
    clearSyncState();
    setShowUpdateProgress(false);
    // la versión se guarda al próximo login exitoso
    window.location.reload(); // recarga el bundle nuevo
  };

  // ── Login con usuario/contraseña ──────────────────────────────
  const handleLogin = async (e) => {
    e && e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Completa usuario y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Credenciales inválidas.");
        return;
      }
      if (data.token && data.username) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUser", JSON.stringify({
          username: data.username,
          role:     data.role || "user",
        }));
        // Guardar versión actual después de login exitoso
        try {
          const vr = await fetch(`${BACKEND}/api/version`);
          if (vr.ok) {
            const vd = await vr.json();
            localStorage.setItem("appVersion", vd.version);
          }
        } catch (_) {}
        setPassword("");
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess({ token: data.token, username: data.username, role: data.role || "user" });
        }
      }
    } catch (_) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google: aceptar términos → completar login ────────────────
  const handleAcceptTerms = async () => {
    setShowTerms(false);
    if (!pendingGoogleToken) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${BACKEND}/api/auth/google`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token: pendingGoogleToken, terms_accepted: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Error al iniciar sesión con Google.");
        return;
      }
      if (data.token && data.username) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUser", JSON.stringify({
          username: data.username,
          role:     data.role || "user",
        }));
        try {
          const vr = await fetch(`${BACKEND}/api/version`);
          if (vr.ok) {
            const vd = await vr.json();
            localStorage.setItem("appVersion", vd.version);
          }
        } catch (_) {}
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess({ token: data.token, username: data.username, role: data.role || "user" });
        }
      }
    } catch (_) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
      setPendingGoogleToken(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  if (showUpdateProgress) {
    return <UpdateProgress onDone={handleUpdateDone} />;
  }

  return (
    <>
      {newVersion && (
        <UpdateBanner newVersion={newVersion} onUpdate={handleUpdate} />
      )}
      {showTerms && (
        <TermsModal
          onAccept={handleAcceptTerms}
          onCancel={() => { setShowTerms(false); setPendingGoogleToken(null); }}
        />
      )}

      <div
        className="flex items-center justify-center min-h-screen bg-gray-100 p-4"
        style={{ paddingTop: newVersion ? "56px" : undefined }}
      >
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          {/* Cabecera */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Control Total de Envíos</h1>
            <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Tu nombre de usuario"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
              }`}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">O continúa con</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Botón Google */}
          {GOOGLE_CLIENT_ID !== "TU_GOOGLE_CLIENT_ID_AQUI" ? (
            <div id="google-signin-btn" className="w-full" />
          ) : (
            <div className="text-center text-xs text-gray-400 bg-gray-50 rounded-xl py-3 px-4">
              Google Sign-In no configurado aún.<br />
              Agrega <code className="bg-gray-200 px-1 rounded">REACT_APP_GOOGLE_CLIENT_ID</code> en tu <code className="bg-gray-200 px-1 rounded">.env</code>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Al iniciar sesión con Google, se te pedirá aceptar los términos de uso.
          </p>
        </div>
      </div>
    </>
  );
};

export default AuthLogin;
