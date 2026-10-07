"""
硬质糖果单日稳态非线性优化模型（Pyomo）

满足以下要求：
1. XH一段为三台串联反应釜，只在一段1#入口前投一个JB。
2. 单日日产量不超过110 t。
3. 不使用典型工况比例等式；通过收率、成本、能力和工艺参数自然拟合。
4. NX、DNX各使用一个全流程总投料变量，并按固定比例分配到三段。
5. 求解结果为当天平均流量，单位L/min。

单位：
- 所有液体流量与投料：L/min
- 反应釜有效容积：L
- 停留时间：min
- 最终硬质糖果：t/day
"""

import argparse
import math
import json
from pathlib import Path
from typing import Optional, Dict

import pyomo.environ as pyo


DAY_MINUTES = 1440.0
MAX_DAILY_PRODUCT_T = 110.0


def build_model(
    daily_target_t: float,
    calibrated_params: Optional[Dict[str, float]] = None,
):
    """建立单日稳态连续非线性规划模型。"""
    if daily_target_t <= 0:
        raise ValueError("daily_target_t 必须大于0。")
    if daily_target_t > MAX_DAILY_PRODUCT_T:
        raise ValueError("daily_target_t 不能超过110 t。")

    m = pyo.ConcreteModel("HardCandy_Daily_Average_NLP")

    # ================================================================
    # 1. 基本参数
    # ================================================================
    m.daily_target_t = pyo.Param(initialize=daily_target_t)
    m.daily_capacity_t = pyo.Param(initialize=MAX_DAILY_PRODUCT_T)
    m.day_minutes = pyo.Param(initialize=DAY_MINUTES)

    # ZP出口液体等效体积转固体产品的系数，t/L。
    # 当前值按100 t/day典型工况单点校准，后续应由密度、固含量和回收率更新。
    m.solid_t_per_L = pyo.Param(
        initialize=0.0009978507568625303,
        mutable=True,
    )

    # 三段总有效容积。
    m.volume_s1 = pyo.Param(initialize=3.0 * 4900.0)   # 14700 L
    m.volume_s2 = pyo.Param(initialize=3.0 * 4600.0)   # 13800 L
    m.volume_s3 = pyo.Param(initialize=8.0 * 5000.0)   # 40000 L

    # 固定后处理收率。
    m.sep_yield = pyo.Param(initialize=0.985, mutable=True)
    m.yx_yield = pyo.Param(initialize=0.985, mutable=True)
    # JZ基础产率和YLSN反应增益参数。
    # YLSN不直接增加后续物流体积，而是提高JZ有效产率。
    m.jz_base_yield = pyo.Param(initialize=0.990, mutable=True)
    m.jz_ylsn_gain_max = pyo.Param(initialize=0.55, mutable=True)
    m.k_ylsn = pyo.Param(initialize=2.0, mutable=True)
    m.scale_ylsn_ratio = pyo.Param(initialize=0.40, mutable=True)

    m.xd_yield = pyo.Param(initialize=0.995, mutable=True)
    m.zp_yield = pyo.Param(initialize=0.992, mutable=True)

    # ================================================================
    # 2. NX、DNX固定工段分配比例
    # ================================================================
    # 总量是决策变量；工段份额是参数。
    m.nx_s1_share = pyo.Param(initialize=0.15, mutable=True)
    m.nx_s2_share = pyo.Param(initialize=0.25, mutable=True)
    m.nx_s3_share = pyo.Param(initialize=0.60, mutable=True)

    m.dnx_s1_share = pyo.Param(initialize=0.35, mutable=True)
    m.dnx_s2_share = pyo.Param(initialize=0.30, mutable=True)
    m.dnx_s3_share = pyo.Param(initialize=0.35, mutable=True)

    # ================================================================
    # 3. 工段整体收率参数
    # ================================================================
    # 收率统一采用有界饱和形式：
    # eta = eta_min + (eta_max-eta_min)*(1-exp(-score))
    m.s1_yield_min = pyo.Param(initialize=0.58, mutable=True)
    m.s1_yield_max = pyo.Param(initialize=0.955, mutable=True)
    m.s2_yield_min = pyo.Param(initialize=0.70, mutable=True)
    m.s2_yield_max = pyo.Param(initialize=0.970, mutable=True)
    m.s3_yield_min = pyo.Param(initialize=0.78, mutable=True)
    m.s3_yield_max = pyo.Param(initialize=0.985, mutable=True)

    # 停留时间响应系数。原值过大，会使低流量时停留时间项直接饱和。
    m.k_s1_tau = pyo.Param(initialize=0.0018, mutable=True)
    m.k_s2_tau = pyo.Param(initialize=0.0020, mutable=True)
    m.k_s3_tau = pyo.Param(initialize=0.0012, mutable=True)

    # 典型工况对应的添加剂饱和尺度，单位L/min。
    # 这些是收率函数参数，不是强制等式或投料下限。
    m.scale_JB = pyo.Param(initialize=17.0, mutable=True)
    m.scale_MXX = pyo.Param(initialize=30.0, mutable=True)
    m.scale_SA = pyo.Param(initialize=71.0, mutable=True)
    m.scale_FSA = pyo.Param(initialize=24.0, mutable=True)

    # NX、DNX使用各工段入口体积分数近似釜内稳态相对浓度。
    # 下列无量纲尺度由典型工况流量换算得到。
    m.scale_nx_conc_s1 = pyo.Param(
        initialize=0.055058823529411764,
        mutable=True,
    )
    m.scale_dnx_conc_s1 = pyo.Param(
        initialize=0.07905882352941175,
        mutable=True,
    )
    m.scale_nx_conc_s2 = pyo.Param(
        initialize=0.08266214497668503,
        mutable=True,
    )
    m.scale_dnx_conc_s2 = pyo.Param(
        initialize=0.061042814752013556,
        mutable=True,
    )
    m.scale_nx_conc_s3 = pyo.Param(
        initialize=0.11950970377936669,
        mutable=True,
    )
    m.scale_dnx_conc_s3 = pyo.Param(
        initialize=0.042900919305413676,
        mutable=True,
    )

    # 饱和函数陡峭程度。
    m.k_JB = pyo.Param(initialize=2.2, mutable=True)
    m.k_MXX = pyo.Param(initialize=2.0, mutable=True)
    m.k_SA = pyo.Param(initialize=1.20, mutable=True)
    m.k_FSA = pyo.Param(initialize=1.20, mutable=True)
    m.k_NX = pyo.Param(initialize=2.2, mutable=True)
    m.k_DNX = pyo.Param(initialize=2.0, mutable=True)

    # ================================================================
    # 4. 相对成本参数
    # ================================================================
    # 这些参数决定模型在主原料和添加剂之间的经济权衡。
    m.cost_feed = pyo.Param(initialize=26.0, mutable=True)
    m.cost_JB = pyo.Param(initialize=2.2, mutable=True)
    m.cost_DNX = pyo.Param(initialize=2.0, mutable=True)
    m.cost_SA = pyo.Param(initialize=0.22, mutable=True)
    m.cost_MXX = pyo.Param(initialize=2.80, mutable=True)
    m.cost_FSA = pyo.Param(initialize=0.65, mutable=True)
    m.cost_YLSN = pyo.Param(initialize=10.0, mutable=True)
    m.cost_NX = pyo.Param(initialize=1.45, mutable=True)

    # 可选：加载离线标定得到的参数。
    if calibrated_params:
        allowed = {
            "cost_JB": m.cost_JB,
            "cost_DNX": m.cost_DNX,
            "cost_SA": m.cost_SA,
            "cost_MXX": m.cost_MXX,
            "cost_FSA": m.cost_FSA,
            "cost_YLSN": m.cost_YLSN,
            "cost_NX": m.cost_NX,
            "jz_ylsn_gain_max": m.jz_ylsn_gain_max,
            "k_ylsn": m.k_ylsn,
        }
        unknown = set(calibrated_params) - set(allowed)
        if unknown:
            raise ValueError(f"未知标定参数: {sorted(unknown)}")
        for name, value in calibrated_params.items():
            allowed[name].set_value(float(value))

    # ================================================================
    # 5. 决策变量：全部表示当天平均流量L/min
    # ================================================================
    m.feed = pyo.Var(bounds=(1.0, 160.0), initialize=75.0)
    m.JB = pyo.Var(bounds=(0.0, 50.0), initialize=17.0)
    m.DNX_total = pyo.Var(bounds=(0.0, 40.0), initialize=24.0)
    m.SA = pyo.Var(bounds=(0.0, 100.0), initialize=71.0)
    m.external_MXX = pyo.Var(bounds=(0.0, 60.0), initialize=30.0)
    m.FSA = pyo.Var(bounds=(0.0, 50.0), initialize=24.0)
    m.YLSN = pyo.Var(bounds=(0.0, 60.0), initialize=20.0)
    m.NX_total = pyo.Var(bounds=(0.0, 60.0), initialize=39.0)

    # 工段主物流。
    m.s1_in = pyo.Var(bounds=(1.0, 210.0), initialize=92.0)
    m.s1_out = pyo.Var(bounds=(1.0, 180.0), initialize=72.0)
    m.s2_in = pyo.Var(bounds=(1.0, 180.0), initialize=101.0)
    m.s2_out = pyo.Var(bounds=(1.0, 150.0), initialize=69.0)
    m.s3_in = pyo.Var(bounds=(1.0, 150.0), initialize=69.0)
    m.s3_out = pyo.Var(bounds=(1.0, 110.0), initialize=52.0)

    # 三段整体收率。
    m.yield_s1 = pyo.Var(bounds=(0.40, 0.97), initialize=0.78)
    m.yield_s2 = pyo.Var(bounds=(0.55, 0.98), initialize=0.82)
    m.yield_s3 = pyo.Var(bounds=(0.60, 0.99), initialize=0.85)

    # 后处理物流与产品。
    m.yx_out = pyo.Var(bounds=(0.0, 120.0), initialize=51.2)
    # JZ主物流不包含YLSN的直接体积。
    m.jz_in = pyo.Var(bounds=(0.0, 150.0), initialize=51.2)
    # YLSN参与反应后形成目标物，因此有效产率可略大于1。
    m.jz_effective_yield = pyo.Var(
        bounds=(0.90, 1.60),
        initialize=1.38,
    )
    m.zp_out = pyo.Var(bounds=(0.0, 150.0), initialize=69.6)
    m.daily_product_t = pyo.Var(
        bounds=(daily_target_t, MAX_DAILY_PRODUCT_T),
        initialize=daily_target_t,
    )

    # 使用固定、与目标日产量无关的初值。
    # 初值仅用于帮助IPOPT启动，不代表典型工况，也不约束最终解。
    m.feed.value = 60.0
    m.JB.value = 10.0
    m.DNX_total.value = 10.0
    m.SA.value = 30.0
    m.external_MXX.value = 15.0
    m.FSA.value = 10.0
    m.YLSN.value = 15.0
    m.NX_total.value = 20.0
    m.s3_out.value = 45.0

    eps = 1e-4

    def sat(x, scale, k):
        """0到1之间的平滑饱和函数。"""
        return 1.0 - pyo.exp(-k * x / (scale + eps))

    # ================================================================
    # 6. 一段：三台串联、只投一个JB、使用整体收率
    # ================================================================
    # JB只在一段1#入口前加入。
    m.s1_in_balance = pyo.Constraint(
        expr=m.s1_in == m.feed + m.JB
    )

    # 一段整体收率表示从1#入口到3#出口。
    m.s1_out_balance = pyo.Constraint(
        expr=m.s1_out == m.s1_in * m.yield_s1
    )

    # 一段总入口流量及NX、DNX稳态相对浓度。
    m.s1_mixed_flow = pyo.Expression(
        expr=(
            m.s1_in
            + m.nx_s1_share * m.NX_total
            + m.dnx_s1_share * m.DNX_total
        )
    )
    m.nx_concentration_s1 = pyo.Expression(
        expr=(
            m.nx_s1_share * m.NX_total
            / (m.s1_mixed_flow + eps)
        )
    )
    m.dnx_concentration_s1 = pyo.Expression(
        expr=(
            m.dnx_s1_share * m.DNX_total
            / (m.s1_mixed_flow + eps)
        )
    )

    # 一段三个串联釜的总停留时间。
    tau_s1 = m.volume_s1 / (
        m.s1_mixed_flow
        + eps
    )

    tau_effect_s1 = 1.0 - pyo.exp(-m.k_s1_tau * tau_s1)
    jb_effect = 0.20 + 0.80 * sat(m.JB, m.scale_JB, m.k_JB)
    nx_effect_s1 = 0.25 + 0.75 * sat(
        m.nx_concentration_s1,
        m.scale_nx_conc_s1,
        m.k_NX,
    )
    dnx_effect_s1 = 0.25 + 0.75 * sat(
        m.dnx_concentration_s1,
        m.scale_dnx_conc_s1,
        m.k_DNX,
    )

    m.s1_yield_equation = pyo.Constraint(
        expr=m.yield_s1
        == m.s1_yield_min
        + (m.s1_yield_max - m.s1_yield_min)
        * tau_effect_s1
        * jb_effect
        * nx_effect_s1
        * dnx_effect_s1
    )

    # ================================================================
    # 7. 二段整体物流和收率
    # ================================================================
    m.s2_in_balance = pyo.Constraint(
        expr=m.s2_in
        == m.sep_yield * m.s1_out + m.external_MXX
    )

    m.s2_out_balance = pyo.Constraint(
        expr=m.s2_out == m.s2_in * m.yield_s2
    )

    m.s2_mixed_flow = pyo.Expression(
        expr=(
            m.s2_in
            + m.nx_s2_share * m.NX_total
            + m.dnx_s2_share * m.DNX_total
        )
    )
    m.nx_concentration_s2 = pyo.Expression(
        expr=(
            m.nx_s2_share * m.NX_total
            / (m.s2_mixed_flow + eps)
        )
    )
    m.dnx_concentration_s2 = pyo.Expression(
        expr=(
            m.dnx_s2_share * m.DNX_total
            / (m.s2_mixed_flow + eps)
        )
    )

    tau_s2 = m.volume_s2 / (
        m.s2_mixed_flow
        + eps
    )

    tau_effect_s2 = 1.0 - pyo.exp(-m.k_s2_tau * tau_s2)
    mxx_effect = 0.25 + 0.75 * sat(
        m.external_MXX,
        m.scale_MXX,
        m.k_MXX,
    )
    nx_effect_s2 = 0.25 + 0.75 * sat(
        m.nx_concentration_s2,
        m.scale_nx_conc_s2,
        m.k_NX,
    )
    dnx_effect_s2 = 0.25 + 0.75 * sat(
        m.dnx_concentration_s2,
        m.scale_dnx_conc_s2,
        m.k_DNX,
    )

    m.s2_yield_equation = pyo.Constraint(
        expr=m.yield_s2
        == m.s2_yield_min
        + (m.s2_yield_max - m.s2_yield_min)
        * tau_effect_s2
        * mxx_effect
        * nx_effect_s2
        * dnx_effect_s2
    )

    # ================================================================
    # 8. 三段整体物流和收率
    # ================================================================
    m.s3_in_balance = pyo.Constraint(expr=m.s3_in == m.s2_out)

    m.s3_out_balance = pyo.Constraint(
        expr=m.s3_out == m.s3_in * m.yield_s3
    )

    m.s3_mixed_flow = pyo.Expression(
        expr=(
            m.s3_in
            + m.SA
            + m.FSA
            + m.nx_s3_share * m.NX_total
            + m.dnx_s3_share * m.DNX_total
        )
    )
    m.nx_concentration_s3 = pyo.Expression(
        expr=(
            m.nx_s3_share * m.NX_total
            / (m.s3_mixed_flow + eps)
        )
    )
    m.dnx_concentration_s3 = pyo.Expression(
        expr=(
            m.dnx_s3_share * m.DNX_total
            / (m.s3_mixed_flow + eps)
        )
    )

    tau_s3 = m.volume_s3 / (
        m.s3_mixed_flow
        + eps
    )

    tau_effect_s3 = 1.0 - pyo.exp(-m.k_s3_tau * tau_s3)
    sa_effect = 0.05 + 0.95 * sat(m.SA, m.scale_SA, m.k_SA)
    fsa_effect = 0.08 + 0.92 * sat(m.FSA, m.scale_FSA, m.k_FSA)
    nx_effect_s3 = 0.20 + 0.80 * sat(
        m.nx_concentration_s3,
        m.scale_nx_conc_s3,
        m.k_NX,
    )
    dnx_effect_s3 = 0.20 + 0.80 * sat(
        m.dnx_concentration_s3,
        m.scale_dnx_conc_s3,
        m.k_DNX,
    )

    m.s3_yield_equation = pyo.Constraint(
        expr=m.yield_s3
        == m.s3_yield_min
        + (m.s3_yield_max - m.s3_yield_min)
        * tau_effect_s3
        * sa_effect
        * fsa_effect
        * nx_effect_s3
        * dnx_effect_s3
    )

    # ================================================================
    # 9. 后处理与产品
    # ================================================================
    m.yx_balance = pyo.Constraint(
        expr=m.yx_out == m.yx_yield * m.s3_out
    )

    # JZ主料:YLSN = 1:(0.3~0.8)。
    m.ylsn_ratio_lower = pyo.Constraint(
        expr=m.YLSN >= 0.30 * m.yx_out
    )
    m.ylsn_ratio_upper = pyo.Constraint(
        expr=m.YLSN <= 0.80 * m.yx_out
    )

    # YLSN不直接增加JZ入口主物流体积。
    m.jz_in_balance = pyo.Constraint(
        expr=m.jz_in == m.yx_out
    )

    # YLSN/主料比例决定JZ反应增益。
    # 比例增加时产率提高，但效果逐渐饱和。
    ylsn_ratio = m.YLSN / (m.yx_out + eps)
    ylsn_reaction_effect = (
        1.0
        - pyo.exp(
            -m.k_ylsn
            * ylsn_ratio
            / m.scale_ylsn_ratio
        )
    )

    m.jz_effective_yield_equation = pyo.Constraint(
        expr=m.jz_effective_yield
        == m.jz_base_yield
        + m.jz_ylsn_gain_max * ylsn_reaction_effect
    )

    m.zp_out_balance = pyo.Constraint(
        expr=m.zp_out
        == m.jz_in
        * m.jz_effective_yield
        * m.xd_yield
        * m.zp_yield
    )

    m.product_balance = pyo.Constraint(
        expr=m.daily_product_t
        == m.zp_out
        * m.day_minutes
        * m.solid_t_per_L
    )

    # ================================================================
    # 10. 产量和工艺边界
    # ================================================================
    m.target_constraint = pyo.Constraint(
        expr=m.daily_product_t >= m.daily_target_t
    )
    m.daily_capacity_constraint = pyo.Constraint(
        expr=m.daily_product_t <= m.daily_capacity_t
    )

    # JB绝对上限已由变量bounds限制为50 L/min。
    m.jb_ratio_constraint = pyo.Constraint(
        expr=m.JB <= 0.30 * m.feed
    )

    m.mxx_ratio_constraint = pyo.Constraint(
        expr=m.external_MXX
        <= 0.75 * (m.sep_yield * m.s1_out)
    )

    m.sa_ratio_constraint = pyo.Constraint(
        expr=m.SA <= 2.0 * m.s3_in
    )
    m.fsa_ratio_constraint = pyo.Constraint(
        expr=m.FSA <= 0.80 * m.s3_in
    )

    # ================================================================
    # 11. 目标函数
    # ================================================================
    # 不使用任何典型工况比例等式。
    # 典型结果只能通过这些参数和成本权衡自然出现。
    m.objective = pyo.Objective(
        expr=m.day_minutes * (
            m.cost_feed * m.feed
            + m.cost_JB * m.JB
            + m.cost_DNX * m.DNX_total
            + m.cost_SA * m.SA
            + m.cost_MXX * m.external_MXX
            + m.cost_FSA * m.FSA
            + m.cost_YLSN * m.YLSN
            + m.cost_NX * m.NX_total
        ),
        sense=pyo.minimize,
    )

    return m


