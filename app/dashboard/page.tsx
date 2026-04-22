'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function DashboardContent() {
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
            <p className="text-gray-500 mb-6">Sube un historial de ventas para ver el dashboard.</p>
            <Link href="/upload" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">Subir archivo →</Link>
          </div>
        )}
        {jobId && preds.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Clientes', value: preds.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Revenue Total', value: `$${(totalRev / 1000000).toFixed(1)}M`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Fill Rate Prom.', value: `${avgFill}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Días Prom.', value: avgDays, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Riesgo Abandono', value: baja, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(kpi => (
                <div key={kpi.label} className={`${kpi.bg} rounded-xl p-5`}>
                  <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">{kpi.label}</div>
                </div>
              ))}
            </div>
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
                        <div className="h-full rounded-full" style={{ width: `${item.count / item.total * 100}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Segmentos</h3>
                <div className="space-y-3">
                  {Object.entries(segments).sort((a, b) => b[1].length - a[1].length).map(([seg, clients]) => (
                    <div key={seg} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm font-medium">{seg}</span>
                      <span className="text-sm font-bold">{clients.length} <span className="text-gray-400 font-normal text-xs">clientes</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Próximas Recompras</h3>
                <div className="space-y-3">
                  {[...preds].sort((a: any, b: any) => a.dias_estimados - b.dias_estimados).slice(0, 7).map((p: any) => (
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
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">⏳</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}