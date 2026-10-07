from __future__ import annotations

import importlib.util
import os
from pathlib import Path
from types import ModuleType


REPO_ROOT = Path(__file__).resolve().parents[3]
OPTIMIZE_DIR = REPO_ROOT / "optimize"
EXTERNAL_OPTIMIZE_DIR = Path(r"C:\Users\Y\Desktop\论文")


DAILY_CONSTRAINT_VAR_MAP = {
    "jb": "JB",
    "mxx": "external_MXX",
    "ldx": "external_MXX",
    "dnx": "DNX_total",
    "sa": "SA",
    "fsa": "FSA",
    "ylsn": "YLSN",
    "nx": "NX_total",
    "product": "daily_product_t",
    "tg": "daily_product_t",
    "mxxflc": "s1_out",
    "x2_2d": "s2_in",
    "cztg": "s3_out",
    "txxhcc": "yx_out",
    "yttg": "zp_out",
}

CONSTRAINT_OPERATOR_ALIASES = {
    "min": "min",
    ">=": "min",
    "gte": "min",
    "max": "max",
    "<=": "max",
    "lte": "max",
    "fixed": "fixed",
    "=": "fixed",
    "==": "fixed",
    "eq": "fixed",
}


def normalize_constraint_operator(value: str) -> str:
    operator = CONSTRAINT_OPERATOR_ALIASES.get(str(value or "").strip().lower())
    if not operator:
        raise ValueError("Constraint operator must be min, max, or fixed")
    return operator


def _apply_daily_constraint_rules(
    module: ModuleType,
    model,
    rules: list[dict] | None,
    xh2_route: str,
) -> None:
    for index, rule in enumerate(rules or [], start=1):
        field = str(rule.get("field") or "").strip().lower()
        variable_name = DAILY_CONSTRAINT_VAR_MAP.get(field)
        if not variable_name or not hasattr(model, variable_name):
            raise ValueError(f"Unsupported constraint field: {field}")
        if field == "mxx" and xh2_route != "MXX":
            raise ValueError("MXX constraint is only available for the MXX route")
        if field == "ldx" and xh2_route != "LDX":
            raise ValueError("L/DX constraint is only available for the LDX route")

        operator = normalize_constraint_operator(rule.get("operator"))
        value = float(rule.get("value"))
        variable = getattr(model, variable_name)

        def constraint_rule(_model, day, *, variable=variable, operator=operator, value=value):
            if operator == "min":
                return variable[day] >= value
            if operator == "max":
                return variable[day] <= value
            return variable[day] == value

        setattr(
            model,
            f"trial_constraint_{index}",
            module.pyo.Constraint(model.D, rule=constraint_rule),
        )


def round_output_amount(amount: float) -> float:
    return round(amount, 3)


def load_optimization_module(filename: str, module_name: str) -> ModuleType:
    module_path = OPTIMIZE_DIR / filename
    if not module_path.exists():
        external_path = EXTERNAL_OPTIMIZE_DIR / filename
        if external_path.exists():
            module_path = external_path

    if not module_path.exists():
        raise FileNotFoundError(f"未找到优化模型文件：{module_path}")

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"无法加载优化模型：{module_path}")

    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except ModuleNotFoundError as exc:
        if exc.name == "pyomo":
            raise RuntimeError("缺少 Pyomo 依赖，请先安装 requirements.txt 中的 pyomo") from exc
        raise

    return module


def describe_model_parameters(module: ModuleType) -> dict:
    parameters = {}

    if hasattr(module, "MXXFLC_RECOVERY"):
        parameters["MXXFLC_RECOVERY"] = module.MXXFLC_RECOVERY

    if hasattr(module, "YIELD"):
        parameters["YIELD"] = dict(module.YIELD)

    return parameters


def empty_legacy_assays() -> dict[str, float]:
    return {}


def ensure_optimal(module: ModuleType, result) -> None:
    termination_condition = result.solver.termination_condition
    if termination_condition != module.TerminationCondition.optimal:
        raise ValueError(f"优化模型未得到最优可行解：{termination_condition}")


def avg(module: ModuleType, model, var) -> float:
    return round_output_amount(module.average(model, var))


def scalar(module: ModuleType, var) -> float:
    return round_output_amount(module.clean(var))


def normalize_xh2_route(xh2_route: str | None) -> str:
    if xh2_route is None:
        return "MXX"

    route = xh2_route.upper()
    if route not in {"MXX", "LDX"}:
        raise ValueError("XH2D route must be MXX or LDX")

    return route


def build_extra_intermediate(input_amounts: dict[str, float], xh2_route: str) -> float:
    input_name = "L/DX" if xh2_route == "LDX" else "MXX"
    return input_amounts.get(input_name, 0.0)


