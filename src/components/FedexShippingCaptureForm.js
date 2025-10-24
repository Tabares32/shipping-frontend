import React, { useState, useEffect } from 'react';
import { getStorage, setStorage, syncToBackend } from '../utils/storage';
import { mockFinishedGoods } from '../mock/finishedGoods';
import { mockMaterials } from '../mock/materials';

const FedexShippingCaptureForm = () => {
  const [currentEntries, setCurrentEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [selectedFinishedGood, setSelectedFinishedGood] = useState('');
  const [selectedObservation, setSelectedObservation] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [comments, setComments] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [currentShippingDate, setCurrentShippingDate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = getStorage('fedexOrders') || [];
    setCurrentEntries(stored);
  }, []);

  const handleAddEntry = async () => {
    if (!selectedFinishedGood || !selectedInvoice || !currentShippingDate) {
      setMessage('Faltan datos obligatorios para guardar la línea.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      finishedGood: selectedFinishedGood,
      observation: selectedObservation,
      trackingNumber,
      comments,
      invoice: selectedInvoice,
      shippingDate: currentShippingDate,
      lineCount: 1,
      captureTime: new Date().toLocaleString(),
    };

    const updated = [...currentEntries, newEntry];
    setStorage('fedexOrders', updated);
    await syncToBackend();
    setCurrentEntries(updated);
    setMessage('¡Línea guardada con éxito!');
    resetForm();
  };

  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id);
    setSelectedFinishedGood(entry.finishedGood);
    setSelectedObservation(entry.observation);
    setTrackingNumber(entry.trackingNumber);
    setComments(entry.comments);
    setSelectedInvoice(entry.invoice);
    setCurrentShippingDate(entry.shippingDate);
  };

  const handleUpdateEntry = async () => {
    const updated = currentEntries.map((entry) =>
      entry.id === editingEntryId
        ? {
            ...entry,
            finishedGood: selectedFinishedGood,
            observation: selectedObservation,
            trackingNumber,
            comments,
            invoice: selectedInvoice,
            shippingDate: currentShippingDate,
          }
        : entry
    );
    setStorage('fedexOrders', updated);
    await syncToBackend();
    setCurrentEntries(updated);
    setMessage('¡Línea actualizada con éxito!');
    resetForm();
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setEditingEntryId(null);
    setSelectedFinishedGood('');
    setSelectedObservation('');
    setTrackingNumber('');
    setComments('');
    setSelectedInvoice('');
    setCurrentShippingDate('');
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Captura de Envíos Fedex</h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Invoice</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={selectedInvoice}
            onChange={(e) => setSelectedInvoice(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Finished Good</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={selectedFinishedGood}
            onChange={(e) => setSelectedFinishedGood(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Observación</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={selectedObservation}
            onChange={(e) => setSelectedObservation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Tracking Number</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Comentarios</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Fecha de Envío</label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={currentShippingDate}
            onChange={(e) => setCurrentShippingDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        {editingEntryId ? (
          <>
            <button
              onClick={handleUpdateEntry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Actualizar Línea
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Cancelar Edición
            </button>
          </>
        ) : (
          <button
            onClick={handleAddEntry}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Agregar Línea
          </button>
        )}
      </div>

      {currentEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Finished Good</th>
                <th className="py-3 px-4">Observación</th>
                <th className="py-3 px-4">Tracking</th>
                <th className="py-3 px-4">Comentarios</th>
                <th className="py-3 px-4">Fecha Envío</th>
                <th className="py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{entry.invoice}</td>
                  <td className="py-3 px-4">{entry.finishedGood}</td>
                  <td className="py-3 px-4">{entry.observation}</td>
                  <td className="py-3 px-4">{entry.trackingNumber}</td>
                  <td className="py-3 px-4">{entry.comments}</td>
                  <td className="py-3 px-4">{entry.shippingDate}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-4">No hay líneas capturadas aún.</p>
      )}
    </div>
  );
};

export default FedexShippingCaptureForm;