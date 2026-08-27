import os

import pandas as pd


def find_sheet_name(sheet_names, keywords_groups, default=None):
    """
    Try to find a sheet whose lowercase name contains all keywords in any of the keyword groups.
    keywords_groups: list of list of keywords, e.g. [["product", "master"], ["product"]]
    """
    lower_map = {name: name.lower() for name in sheet_names}
    for keywords in keywords_groups:
        for name, lower in lower_map.items():
            if all(k in lower for k in keywords):
                return name
    return default


def main():
    # 工作目录中的源文件
    workspace_dir = r"c:\Users\laptop\Desktop\prd_project\数据处理"
    input_filename = "85-89商品表.xlsx"
    input_path = os.path.join(workspace_dir, input_filename)

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"未找到源文件: {input_path}")

    # 加载 Excel
    xls = pd.ExcelFile(input_path)

    # 尝试自动识别两个 sheet：product_master 表 和 参考表catagory
    sheets = xls.sheet_names

    product_sheet = find_sheet_name(
        sheets,
        keywords_groups=[["product", "master"], ["product"], ["prod"]],
        default=sheets[0] if sheets else None,
    )
    category_sheet = find_sheet_name(
        sheets,
        keywords_groups=[["cat"], ["category"], ["参考"]],
        default=sheets[1] if len(sheets) > 1 else (sheets[0] if sheets else None),
    )

    if product_sheet is None or category_sheet is None:
        raise ValueError(
            f"无法识别需要的工作表，请检查文件内 sheet 名称。所有 sheet: {sheets}"
        )

    print(f"使用 product_master sheet: {product_sheet}")
    print(f"使用 参考表catagory sheet: {category_sheet}")

    df_prod = pd.read_excel(xls, sheet_name=product_sheet)
    df_cat = pd.read_excel(xls, sheet_name=category_sheet)

    # 统一列名为小写便于匹配
    prod_cols = {c.lower(): c for c in df_prod.columns}
    cat_cols = {c.lower(): c for c in df_cat.columns}

    def get_col(mapping, key_options):
        """在列名映射中按多个候选名称查找，返回真实列名或 None。"""
        for k in key_options:
            if k in mapping:
                return mapping[k]
        return None

    # 尝试识别 name / hs_code / category 列名
    prod_name_col = get_col(prod_cols, ["name", "product_name", "品名", "名称"])
    prod_hs_col = get_col(prod_cols, ["hs_code", "hs code", "hscode", "hs编码", "海关编码"])
    prod_l1_col = get_col(prod_cols, ["category_l1", "category1", "类目1", "一级类目"])
    prod_l2_col = get_col(prod_cols, ["category_l2", "category2", "类目2", "二级类目"])

    cat_name_col = get_col(cat_cols, ["name", "product_name", "品名", "名称"])
    cat_hs_col = get_col(cat_cols, ["hs_code", "hs code", "hscode", "hs编码", "海关编码"])
    cat_l1_col = get_col(cat_cols, ["category_l1", "category1", "类目1", "一级类目"])
    cat_l2_col = get_col(cat_cols, ["category_l2", "category2", "类目2", "二级类目"])

    missing_critical = []
    if not (prod_name_col or prod_hs_col):
        missing_critical.append("product_master: name / hs_code")
    if not (cat_name_col or cat_hs_col):
        missing_critical.append("参考表catagory: name / hs_code")
    if not (cat_l1_col and cat_l2_col):
        missing_critical.append("参考表catagory: category_l1 / category_l2")

    if missing_critical:
        raise ValueError(
            "关键列缺失，无法回填，请检查列名：\n" + "\n".join(f"- {m}" for m in missing_critical)
        )

    # 建立参考表的索引，方便多种匹配方式
    df_cat_work = df_cat.copy()
    if cat_hs_col:
        df_cat_work[cat_hs_col] = df_cat_work[cat_hs_col].astype(str).str.strip()
    if cat_name_col:
        df_cat_work[cat_name_col] = df_cat_work[cat_name_col].astype(str).str.strip()

    # 三种映射：name+hs, hs, name
    multi_key_map = {}
    hs_map = {}
    name_map = {}

    for _, row in df_cat_work.iterrows():
        l1 = row[cat_l1_col]
        l2 = row[cat_l2_col]

        if cat_hs_col and cat_name_col:
            k = (row[cat_hs_col], row[cat_name_col])
            if k not in multi_key_map:
                multi_key_map[k] = (l1, l2)
        if cat_hs_col:
            h = row[cat_hs_col]
            if h and h not in hs_map:
                hs_map[h] = (l1, l2)
        if cat_name_col:
            n = row[cat_name_col]
            if n and n not in name_map:
                name_map[n] = (l1, l2)

    # 确保 product 表有待回填的列
    if not prod_l1_col:
        prod_l1_col = "category_l1"
        if prod_l1_col not in df_prod.columns:
            df_prod[prod_l1_col] = None
    if not prod_l2_col:
        prod_l2_col = "category_l2"
        if prod_l2_col not in df_prod.columns:
            df_prod[prod_l2_col] = None

    # 统一 name / hs 字符串
    if prod_hs_col:
        df_prod[prod_hs_col] = df_prod[prod_hs_col].astype(str).str.strip()
    if prod_name_col:
        df_prod[prod_name_col] = df_prod[prod_name_col].astype(str).str.strip()

    filled_count = 0

    for idx, row in df_prod.iterrows():
        hs_val = row[prod_hs_col] if prod_hs_col else None
        name_val = row[prod_name_col] if prod_name_col else None

        l1_l2 = None

        # 1) 同时匹配 hs_code + name
        if hs_val and name_val and (cat_hs_col and cat_name_col):
            key = (hs_val, name_val)
            l1_l2 = multi_key_map.get(key)

        # 2) 只按 hs_code 匹配
        if l1_l2 is None and hs_val and cat_hs_col:
            l1_l2 = hs_map.get(hs_val)

        # 3) 只按 name 匹配
        if l1_l2 is None and name_val and cat_name_col:
            l1_l2 = name_map.get(name_val)

        if l1_l2 is not None:
            df_prod.at[idx, prod_l1_col] = l1_l2[0]
            df_prod.at[idx, prod_l2_col] = l1_l2[1]
            filled_count += 1

    print(f"成功回填 {filled_count} 行 category_l1/category_l2")

    # 输出到用户指定路径（D 盘）
    output_dir = r"d:\中企\需求\需求\15、客户管理new"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "85-89商品表_回填类目.xlsx")

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # 保留原有其他 sheet，只修改 product_master sheet
        # 先写所有原 sheet，product_sheet 用更新后的 df_prod
        for sheet_name in sheets:
            if sheet_name == product_sheet:
                df_prod.to_excel(writer, sheet_name=sheet_name, index=False)
            else:
                df_tmp = pd.read_excel(xls, sheet_name=sheet_name)
                df_tmp.to_excel(writer, sheet_name=sheet_name, index=False)

    print(f"已生成结果文件: {output_path}")


if __name__ == "__main__":
    main()

