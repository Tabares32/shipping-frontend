import React, { useState, useEffect } from 'react';
import { getStorage, setStorage, syncToBackend } from '../utils/storage';

const FedexShippingCaptureForm = () => {
  const [scanInvoice, setScanInvoice] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [searchTermFG, setSearchTermFG] = useState('');
  const [selectedFinishedGood, setSelectedFinishedGood] = useState('');
  const [selectedObservation, setSelectedObservation] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [comments, setComments] = useState('');
  const [shippingDateForCut, setShippingDateForCut] = useState('');
  const [currentEntries, setCurrentEntries] = useState([]);
  const [message, setMessage] = useState('');

  const finishedGoodsList = getStorage('finishedGoods') || [];
  const observationOptions = getStorage('observations') || [];

  useEffect(() => {
    const stored = getStorage('fedexOrders') || [];
    setCurrentEntries(stored);
  }, []);

  const handleScanInvoice = (text) => {
    setScanInvoice(text);
    const match = text.match(/^([\w\-]+),/);
    if (match) {
      setSelectedInvoice(match[1]);
    }
    setSearchTermFG('');
    setSelectedFinishedGood('');
  };

  const createEntry = () => {
    const lineCount = currentEntries.filter(e => e.invoice === selectedInvoice).length + 1;
    return {
      id: Date.now(),
      invoice: selectedInvoice,
      finishedGood: selectedFinishedGood,
      observation: selectedObservation,
      trackingNumber,
      comments,
      shippingDate: shippingDateForCut,
      lineNumber: lineCount,
      captureTime: new Date().toLocaleTimeString(),
    };
  };

  const persistEntries = async (entries) => {
    setStorage('fedexOrders', entries);
    await syncToBackend();
    setCurrentEntries(entries);
  };

  const handleAddLine = async () => {
    if (!selectedInvoice || !selectedFinishedGood || !shippingDateForCut) {
      setMessage('Faltan datos obligatorios para guardar la línea.');
      return;
    }
    const newEntry = createEntry();
    const updated = [...currentEntries, newEntry];
    await persistEntries(updated);
    setMessage(`¡Línea ${newEntry.lineNumber} guardada con éxito para invoice ${selectedInvoice}!`);

    // Limpieza parcial para nueva captura estándar
    setScanInvoice('');
    setSelectedInvoice('');
    setSearchTermFG('');
    setSelectedFinishedGood('');
    setTrackingNumber('');
    setComments('');
  };

  const handleAddLineAndContinue = async () => {
    if (!selectedInvoice || !selectedFinishedGood || !shippingDateForCut) {
      setMessage('Faltan datos obligatorios para guardar la línea.');
      return;
    }
    const newEntry = createEntry();
    const updated = [...currentEntries, newEntry];
    await persistEntries(updated);
    setMessage(`¡Línea ${newEntry.lineNumber} guardada! Puedes capturar otra del mismo invoice.`);

    // Limpieza parcial para captura rápida: mantiene observación, tracking y comentarios
    setScanInvoice('');
    setSelectedInvoice('');
    setSearchTermFG('');
    setSelectedFinishedGood('');
  };

  const handleSaveOrder = async () => {
    // Si hace falta alguna validación extra se puede agregar aquí antes de confirmar
    await persistEntries(currentEntries);
    setMessage('¡Orden completa guardada con éxito!');
    // No limpiamos entradas para que el usuario vea el historial; si quieres limpiar, descomenta:
    // setCurrentEntries([]);
    // setStorage('fedexOrders', []);
  };

  const handleSelectFinishedGood = (fg) => {
    setSelectedFinishedGood(fg.name);
    setSearchTermFG(fg.name);
  };

  const filteredFinishedGoods = finishedGoodsList.filter(fg =>
    fg.name.toLowerCase().includes(searchTermFG.toLowerCase())
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Captura de Envíos Fedex</h2>

      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Fecha de Envío para el Corte</label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={shippingDateForCut}
            onChange={(e) => setShippingDateForCut(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Scan Invoice</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={scanInvoice}
            onChange={(e) => handleScanInvoice(e.target.value)}
            placeholder="Ej. 693284U,S-3263TM (1 of 1),Two Tone..."
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Invoice (Automático)</label>
          <input
            type="text"
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            value={selectedInvoice}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Buscar Finished Good</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTermFG}
            onChange={(e) => setSearchTermFG(e.target.value)}
            placeholder="Ej. SDB o parte completa"
            autoComplete="off"
          />
          {searchTermFG && filteredFinishedGoods.length > 0 && (
            <ul className="bg-white border rounded-lg mt-2 max-h-44 overflow-auto shadow z-20 relative">
              {filteredFinishedGoods.map((fg) => (
                <li
                  key={fg.id}
                  onClick={() => handleSelectFinishedGood(fg)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {fg.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Observación</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={selectedObservation}
            onChange={(e) => setSelectedObservation(e.target.value)}
          >
            <option value="">Seleccione una opción</option>
            {observationOptions.map((obs) => (
              <option key={obs.id} value={obs.text}>{obs.text}</option>
            ))}
          </select>
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
          <label className="block text-gray-700 text-sm font-semibold mb-2">Comentarios Adicionales</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={handleAddLine}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Agregar Línea
        </button>

        <button
          onClick={handleAddLineAndContinue}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Agregar Línea +1
        </button>

        <button
          onClick={handleSaveOrder}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Guardar Orden
        </button>
      </div>

      {currentEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Invoice</th>
                <th className="py-3 px-4 text-left">Finished Good</th>
                <th className="py-3 px-4 text-left">Observación</th>
                <th className="py-3 px-4 text-left">Tracking</th>
                <th className="py-3 px-4 text-left">Comentarios</th>
                <th className="py-3 px-4 text-left">Fecha Corte</th>
                <th className="py-3 px-4 text-left">Línea</th>
                <th className="py-3 px-4 text-left">Hora</th>
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
                  <td className="py-3 px-4">Línea {entry.lineNumber}</td>
                  <td className="py-3 px-4">{entry.captureTime}</td>
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