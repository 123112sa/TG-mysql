# -*- coding: utf-8 -*-
"""
TNT杩炵画鐢熶骇绾?澶╂棩灏哄害闈炵嚎鎬фā鍨?杩愯:
    python tnt_daily_nonlinear_trial_model.py
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
    exp,
    minimize,
    value,
)
from pyomo.opt import TerminationCondition


MINUTES_PER_DAY = 24 * 60
KG_PER_TON = 1000.0
PLANNING_DAYS = 7
MIN_PLANNING_DAYS = 1
MAX_PLANNING_DAYS = 30

TNT_LIQUID_DENSITY_KG_PER_L = 1.50

MONDAY_PRODUCT_LIMIT_TON = 80.0
NORMAL_PRODUCT_LIMIT_TON = 110.0
WEEKLY_PRODUCT_LIMIT_TON = MONDAY_PRODUCT_LIMIT_TON + 6 * NORMAL_PRODUCT_LIMIT_TON

INPUT_RANGES = {
    "JB": (0.0, 50.0),
    "EXTRA_INTERMEDIATE": (0.0, 50.0),
    "YLSN": (0.0, 50.0),
}

EXTRA_INTERMEDIATE_MIN_PER_JB = 0.30
EXTRA_INTERMEDIATE_MAX_PER_JB = 2.10
YLSN_PER_JZ_FEED = 0.40

TEMP_MIN_C = 60.0
TEMP_SAFE_C = 85.0

DAILY_COOLING_FACTOR = {
    1: 0.94,
    2: 0.955,
    3: 1.00,
    4: 0.95,
    5: 0.99,
    6: 0.965,
    7: 0.975,
}

DAILY_OPERATION_COST_FACTOR = {
    1: 1.035,
    2: 0.985,
    3: 0.965,
    4: 1.020,
    5: 0.975,
    6: 1.015,
    7: 0.995,
}

RAW_COST = {
    "JB": 1.00,
    "EXTRA_INTERMEDIATE": 0.85,
    "ACID": 0.18,
    "YLSN": 0.50,
}
TEMP_OPERATION_COST = 0.03
INVENTORY_COST = 0.00002
DAILY_PRODUCT_PEAK_COST = 0.003
LINE_LOAD_RAMP_LIMIT_LPM = 15.0

# ZPJ鍓嶄骇鍝佹帴鍙楁Ы銆備负浣垮簱瀛樿兘澶熷奖鍝嶈法鏃ヨ皟搴︿紭鍖栵紝
ACCEPT_TANK_SAFETY_LEVEL = 0.80
ACCEPT_TANK_VOLUME_L = 100000.0
ACCEPT_TANK_WORKING_VOLUME_L = 80000.0
ACCEPT_TANK_OUTLET_MAX_LPM = 54.0
ACCEPT_TANK_OUTLET_RAMP_LIMIT_LPM = 15.0
INITIAL_ACCEPT_TANK_INVENTORY_L = 0.0
FINAL_ACCEPT_TANK_INVENTORY_L = 0.0

ACID_MIN_PER_JB = 2.4
ACID_MAX_PER_JB = 2.8
ACID_CONSUMED_PER_JB = 0.40

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

CONVERSION_ALPHA = {
    "XH1": 1.15,
    "XH2": 1.20,
    "XH3": 1.25,
}

XH3_CRUDE_VOLUME_FACTOR = 1.06

YIELD = {
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

RESIDENCE_TIME_MIN = {
    "YX": 4.0,
    "JZ": 17.0,
}

CAPACITY_LPM = {
    "MXXFLC": 200.0,
    "XDJ": 56.0,
    "SHJ": 55.0,
    "ZPJ": 54.0,
}

HEAT_FACTOR = {
    "XH1": 1.00,
    "XH2": 1.20,
    "XH3": 1.20,
}

COOLING_CAPACITY = {
    "XH1": 55.0,
    "XH2": 70.0,
    "XH3": 70.0,
}

DAY_NAMES = {
    1: "鍛ㄤ竴",
    2: "鍛ㄤ簩",
    3: "鍛ㄤ笁",
    4: "鍛ㄥ洓",
    5: "鍛ㄤ簲",
    6: "鍛ㄥ叚",
    7: "鍛ㄦ棩",
}


def normalize_planning_days(planning_days=None):
    days = PLANNING_DAYS if planning_days is None else int(planning_days)
    if days < MIN_PLANNING_DAYS or days > MAX_PLANNING_DAYS:
        raise ValueError(f"计划周期必须在 {MIN_PLANNING_DAYS}-{MAX_PLANNING_DAYS} 天之间。")
    return days


def normalize_start_weekday(start_weekday=0):
    weekday = int(start_weekday or 0)
    if weekday < 0 or weekday > 6:
        raise ValueError("开始日期星期索引必须在 0-6 之间。")
    return weekday


def weekday_key_for_day(day_index, start_weekday=0):
    return ((normalize_start_weekday(start_weekday) + int(day_index) - 1) % 7) + 1


def product_limit_for_day(day_index, start_weekday=0):
    weekday_key = weekday_key_for_day(day_index, start_weekday)
    return MONDAY_PRODUCT_LIMIT_TON if weekday_key == 1 else NORMAL_PRODUCT_LIMIT_TON


def total_product_limit(planning_days, start_weekday=0):
    days = normalize_planning_days(planning_days)
    return sum(product_limit_for_day(day, start_weekday) for day in range(1, days + 1))


def read_number_input(prompt, lower, upper, unit):
    text = input(f"{prompt} [{lower:g}-{upper:g} {unit}]: ").strip()
    if not text:
        raise ValueError(f"{prompt} 不能为空，请输入 {lower:g}-{upper:g} {unit} 范围内的数值。")
    original_text = text
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("，", ".").replace("。", ".").replace(",", ".")
    try:
        number = float(text)
    except ValueError as exc:
        raise ValueError(f"{prompt} 输入的不是有效数字：{original_text}") from exc
    if number < lower or number > upper:
        raise ValueError(f"{prompt} 必须在 {lower:g}-{upper:g} {unit} 范围内。")
    return number


def read_route_input():
    text = input("XH2路线，请输入 MXX 或 LDX: ").strip().upper()
    if text not in {"MXX", "LDX"}:
        raise ValueError("XH2路线必须是 MXX 或 LDX。")
    return text

def build_data(weekly_target_ton, xh2_route, planning_days=None, start_weekday=0):
    xh2_route = xh2_route.upper()
    if xh2_route not in {"MXX", "LDX"}:
        raise ValueError("XH2路线必须是 MXX 或 LDX。")
    planning_days = normalize_planning_days(planning_days)
    start_weekday = normalize_start_weekday(start_weekday)
    product_limit = total_product_limit(planning_days, start_weekday)
    if weekly_target_ton < 0 or weekly_target_ton > product_limit:
        raise ValueError(f"{planning_days}天总产量目标必须在 0-{product_limit:g} 吨范围内。")
    return {
        "weekly_target_ton": weekly_target_ton,
        "xh2_route": xh2_route,
        "planning_days": planning_days,
        "start_weekday": start_weekday,
    }


def build_model(data):
    model = ConcreteModel(name="tnt_daily_nonlinear_trial")
    planning_days = normalize_planning_days(data.get("planning_days", PLANNING_DAYS))
    start_weekday = normalize_start_weekday(data.get("start_weekday", 0))
    model.D = RangeSet(1, planning_days)

    model.jb_feed = Var(model.D, domain=NonNegativeReals, bounds=INPUT_RANGES["JB"])
    model.extra_intermediate_feed = Var(
        model.D, domain=NonNegativeReals, bounds=INPUT_RANGES["EXTRA_INTERMEDIATE"]
    )
    model.ylsn_feed = Var(model.D, domain=NonNegativeReals, bounds=INPUT_RANGES["YLSN"])
    model.line_load = Var(model.D, domain=NonNegativeReals)

    model.acid_feed = Var(model.D, domain=NonNegativeReals)
    model.acid_consumed = Var(model.D, domain=NonNegativeReals)
    model.waste_acid = Var(model.D, domain=NonNegativeReals)

    model.xh1_intermediate_component = Var(model.D, domain=NonNegativeReals)
    model.xh1_out = Var(model.D, domain=NonNegativeReals)
    model.intermediate_from_mxxflc = Var(model.D, domain=NonNegativeReals)
    model.xh1_temp_c = Var(model.D, bounds=(TEMP_MIN_C, TEMP_SAFE_C))
    model.xh1_tau = Var(model.D, domain=NonNegativeReals, bounds=(1.0, 120.0))
    model.xh1_conversion = Var(model.D, bounds=(0.0, 0.999))

    model.xh2_feed = Var(model.D, domain=NonNegativeReals)
    model.xh2_temp_c = Var(model.D, bounds=(TEMP_MIN_C, TEMP_SAFE_C))
    model.xh2_tau = Var(model.D, domain=NonNegativeReals, bounds=(1.0, 120.0))
    model.xh2_conversion = Var(model.D, bounds=(0.0, 0.999))
    model.xh2_out = Var(model.D, domain=NonNegativeReals)

    model.xh3_feed = Var(model.D, domain=NonNegativeReals)
    model.xh3_temp_c = Var(model.D, bounds=(TEMP_MIN_C, TEMP_SAFE_C))
    model.xh3_tau = Var(model.D, domain=NonNegativeReals, bounds=(1.0, 120.0))
    model.xh3_conversion = Var(model.D, bounds=(0.0, 0.999))
    model.xh3_out = Var(model.D, domain=NonNegativeReals)

    model.yx_feed = Var(model.D, domain=NonNegativeReals)
    model.yx_out = Var(model.D, domain=NonNegativeReals)
    model.jz_feed = Var(model.D, domain=NonNegativeReals)
    model.jz_out = Var(model.D, domain=NonNegativeReals)
    model.xdj_out = Var(model.D, domain=NonNegativeReals)
    model.shj_out = Var(model.D, domain=NonNegativeReals)
    model.zpj_feed = Var(model.D, domain=NonNegativeReals)
    model.tnt_liquid_lpm = Var(model.D, domain=NonNegativeReals)
    model.product_ton_day = Var(model.D, domain=NonNegativeReals)
    model.accept_tank_inventory_l = Var(
        model.D,
        domain=NonNegativeReals,
        bounds=(0.0, ACCEPT_TANK_WORKING_VOLUME_L),
    )

    model.xh1_heat_load = Var(model.D, domain=NonNegativeReals)
    model.xh2_heat_load = Var(model.D, domain=NonNegativeReals)
    model.xh3_heat_load = Var(model.D, domain=NonNegativeReals)

    model.extra_min_ratio = Constraint(
        model.D,
        rule=lambda m, d: m.extra_intermediate_feed[d]
        >= EXTRA_INTERMEDIATE_MIN_PER_JB * m.jb_feed[d],
    )
    model.extra_max_ratio = Constraint(
        model.D,
        rule=lambda m, d: m.extra_intermediate_feed[d]
        <= EXTRA_INTERMEDIATE_MAX_PER_JB * m.jb_feed[d],
    )
    model.line_load_balance = Constraint(
        model.D,
        rule=lambda m, d: m.line_load[d] == m.jb_feed[d] + m.extra_intermediate_feed[d],
    )

    def line_load_ramp_up_rule(m, d):
        if int(d) == 1:
            return Constraint.Skip
        return m.line_load[d] - m.line_load[int(d) - 1] <= LINE_LOAD_RAMP_LIMIT_LPM

    def line_load_ramp_down_rule(m, d):
        if int(d) == 1:
            return Constraint.Skip
        return m.line_load[int(d) - 1] - m.line_load[d] <= LINE_LOAD_RAMP_LIMIT_LPM

    model.line_load_ramp_up = Constraint(model.D, rule=line_load_ramp_up_rule)
    model.line_load_ramp_down = Constraint(model.D, rule=line_load_ramp_down_rule)

    model.acid_min = Constraint(
        model.D, rule=lambda m, d: m.acid_feed[d] >= ACID_MIN_PER_JB * m.jb_feed[d]
    )
    model.acid_max = Constraint(
        model.D, rule=lambda m, d: m.acid_feed[d] <= ACID_MAX_PER_JB * m.jb_feed[d]
    )
    model.acid_consumed_balance = Constraint(
        model.D,
        rule=lambda m, d: m.acid_consumed[d] == ACID_CONSUMED_PER_JB * m.jb_feed[d],
    )
    model.waste_acid_balance = Constraint(
        model.D, rule=lambda m, d: m.waste_acid[d] == m.acid_feed[d] - m.acid_consumed[d]
    )

    model.xh1_component_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh1_intermediate_component[d]
        == JB_TO_INTERMEDIATE_FACTOR * m.jb_feed[d] * m.xh1_conversion[d]
        + m.extra_intermediate_feed[d],
    )
    model.xh1_out_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh1_out[d] == m.xh1_intermediate_component[d] + m.waste_acid[d],
    )
    model.mxxflc_capacity = Constraint(
        model.D, rule=lambda m, d: m.xh1_out[d] <= CAPACITY_LPM["MXXFLC"]
    )
    model.mxxflc_recovery = Constraint(
        model.D,
        rule=lambda m, d: m.intermediate_from_mxxflc[d]
        == MXXFLC_RECOVERY * m.xh1_intermediate_component[d],
    )
    model.xh1_tau_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh1_tau[d] * (m.line_load[d] + m.acid_feed[d])
        == 0.8 * VOLUME_L["XH1"],
    )
    model.xh1_conversion_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh1_conversion[d]
        == 1
        - exp(
            -CONVERSION_ALPHA["XH1"]
            * m.xh1_temp_c[d]
            * m.xh1_tau[d]
            / 1000.0
        ),
    )

    model.xh2_direct_coupling = Constraint(
        model.D, rule=lambda m, d: m.xh2_feed[d] == m.intermediate_from_mxxflc[d]
    )
    model.xh2_tau_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh2_tau[d] * (m.xh2_feed[d] + m.acid_feed[d])
        == 0.8 * VOLUME_L["XH2"],
    )
    model.xh2_conversion_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh2_conversion[d]
        == 1
        - exp(
            -CONVERSION_ALPHA["XH2"]
            * m.xh2_temp_c[d]
            * m.xh2_tau[d]
            / 1000.0
        ),
    )
    model.xh2_out_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh2_out[d] == m.xh2_feed[d] * m.xh2_conversion[d],
    )

    model.xh3_direct_coupling = Constraint(
        model.D, rule=lambda m, d: m.xh3_feed[d] == m.xh2_out[d]
    )
    model.xh3_tau_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh3_tau[d] * (m.xh3_feed[d] + m.acid_feed[d])
        == 0.8 * VOLUME_L["XH3"],
    )
    model.xh3_conversion_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh3_conversion[d]
        == 1
        - exp(
            -CONVERSION_ALPHA["XH3"]
            * m.xh3_temp_c[d]
            * m.xh3_tau[d]
            / 1000.0
        ),
    )
    model.xh3_out_balance = Constraint(
        model.D,
        rule=lambda m, d: m.xh3_out[d]
        == XH3_CRUDE_VOLUME_FACTOR * m.xh3_feed[d] * m.xh3_conversion[d],
    )

    model.xh1_heat_balance = Constraint(
        model.D, rule=lambda m, d: m.xh1_heat_load[d] == HEAT_FACTOR["XH1"] * m.jb_feed[d]
    )
    model.xh2_heat_balance = Constraint(
        model.D, rule=lambda m, d: m.xh2_heat_load[d] == HEAT_FACTOR["XH2"] * m.xh2_feed[d]
    )
    model.xh3_heat_balance = Constraint(
        model.D, rule=lambda m, d: m.xh3_heat_load[d] == HEAT_FACTOR["XH3"] * m.xh3_feed[d]
    )
    model.xh1_heat_limit = Constraint(
        model.D,
        rule=lambda m, d: m.xh1_heat_load[d]
        <= COOLING_CAPACITY["XH1"] * DAILY_COOLING_FACTOR[weekday_key_for_day(d, start_weekday)],
    )
    model.xh2_heat_limit = Constraint(
        model.D,
        rule=lambda m, d: m.xh2_heat_load[d]
        <= COOLING_CAPACITY["XH2"] * DAILY_COOLING_FACTOR[weekday_key_for_day(d, start_weekday)],
    )
    model.xh3_heat_limit = Constraint(
        model.D,
        rule=lambda m, d: m.xh3_heat_load[d]
        <= COOLING_CAPACITY["XH3"] * DAILY_COOLING_FACTOR[weekday_key_for_day(d, start_weekday)],
    )

    model.yx_feed_balance = Constraint(model.D, rule=lambda m, d: m.yx_feed[d] == m.xh3_out[d])
    model.yx_volume = Constraint(
        model.D,
        rule=lambda m, d: m.yx_feed[d] * RESIDENCE_TIME_MIN["YX"] <= 0.8 * VOLUME_L["YX"],
    )
    model.yx_out_balance = Constraint(
        model.D, rule=lambda m, d: m.yx_out[d] == YIELD["YX_TO_YX_OUT"] * m.yx_feed[d]
    )
    model.jz_feed_balance = Constraint(model.D, rule=lambda m, d: m.jz_feed[d] == m.yx_out[d])
    model.jz_volume = Constraint(
        model.D,
        rule=lambda m, d: m.jz_feed[d] * RESIDENCE_TIME_MIN["JZ"] <= 0.8 * VOLUME_L["JZ"],
    )
    model.ylsn_ratio = Constraint(
        model.D, rule=lambda m, d: m.ylsn_feed[d] == YLSN_PER_JZ_FEED * m.jz_feed[d]
    )
    model.jz_out_balance = Constraint(
        model.D, rule=lambda m, d: m.jz_out[d] == YIELD["JZ_TO_JZ_OUT"] * m.jz_feed[d]
    )
    model.xdj_capacity = Constraint(model.D, rule=lambda m, d: m.jz_out[d] <= CAPACITY_LPM["XDJ"])
    model.xdj_out_balance = Constraint(
        model.D, rule=lambda m, d: m.xdj_out[d] == YIELD["XDJ_TO_XD_OUT"] * m.jz_out[d]
    )
    model.shj_capacity = Constraint(model.D, rule=lambda m, d: m.xdj_out[d] <= CAPACITY_LPM["SHJ"])
    model.shj_out_balance = Constraint(
        model.D, rule=lambda m, d: m.shj_out[d] == YIELD["SHJ_TO_SH_OUT"] * m.xdj_out[d]
    )
    def accept_tank_inventory_rule(m, d):
        previous_inventory = (
            INITIAL_ACCEPT_TANK_INVENTORY_L
            if int(d) == 1
            else m.accept_tank_inventory_l[int(d) - 1]
        )
        return (
            m.accept_tank_inventory_l[d]
            == previous_inventory
            + m.shj_out[d] * MINUTES_PER_DAY
            - m.zpj_feed[d] * MINUTES_PER_DAY
        )

    model.accept_tank_inventory_balance = Constraint(
        model.D, rule=accept_tank_inventory_rule
    )
    model.accept_tank_final_inventory = Constraint(
        expr=model.accept_tank_inventory_l[planning_days]
        == FINAL_ACCEPT_TANK_INVENTORY_L
    )
    model.accept_tank_outlet_limit = Constraint(
        model.D, rule=lambda m, d: m.zpj_feed[d] <= ACCEPT_TANK_OUTLET_MAX_LPM
    )

    def accept_tank_outlet_ramp_up_rule(m, d):
        if int(d) == 1:
            return Constraint.Skip
        return m.zpj_feed[d] - m.zpj_feed[int(d) - 1] <= ACCEPT_TANK_OUTLET_RAMP_LIMIT_LPM

    def accept_tank_outlet_ramp_down_rule(m, d):
        if int(d) == 1:
            return Constraint.Skip
        return m.zpj_feed[int(d) - 1] - m.zpj_feed[d] <= ACCEPT_TANK_OUTLET_RAMP_LIMIT_LPM

    model.accept_tank_outlet_ramp_up = Constraint(
        model.D, rule=accept_tank_outlet_ramp_up_rule
    )
    model.accept_tank_outlet_ramp_down = Constraint(
        model.D, rule=accept_tank_outlet_ramp_down_rule
    )
    model.zpj_capacity = Constraint(model.D, rule=lambda m, d: m.zpj_feed[d] <= CAPACITY_LPM["ZPJ"])
    model.tnt_liquid_balance = Constraint(
        model.D, rule=lambda m, d: m.tnt_liquid_lpm[d] == YIELD["ZPJ_TO_TNT"] * m.zpj_feed[d]
    )
    model.product_balance = Constraint(
        model.D,
        rule=lambda m, d: m.product_ton_day[d]
        == m.tnt_liquid_lpm[d] * TNT_LIQUID_DENSITY_KG_PER_L * MINUTES_PER_DAY / KG_PER_TON,
    )

    def daily_limit_rule(m, d):
        return m.product_ton_day[d] <= product_limit_for_day(d, start_weekday)

    model.daily_product_limit = Constraint(model.D, rule=daily_limit_rule)
    model.weekly_target = Constraint(
        expr=sum(model.product_ton_day[d] for d in model.D) == data["weekly_target_ton"]
    )

    model.objective = Objective(
        expr=sum(
            DAILY_OPERATION_COST_FACTOR[weekday_key_for_day(d, start_weekday)]
            * (
                RAW_COST["JB"] * model.jb_feed[d]
                + RAW_COST["EXTRA_INTERMEDIATE"] * model.extra_intermediate_feed[d]
                + RAW_COST["ACID"] * model.acid_feed[d]
                + RAW_COST["YLSN"] * model.ylsn_feed[d]
            )
            + INVENTORY_COST * model.accept_tank_inventory_l[d]
            + DAILY_PRODUCT_PEAK_COST * model.product_ton_day[d] ** 2
            + DAILY_OPERATION_COST_FACTOR[weekday_key_for_day(d, start_weekday)]
            * TEMP_OPERATION_COST
            * (
                model.xh1_temp_c[d]
                - TEMP_MIN_C
                + model.xh2_temp_c[d]
                - TEMP_MIN_C
                + model.xh3_temp_c[d]
                - TEMP_MIN_C
            )
            for d in model.D
        ),
        sense=minimize,
    )

    return model

def solve_model(model):
    temp_dir = Path(__file__).resolve().parent / ".tmp"
    temp_dir.mkdir(exist_ok=True)
    os.environ["TMP"] = str(temp_dir)
    os.environ["TEMP"] = str(temp_dir)
    tempfile.tempdir = str(temp_dir)

    for solver_name in ("ipopt", "cyipopt"):
        solver = SolverFactory(solver_name)
        if solver.available(exception_flag=False):
            return solver.solve(model)

    raise RuntimeError("当前环境没有可用的非线性求解器。请安装 IPOPT 或 cyipopt 后再运行该模型。")


def clean(var):
    number = value(var)
    return 0.0 if abs(number) < 1e-8 else number


def print_solution_detailed(model, data):
    component_name = "LDX" if data["xh2_route"] == "LDX" else "MXX"
    total_product = sum(clean(model.product_ton_day[d]) for d in model.D)
    print("\n多日非线性日尺度调度结果")
    print("----------------------------")
    print(f"XH2进料路线: {data['xh2_route']}")
    print(f"计划周期: {data['planning_days']} 天")
    print(f"目标产量: {data['weekly_target_ton']:.2f} 吨")
    print(f"实际产量: {total_product:.2f} 吨")
    print("\n每日推荐投料与运行结果")
    print("----------------------")
    print(f"日期  TNT吨/日  JB(L/min)  {component_name}(L/min)  YLSN(L/min)")
    for d in model.D:
        day = int(d)
        print(
            f"{DAY_NAMES[weekday_key_for_day(day, data.get('start_weekday', 0))]:<4}"
            f"{clean(model.product_ton_day[d]):>9.2f}"
            f"{clean(model.jb_feed[d]):>12.2f}"
            f"{clean(model.extra_intermediate_feed[d]):>16.2f}"
            f"{clean(model.ylsn_feed[d]):>13.2f}"
        )


def read_user_inputs():
    print("请输入多日非线性日尺度调度目标。")
    planning_days = int(read_number_input("计划周期", MIN_PLANNING_DAYS, MAX_PLANNING_DAYS, "天"))
    target_limit = total_product_limit(planning_days, 0)
    target = read_number_input("总TNT产量目标", 0.0, target_limit, "吨")
    route = read_route_input()
    return target, route, planning_days


def main():
    weekly_target_ton, xh2_route, planning_days = read_user_inputs()
    data = build_data(weekly_target_ton, xh2_route, planning_days=planning_days)
    model = build_model(data)
    try:
        result = solve_model(model)
    except RuntimeError as exc:
        print(exc)
        return
    print(f"求解状态: {result.solver.termination_condition}")
    if result.solver.termination_condition != TerminationCondition.optimal:
        print("模型未得到最优可行解，请检查参数、产量目标或安全约束。")
        return
    print_solution_detailed(model, data)


if __name__ == "__main__":
    main()
