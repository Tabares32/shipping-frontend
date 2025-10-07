import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { mockFinishedGoods } from '../mock/finishedGoods';
import { mockObservations } from '../mock/observations';
import { mockMaterials } from '../mock/materials'; // Import mock materials

const FedexShippingCaptureForm = () => {
  const [scanInvoice, setScanInvoice] = useState('');
  const [invoice, setInvoice] = useState('');
  const [selectedFinishedGood, setSelectedFinishedGood] = useState('');
  const [selectedObservation, setSelectedObservation] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState('');
  const [currentEntries, setCurrentEntries] = useState([]);
  const [availableFinishedGoods, setAvailableFinishedGoods] = useState([]);
  const [availableObservations, setAvailableObservations] = useState([]);
  const [searchTermFG, setSearchTermFG] = useState('');
  const [currentShippingDate, setCurrentShippingDate] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null); // Para saber qué línea se está editando

  useEffect(() => {
    const storedFinishedGoods = getStorage('customFinishedGoods') || mockFinishedGoods;
    setAvailableFinishedGoods(storedFinishedGoods);
    const storedObservations = getStorage('customObservations') || mockObservations;
    setAvailableObservations(storedObservations);
  }, []);

  const checkMaterialAvailability = (fgName) => {
    const fg = availableFinishedGoods.find(item => item.finishedGood === fgName);
    if (!fg || !fg.bom || fg.bom.length === 0) {
      return { available: true, missingMaterials: [] }; // No BOM, assume available
    }

    const currentMaterialsStock = getStorage('materials') || mockMaterials;
    const missingMaterials = [];

    for (const bomItem of fg.bom) {
      const materialInStock = currentMaterialsStock.find(mat => mat.materialId === bomItem.materialId);
      if (!materialInStock || materialInStock.stock < bomItem.quantity) {
        missingMaterials.push({ name: bomItem.name, required: bomItem.quantity, available: materialInStock ? materialInStock.stock : 0 });
      }
    }
    return { available: missingMaterials.length === 0, missingMaterials };
  };

  const deductMaterials = (fgName) => {
    const fg = availableFinishedGoods.find(item => item.finishedGood === fgName);
    if (!fg || !fg.bom || fg.bom.length === 0) {
      return;
    }

    let currentMaterialsStock = getStorage('materials') || mockMaterials;
    for (const bomItem of fg.bom) {
      currentMaterialsStock = currentMaterialsStock.map(mat =>
        mat.materialId === bomItem.materialId ? { ...mat, stock: mat.stock - bomItem.quantity } : mat
      );
    }
    setStorage('materials', currentMaterialsStock);
  };

  const handleScanInvoiceChange = (e) => {
    const value = e.target.value;
    setScanInvoice(value);
    const match = value.match(/(\d{6}U)/);
    if (match) {
      setInvoice(match[1]);
    } else {
      setInvoice('');
    }
  };

  const handleAddEntry = () => {
    if (!scanInvoice || !invoice || !selectedFinishedGood || !currentShippingDate) {
      setMessage('¡Faltan datos! Scan Invoice, Invoice, Finished Good y Fecha de Envío son obligatorios.');
      return;
    }

    const materialCheck = checkMaterialAvailability(selectedFinishedGood);
    if (!materialCheck.available) {
      setMessage(`¡Faltan materiales para ${selectedFinishedGood}! Faltantes: ${materialCheck.missingMaterials.map(m => `${m.name} (Necesitas: ${m.required}, Tienes: ${m.available})`).join(', ')}`);
      return;
    }

    const now = new Date();
    const newEntry = {
      id: Date.now(),
      scanInvoice,
      invoice,
      finishedGood: selectedFinishedGood,
      observation: selectedObservation,
      trackingNumber,
      comments,
      captureTime: now.toLocaleString(),
      shippingDate: currentShippingDate, // Usar la fecha seleccionada
      lineCount: currentEntries.length + 1,
    };

    setCurrentEntries([...currentEntries, newEntry]);
    deductMaterials(selectedFinishedGood); // Deduct materials
    setMessage('Línea agregada. ¡Puedes añadir más o guardar el envío!');
    setScanInvoice('');
    setSelectedFinishedGood('');
    setSelectedObservation('');
    setSearchTermFG(''); // Limpiar el término de búsqueda del FG
  };

  const handleSaveOrder = () => {
    if (currentEntries.length === 0) {
      setMessage('¡No hay líneas para guardar! Agrega al menos una.');
      return;
    }

    const allRecords = getStorage('fedexShippingRecords') || [];
    setStorage('fedexShippingRecords', [...allRecords, ...currentEntries]);
    setMessage(`¡Orden con ${currentEntries.length} líneas guardada con éxito!`);
    setCurrentEntries([]);
    setInvoice('');
    setScanInvoice('');
    setSelectedFinishedGood('');
    setSelectedObservation('');
    setTrackingNumber('');
    setComments('');
    setSearchTermFG('');
  };

  const handleSaveSingleLineOrder = () => {
    if (!scanInvoice || !invoice || !selectedFinishedGood || !currentShippingDate) {
      setMessage('¡Faltan datos para guardar una sola línea!');
      return;
    }

    const materialCheck = checkMaterialAvailability(selectedFinishedGood);
    if (!materialCheck.available) {
      setMessage(`¡Faltan materiales para ${selectedFinishedGood}! Faltantes: ${materialCheck.missingMaterials.map(m => `${m.name} (Necesitas: ${m.required}, Tienes: ${m.available})`).join(', ')}`);
      return;
    }

    const now = new Date();
    const newEntry = {
      id: Date.now(),
      scanInvoice,
      invoice,
      finishedGood: selectedFinishedGood,
      observation: selectedObservation,
      trackingNumber,
      comments,
      captureTime: now.toLocaleString(),
      shippingDate: currentShippingDate,
      lineCount: 1,
    };

    const allRecords = getStorage('fedexShippingRecords') || [];
    setStorage('fedexShippingRecords', [...allRecords, newEntry]);
    deductMaterials(selectedFinishedGood); // Deduct materials
    setMessage('¡Línea de orden guardada con éxito!');
    setScanInvoice('');
    setInvoice('');
    setSelectedFinishedGood('');
    setSelectedObservation('');
    setTrackingNumber('');
    setComments('');
    setSearchTermFG('');
  };

  const handleSelectFinishedGood = (fgName) => {
    setSelectedFinishedGood(fgName);
    setSearchTermFG(fgName); // Mantener el nombre en el input de búsqueda
  };

  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id);
    setScanInvoice(entry.scanInvoice);
    setInvoice(entry.invoice);
    setSelectedFinishedGood(entry.finishedGood);
    setSearchTermFG(entry.finishedGood); // Para que el input de búsqueda muestre el FG actual
    setSelectedObservation(entry.observation);
    setTrackingNumber(entry.trackingNumber);
    setComments(entry.comments);
    setCurrentShippingDate(entry.shippingDate); // Cargar la fecha de envío de la entrada
  };

  const handleUpdateEntry = () => {
    setCurrentEntries(currentEntries.map(entry =>
      entry.id === editingEntryId
        ? {
            ...entry,
            scanInvoice,
            invoice,
            finishedGood: selectedFinishedGood,
            observation: selectedObservation,
            trackingNumber,
            comments,
            shippingDate: currentShippingDate, // Actualizar la fecha de envío
          }
        : entry
    ));
    setMessage('Línea actualizada en la orden actual.');
    setEditingEntryId(null);
    setScanInvoice('');
    setInvoice('');
    setSelectedFinishedGood('');
    setSelectedObservation('');
    setTrackingNumber('');
    setComments('');
    setSearchTermFG('');
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setScanInvoice('');
    setInvoice('');
    setSelectedFinishedGood('');
    setSelectedObservation('');
    setTrackingNumber('');
    setComments('');
    setSearchTermFG('');
    // No limpiar currentShippingDate aquí para que se mantenga la última seleccionada
  };

  const filteredFinishedGoods = availableFinishedGoods.filter(fg =>
    fg.finishedGood.toLowerCase().includes(searchTermFG.toLowerCase())
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Órdenes para Envío Fedex</h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center font-semibold">
        <label className="block text-gray-700 text-sm font-semibold mb-2">Fecha de Envío para el Corte</label>
        <input
          type="date"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
          value={currentShippingDate}
          onChange={(e) => setCurrentShippingDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Scan Invoice</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={scanInvoice}
            onChange={handleScanInvoiceChange}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Invoice (Automático)</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            value={invoice}
            readOnly
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Buscar Finished Good</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            placeholder="Escribe para buscar..."
            value={searchTermFG}
            onChange={(e) => setSearchTermFG(e.target.value)}
          />
          {searchTermFG && filteredFinishedGoods.length > 0 && (
            <ul className="border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white z-10 relative">
              {filteredFinishedGoods.map((fg, index) => (
                <li
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectFinishedGood(fg.finishedGood)}
                >
                  {fg.finishedGood} ({fg.type}, {fg.vehicleType})
                </li>
              ))}
            </ul>
          )}
          {selectedFinishedGood && (
            <p className="mt-2 text-gray-600">Seleccionado: <span className="font-semibold">{selectedFinishedGood}</span></p>
          )}
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Observación</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={selectedObservation}
            onChange={(e) => setSelectedObservation(e.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {availableObservations.map((obs, index) => (
              <option key={index} value={obs}>{obs}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Tracking Number</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">Comentarios Adicionales</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition resize-none"
            rows="2"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {editingEntryId ? (
          <>
            <button
              onClick={handleUpdateEntry}
              className="flex-1 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 transition-all duration-300 text-lg font-semibold shadow-lg"
            >
              Actualizar Línea
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-all duration-300 text-lg font-semibold shadow-lg"
            >
              Cancelar Edición
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAddEntry}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 text-lg font-semibold shadow-lg"
            >
              Agregar Línea
            </button>
            <button
              onClick={handleSaveSingleLineOrder}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all duration-300 text-lg font-semibold shadow-lg"
            >
              Guardar 1 Línea (Envío Rápido)
            </button>
          </>
        )}
      </div>

      {currentEntries.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Líneas en la Orden Actual ({invoice})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Línea</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Scan Invoice</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Finished Good</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Observación</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Tracking</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Comentarios</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Fecha Envío</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((entry, index) => (
                  <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-3 px-4 text-gray-800">{entry.lineCount}</td>
                    <td className="py-3 px-4 text-gray-800">{entry.scanInvoice}</td>
                    <td className="py-3 px-4 text-gray-800">{entry.finishedGood}</td>
                    <td className="py-3 px-4 text-gray-800">{entry.observation}</td>
                    <td className="py-3 px-4 text-gray-800">{entry.trackingNumber}</td>
                    <td className="py-3 px-4 text-gray-800">{entry.comments}</td>
                    <td className="py-3 px-4 text-gray-800">{entry.shippingDate || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-colors duration-300 text-sm"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={handleSaveOrder}
        className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-lg font-semibold shadow-lg"
      >
        Guardar Orden
      </button>
    </div>
  );
};

export default FedexShippingCaptureForm;