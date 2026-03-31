import pandas as pd
import pathlib

def merge_hcv_data():
    base_dir = pathlib.Path(__file__).parent.parent
    classifier_data_path = base_dir / "data" / "classifier_training_data.csv"
    hcv_path = base_dir / "data" / "hcv_dataset.csv"
    
    # 1. Load the original training dataset
    df_train = pd.read_csv(classifier_data_path)
    print(f"Original training rows: {len(df_train)}")
    
    # 2. Load the newly downloaded HCV dataset
    df_hcv = pd.read_csv(hcv_path)
    print(f"HCV dataset rows: {len(df_hcv)}")
    
    # Clean up HCV dataset to match our columns
    # 'Category' -> label
    # 'ALB' -> albumin
    # 'ALP' -> alp
    # 'ALT' -> alt
    # 'AST' -> ast
    # 'BIL' -> bilirubin_total
    # 'CHOL' -> cholesterol
    rename_cols = {
        'ALB': 'albumin',
        'ALP': 'alp',
        'ALT': 'alt',
        'AST': 'ast',
        'BIL': 'bilirubin_total',
        'CHOL': 'cholesterol'
    }
    
    df_hcv_renamed = df_hcv.rename(columns=rename_cols)
    
    def map_category(cat):
        if str(cat).startswith('0'):
            return 'healthy'
        elif 'Hepatitis' in str(cat):
            return 'hepatitis'
        elif 'Fibrosis' in str(cat):
            return 'fibrosis'
        elif 'Cirrhosis' in str(cat):
            return 'cirrhosis'
        return 'liver_disease'
        
    df_hcv_renamed['label'] = df_hcv_renamed['Category'].apply(map_category)
    
    # Filter only columns we actually use in the model to concat correctly
    target_cols = set(df_train.columns)
    available_cols = [c for c in df_hcv_renamed.columns if c in target_cols]
    
    df_new = df_hcv_renamed[available_cols].copy()
    
    # Fill missing with NaNs (pandas does this automatically when concatenating)
    df_combined = pd.concat([df_train, df_new], ignore_index=True)
    
    # Drop completely identical duplicate rows just in case
    df_combined.drop_duplicates(inplace=True)
    
    df_combined.to_csv(classifier_data_path, index=False)
    print(f"Successfully merged! New training rows: {len(df_combined)}")

if __name__ == "__main__":
    merge_hcv_data()
