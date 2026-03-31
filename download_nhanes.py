import pandas as pd
import pathlib

def download_nhanes():
    import requests
    import os
    
    def download_file(url, local_path):
        print(f"Downloading {url} to {local_path}...")
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=headers, stream=True)
        r.raise_for_status()
        with open(local_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192): 
                f.write(chunk)
        return local_path

    demo_url = "https://wwwn.cdc.gov/Nchs/Nhanes/2017-2018/DEMO_J.XPT"
    demo_file = download_file(demo_url, "data/DEMO_J.XPT")
    demo_df = pd.read_sas(demo_file, format="xport")
    
    cbc_url = "https://wwwn.cdc.gov/Nchs/Nhanes/2017-2018/CBC_J.XPT"
    cbc_file = download_file(cbc_url, "data/CBC_J.XPT")
    cbc_df = pd.read_sas(cbc_file, format="xport")
    
    print("Merging datasets on SEQN (Respondent sequence number)...")
    merged = pd.merge(demo_df, cbc_df, on="SEQN", how="inner")
    
    # Select a few columns just for demonstration
    # WTSAF2YR is fasting weight -> not needed
    # LBXWBCSI is WBC
    # LBXRBCSI is RBC
    # LBXPLTSI is Platelets
    rename_cols = {
        "RIDAGEYR": "Age",
        "RIAGENDR": "Sex_1_M_2_F",
        "LBXWBCSI": "WBC",
        "LBXRBCSI": "RBC",
        "LBXHGB": "Hemoglobin",
        "LBXHCT": "Hematocrit",
        "LBXMCVSI": "MCV",
        "LBXMCHSI": "MCH",
        "LBXMC": "MCHC",
        "LBXRDW": "RDW",
        "LBXPLTSI": "Platelets",
        "LBXMPSI": "Mean_Platelet_Volume"
    }
    
    cols = list(rename_cols.keys())
    existing_cols = [c for c in cols if c in merged.columns]
    merged = merged[existing_cols].rename(columns=rename_cols)
    
    # Save the file
    out_path = pathlib.Path("data/nhanes_cbc_dataset.csv")
    out_path.parent.mkdir(exist_ok=True)
    merged.to_csv(out_path, index=False)
    print(f"Successfully downloaded and saved {len(merged)} rows to {out_path}")

if __name__ == "__main__":
    download_nhanes()
