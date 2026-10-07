from __future__ import annotations

import math
from datetime import datetime

from webapp.modules.optimization_runner import run_daily_schedule_model
from webapp.modules.projects.repository import read_project
from webapp.modules.schedule.repository import (
    delete_schedule_plan,
    get_schedule_plan,
    list_schedule_plans,
    save_schedule_result,
    schedule_plan_name_exists,
)
from webapp.modules.solve.service import (
    FACTORY_PROJECT_NAME,
    STREAM_VALUE_SOURCES,
    format_stream_label,
    replace_project_stream_names,
)


MIN_PLANNING_DAYS = 1
MAX_PLANNING_DAYS = 30
MIN_DAILY_PRODUCT_TON = 80
MAX_DAILY_PRODUCT_TON = 110
CONSTRAINT_TOLERANCE = 1e-3
TARGET_TOTAL_TOLERANCE = 1e-2
MODEL_CONSTRAINT_TOLERANCE = 5e-2
MODEL_DAY_MINUTES = 1440.0
MODEL_SOLID_T_PER_L = 0.0009978507568625303
MODEL_SEP_YIELD = 0.985
MODEL_YX_YIELD = 0.985
MODEL_XD_YIELD = 0.995
MODEL_ZP_YIELD = 0.992
MODEL_JZ_BASE_YIELD = 0.990
MODEL_JZ_YLSN_GAIN_MAX = 0.5390830142335662
MODEL_K_YLSN = 1.9875741936438645
MODEL_SCALE_YLSN_RATIO = 0.40

CONSTRAINT_PREVIEW_FIELDS = [
    {"key": "jb", "label": "JB投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "dnx", "label": "DNX投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "sa", "label": "SA投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "mxx", "label": "MXX投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "ldx", "label": "L/DX投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "fsa", "label": "FSA投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "ylsn", "label": "YLSN投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "nx", "label": "NX投入量", "unit": "L/min", "group": "原料投入"},
    {"key": "mxxflc", "label": "MXXFLC产量", "unit": "L/min", "group": "中间产物"},
    {"key": "x2_2d", "label": "X2_2D产量", "unit": "L/min", "group": "中间产物"},
    {"key": "cztg", "label": "CZTG产量", "unit": "L/min", "group": "中间产物"},
    {"key": "txxhcc", "label": "TXXHCC产量", "unit": "L/min", "group": "中间产物"},
    {"key": "yttg", "label": "YTTG产量", "unit": "L/min", "group": "中间产物"},
    {"key": "product", "label": "硬质糖果产量", "unit": "t", "group": "最终产品"},
]
CONSTRAINT_FIELD_MAP = {field["key"]: field for field in CONSTRAINT_PREVIEW_FIELDS}
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

MODEL_RESULT_FIELD_LABELS = {
    "jb": ("JB投入量", "L/min"),
    "dnx": ("DNX投入量", "L/min"),
    "sa": ("SA投入量", "L/min"),
    "mxx": ("MXX投入量", "L/min"),
    "ldx": ("L/DX投入量", "L/min"),
    "fsa": ("FSA投入量", "L/min"),
    "ylsn": ("YLSN投入量", "L/min"),
    "nx": ("NX投入量", "L/min"),
    "mxxflc": ("MXXFLC产量", "L/min"),
    "x2_2d": ("X2_2D产量", "L/min"),
    "cztg": ("CZTG产量", "L/min"),
    "txxhcc": ("TXXHCC产量", "L/min"),
    "yttg": ("YTTG产量", "L/min"),
    "product": ("硬质糖果日产量", "t"),
    "tg": ("TG日产量", "t"),
}

MODEL_RESULT_BOUNDS = {
    "jb": (0.0, 50.0),
    "dnx": (0.0, 40.0),
    "sa": (0.0, 100.0),
    "mxx": (0.0, 60.0),
    "ldx": (0.0, 60.0),
    "fsa": (0.0, 50.0),
    "ylsn": (0.0, 60.0),
    "nx": (0.0, 60.0),
    "mxxflc": (1.0, 180.0),
    "x2_2d": (1.0, 180.0),
    "cztg": (1.0, 110.0),
    "txxhcc": (0.0, 120.0),
    "yttg": (0.0, 150.0),
    "product": (MIN_DAILY_PRODUCT_TON, MAX_DAILY_PRODUCT_TON),
    "tg": (MIN_DAILY_PRODUCT_TON, MAX_DAILY_PRODUCT_TON),
}


def _require_date(value) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("计划开始日期不能为空")
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError("计划开始日期必须是 YYYY-MM-DD 格式") from exc
    return value


def _require_positive_int(value, field_name: str) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name}必须是整数") from exc
    if number <= 0:
        raise ValueError(f"{field_name}必须大于0")
    return number


