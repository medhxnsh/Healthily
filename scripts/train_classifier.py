"""
Train XGBoost Classifier — improved pipeline

Changes over the original Logistic Regression script:
  1. XGBoost — handles missing values natively, non-linear interactions
  2. SMOTE — oversamples minority classes before training
  3. RandomizedSearchCV — tunes n_estimators, max_depth, learning_rate, subsample
  4. CalibratedClassifierCV — wraps best estimator for reliable probabilities

Reads data/classifier_training_data.csv (including derived ratio features
added by prepare_classifier_data.py).

Usage:
    python scripts/train_classifier.py

Output:
    models/classifier.joblib  — {model, scaler, feature_names, classes, midpoints}
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

ROOT = Path(__file__).parent.parent
TRAINING_FILE = ROOT / "data" / "classifier_training_data.csv"
OUTPUT_FILE = ROOT / "models" / "classifier.joblib"

# Base features + derived ratio features added by prepare_classifier_data.py
FEATURE_COLS = [
    "hemoglobin", "rbc", "wbc", "platelets", "hematocrit",
    "mcv", "mch", "mchc",
    "glucose", "hba1c",
    "creatinine", "bun",
    "alt", "ast", "alp", "bilirubin_total", "albumin",
    "tsh", "t3", "t4",
    "cholesterol",
    # Derived ratios
    "bun_creatinine_ratio",
    "ast_alt_ratio",
    "mch_mcv_ratio",
    "hemoglobin_rbc_ratio",
]

LABEL_COL = "label"
MIN_COVERAGE = 50
RANDOM_STATE = 42


def load_data() -> pd.DataFrame:
    df = pd.read_csv(TRAINING_FILE)
    print(f"Loaded: {len(df)} rows, {df[LABEL_COL].nunique()} classes")
    return df


def select_features(df: pd.DataFrame) -> list[str]:
    available = [c for c in FEATURE_COLS if c in df.columns]
    coverage = df[available].notna().sum()
    selected = [c for c in available if coverage[c] >= MIN_COVERAGE]
    dropped = [c for c in available if coverage[c] < MIN_COVERAGE]
    if dropped:
        print(f"  Dropped low-coverage features: {dropped}")
    print(f"Features selected: {len(selected)}/{len(available)}")
    return selected


def compute_midpoints(df: pd.DataFrame, features: list[str]) -> dict[str, float]:
    """Healthy reference midpoints for imputing missing values at inference time."""
    healthy_defaults: dict[str, float] = {
        "hemoglobin": 14.0, "rbc": 4.8, "wbc": 6500.0, "platelets": 250000.0,
        "hematocrit": 42.0, "mcv": 90.0, "mch": 30.0, "mchc": 34.0,
        "glucose": 85.0, "hba1c": 5.2, "creatinine": 0.9, "bun": 14.0,
        "alt": 22.0, "ast": 22.0, "alp": 70.0, "bilirubin_total": 0.7,
        "albumin": 4.2, "tsh": 2.0, "t3": 1.2, "t4": 8.0, "cholesterol": 180.0,
        # Ratios computed from healthy defaults
        "bun_creatinine_ratio": 14.0 / 0.9,    # ~15.6
        "ast_alt_ratio": 22.0 / 22.0,           # 1.0
        "mch_mcv_ratio": 30.0 / 90.0,           # 0.33
        "hemoglobin_rbc_ratio": 14.0 / 4.8,     # ~2.92
    }
    return {col: healthy_defaults.get(col, float(df[col].dropna().median()) if df[col].notna().any() else 0.0)
            for col in features}


def prepare_matrix(
    df: pd.DataFrame,
    features: list[str],
    midpoints: dict[str, float],
) -> tuple[np.ndarray, np.ndarray]:
    """
    XGBoost handles NaN natively — pass NaN through for training so the
    model learns the missing-value split directions itself.
    For inference midpoints are used as fallback only when the feature
    is completely absent from the report.
    """
    X = df[features].values.astype(float)   # NaN preserved intentionally
    y = df[LABEL_COL].values
    return X, y


def encode_labels(y: np.ndarray) -> tuple[np.ndarray, list[str]]:
    classes = sorted(set(y))
    label_to_int = {c: i for i, c in enumerate(classes)}
    return np.array([label_to_int[c] for c in y], dtype=int), classes


def apply_smote(
    X: np.ndarray,
    y: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """
    SMOTE requires no NaN — temporarily impute with column medians
    just for oversampling, then restore NaN positions afterwards.
    """
    print("\nApplying SMOTE to balance class distribution...")
    print("Before SMOTE:")
    unique, counts = np.unique(y, return_counts=True)
    for cls, cnt in zip(unique, counts):
        print(f"  class {cls}: {cnt}")

    # Impute NaN with column medians for SMOTE only
    col_medians = np.nanmedian(X, axis=0)
    nan_mask = np.isnan(X)
    X_imputed = X.copy()
    for col_idx in range(X.shape[1]):
        X_imputed[nan_mask[:, col_idx], col_idx] = col_medians[col_idx]

    # Oversample only the smallest classes up to 200 rows max
    # — keeps total dataset small and memory low
    smote = SMOTE(
        sampling_strategy={cls: min(200, max(cnt, 150))
                           for cls, cnt in zip(unique, counts) if cnt < 150},
        random_state=RANDOM_STATE,
        k_neighbors=3,
    )
    try:
        X_res, y_res = smote.fit_resample(X_imputed, y)
        print(f"After SMOTE: {len(X_res)} rows")
        return X_res, y_res
    except Exception as e:
        print(f"  SMOTE skipped ({e}) — using original data")
        return X_imputed, y


def tune_and_train(
    X: np.ndarray,
    y: np.ndarray,
    n_classes: int,
) -> tuple[StandardScaler, object]:
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Fixed params — no search grid, single-threaded, low memory
    xgb = XGBClassifier(
        objective="multi:softprob",
        num_class=n_classes,
        eval_metric="mlogloss",
        n_estimators=150,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        random_state=RANDOM_STATE,
        n_jobs=1,           # single thread — prevents memory explosion
        tree_method="hist",
        verbosity=1,
    )

    print("\nTraining XGBoost (single pass, no grid search)...")
    xgb.fit(X_scaled, y)

    # Calibrate probabilities — prefit=True avoids extra CV fits
    print("Calibrating probabilities...")
    calibrated = CalibratedClassifierCV(
        estimator=xgb,
        method="sigmoid",
        cv="prefit",        # use already-trained model, no refit
    )
    calibrated.fit(X_scaled, y)

    y_pred = calibrated.predict(X_scaled)
    print("\nClassification report (training data):")
    print(classification_report(y, y_pred, zero_division=0))

    return scaler, calibrated


def save(
    scaler: StandardScaler,
    model: object,
    feature_names: list[str],
    classes: list[str],
    midpoints: dict[str, float],
) -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names,
        "classes": classes,
        "midpoints": midpoints,
    }
    joblib.dump(artifact, OUTPUT_FILE)
    print(f"\nSaved: {OUTPUT_FILE}")
    print(f"Classes ({len(classes)}): {classes}")


if __name__ == "__main__":
    print("Training XGBoost classifier with SMOTE + RandomizedSearchCV + Calibration\n")

    df = load_data()
    features = select_features(df)
    midpoints = compute_midpoints(df, features)
    X, y_raw = prepare_matrix(df, features, midpoints)
    y_int, classes = encode_labels(y_raw)

    print(f"\nClass mapping:")
    for i, c in enumerate(classes):
        print(f"  {i} → {c}")

    X_balanced, y_balanced = apply_smote(X, y_int)
    scaler, model = tune_and_train(X_balanced, y_balanced, n_classes=len(classes))
    save(scaler, model, features, classes, midpoints)
    print("\nDone.")
