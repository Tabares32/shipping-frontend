import React, { useState, useEffect, useRef } from 'react';
import { getStorage, setStorage, syncToBackend } from '../utils/storage';
import { mockFinishedGoods } from '../mock/finishedGoods';
import { mockObservations } from '../mock/observations';

const FedexShippingCaptureForm = () => {
  const [finishedGoodsList, setFinishedGoodsList] = useState([]);
  const [observationsList, setObservationsList] = useState([]);

  // Form state
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [scanInvoice, setScanInvoice] = useState('');
  const [shipmentDate, setShipmentDate] = useState(''); // persistente
  const [comments, setComments] = useState('');

  const [searchTermFG, setSearchTermFG] = useState('');
  const [selectedFinishedGood, setSelectedFinishedGood] = useState(null);
  const [showFGDropdown, setShowFGDropdown] = useState(false);

  const [selectedObservation, setSelectedObservation] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [lineNumber, setLineNumber] = useState(1);
  const [entries, setEntries] = useState([]); // guarda en 'fedexOrders'
  const [message, setMessage] = useState('');

  const fgInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fgs = getStorage('finished_goods') || mockFinishedGoods || [];
    const obs = getStorage('observations') || getStorage('observations') || mockObservations;
    const savedEntries = getStorage('fedexOrders') || [];
    const savedShipmentDate = getStorage('fedexShipmentDate') || getStorage('shipmentDate') || '';

    setFinishedGoodsList(Array.isArray(fgs) ? fgs : []);
    setObservationsList(Array.isArray(obs) ? obs : []);
    setEntries(Array.isArray(savedEntries) ? savedEntries : []);
    setLineNumber((Array.isArray(savedEntries) ? savedEntries.length : 0) + 1);
    if (savedShipmentDate) setShipmentDate(savedShipmentDate);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        fgInputRef.current &&
        !fgInputRef.current.contains(e.target)
      ) {
        setShowFGDropdown(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  const showMessage = (txt, timeout = 3000) => {
    setMessage(txt);
    if (timeout > 0) setTimeout(() => setMessage(''), timeout);
  };

  const filteredFinishedGoods = finishedGoodsList.filter((fg) => {
    if (!searchTermFG) return false;
    const target = (fg.finishedGood || fg.name || '').toString().toLowerCase();
    return target.includes(searchTermFG.toLowerCase());
  });

  const extractInvoiceWithU = (raw) => {
    if (!raw) return '';
    const match = raw.match(/(\d+U?)/);
    if (match && match[1]) {
      const inv = match[1];
      return inv.endsWith('U') ? inv : `${inv}U`;
    }
    return '';
  };

  const handleScanInvoice = (val) => {
    setScanInvoice(val);
    const inv = extractInvoiceWithU(val);
    setSelectedInvoice(inv);
  };

  const handleFGInputChange = (val) => {
    setSearchTermFG(val);
    setShowFGDropdown(Boolean(val && filteredFinishedGoods.length > 0));
    setSelectedFinishedGood(null);
  };

  const handleSelectFG = (fg) => {
    setSelectedFinishedGood(fg);
    setSearchTermFG(fg.finishedGood || fg.name);
    setShowFGDropdown(false);
  };

  // Persist shipmentDate to localStorage when changed so it stays fixed for the tanda
  const handleShipmentDateChange = (val) => {
    setShipmentDate(val);
    if (val) setStorage('fedexShipmentDate', val);
    else setStorage('fedexShipmentDate', '');
  };

  const createEntry = () => ({
    rawScanText: scanInvoice || '',
    invoice: selectedInvoice || '',
    order: selectedInvoice ? selectedInvoice.replace(/U$/, '') : '',
    lineNumber,
    finishedGood: selectedFinishedGood ? (selectedFinishedGood.finishedGood || selectedFinishedGood.name) : '',
    finishedGoodObject: selectedFinishedGood || null,
    observation: selectedObservation || '',
    trackingNumber: trackingNumber || '',
    comments: comments || '',
    shippingDate: shipmentDate || '',
    captureTime: new Date().toISOString(),
  });

  const persistEntries = async (newEntries) => {
    setStorage('fedexOrders', newEntries);
    try {
      await syncToBackend();
    } catch (err) {
      console.warn('Error sincronizando fedexOrders:', err);
    }
    setEntries(newEntries);
  };

  const handleAddLineAndContinue = async () => {
    if (!selectedInvoice) {
      showMessage('Selecciona o captura la invoice antes de agregar la línea.', 3500);
      return;
    }
    if (!selectedFinishedGood) {
      showMessage('Selecciona un Finished Good válido.', 3500);
      return;
    }

    const newEntry = createEntry();
    const newEntries = [...entries, newEntry];
    await persistEntries(newEntries);

    // Incrementar línea y limpiar solo FG y scan-invoice fields
    setLineNumber((n) => n + 1);
    setSelectedFinishedGood(null);
    setSearchTermFG('');
    setScanInvoice(''); // limpia texto escaneado pero conservamos shipmentDate, tracking, obs, comments
    setSelectedInvoice('');
    showMessage(`Línea ${newEntry.lineNumber} guardada con éxito.`, 3000);
  };

  // Guardar orden (no limpia shipmentDate). Recarga desde storage para evitar desincronía UI.
  const handleSaveOrder = async () => {
    let newEntries = entries.slice();

    if (selectedInvoice && selectedFinishedGood) {
      const singleEntry = createEntry();
      newEntries = [...newEntries, singleEntry];
      await persistEntries(newEntries);
      showMessage('Orden de 1 línea guardada correctamente.', 3000);
    } else if (entries.length === 1) {
      showMessage('Orden guardada correctamente.', 3000);
    } else if (entries.length > 1) {
      showMessage('La orden contiene varias líneas; ya están guardadas.', 3000);
    } else {
      showMessage('No hay datos para guardar.', 3000);
      return;
    }

    // Recargar desde localStorage para reflejar en UI inmediatamente
    const refreshed = getStorage('fedexOrders') || [];
    setEntries(Array.isArray(refreshed) ? refreshed : []);
    setLineNumber((Array.isArray(refreshed) ? refreshed.length : 0) + 1);

    // Limpiar formulario pero conservar shipmentDate
    setSelectedInvoice('');
    setScanInvoice('');
    setSelectedFinishedGood(null);
    setSearchTermFG('');
    setSelectedObservation('');
    setTrackingNumber('');
    setComments('');
    // NOTA: NO limpiar shipmentDate; permanece fijada hasta que el usuario la cambie
  };

  const handleRemoveEntry = async (lineToRemove) => {
    const updated = entries.filter((e) => e.lineNumber !== lineToRemove);
    const reindexed = updated.map((e, idx) => ({ ...e, lineNumber: idx + 1 }));
    await persistEntries(reindexed);
    setLineNumber(reindexed.length + 1);
    showMessage(`Línea ${lineToRemove} eliminada.`, 3000);
  };

  const getObservationText = (obsVal) => {
    if (!obsVal) return '';
    if (!Array.isArray(observationsList) || observationsList.length === 0) return obsVal;
    const found = observationsList.find((o) => {
      if (o == null) return false;
      if (typeof o === 'string') return o === obsVal;
      const candidates = [o.id, o.value, o.text, o.label];
      return candidates.some((c) => c !== undefined && String(c) === String(obsVal));
    });
    if (found) {
      return typeof found === 'string' ? found : (found.text || found.label || found.value || found.id || obsVal);
    }
    return obsVal;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-10 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-center">Captura de Envíos Fedex</h2>

      {message && <div className="mb-4 text-center text-green-700">{message}</div>}

      {/* Fecha de envío para el corte en parte superior */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-1">Fecha de Envío para el Corte</label>
        <input
          type="date"
          className="w-64 px-3 py-2 border rounded"
          value={shipmentDate}
          onChange={(e) => handleShipmentDateChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold mb-1">Invoice (Automático)</label>
          <input type="text" readOnly className="w-full px-3 py-2 border rounded bg-gray-100" value={selectedInvoice} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-1">Scan Invoice / texto</label>
          <input
            type="text"
            value={scanInvoice}
            onChange={(e) => handleScanInvoice(e.target.value)}
            placeholder="Ej. 693857U,S-2423TMB (1 of 1),Leatherette - Quilted..."
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Autocomplete Finished Good */}
      <div className="mb-4 relative">
        <label className="block text-sm font-semibold mb-1">Buscar Finished Good</label>
        <input
          ref={fgInputRef}
          type="text"
          autoComplete="off"
          placeholder="Ej. escribe ATA para filtrar"
          value={searchTermFG}
          onChange={(e) => handleFGInputChange(e.target.value)}
          onFocus={() => setShowFGDropdown(Boolean(searchTermFG && filteredFinishedGoods.length > 0))}
          className="w-full px-3 py-2 border rounded"
        />

        {showFGDropdown && filteredFinishedGoods.length > 0 && (
          <ul
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded max-h-48 overflow-auto z-50 shadow"
          >
            {filteredFinishedGoods.map((fg, idx) => (
              <li
                key={fg.finishedGood ? fg.finishedGood + idx : idx}
                onClick={() => handleSelectFG(fg)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {fg.finishedGood || fg.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Observación</label>
          <select
            value={selectedObservation}
            onChange={(e) => setSelectedObservation(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Seleccione una opción</option>
            {observationsList.map((obs, idx) => {
              const val = obs && typeof obs === 'object' ? (obs.value || obs.id || obs.text || obs.label || '') : obs;
              const label = obs && typeof obs === 'object' ? (obs.text || obs.label || obs.value || obs.id || '') : obs;
              const key = obs && typeof obs === 'object' ? (obs.id || idx) : idx;
              return (
                <option key={key} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Tracking Number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ej. 123456789012"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Comentarios Adicionales</label>
          <input
            type="text"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Comentarios opcionales"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={handleAddLineAndContinue} className="flex-1 bg-black text-white py-2 rounded hover:opacity-90">
          Añadir Linea
        </button>
        <button onClick={handleSaveOrder} className="flex-1 bg-green-600 text-white py-2 rounded hover:opacity-90">
          Guardar Orden
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Líneas capturadas</h3>
        {entries.length > 0 ? (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="py-2 px-3 border-b">Scan Invoice Text</th>
                <th className="py-2 px-3 border-b">Invoice</th>
                <th className="py-2 px-3 border-b">Línea</th>
                <th className="py-2 px-3 border-b">Finished Good</th>
                <th className="py-2 px-3 border-b">Observación</th>
                <th className="py-2 px-3 border-b">Tracking</th>
                <th className="py-2 px-3 border-b">Comentarios</th>
                <th className="py-2 px-3 border-b">Fecha Corte</th>
                <th className="py-2 px-3 border-b">Fecha y Hora Captura</th>
                <th className="py-2 px-3 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.lineNumber}>
                  <td className="py-2 px-3 border-b">{entry.rawScanText || '—'}</td>
                  <td className="py-2 px-3 border-b">{entry.invoice || '—'}</td>
                  <td className="py-2 px-3 border-b">{entry.lineNumber}</td>
                  <td className="py-2 px-3 border-b">{entry.finishedGood}</td>
                  <td className="py-2 px-3 border-b">{getObservationText(entry.observation)}</td>
                  <td className="py-2 px-3 border-b">{entry.trackingNumber || '—'}</td>
                  <td className="py-2 px-3 border-b">{entry.comments || '—'}</td>
                  <td className="py-2 px-3 border-b">{entry.shippingDate || '—'}</td>
                  <td className="py-2 px-3 border-b">{entry.captureTime ? new Date(entry.captureTime).toLocaleString() : '—'}</td>
                  <td className="py-2 px-3 border-b">
                    <button onClick={() => handleRemoveEntry(entry.lineNumber)} className="text-sm px-2 py-1 bg-red-500 text-white rounded">
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