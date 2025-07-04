import React from 'react';
import FedexShippingCaptureForm from './FedexShippingCaptureForm';
import FinishedGoodManagement from './FinishedGoodManagement';
import ShippingRegisterForm from './ShippingRegisterForm';
import FinishedGoodsReportTable from './FinishedGoodsReportTable';
import ObservationManagement from './ObservationManagement';
import ShippingSearch from './ShippingSearch';
import InvoiceHistory from './InvoiceHistory';
import CutReport from './CutReport';
import RetainedOrders from './RetainedOrders';

const PublicDashboard = ({ currentPage }) => {
  const renderPage = () => {
    switch (currentPage) {
      case 'fedexShippingCapture':
        return <FedexShippingCaptureForm />;
      case 'finishedGoodManagement':
        return <FinishedGoodManagement />;
      case 'shippingRegister':
        return <ShippingRegisterForm />;
      case 'finishedGoodsReport':
        return <FinishedGoodsReportTable />;
      case 'observationManagement':
        return <ObservationManagement />;
      case 'shippingSearch':
        return <ShippingSearch />;
      case 'invoiceHistory':
        return <InvoiceHistory />;
      case 'cutReport':
        return <CutReport />;
      case 'retainedOrders':
        return <RetainedOrders />;
      default:
        return <h2 className="text-2xl font-bold text-gray-800 text-center">¡Bienvenido al Gestor de Envíos!</h2>;
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      {renderPage()}
    </div>
  );
};

export default PublicDashboard;