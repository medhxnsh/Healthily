export interface APIResponse<T> {
  success: boolean
  data: T | null
  error?: string | null
  disclaimer?: string | null
}

export interface BloodParameterOut {
  name: string
  raw_name: string
  value: number
  unit: string
  status: 'low' | 'normal' | 'high' | 'unknown'
  is_critical: boolean
  ref_low: number | null
  ref_high: number | null
  ref_unit: string | null
}

export interface UploadReportResponse {
  parameters: BloodParameterOut[]
  unrecognized: string[]
  validation_errors: string[]
  simplification: string | null
  simplification_cached: boolean
  parameter_count: number
  anomaly_count: number
}

export interface ParameterScoreOut {
  value: number
  unit: string
  z_score: number
  status: string
  severity: string
  ref_low: number | null
  ref_high: number | null
  is_critical: boolean
}

export interface AnomalySummaryOut {
  total_parameters: number
  anomaly_count: number
  severe_count: number
  has_critical: boolean
}

export interface ZScoreResultOut {
  scores: Record<string, ParameterScoreOut>
  summary: AnomalySummaryOut
}

export interface IFResultOut {
  anomaly_score: number
  is_anomalous: boolean
  confidence: string
}

export interface CompareResultOut {
  zscore: ZScoreResultOut
  isolation_forest: IFResultOut
  agreement: boolean
}

export interface ConditionProbabilityOut {
  condition: string
  display_name: string
  probability: number
}

export interface MLPredictionOut {
  top_condition: string | null
  top_probability: number
  probabilities: ConditionProbabilityOut[]
}

export interface RuleBasedSummaryOut {
  top_condition: string | null
  risk_percent: number
}

export interface PredictResultOut {
  ml_prediction: MLPredictionOut
  rule_based: RuleBasedSummaryOut
  agreement: boolean
  confidence: string
}

export interface FeatureContributionOut {
  feature: string
  contribution: number
  direction: string
  percentage: number
}

export interface ExplainResultOut {
  prediction: MLPredictionOut
  explained_condition: string
  explanations: FeatureContributionOut[]
}

export interface ConditionResultOut {
  name: string
  display_name: string
  risk_percent: number
  severity: string
  requires_doctor: boolean
  message: string
  lifestyle_tips: string[]
}

export interface RiskResultOut {
  conditions: ConditionResultOut[]
  requires_immediate_attention: boolean
  top_condition: string | null
}

export interface ParameterInput {
  name: string
  value: number
  unit: string
}
