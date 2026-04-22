const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
  return res.json();
}

export async function trainModel(jobId: string, options?: {
  horizontes?: number[];
  incluir_neural?: boolean;
  grid_search?: boolean;
}) {
  const res = await fetch(`${API_URL}/api/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: jobId,
      horizontes: options?.horizontes || [7, 14, 30, 60],
      incluir_neural: options?.incluir_neural ?? true,
      grid_search: options?.grid_search ?? false,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || 'Training failed');
  return res.json();
}

export async function getPredictions(jobId: string, topN = 100, sortBy = 'prob_30d') {
  const res = await fetch(`${API_URL}/api/predict/${jobId}?top_n=${topN}&sort_by=${sortBy}`);
  if (!res.ok) throw new Error((await res.json()).detail || 'Predictions failed');
  return res.json();
}

export async function getThresholds(jobId: string, horizonte = 30) {
  const res = await fetch(`${API_URL}/api/thresholds/${jobId}?horizonte=${horizonte}`);
  if (!res.ok) throw new Error((await res.json()).detail || 'Thresholds failed');
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  return res.json();
}

export function downloadUrl(jobId: string) {
  return `${API_URL}/api/predict/${jobId}/download`;
}
