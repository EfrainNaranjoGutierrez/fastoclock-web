'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function DashboardPage() {
  const params = useSearchParams();
  const jobId = params.get('job') || '';
  const [data, setData] = useState<any>(null);
  const [thresholds, setThresholds] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    Promise.all([
      fetch(`${API}/api/predict/${jobId}?top_n=500`).then(r => r.json()),
      fetch(`${API}/api/thresholds/${jobId}?horizonte=30`).then(r => r.json()),
    ]).then(([pred, thresh]) => {
      setData(pred);
      setThresholds(thresh);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">⏳</div></div>;

  const preds = data?.predictions || [];
  const segments: Record<string, any[]> = {};
  preds.forEach((p: any) => {
    const s = p.segmento || 'Sin segmento';
    if (!segments[s]) segments[s] = [];
    segments[s].push(p);
  });

  const totalRev = preds.reduce((s: number, p: any) => s + (p.revenue_total || 0), 0);
  const avgFill = preds.length ? Math.round(preds.reduce((s: number, p: any) => s + (p.fill_rate || 0), 0) / preds.length) : 0;
  const avgDays = preds.length ? Math.round(preds.reduce((s: number, p: any) => s + (p.dias_estimados || 0), 0) / preds.length) : 0;
  const alta = preds.filter((p: any) => p.prioridad === 'ALTA').length;
  const media = preds.filter((p: any) => p.prioridad === 'MEDIA').length;
  const baja = preds.filter((p: any) => p.prioridad === 'BAJA').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="text-lg font-extrabold">FastOclock</span>
        </Link>
        <div className="flex gap-3">
          <Link href={`/predictions?job=${jobId}`} className="text-sm text-emerald-600 font-semibold hover:underline">Ver predicciones →</Link>
          <Link href="/upload" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Nuevo análisis</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold mb-8">Dashboard de Pronósticos</h1>

        {!jobId && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2">No hay análisis activo</h2>
            <p className="text-gray-500 mb-6">Sube un historial de ventas para ver el dashboard con métricas y predicciones.</p>
            <Link href="/upload" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">Subir archivo →</Link>
          </div>
        )}

        {jobId && preds.length > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Clientes', value: preds.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Revenue Total', value: `$${(totalRev / 1000000).toFixed(1)}M`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Fill Rate Prom.', value: `${avgFill}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Días Prom. Recompra', value: avgDays, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Riesgo Abandono', value: baja, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(kpi => (
                <div key={kpi.label} className={`${kpi.bg} rounded-xl p-5`}>
                  <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Action Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Distribución de Acciones</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Programar Pedido', count: alta, total: preds.length, color: '#059669' },
                    { label: 'Contactar Cliente', count: media, total: preds.length, color: '#d97706' },
                    { label: 'Reactivar Campaña', count: baja, total: preds.length, color: '#dc2626' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-bold">{item.count} <span className="text-gray-400 font-normal">({Math.round(item.count / item.total * 100)}%)</span></span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.count / item.total * 100}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segments */}
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Segmentos de Clientes</h3>
                <div className="space-y-3">
                  {Object.entries(segments).sort((a, b) => b[1].length - a[1].length).map(([seg, clients]) => (
                    <div key={seg} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm font-medium">{seg}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{clients.length}</span>
                        <span className="text-[10px] text-gray-400">clientes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 próximas recompras */}
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Próximas Recompras</h3>
                <div className="space-y-3">
                  {preds.sort((a: any, b: any) => a.dias_estimados - b.dias_estimados).slice(0, 7).map((p: any) => (
                    <div key={p.cliente} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="text-sm font-semibold truncate">{p.cliente}</div>
                        <div className="text-[10px] text-gray-400">{p.producto_top}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-emerald-600">{p.dias_estimados}d</div>
                        <div className="text-[10px] text-gray-400">{(p.prob_30d * 100).toFixed(0)}% prob</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Threshold analysis */}
            {thresholds?.analisis && (
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Análisis de Umbrales (30 días)</h3>
                <p className="text-xs text-gray-400 mb-4">Umbral óptimo: <span className="font-bold text-emerald-600">{thresholds.umbral_optimo}</span> (F1: {thresholds.mejor_f1})</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-3 text-xs font-bold text-gray-400">Umbral</th>
                        <th className="py-2 px-3 text-xs font-bold text-gray-400">Precision</th>
                        <th className="py-2 px-3 text-xs font-bold text-gray-400">Recall</th>
                        <th className="py-2 px-3 text-xs font-bold text-gray-400">F1</th>
                        <th className="py-2 px-3 text-xs font-bold text-gray-400">Clientes Activados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {thresholds.analisis.filter((_: any, i: number) => i % 2 === 0).map((t: any) => (
                        <tr key={t.umbral} className={`border-b border-gray-50 ${t.umbral === thresholds.umbral_optimo ? 'bg-emerald-50 font-bold' : ''}`}>
                          <td className="py-2 px-3 font-mono">{t.umbral}</td>
                          <td className="py-2 px-3">{(t.precision * 100).toFixed(1)}%</td>
                          <td className="py-2 px-3">{(t.recall * 100).toFixed(1)}%</td>
                          <td className="py-2 px-3">{(t.f1 * 100).toFixed(1)}%</td>
                          <td className="py-2 px-3">{t.clientes_activados} ({t.pct_activados}%)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
