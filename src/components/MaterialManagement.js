import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { materialBomApi, canEdit } from '../utils/storage';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtNum = (n) =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 4 });

const excelDateToISO = (val) => {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial date → JS Date
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  return String(val);
};

const emptyForm = {
  materialId: '',
  name: '',
  stock: 0,
  um: '',
  pedimento: '',
  sec: '',
  pesoKg: 0,
  fechaVencimiento: '',
};

const MaterialManagement = () => {
  const [materials, setMaterials]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [importing, setImporting]   = useState(false);
  const [form,       setForm]       = useState(emptyForm);
  const [editingId,  setEditingId]  = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [message,    setMessage]    = useState({ text: '', type: '' });
  const [search,     setSearch]     = useState('');

  const fileInputRef = useRef(null);
  const editable     = canEdit();

  const showMsg = (text, type = 'success', ms = 4000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), ms);
  };

  // ── Cargar desde MongoDB ─────────────────────────────────────────────────────
  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await materialBomApi.list();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showMsg('Error al cargar materiales del servidor.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  // ── Guardar (crear / actualizar) ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!editable) { showMsg('No tienes permisos de edición.', 'error'); return; }
    if (!form.materialId.trim() || !form.name.trim()) {
      showMsg('ID Material y Nombre son obligatorios.', 'error'); return;
    }
    if (Number(form.stock) < 0) {
      showMsg('El stock no puede ser negativo.', 'error'); return;
    }
    // Validar duplicado al crear
    if (!editingId && materials.some(m => (m.materialId || '').toLowerCase() === form.materialId.trim().toLowerCase())) {
      showMsg('Ese ID de material ya existe. Usa otro o edítalo desde la tabla.', 'error');
      return;
    }

    const record = {
      ...form,
      id:         editingId || form.materialId.trim(),
      materialId: form.materialId.trim(),
      name:       form.name.trim(),
      stock:      Number(form.stock) || 0,
      pesoKg:     Number(form.pesoKg) || 0,
    };

    try {
      if (editingId) {
        await materialBomApi.update(editingId, record);
        showMsg('Material actualizado con éxito ✅');
      } else {
        await materialBomApi.create(record);
        showMsg('Material agregado con éxito ✅');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadMaterials();
    } catch (err) {
      console.error(err);
      showMsg('No se pudo guardar en el servidor.', 'error');
    }
  };

  const startEdit = (m) => {
    setForm({
      materialId:       m.materialId || '',
      name:             m.name || '',
      stock:            m.stock || 0,
      um:               m.um || '',
      pedimento:        m.pedimento || '',
      sec:              m.sec || '',
      pesoKg:           m.pesoKg || 0,
      fechaVencimiento: m.fechaVencimiento || '',
    });
    setEditingId(m.id || m.materialId);
  };

  const cancelEdit = () => { setForm(emptyForm); setEditingId(null); };

  // ── Eliminar ──────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!delTarget) return;
    try {
      await materialBomApi.remove(delTarget.id || delTarget.materialId);
      showMsg('Material eliminado con éxito ✅');
      setDelTarget(null);
      await loadMaterials();
    } catch (err) {
      console.error(err);
      showMsg('No se pudo eliminar en el servidor.', 'error');
      setDelTarget(null);
    }
  };

  // ── Importar desde XLSX ─────────────────────────────────────────────────────
  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!editable) { showMsg('No tienes permisos de edición.', 'error'); return; }

    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array', cellDates: true });

      // Preferir hoja "SALDOS ABIERTOS" si existe; si no, la primera
      const sheetName =
        wb.SheetNames.find(n => n.toUpperCase().includes('SALDOS ABIERTOS')) ||
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rows.length === 0) {
        showMsg('El archivo no contiene filas con datos.', 'error');
        return;
      }

      // Mapear columnas del reporte de saldos a la estructura de BOM
      const existingIds = new Set(materials.map(m => (m.materialId || '').toLowerCase()));
      const seen = new Set();
      let created = 0, updated = 0, skipped = 0;

      for (const row of rows) {
        const noParte = String(row['No. Parte'] ?? row['No Parte'] ?? row['NoParte'] ?? '').trim();
        if (!noParte) { skipped++; continue; }

        const descripcion = String(row['Descripción'] ?? row['Descripcion'] ?? '').trim();
        const saldo        = Number(row['Saldo'] ?? 0);
        const um           = String(row['UM Saldo'] ?? row['UM'] ?? '').trim();
        const pesoKg       = Number(row['Peso Kg Saldo'] ?? row['Peso Kg'] ?? 0);
        const folio        = String(row['Folio Pedimento'] ?? '').trim();
        const sec          = String(row['Sec.'] ?? row['Sec'] ?? '').trim();
        const vencimiento  = excelDateToISO(row['Fecha Vencimiento']);

        // Si el No. Parte se repite dentro del archivo, suma los saldos
        const idKey = noParte.toLowerCase();
        let record;

        if (seen.has(idKey)) {
          // Acumular en memoria — se reflejará en la actualización final
          const existing = materials.find(m => (m.materialId || '').toLowerCase() === idKey);
          record = existing
            ? { ...existing, stock: Number(existing.stock || 0) + saldo, pesoKg: Number(existing.pesoKg || 0) + pesoKg }
            : null;
        } else {
          record = {
            id:               noParte,
            materialId:       noParte,
            name:             descripcion || noParte,
            stock:            saldo,
            um,
            pedimento:        folio,
            sec,
            pesoKg,
            fechaVencimiento: vencimiento,
          };
        }
        seen.add(idKey);
        if (!record) continue;

        try {
          if (existingIds.has(idKey)) {
            await materialBomApi.update(record.id, record);
            updated++;
          } else {
            await materialBomApi.create(record);
            existingIds.add(idKey);
            created++;
          }
        } catch (err) {
          console.warn('Error importando fila', noParte, err);
          skipped++;
        }
      }

      showMsg(
        `Importación completa: ${created} creados, ${updated} actualizados${skipped ? `, ${skipped} omitidos` : ''} (hoja "${sheetName}")`,
        'success',
        6000
      );
      await loadMaterials();
    } catch (err) {
      console.error(err);
      showMsg('No se pudo leer el archivo. Verifica que sea un .xlsx válido.', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Filtro de búsqueda ───────────────────────────────────────────────────────
  const filtered = materials.filter(m => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.materialId || '').toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.pedimento || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Materiales (BOM)</h2>

        {editable && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handleFilePick}
              disabled={importing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                importing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16" />
              </svg>
              {importing ? 'Importando…' : 'Importar desde Excel'}
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-gray-400 text-sm mb-6">
        {materials.length} materiales registrados en MongoDB
      </p>

      {message.text && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium text-center ${
          message.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulario */}
      {editable ? (
        <div className="mb-8 p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {editingId ? '✏️ Editar Material' : '➕ Agregar Nuevo Material'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">ID Material / No. Parte *</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                value={form.materialId}
                disabled={!!editingId}
                onChange={e => setForm({ ...form, materialId: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-semibold mb-1">Descripción *</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Saldo (Stock)</label>
              <input
                type="number" step="0.0001" min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">UM Saldo</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.um}
                onChange={e => setForm({ ...form, um: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Peso Kg Saldo</label>
              <input
                type="number" step="0.0001" min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.pesoKg}
                onChange={e => setForm({ ...form, pesoKg: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Folio Pedimento</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.pedimento}
                onChange={e => setForm({ ...form, pedimento: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Sec.</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.sec}
                onChange={e => setForm({ ...form, sec: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Fecha Vencimiento</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.fechaVencimiento}
                onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {editingId && (
              <button onClick={cancelEdit} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100">
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              {editingId ? 'Guardar Cambios' : 'Agregar Material'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 text-center">
          Solo puedes ver los materiales. Necesitas rol de <strong>editor</strong> o <strong>admin</strong> para modificarlos.
        </div>
      )}

      {/* Búsqueda */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-700">Materiales Existentes</h3>
        <input
          type="text"
          placeholder="Buscar por No. Parte, descripción o pedimento…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">No. Parte</th>
                <th className="py-3 px-4 text-left">Descripción</th>
                <th className="py-3 px-4 text-right">Saldo</th>
                <th className="py-3 px-4 text-left">UM</th>
                <th className="py-3 px-4 text-right">Peso Kg</th>
                <th className="py-3 px-4 text-left">Pedimento</th>
                <th className="py-3 px-4 text-left">Vencimiento</th>
                {editable && <th className="py-3 px-4 text-left">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((m) => (
                <tr key={m.id || m.materialId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{m.materialId}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={m.name}>{m.name}</td>
                  <td className="py-3 px-4 text-right">{fmtNum(m.stock)}</td>
                  <td className="py-3 px-4">{m.um || '—'}</td>
                  <td className="py-3 px-4 text-right">{m.pesoKg ? fmtNum(m.pesoKg) : '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{m.pedimento || '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{m.fechaVencimiento || '—'}</td>
                  {editable && (
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button onClick={() => startEdit(m)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 mr-2 text-xs">
                        Editar
                      </button>
                      <button onClick={() => setDelTarget(m)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-xs">
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={editable ? 8 : 7} className="py-6 text-center text-gray-400">
                    {search ? 'Sin resultados para tu búsqueda.' : 'No hay materiales registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {delTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
            <p className="font-semibold text-gray-800 mb-1">¿Eliminar este material?</p>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{delTarget.materialId}</strong> — {delTarget.name}<br/>
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDelTarget(null)} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmDelete} className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialManagement;
