import React, { useState, useEffect, useCallback } from 'react';

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  'https://shipping-backend-kgm5.onrender.com';

function getToken() { return localStorage.getItem('authToken'); }

async function apiFetch(path) {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt   = n  => Number(n || 0).toLocaleString('en-US');
const money = n  => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const pad   = n  => String(n).padStart(2, '0');
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Componentes base ───────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, accent = false }) => (
  <div className={`rounded-2xl p-5 shadow ${accent ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>
    <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${accent ? 'text-gray-400' : 'text-gray-400'}`}>
      {label}
    </p>
    <p className={`text-4xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    {sub && <p className={`text-xs mt-1 ${accent ? 'text-gray-400' : 'text-gray-400'}`}>{sub}</p>}
  </div>
);

const HBar = ({ label, value, max, rank }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5 group">
      {rank && (
        <span className="w-5 text-xs font-bold text-gray-300 text-right shrink-0">{rank}</span>
      )}
      <span className="w-44 text-sm text-gray-700 truncate shrink-0" title={label}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gray-900 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-bold text-gray-800 shrink-0">{fmt(value)}</span>
    </div>
  );
};

const SectionCard = ({ title, sub, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
    <h3 className="text-base font-bold text-gray-800">{title}</h3>
    {sub && <p className="text-xs text-gray-400 mb-4 mt-0.5">{sub}</p>}
    {children}
  </div>
);

const CompactTable = ({ headers, rows, empty = 'Sin datos para el período.' }) => (
  <div className="overflow-x-auto mt-3">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {headers.map(h => (
            <th key={h} className="py-2.5 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="py-8 text-center text-gray-400 text-sm">{empty}</td>
          </tr>
        ) : rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{cell ?? '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Vistas disponibles ─────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'hourly',  label: '⏱ Por Hora'  },
  { id: 'daily',   label: '📅 Por Día'   },
  { id: 'monthly', label: '📆 Por Mes'   },
  { id: 'yearly',  label: '📊 Por Año'   },
];

// ── Componente principal ───────────────────────────────────────────────────────
const DailyReport = () => {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];

  const [view,        setView]        = useState('daily');
  const [loading,     setLoading]     = useState(true);
  const [fedexData,   setFedexData]   = useState([]);
  const [uspsData,    setUspsData]    = useState([]);

  // Filtros
  const [filterDate,  setFilterDate]  = useState(today);
  const [filterMonth, setFilterMonth] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  );
  const [filterYear,  setFilterYear]  = useState(String(now.getFullYear()));

  // ── Carga de datos desde MongoDB ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fedex, usps] = await Promise.all([
        apiFetch('/api/fedex_orders').catch(() => []),
        apiFetch('/api/usps_orders').catch(() => []),
      ]);
      setFedexData(Array.isArray(fedex) ? fedex : []);
      setUspsData(Array.isArray(usps)   ? usps  : []);
    } catch (e) {
      console.error('DailyReport load:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtrar FedEx según vista ──────────────────────────────────────────────
  const filtered = fedexData.filter(r => {
    const d = r.shippingDate || r.captureTime?.split('T')[0] || '';
    if (view === 'hourly' || view === 'daily') return d === filterDate;
    if (view === 'monthly') return d.startsWith(filterMonth);
    if (view === 'yearly')  return d.startsWith(filterYear);
    return true;
  });

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalLines    = filtered.length;
  const allInvoices   = [...new Set(filtered.map(r => r.invoice).filter(Boolean))];
  const totalInvoices = allInvoices.length;
  const avgPerInvoice = totalInvoices > 0 ? (totalLines / totalInvoices).toFixed(1) : '—';

  // ── Top Finished Goods ─────────────────────────────────────────────────────
  const fgMap = {};
  filtered.forEach(r => {
    const k = r.finishedGood || '(sin FG)';
    fgMap[k] = (fgMap[k] || 0) + 1;
  });
  const topFG  = Object.entries(fgMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxFG  = topFG[0]?.[1] || 1;

  // ── Órdenes por Invoice ────────────────────────────────────────────────────
  const invoiceRows = allInvoices
    .map(inv => {
      const lines = filtered.filter(r => r.invoice === inv);
      const fgs   = [...new Set(lines.map(r => r.finishedGood).filter(Boolean))].join(', ');
      return { inv, count: lines.length, fgs };
    })
    .sort((a, b) => b.count - a.count);

  // ── Actividad por hora (vista hourly) ──────────────────────────────────────
  const hourBuckets = {};
  if (view === 'hourly') {
    filtered.forEach(r => {
      if (!r.captureTime) return;
      const h     = new Date(r.captureTime).getHours();
      const label = `${pad(h)}:00 – ${pad(h + 1)}:00`;
      hourBuckets[label] = (hourBuckets[label] || 0) + 1;
    });
  }
  const hourData = Object.entries(hourBuckets).sort((a, b) => a[0].localeCompare(b[0]));
  const maxHour  = Math.max(...hourData.map(d => d[1]), 1);

  // ── Días del mes (vista monthly) ───────────────────────────────────────────
  const dayBuckets = {};
  if (view === 'monthly') {
    fedexData
      .filter(r => (r.shippingDate || '').startsWith(filterMonth))
      .forEach(r => {
        const d = r.shippingDate || '';
        if (d) dayBuckets[d] = (dayBuckets[d] || 0) + 1;
      });
  }
  const dayData = Object.entries(dayBuckets).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay  = Math.max(...dayData.map(d => d[1]), 1);

  // ── Meses del año (vista yearly) ──────────────────────────────────────────
  const monthBuckets = {};
  if (view === 'yearly') {
    fedexData
      .filter(r => (r.shippingDate || '').startsWith(filterYear))
      .forEach(r => {
        const m = r.shippingDate?.substring(5, 7);
        if (m) monthBuckets[m] = (monthBuckets[m] || 0) + 1;
      });
  }
  const monthData = Object.entries(monthBuckets)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([m, v]) => [MONTHS_ES[parseInt(m, 10) - 1] || m, v]);
  const maxMonth  = Math.max(...monthData.map(d => d[1]), 1);

  // ── Balance USPS del período ───────────────────────────────────────────────
  const uspsFiltered = uspsData.filter(r => {
    const d = r.date || '';
    if (view === 'hourly' || view === 'daily') return d === filterDate;
    if (view === 'monthly') return d.startsWith(filterMonth);
    if (view === 'yearly')  return d.startsWith(filterYear);
    return true;
  });
  const uspsBalance = uspsFiltered.reduce((acc, r) => {
    const amt = Number(r.amount) || 0;
    return r.type === 'fondo' ? acc + amt : acc - amt;
  }, 0);
  const uspsFondos  = uspsFiltered.filter(r => r.type === 'fondo')
    .reduce((s, r) => s + Number(r.amount), 0);
  const uspsGastos  = uspsFiltered.filter(r => r.type !== 'fondo')
    .reduce((s, r) => s + Number(r.amount), 0);

  // ── Años disponibles para el selector ─────────────────────────────────────
  const availableYears = [...new Set(
    fedexData.map(r => (r.shippingDate || '').substring(0, 4)).filter(Boolean)
  )].sort().reverse();

  // ── Imprimir ───────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const el = document.getElementById('report-content');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Informe General de Envíos</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h1   { font-size: 22px; margin-bottom: 4px; }
        h2   { font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; font-size: 13px; }
        th { background: #f3f4f6; font-weight: 600; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .kpi-val { font-size: 28px; font-weight: 700; }
        .kpi-lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        @media print { button { display:none } }
      </style></head><body>
      <h1>Informe General de Envíos</h1>
      <p style="color:#6b7280;font-size:13px;">Generado: ${new Date().toLocaleString()}</p>
      ${el.innerHTML}
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // ── Loader ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-gray-900 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando datos…</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informe General de Envíos</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Análisis en tiempo real desde MongoDB · {fmt(fedexData.length)} registros totales
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* Selector de vista */}
      <div className="flex gap-2 flex-wrap mb-5">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              view === v.id
                ? 'bg-gray-900 text-white shadow'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Filtro de período */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center gap-5">
        {(view === 'hourly' || view === 'daily') && (
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            Fecha:
            <input type="date" value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </label>
        )}
        {view === 'monthly' && (
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            Mes:
            <input type="month" value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </label>
        )}
        {view === 'yearly' && (
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            Año:
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-gray-900">
              {(availableYears.length > 0 ? availableYears : [String(now.getFullYear())]).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {fmt(filtered.length)} líneas en el período · {fmt(totalInvoices)} invoices
        </span>
      </div>

      {/* ── Contenido imprimible ── */}
      <div id="report-content" className="space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Líneas capturadas"     value={fmt(totalLines)}     sub="en el período" accent />
          <KPI label="Invoices únicos"        value={fmt(totalInvoices)}  sub="facturas distintas" />
          <KPI label="Promedio por invoice"   value={avgPerInvoice}       sub="líneas / factura" />
          <KPI label="Finished Goods únicos"  value={fmt(Object.keys(fgMap).length)} sub="modelos distintos" />
        </div>

        {/* Balance USPS del período */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-1">Fondos USPS</p>
            <p className="text-3xl font-bold text-green-700">{money(uspsFondos)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Gastos USPS</p>
            <p className="text-3xl font-bold text-red-600">{money(uspsGastos)}</p>
          </div>
          <div className={`rounded-2xl p-5 border ${uspsBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${uspsBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>Balance USPS</p>
            <p className={`text-3xl font-bold ${uspsBalance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{money(uspsBalance)}</p>
          </div>
        </div>

        {/* Vista por hora */}
        {view === 'hourly' && (
          <SectionCard
            title="Actividad por hora"
            sub={`Líneas capturadas cada hora del día ${filterDate}`}
          >
            {hourData.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">Sin actividad registrada en esta fecha.</p>
            ) : (
              <div className="space-y-1 mt-3">
                {hourData.map(([label, val]) => (
                  <HBar key={label} label={label} value={val} max={maxHour} />
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* Vista por día dentro del mes */}
        {view === 'monthly' && dayData.length > 0 && (
          <SectionCard
            title="Líneas por día"
            sub={`Distribución diaria en ${filterMonth}`}
          >
            <div className="space-y-1 mt-3">
              {dayData.map(([d, v]) => <HBar key={d} label={d} value={v} max={maxDay} />)}
            </div>
          </SectionCard>
        )}

        {/* Vista por mes dentro del año */}
        {view === 'yearly' && monthData.length > 0 && (
          <SectionCard
            title="Líneas por mes"
            sub={`Distribución mensual en ${filterYear}`}
          >
            <div className="space-y-1 mt-3">
              {monthData.map(([m, v]) => <HBar key={m} label={m} value={v} max={maxMonth} />)}
            </div>
          </SectionCard>
        )}

        {/* Dos columnas: Top FG + Observaciones */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Top Finished Goods */}
          <SectionCard
            title="🏆 Top Finished Goods más enviados"
            sub="Clasificado por cantidad de líneas capturadas"
          >
            {topFG.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">Sin datos en el período.</p>
            ) : (
              <div className="space-y-1 mt-2">
                {topFG.map(([fg, cnt], i) => (
                  <HBar key={fg} label={fg} value={cnt} max={maxFG} rank={i + 1} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Observaciones más frecuentes */}
          <SectionCard
            title="📋 Observaciones frecuentes"
            sub="Distribución de tipo de observación en el período"
          >
            {(() => {
              const obs = {};
              filtered.forEach(r => {
                const k = r.observation || '(sin observación)';
                obs[k] = (obs[k] || 0) + 1;
              });
              const sorted = Object.entries(obs).sort((a, b) => b[1] - a[1]).slice(0, 8);
              const maxO   = sorted[0]?.[1] || 1;
              return sorted.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm">Sin datos en el período.</p>
              ) : (
                <div className="space-y-1 mt-2">
                  {sorted.map(([o, c]) => <HBar key={o} label={o} value={c} max={maxO} />)}
                </div>
              );
            })()}
          </SectionCard>
        </div>

        {/* Cantidad de órdenes por Invoice */}
        <SectionCard
          title="📦 Órdenes enviadas por Invoice"
          sub="Desglose completo de líneas y finished goods por número de factura"
        >
          <CompactTable
            headers={['#', 'Invoice', 'Líneas', 'Finished Goods incluidos']}
            rows={invoiceRows.map((r, i) => [i + 1, r.inv, fmt(r.count), r.fgs || '—'])}
            empty="Sin invoices en el período seleccionado."
          />
        </SectionCard>

        {/* Detalle completo solo en vistas de día/hora */}
        {(view === 'daily' || view === 'hourly') && (
          <SectionCard
            title={`📄 Detalle completo — ${filterDate}`}
            sub={`${fmt(filtered.length)} líneas capturadas`}
          >
            <CompactTable
              headers={['#', 'Invoice', 'Finished Good', 'Observación', 'Tracking', 'Comentarios', 'Hora']}
              rows={filtered.map((r, i) => [
                i + 1,
                r.invoice         || '—',
                r.finishedGood    || '—',
                r.observation     || '—',
                r.trackingNumber  || '—',
                r.comments        || '—',
                r.captureTime
                  ? new Date(r.captureTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : '—',
              ])}
              empty="Sin registros para esta fecha."
            />
          </SectionCard>
        )}

      </div>
    </div>
  );
};

export default DailyReport;
