from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.schedule.service import (
    delete_schedule_plan_payload,
    get_schedule_constraint_fields_payload,
    get_schedule_plan_payload,
    list_schedule_plan_payload,
    optimize_schedule_payload,
    preview_schedule_constraints_payload,
    validate_schedule_plan_payload,
)


schedule_bp = Blueprint("schedule", __name__)


@schedule_bp.route("/constraint-fields", methods=["GET", "OPTIONS"])
def get_schedule_constraint_fields():
    if request.method == "OPTIONS":
        return "", 204

    return api_response(True, 0, "约束字段读取完成", get_schedule_constraint_fields_payload())


@schedule_bp.route("/constraint-preview", methods=["POST", "OPTIONS"])
def preview_schedule_constraints():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = preview_schedule_constraints_payload(request.get_json(silent=True) or {})
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except FileNotFoundError as exc:
        return api_response(False, "MODEL_NOT_FOUND", str(exc)), 404
    except RuntimeError as exc:
        return api_response(False, "SCHEDULE_ERROR", str(exc)), 500
    except Exception as exc:
        return api_response(False, "SERVER_ERROR", str(exc)), 500

    return api_response(True, 0, "约束试运行完成", result)


@schedule_bp.route("/optimize", methods=["POST", "OPTIONS"])
def optimize_schedule():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}

    try:
        result = optimize_schedule_payload(payload)
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except FileNotFoundError as exc:
        return api_response(False, "MODEL_NOT_FOUND", str(exc)), 404
    except RuntimeError as exc:
        return api_response(False, "SCHEDULE_ERROR", str(exc)), 500
    except Exception as exc:
        return api_response(False, "SERVER_ERROR", str(exc)), 500

    return api_response(True, 0, "多负荷优化求解完成", result)


@schedule_bp.route("/plans", methods=["GET", "OPTIONS"])
def list_schedule_plan_history():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = list_schedule_plan_payload()
    except Exception as exc:
        return api_response(False, "SERVER_ERROR", str(exc)), 500

    return api_response(True, 0, "历史方案读取完成", result)


@schedule_bp.route("/plans/<int:plan_id>", methods=["GET", "OPTIONS"])
def get_schedule_plan_history(plan_id: int):
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = get_schedule_plan_payload(plan_id)
    except ValueError as exc:
        return api_response(False, "NOT_FOUND", str(exc)), 404
    except Exception as exc:
        return api_response(False, "SERVER_ERROR", str(exc)), 500

    return api_response(True, 0, "历史方案读取完成", result)


@schedule_bp.route("/plans/<int:plan_id>/validation", methods=["POST", "OPTIONS"])
def validate_schedule_plan_result(plan_id: int):
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = validate_schedule_plan_payload(plan_id)
    except ValueError as exc:
        return api_response(False, "NOT_FOUND", str(exc)), 404
    except Exception as exc:
        return api_response(False, "SERVER_ERROR", str(exc)), 500

    return api_response(True, 0, result["summaryMessage"], result)


@schedule_bp.route("/plans/<int:plan_id>", methods=["DELETE", "OPTIONS"])
def delete_schedule_plan_history(plan_id: int):
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = delete_schedule_plan_payload(plan_id)
    except ValueError as exc:
        return api_response(False, "NOT_FOUND", str(exc)), 404
    except Exception as exc:
        return api_response(False, "SERVER_ERROR", str(exc)), 500

    return api_response(True, 0, "历史方案删除完成", result)
