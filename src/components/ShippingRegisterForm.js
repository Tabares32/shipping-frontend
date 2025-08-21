import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/storage';

const ShippingRegisterForm = () => {
  const [shippingRecords, setShippingRecords] = useState([]);
  const [invoice, setInvoice] = useState('');
  const [boxDimension, setBoxDimension] = useState('');
  const [weight, setWeight] = useState('');
  const [addedFund, setAddedFund] = useState('');
  const [cost, setCost] = useState('');
  const [arizonaExpenditure, setArizonaExpenditure] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedRecords = getStorage('shippingRecords') || [];
    setShippingRecords(storedRecords);
  }, []);

  const handleSaveOrder = () => {
    const now = new Date();
    const newRecord = {
      id: Date.now(),
      invoice,
      boxDimension,
      weight: parseFloat(weight),
      shippingDay: now.toLocaleDateString(),
      captureTime: now.toLocaleTimeString(),
      addedFund: parseFloat(addedFund),
      cost: parseFloat(cost),
      arizonaExpenditure: parseFloat(arizonaExpenditure),
      balance: (parseFloat(addedFund) - parseFloat(cost) - parseFloat(arizonaExpenditure)).toFixed(3),
    };

    const updatedRecords = [...shippingRecords, newRecord];
    setStorage('shippingRecords', updatedRecords);
    setShippingRecords(updatedRecords);
    setMessage('¡Orden guardada con éxito!');
    setInvoice('');
    setBoxDimension('');
    setWeight('');
    setAddedFund('');
    setCost('');
    setArizonaExpenditure('');
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Dimensión Caja</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={boxDimension}
            onChange={(e) => setBoxDimension(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Peso (Lbs)</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Added Fund</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={addedFund}
            onChange={(e) => setAddedFund(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Costo</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Arizona Expenditure</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={arizonaExpenditure}
            onChange={(e) => setArizonaExpenditure(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={handleSaveOrder}
        className="w-full mt-8 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-lg font-semibold shadow-lg"
      >
        Guardar Orden
      </button>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Invoice</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Dimensión Caja</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Peso (Lbs)</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Día Envío</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Hora Captura</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Added Fund</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Costo</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Arizona Exp.</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Balance</th>
            </tr>
          </thead>
          <tbody>
            {shippingRecords.length > 0 ? (
              shippingRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 text-gray-800">{record.invoice}</td>
                  <td className="py-3 px-4 text-gray-800">{record.boxDimension}</td>
                  <td className="py-3 px-4 text-gray-800">{record.weight}</td>
                  <td className="py-3 px-4 text-gray-800">{record.shippingDay}</td>
                  <td className="py-3 px-4 text-gray-800">{record.captureTime}</td>
                  <td className="py-3 px-4 text-gray-800">{record.addedFund}</td>
                  <td className="py-3 px-4 text-gray-800">{record.cost}</td>
                  <td className="py-3 px-4 text-gray-800">{record.arizonaExpenditure}</td>
                  <td className="py-3 px-4 text-gray-800 font-semibold">{record.balance}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-4 text-center text-gray-500">No hay registros de envíos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingRegisterForm;