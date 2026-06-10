import React from 'react';

const DashboardHeader = ({ currentUser, onLogout, onNavigateToUserManagement }) => {
  if (!currentUser) {
    return (
      <header className="bg-white shadow-md p-4 flex justify-between items-center rounded-b-2xl">
        <h1 className="text-2xl font-bold text-gray-800">Control Total de Envíos</h1>
        <span className="text-gray-500 text-sm">Cargando…</span>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center rounded-b-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Control Total de Envíos</h1>

      <div className="flex items-center gap-3">
        <span className="text-gray-600 text-sm">
          Hola, <strong>{currentUser.username}</strong>
          <span className="ml-1 text-xs bg-gray-100 rounded-full px-2 py-0.5 capitalize">
            {currentUser.role}
          </span>
        </span>

        {currentUser.role === 'admin' && (
          <button
            onClick={onNavigateToUserManagement}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Gestión de Usuarios"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.83.147-1.491.652-1.897 1.318l-.606 1.002a1.896 1.896 0 01-2.481.396l-.77-.484a1.897 1.897 0 00-2.604.703l-.922 1.597a1.897 1.897 0 00.49 2.354l.73.563a1.896 1.896 0 010 2.83l-.73.564a1.897 1.897 0 00-.49 2.354l.923 1.597a1.897 1.897 0 002.603.703l.77-.484a1.896 1.896 0 012.48.396l.607 1.003c.406.665 1.066 1.17 1.897 1.317l.922.163c.894.15 1.676-.523 1.676-1.439v-.92c.147-.83.652-1.492 1.317-1.898l1.003-.606a1.896 1.896 0 012.48.396l.77.484a1.897 1.897 0 002.604-.703l.922-1.597a1.897 1.897 0 00-.49-2.354l-.73-.563a1.896 1.896 0 010-2.83l.73-.564a1.897 1.897 0 00.49-2.354l-.922-1.597a1.897 1.897 0 00-2.604-.703l-.77.484a1.896 1.896 0 01-2.48-.396l-.607-1.003c-.406-.666-1.066-1.17-1.897-1.318l-.922-.162A1.897 1.897 0 0011.078 2.25zm.922 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <button
          onClick={onLogout}
          className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
        >
          Salir
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