def _require_non_negative_number(value, field_name: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name}必须是数字") from exc
    if number < 0:
        raise ValueError(f"{field_name}不能小于0")
    return number


def _build_daily_stream_values(daily_result: dict) -> dict[str, float]:
    return {
        "JB": daily_result["jb"],
        "MXX": daily_result["mxx"],
        "L/DX": daily_result["ldx"],
        "YLSN": daily_result["ylsn"],
        "MXXFLC": daily_result["mxxflc"],
        "X2_2D": daily_result["x2_2d"],
        "CZTG": daily_result["cztg"],
        "TXXHCC": daily_result["txxhcc"],
        "YTTG": daily_result["yttg"],
        "TG": daily_result["tg"],
    }


def _build_daily_project(base_project: dict, daily_result: dict) -> dict:
    values = _build_daily_stream_values(daily_result)
    replacements = {}

    for stream_name, (_, source_name) in STREAM_VALUE_SOURCES.items():
        replacements[stream_name] = format_stream_label(source_name, values[source_name])

    project = replace_project_stream_names(base_project, replacements)
    project["streamValues"] = replacements
    return project


def _attach_schedule_projects(schedule: dict) -> dict:
    base_project = read_project(FACTORY_PROJECT_NAME)
    projects_by_date = {}
    for daily_result in schedule["dailyResults"]:
        projects_by_date[daily_result["date"]] = _build_daily_project(base_project, daily_result)

    schedule["projectsByDate"] = projects_by_date
    if schedule["dailyResults"]:
        first_date = schedule["dailyResults"][0]["date"]
        schedule["project"] = projects_by_date[first_date]

    return schedule


def _needs_intermediate_refresh(schedule: dict) -> bool:
    for daily_result in schedule.get("dailyResults", []):
        if any(float(daily_result.get(name, 0) or 0) != 0 for name in ("x2_2d", "cztg", "txxhcc", "yttg")):
            return False
    return bool(schedule.get("dailyResults"))


def _refresh_missing_intermediates(schedule: dict) -> dict:
    if not _needs_intermediate_refresh(schedule):
        return schedule

    plan = schedule["plan"]
    recalculated = run_daily_schedule_model(
        plan["startDate"],
        float(plan["targetAmount"]),
        xh2_route=str(plan.get("route") or "MXX"),
        planning_days=int(plan.get("planningDays") or 7),
    )
    by_date = {item["date"]: item for item in recalculated["dailyResults"]}

    for daily_result in schedule["dailyResults"]:
        calculated = by_date.get(daily_result["date"])
        if not calculated:
            continue
        for name in ("mxxflc", "x2_2d", "cztg", "txxhcc", "yttg", "tg"):
            daily_result[name] = calculated[name]

    return schedule


def _normalize_route(value) -> str:
    route = str(value or "MXX").upper()
    if route not in {"MXX", "LDX"}:
        raise ValueError("XH2D路线只能是MXX或LDX")
    return route


