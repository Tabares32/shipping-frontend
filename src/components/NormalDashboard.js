import React from "react";
import InventoryCaptureForm from "./InventoryCaptureForm";
import ShippingRegisterForm from "./ShippingRegisterForm";

const NormalDashboard = ({ currentPage }) => {
  const renderPage = () => {
    switch (currentPage) {
      case "inventoryCapture":
        return {
          title: "Captura de Inventario",
          content: <InventoryCaptureForm />,
        };
      case "shippingRegister":
        return {
          title: "Registro de Envíos",
          content: <ShippingRegisterForm />,
        };
      default:
        return {
          title: "Bienvenido",
          content: (
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                ¡Bienvenido al Dashboard!
              </h2>
              <p className="text-gray-600 text-lg">
                Selecciona una opción del menú para comenzar.
              </p>
            </div>
          ),
        };
    }
  };

  const { title, content } = renderPage();

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="mt-2 h-1 w-16 bg-black rounded"></div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">{content}</div>
    </div>
  );
};

export default NormalDashboard;