import React, { useState, useEffect, useRef } from 'react';
import { getStorage, setStorage, syncToBackend } from '../utils/storage';
import { mockFinishedGoods } from '../mock/finishedGoods'; // fallback
import { mockObservations } from '../mock/observations'; // opcional fallback

// Componente principal
const FedexShippingCaptureForm = () => {
  // Finished goods / materials / observations / entradas
  const [finishedGoodsList, setFinishedGoodsList] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [observationsList, setObservationsList] = useState([]);

  // Form state
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [searchTermFG, setSearchTermFG] = useState('');
  const [selectedFinishedGood, setSelectedFinishedGood] = useState(null);
  const [selectedObservation, setSelectedObservation] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');
  const [shippingDateForCut, setShippingDateForCut] = useState(false);
  const [scanInvoice, setScanInvoice] = useState('');
  const [lineNumber, setLineNumber] = useState(1);
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState([]);
  const [curtainEntries, setCurtainEntries] = useState([]);

  // refs para evitar dobles sync al montar
  const mountedRef = useRef(false);

  // Cargar datos iniciales desde storage
  useEffect(() => {
    const fgs = getStorage('customFinishedGoods') || mockFinishedGoods || [];
    const mats = getStorage('materialsBOM') || getStorage('materials') || [];
    const obs = getStorage('observations') || mockObservations || [];

    setFinishedGoodsList(Array.isArray(fgs) ? fgs : []);
    setAvailableMaterials(Array.isArray(mats) ? mats : []);
    setObservationsList(Array.isArray(obs) ? obs : []);

    const savedEntries = getStorage('entries') || [];
    setEntries(Array.isArray(savedEntries) ? savedEntries : []);
    setCurtainEntries(Array.isArray(savedEntries) ? savedEntries : []);

    // set line number from existing entries length + 1
    const startLine = Array.isArray(savedEntries) ? savedEntries.length + 1 : 1;
    setLineNumber(startLine);

    // avoid double-sync on first render
    mountedRef.current = true;
  }, []);

  // Filtrado dinámico: busca dentro de la propiedad finishedGood (case-insensitive)
  const filteredFinishedGoods = finishedGoodsList.filter((fg) => {
    if (!searchTermFG) return true;
    const target = (fg.finishedGood || fg.name || '').toString().toLowerCase();
    return target.includes(searchTermFG.toLowerCase());
  });

  // Mostrar mensajes temporales
  const showMessage = (txt, timeout = 3000) => {
    setMessage(txt);
    if (timeout > 0) setTimeout(() => setMessage(''), timeout);
  };

  // Crear estructura de entry base
  const createEntry = () => {
    return {
      order: selectedInvoice || '',
      lineNumber,
      finishedGood: selectedFinishedGood ? (selectedFinishedGood.finishedGood || selectedFinishedGood.name) : '',
      finishedGoodObject: selectedFinishedGood || null,
      observation: selectedObservation || '',
      trackingNumber: '',
      shippingDate: shipmentDate || '',
      captureTime: new Date().toISOString(),
    };
  };

  // Persistir entradas en storage y backend
  const persistEntries = async (newEntries) => {
    setStorage('entries', newEntries);
    await syncToBackend();
    await syncToBackend();
    setEntries(newEntries);
    setCurtainEntries(newEntries);
  };

  // Actualizar stock de materiales según BOM del finished good guardado
  const updateMaterialsStockFromFG = async (fgObject) => {
    if (!fgObject || !fgObject.bom) return;
    const matsKeyCandidates = ['materialsBOM', 'materials'];
    const storedMaterials = getStorage('materialsBOM') || getStorage('materials') || [];
    const updatedMaterials = Array.isArray(storedMaterials) ? storedMaterials.map(m => ({ ...m })) : [];

    for (let i = 1; i <= 16; i++) {
      const matIdKey = `matId${i}`;
      const qtyKey = `cantidad${i}`;
      // support both shaped BOM (array) and indexed props
      const bomEntry = Array.isArray(fgObject.bom) ? fgObject.bom.find(b => b.materialId === fgObject.bom[i - 1]?.materialId) : null;

      const matId = (fgObject[matIdKey] || (bomEntry && bomEntry.materialId) || '').toString();
      const qty = parseFloat(fgObject[qtyKey] || (bomEntry && bomEntry.quantity) || 0) || 0;

      if (matId && qty > 0) {
        const idx = updatedMaterials.findIndex((m) => (m.materialId || m.id || m.ID) === matId);
        if (idx >= 0) {
          updatedMaterials[idx].stock = Math.max(0, (Number(updatedMaterials[idx].stock) || 0) - qty);
        }
      }
    }

    // Guardar cambios y sincronizar
    setStorage('materialsBOM', updatedMaterials);
    setStorage('materials', updatedMaterials); // mantener compatibilidad
    await syncToBackend();
    await syncToBackend();
    setAvailableMaterials(updatedMaterials);
  };

  // Manejo de selección de finished good desde la lista filtrada
  const handleSelectedFinishedGood = (fg) => {
    setSelectedFinishedGood(fg);
    setSearchTermFG(fg.finishedGood || fg.name || '');
  };

  // Guardar una linea (Add Line)
  const handleAddLineAndContinue = async () => {
    if (!selectedInvoice) {
      showMessage('Selecciona o captura la invoice antes de agregar la línea.', 4000);
      return;
    }
    if (!selectedFinishedGood) {
      showMessage('Selecciona un Finished Good válido.', 4000);
      return;
    }

    const newEntry = createEntry();
    const newEntries = [...entries, newEntry];

    await persistEntries(newEntries);
    await updateMaterialsStockFromFG(selectedFinishedGood);

    // avanzar línea y limpiar teclado/selecciones parciales
    setLineNumber((n) => n + 1);
    setSelectedFinishedGood(null);
    setSearchTermFG('');
    setSelectedObservation('');
    setShipmentDate('');
    showMessage(`Línea ${newEntry.lineNumber} guardada con éxito para invoice ${selectedInvoice}`, 3000);
  };

  // Guardar orden completa (persistir, mensaje final)
  const handleSaveOrder = async () => {
    if (!selectedInvoice) {
      showMessage('Captura la invoice antes de guardar la orden.', 4000);
      return;
    }
    // Aquí ya están las entradas en storage por persistEntries al agregar líneas
    showMessage('Orden guardada correctamente.', 3000);
  };

  // Eliminar una entrada (por line)
  const handleRemoveEntry = async (lineToRemove) => {
    const updated = entries.filter((e) => e.lineNumber !== lineToRemove);
    // reindexar líneas si se desea mantener secuencia
    const reindexed = updated.map((e, idx) => ({ ...e, lineNumber: idx + 1 }));
    await persistEntries(reindexed);
    setLineNumber(reindexed.length + 1);
    showMessage(`Línea ${lineToRemove} eliminada.`, 3000);
  };

  // Cuando se cambia invoice escaneada / capturada, intentar extraer número
  const handleScanInvoice = (val) => {
    setScanInvoice(val);
    // ejemplo: extraer patrón numérico largo
    const match = (val || '').match(/(\d{6,})/);
    if (match) setSelectedInvoice(match[1]);
  };

  // Render
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Captura de Envíos Fedex</h2>

      {message && <div className="mb-4 text-center text-green-700">{message}</div>}

      {/* Invoice (automático / escaneo) */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Invoice (Automático)</label>
        <input
          type="text"
          readOnly
          className="w-full px-3 py-2 border rounded bg-gray-100"
          value={selectedInvoice}
        />
      </div>

      {/* Scan invoice input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Scan Invoice / texto</label>
        <input
          type="text"
          value={scanInvoice}
          onChange={(e) => handleScanInvoice(e.target.value)}
          placeholder="Ej. 12345678 5.3263TM (1 of 1)"
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* Fecha de envío para el corte */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Fecha de Envío para el Corte</label>
        <input
          type="date"
          className="w-full px-3 py-2 border rounded"
          value={shipmentDate}
          onChange={(e) => setShipmentDate(e.target.value)}
          onClick={() => setShippingDateForCut(true)}
        />
      </div>

      {/* Buscar Finished Good */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Buscar Finished Good</label>
        <input
          type="text"
          autoComplete="off"
          placeholder="Ej. escribe ATA para filtrar"
          value={searchTermFG}
          onChange={(e) => setSearchTermFG(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        <div className="max-h-48 overflow-y-auto mt-2 border rounded">
          {filteredFinishedGoods.length > 0 ? (
            filteredFinishedGoods.map((fg, idx) => (
              <div
                key={fg.finishedGood ? fg.finishedGood + idx : idx}
                onClick={() => handleSelectedFinishedGood(fg)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b"
              >
                {fg.finishedGood || fg.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No se encontraron Finished Goods</div>
          )}
        </div>
      </div>

      {/* Observación */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Observación</label>
        <select
          value={selectedObservation}
          onChange={(e) => setSelectedObservation(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Seleccione una opción</option>
          {observationsList.map((obs, idx) => {
            // soporta both objetos {id, text} y strings
            const val = obs && typeof obs === 'object' ? (obs.text || obs.value || '') : obs;
            const key = obs && typeof obs === 'object' ? (obs.id || idx) : idx;
            return (
              <option key={key} value={val}>
                {val}
              </option>
            );
          })}
        </select>
      </div>

      {/* Comentarios adicionales */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Comentarios Adicionales</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded"
          onChange={(e) => {}}
          placeholder="Comentarios opcionales"
        />
      </div>

      {/* Botones principales */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAddLineAndContinue}
          className="flex-1 bg-black text-white py-2 rounded hover:opacity-90"
        >
          Añadir Linea
        </button>
        <button
          onClick={handleSaveOrder}
          className="flex-1 bg-green-600 text-white py-2 rounded hover:opacity-90"
        >
          Guardar Orden
        </button>
      </div>

      {/* Tabla de líneas capturadas */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Líneas capturadas</h3>
        {curtainEntries.length > 0 ? (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="py-2 px-3 border-b">Orden</th>
                <th className="py-2 px-3 border-b">Línea</th>
                <th className="py-2 px-3 border-b">Finished Good</th>
                <th className="py-2 px-3 border-b">Observación</th>
                <th className="py-2 px-3 border-b">Track</th>
                <th className="py-2 px-3 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {curtainEntries.map((entry) => (
                <tr key={entry.lineNumber}>
                  <td className="py-2 px-3 border-b">{entry.order}</td>
                  <td className="py-2 px-3 border-b">{entry.lineNumber}</td>
                  <td className="py-2 px-3 border-b">{entry.finishedGood}</td>
                  <td className="py-2 px-3 border-b">{entry.observation}</td>
                  <td className="py-2 px-3 border-b">{entry.trackingNumber}</td>
                  <td className="py-2 px-3 border-b">
                    <button
                      onClick={() => handleRemoveEntry(entry.lineNumber)}
                      className="text-sm px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500 py-6">No hay líneas capturadas aún.</div>
        )}
      </div>
    </div>
  );
};

export default FedexShippingCaptureForm;