def _validate_schedule_basis(payload: dict) -> tuple[str, int, float, str]:
    start_date = _require_date(payload.get("startDate"))
    planning_days = _require_positive_int(payload.get("planningDays", 7), "计划周期")
    if planning_days < MIN_PLANNING_DAYS or planning_days > MAX_PLANNING_DAYS:
        raise ValueError("计划周期必须在1-30天之间")

    target_amount = _require_non_negative_number(payload.get("targetAmount"), "目标产量")
    min_target_amount = planning_days * MIN_DAILY_PRODUCT_TON
    max_target_amount = planning_days * MAX_DAILY_PRODUCT_TON
    if target_amount < min_target_amount or target_amount > max_target_amount:
        raise ValueError(f"目标产量必须在{min_target_amount}-{max_target_amount}吨之间")

    return start_date, planning_days, target_amount, _normalize_route(payload.get("route"))


def _normalize_constraint_operator(value) -> str:
    operator = CONSTRAINT_OPERATOR_ALIASES.get(str(value or "").strip().lower())
    if not operator:
        raise ValueError("约束运算符只能是下限、上限或固定值")
    return operator


def _normalize_constraint_rules(rules) -> list[dict]:
    if not isinstance(rules, list):
        raise ValueError("约束规则格式不正确")
    if len(rules) > 20:
        raise ValueError("约束规则不能超过20条")

    normalized = []
    seen = set()
    for rule in rules:
        if not isinstance(rule, dict):
            raise ValueError("约束规则格式不正确")
        field = str(rule.get("field") or "").strip().lower()
        if field not in CONSTRAINT_FIELD_MAP:
            raise ValueError(f"不支持的约束变量：{field}")
        if field in seen:
            raise ValueError(f"约束变量不能重复：{field}")
        seen.add(field)
        normalized.append(
            {
                "field": field,
                "operator": _normalize_constraint_operator(rule.get("operator")),
                "value": _require_non_negative_number(rule.get("value"), "约束值"),
            }
        )

    if not normalized:
        raise ValueError("请至少添加一条约束规则")
    return normalized


def _validate_constraint_rules_for_route(rules: list[dict], route: str) -> None:
    route = _normalize_route(route)
    unsupported_field = "ldx" if route == "MXX" else "mxx"
    if any(rule["field"] == unsupported_field for rule in rules):
        field_label = CONSTRAINT_FIELD_MAP[unsupported_field]["label"]
        raise ValueError(f"{route} 路线不支持约束字段：{field_label}")


def _target_is_satisfied(total_product: float, target_amount: float) -> bool:
    return total_product + TARGET_TOTAL_TOLERANCE >= target_amount


def _aggregate_schedule_field(schedule: dict, field_key: str) -> float:
    values = [float(item.get(field_key, 0) or 0) for item in schedule.get("dailyResults", [])]
    if not values:
        return 0.0
    if field_key in {"product", "tg"}:
        return round(sum(values), 3)
    return round(sum(values) / len(values), 3)


def _build_constraint_comparison(baseline: dict, trial: dict | None) -> list[dict]:
    rows = []
    for field in CONSTRAINT_PREVIEW_FIELDS:
        key = field["key"]
        before = _aggregate_schedule_field(baseline, key)
        after = None if trial is None else _aggregate_schedule_field(trial, key)
        delta = None if after is None else round(after - before, 3)
        delta_percent = None
        if delta is not None and abs(before) >= CONSTRAINT_TOLERANCE:
            delta_percent = round(delta / before * 100, 2)
        rows.append(
            {
                **field,
                "field": key,
                "before": before,
                "after": after,
                "delta": delta,
                "deltaPercent": delta_percent,
            }
        )
    return rows


def _daily_value_satisfies(value: float, operator: str, target: float) -> bool:
    if operator == "min":
        return value + CONSTRAINT_TOLERANCE >= target
    if operator == "max":
        return value <= target + CONSTRAINT_TOLERANCE
    return abs(value - target) <= CONSTRAINT_TOLERANCE


def _constraints_effective(daily_results: list[dict], rules: list[dict]) -> bool:
    return all(
        _daily_value_satisfies(
            float(item.get(rule["field"], 0) or 0),
            rule["operator"],
            float(rule["value"]),
        )
        for rule in rules
        for item in daily_results
    )


def _as_float(value, field_name: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name}必须是数字") from exc
    if not math.isfinite(number):
        raise ValueError(f"{field_name}必须是有效数字")
    return number


def _format_expected_range(lower: float | None, upper: float | None, unit: str = "") -> str:
    suffix = unit or ""
    if lower is not None and upper is not None:
        return f"{lower:g} - {upper:g}{suffix}"
    if lower is not None:
        return f">= {lower:g}{suffix}"
    if upper is not None:
        return f"<= {upper:g}{suffix}"
    return "-"


def _format_expected_value(value: float, unit: str = "") -> str:
    return f"{value:.3f}{unit}".rstrip("0").rstrip(".") if unit == "" else f"{value:.3f}{unit}"


def _within(value: float, lower: float | None = None, upper: float | None = None) -> bool:
    if lower is not None and value + MODEL_CONSTRAINT_TOLERANCE < lower:
        return False
    if upper is not None and value > upper + MODEL_CONSTRAINT_TOLERANCE:
        return False
    return True


def _near(actual: float, expected: float) -> bool:
    return abs(actual - expected) <= MODEL_CONSTRAINT_TOLERANCE


def _make_validation_row(
    *,
    date: str,
    day_index: int | str,
    constraint_key: str,
    constraint_name: str,
    field: str,
    actual: float,
    expected: str,
    passed: bool,
    message: str,
) -> dict:
    label, unit = MODEL_RESULT_FIELD_LABELS.get(field, (field, ""))
    return {
        "date": date,
        "dayIndex": day_index,
        "constraintKey": constraint_key,
        "constraintName": constraint_name,
        "field": field,
        "fieldLabel": label,
        "unit": unit,
        "actual": round(actual, 3),
        "expected": expected,
        "status": "pass" if passed else "fail",
        "message": message,
    }


def _add_bounds_validation_rows(rows: list[dict], item: dict) -> None:
    date = str(item.get("date") or "")
    day_index = item.get("dayIndex") or ""
    for field, (lower, upper) in MODEL_RESULT_BOUNDS.items():
        label, unit = MODEL_RESULT_FIELD_LABELS[field]
        actual = _as_float(item.get(field, 0), label)
        passed = _within(actual, lower, upper)
        if passed:
            message = f"{label}满足模型变量边界"
        elif field in {"product", "tg"} and actual > upper + MODEL_CONSTRAINT_TOLERANCE:
            message = f"{date} {label}超过日产量上限 {upper:g}{unit}"
        elif field in {"product", "tg"} and actual + MODEL_CONSTRAINT_TOLERANCE < lower:
            message = f"{date} {label}低于日产量下限 {lower:g}{unit}"
        else:
            message = f"{date} {label}不满足模型变量边界 {_format_expected_range(lower, upper, unit)}"
        rows.append(
            _make_validation_row(
                date=date,
                day_index=day_index,
                constraint_key=f"{field}_bounds",
                constraint_name=f"{label}变量边界",
                field=field,
                actual=actual,
                expected=_format_expected_range(lower, upper, unit),
                passed=passed,
                message=message,
            )
        )


