import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { mockFinishedGoods } from '../mock/finishedGoods';

const FinishedGoodManagement = () => {
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [newFinishedGoodName, setNewFinishedGoodName] = useState('');
  const [newType, setNewType] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedFinishedGoods = getStorage('customFinishedGoods') || mockFinishedGoods;
    setFinishedGoods(storedFinishedGoods);
  }, []);

  const handleAddFinishedGood = () => {
    if (newFinishedGoodName && newType && newVehicleType) {
      const updatedFinishedGoods = [...finishedGoods, { finishedGood: newFinishedGoodName, type: newType, vehicleType: newVehicleType }];
      setStorage('customFinishedGoods', updatedFinishedGoods);
      setFinishedGoods(updatedFinishedGoods);
      setNewFinishedGoodName('');
      setNewType('');
      setNewVehicleType('');
      setMessage('¡Finished Good agregado con éxito!');
    } else {
      setMessage('Por favor, completa todos los campos para agregar un Finished Good.');
    }
  };

  const handleRemoveFinishedGood = (fgToRemove) => {
    const updatedFinishedGoods = finishedGoods.filter(item => item.finishedGood !== fgToRemove);
    setStorage('customFinishedGoods', updatedFinishedGoods);
    setFinishedGoods(updatedFinishedGoods);
    setMessage(`Finished Good "${fgToRemove}" eliminado.`);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gestión de Finished Goods</h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Agregar Nuevo Finished Good</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Nombre Finished Good</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              value={newFinishedGoodName}
              onChange={(e) => setNewFinishedGoodName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Tipo (Front/Rear)</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              <option value="">Selecciona</option>
              <option value="Front">Front</option>
              <option value="Rear">Rear</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Vehículo</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              value={newVehicleType}
              onChange={(e) => setNewVehicleType(e.target.value)}
            >
              <option value="">Selecciona</option>
              <option value="Pickup">Pickup</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAddFinishedGood}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-md font-semibold shadow-md"
        >
          Agregar Finished Good
        </button>
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">Finished Goods Existentes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Finished Good</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Tipo</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Vehículo</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {finishedGoods.length > 0 ? (
              finishedGoods.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 text-gray-800">{item.finishedGood}</td>
                  <td className="py-3 px-4 text-gray-800">{item.type}</td>
                  <td className="py-3 px-4 text-gray-800">{item.vehicleType}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleRemoveFinishedGood(item.finishedGood)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-300 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">No hay Finished Goods registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinishedGoodManagement;