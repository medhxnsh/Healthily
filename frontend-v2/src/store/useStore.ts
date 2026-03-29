import { create } from 'zustand'
import type {
  BloodParameterOut,
  ZScoreResultOut,
  IFResultOut,
  CompareResultOut,
  RiskResultOut,
  PredictResultOut,
  ExplainResultOut,
} from '../api/types'

interface AppState {
  // Upload
  age: number
  sex: 'male' | 'female'
  reportSummary: string | null
  disclaimer: string | null
  parameters: BloodParameterOut[]
  anomalyCount: number

  // Analysis
  zscoreResult: ZScoreResultOut | null
  isolationForestResult: IFResultOut | null
  compareResult: CompareResultOut | null

  // Risk
  selectedSymptoms: string[]
  riskResult: RiskResultOut | null

  // Predict & Explain
  predictResult: PredictResultOut | null
  explainResult: ExplainResultOut | null

  // Actions
  setUploadResult: (params: BloodParameterOut[], summary: string | null, disclaimer: string | null, anomalyCount: number) => void
  setPatientInfo: (age: number, sex: 'male' | 'female') => void
  setZscoreResult: (r: ZScoreResultOut) => void
  setIsolationForestResult: (r: IFResultOut) => void
  setCompareResult: (r: CompareResultOut) => void
  toggleSymptom: (s: string) => void
  setRiskResult: (r: RiskResultOut) => void
  setPredictResult: (r: PredictResultOut) => void
  setExplainResult: (r: ExplainResultOut) => void
  reset: () => void
}

const initialState = {
  age: 30,
  sex: 'male' as const,
  reportSummary: null,
  disclaimer: null,
  parameters: [],
  anomalyCount: 0,
  zscoreResult: null,
  isolationForestResult: null,
  compareResult: null,
  selectedSymptoms: [],
  riskResult: null,
  predictResult: null,
  explainResult: null,
}

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setUploadResult: (parameters, reportSummary, disclaimer, anomalyCount) =>
    set({ parameters, reportSummary, disclaimer, anomalyCount }),

  setPatientInfo: (age, sex) => set({ age, sex }),

  setZscoreResult: (zscoreResult) => set({ zscoreResult }),
  setIsolationForestResult: (isolationForestResult) => set({ isolationForestResult }),
  setCompareResult: (compareResult) => set({ compareResult }),

  toggleSymptom: (s) =>
    set((state) => ({
      selectedSymptoms: state.selectedSymptoms.includes(s)
        ? state.selectedSymptoms.filter((x) => x !== s)
        : [...state.selectedSymptoms, s],
    })),

  setRiskResult: (riskResult) => set({ riskResult }),
  setPredictResult: (predictResult) => set({ predictResult }),
  setExplainResult: (explainResult) => set({ explainResult }),

  reset: () => set(initialState),
}))