def _add_daily_equation_validation_rows(rows: list[dict], item: dict, route: str) -> None:
    date = str(item.get("date") or "")
    day_index = item.get("dayIndex") or ""
    mxx_value = _as_float(item.get("mxx" if route == "MXX" else "ldx", 0), "外加中间体投入量")
    s1_out = _as_float(item.get("mxxflc", 0), "MXXFLC产量")
    s2_in = _as_float(item.get("x2_2d", 0), "X2_2D产量")
    s3_out = _as_float(item.get("cztg", 0), "CZTG产量")
    yx_out = _as_float(item.get("txxhcc", 0), "TXXHCC产量")
    ylsn = _as_float(item.get("ylsn", 0), "YLSN投入量")
    zp_out = _as_float(item.get("yttg", 0), "YTTG产量")
    product = _as_float(item.get("product", 0), "硬质糖果日产量")
    tg = _as_float(item.get("tg", 0), "TG日产量")

    expected_s2_in = MODEL_SEP_YIELD * s1_out + mxx_value
    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="s2_in_balance",
            constraint_name="二段入口平衡",
            field="x2_2d",
            actual=s2_in,
            expected=_format_expected_value(expected_s2_in, "L/min"),
            passed=_near(s2_in, expected_s2_in),
            message=(
                "二段入口平衡满足模型约束"
                if _near(s2_in, expected_s2_in)
                else f"{date} 二段入口平衡不满足：X2_2D应等于0.985*MXXFLC+外加中间体"
            ),
        )
    )

    expected_yx_out = MODEL_YX_YIELD * s3_out
    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="yx_balance",
            constraint_name="YX后处理平衡",
            field="txxhcc",
            actual=yx_out,
            expected=_format_expected_value(expected_yx_out, "L/min"),
            passed=_near(yx_out, expected_yx_out),
            message=(
                "YX后处理平衡满足模型约束"
                if _near(yx_out, expected_yx_out)
                else f"{date} YX后处理平衡不满足：TXXHCC应等于0.985*CZTG"
            ),
        )
    )

    ylsn_lower = 0.30 * yx_out
    ylsn_upper = 0.80 * yx_out
    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="ylsn_ratio",
            constraint_name="YLSN/主料比例",
            field="ylsn",
            actual=ylsn,
            expected=_format_expected_range(ylsn_lower, ylsn_upper, "L/min"),
            passed=_within(ylsn, ylsn_lower, ylsn_upper),
            message=(
                "YLSN/主料比例满足模型约束"
                if _within(ylsn, ylsn_lower, ylsn_upper)
                else f"{date} YLSN/主料比例不满足：YLSN应在TXXHCC的30%-80%之间"
            ),
        )
    )

    mxx_upper = 0.75 * MODEL_SEP_YIELD * s1_out
    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="mxx_ratio",
            constraint_name="外加中间体比例",
            field="mxx" if route == "MXX" else "ldx",
            actual=mxx_value,
            expected=_format_expected_range(None, mxx_upper, "L/min"),
            passed=_within(mxx_value, upper=mxx_upper),
            message=(
                "外加中间体比例满足模型约束"
                if _within(mxx_value, upper=mxx_upper)
                else f"{date} 外加中间体比例不满足：外加量不能超过0.75*0.985*MXXFLC"
            ),
        )
    )

    ratio = ylsn / (yx_out + 1e-4)
    expected_jz_yield = MODEL_JZ_BASE_YIELD + MODEL_JZ_YLSN_GAIN_MAX * (
        1.0 - math.exp(-MODEL_K_YLSN * ratio / MODEL_SCALE_YLSN_RATIO)
    )
    expected_zp_out = yx_out * expected_jz_yield * MODEL_XD_YIELD * MODEL_ZP_YIELD
    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="zp_out_balance",
            constraint_name="ZP后处理平衡",
            field="yttg",
            actual=zp_out,
            expected=_format_expected_value(expected_zp_out, "L/min"),
            passed=_near(zp_out, expected_zp_out),
            message=(
                "ZP后处理平衡满足模型约束"
                if _near(zp_out, expected_zp_out)
                else f"{date} ZP后处理平衡不满足：YTTG与TXXHCC、YLSN计算出的后处理产量不一致"
            ),
        )
    )

    expected_product = zp_out * MODEL_DAY_MINUTES * MODEL_SOLID_T_PER_L
    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="daily_product_balance",
            constraint_name="日产量平衡",
            field="product",
            actual=product,
            expected=_format_expected_value(expected_product, "t"),
            passed=_near(product, expected_product),
            message=(
                "日产量平衡满足模型约束"
                if _near(product, expected_product)
                else f"{date} 日产量平衡不满足：硬质糖果产量应等于YTTG换算产量"
            ),
        )
    )

    rows.append(
        _make_validation_row(
            date=date,
            day_index=day_index,
            constraint_key="tg_product_consistency",
            constraint_name="TG与日产量一致性",
            field="tg",
            actual=tg,
            expected=_format_expected_value(product, "t"),
            passed=_near(tg, product),
            message=(
                "TG与日产量一致"
                if _near(tg, product)
                else f"{date} TG产量与硬质糖果日产量不一致"
            ),
        )
    )


def _add_total_plan_validation_row(rows: list[dict], schedule: dict) -> None:
    plan = schedule.get("plan") or {}
    daily_results = schedule.get("dailyResults") or []
    total_product = sum(_as_float(item.get("product", 0), "硬质糖果日产量") for item in daily_results)
    target_amount = _as_float(plan.get("targetAmount", 0), "目标产量")
    passed = abs(total_product - target_amount) <= TARGET_TOTAL_TOLERANCE
    rows.append(
        {
            "date": "汇总",
            "dayIndex": "",
            "constraintKey": "total_plan_constraint",
            "constraintName": "计划总产量",
            "field": "product",
            "fieldLabel": "硬质糖果总产量",
            "unit": "t",
            "actual": round(total_product, 3),
            "expected": _format_expected_value(target_amount, "t"),
            "status": "pass" if passed else "fail",
            "message": "计划总产量满足模型约束" if passed else "计划总产量不满足：每日产量合计必须等于方案目标产量",
        }
    )


def validate_schedule_result_payload(schedule: dict | None) -> dict:
    if not schedule or not isinstance(schedule, dict):
        raise ValueError("调度方案不能为空")
    daily_results = schedule.get("dailyResults") or []
    if not isinstance(daily_results, list) or not daily_results:
        raise ValueError("调度方案没有可校验的每日优化结果")

    plan = schedule.get("plan") or {}
    route = _normalize_route(plan.get("route"))
    rows: list[dict] = []

    for item in daily_results:
        if not isinstance(item, dict):
            raise ValueError("每日优化结果格式不正确")
        _add_bounds_validation_rows(rows, item)
        _add_daily_equation_validation_rows(rows, item, route)

    _add_total_plan_validation_row(rows, schedule)
    failed_rows = [row for row in rows if row["status"] == "fail"]

    return {
        "plan": plan,
        "model": {
            "file": "optimize/hard_candy_popt.py",
            "name": "hard_candy_popt",
        },
        "compliant": not failed_rows,
        "summaryMessage": "调度方案合规" if not failed_rows else f"发现{len(failed_rows)}项约束异常",
        "rows": rows,
        "failedCount": len(failed_rows),
        "checkedCount": len(rows),
    }


def validate_schedule_plan_payload(plan_id: int) -> dict:
    schedule = get_schedule_plan(plan_id)
    if not schedule:
        raise ValueError("未找到对应的历史方案")
    schedule = _refresh_missing_intermediates(schedule)
    return validate_schedule_result_payload(schedule)


def get_schedule_constraint_fields_payload() -> list[dict]:
    return CONSTRAINT_PREVIEW_FIELDS


