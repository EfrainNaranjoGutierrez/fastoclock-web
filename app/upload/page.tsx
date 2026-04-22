'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

type Step = 'upload' | 'processing' | 'training' | 'done';

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [trainResult, setTrainResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFile = useCallback((f: File) => {
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Solo se aceptan archivos .xlsx, .xls o .csv');
      return;
    }
    setFile(f);
    setError('');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setStep('processing');
    setError('');

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/api/upload`, { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Error al procesar');

      setJobId(data.job_id);
      setUploadResult(data);
      setStep('training');

      // Auto-train
      const trainRes = await fetch(`${API}/api/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: data.job_id, horizontes: [7, 14, 30, 60], incluir_neural: true, grid_search: false }),
      });
      const trainData = await trainRes.json();

      if (!trainRes.ok) throw new Error(trainData.detail || 'Error en entrenamiento');

      setTrainResult(trainData);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
      setStep('upload');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-8 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="text-lg font-extrabold">FastOclock</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto pt-16 px-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {['Subir archivo', 'Procesando', 'Entrenando', 'Listo'].map((label, i) => {
            const steps: Step[] = ['upload', 'processing', 'training', 'done'];
            const active = steps.indexOf(step) >= i;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                <span className={`text-xs font-medium ${active ? 'text-emerald-700' : 'text-gray-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Upload */}
        {step === 'upload' && (
          <>
            <h1 className="text-3xl font-extrabold mb-2">Sube tu historial de ventas</h1>
            <p className="text-gray-500 mb-8">Excel o CSV con al menos columnas de fecha, cliente y monto. Detectamos el formato automáticamente.</p>

            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input id="file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="text-5xl mb-4">📁</div>
              {file ? (
                <p className="font-semibold text-emerald-700">{file.name} <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></p>
              ) : (
                <p className="text-gray-500">Arrastra tu archivo aquí o haz clic para seleccionar</p>
              )}
              <p className="text-xs text-gray-400 mt-2">.xlsx, .xls, .csv — máximo 50 MB</p>
            </div>

            {error && <p className="text-red-600 text-sm mt-4 font-medium">{error}</p>}

            <button
              onClick={handleUpload}
              disabled={!file}
              className="mt-6 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-base disabled:opacity-40 hover:bg-emerald-700 transition"
            >
              Procesar y Entrenar Modelo
            </button>
          </>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="text-center py-20">
            <div className="animate-spin text-5xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold mb-2">Procesando datos...</h2>
            <p className="text-gray-500">Detectando columnas, limpiando registros, generando features por cliente</p>
          </div>
        )}

        {/* Training */}
        {step === 'training' && (
          <div className="text-center py-20">
            <div className="animate-pulse text-5xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold mb-2">Entrenando modelos...</h2>
            <p className="text-gray-500 mb-6">XGBoost + Red Neuronal en horizontes de 7, 14, 30 y 60 días</p>
            {uploadResult && (
              <div className="bg-white rounded-xl p-4 text-sm text-left max-w-md mx-auto border">
                <p><strong>{uploadResult.records}</strong> registros procesados</p>
                <p><strong>{uploadResult.clients}</strong> clientes detectados</p>
                <p>Rango: {uploadResult.date_range}</p>
              </div>
            )}
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Modelo entrenado</h2>
            <p className="text-gray-500 mb-6">
              {trainResult?.models_trained?.length || 0} modelos listos.
              {trainResult?.accuracy_summary?.mejor_auc && (
                <> Mejor AUC: <strong>{trainResult.accuracy_summary.mejor_auc}</strong></>
              )}
            </p>

            {trainResult?.metrics?.classification && (
              <div className="bg-white rounded-xl border p-4 text-sm text-left max-w-lg mx-auto mb-6">
                <p className="font-bold mb-2">Métricas por horizonte:</p>
                {Object.entries(trainResult.metrics.classification).map(([h, m]: [string, any]) => (
                  <p key={h} className="flex justify-between py-1 border-b border-gray-100">
                    <span className="font-mono">{h}</span>
                    <span>AUC: {m.auc_roc} | F1: {m.f1_score}</span>
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push(`/predictions?job=${jobId}`)}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Ver Predicciones →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
