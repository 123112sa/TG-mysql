# -*- coding: utf-8 -*-
"""
TNT连续生产线调度优化模型

单位:
    1. 流量单位为 L/min。
    2. 库存体积单位为 L。
    3. TNT日产量单位为 吨/日。

运行:
    python tnt_continuous_scheduling_model.py
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
    maximize,
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
YLSN_MIN_PER_JZ_FEED = 0.30
YLSN_MAX_PER_JZ_FEED = 0.80

# XH段酸用量。酸在三段反应釜中按同一股循环酸占用容量估算。
ACID_MIN_PER_JB = 2.4
ACID_MAX_PER_JB = 2.8
ACID_CONSUMED_PER_JB = 0.40

# JB 到 XH1中间组分的体积换算系数。MXX路线时表示MXX，LDX路线时表示LDX。
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

# 串联反应与后处理传递系数。
YIELD = {
    "XH2_MXX_TO_DXX": 0.98,
    "XH3_TO_CRUDE": 1.06,
    "YX_TO_YX_OUT": 0.99,
    "JZ_TO_JZ_OUT": 0.945,
    "XDJ_TO_XD_OUT": 0.995,
    "SHJ_TO_SH_OUT": 0.995,
    "ZPJ_TO_TNT": 0.99,
}

# 设备容积，单位 L。
VOLUME_L = {
    "XH1": 4900.0,
    "XH2": 4600.0,
    "XH3": 5000.0,
    "YX": 300.0,
    "JZ": 1200.0,
}

# CSTR停留时间，单位 min。注意这里不是时间延迟，而是体积/负荷约束。
RESIDENCE_TIME_MIN = {
    "XH1": 18.0,
    "XH2": 17.0,
    "XH3": 21.0,
    "YX": 4.0,
    "JZ": 17.0,
}

# 没有中间罐时，连续生产线负荷不应剧烈波动。
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
    if "?" in text and "." not in text and text.count("?") == 1:
        text = text.replace("?", ".")
    try:
        number = float(text)
    except ValueError:
        raise ValueError(f"{prompt} 输入的不是有效数字: {original_text}")
    if number < lower or number > upper:
        raise ValueError(f"{prompt} 必须在 {lower:g}-{upper:g} {unit} 范围内。")
    return number


def build_data(raw_material_lpm, xh2_route):
    xh2_route = xh2_route.upper()
    if xh2_route not in {"MXX", "LDX"}:
        raise ValueError("XH2路线必须是 MXX 或 LDX。")
    return {"raw_material_lpm": raw_material_lpm, "xh2_route": xh2_route}


def build_model(data):
    raw = data["raw_material_lpm"]
    xh2_route = data["xh2_route"]
    model = ConcreteModel(name="tnt_continuous_cstr_scheduling")

    model.T = RangeSet(1, PERIODS_PER_DAY)

    # 统一生产负荷。三段硝化反应釜围绕这一条连续生产线负荷运行。
    model.line_load = Var(model.T, domain=NonNegativeReals)

    # XH段与分离物流。
    model.jb_feed = Var(model.T, domain=NonNegativeReals)
    model.extra_intermediate_feed = Var(model.T, domain=NonNegativeReals)
    model.acid_feed = Var(model.T, domain=NonNegativeReals)
    model.acid_consumed = Var(model.T, domain=NonNegativeReals)
    model.waste_acid = Var(model.T, domain=NonNegativeReals)
    model.xh1_intermediate_component = Var(model.T, domain=NonNegativeReals)
    model.xh1_out = Var(model.T, domain=NonNegativeReals)
    model.intermediate_from_mxxflc = Var(model.T, domain=NonNegativeReals)

    model.xh2_feed = Var(model.T, domain=NonNegativeReals)
    model.xh2_out = Var(model.T, domain=NonNegativeReals)
    model.xh3_feed = Var(model.T, domain=NonNegativeReals)
    model.xh3_out = Var(model.T, domain=NonNegativeReals)

    # 后处理物流。
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

    # 输入流量固定为用户给定值。
    model.jb_supply = Constraint(model.T, rule=lambda m, t: m.jb_feed[t] == raw["JB"])
    model.extra_intermediate_supply = Constraint(
        model.T, rule=lambda m, t: m.extra_intermediate_feed[t] == raw["EXTRA_INTERMEDIATE"]
    )
    model.ylsn_supply = Constraint(
        model.T, rule=lambda m, t: m.ylsn_feed[t] <= raw["YLSN"]
    )
    model.extra_intermediate_min_ratio = Constraint(
        model.T,
        rule=lambda m, t: m.extra_intermediate_feed[t]
        >= EXTRA_INTERMEDIATE_MIN_PER_JB * m.jb_feed[t],
    )
    model.extra_intermediate_max_ratio = Constraint(
        model.T,
        rule=lambda m, t: m.extra_intermediate_feed[t]
        <= EXTRA_INTERMEDIATE_MAX_PER_JB * m.jb_feed[t],
    )

    # 统一生产负荷定义。
    model.line_load_balance = Constraint(
        model.T,
        rule=lambda m, t: m.line_load[t] == m.jb_feed[t] + m.extra_intermediate_feed[t],
    )

    # 负荷平稳约束。没有中间罐时，相邻时段负荷不能大幅跳变。
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

    # 酸投料和废酸。
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

    # 第一类: 三段串联物料平衡。
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
    model.xh2_direct_coupling = Constraint(
        model.T, rule=lambda m, t: m.xh2_feed[t] == m.intermediate_from_mxxflc[t]
    )
    model.xh2_out_balance = Constraint(
        model.T, rule=lambda m, t: m.xh2_out[t] == YIELD["XH2_MXX_TO_DXX"] * m.xh2_feed[t]
    )
    model.xh3_direct_coupling = Constraint(
        model.T, rule=lambda m, t: m.xh3_feed[t] == m.xh2_out[t]
    )
    model.xh3_out_balance = Constraint(
        model.T, rule=lambda m, t: m.xh3_out[t] == YIELD["XH3_TO_CRUDE"] * m.xh3_feed[t]
    )

    # 第二类: CSTR体积/停留时间约束。这里没有时间延迟。
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

    # 后处理连续物料平衡。
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
    model.ylsn_ratio_min = Constraint(
        model.T,
        rule=lambda m, t: m.ylsn_feed[t] >= YLSN_MIN_PER_JZ_FEED * m.jz_feed[t],
    )
    model.ylsn_ratio_max = Constraint(
        model.T,
        rule=lambda m, t: m.ylsn_feed[t] <= YLSN_MAX_PER_JZ_FEED * m.jz_feed[t],
    )
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
    model.product_daily_limit = Constraint(expr=model.product_ton_day <= PRODUCT_DAILY_LIMIT_TON)

    model.objective = Objective(expr=model.product_ton_day, sense=maximize)

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
    print("\nTNT连续生产线调度优化结果")
    print("--------------------------")
    print(f"每日TNT产量: {clean(model.product_ton_day):.2f} 吨/日")
    print(f"XH3段后粗制TNT流量: {average(model, model.xh3_out):.2f} L/min")

    print("\n平均投料与负荷")
    print("--------------")
    print(f"XH2进料路线: {route}")
    print(f"JB投料: {average(model, model.jb_feed):.2f} L/min")
    print(
        f"额外加入{component_name}: "
        f"{average(model, model.extra_intermediate_feed):.2f} L/min"
    )
    print(f"系统酸投料: {average(model, model.acid_feed):.2f} L/min")
    print(f"YLSN投料: {average(model, model.ylsn_feed):.2f} L/min")
    print(f"统一生产负荷: {average(model, model.line_load):.2f} L/min")

    print("\n三段硝化连续串联流量")
    print("--------------------")
    print(f"XH1_OUT: {average(model, model.xh1_out):.2f} L/min")
    print(
        f"MXXFLC产出{component_name}: "
        f"{average(model, model.intermediate_from_mxxflc):.2f} L/min"
    )
    print(f"XH2进料: {average(model, model.xh2_feed):.2f} L/min")
    print(f"XH2出料: {average(model, model.xh2_out):.2f} L/min")
    print(f"XH3进料: {average(model, model.xh3_feed):.2f} L/min")
    print(f"XH3出料: {average(model, model.xh3_out):.2f} L/min")

    print("\n最终产品")
    print("--------")
    print(f"每日TNT产量: {clean(model.product_ton_day):.2f} 吨/日")


def diagnose_infeasible_input(raw_material, xh2_route):
    component_name = "LDX" if xh2_route == "LDX" else "MXX"
    jb = raw_material["JB"]
    extra = raw_material["EXTRA_INTERMEDIATE"]
    ylsn_available = raw_material["YLSN"]
    acid = ACID_MIN_PER_JB * jb
    acid_consumed = ACID_CONSUMED_PER_JB * jb
    waste_acid = acid - acid_consumed

    line_load = jb + extra
    xh1_component = JB_TO_INTERMEDIATE_FACTOR * jb + extra
    xh1_out = xh1_component + waste_acid
    intermediate = MXXFLC_RECOVERY * xh1_component
    xh2_out = YIELD["XH2_MXX_TO_DXX"] * intermediate
    xh3_out = YIELD["XH3_TO_CRUDE"] * xh2_out
    yx_out = YIELD["YX_TO_YX_OUT"] * xh3_out
    jz_feed = yx_out
    ylsn_required_min = YLSN_MIN_PER_JZ_FEED * jz_feed
    jz_out = YIELD["JZ_TO_JZ_OUT"] * jz_feed
    xdj_out = YIELD["XDJ_TO_XD_OUT"] * jz_out
    shj_out = YIELD["SHJ_TO_SH_OUT"] * xdj_out
    zpj_feed = shj_out
    tnt_lpm = YIELD["ZPJ_TO_TNT"] * zpj_feed
    product_ton_day = (
        tnt_lpm * TNT_LIQUID_DENSITY_KG_PER_L * MINUTES_PER_DAY / KG_PER_TON
    )

    reasons = []

    min_extra = EXTRA_INTERMEDIATE_MIN_PER_JB * jb
    max_extra = EXTRA_INTERMEDIATE_MAX_PER_JB * jb
    if extra < min_extra - 1e-8 or extra > max_extra + 1e-8:
        reasons.append(
            f"1. 额外加入{component_name}与JB比例不合理：当前 {extra:.2f} L/min，"
            f"允许范围为 {min_extra:.2f}-{max_extra:.2f} L/min。"
        )

    if ylsn_available < ylsn_required_min - 1e-8:
        reasons.append(
            f"2. YLSN输入量低于JZ最低需求：当前可用 {ylsn_available:.2f} L/min，"
            f"按最低比例需要约 {ylsn_required_min:.2f} L/min。"
        )

    capacity_checks = [
        (
            "MXXFLC",
            xh1_out,
            CAPACITY_LPM["MXXFLC"],
            "MXXFLC处理量超过设备能力",
        ),
        (
            "XH1",
            (line_load + acid) * RESIDENCE_TIME_MIN["XH1"],
            0.8 * VOLUME_L["XH1"],
            "XH1含酸液态体积占用超过有效容积",
        ),
        (
            "XH2",
            (intermediate + acid) * RESIDENCE_TIME_MIN["XH2"],
            0.8 * VOLUME_L["XH2"],
            "XH2含酸液态体积占用超过有效容积",
        ),
        (
            "XH3",
            (xh2_out + acid) * RESIDENCE_TIME_MIN["XH3"],
            0.8 * VOLUME_L["XH3"],
            "XH3含酸液态体积占用超过有效容积",
        ),
        (
            "YX",
            xh3_out * RESIDENCE_TIME_MIN["YX"],
            0.8 * VOLUME_L["YX"],
            "YX体积占用超过有效容积",
        ),
        (
            "JZ",
            jz_feed * RESIDENCE_TIME_MIN["JZ"],
            0.8 * VOLUME_L["JZ"],
            "JZ体积占用超过有效容积",
        ),
        ("XDJ", jz_out, CAPACITY_LPM["XDJ"], "XDJ处理量超过设备能力"),
        ("SHJ", xdj_out, CAPACITY_LPM["SHJ"], "SHJ处理量超过设备能力"),
        ("ZPJ", zpj_feed, CAPACITY_LPM["ZPJ"], "ZPJ处理量超过设备能力"),
    ]

    overloaded = [
        f"{name}: 需要 {used:.2f}，上限 {limit:.2f}（{message}）"
        for name, used, limit, message in capacity_checks
        if used > limit + 1e-8
    ]
    if overloaded:
        reasons.append("3. 设备能力或CSTR体积约束超限：\n   " + "\n   ".join(overloaded))

    if product_ton_day > PRODUCT_DAILY_LIMIT_TON + 1e-8:
        reasons.append(
            f"4. 按当前投料估算日产量约 {product_ton_day:.2f} 吨/日，"
            f"超过日产量上限 {PRODUCT_DAILY_LIMIT_TON:.2f} 吨/日。"
        )

    print("\n不可行原因诊断")
    print("--------------")
    if reasons:
        for reason in reasons:
            print(reason)
    else:
        print("未通过快速诊断定位到单一原因，可能是多个约束共同作用。")
    print("\n按当前输入的快速估算值")
    print("----------------------")
    print(f"MXXFLC产出{component_name}: {intermediate:.2f} L/min")
    print(f"XH3出料: {xh3_out:.2f} L/min")
    print(f"JZ进料: {jz_feed:.2f} L/min")
    print(f"YLSN最低需求: {ylsn_required_min:.2f} L/min")
    print(f"估算TNT日产量: {product_ton_day:.2f} 吨/日")


def read_user_inputs():
    print("请输入连续生产线投料流量，单位均为 L/min。")
    xh2_route = read_route_input()
    component_name = "LDX" if xh2_route == "LDX" else "MXX"
    raw_material = {
        "JB": read_number_input("JB投料流量", *INPUT_RANGES["JB"], "L/min"),
        "EXTRA_INTERMEDIATE": read_number_input(
            f"额外加入{component_name}流量",
            *INPUT_RANGES["EXTRA_INTERMEDIATE"],
            "L/min",
        ),
        "YLSN": read_number_input("YLSN投料流量", *INPUT_RANGES["YLSN"], "L/min"),
    }
    return raw_material, xh2_route


def read_route_input():
    text = input("XH2路线，请输入 MXX 或 LDX: ").strip().upper()
    if text not in {"MXX", "LDX"}:
        raise ValueError("XH2路线必须是 MXX 或 LDX。")
    return text


def main():
    raw_material, xh2_route = read_user_inputs()
    data = build_data(raw_material, xh2_route)
    model = build_model(data)
    result = solve_model(model)
    print(f"求解状态: {result.solver.termination_condition}")
    if result.solver.termination_condition != TerminationCondition.optimal:
        print("模型未得到最优可行解。请检查投料流量、CSTR容积约束或日产量上限。")
        diagnose_infeasible_input(raw_material, xh2_route)
        return
    print_solution(model, data)


if __name__ == "__main__":
    main()
