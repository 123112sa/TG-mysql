from __future__ import annotations

import math

from webapp.modules.material_calculation import repository


ALLOWED_MODES = {"input-to-output", "output-to-input"}
ALLOWED_ROUTES = {"MXX", "LDX"}
MATERIAL_FIELD_MAP = {"jb": "JB", "mxx": "MXX", "ldx": "L/DX", "ylsn": "YLSN"}


class MaterialNotFoundError(ValueError):
    pass


class MaterialConflictError(ValueError):
    pass


def _number(value, field_name: str) -> float:
    if value is None or value == "":
        raise ValueError(f"{field_name}不能为空")
    try:
        result = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name}必须是数字") from exc
    if not math.isfinite(result) or result < 0:
        raise ValueError(f"{field_name}必须是有限的非负数")
    return result


def _mode_and_route(payload: dict) -> tuple[str, str]:
    mode = str(payload.get("mode") or "").strip()
    route = str(payload.get("route") or "").strip().upper()
    if mode not in ALLOWED_MODES:
        raise ValueError("不支持的测算模式")
    if route not in ALLOWED_ROUTES:
        raise ValueError("不支持的生产路线")
    return mode, route


def normalize_parameter_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("请求体格式错误")
    mode, route = _mode_and_route(payload)
    result = {"mode": mode, "route": route}

    if mode == "input-to-output":
        source = payload.get("inputs")
        if not isinstance(source, dict):
            raise ValueError("产量预测必须提供JB、MXX、L/DX、YLSN投入量")
        missing = [
            material_code
            for frontend_name, material_code in MATERIAL_FIELD_MAP.items()
            if source.get(frontend_name, source.get(material_code)) in (None, "")
        ]
        if missing:
            raise ValueError("产量预测必须完整提供JB、MXX、L/DX、YLSN投入量")
        inputs = {}
        for frontend_name, material_code in MATERIAL_FIELD_MAP.items():
            value = source.get(frontend_name, source.get(material_code))
            inputs[material_code] = _number(value, f"{material_code}投入量")
        result["inputs"] = inputs
    else:
        source = payload.get("target")
        if not isinstance(source, dict):
            raise ValueError("投料反算必须提供目标产品和目标产量")
        product_code = str(source.get("productCode") or source.get("productName") or "TG").strip()
        if not product_code:
            raise ValueError("目标产品不能为空")
        result["target"] = {
            "productCode": "TG" if product_code == "硬质糖果成品" else product_code,
            "productName": "硬质糖果成品" if product_code == "TG" else product_code,
            "amount": _number(source.get("amount"), "目标产量"),
        }
    return result


def _configuration_response(mode: str, context: dict | None) -> dict:
    base = {
        "mode": mode,
        "route": (context or {}).get("route", "MXX"),
        "version": (context or {}).get("version", 0),
        "updatedAt": (context or {}).get("updatedAt", ""),
    }
    if mode == "input-to-output":
        stored = repository.get_current_inputs()
        base["inputs"] = {
            frontend: stored.get(material, 0.0)
            for frontend, material in MATERIAL_FIELD_MAP.items()
        }
    else:
        target = repository.get_current_target() or {"productCode": "TG", "amount": 0.0}
        base["target"] = {
            **target,
            "productName": "硬质糖果成品" if target["productCode"] == "TG" else target["productCode"],
        }
    return base


def get_current_parameters(mode: str) -> dict:
    if mode not in ALLOWED_MODES:
        raise ValueError("不支持的测算模式")
    return _configuration_response(mode, repository.get_current_context(mode))


def save_current_parameters(payload: dict) -> dict:
    configuration = normalize_parameter_payload(payload)
    saved = repository.save_current_configuration(configuration)
    return _configuration_response(saved["mode"], saved)


def normalize_template_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("请求体格式错误")
    name = str(payload.get("name") or "").strip()
    description = str(payload.get("description") or "").strip()
    if not name:
        raise ValueError("模板名称不能为空")
    if len(name) > 128:
        raise ValueError("模板名称不能超过128个字符")
    if len(description) > 500:
        raise ValueError("模板说明不能超过500个字符")
    return {"name": name, "description": description, **normalize_parameter_payload(payload)}


def _normalize_template_response(template: dict) -> dict:
    result = dict(template)
    if result.get("inputs"):
        stored = result["inputs"]
        result["inputs"] = {
            frontend: stored.get(material, 0.0)
            for frontend, material in MATERIAL_FIELD_MAP.items()
        }
    target = result.get("target")
    if target:
        target = dict(target)
        target["productName"] = "硬质糖果成品" if target.get("productCode") == "TG" else target.get("productCode")
        result["target"] = target
    return result


def list_template_payloads() -> list[dict]:
    return [_normalize_template_response(item) for item in repository.list_templates()]


def get_template_payload(template_id: int) -> dict:
    template = repository.get_template(template_id)
    if template is None:
        raise MaterialNotFoundError("模板不存在")
    return _normalize_template_response(template)


def create_template_payload(payload: dict) -> dict:
    template = normalize_template_payload(payload)
    if repository.template_name_exists(template["name"]):
        raise MaterialConflictError("模板名称已存在")
    return _normalize_template_response(repository.create_template(template))


def update_template_payload(template_id: int, payload: dict) -> dict:
    expected_version = payload.get("version")
    if not isinstance(expected_version, int) or expected_version < 1:
        raise ValueError("version必须是正整数")
    if repository.get_template(template_id) is None:
        raise MaterialNotFoundError("模板不存在")
    template = normalize_template_payload(payload)
    if repository.template_name_exists(template["name"], exclude_id=template_id):
        raise MaterialConflictError("模板名称已存在")
    updated = repository.update_template(template_id, template, expected_version)
    if updated is None:
        raise MaterialConflictError("模板已被其他操作更新，请刷新后重试")
    return _normalize_template_response(updated)


def copy_template_payload(template_id: int, payload: dict) -> dict:
    source = repository.get_template(template_id)
    if source is None:
        raise MaterialNotFoundError("模板不存在")
    requested_name = str((payload or {}).get("name") or f'{source["name"]} 副本').strip()
    candidate = {
        **source,
        "name": requested_name,
        "description": str((payload or {}).get("description", source["description"])),
    }
    for field in ("id", "version", "createdAt", "updatedAt"):
        candidate.pop(field, None)
    return create_template_payload(candidate)


def delete_template_payload(template_id: int) -> None:
    if not repository.delete_template(template_id):
        raise MaterialNotFoundError("模板不存在")


def save_legacy_forward_payload(payload: dict) -> list[dict]:
    source = payload.get("input")
    if not isinstance(source, dict):
        raise ValueError("请求体必须包含input对象")
    saved = save_current_parameters(
        {"mode": "input-to-output", "route": payload.get("route", "MXX"), "inputs": source}
    )
    return [
        {"inputName": material, "inputAmount": saved["inputs"][frontend]}
        for frontend, material in MATERIAL_FIELD_MAP.items()
    ]


def save_legacy_target_payload(payload: dict) -> dict:
    source = payload.get("target")
    if not isinstance(source, dict):
        raise ValueError("请求体必须包含target对象")
    saved = save_current_parameters(
        {"mode": "output-to-input", "route": payload.get("route", "MXX"), "target": source}
    )
    return {
        "inputName": saved["target"]["productCode"],
        "inputAmount": saved["target"]["amount"],
    }
