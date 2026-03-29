import type { APIResponse, UploadReportResponse } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api/v1'

export async function uploadReport(
  file: File,
  age: number,
  sex: 'male' | 'female',
): Promise<APIResponse<UploadReportResponse>> {
  const form = new FormData()
  form.append('file', file)
  form.append('age', String(age))
  form.append('sex', sex)

  const res = await fetch(`${BASE}/reports/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}
