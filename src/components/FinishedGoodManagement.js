import React, { useState, useEffect, useCallback } from 'react';
import { finishedGoodsApi, materialBomApi, canEdit } from '../utils/storage';

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  'https://shipping-backend-kgm5.onrender.com';

function getToken() { return localStorage.getItem('authToken'); }

const emptyBOM = () =>
  Array.from({ length: 16 }, (_, i) => ({ slot: i + 1, materialId: '', name: '', quantity: '' }));

const FinishedGoodManagement = () => {
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [materials,     setMaterials]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [cleaning,      setCleaning]      = useState(false);
  const [message,       setMessage]       = useState({ text: '', type: '' });
  const [search,        setSearch]        = useState('');
  const [delTarget,     setDelTarget]     = useState(null);
  const [expanded,      setExpanded]      = useState(null);

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
  const handleBomChange = (i, field, value) => {
    setBom(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: field === 'quantity' ? value : value };
      if (field === 'materialId' && value) {
        const mat = materials.find(m => (m.materialId || m.id) === value);
        updated.name = mat ? (mat.name || '') : '';
      }
      return updated;
    }));
  };

  // ── Agregar ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!editable) { showMsg('Sin permisos de edición.', 'error'); return; }
    const filteredBOM = bom.filter(b => b.materialId && Number(b.quantity) > 0);
    if (!fgName.trim()) { showMsg('Escribe el nombre del Finished Good.', 'error'); return; }
    if (!fgType)        { showMsg('Selecciona el Tipo.', 'error'); return; }
    if (!fgVehicle)     { showMsg('Selecciona el Tipo de Vehículo.', 'error'); return; }
    if (filteredBOM.length === 0) { showMsg('Agrega al menos un material con cantidad mayor a 0.', 'error'); return; }

    setSaving(true);
    const uid = `fg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = {
      id:           uid,
      finishedGood: fgName.trim(),
      type:         fgType,
      vehicleType:  fgVehicle,
      bom: filteredBOM.map(b => ({
        materialId: b.materialId,
        name:       b.name || '',
        quantity:   Number(b.quantity),
      })),
      createdAt: new Date().toISOString(),
    };
    try {
      await finishedGoodsApi.create(record);
      showMsg(`✅ "${fgName}" agregado correctamente`);
      setFgName(''); setFgType(''); setFgVehicle(''); setBom(emptyBOM());
      await loadData();
    } catch (err) {
      console.error(err);
      showMsg('Error al guardar en el servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!delTarget) return;
    // Prioridad: _id de Mongo > id del registro > nombre como fallback
    const id = delTarget._id || delTarget.id;
    if (!id) {
      showMsg('No se puede identificar el registro. Recarga la página.', 'error');
      setDelTarget(null);
      return;
    }
    try {
      const res  = await fetch(
        `${BACKEND}/api/finished_goods/${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json().catch(() => ({}));
      showMsg(
        data.deleted_count > 0
          ? `🗑️ "${delTarget.finishedGood}" eliminado correctamente`
          : '⚠️ No se encontró en MongoDB. Recarga la página.',
        data.deleted_count > 0 ? 'success' : 'error'
      );
      setDelTarget(null);
      await loadData();
    } catch (err) {
      showMsg('Error de conexión.', 'error');
      setDelTarget(null);
    }
  };

  // ── Limpiar duplicados ────────────────────────────────────────────────────────
  const handleCleanDuplicates = async () => {
    if (!editable) return;
    if (!window.confirm(
      `¿Limpiar ${duplicateCount} registros duplicados de Finished Goods en MongoDB?\n\n` +
      `IMPORTANTE: Se conservará el PRIMER registro de cada nombre.\n` +
      `Los registros únicos NO serán afectados.\n\n` +
      `Esta acción no se puede deshacer.`
    )) return;
    setCleaning(true);
    try {
      const res  = await fetch(`${BACKEND}/api/finished_goods/cleanup/duplicates`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg(data.detail || 'Error al limpiar duplicados.', 'error');
        return;
      }
      showMsg(
        `✅ ${data.deleted_count || 0} duplicados eliminados. Quedan ${data.remaining || 0} registros únicos.`,
        'success', 7000
      );
      await loadData();
    } catch (err) {
      showMsg('Error de conexión al limpiar.', 'error');
    } finally {
      setCleaning(false);
    }
  };

  // ── Duplicados ────────────────────────────────────────────────────────────────
  const nameCounts = {};
  finishedGoods.forEach(fg => {
    const k = (fg.finishedGood || '').trim().toLowerCase();
    if (k) nameCounts[k] = (nameCounts[k] || 0) + 1;
  });
  const hasDuplicates  = Object.values(nameCounts).some(c => c > 1);
  const duplicateCount = Object.values(nameCounts).reduce((s, c) => s + (c > 1 ? c - 1 : 0), 0);

  // ── Filtro ───────────────────────────────────────────────────────────────────
  const filtered = finishedGoods.filter(fg => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (fg.finishedGood || '').toLowerCase().includes(q) ||
      (fg.type || '').toLowerCase().includes(q) ||
      (fg.vehicleType || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>
            Gestión de Finished Goods
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            {finishedGoods.length} registros en MongoDB
            {hasDuplicates && (
              <span style={{ color: '#f97316', fontWeight: '600', marginLeft: '8px' }}>
                · ⚠️ {duplicateCount} duplicados detectados
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={loadData} style={btnStyle('gray')}>
            🔄 Actualizar
          </button>
          {editable && hasDuplicates && (
            <button onClick={handleCleanDuplicates} disabled={cleaning} style={btnStyle('orange')}>
              🗑️ {cleaning ? 'Limpiando…' : `Limpiar ${duplicateCount} duplicados`}
            </button>
          )}
        </div>
      </div>

      {/* ── Mensaje ── */}
      {message.text && (
        <div style={{
          padding: '10px 16px', borderRadius: '10px', fontSize: '13px',
          fontWeight: '500', marginBottom: '16px', textAlign: 'center',
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border:     `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color:      message.type === 'error' ? '#dc2626' : '#15803d',
        }}>
          {message.text}
        </div>
      )}

      {/* ── Formulario ── */}
      {editable ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', margin: '0 0 16px' }}>
            ➕ Agregar Nuevo Finished Good
          </h3>

          {/* Fila 1: Nombre / Tipo / Vehículo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input type="text" value={fgName} onChange={e => setFgName(e.target.value)}
                placeholder="Ej. SEAT-CAN-FAM-MX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select value={fgType} onChange={e => setFgType(e.target.value)} style={inputStyle}>
                <option value="">Selecciona</option>
                <option value="Front">Front</option>
                <option value="Rear">Rear</option>
                <option value="Remake">Remake</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vehículo *</label>
              <select value={fgVehicle} onChange={e => setFgVehicle(e.target.value)} style={inputStyle}>
                <option value="">Selecciona</option>
                <option value="Pickup">Pickup</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Partes">Partes</option>
              </select>
            </div>
          </div>

          {/* BOM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Bill of Materials — hasta 16 materiales
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Header BOM columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 70px', gap: '6px', marginBottom: '4px', paddingRight: '8px' }}>
            <span />
            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>MATERIAL</span>
            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textAlign: 'center' }}>CANT.</span>
          </div>

          {/* Grid de BOM — 2 columnas, cada una con [#] [select] [qty] */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: '16px' }}>
            {bom.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 64px', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#d1d5db', textAlign: 'right' }}>{i + 1}</span>
                <select
                  value={item.materialId}
                  onChange={e => handleBomChange(i, 'materialId', e.target.value)}
                  style={{ ...inputStyle, fontSize: '12px', padding: '5px 8px' }}>
                  <option value="">— sin material —</option>
                  {materials.map(m => (
                    <option key={m.materialId || m.id} value={m.materialId || m.id}>
                      {m.materialId || m.id} · {m.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number" min="0" step="1"
                  value={item.quantity}
                  onChange={e => handleBomChange(i, 'quantity', e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, fontSize: '12px', padding: '5px 6px', textAlign: 'center' }}
                />
              </div>
            ))}
          </div>

          <button onClick={handleAdd} disabled={saving} style={{
            width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
            background: saving ? '#9ca3af' : '#111', color: '#fff',
            fontWeight: '700', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Guardando…' : 'Agregar Finished Good'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'center', fontSize: '13px', color: '#92400e' }}>
          Solo lectura — necesitas rol <strong>editor</strong> o <strong>admin</strong> para modificar.
        </div>
      )}

      {/* ── Tabla ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', margin: 0 }}>
            Finished Goods existentes
          </h3>
          <input type="text" placeholder="Buscar…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '200px', fontSize: '13px' }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>
            Cargando desde MongoDB…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Finished Good', 'Tipo', 'Vehículo', 'BOM', editable ? 'Acciones' : null]
                    .filter(Boolean).map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={editable ? 5 : 4} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      {search ? 'Sin resultados para tu búsqueda.' : 'No hay Finished Goods registrados.'}
                    </td>
                  </tr>
                ) : filtered.map((fg, idx) => {
                  const isDup   = nameCounts[(fg.finishedGood || '').trim().toLowerCase()] > 1;
                  const rowKey  = fg._id || fg.id || idx;
                  const isOpen  = expanded === rowKey;
                  const bomList = fg.bom || [];

                  return (
                    <tr key={rowKey} style={{ borderTop: '1px solid #f3f4f6', background: isDup ? '#fff7ed' : '#fff' }}>

                      {/* Nombre */}
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#111', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{fg.finishedGood || <em style={{ color: '#9ca3af' }}>sin nombre</em>}</span>
                          {isDup && (
                            <span style={{ fontSize: '11px', background: '#fed7aa', color: '#c2410c', padding: '1px 7px', borderRadius: '999px', fontWeight: '700' }}>
                              duplicado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: '10px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        {fg.type || '—'}
                      </td>

                      {/* Vehículo */}
                      <td style={{ padding: '10px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        {fg.vehicleType || '—'}
                      </td>

                      {/* BOM colapsable */}
                      <td style={{ padding: '10px 16px', color: '#6b7280', maxWidth: '280px' }}>
                        {bomList.length === 0 ? '—' : (
                          <>
                            {bomList.slice(0, isOpen ? bomList.length : 2).map((m, j) => (
                              <div key={j} style={{ fontSize: '12px', lineHeight: '1.6' }}>
                                <strong style={{ color: '#374151' }}>{m.materialId}</strong>
                                <span style={{ color: '#9ca3af' }}> × {m.quantity}</span>
                                {m.name && <span style={{ color: '#9ca3af' }}> · {m.name}</span>}
                              </div>
                            ))}
                            {bomList.length > 2 && (
                              <button onClick={() => setExpanded(isOpen ? null : rowKey)}
                                style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: '2px' }}>
                                {isOpen ? 'Ver menos ▲' : `+${bomList.length - 2} más ▼`}
                              </button>
                            )}
                          </>
                        )}
                      </td>

                      {/* Acciones */}
                      {editable && (
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => setDelTarget(fg)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal eliminar ── */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '48px', height: '48px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
              🗑️
            </div>
            <p style={{ fontWeight: '700', fontSize: '16px', color: '#111', marginBottom: '6px' }}>
              ¿Eliminar este Finished Good?
            </p>
            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '4px' }}>
              {delTarget.finishedGood}
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px' }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setDelTarget(null)}
                style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={confirmDelete}
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Estilos helpers ────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit', background: '#fff',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '700',
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px',
};

const btnStyle = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 16px', borderRadius: '10px', border: 'none',
  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  background: color === 'orange' ? '#f97316' : '#fff',
  color:      color === 'orange' ? '#fff'    : '#374151',
  boxShadow: color === 'gray' ? 'inset 0 0 0 1px #d1d5db' : 'none',
});

export default FinishedGoodManagement;