def solve_model(model, solver_name: str = "ipopt", tee: bool = True):
    """调用连续非线性求解器。"""
    solver = pyo.SolverFactory(solver_name)
    if not solver.available(exception_flag=False):
        raise RuntimeError(
            f"求解器{solver_name!r}不可用。推荐安装IPOPT。"
        )

    if solver_name.lower() == "ipopt":
        solver.options["max_iter"] = 3000
        solver.options["tol"] = 1e-7
        solver.options["acceptable_tol"] = 1e-6
        solver.options["bound_push"] = 1e-6
        solver.options["bound_frac"] = 1e-6
        solver.options["mu_strategy"] = "adaptive"
        solver.options["nlp_scaling_method"] = "gradient-based"

    return solver.solve(model, tee=tee)


def is_successful_solve(result) -> bool:
    """判断求解结果是否可以使用。"""
    return (
        result.solver.status == pyo.SolverStatus.ok
        and result.solver.termination_condition
        in {
            pyo.TerminationCondition.optimal,
            pyo.TerminationCondition.locallyOptimal,
        }
    )


def _v(component):
    value = pyo.value(component)
    if abs(value) < 1e-7:
        return 0.0
    return value


def print_solution(model):
    """输出当天平均流量，不输出逐时数据和一段收率。"""
    print("\n================ 求解结果 ================")
    print(f"目标日产量：     {_v(model.daily_target_t):10.3f} t")
    print(f"计算日产量：     {_v(model.daily_product_t):10.3f} t")
    print(f"三段8#出口：     {_v(model.s3_out):10.3f} L/min")

    print("\n当天平均投料流量")
    print(f"JB：             {_v(model.JB):10.3f} L/min")
    print(f"DNX总量：        {_v(model.DNX_total):10.3f} L/min")
    print(f"SA：             {_v(model.SA):10.3f} L/min")
    print(f"外加MXX：        {_v(model.external_MXX):10.3f} L/min")
    print(f"FSA：            {_v(model.FSA):10.3f} L/min")
    print(f"YLSN：           {_v(model.YLSN):10.3f} L/min")
    print(f"NX总量：         {_v(model.NX_total):10.3f} L/min")
    print(f"一段主原料：     {_v(model.feed):10.3f} L/min")



def extract_operating_point(model) -> dict:
    """提取模型求解后的主要平均流量。"""
    return {
        "JB": _v(model.JB),
        "DNX": _v(model.DNX_total),
        "SA": _v(model.SA),
        "MXX": _v(model.external_MXX),
        "FSA": _v(model.FSA),
        "YLSN": _v(model.YLSN),
        "NX": _v(model.NX_total),
        "S3_8_out": _v(model.s3_out),
    }


CALIBRATION_VERSION = 4

# 多工况联合标定数据。
# 所有投料与三段8#出口单位均为L/min。
CALIBRATION_CASES = {
    100.0: {
        "JB": 17.0,
        "DNX": 24.0,
        "SA": 71.0,
        "MXX": 30.0,
        "FSA": 24.0,
        "YLSN": 20.0,
        "NX": 39.0,
        "S3_8_out": 52.0,
    },
    105.0: {
        "JB": 19.0,
        "DNX": 23.0,
        "SA": 72.0,
        "MXX": 31.0,
        "FSA": 21.0,
        "YLSN": 21.0,
        "NX": 41.0,
        "S3_8_out": 54.0,
    },
}

# 各观测量的标定权重。
# 三段8#出口与关键投料给予稍高权重。
CALIBRATION_WEIGHTS = {
    "JB": 1.0,
    "DNX": 1.0,
    "SA": 1.0,
    "MXX": 1.0,
    "FSA": 1.0,
    "YLSN": 1.2,
    "NX": 1.0,
    "S3_8_out": 1.5,
}


