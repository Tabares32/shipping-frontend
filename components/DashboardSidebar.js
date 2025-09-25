import React from 'react';

const DashboardSidebar = ({ currentPage, onNavigate, currentUser }) => {
  const navItems = [
    { name: 'Órdenes para Envío Fedex', page: 'fedexShippingCapture', roles: ['admin', 'normal'] },
    { name: 'Órdenes para Envío USPS', page: 'shippingRegister', roles: ['admin', 'normal'] },
    { name: 'Órdenes Retenidas', page: 'retainedOrders', roles: ['admin', 'normal'] },
    { name: '--- Gestión de Datos ---', page: 'separator1', roles: ['admin', 'normal'] },
    { name: 'Gestión de Finished Goods', page: 'finishedGoodManagement', roles: ['admin'] },
    { name: 'Gestión de Observaciones', page: 'observationManagement', roles: ['admin'] },
    { name: 'Gestión de Materiales (BOM)', page: 'materialManagement', roles: ['admin'] }, // New item for BOM management
    { name: '--- Reportes y Búsquedas ---', page: 'separator2', roles: ['admin', 'normal'] },
    { name: 'Lista de Números de Parte', page: 'finishedGoodsReport', roles: ['admin', 'normal'] },
    { name: 'Buscar por Invoice', page: 'shippingSearch', roles: ['admin', 'normal'] },
    { name: 'Historial de Invoices', page: 'invoiceHistory', roles: ['admin', 'normal'] },
    { name: 'Reporte de Cortes', page: 'cutReport', roles: ['admin', 'normal'] },
    { name: 'Informe Diario', page: 'dailyReport', roles: ['admin', 'normal'] },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 rounded-r-2xl shadow-lg">
      <nav>
        <ul>
          {navItems.map((item) => {
            // Verificar si el usuario actual tiene el rol necesario para ver el elemento
            if (!item.roles.includes(currentUser.role)) {
              return null; // Ocultar el elemento si el usuario no tiene el rol
            }
            
            // Renderizar separadores o elementos de navegación
            return item.page.startsWith('separator') ? (
              <li key={item.page} className="my-4 text-gray-400 text-sm font-semibold uppercase">
                {item.name}
              </li>
            ) : (
              <li key={item.page} className="mb-4">
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                    currentPage === item.page
                      ? 'bg-gray-700 text-white shadow-inner'
                      : 'hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;