# -*- coding: utf-8 -*-
"""
TNT连续生产线反向调度优化模型

功能:
    输入目标每日TNT产量和XH2进料路线，反向计算推荐投料流量。

单位:
    1. 所有投料和工段流量单位为 L/min。
    2. 库存体积单位为 L。
    3. TNT日产量单位为 吨/日。

运行:
    python tnt_continuous_reverse_model.py
"""

import os
import tempfile
import unicodedata
from pathlib import Path

from pyomo.environ import (
    ConcreteModel,
    Constraint,
    NonNegativeReals,
    Objective,
    RangeSet,
    SolverFactory,
    Var,
    minimize,
    value,
)
from pyomo.opt import TerminationCondition


MINUTES_PER_DAY = 24 * 60
PERIODS_PER_DAY = 24
PERIOD_LENGTH_MIN = 60.0
KG_PER_TON = 1000.0

TNT_LIQUID_DENSITY_KG_PER_L = 1.50
TNT_SOLID_DENSITY_KG_PER_L = 1.65
PRODUCT_DAILY_LIMIT_TON = 110.0

INPUT_RANGES = {
    "JB": (0.0, 50.0),
    "EXTRA_INTERMEDIATE": (0.0, 50.0),
    "YLSN": (0.0, 50.0),
}

EXTRA_INTERMEDIATE_MIN_PER_JB = 0.30
EXTRA_INTERMEDIATE_MAX_PER_JB = 2.10

REFERENCE_JB_LPM = 16.0
REFERENCE_EXTRA_INTERMEDIATE_LPM = 33.0
YLSN_PER_JZ_FEED = 0.40

ACID_MIN_PER_JB = 2.4
ACID_MAX_PER_JB = 2.8
ACID_CONSUMED_PER_JB = 0.40

# XH1中，JB生成XH2进料组分的体积换算系数。
# MXX路线时表示生成MXX，LDX路线时表示生成LDX。
JB_DENSITY_KG_PER_L = 0.867
INTERMEDIATE_DENSITY_KG_PER_L = 1.16
JB_MW_KG_PER_KMOL = 92.14
INTERMEDIATE_MW_KG_PER_KMOL = 137.14
INTERMEDIATE_REACTION_YIELD = 0.96
JB_TO_INTERMEDIATE_FACTOR = (
    JB_DENSITY_KG_PER_L
    / JB_MW_KG_PER_KMOL
    * INTERMEDIATE_MW_KG_PER_KMOL
    / INTERMEDIATE_DENSITY_KG_PER_L
    * INTERMEDIATE_REACTION_YIELD
)

MXXFLC_RECOVERY = 0.96

YIELD = {
    "XH2_TO_DXX": 0.98,
    "XH3_TO_CRUDE": 1.06,
    "YX_TO_YX_OUT": 0.99,
    "JZ_TO_JZ_OUT": 0.945,
    "XDJ_TO_XD_OUT": 0.995,
    "SHJ_TO_SH_OUT": 0.995,
    "ZPJ_TO_TNT": 0.99,
}

VOLUME_L = {
    "XH1": 4900.0,
    "XH2": 4600.0,
    "XH3": 5000.0,
    "YX": 300.0,
    "JZ": 1200.0,
}

# CSTR停留时间，单位 min。这里是体积/负荷约束，不是STN时间延迟。
RESIDENCE_TIME_MIN = {
    "XH1": 18.0,
    "XH2": 17.0,
    "XH3": 21.0,
    "YX": 4.0,
    "JZ": 17.0,
}

RAMP_LIMIT_LPM_PER_PERIOD = 3.0

CAPACITY_LPM = {
    "MXXFLC": 200.0,
    "XDJ": 56.0,
    "SHJ": 55.0,
    "ZPJ": 54.0,
}


def read_number_input(prompt, lower, upper, unit):
    text = input(f"{prompt} [{lower:g}-{upper:g} {unit}]: ").strip()
    if not text:
        raise ValueError(f"{prompt} 不能为空，请输入 {lower:g}-{upper:g} {unit} 范围内的数值。")
    original_text = text
    text = unicodedata.normalize("NFKC", text)
    text = (
        text.replace("．", ".")
        .replace("。", ".")
        .replace("，", ".")
        .replace(",", ".")
    )
    try:
        number = float(text)
    except ValueError:
        raise ValueError(f"{prompt} 输入的不是有效数字: {original_text}")
    if number < lower or number > upper:
        raise ValueError(f"{prompt} 必须在 {lower:g}-{upper:g} {unit} 范围内。")
    return number


def read_route_input():
    text = input("XH2路线，请输入 MXX 或 LDX: ").strip().upper()
    if text not in {"MXX", "LDX"}:
        raise ValueError("XH2路线必须是 MXX 或 LDX。")
    return text


def build_data(target_product_ton_per_day, xh2_route):
    xh2_route = xh2_route.upper()
    if xh2_route not in {"MXX", "LDX"}:
        raise ValueError("XH2路线必须是 MXX 或 LDX。")
    if target_product_ton_per_day < 0 or target_product_ton_per_day > PRODUCT_DAILY_LIMIT_TON:
        raise ValueError(f"目标TNT日产量必须在 0-{PRODUCT_DAILY_LIMIT_TON:g} 吨/日范围内。")
    return {
        "target_product_ton_per_day": target_product_ton_per_day,
        "xh2_route": xh2_route,
    }


def build_model(data):
    target_product = data["target_product_ton_per_day"]

    model = ConcreteModel(name="tnt_continuous_cstr_reverse_scheduling")
    model.T = RangeSet(1, PERIODS_PER_DAY)

    # 反向优化中，这三个是要求解的当前投料流量。
    model.jb_input = Var(domain=NonNegativeReals)
    model.extra_intermediate_input = Var(domain=NonNegativeReals)
    model.ylsn_input = Var(domain=NonNegativeReals)

    # 与典型工况的正负偏差，用线性形式表示绝对值。
    model.jb_dev_pos = Var(domain=NonNegativeReals)
    model.jb_dev_neg = Var(domain=NonNegativeReals)
    model.extra_dev_pos = Var(domain=NonNegativeReals)
    model.extra_dev_neg = Var(domain=NonNegativeReals)

    # 每小时物料流量变量
    model.line_load = Var(model.T, domain=NonNegativeReals)
    model.jb_feed = Var(model.T, domain=NonNegativeReals)
    model.extra_intermediate_feed = Var(model.T, domain=NonNegativeReals)
    model.acid_feed = Var(model.T, domain=NonNegativeReals)
    model.acid_consumed = Var(model.T, domain=NonNegativeReals)
    model.waste_acid = Var(model.T, domain=NonNegativeReals)
    model.xh1_intermediate_component = Var(model.T, domain=NonNegativeReals)
    model.xh1_out = Var(model.T, domain=NonNegativeReals)
    model.intermediate_from_mxxflc = Var(model.T, domain=NonNegativeReals)


    # 三段硝化连续串联中的关键流量
    model.xh2_feed = Var(model.T, domain=NonNegativeReals)
    model.xh2_out = Var(model.T, domain=NonNegativeReals)
    model.xh3_feed = Var(model.T, domain=NonNegativeReals)
    model.xh3_out = Var(model.T, domain=NonNegativeReals)

    model.yx_feed = Var(model.T, domain=NonNegativeReals)
    model.yx_out = Var(model.T, domain=NonNegativeReals)
    model.jz_feed = Var(model.T, domain=NonNegativeReals)
    model.ylsn_feed = Var(model.T, domain=NonNegativeReals)
    model.jz_out = Var(model.T, domain=NonNegativeReals)
    model.xdj_out = Var(model.T, domain=NonNegativeReals)
    model.shj_out = Var(model.T, domain=NonNegativeReals)
    model.zpj_feed = Var(model.T, domain=NonNegativeReals)
    model.tnt_liquid_lpm = Var(model.T, domain=NonNegativeReals)

    model.product_ton_day = Var(domain=NonNegativeReals)

    # 投料范围约束。
    model.jb_input_range = Constraint(expr=model.jb_input <= INPUT_RANGES["JB"][1])
    model.extra_input_range = Constraint(
        expr=model.extra_intermediate_input <= INPUT_RANGES["EXTRA_INTERMEDIATE"][1]
    )
    model.extra_input_min_ratio = Constraint(
        expr=model.extra_intermediate_input
        >= EXTRA_INTERMEDIATE_MIN_PER_JB * model.jb_input
    )
    model.extra_input_max_ratio = Constraint(
        expr=model.extra_intermediate_input
        <= EXTRA_INTERMEDIATE_MAX_PER_JB * model.jb_input
    )
    model.ylsn_input_range = Constraint(expr=model.ylsn_input <= INPUT_RANGES["YLSN"][1])
    model.jb_deviation_balance = Constraint(
        expr=model.jb_input - REFERENCE_JB_LPM == model.jb_dev_pos - model.jb_dev_neg
    )
    model.extra_deviation_balance = Constraint(
        expr=model.extra_intermediate_input - REFERENCE_EXTRA_INTERMEDIATE_LPM
        == model.extra_dev_pos - model.extra_dev_neg
    )

    # 当前推荐投料流量在24小时内保持稳定。
    model.jb_supply = Constraint(model.T, rule=lambda m, t: m.jb_feed[t] == m.jb_input)
    model.extra_supply = Constraint(
        model.T, rule=lambda m, t: m.extra_intermediate_feed[t] == m.extra_intermediate_input
    )
    model.ylsn_supply = Constraint(model.T, rule=lambda m, t: m.ylsn_feed[t] <= m.ylsn_input)

    model.line_load_balance = Constraint(
        model.T,
        rule=lambda m, t: m.line_load[t] == m.jb_feed[t] + m.extra_intermediate_feed[t],
    )

    def ramp_up_rule(m, t):
        if t == 1:
            return Constraint.Skip
        return m.line_load[t] - m.line_load[t - 1] <= RAMP_LIMIT_LPM_PER_PERIOD

    def ramp_down_rule(m, t):
        if t == 1:
            return Constraint.Skip
        return m.line_load[t - 1] - m.line_load[t] <= RAMP_LIMIT_LPM_PER_PERIOD

    model.ramp_up = Constraint(model.T, rule=ramp_up_rule)
    model.ramp_down = Constraint(model.T, rule=ramp_down_rule)

    model.acid_min = Constraint(
        model.T, rule=lambda m, t: m.acid_feed[t] >= ACID_MIN_PER_JB * m.jb_feed[t]
    )
    model.acid_max = Constraint(
        model.T, rule=lambda m, t: m.acid_feed[t] <= ACID_MAX_PER_JB * m.jb_feed[t]
    )
    model.acid_consumed_balance = Constraint(
        model.T,
        rule=lambda m, t: m.acid_consumed[t] == ACID_CONSUMED_PER_JB * m.jb_feed[t],
    )
    model.waste_acid_balance = Constraint(
        model.T, rule=lambda m, t: m.waste_acid[t] == m.acid_feed[t] - m.acid_consumed[t]
    )

    model.xh1_intermediate_component_balance = Constraint(
        model.T,
        rule=lambda m, t: m.xh1_intermediate_component[t]
        == JB_TO_INTERMEDIATE_FACTOR * m.jb_feed[t] + m.extra_intermediate_feed[t],
    )
    model.xh1_out_balance = Constraint(
        model.T,
        rule=lambda m, t: m.xh1_out[t] == m.xh1_intermediate_component[t] + m.waste_acid[t],
    )
    model.mxxflc_capacity = Constraint(
        model.T, rule=lambda m, t: m.xh1_out[t] <= CAPACITY_LPM["MXXFLC"]
    )
    model.mxxflc_recovery = Constraint(
        model.T,
        rule=lambda m, t: m.intermediate_from_mxxflc[t]
        == MXXFLC_RECOVERY * m.xh1_intermediate_component[t],
    )

    # 无中间罐，XH1/MXXFLC/XH2/XH3直接连续耦合。
    model.xh2_direct_coupling = Constraint(
        model.T, rule=lambda m, t: m.xh2_feed[t] == m.intermediate_from_mxxflc[t]
    )
    model.xh2_out_balance = Constraint(
        model.T, rule=lambda m, t: m.xh2_out[t] == YIELD["XH2_TO_DXX"] * m.xh2_feed[t]
    )
    model.xh3_direct_coupling = Constraint(
        model.T, rule=lambda m, t: m.xh3_feed[t] == m.xh2_out[t]
    )
    model.xh3_out_balance = Constraint(
        model.T, rule=lambda m, t: m.xh3_out[t] == YIELD["XH3_TO_CRUDE"] * m.xh3_feed[t]
    )

    model.xh1_cstr_volume = Constraint(
        model.T,
        rule=lambda m, t: (m.line_load[t] + m.acid_feed[t])
        * RESIDENCE_TIME_MIN["XH1"]
        <= 0.8 * VOLUME_L["XH1"],
    )
    model.xh2_cstr_volume = Constraint(
        model.T,
        rule=lambda m, t: (m.xh2_feed[t] + m.acid_feed[t])
        * RESIDENCE_TIME_MIN["XH2"]
        <= 0.8 * VOLUME_L["XH2"],
    )
    model.xh3_cstr_volume = Constraint(
        model.T,
        rule=lambda m, t: (m.xh3_feed[t] + m.acid_feed[t])
        * RESIDENCE_TIME_MIN["XH3"]
        <= 0.8 * VOLUME_L["XH3"],
    )

    model.yx_feed_balance = Constraint(model.T, rule=lambda m, t: m.yx_feed[t] == m.xh3_out[t])
    model.yx_volume = Constraint(
        model.T,
        rule=lambda m, t: m.yx_feed[t] * RESIDENCE_TIME_MIN["YX"] <= 0.8 * VOLUME_L["YX"],
    )
    model.yx_out_balance = Constraint(
        model.T, rule=lambda m, t: m.yx_out[t] == YIELD["YX_TO_YX_OUT"] * m.yx_feed[t]
    )
    model.jz_feed_balance = Constraint(model.T, rule=lambda m, t: m.jz_feed[t] == m.yx_out[t])
    model.jz_volume = Constraint(
        model.T,
        rule=lambda m, t: m.jz_feed[t] * RESIDENCE_TIME_MIN["JZ"] <= 0.8 * VOLUME_L["JZ"],
    )
    model.ylsn_ratio = Constraint(model.T, rule=lambda m, t: m.ylsn_feed[t] == YLSN_PER_JZ_FEED * m.jz_feed[t])
    model.jz_out_balance = Constraint(
        model.T, rule=lambda m, t: m.jz_out[t] == YIELD["JZ_TO_JZ_OUT"] * m.jz_feed[t]
    )
    model.xdj_capacity = Constraint(model.T, rule=lambda m, t: m.jz_out[t] <= CAPACITY_LPM["XDJ"])
    model.xdj_out_balance = Constraint(
        model.T, rule=lambda m, t: m.xdj_out[t] == YIELD["XDJ_TO_XD_OUT"] * m.jz_out[t]
    )
    model.shj_capacity = Constraint(model.T, rule=lambda m, t: m.xdj_out[t] <= CAPACITY_LPM["SHJ"])
    model.shj_out_balance = Constraint(
        model.T, rule=lambda m, t: m.shj_out[t] == YIELD["SHJ_TO_SH_OUT"] * m.xdj_out[t]
    )

    model.zpj_capacity = Constraint(model.T, rule=lambda m, t: m.zpj_feed[t] <= CAPACITY_LPM["ZPJ"])
    model.zpj_feed_balance = Constraint(model.T, rule=lambda m, t: m.zpj_feed[t] == m.shj_out[t])
    model.tnt_liquid_balance = Constraint(
        model.T, rule=lambda m, t: m.tnt_liquid_lpm[t] == YIELD["ZPJ_TO_TNT"] * m.zpj_feed[t]
    )
    model.product_ton_day_balance = Constraint(
        expr=model.product_ton_day
        == sum(
            model.tnt_liquid_lpm[t]
            * TNT_LIQUID_DENSITY_KG_PER_L
            * PERIOD_LENGTH_MIN
            / KG_PER_TON
            for t in model.T
        )
    )
    model.target_product = Constraint(expr=model.product_ton_day == target_product)
    model.product_daily_limit = Constraint(expr=model.product_ton_day <= PRODUCT_DAILY_LIMIT_TON)

    # 在满足目标产量和工艺约束的前提下，尽量接近典型稳定工况。
    model.objective = Objective(
        expr=model.jb_dev_pos
        + model.jb_dev_neg
        + model.extra_dev_pos
        + model.extra_dev_neg,
        sense=minimize,
    )

    return model


