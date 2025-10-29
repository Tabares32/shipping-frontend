import React, { useState, useEffect } from 'react';
import { getStorage, setStorage, syncToBackend } from '../utils/storage';
import { mockFinishedGoods } from '../mock/finishedGoods';
import { mockRetainedOrderStatuses } from '../mock/retainedOrderStatuses';

const RetainedOrders = () => {
  const [retainedOrders, setRetainedOrders] = useState([]);
  const [invoice, setInvoice] = useState('');
  const [lineCount, setLineCount] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [status, setStatus] = useState('Retenida');
  const [selectedFinishedGood, setSelectedFinishedGood] = useState('');
  const [dateRetained, setDateRetained] = useState('');
  const [dateSent, setDateSent] = useState('');
  const [message, setMessage] = useState('');
  const [availableFinishedGoods, setAvailableFinishedGoods] = useState([]);
  const [searchTermFG, setSearchTermFG] = useState('');

  // Estados para eliminar con confirmación
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para marcar como enviado (miniventana)
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedRetention, setSelectedRetention] = useState(null);
  const [shippingDate, setShippingDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    const storedOrders = getStorage('retainedOrders') || [];
    setRetainedOrders(Array.isArray(storedOrders) ? storedOrders : []);
    setAvailableFinishedGoods(getStorage('finished_goods') || mockFinishedGoods);
  }, []);

  const clearMessageLater = (timeout = 3500) => {
    setTimeout(() => setMessage(''), timeout);
  };

  const handleAddOrder = async () => {
    if (!invoice || !lineCount || !selectedFinishedGood || !dateRetained) {
      setMessage('¡Faltan campos obligatorios para la orden retenida!');
      clearMessageLater();
      return;
    }

    const newOrder = {
      id: Date.now(),
      invoice,
      lineCount: parseInt(lineCount, 10),
      destination,
      weight: weight !== '' ? parseFloat(weight) : null,
      dimensions,
      status,
      finishedGood: selectedFinishedGood,
      dateRetained,
      dateSent: status === 'Enviado' ? dateSent : '',
    };

    const updatedOrders = [...retainedOrders, newOrder];
    setStorage('retainedOrders', updatedOrders);
    setRetainedOrders(updatedOrders);
    try {
      await syncToBackend();
    } catch (err) {
      console.warn('Error sincronizando retainedOrders:', err);
    }

    setMessage('¡Orden retenida agregada con éxito!');
    setInvoice('');
    setLineCount('');
    setDestination('');
    setWeight('');
    setDimensions('');
    setStatus('Retenida');
    setSelectedFinishedGood('');
    setDateRetained('');
    setDateSent('');
    setSearchTermFG('');
    clearMessageLater();
  };

  const handleSelectFinishedGood = (fgName) => {
    setSelectedFinishedGood(fgName);
    setSearchTermFG(fgName);
  };

  const filteredFinishedGoods = availableFinishedGoods.filter((fg) =>
    fg.finishedGood.toLowerCase().includes(searchTermFG.toLowerCase())
  );

  // Eliminar con confirmación
  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRecord = async () => {
    const updated = retainedOrders.filter((r) => r.id !== recordToDelete);
    setStorage('retainedOrders', updated);
    setRetainedOrders(updated);
    try {
      await syncToBackend();
    } catch (err) {
      console.warn('Error sincronizando retainedOrders después de eliminar:', err);
    }
    setMessage('Registro eliminado correctamente.');
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
    clearMessageLater();
  };

  // Marcar como enviado: abrir modal
  const handleMarkAsSentClick = (order) => {
    setSelectedRetention(order);
    setShippingDate('');
    setTrackingNumber('');
    setShowSendModal(true);
  };

  // Confirmar envío: crear entrada en fedexOrders y actualizar retainedOrders
  const handleConfirmSend = async () => {
    if (!selectedRetention) return;
    if (!shippingDate || !trackingNumber) {
      setMessage('Por favor completa fecha de corte y tracking antes de confirmar.');
      clearMessageLater();
      return;
    }

    // Crear entrada FedEx
    const fedexOrders = getStorage('fedexOrders') || [];
    const newFedexEntry = {
      rawScanText: `${selectedRetention.invoice} Retained`,
      invoice: selectedRetention.invoice,
      order: selectedRetention.invoice ? selectedRetention.invoice.replace(/U$/, '') : '',
      lineNumber: selectedRetention.lineCount,
      finishedGood: selectedRetention.finishedGood,
      finishedGoodObject: null,
      observation: '',
      trackingNumber: trackingNumber,
      comments: `Movida desde RetainedOrders id:${selectedRetention.id}`,
      shippingDate,
      captureTime: new Date().toISOString(),
    };

    const updatedFedex = [...(Array.isArray(fedexOrders) ? fedexOrders : []), newFedexEntry];
    setStorage('fedexOrders', updatedFedex);

    // Actualizar retainedOrders: marcar enviado y setear fecha de envío
    const updatedRetained = (getStorage('retainedOrders') || []).map((r) =>
      r.id === selectedRetention.id ? { ...r, status: 'Enviado', dateSent: shippingDate } : r
    );
    setStorage('retainedOrders', updatedRetained);
    setRetainedOrders(updatedRetained);

    try {
      await syncToBackend();
    } catch (err) {
      console.warn('Error sincronizando fedexOrders/retainedOrders:', err);
    }

    setMessage(`Orden ${selectedRetention.invoice} marcada como Enviado y agregada a FedEx.`);
    setShowSendModal(false);
    setSelectedRetention(null);
    setShippingDate('');
    setTrackingNumber('');
    clearMessageLater();
  };

  // Enviar resumen por correo (mailto con Gmail)
  const handleSendEmail = () => {
    const retained = getStorage('retainedOrders') || [];
    if (!Array.isArray(retained) || retained.length === 0) {
      setMessage('No hay órdenes retenidas para enviar por correo.');
      clearMessageLater();
      return;
    }

    const bodyLines = retained.map((r) => {
      const statusText = r.status || 'Retenida';
      return `Invoice: ${r.invoice}, Lines: ${r.lineCount}, FG: ${r.finishedGood}, Status: ${statusText}, Fecha Retenida: ${r.dateRetained}, Fecha Enviado: ${r.dateSent || 'N/A'}`;
    });

    const body = bodyLines.join('\n');
    const mailtoLink = `mailto:tu-correo@gmail.com?subject=${encodeURIComponent('Órdenes Retenidas')}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gestión de Órdenes Retenidas</h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="mb-4 flex gap-3 justify-end">
        <button
          onClick={handleSendEmail}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Enviar órdenes por correo
        </button>
      </div>

      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Agregar Nueva Orden Retenida</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Invoice</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Línea(s)</label>
            <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition" value={lineCount} onChange={(e) => setLineCount(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Destino</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ej. Canada, South African" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Peso</label>
            <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Dimensiones</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="Ej. 10x12x8" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Fecha Retenida</label>
            <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition" value={dateRetained} onChange={(e) => setDateRetained(e.target.value)} />
          </div>

          <div className="md:col-span-3">
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
        </div>
        <button
          onClick={handleAddOrder}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-md font-semibold shadow-md"
        >
          Agregar Orden Retenida
        </button>
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">Órdenes Retenidas Existentes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Invoice</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Líneas</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Destino</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Finished Good</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Peso</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Dimensiones</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Fecha Retenida</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Fecha Enviado</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Status</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {retainedOrders.length > 0 ? (
              retainedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 text-gray-800">{order.invoice}</td>
                  <td className="py-3 px-4 text-gray-800">{order.lineCount}</td>
                  <td className="py-3 px-4 text-gray-800">{order.destination}</td>
                  <td className="py-3 px-4 text-gray-800">{order.finishedGood}</td>
                  <td className="py-3 px-4 text-gray-800">{order.weight ?? '—'}</td>
                  <td className="py-3 px-4 text-gray-800">{order.dimensions}</td>
                  <td className="py-3 px-4 text-gray-800">{order.dateRetained}</td>
                  <td className="py-3 px-4 text-gray-800">{order.dateSent || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">
                    <select
                      value={order.status}
                      onChange={(e) => {
                        // Abrir modal de confirmación de envío si se selecciona Enviado
                        if (e.target.value === 'Enviado') {
                          handleMarkAsSentClick(order);
                        } else {
                          const updated = retainedOrders.map((r) => (r.id === order.id ? { ...r, status: e.target.value } : r));
                          setStorage('retainedOrders', updated);
                          setRetainedOrders(updated);
                          syncToBackend().catch((err) => console.warn('Error sincronizando retainedOrders:', err));
                        }
                      }}
                      className="w-full bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
                    >
                      {mockRetainedOrderStatuses.map((statusOption, idx) => (
                        <option key={idx} value={statusOption}>{statusOption}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    {order.status !== 'Enviado' && (
                      <button
                        onClick={() => handleMarkAsSentClick(order)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors duration-300 text-sm"
                      >
                        Marcar Enviado
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(order.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-300 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="py-4 text-center text-gray-500">No hay órdenes retenidas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para marcar como enviado (fecha de corte + tracking) */}
      {showSendModal && selectedRetention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Completar envío FedEx</h3>
            <label className="block text-sm font-semibold mb-2">Fecha de corte</label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <label className="block text-sm font-semibold mb-2">Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="Ej. 123456789012"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSelectedRetention(null);
                  setShippingDate('');
                  setTrackingNumber('');
                }}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancelar
              </button>
              <button onClick={handleConfirmSend} className="px-4 py-2 bg-green-600 text-white rounded-lg">Confirmar Envío</button>
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
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">No</button>
              <button onClick={confirmDeleteRecord} className="px-4 py-2 bg-red-600 text-white rounded-lg">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetainedOrders;