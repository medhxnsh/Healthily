import { apiFetch } from './client'
import type {
  APIResponse,
  ZScoreResultOut,
  IFResultOut,
  CompareResultOut,
  PredictResultOut,
  ExplainResultOut,
  ParameterInput,
} from './types'

interface BaseRequest {
  parameters: ParameterInput[]
  age: number
  sex: 'male' | 'female'
}

interface PredictRequest extends BaseRequest {
  symptoms: string[]
}

interface ExplainRequest extends BaseRequest {
  condition?: string
}

export const runZScore = (req: BaseRequest) =>
  apiFetch<APIResponse<ZScoreResultOut>>('/analysis/zscore', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const runIsolationForest = (req: BaseRequest) =>
  apiFetch<APIResponse<IFResultOut>>('/analysis/isolation-forest', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const runCompare = (req: BaseRequest) =>
  apiFetch<APIResponse<CompareResultOut>>('/analysis/compare', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const runPredict = (req: PredictRequest) =>
  apiFetch<APIResponse<PredictResultOut>>('/analysis/predict', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const runExplain = (req: ExplainRequest) =>
  apiFetch<APIResponse<ExplainResultOut>>('/analysis/explain', {
    method: 'POST',
    body: JSON.stringify(req),
  })