CALIBRATION_PARAMETER_NAMES = [
    "cost_JB",
    "cost_DNX",
    "cost_SA",
    "cost_MXX",
    "cost_FSA",
    "cost_YLSN",
    "cost_NX",
    "jz_ylsn_gain_max",
    "k_ylsn",
]


def calibrate_parameters(
    output_json: str = "hard_candy_calibrated_params.json",
    max_nfev: int = 80,
    verbose: bool = True,
) -> dict:
    """
    以100和105 t/day两个经典工况做联合离线参数标定。

    生产模型中不加入经典工况比例等式，也不加入参考值惩罚。
    这里只在离线辨识阶段反复求解生产模型，寻找能同时解释多个工况的参数。
    """
    try:
        import numpy as np
        from scipy.optimize import least_squares
    except ImportError as exc:
        raise RuntimeError(
            "参数标定需要 scipy 和 numpy。请先安装: pip install scipy numpy"
        ) from exc

    # 对正参数使用对数变量，保证标定过程中始终为正。
    initial = {
        "cost_JB": 2.2,
        "cost_DNX": 2.0,
        "cost_SA": 0.22,
        "cost_MXX": 2.80,
        "cost_FSA": 0.65,
        "cost_YLSN": 10.0,
        "cost_NX": 1.45,
        "jz_ylsn_gain_max": 0.55,
        "k_ylsn": 2.0,
    }

    lower = {
        "cost_JB": 0.05,
        "cost_DNX": 0.05,
        "cost_SA": 0.01,
        "cost_MXX": 0.05,
        "cost_FSA": 0.01,
        "cost_YLSN": 0.10,
        "cost_NX": 0.05,
        "jz_ylsn_gain_max": 0.10,
        "k_ylsn": 0.20,
    }
    upper = {
        "cost_JB": 50.0,
        "cost_DNX": 50.0,
        "cost_SA": 50.0,
        "cost_MXX": 50.0,
        "cost_FSA": 50.0,
        "cost_YLSN": 80.0,
        "cost_NX": 50.0,
        "jz_ylsn_gain_max": 1.00,
        "k_ylsn": 8.00,
    }

    names = CALIBRATION_PARAMETER_NAMES
    x0 = np.log([initial[n] for n in names])
    lb = np.log([lower[n] for n in names])
    ub = np.log([upper[n] for n in names])

    evaluation_count = 0

    def vector_to_params(x):
        vals = np.exp(x)
        return {name: float(value) for name, value in zip(names, vals)}

    initial_log = np.log([initial[n] for n in names])

    def residuals(x):
        nonlocal evaluation_count
        evaluation_count += 1
        params = vector_to_params(x)

        all_residuals = []
        solved_cases = {}

        for target_t, observed in sorted(CALIBRATION_CASES.items()):
            model = build_model(
                target_t,
                calibrated_params=params,
            )
            result = solve_model(
                model,
                solver_name="ipopt",
                tee=False,
            )

            if not is_successful_solve(result):
                # 任一工况不可行时返回大残差。
                n_obs = len(CALIBRATION_CASES) * len(observed)
                return np.full(n_obs + len(names), 100.0)

            solved = extract_operating_point(model)
            solved_cases[target_t] = solved

            for key, observed_value in observed.items():
                weight = CALIBRATION_WEIGHTS.get(key, 1.0)
                relative_error = (
                    solved[key] - observed_value
                ) / observed_value
                all_residuals.append(
                    np.sqrt(weight) * relative_error
                )

        # 弱正则化：避免只有两组数据时参数跑到极端边界。
        regularization_weight = 0.02
        parameter_regularization = (
            np.sqrt(regularization_weight)
            * (x - initial_log)
        )
        all_residuals.extend(parameter_regularization.tolist())

        residual = np.asarray(all_residuals, dtype=float)

        if verbose:
            data_count = (
                len(CALIBRATION_CASES)
                * len(next(iter(CALIBRATION_CASES.values())))
            )
            data_residual = residual[:data_count]
            rms = float(
                np.sqrt(np.mean(data_residual ** 2))
            )
            print(
                f"标定评估 {evaluation_count:03d}: "
                f"多工况相对RMS误差={rms:.6f}; "
                f"参数={params}"
            )
            for target_t in sorted(solved_cases):
                print(
                    f"  {target_t:.0f} t/day求解工况: "
                    f"{solved_cases[target_t]}"
                )

        return residual

    fit = least_squares(
        residuals,
        x0,
        bounds=(lb, ub),
        max_nfev=max_nfev,
        xtol=1e-5,
        ftol=1e-5,
        gtol=1e-5,
        verbose=2 if verbose else 0,
    )

    fitted = vector_to_params(fit.x)

    # 最终多工况验证。
    validation_cases = {}
    for target_t, observed in sorted(CALIBRATION_CASES.items()):
        validation_model = build_model(
            target_t,
            calibrated_params=fitted,
        )
        validation_result = solve_model(
            validation_model,
            solver_name="ipopt",
            tee=False,
        )
        if not is_successful_solve(validation_result):
            raise RuntimeError(
                f"{target_t:.0f} t/day最终验证求解失败。"
            )
        validation_cases[str(target_t)] = (
            extract_operating_point(validation_model)
        )

    payload = {
        "calibration_version": CALIBRATION_VERSION,
        "parameters": fitted,
        "calibration_cases": CALIBRATION_CASES,
        "validation_solutions": validation_cases,
        "least_squares_cost": float(fit.cost),
        "optimality": float(fit.optimality),
        "nfev": int(fit.nfev),
        "success": bool(fit.success),
        "message": str(fit.message),
    }

    Path(output_json).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\n标定参数已保存到: {output_json}")
    print("多工况验证结果:")
    for target_t, observed in sorted(CALIBRATION_CASES.items()):
        validation = validation_cases[str(target_t)]
        print(f"\n  {target_t:.0f} t/day:")
        for key, observed_value in observed.items():
            relative_error = (
                validation[key] - observed_value
            ) / observed_value * 100.0
            print(
                f"    {key:10s}: "
                f"求解={validation[key]:10.4f}, "
                f"实际={observed_value:10.4f}, "
                f"误差={relative_error:8.3f}%"
            )

    return fitted


def load_calibrated_params(json_path: str) -> dict:
    """读取并验证离线标定参数JSON。"""
    payload = json.loads(
        Path(json_path).read_text(encoding="utf-8")
    )
    if "parameters" not in payload:
        raise ValueError("标定文件中缺少parameters字段。")
    version = payload.get("calibration_version", 1)
    if version != CALIBRATION_VERSION:
        raise ValueError(
            "标定参数文件版本过旧，需要重新标定。"
        )
    return payload["parameters"]


def calibration_file_is_current(json_path: Path) -> bool:
    """判断现有标定文件是否为当前多工况版本。"""
    if not json_path.exists():
        return False
    try:
        payload = json.loads(
            json_path.read_text(encoding="utf-8")
        )
    except Exception:
        return False
    return (
        payload.get("calibration_version")
        == CALIBRATION_VERSION
        and "parameters" in payload
    )


def read_daily_target() -> float:
    """交互式读取目标日产量。"""
    print("=" * 52)
    print("硬质糖果单日稳态生产优化模型")
    print("请输入当天目标产量，单位t，允许范围0~110。")
    print("=" * 52)

    while True:
        raw = input("当天目标产量（t）：").strip()

        try:
            target = float(raw)
        except ValueError:
            print("请输入有效数字，例如100或95.5。")
            continue

        if target <= 0:
            print("日产量必须大于0 t。")
            continue

        if target > MAX_DAILY_PRODUCT_T:
            print("日产量不能超过110 t。")
            continue

        return target




# ====================================================================
# 多日生产计划模型
# ====================================================================

MAX_PLAN_DAYS = 30
MIN_DAILY_PRODUCT_T = 80.0
# 固定日产量波动比例。运行时不再输入。
FIXED_FLUCTUATION_PERCENT = 5.0


def build_daily_product_profile(
    total_plan_t,
    plan_days,
    fluctuation_percent=FIXED_FLUCTUATION_PERCENT,
):
    """
    生成指定计划天数内可重复的波动计划曲线。

    波动由月内缓慢正弦变化和7天周期共同构成。
    返回值严格满足：
    1. 计划周期合计等于total_plan_t；
    2. 每天位于80~110 t；
    3. 同样输入每次生成相同结果。
    """
    if fluctuation_percent < 0:
        raise ValueError("波动比例不能小于0。")
    if fluctuation_percent > 15:
        raise ValueError("建议波动比例不超过15%。")

    average = float(total_plan_t) / plan_days
    amplitude = float(fluctuation_percent) / 100.0

    # 月内慢周期 + 周期性波动；两部分均值接近0。
    raw_factors = []
    for day in range(1, plan_days + 1):
        monthly_wave = math.sin(
            2.0 * math.pi * (day - 1) / plan_days
        )
        weekly_wave = math.sin(
            2.0 * math.pi * (day - 1) / 7.0 + 0.8
        )
        factor = (
            1.0
            + amplitude
            * (
                0.70 * monthly_wave
                + 0.30 * weekly_wave
            )
        )
        raw_factors.append(factor)

    # 先按总产量归一化。
    factor_sum = sum(raw_factors)
    profile = [
        total_plan_t * factor / factor_sum
        for factor in raw_factors
    ]

    # 迭代式截断并重新分配，保证每天80~110且总量不变。
    lower = MIN_DAILY_PRODUCT_T
    upper = MAX_DAILY_PRODUCT_T
    fixed = [False] * plan_days

    for _ in range(20):
        changed = False
        for i, value in enumerate(profile):
            if fixed[i]:
                continue
            if value < lower:
                profile[i] = lower
                fixed[i] = True
                changed = True
            elif value > upper:
                profile[i] = upper
                fixed[i] = True
                changed = True

        remaining_indices = [
            i for i in range(plan_days)
            if not fixed[i]
        ]
        fixed_total = sum(
            profile[i]
            for i in range(plan_days)
            if fixed[i]
        )
        remaining_total = total_plan_t - fixed_total

        if not remaining_indices:
            break

        current_remaining = sum(
            profile[i] for i in remaining_indices
        )
        if current_remaining <= 0:
            equal_value = (
                remaining_total / len(remaining_indices)
            )
            for i in remaining_indices:
                profile[i] = equal_value
        else:
            scale = remaining_total / current_remaining
            for i in remaining_indices:
                profile[i] *= scale

        if not changed:
            break

    # 消除浮点累计误差。
    difference = total_plan_t - sum(profile)
    adjustable = [
        i for i, value in enumerate(profile)
        if lower + 1e-8 < value < upper - 1e-8
    ]
    if adjustable:
        profile[adjustable[-1]] += difference
    else:
        profile[-1] += difference

    return profile


def build_plan_model(
    total_plan_t,
    plan_days,
    calibrated_params=None,
    fluctuation_percent=FIXED_FLUCTUATION_PERCENT,
):
    """
    建立任意1~多日生产计划模型。

    默认使用模型内固定的5%日产量波动，不需要用户输入。

    输入：
        total_plan_t：计划周期总产量，单位t。

    输出决策：
        每天的计划产量以及对应平均投料流量，单位L/min。

    当前模型限定每天80~110t，使求解范围保持在标定数据附近。
    """
    if plan_days < 1 or plan_days > MAX_PLAN_DAYS:
        raise ValueError("计划天数必须在1~30之间。")

    min_total = plan_days * MIN_DAILY_PRODUCT_T
    max_total = plan_days * MAX_DAILY_PRODUCT_T

    if total_plan_t < min_total or total_plan_t > max_total:
        raise ValueError(
            "计划周期总产量必须在{:.0f}~{:.0f} t之间。".format(
                min_total,
                max_total,
            )
        )

    m = pyo.ConcreteModel("HardCandy_MultiDay_Planning_NLP")
    m.D = pyo.RangeSet(1, plan_days)

    m.total_plan_t = pyo.Param(initialize=float(total_plan_t))
    m.plan_days = pyo.Param(initialize=int(plan_days))
    m.day_minutes = pyo.Param(initialize=DAY_MINUTES)
    m.min_daily_product_t = pyo.Param(
        initialize=MIN_DAILY_PRODUCT_T
    )
    m.max_daily_product_t = pyo.Param(
        initialize=MAX_DAILY_PRODUCT_T
    )

    daily_profile = build_daily_product_profile(
        total_plan_t,
        plan_days,
        fluctuation_percent=fluctuation_percent,
    )
    m.profile_product_t = pyo.Param(
        m.D,
        initialize={
            d: daily_profile[d - 1]
            for d in range(1, plan_days + 1)
        },
    )
    m.fluctuation_percent = pyo.Param(
        initialize=float(fluctuation_percent)
    )

    # ---------- 工艺参数 ----------
    m.solid_t_per_L = pyo.Param(
        initialize=0.0009978507568625303,
        mutable=True,
    )

    m.volume_s1 = pyo.Param(initialize=3.0 * 4900.0)
    m.volume_s2 = pyo.Param(initialize=3.0 * 4600.0)
    m.volume_s3 = pyo.Param(initialize=8.0 * 5000.0)

    m.sep_yield = pyo.Param(initialize=0.985, mutable=True)
    m.yx_yield = pyo.Param(initialize=0.985, mutable=True)
    m.jz_base_yield = pyo.Param(initialize=0.990, mutable=True)
    m.jz_ylsn_gain_max = pyo.Param(
        initialize=0.55,
        mutable=True,
    )
    m.k_ylsn = pyo.Param(initialize=2.0, mutable=True)
    m.scale_ylsn_ratio = pyo.Param(
        initialize=0.40,
        mutable=True,
    )
    m.xd_yield = pyo.Param(initialize=0.995, mutable=True)
    m.zp_yield = pyo.Param(initialize=0.992, mutable=True)

    # NX/DNX工段分配比例。
    m.nx_s1_share = pyo.Param(initialize=0.15)
    m.nx_s2_share = pyo.Param(initialize=0.25)
    m.nx_s3_share = pyo.Param(initialize=0.60)

    m.dnx_s1_share = pyo.Param(initialize=0.35)
    m.dnx_s2_share = pyo.Param(initialize=0.30)
    m.dnx_s3_share = pyo.Param(initialize=0.35)

    # 工段收率上下限。
    m.s1_yield_min = pyo.Param(initialize=0.58)
    m.s1_yield_max = pyo.Param(initialize=0.955)
    m.s2_yield_min = pyo.Param(initialize=0.70)
    m.s2_yield_max = pyo.Param(initialize=0.970)
    m.s3_yield_min = pyo.Param(initialize=0.78)
    m.s3_yield_max = pyo.Param(initialize=0.985)

    # 停留时间参数。
    m.k_s1_tau = pyo.Param(initialize=0.0018)
    m.k_s2_tau = pyo.Param(initialize=0.0020)
    m.k_s3_tau = pyo.Param(initialize=0.0012)

    # 投料饱和尺度。
    m.scale_JB = pyo.Param(initialize=17.0)
    m.scale_MXX = pyo.Param(initialize=30.0)
    m.scale_SA = pyo.Param(initialize=71.0)
    m.scale_FSA = pyo.Param(initialize=24.0)

    # NX、DNX各段稳态相对浓度的典型尺度，无量纲。
    m.scale_nx_conc_s1 = pyo.Param(
        initialize=0.055058823529411764
    )
    m.scale_dnx_conc_s1 = pyo.Param(
        initialize=0.07905882352941175
    )
    m.scale_nx_conc_s2 = pyo.Param(
        initialize=0.08266214497668503
    )
    m.scale_dnx_conc_s2 = pyo.Param(
        initialize=0.061042814752013556
    )
    m.scale_nx_conc_s3 = pyo.Param(
        initialize=0.11950970377936669
    )
    m.scale_dnx_conc_s3 = pyo.Param(
        initialize=0.042900919305413676
    )

    m.k_JB = pyo.Param(initialize=2.2)
    m.k_MXX = pyo.Param(initialize=2.0)
    m.k_SA = pyo.Param(initialize=1.20)
    m.k_FSA = pyo.Param(initialize=1.20)
    m.k_NX = pyo.Param(initialize=2.2)
    m.k_DNX = pyo.Param(initialize=2.0)

    # 成本参数。
    m.cost_feed = pyo.Param(initialize=26.0, mutable=True)
    m.cost_JB = pyo.Param(initialize=2.2, mutable=True)
    m.cost_DNX = pyo.Param(initialize=2.0, mutable=True)
    m.cost_SA = pyo.Param(initialize=0.22, mutable=True)
    m.cost_MXX = pyo.Param(initialize=2.80, mutable=True)
    m.cost_FSA = pyo.Param(initialize=0.65, mutable=True)
    m.cost_YLSN = pyo.Param(initialize=10.0, mutable=True)
    m.cost_NX = pyo.Param(initialize=1.45, mutable=True)

    # 读取联合标定参数。
    if calibrated_params:
        allowed = {
            "cost_JB": m.cost_JB,
            "cost_DNX": m.cost_DNX,
            "cost_SA": m.cost_SA,
            "cost_MXX": m.cost_MXX,
            "cost_FSA": m.cost_FSA,
            "cost_YLSN": m.cost_YLSN,
            "cost_NX": m.cost_NX,
            "jz_ylsn_gain_max": m.jz_ylsn_gain_max,
            "k_ylsn": m.k_ylsn,
        }
        unknown = set(calibrated_params) - set(allowed)
        if unknown:
            raise ValueError(
                "未知标定参数: {}".format(sorted(unknown))
            )
        for name, value in calibrated_params.items():
            allowed[name].set_value(float(value))

    # ---------- 每日决策变量 ----------
    average_target = float(total_plan_t) / plan_days

    m.daily_product_t = pyo.Var(
        m.D,
        bounds=(
            MIN_DAILY_PRODUCT_T,
            MAX_DAILY_PRODUCT_T,
        ),
        initialize=lambda m, d: pyo.value(
            m.profile_product_t[d]
        ),
    )

    m.feed = pyo.Var(
        m.D,
        bounds=(1.0, 160.0),
        initialize=60.0,
    )
    m.JB = pyo.Var(
        m.D,
        bounds=(0.0, 50.0),
        initialize=17.0,
    )
    m.DNX_total = pyo.Var(
        m.D,
        bounds=(0.0, 40.0),
        initialize=24.0,
    )
    m.SA = pyo.Var(
        m.D,
        bounds=(0.0, 100.0),
        initialize=71.0,
    )
    m.external_MXX = pyo.Var(
        m.D,
        bounds=(0.0, 60.0),
        initialize=30.0,
    )
    m.FSA = pyo.Var(
        m.D,
        bounds=(0.0, 50.0),
        initialize=24.0,
    )
    m.YLSN = pyo.Var(
        m.D,
        bounds=(0.0, 60.0),
        initialize=20.0,
    )
    m.NX_total = pyo.Var(
        m.D,
        bounds=(0.0, 60.0),
        initialize=39.0,
    )

    m.s1_in = pyo.Var(
        m.D,
        bounds=(1.0, 210.0),
        initialize=80.0,
    )
    m.s1_out = pyo.Var(
        m.D,
        bounds=(1.0, 180.0),
        initialize=70.0,
    )
    m.s2_in = pyo.Var(
        m.D,
        bounds=(1.0, 180.0),
        initialize=95.0,
    )
    m.s2_out = pyo.Var(
        m.D,
        bounds=(1.0, 150.0),
        initialize=65.0,
    )
    m.s3_in = pyo.Var(
        m.D,
        bounds=(1.0, 150.0),
        initialize=65.0,
    )
    m.s3_out = pyo.Var(
        m.D,
        bounds=(1.0, 110.0),
        initialize=52.0,
    )

    m.yield_s1 = pyo.Var(
        m.D,
        bounds=(0.40, 0.97),
        initialize=0.78,
    )
    m.yield_s2 = pyo.Var(
        m.D,
        bounds=(0.55, 0.98),
        initialize=0.82,
    )
    m.yield_s3 = pyo.Var(
        m.D,
        bounds=(0.60, 0.99),
        initialize=0.85,
    )

    m.yx_out = pyo.Var(
        m.D,
        bounds=(0.0, 120.0),
        initialize=51.0,
    )
    m.jz_effective_yield = pyo.Var(
        m.D,
        bounds=(0.90, 1.60),
        initialize=1.30,
    )
    m.zp_out = pyo.Var(
        m.D,
        bounds=(0.0, 150.0),
        initialize=70.0,
    )

    eps = 1e-4

    def sat(x, scale, k):
        return 1.0 - pyo.exp(
            -k * x / (scale + eps)
        )

    # ---------- 每日一段 ----------
    def s1_in_balance_rule(m, d):
        return m.s1_in[d] == m.feed[d] + m.JB[d]
    m.s1_in_balance = pyo.Constraint(
        m.D,
        rule=s1_in_balance_rule,
    )

    def s1_out_balance_rule(m, d):
        return (
            m.s1_out[d]
            == m.s1_in[d] * m.yield_s1[d]
        )
    m.s1_out_balance = pyo.Constraint(
        m.D,
        rule=s1_out_balance_rule,
    )

    def s1_yield_rule(m, d):
        mixed_flow = (
            m.s1_in[d]
            + m.nx_s1_share * m.NX_total[d]
            + m.dnx_s1_share * m.DNX_total[d]
        )
        nx_concentration = (
            m.nx_s1_share * m.NX_total[d]
            / (mixed_flow + eps)
        )
        dnx_concentration = (
            m.dnx_s1_share * m.DNX_total[d]
            / (mixed_flow + eps)
        )
        tau = m.volume_s1 / (mixed_flow + eps)
        tau_effect = 1.0 - pyo.exp(
            -m.k_s1_tau * tau
        )
        jb_effect = (
            0.20
            + 0.80
            * sat(m.JB[d], m.scale_JB, m.k_JB)
        )
        nx_effect = (
            0.25
            + 0.75
            * sat(
                nx_concentration,
                m.scale_nx_conc_s1,
                m.k_NX,
            )
        )
        dnx_effect = (
            0.25
            + 0.75
            * sat(
                dnx_concentration,
                m.scale_dnx_conc_s1,
                m.k_DNX,
            )
        )
        return (
            m.yield_s1[d]
            == m.s1_yield_min
            + (
                m.s1_yield_max
                - m.s1_yield_min
            )
            * tau_effect
            * jb_effect
            * nx_effect
            * dnx_effect
        )
    m.s1_yield_equation = pyo.Constraint(
        m.D,
        rule=s1_yield_rule,
    )

    # ---------- 每日二段 ----------
    def s2_in_balance_rule(m, d):
        return (
            m.s2_in[d]
            == m.sep_yield * m.s1_out[d]
            + m.external_MXX[d]
        )
    m.s2_in_balance = pyo.Constraint(
        m.D,
        rule=s2_in_balance_rule,
    )

    def s2_out_balance_rule(m, d):
        return (
            m.s2_out[d]
            == m.s2_in[d] * m.yield_s2[d]
        )
    m.s2_out_balance = pyo.Constraint(
        m.D,
        rule=s2_out_balance_rule,
    )

    def s2_yield_rule(m, d):
        mixed_flow = (
            m.s2_in[d]
            + m.nx_s2_share * m.NX_total[d]
            + m.dnx_s2_share * m.DNX_total[d]
        )
        nx_concentration = (
            m.nx_s2_share * m.NX_total[d]
            / (mixed_flow + eps)
        )
        dnx_concentration = (
            m.dnx_s2_share * m.DNX_total[d]
            / (mixed_flow + eps)
        )
        tau = m.volume_s2 / (mixed_flow + eps)
        tau_effect = 1.0 - pyo.exp(
            -m.k_s2_tau * tau
        )
        mxx_effect = (
            0.25
            + 0.75
            * sat(
                m.external_MXX[d],
                m.scale_MXX,
                m.k_MXX,
            )
        )
        nx_effect = (
            0.25
            + 0.75
            * sat(
                nx_concentration,
                m.scale_nx_conc_s2,
                m.k_NX,
            )
        )
        dnx_effect = (
            0.25
            + 0.75
            * sat(
                dnx_concentration,
                m.scale_dnx_conc_s2,
                m.k_DNX,
            )
        )
        return (
            m.yield_s2[d]
            == m.s2_yield_min
            + (
                m.s2_yield_max
                - m.s2_yield_min
            )
            * tau_effect
            * mxx_effect
            * nx_effect
            * dnx_effect
        )
    m.s2_yield_equation = pyo.Constraint(
        m.D,
        rule=s2_yield_rule,
    )

    # ---------- 每日三段 ----------
    def s3_in_balance_rule(m, d):
        return m.s3_in[d] == m.s2_out[d]
    m.s3_in_balance = pyo.Constraint(
        m.D,
        rule=s3_in_balance_rule,
    )

    def s3_out_balance_rule(m, d):
        return (
            m.s3_out[d]
            == m.s3_in[d] * m.yield_s3[d]
        )
    m.s3_out_balance = pyo.Constraint(
        m.D,
        rule=s3_out_balance_rule,
    )

    def s3_yield_rule(m, d):
        mixed_flow = (
            m.s3_in[d]
            + m.SA[d]
            + m.FSA[d]
            + m.nx_s3_share * m.NX_total[d]
            + m.dnx_s3_share * m.DNX_total[d]
        )
        nx_concentration = (
            m.nx_s3_share * m.NX_total[d]
            / (mixed_flow + eps)
        )
        dnx_concentration = (
            m.dnx_s3_share * m.DNX_total[d]
            / (mixed_flow + eps)
        )
        tau = m.volume_s3 / (mixed_flow + eps)
        tau_effect = 1.0 - pyo.exp(
            -m.k_s3_tau * tau
        )
        sa_effect = (
            0.05
            + 0.95
            * sat(m.SA[d], m.scale_SA, m.k_SA)
        )
        fsa_effect = (
            0.08
            + 0.92
            * sat(
                m.FSA[d],
                m.scale_FSA,
                m.k_FSA,
            )
        )
        nx_effect = (
            0.20
            + 0.80
            * sat(
                nx_concentration,
                m.scale_nx_conc_s3,
                m.k_NX,
            )
        )
        dnx_effect = (
            0.20
            + 0.80
            * sat(
                dnx_concentration,
                m.scale_dnx_conc_s3,
                m.k_DNX,
            )
        )
        return (
            m.yield_s3[d]
            == m.s3_yield_min
            + (
                m.s3_yield_max
                - m.s3_yield_min
            )
            * tau_effect
            * sa_effect
            * fsa_effect
            * nx_effect
            * dnx_effect
        )
    m.s3_yield_equation = pyo.Constraint(
        m.D,
        rule=s3_yield_rule,
    )

    # ---------- 每日后处理 ----------
    def yx_balance_rule(m, d):
        return (
            m.yx_out[d]
            == m.yx_yield * m.s3_out[d]
        )
    m.yx_balance = pyo.Constraint(
        m.D,
        rule=yx_balance_rule,
    )

    def ylsn_lower_rule(m, d):
        return m.YLSN[d] >= 0.30 * m.yx_out[d]
    m.ylsn_ratio_lower = pyo.Constraint(
        m.D,
        rule=ylsn_lower_rule,
    )

    def ylsn_upper_rule(m, d):
        return m.YLSN[d] <= 0.80 * m.yx_out[d]
    m.ylsn_ratio_upper = pyo.Constraint(
        m.D,
        rule=ylsn_upper_rule,
    )

    def jz_yield_rule(m, d):
        ratio = m.YLSN[d] / (
            m.yx_out[d] + eps
        )
        effect = 1.0 - pyo.exp(
            -m.k_ylsn
            * ratio
            / m.scale_ylsn_ratio
        )
        return (
            m.jz_effective_yield[d]
            == m.jz_base_yield
            + m.jz_ylsn_gain_max * effect
        )
    m.jz_effective_yield_equation = pyo.Constraint(
        m.D,
        rule=jz_yield_rule,
    )

    def zp_out_rule(m, d):
        return (
            m.zp_out[d]
            == m.yx_out[d]
            * m.jz_effective_yield[d]
            * m.xd_yield
            * m.zp_yield
        )
    m.zp_out_balance = pyo.Constraint(
        m.D,
        rule=zp_out_rule,
    )

    def daily_product_rule(m, d):
        return (
            m.daily_product_t[d]
            == m.zp_out[d]
            * m.day_minutes
            * m.solid_t_per_L
        )
    m.daily_product_balance = pyo.Constraint(
        m.D,
        rule=daily_product_rule,
    )

    # ---------- 每日工艺边界 ----------
    def jb_ratio_rule(m, d):
        return m.JB[d] <= 0.30 * m.feed[d]
    m.jb_ratio_constraint = pyo.Constraint(
        m.D,
        rule=jb_ratio_rule,
    )

    def mxx_ratio_rule(m, d):
        return (
            m.external_MXX[d]
            <= 0.75
            * m.sep_yield
            * m.s1_out[d]
        )
    m.mxx_ratio_constraint = pyo.Constraint(
        m.D,
        rule=mxx_ratio_rule,
    )

    def sa_ratio_rule(m, d):
        return m.SA[d] <= 2.0 * m.s3_in[d]
    m.sa_ratio_constraint = pyo.Constraint(
        m.D,
        rule=sa_ratio_rule,
    )

    def fsa_ratio_rule(m, d):
        return m.FSA[d] <= 0.80 * m.s3_in[d]
    m.fsa_ratio_constraint = pyo.Constraint(
        m.D,
        rule=fsa_ratio_rule,
    )

    # 计划周期总产量必须等于输入计划。
    m.total_plan_constraint = pyo.Constraint(
        expr=sum(
            m.daily_product_t[d]
            for d in m.D
        ) == m.total_plan_t
    )

    # ---------- 目标函数 ----------
    production_cost = sum(
        m.day_minutes * (
            m.cost_feed * m.feed[d]
            + m.cost_JB * m.JB[d]
            + m.cost_DNX * m.DNX_total[d]
            + m.cost_SA * m.SA[d]
            + m.cost_MXX * m.external_MXX[d]
            + m.cost_FSA * m.FSA[d]
            + m.cost_YLSN * m.YLSN[d]
            + m.cost_NX * m.NX_total[d]
        )
        for d in m.D
    )

    # 日产量跟踪预设波动曲线。
    # 权重较大，使每天产量接近该曲线，同时总产量严格等于输入值。
    profile_tracking_weight = 20000.0
    profile_tracking = sum(
        (
            m.daily_product_t[d]
            - m.profile_product_t[d]
        ) ** 2
        for d in m.D
    )

    # 只保留较弱的相邻日投料平滑，避免完全抹平计划波动。
    flow_smooth_weight = 5.0
    flow_smooth = sum(
        (
            m.JB[d] - m.JB[d - 1]
        ) ** 2
        + (
            m.DNX_total[d]
            - m.DNX_total[d - 1]
        ) ** 2
        + (
            m.SA[d] - m.SA[d - 1]
        ) ** 2
        + (
            m.external_MXX[d]
            - m.external_MXX[d - 1]
        ) ** 2
        + (
            m.FSA[d] - m.FSA[d - 1]
        ) ** 2
        + (
            m.YLSN[d] - m.YLSN[d - 1]
        ) ** 2
        + (
            m.NX_total[d]
            - m.NX_total[d - 1]
        ) ** 2
        for d in range(2, plan_days + 1)
    )

    m.objective = pyo.Objective(
        expr=(
            production_cost
            + profile_tracking_weight
            * profile_tracking
            + flow_smooth_weight
            * flow_smooth
        ),
        sense=pyo.minimize,
    )

    return m


def print_plan_solution(model):
    """在终端打印多日计划，不生成CSV文件。"""
    plan_days = int(pyo.value(model.plan_days))

    print("\n================ 多日生产计划 ================")
    print("计划天数：      {} 天".format(plan_days))
    print(
        "计划周期总产量：{:.3f} t".format(
            pyo.value(model.total_plan_t)
        )
    )
    print(
        "模型总产量：    {:.3f} t".format(
            sum(
                pyo.value(model.daily_product_t[d])
                for d in model.D
            )
        )
    )
    print(
        "固定波动比例：  {:.2f}%".format(
            pyo.value(model.fluctuation_percent)
        )
    )

    header = (
        "天数  波动目标(t)  求解产量(t)  JB  DNX  SA  外加MXX  "
        "FSA  YLSN  NX  三段8#出口"
    )
    print("\n" + header)

    for d in model.D:
        print(
            "{:>2d}  {:>10.3f}  {:>10.3f}  {:>6.3f}  "
            "{:>6.3f}  {:>6.3f}  {:>8.3f}  "
            "{:>6.3f}  {:>6.3f}  {:>6.3f}  "
            "{:>10.3f}".format(
                int(d),
                pyo.value(model.profile_product_t[d]),
                pyo.value(model.daily_product_t[d]),
                pyo.value(model.JB[d]),
                pyo.value(model.DNX_total[d]),
                pyo.value(model.SA[d]),
                pyo.value(model.external_MXX[d]),
                pyo.value(model.FSA[d]),
                pyo.value(model.YLSN[d]),
                pyo.value(model.NX_total[d]),
                pyo.value(model.s3_out[d]),
            )
        )


def read_plan_days():
    """交互式读取计划天数，范围1~30天。"""
    while True:
        raw = input("请输入计划天数（1~30）：").strip()
        try:
            days = int(raw)
        except ValueError:
            print("请输入1到30之间的整数。")
            continue

        if days < 1 or days > MAX_PLAN_DAYS:
            print("计划天数必须在1~30之间。")
            continue
        return days


def read_total_plan(plan_days):
    """交互式读取所选周期的计划总产量。"""
    minimum = plan_days * MIN_DAILY_PRODUCT_T
    maximum = plan_days * MAX_DAILY_PRODUCT_T

    print(
        "请输入{}天计划总产量，允许范围"
        "{:.0f}~{:.0f} t。".format(
            plan_days,
            minimum,
            maximum,
        )
    )

    while True:
        raw = input("计划周期总产量（t）：").strip()
        try:
            total = float(raw)
        except ValueError:
            print("请输入有效数字。")
            continue

        if total < minimum or total > maximum:
            print(
                "总产量必须在{:.0f}~{:.0f} t之间。".format(
                    minimum,
                    maximum,
                )
            )
            continue
        return total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="硬质糖果1~30天IPOPT生产计划优化模型"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=None,
        help="计划天数，范围1~30；不提供时交互输入。",
    )
    parser.add_argument(
        "--total",
        type=float,
        default=None,
        help="计划周期总产量t；不提供时交互输入。",
    )
    parser.add_argument(
        "--solver",
        default="ipopt",
        help="Pyomo求解器，默认ipopt。",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="不显示IPOPT迭代日志。",
    )
    parser.add_argument(
        "--recalibrate",
        action="store_true",
        help="强制重新执行100/105t联合标定。",
    )
    parser.add_argument(
        "--max-nfev",
        type=int,
        default=120,
        help="参数标定最大模型评估次数。",
    )
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    params_path = (
        script_dir
        / "hard_candy_calibrated_params.json"
    )

    print("=" * 60)
    print("硬质糖果1~30天IPOPT生产计划优化模型")
    print("=" * 60)

    if (
        args.recalibrate
        or not calibration_file_is_current(params_path)
    ):
        print(
            "\n未检测到当前标定参数，"
            "开始100/105t联合标定。"
        )
        try:
            calibrate_parameters(
                output_json=str(params_path),
                max_nfev=args.max_nfev,
                verbose=not args.quiet,
            )
        except RuntimeError as exc:
            print("\n自动标定失败：", exc)
            raise SystemExit(1)
    else:
        print(
            "\n已加载现有标定参数文件："
            + params_path.name
        )

    if args.days is None:
        plan_days = read_plan_days()
    else:
        plan_days = args.days
        if plan_days < 1 or plan_days > MAX_PLAN_DAYS:
            print("计划天数必须在1~30之间。")
            raise SystemExit(1)

    if args.total is None:
        total_plan_t = read_total_plan(plan_days)
    else:
        total_plan_t = args.total

    fluctuation_percent = FIXED_FLUCTUATION_PERCENT

    try:
        calibrated_params = load_calibrated_params(
            str(params_path)
        )
        model = build_plan_model(
            total_plan_t,
            plan_days,
            calibrated_params=calibrated_params,
            fluctuation_percent=fluctuation_percent,
        )

        print(
            (
                "\n开始求解{}天总计划 {:.3f} t，"
                "固定波动比例 {:.2f}% ..."
            ).format(
                plan_days,
                total_plan_t,
                fluctuation_percent,
            )
        )

        result = solve_model(
            model,
            solver_name=args.solver,
            tee=not args.quiet,
        )

        print("\n求解器状态：", result.solver.status)
        print(
            "终止条件：",
            result.solver.termination_condition,
        )

        if not is_successful_solve(result):
            raise RuntimeError(
                "多日计划模型没有得到可行最优解。"
            )

        print_plan_solution(model)

    except (RuntimeError, ValueError) as exc:
        print("\n求解失败：", exc)
        raise SystemExit(1)
