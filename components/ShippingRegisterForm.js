import React, { useState, useEffect, useCallback } from 'react';
import { uspsApi, canEdit } from '../utils/storage';

/**
 * Órdenes para Envío USPS
 * ─────────────────────────────────────────────────────────────────
 * Es un control de BALANCE de dinero:
 *   Balance actual = Σ fondos agregados − Σ costos PO Box/etiquetado − Σ gastos Arizona
 *
 * NO es de captura de paquetes (eso es FedEx).
 * Tipos de movimiento:
 *   - "fondo"     → agrega dinero al balance
 *   - "pobox"     → descuenta (costo de PO Box o etiquetado desde Observaciones FedEx)
 *   - "arizona"   → descuenta (gastos Arizona)
 * ─────────────────────────────────────────────────────────────────
 */

const MOVEMENT_TYPES = [
  { value: "fondo",   label: "➕ Agregar Fondos",          color: "bg-green-100 text-green-800"  },
  { value: "pobox",   label: "📦 Costo PO Box / Etiqueta", color: "bg-yellow-100 text-yellow-800"},
  { value: "arizona", label: "🌵 Gasto Arizona",            color: "bg-orange-100 text-orange-800"},
];

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const ShippingRegisterForm = () => {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ text: "", type: "" });
  const editable = canEdit();

  // Formulario
  const [movType,      setMovType]      = useState("fondo");
  const [amount,       setAmount]       = useState("");
  const [description,  setDescription]  = useState("");
  const [movDate,      setMovDate]      = useState(() => new Date().toISOString().split("T")[0]);
  const [invoiceRef,   setInvoiceRef]   = useState("");   // referencia a invoice FedEx si aplica

  // Eliminar
  const [delId,        setDelId]        = useState(null);

  const showMsg = (text, type = "success", ms = 4000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), ms);
  };

  // ── Cargar desde MongoDB ────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await uspsApi.list();
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      setRecords(sorted);
    } catch (err) {
      console.error(err);
      showMsg("Error al cargar registros del servidor.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ── Balance acumulado ───────────────────────────────────────────
  const balance = records.reduce((acc, r) => {
    const amt = Number(r.amount) || 0;
    if (r.type === "fondo")   return acc + amt;
    if (r.type === "pobox")   return acc - amt;
    if (r.type === "arizona") return acc - amt;
    return acc;
  }, 0);

  // ── Guardar movimiento ──────────────────────────────────────────
  const handleSave = async () => {
    if (!editable) { showMsg("No tienes permisos de edición.", "error"); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      showMsg("Ingresa un monto válido mayor a 0.", "error"); return;
    }
    if (!movDate) { showMsg("Selecciona una fecha.", "error"); return; }

    const record = {
      id:          `usps_${Date.now()}`,
      type:        movType,
      amount:      amt,
      description: description.trim() || MOVEMENT_TYPES.find(m => m.value === movType)?.label || movType,
      date:        movDate,
      invoiceRef:  invoiceRef.trim(),
      captureTime: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await uspsApi.create(record);
      showMsg("Movimiento guardado correctamente ✅");
      setAmount("");
      setDescription("");
      setInvoiceRef("");
      setMovDate(new Date().toISOString().split("T")[0]);
      await loadRecords();
    } catch (err) {
      showMsg("Error al guardar en el servidor.", "error");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!delId) return;
    try {
      await uspsApi.remove(delId);
      showMsg("Movimiento eliminado.");
      setDelId(null);
      await loadRecords();
    } catch (err) {
      showMsg("Error al eliminar.", "error");
      console.error(err);
    }
  };

  const balanceColor = balance >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Balance USPS
      </h2>
      <p className="text-center text-gray-500 text-sm mb-6">
        Control de fondos para envíos USPS — PO Box, etiquetado y gastos Arizona
      </p>

      {/* Balance destacado */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-center border border-gray-200">
        <p className="text-sm text-gray-500 font-medium mb-1">Balance actual</p>
        <p className={`text-5xl font-bold ${balanceColor}`}>{fmt(balance)}</p>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <span className="text-green-600 font-semibold">
            Fondos: {fmt(records.filter(r => r.type === "fondo").reduce((s, r) => s + Number(r.amount), 0))}
          </span>
          <span className="text-yellow-600 font-semibold">
            PO Box: {fmt(records.filter(r => r.type === "pobox").reduce((s, r) => s + Number(r.amount), 0))}
          </span>
          <span className="text-orange-600 font-semibold">
            Arizona: {fmt(records.filter(r => r.type === "arizona").reduce((s, r) => s + Number(r.amount), 0))}
          </span>
        </div>
      </div>

      {/* Mensaje */}
      {message.text && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
          message.type === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulario — solo si tiene permisos */}
      {editable ? (
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Registrar movimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Tipo de movimiento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
              <div className="flex gap-2 flex-wrap">
                {MOVEMENT_TYPES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMovType(m.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      movType === m.value
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Monto (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descripción {movType === "pobox" && <span className="text-yellow-600">(obligatoria para PO Box)</span>}
              </label>
              <input
                type="text"
                placeholder={
                  movType === "fondo"   ? "Ej. Recarga de fondos semanal" :
                  movType === "pobox"   ? "Ej. Invoice 7823U — PO Box California" :
                  "Ej. Supplies Arizona warehouse"
                }
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Invoice de referencia (solo PO Box) */}
            {movType === "pobox" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Invoice FedEx de referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. 7823U"
                  value={invoiceRef}
                  onChange={e => setInvoiceRef(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={movDate}
                onChange={e => setMovDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${
              saving ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
          >
            {saving ? "Guardando…" : "Guardar movimiento"}
          </button>
        </div>
      ) : (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 text-center">
          Solo puedes ver los datos. Necesitas rol de <strong>editor</strong> o <strong>admin</strong> para agregar movimientos.
        </div>
      )}

      {/* Historial */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Historial de movimientos
      </h3>
      {loading ? (
        <p className="text-center text-gray-400 py-8">Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-xl shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Tipo</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Descripción</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Invoice Ref.</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">Monto</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">Balance</th>
                {editable && <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let running = 0;
                return records.length > 0 ? records.map((r) => {
                  const amt = Number(r.amount) || 0;
                  if (r.type === "fondo")   running += amt;
                  else                      running -= amt;
                  const mt = MOVEMENT_TYPES.find(m => m.value === r.type);
                  return (
                    <tr key={r.id || r._id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${mt?.color || "bg-gray-100 text-gray-600"}`}>
                          {mt?.label || r.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{r.description || "—"}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{r.invoiceRef || "—"}</td>
                      <td className={`py-3 px-4 text-right font-semibold text-sm ${r.type === "fondo" ? "text-green-600" : "text-red-600"}`}>
                        {r.type === "fondo" ? "+" : "−"}{fmt(amt)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold text-sm ${running >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {fmt(running)}
                      </td>
                      {editable && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setDelId(r.id || r._id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={editable ? 7 : 6} className="py-8 text-center text-gray-400">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {delId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
            <p className="font-semibold text-gray-800 mb-4">¿Eliminar este movimiento?</p>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDelId(null)} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete}         className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingRegisterForm;
