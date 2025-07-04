import React from 'react';

const DashboardHeader = ({ currentUser, onLogout }) => {
  // Asegurarse de que currentUser no sea null antes de intentar acceder a sus propiedades
  if (!currentUser) {
    return (
      <header className="bg-white shadow-md p-4 flex justify-between items-center rounded-b-2xl">
        <h1 className="text-2xl font-bold text-gray-800">Control Total de Envíos</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Cargando usuario...</span>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center rounded-b-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Control Total de Envíos</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-700">Hola, {currentUser.username} ({currentUser.role})</span>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
        >
          Salir
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;