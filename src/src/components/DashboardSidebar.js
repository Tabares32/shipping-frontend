import React from 'react';

const DashboardSidebar = ({ currentPage, onNavigate }) => {
  const navItems = [
    { name: 'Órdenes para Envío Fedex', page: 'fedexShippingCapture' },
    { name: 'Órdenes para Envío USPS', page: 'shippingRegister' },
    { name: 'Órdenes Retenidas', page: 'retainedOrders' },
    { name: '--- Gestión de Datos ---', page: 'separator1' },
    { name: 'Gestión de Finished Goods', page: 'finishedGoodManagement' },
    { name: 'Gestión de Observaciones', page: 'observationManagement' },
    { name: '--- Reportes y Búsquedas ---', page: 'separator2' },
    { name: 'Lista de Números de Parte', page: 'finishedGoodsReport' },
    { name: 'Buscar por Invoice', page: 'shippingSearch' },
    { name: 'Historial de Invoices', page: 'invoiceHistory' },
    { name: 'Reporte de Cortes', page: 'cutReport' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 rounded-r-2xl shadow-lg">
      <nav>
        <ul>
          {navItems.map((item) => (
            item.page.startsWith('separator') ? (
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
            )
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;