def solve_model(model, solver_name="glpk"):
    temp_dir = Path(__file__).resolve().parent / ".tmp"
    temp_dir.mkdir(exist_ok=True)
    os.environ["TMP"] = str(temp_dir)
    os.environ["TEMP"] = str(temp_dir)
    tempfile.tempdir = str(temp_dir)

    if solver_name == "glpk":
        glpsol_path = Path(r"D:\Anaconda\Library\bin\glpsol.exe")
        solver = (
            SolverFactory("glpk", executable=str(glpsol_path))
            if glpsol_path.exists()
            else SolverFactory("glpk")
        )
    else:
        solver = SolverFactory(solver_name)

    if not solver.available(exception_flag=False):
        raise RuntimeError(
            f"求解器 '{solver_name}' 不可用。请安装GLPK，或将solver_name改成其他求解器。"
        )
    return solver.solve(model)


def clean(var):
    number = value(var)
    return 0.0 if abs(number) < 1e-8 else number


def average(model, var):
    return sum(clean(var[t]) for t in model.T) / PERIODS_PER_DAY


def print_solution(model, data):
    route = data["xh2_route"]
    component_name = "LDX" if route == "LDX" else "MXX"
    print("\nTNT连续生产线反向优化结果")
    print("------------------------")
    print(f"目标每日TNT产量: {data['target_product_ton_per_day']:.2f} 吨/日")
    print(f"实际每日TNT产量: {clean(model.product_ton_day):.2f} 吨/日")
    print(f"XH2进料路线: {route}")
    print(f"XH3段后粗制TNT流量: {average(model, model.xh3_out):.2f} L/min")

    print("\n推荐当前投料")
    print("------------")
    print(f"JB投料: {clean(model.jb_input):.2f} L/min")
    print(f"额外加入{component_name}: {clean(model.extra_intermediate_input):.2f} L/min")
    print(f"系统酸投料: {average(model, model.acid_feed):.2f} L/min")
    print(f"YLSN投料: {clean(model.ylsn_input):.2f} L/min")
    print(f"统一生产负荷: {average(model, model.line_load):.2f} L/min")

    print("\n关键连续流量")
    print("------------")
    print(
        f"MXXFLC产出{component_name}: "
        f"{average(model, model.intermediate_from_mxxflc):.2f} L/min"
    )
    print(f"XH2进料: {average(model, model.xh2_feed):.2f} L/min")
    print(f"XH2出料: {average(model, model.xh2_out):.2f} L/min")
    print(f"XH3进料: {average(model, model.xh3_feed):.2f} L/min")
    print(f"XH3出料: {average(model, model.xh3_out):.2f} L/min")
    print(f"ZPJ进料: {average(model, model.zpj_feed):.2f} L/min")

    print("\n最终产品")
    print("--------")
    print(f"每日TNT产量: {clean(model.product_ton_day):.2f} 吨/日")


def read_user_inputs():
    print("请输入反向优化目标。")
    target_product = read_number_input(
        "目标每日TNT产量", 0.0, PRODUCT_DAILY_LIMIT_TON, "吨/日"
    )
    xh2_route = read_route_input()
    return target_product, xh2_route


def main():
    target_product, xh2_route = read_user_inputs()
    data = build_data(target_product, xh2_route)
    model = build_model(data)
    result = solve_model(model)
    print(f"求解状态: {result.solver.termination_condition}")
    if result.solver.termination_condition != TerminationCondition.optimal:
        print("模型未得到最优可行解。请降低目标日产量，或检查设备能力和投料范围。")
        return
    print_solution(model, data)


if __name__ == "__main__":
    main()