def run_input_to_output_model(input_amounts: dict[str, float], *, xh2_route: str | None = None) -> dict:
    module = load_optimization_module(
        "tnt_continuous_scheduling_model.py",
        "tnt_continuous_scheduling_model",
    )
    model_parameters = describe_model_parameters(module)
    xh2_route = normalize_xh2_route(xh2_route)

    raw_material = {
        "JB": input_amounts["JB"],
        "EXTRA_INTERMEDIATE": build_extra_intermediate(input_amounts, xh2_route),
        "YLSN": input_amounts["YLSN"],
    }
    data = module.build_data(raw_material, xh2_route)
    model = module.build_model(data)
    result = module.solve_model(model)
    ensure_optimal(module, result)

    outputs = {
        "MXXFLC": avg(module, model, model.intermediate_from_mxxflc),
        "X2_2D": avg(module, model, model.xh2_out),
        "CZTG": avg(module, model, model.xh3_out),
        "TXXHCC": avg(module, model, model.yx_out),
        "YTTG": avg(module, model, model.zpj_feed),
        "TG": scalar(module, model.product_ton_day),
    }

    return {
        "route": xh2_route,
        "assays": empty_legacy_assays(),
        "modelParameters": model_parameters,
        "rawMaterial": raw_material,
        "outputs": outputs,
    }


def run_output_to_input_model(target_tg_amount: float, *, xh2_route: str = "LDX") -> dict:
    xh2_route = normalize_xh2_route(xh2_route)
    if xh2_route not in {"MXX", "LDX"}:
        raise ValueError("XH2D路线必须是 MXX 或 LDX")

    module = load_optimization_module(
        "tnt_continuous_reverse_model.py",
        "tnt_continuous_reverse_model",
    )
    model_parameters = describe_model_parameters(module)

    data = module.build_data(target_tg_amount, xh2_route)
    model = module.build_model(data)
    result = module.solve_model(model)
    ensure_optimal(module, result)

    extra_intermediate_amount = scalar(module, model.extra_intermediate_input)
    outputs = {
        "YTTG": avg(module, model, model.zpj_feed),
        "TXXHCC": avg(module, model, model.yx_out),
        "CZTG": avg(module, model, model.xh3_out),
        "X2_2D": avg(module, model, model.xh2_out),
        "MXXFLC": avg(module, model, model.intermediate_from_mxxflc),
        "YLSN": scalar(module, model.ylsn_input),
        "L/DX": extra_intermediate_amount if xh2_route == "LDX" else 0.0,
        "JB": scalar(module, model.jb_input),
        "MXX": extra_intermediate_amount if xh2_route == "MXX" else 0.0,
    }

    return {
        "route": xh2_route,
        "assays": empty_legacy_assays(),
        "modelParameters": model_parameters,
        "outputs": outputs,
    }


def run_daily_schedule_model(
    start_date: str,
    weekly_target_ton: float,
    *,
    xh2_route: str = "MXX",
    planning_days: int | None = None,
    constraint_rules: list[dict] | None = None,
) -> dict:
    from datetime import datetime, timedelta

    module = load_optimization_module("hard_candy_popt.py", "hard_candy_popt")
    xh2_route = normalize_xh2_route(xh2_route)
    planning_days = int(planning_days or 7)
    if planning_days < 1 or planning_days > 30:
        raise ValueError("计划周期必须在1-30天之间")
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = start + timedelta(days=planning_days - 1)

    params_path = OPTIMIZE_DIR / "hard_candy_calibrated_params.json"
    calibrated_params = module.load_calibrated_params(str(params_path))
    model = module.build_plan_model(
        weekly_target_ton,
        planning_days,
        calibrated_params=calibrated_params,
    )
    _apply_daily_constraint_rules(module, model, constraint_rules, xh2_route)
    result = module.solve_model(model, solver_name=os.getenv("HARD_CANDY_SOLVER", "ipopt"), tee=False)
    if not module.is_successful_solve(result):
        raise ValueError(f"Optimization model did not return a usable solution: {result.solver.termination_condition}")

    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    daily_results = []

    for d in model.D:
        day_index = int(d)
        schedule_date = start + timedelta(days=day_index - 1)
        extra_amount = round_output_amount(float(module.pyo.value(model.external_MXX[d])))
        product_amount = round_output_amount(float(module.pyo.value(model.daily_product_t[d])))

        daily_results.append(
            {
                "date": schedule_date.isoformat(),
                "dayIndex": day_index,
                "dayName": day_names[schedule_date.weekday()],
                "jb": round_output_amount(float(module.pyo.value(model.JB[d]))),
                "dnx": round_output_amount(float(module.pyo.value(model.DNX_total[d]))),
                "sa": round_output_amount(float(module.pyo.value(model.SA[d]))),
                "mxx": extra_amount if xh2_route == "MXX" else 0.0,
                "ldx": extra_amount if xh2_route == "LDX" else 0.0,
                "fsa": round_output_amount(float(module.pyo.value(model.FSA[d]))),
                "ylsn": round_output_amount(float(module.pyo.value(model.YLSN[d]))),
                "nx": round_output_amount(float(module.pyo.value(model.NX_total[d]))),
                "product": product_amount,
                "mxxflc": round_output_amount(float(module.pyo.value(model.s1_out[d]))),
                "x2_2d": round_output_amount(float(module.pyo.value(model.s2_in[d]))),
                "cztg": round_output_amount(float(module.pyo.value(model.s3_out[d]))),
                "txxhcc": round_output_amount(float(module.pyo.value(model.yx_out[d]))),
                "yttg": round_output_amount(float(module.pyo.value(model.zp_out[d]))),
                "tg": product_amount,
            }
        )

    return {
        "plan": {
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "planningDays": planning_days,
            "targetAmount": round_output_amount(weekly_target_ton),
            "route": xh2_route,
        },
        "dailyResults": daily_results,
    }
