import pandas as pd
import numpy as np

try:
    df = pd.read_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI per capita, PPP (constant 2021 international $).csv', 
                     encoding='latin-1', 
                     sep=',',
                     quotechar='"',
                     skipinitialspace=True,
                     on_bad_lines='skip')  
    print("successfully read CSV file with specified parameters")
except Exception as e:
    print(f"fail{e}")
    try:
        df = pd.read_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI per capita, PPP (constant 2021 international $).csv', 
                         encoding='latin-1', 
                         sep=',',
                         error_bad_lines=False, 
                         warn_bad_lines=True)
        print("successfully read CSV file with older version parameters")
    except Exception as e2:
        print(f"fail{e2}")
        df = pd.read_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI per capita, PPP (constant 2021 international $).csv', 
                         encoding='latin-1', 
                         sep=',',
                         engine='python', 
                         on_bad_lines='skip')

print("successfully read CSV file with python engine", df.shape)
print("columns:", df.columns.tolist())
print("first 5 rows:")
print(df.head())

df['2021 [YR2021]'] = df['2021 [YR2021]'].replace('..', np.nan)

df['2021 [YR2021]'] = pd.to_numeric(df['2021 [YR2021]'], errors='coerce')

df['TagGNI'] = df['2021 [YR2021]'] / 365

df.to_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI_with_TagGNI.csv', index=False)

print("processed data preview:")
print(df[['Country Name', '2021 [YR2021]', 'TagGNI']].head(10))

print("\nTagGNI column statistics:")
print(df['TagGNI'].describe())