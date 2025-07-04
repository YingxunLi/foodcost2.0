import pandas as pd
import numpy as np

# 读取CSV文件 - 添加更多参数来处理格式问题
try:
    # 尝试1：使用latin-1编码和更宽松的参数
    df = pd.read_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI per capita, PPP (constant 2021 international $).csv', 
                     encoding='latin-1', 
                     sep=',',
                     quotechar='"',
                     skipinitialspace=True,
                     on_bad_lines='skip')  # 跳过有问题的行
    print("成功读取CSV文件")
except Exception as e:
    print(f"第一次尝试失败: {e}")
    try:
        # 尝试2：使用更宽松的参数
        df = pd.read_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI per capita, PPP (constant 2021 international $).csv', 
                         encoding='latin-1', 
                         sep=',',
                         error_bad_lines=False,  # 对于较老版本的pandas
                         warn_bad_lines=True)
        print("使用较老版本参数成功读取CSV文件")
    except Exception as e2:
        print(f"第二次尝试失败: {e2}")
        # 尝试3：手动处理
        df = pd.read_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI per capita, PPP (constant 2021 international $).csv', 
                         encoding='latin-1', 
                         sep=',',
                         engine='python',  # 使用Python引擎而不是C引擎
                         on_bad_lines='skip')

# 显示数据框的基本信息
print("数据框形状:", df.shape)
print("列名:", df.columns.tolist())
print("前5行数据:")
print(df.head())

# 创建TagGNI列，将2021年的数据除以361
# 首先处理".."值（缺失值），将其转换为NaN
df['2021 [YR2021]'] = df['2021 [YR2021]'].replace('..', np.nan)

# 转换为数值类型
df['2021 [YR2021]'] = pd.to_numeric(df['2021 [YR2021]'], errors='coerce')

# 创建TagGNI列
df['TagGNI'] = df['2021 [YR2021]'] / 361

# 保存新的CSV文件
df.to_csv('/Users/liburang/Documents/SoSe2025/PE2/foodcost/foodcost 2.0/foodcost2.0/data/GNI_with_TagGNI.csv', index=False)

# 显示前几行以验证结果
print("处理后的数据预览:")
print(df[['Country Name', '2021 [YR2021]', 'TagGNI']].head(10))

# 显示统计信息
print("\nTagGNI列的统计信息:")
print(df['TagGNI'].describe())