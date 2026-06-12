import React, { useState } from 'react';

// ── Íconos SVG inline ──────────────────────────────────────────────────────────
const Icon = ({ d, d2 }) => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const Chevron = ({ open }) => (
  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Definición de categorías y páginas ─────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'envios',
    label: 'Envíos',
    icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />,
    items: [
      {
        name: 'Órdenes FedEx',
        page: 'fedexShippingCapture',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
      },
      {
        name: 'Balance USPS',
        page: 'shippingRegister',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
      },
      {
        name: 'Órdenes Retenidas',
        page: 'retainedOrders',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestión de Datos',
    icon: <Icon d="M4 7h16M4 12h10M4 17h7" />,
    items: [
      {
        name: 'Finished Goods',
        page: 'finishedGoodManagement',
        roles: ['admin', 'editor'],
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />,
      },
      {
        name: 'Observaciones',
        page: 'observationManagement',
        roles: ['admin', 'editor'],
        icon: <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" d2="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
      },
      {
        name: 'Materiales (BOM)',
        page: 'materialManagement',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    items: [
      {
        name: 'Tabla Pivote',
        page: 'finishedGoodsReport',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
      },
      {
        name: 'Buscar Invoice',
        page: 'shippingSearch',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
      },
      {
        name: 'Historial Invoices',
        page: 'invoiceHistory',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        name: 'Reporte de Cortes',
        page: 'cutReport',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />,
      },
      {
        name: 'Informe General',
        page: 'dailyReport',
        roles: ['admin', 'editor', 'viewer', 'user'],
        icon: <Icon d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" d2="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    items: [
      {
        name: 'Gestión de Usuarios',
        page: 'userManagement',
        roles: ['admin'],
        icon: <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      },
    ],
  },
];

// ── Etiqueta de rol con color ──────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = {
    admin:  { label: 'Admin',  cls: 'bg-red-500/20 text-red-300'  },
    editor: { label: 'Editor', cls: 'bg-blue-500/20 text-blue-300' },
    viewer: { label: 'Viewer', cls: 'bg-gray-500/20 text-gray-400' },
    user:   { label: 'User',   cls: 'bg-gray-500/20 text-gray-400' },
  }[role] || { label: role, cls: 'bg-gray-500/20 text-gray-400' };

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Sidebar principal ──────────────────────────────────────────────────────────
const DashboardSidebar = ({ currentPage, onNavigate, currentUser }) => {
  const role = currentUser?.role || 'viewer';

  // Todas las categorías abiertas por defecto
  const [openCats, setOpenCats] = useState(
    () => Object.fromEntries(CATEGORIES.map(c => [c.id, true]))
  );

  const toggle = id => setOpenCats(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shadow-xl rounded-r-2xl overflow-hidden">

      {/* Título del menú */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-700/60">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Navegación</p>
      </div>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-700">
        {CATEGORIES.map(cat => {
          const visible = cat.items.filter(i => i.roles.includes(role));
          if (visible.length === 0) return null;

          const isOpen   = openCats[cat.id];
          const hasActive = visible.some(i => i.page === currentPage);

          return (
            <div key={cat.id}>
              {/* Cabecera de categoría */}
              <button
                onClick={() => toggle(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors
                  ${hasActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
                  hover:bg-gray-800`}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-70">{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <Chevron open={isOpen} />
              </button>

              {/* Ítems de la categoría */}
              {isOpen && (
                <ul className="ml-1 mt-0.5 mb-1 space-y-0.5 border-l border-gray-700/50 pl-2">
                  {visible.map(item => {
                    const active = currentPage === item.page;
                    return (
                      <li key={item.page}>
                        <button
                          onClick={() => onNavigate(item.page)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                            ${active
                              ? 'bg-white text-gray-900 font-semibold shadow-sm'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                          <span className={active ? 'text-gray-700' : 'text-gray-500'}>
                            {item.icon}
                          </span>
                          <span className="leading-tight">{item.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer con usuario y rol */}
      <div className="px-4 py-3 border-t border-gray-700/60">
        <p className="text-xs text-gray-400 truncate font-medium mb-1">
          {currentUser?.username || 'Usuario'}
        </p>
        <RoleBadge role={role} />
      </div>
    </aside>
  );
};

export default DashboardSidebar;
