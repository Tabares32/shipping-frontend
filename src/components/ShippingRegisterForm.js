import React, { useState, useEffect } from 'react';
import { getStorage, setStorage, syncToBackend } from '../utils/storage';

const ShippingRegisterForm = () => {
  const [shippingRecords, setShippingRecords] = useState([]);
  const [invoice, setInvoice] = useState('');
  const [boxDimension, setBoxDimension] = useState('');
  const [weight, setWeight] = useState('');
  const [addedFund, setAddedFund] = useState('');
  const [cost, setCost] = useState('');
  const [arizonaExpenditure, setArizonaExpenditure] = useState('');
  const [message, setMessage] = useState('');

  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedShippingDate, setSelectedShippingDate] = useState('');

  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const storedRecords = getStorage('uspsOrders') || [];
    setShippingRecords(Array.isArray(storedRecords) ? storedRecords : []);
  }, []);

  const handleSaveOrder = () => {
    setShowDateModal(true);
  };

  const handleConfirmShippingDate = async () => {
    const now = new Date();
    const newRecord = {
      id: Date.now(),
      invoice,
      boxDimension,
      weight: weight !== '' ? parseFloat(weight) : null,
      shippingDay: selectedShippingDate || now.toLocaleDateString(),
      captureTime: now.toLocaleTimeString(),
      addedFund: addedFund !== '' ? parseFloat(addedFund) : 0,
      cost: cost !== '' ? parseFloat(cost) : 0,
      arizonaExpenditure: arizonaExpenditure !== '' ? parseFloat(arizonaExpenditure) : 0,
      balance: (
        (addedFund !== '' ? parseFloat(addedFund) : 0) -
        (cost !== '' ? parseFloat(cost) : 0) -
        (arizonaExpenditure !== '' ? parseFloat(arizonaExpenditure) : 0)
      ).toFixed(3),
    };

    const updatedRecords = [...shippingRecords, newRecord];
    setStorage('uspsOrders', updatedRecords);
    setShippingRecords(updatedRecords);
    try {
      await syncToBackend();
    } catch (err) {
      console.warn('Error sincronizando uspsOrders:', err);
    }

    setMessage('¡Orden guardada con éxito!');
    setInvoice('');
    setBoxDimension('');
    setWeight('');
    setAddedFund('');
    setCost('');
    setArizonaExpenditure('');
    setSelectedShippingDate('');
    setShowDateModal(false);

    // limpiar mensaje después de unos segundos
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDeleteClick = (recordId) => {
    setRecordToDelete(recordId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRecord = async () => {
    const updated = shippingRecords.filter((r) => r.id !== recordToDelete);
    setStorage('uspsOrders', updated);
    setShippingRecords(updated);
    try {
      await syncToBackend();
    } catch (err) {
      console.warn('Error sincronizando uspsOrders después de eliminar:', err);
    }
    setMessage('Registro eliminado correctamente.');
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Órdenes para Envío USPS</h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Invoice</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Dimensión Caja</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={boxDimension}
            onChange={(e) => setBoxDimension(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Peso (Lbs)</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Added Fund</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={addedFund}
            onChange={(e) => setAddedFund(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Costo</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Arizona Expenditure</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={arizonaExpenditure}
            onChange={(e) => setArizonaExpenditure(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSaveOrder}
        className="w-full mt-4 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-lg font-semibold shadow-lg"
      >
        Guardar Orden
      </button>

      {/* Modal para seleccionar fecha de envío */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Seleccione la fecha de envío</h3>
            <input
              type="date"
              value={selectedShippingDate}
              onChange={(e) => setSelectedShippingDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedShippingDate('');
                }}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancelar
              </button>
              <button onClick={handleConfirmShippingDate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-center text-red-700">¿Seguro que deseas eliminar esta orden?</h3>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">
                No
              </button>
              <button onClick={confirmDeleteRecord} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4">Invoice</th>
              <th className="py-3 px-4">Dimensión Caja</th>
              <th className="py-3 px-4">Peso</th>
              <th className="py-3 px-4">Día Envío</th>
              <th className="py-3 px-4">Hora Captura</th>
              <th className="py-3 px-4">Added Fund</th>
              <th className="py-3 px-4">Costo</th>
              <th className="py-3 px-4">Arizona Exp.</th>
              <th className="py-3 px-4">Balance</th>
              <th className="py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shippingRecords.length > 0 ? (
              shippingRecords.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{record.invoice}</td>
                  <td className="py-3 px-4">{record.boxDimension}</td>
                  <td className="py-3 px-4">{record.weight ?? '—'}</td>
                  <td className="py-3 px-4">{record.shippingDay}</td>
                  <td className="py-3 px-4">{record.captureTime}</td>
                  <td className="py-3 px-4">{record.addedFund}</td>
                  <td className="py-3 px-4">{record.cost}</td>
                  <td className="py-3 px-4">{record.arizonaExpenditure}</td>
                  <td className="py-3 px-4 font-semibold">{record.balance}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteClick(record.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="py-4 text-center text-gray-500">No hay registros de envíos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingRegisterForm;