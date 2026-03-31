import re

_ALIASES = {
    "hemoglobin":       ["hemoglobin", "hb", "hgb", "haemoglobin"],
    "rbc":              ["rbc", "red blood cells", "red blood cell count", "erythrocytes", "red blood cell"],
    "wbc":              ["wbc", "white blood cells", "white blood cell count", "leukocytes", "tbc", "white blood cell"],
    "platelets":        ["platelets", "plt", "platelet count", "thrombocytes"],
    "hematocrit":       ["hematocrit", "hct", "packed cell volume", "pcv"],
    "mcv":              ["mcv", "mean corpuscular volume", "mean cell volume"],
    "mch":              ["mch", "mean corpuscular hemoglobin", "mean cell hemoglobin"],
    "mchc":             ["mchc", "mean corpuscular hemoglobin concentration", "mean cell hb conc"],
    "rdw":              ["rdw", "red cell dist width", "red blood cell distribution width"]
}

_ALIAS_MAP = {
    alias: canonical
    for canonical, aliases in _ALIASES.items()
    for alias in aliases
}

def normalize_name(raw: str) -> str | None:
    key = raw.strip().lower()
    if key in _ALIAS_MAP:
        return _ALIAS_MAP[key]
        
    best_match = None
    best_len = 0
    for alias, canonical in _ALIAS_MAP.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', key):
            if len(alias) > best_len:
                best_match = canonical
                best_len = len(alias)
    return best_match

tests = [
    "White Blood Cell (WBC)",
    "Red Blood Cell (RBC)",
    "Hemoglobin (HB/Hgb)",
    "Hematocrit (HCT)",
    "Mean Cell Volume (MCV)",
    "Mean Cell Hemoglobin (MCH)",
    "Mean Cell Hb Conc (MCHC)",
    "Red Cell Dist Width (RDW)",
    "Platelet count",
    "Mean Platelet Volume",
    "Absolute Neutrophil"
]

for t in tests:
    print(f"{t} -> {normalize_name(t)}")
