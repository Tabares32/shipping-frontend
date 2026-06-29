import React, { useState, useEffect, useCallback } from 'react';
import { finishedGoodsApi, materialBomApi, canEdit } from '../utils/storage';

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  'https://shipping-backend-kgm5.onrender.com';

function getToken() { return localStorage.getItem('authToken'); }

const emptyBOM = () =>
  Array.from({ length: 16 }, () => ({ materialId: '', name: '', quantity: 0 }));

const FinishedGoodManagement = () => {
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [materials,     setMaterials]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cleaning,      setCleaning]      = useState(false);
  const [message,       setMessage]       = useState({ text: '', type: '' });
  const [search,        setSearch]        = useState('');
  const [delTarget,     setDelTarget]     = useState(null);

  // Formulario
  const [fgName,    setFgName]    = useState('');
  const [fgType,    setFgType]    = useState('');
  const [fgVehicle, setFgVehicle] = useState('');
  const [bom,       setBom]       = useState(emptyBOM());

  const editable = canEdit();

  const showMsg = (text, type = 'success', ms = 5000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), ms);
  };

  // ── Cargar desde MongoDB ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fgs, mats] = await Promise.all([
        finishedGoodsApi.list().catch(() => []),
        materialBomApi.list().catch(() => []),
      ]);
      setFinishedGoods(Array.isArray(fgs)  ? fgs  : []);
      setMaterials(Array.isArray(mats) ? mats : []);
    } catch (err) {
      console.error(err);
      showMsg('Error al cargar datos del servidor.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── BOM ──────────────────────────────────────────────────────────────────────
  const handleBomChange = (index, field, value) => {
    const updated = bom.slice();
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    if (field === 'materialId' && value) {
      const mat = materials.find(m => (m.materialId || m.id) === value);
      updated[index].name = mat ? (mat.name || '') : '';
    }
    setBom(updated);
  };

  // ── Agregar ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!editable) { showMsg('No tienes permisos de edición.', 'error'); return; }
    const filteredBOM = bom.filter(b => b.materialId && Number(b.quantity) > 0);
    if (!fgName.trim() || !fgType || !fgVehicle || filteredBOM.length === 0) {
      showMsg('Completa todos los campos y agrega al menos un material al BOM.', 'error');
      return;
    }
    const record = {
      id:           `fg_${Date.now()}`,
      finishedGood: fgName.trim(),
      type:         fgType,
      vehicleType:  fgVehicle,
      bom:          filteredBOM.map(b => ({
        materialId: b.materialId,
        name:       b.name || '',
        quantity:   Number(b.quantity),
      })),
      createdAt: new Date().toISOString(),
    };
    try {
      await finishedGoodsApi.create(record);
      showMsg(`✅ "${fgName}" agregado con éxito`);
      setFgName(''); setFgType(''); setFgVehicle(''); setBom(emptyBOM());
      await loadData();
    } catch (err) {
      console.error(err);
      showMsg('Error al guardar en el servidor.', 'error');
    }
  };

  // ── Eliminar individual ───────────────────────────────────────────────────────
  // Usa _id de Mongo primero (más confiable), luego id, luego finishedGood como fallback
  const confirmDelete = async () => {
    if (!delTarget) return;
    // Prioridad: _id de Mongo > campo id > nombre finishedGood
    const mongoId = delTarget._id || delTarget.id || delTarget.finishedGood;
    try {
      const res = await fetch(`${BACKEND}/api/finished_goods/${encodeURIComponent(mongoId)}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg(data.detail || 'Error al eliminar.', 'error');
        setDelTarget(null);
        return;
      }
      showMsg(
        data.deleted_count > 0
          ? `🗑️ "${delTarget.finishedGood}" eliminado correctamente`
          : `⚠️ No se encontró el registro en la base de datos. Recarga la página.`,
        data.deleted_count > 0 ? 'success' : 'error'
      );
      setDelTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showMsg('Error de conexión al eliminar.', 'error');
      setDelTarget(null);
    }
  };

  // ── Limpiar TODOS los duplicados de MongoDB ───────────────────────────────────
  const handleCleanDuplicates = async () => {
    if (!editable) return;
    if (!window.confirm(
      `¿Limpiar ${duplicateCount} duplicados de Finished Goods en MongoDB?\n\n` +
      `Se conservará el PRIMER registro de cada nombre y se borrarán los demás.\n` +
      `Esta acción no se puede deshacer.`
    )) return;

    setCleaning(true);
    try {
      const res = await fetch(`${BACKEND}/api/finished_goods/cleanup/duplicates`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg(data.detail || 'Error al limpiar duplicados.', 'error');
        return;
      }
      showMsg(
        `✅ Limpieza completa: ${data.deleted_count} duplicados eliminados. ` +
        `Quedan ${data.remaining} registros únicos.`,
        'success', 7000
      );
      await loadData();
    } catch (err) {
      console.error(err);
      showMsg('Error de conexión al limpiar duplicados.', 'error');
    } finally {
      setCleaning(false);
    }
  };

  // ── Filtro y detección de duplicados ─────────────────────────────────────────
  const nameCounts = {};
  finishedGoods.forEach(fg => {
    const k = (fg.finishedGood || '').toLowerCase();
    nameCounts[k] = (nameCounts[k] || 0) + 1;
  });
  const hasDuplicates  = Object.values(nameCounts).some(c => c > 1);
  const duplicateCount = Object.values(nameCounts).reduce((s, c) => s + (c > 1 ? c - 1 : 0), 0);

  const filtered = finishedGoods.filter(fg => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (fg.finishedGood || '').toLowerCase().includes(q) ||
      (fg.type || '').toLowerCase().includes(q) ||
      (fg.vehicleType || '').toLowerCase().includes(q)
    );
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Finished Goods</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>

          {editable && hasDuplicates && (
            <button onClick={handleCleanDuplicates} disabled={cleaning}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                cleaning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              {cleaning ? 'Limpiando…' : `Limpiar ${duplicateCount} duplicados de MongoDB`}
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-sm text-center mb-5">
        {finishedGoods.length} registros en MongoDB
        {hasDuplicates && (
          <span className="ml-2 text-orange-500 font-semibold">
            · ⚠️ {duplicateCount} duplicados detectados — usa el botón naranja para limpiarlos
          </span>
        )}
      </p>

      {/* Mensajes */}
      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium text-center ${
          message.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulario agregar */}
      {editable ? (
        <div className="mb-8 p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">➕ Agregar Nuevo Finished Good</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Nombre *</label>
              <input type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                value={fgName} onChange={e => setFgName(e.target.value)}
                placeholder="Ej. SEAT-CAN-FAM-MX" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Tipo *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                value={fgType} onChange={e => setFgType(e.target.value)}>
                <option value="">Selecciona</option>
                <option value="Front">Front</option>
                <option value="Rear">Rear</option>
                <option value="Remake">Remake</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Vehículo *</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                value={fgVehicle} onChange={e => setFgVehicle(e.target.value)}>
                <option value="">Selecciona</option>
                <option value="Pickup">Pickup</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Partes">Partes</option>
              </select>
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
            Bill of Materials — hasta 16 materiales
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {bom.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  value={item.materialId}
                  onChange={e => handleBomChange(i, 'materialId', e.target.value)}>
                  <option value="">Material {i + 1}</option>
                  {materials.map(m => (
                    <option key={m.materialId || m.id} value={m.materialId || m.id}>
                      {m.materialId || m.id} — {m.name} (Stock: {m.stock || 0})
                    </option>
                  ))}
                </select>
                <input type="number" min="0" step="1"
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-black"
                  value={item.quantity}
                  onChange={e => handleBomChange(i, 'quantity', e.target.value)}
                  placeholder="Cant" />
              </div>
            ))}
          </div>

          <button onClick={handleAdd}
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-semibold">
            Agregar Finished Good
          </button>
        </div>
      ) : (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 text-center">
          Solo lectura — necesitas rol <strong>editor</strong> o <strong>admin</strong> para modificar.
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-700">
          Finished Goods existentes
        </h3>
        <input type="text" placeholder="Buscar por nombre, tipo o vehículo…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black" />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-gray-900 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Cargando desde MongoDB…</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Finished Good</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Tipo</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Vehículo</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">BOM</th>
                {editable && <th className="py-3 px-4 text-left font-semibold text-gray-600">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((fg, idx) => {
                const isDup = nameCounts[(fg.finishedGood || '').toLowerCase()] > 1;
                return (
                  <tr key={fg._id || fg.id || idx}
                    className={`border-b transition-colors ${isDup ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}`}>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {fg.finishedGood}
                      {isDup && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                          duplicado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{fg.type || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{fg.vehicleType || '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {fg.bom && fg.bom.length > 0 ? (
                        <ul className="space-y-0.5">
                          {fg.bom.slice(0, 3).map((m, j) => (
                            <li key={j}>• <strong>{m.materialId}</strong> ×{m.quantity}</li>
                          ))}
                          {fg.bom.length > 3 && (
                            <li className="text-gray-400">+{fg.bom.length - 3} más</li>
                          )}
                        </ul>
                      ) : '—'}
                    </td>
                    {editable && (
                      <td className="py-3 px-4">
                        <button onClick={() => setDelTarget(fg)}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 text-xs font-semibold transition-colors">
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={editable ? 5 : 4} className="py-8 text-center text-gray-400">
                    {search ? 'Sin resultados para tu búsqueda.' : 'No hay Finished Goods registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {delTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-800 mb-1">¿Eliminar este Finished Good?</p>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{delTarget.finishedGood}</strong>
            </p>
            <p className="text-xs text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDelTarget(null)}
                className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishedGoodManagement;
