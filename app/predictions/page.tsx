'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function PredictionsPage() {
  const params = useSearchParams();
  const jobId = params.get('job') || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [horizon, setHorizon] = useState('prob_30d');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!jobId) return;
    fetch(`${API}/api/predict/${jobId}?top_n=100&sort_by=${horizon}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId, horizon]);

  const filtered = data?.predictions?.filter((p: any) =>
    p.cliente.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const download = () => {
    window.open(`${API}/api/predict/${jobId}/download`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  if (!data?.predictions) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-gray-500">No hay predicciones disponibles</p>
      <Link href="/upload" className="text-emerald-600 font-semibold">← Subir datos</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="text-lg font-extrabold">FastOclock</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/upload" className="text-sm text-gray-500 hover:text-gray-700">Nuevo análisis</Link>
          <button onClick={download} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
            ⬇ Descargar CSV
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Clientes', value: data.total_clients, color: 'text-blue-600' },
            { label: 'Programar Pedido', value: data.resumen?.programar_pedido, color: 'text-emerald-600' },
            { label: 'Contactar', value: data.resumen?.contactar_cliente, color: 'text-amber-600' },
            { label: 'Reactivar', value: data.resumen?.reactivar_campana, color: 'text-red-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl p-5 border">
              <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
              <div className="text-sm text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="flex-1 min-w-[250px] px-4 py-2.5 border rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          <div className="flex gap-1">
            {['prob_7d', 'prob_14d', 'prob_30d', 'prob_60d'].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${horizon === h ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {h.replace('prob_', '').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Cliente', 'Segmento', 'Prob.', 'Días Est.', 'Fill Rate', 'Revenue', 'Última Compra', 'Acción'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any, i: number) => (
                  <tr key={i}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${selected?.cliente === p.cliente ? 'bg-emerald-50' : ''}`}
                    onClick={() => setSelected(selected?.cliente === p.cliente ? null : p)}>
                    <td className="px-4 py-3 font-semibold max-w-[200px] truncate">{p.cliente}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        p.prioridad === 'ALTA' ? 'bg-emerald-100 text-emerald-700' :
                        p.prioridad === 'MEDIA' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>{p.segmento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${p[horizon] * 100}%`,
                            background: p[horizon] > 0.75 ? '#059669' : p[horizon] > 0.4 ? '#d97706' : '#dc2626'
                          }} />
                        </div>
                        <span className="font-mono text-xs font-bold">{(p[horizon] * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-extrabold ${p.dias_estimados <= 7 ? 'text-emerald-600' : p.dias_estimados <= 21 ? 'text-amber-600' : 'text-red-600'}`}>
                        {p.dias_estimados}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-0.5">d</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-10 h-1.5 bg-gray-100 rounded overflow-hidden">
                          <div className="h-full rounded" style={{
                            width: `${p.fill_rate}%`,
                            background: p.fill_rate > 90 ? '#059669' : p.fill_rate > 70 ? '#d97706' : '#dc2626'
                          }} />
                        </div>
                        <span className="text-[11px] font-semibold">{p.fill_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">${p.revenue_total?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.ultima_compra}</td>
                    <td className="px-4 py-3">
                      <button className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                        p.prioridad === 'ALTA' ? 'bg-emerald-100 text-emerald-700' :
                        p.prioridad === 'MEDIA' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.accion.replace(/_/g, ' ')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expanded interpretation */}
        {selected && (
          <div className="mt-6 bg-white rounded-2xl border-2 border-emerald-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-extrabold">{selected.cliente}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  selected.prioridad === 'ALTA' ? 'bg-emerald-100 text-emerald-700' :
                  selected.prioridad === 'MEDIA' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>{selected.segmento}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Próxima compra estimada</div>
                <div className="text-4xl font-black text-emerald-600">{selected.dias_estimados}<span className="text-base font-medium text-gray-400 ml-1">días</span></div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="bg-emerald-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-emerald-900 leading-relaxed">
                📋 <strong>Interpretación del pronóstico:</strong> {selected.interpretacion}
              </p>
            </div>

            {/* Probability bars */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {['7d', '14d', '30d', '60d'].map(h => {
                const val = selected[`prob_${h}`];
                return (
                  <div key={h} className="text-center">
                    <div className="text-[10px] text-gray-400 mb-1">{h}</div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${val * 100}%`,
                        background: val > 0.75 ? '#059669' : val > 0.4 ? '#d97706' : '#dc2626'
                      }} />
                    </div>
                    <div className="text-sm font-bold mt-1">{(val * 100).toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3">
              {[
                ['Órdenes', selected.total_ordenes],
                ['Ticket Prom.', `$${selected.ticket_promedio?.toLocaleString()}`],
                ['Revenue', `$${selected.revenue_total?.toLocaleString()}`],
                ['Intervalo', `${selected.intervalo_dias}d`],
                ['Fill Rate', `${selected.fill_rate}%`],
              ].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-400">{l}</div>
                  <div className="text-base font-extrabold">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
