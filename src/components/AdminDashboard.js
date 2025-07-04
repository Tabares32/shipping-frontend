import React from 'react';
import InventoryCaptureForm from './InventoryCaptureForm';
import ShippingRegisterForm from './ShippingRegisterForm';
import FinishedGoodsReportTable from './FinishedGoodsReportTable';

import { useEffect } from 'react';

useEffect(() => {
  fetch('https://shipping-api-cc88.onrender.com/api/shippings')
    .then(res => res.json())
    .then(data => {
      console.log('Datos cargados desde la API:', data);
    })
    .catch(err => console.error('Error al conectar con el backend:', err));
}, []);


const AdminDashboard = ({ currentPage }) => {
  const renderPage = () => {
    switch (currentPage) {
      case 'inventoryCapture':
        return <InventoryCaptureForm />;
      case 'shippingRegister':
        return <ShippingRegisterForm />;
      case 'finishedGoodsReport':
        return <FinishedGoodsReportTable />;
      default:
        return <h2 className="text-2xl font-bold text-gray-800 text-center">¡Bienvenido, Admin! Selecciona una opción del menú.</h2>;
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      {renderPage()}
    </div>
  );
};

export default AdminDashboard;