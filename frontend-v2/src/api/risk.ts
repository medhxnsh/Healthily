import { apiFetch } from './client'
import type { APIResponse, RiskResultOut, ParameterInput } from './types'

export const getSymptoms = () =>
  apiFetch<APIResponse<string[]>>('/risk/symptoms')

export const assessRisk = (req: {
  parameters: ParameterInput[]
  symptoms: string[]
  age: number
  sex: 'male' | 'female'
}) =>
  apiFetch<APIResponse<RiskResultOut>>('/risk/assess', {
    method: 'POST',
    body: JSON.stringify(req),
  })