def preview_schedule_constraints_payload(payload: dict | None) -> dict:
    payload = payload or {}
    start_date, planning_days, target_amount, route = _validate_schedule_basis(payload)
    rules = _normalize_constraint_rules(payload.get("rules") or [])
    _validate_constraint_rules_for_route(rules, route)
    plan_name = str(payload.get("planName") or "约束试运行").strip() or "约束试运行"

    baseline = run_daily_schedule_model(
        start_date,
        target_amount,
        xh2_route=route,
        planning_days=planning_days,
    )
    baseline["plan"]["planName"] = plan_name
    baseline = _attach_schedule_projects(baseline)

    trial = None
    feasible = False
    messages = []
    try:
        trial = run_daily_schedule_model(
            start_date,
            target_amount,
            xh2_route=route,
            planning_days=planning_days,
            constraint_rules=rules,
        )
        trial["plan"]["planName"] = f"{plan_name}-试运行"
        trial = _attach_schedule_projects(trial)
        feasible = True
        messages.append("约束试运行求解成功")
    except Exception as exc:
        messages.append(f"约束试运行不可行或求解失败：{exc}")

    if trial:
        total_product = sum(float(item.get("product", 0) or 0) for item in trial["dailyResults"])
        target_satisfied = _target_is_satisfied(total_product, target_amount)
        constraints_effective = _constraints_effective(trial["dailyResults"], rules)
        messages.append("目标产量满足" if target_satisfied else "目标产量未满足")
        messages.append("约束已生效" if constraints_effective else "约束未全部满足")
    else:
        target_satisfied = False
        constraints_effective = False

    return {
        "baseline": baseline,
        "trial": trial,
        "rules": rules,
        "comparison": _build_constraint_comparison(baseline, trial),
        "checks": {
            "feasible": feasible,
            "targetSatisfied": target_satisfied,
            "constraintsEffective": constraints_effective,
            "messages": messages,
        },
    }


def optimize_schedule_payload(payload: dict | None) -> dict:
    payload = payload or {}
    plan_name = str(payload.get("planName") or "").strip()
    if not plan_name:
        raise ValueError("方案名称不能为空")
    if len(plan_name) > 128:
        raise ValueError("方案名称不能超过128个字符")
    if schedule_plan_name_exists(plan_name):
        raise ValueError("方案名称已存在，请重新命名")

    start_date = _require_date(payload.get("startDate"))
    planning_days = _require_positive_int(payload.get("planningDays", 7), "计划周期")
    if planning_days < MIN_PLANNING_DAYS or planning_days > MAX_PLANNING_DAYS:
        raise ValueError("计划周期必须在1-30天之间")

    target_amount = _require_non_negative_number(payload.get("targetAmount"), "目标产量")
    min_target_amount = planning_days * MIN_DAILY_PRODUCT_TON
    max_target_amount = planning_days * MAX_DAILY_PRODUCT_TON
    if target_amount < min_target_amount or target_amount > max_target_amount:
        raise ValueError(f"Target amount must be between {min_target_amount} and {max_target_amount} tons")

    route = str(payload.get("route", "MXX")).upper()

    schedule = run_daily_schedule_model(
        start_date,
        target_amount,
        xh2_route=route,
        planning_days=planning_days,
    )
    schedule["plan"]["planName"] = plan_name
    saved_plan = save_schedule_result(schedule)
    schedule["plan"]["id"] = saved_plan["id"]
    schedule["plan"]["planName"] = saved_plan["planName"]
    from webapp.modules.reports.service import generate_schedule_report

    schedule["report"] = generate_schedule_report(schedule)

    return _attach_schedule_projects(schedule)


def list_schedule_plan_payload() -> list[dict]:
    return list_schedule_plans()


def get_schedule_plan_payload(plan_id: int) -> dict:
    schedule = get_schedule_plan(plan_id)
    if not schedule:
        raise ValueError("未找到对应的历史方案")
    schedule = _refresh_missing_intermediates(schedule)
    return _attach_schedule_projects(schedule)


def delete_schedule_plan_payload(plan_id: int) -> dict:
    deleted = delete_schedule_plan(plan_id)
    if not deleted:
        raise ValueError("未找到对应的历史方案")
    return {"id": plan_id}
