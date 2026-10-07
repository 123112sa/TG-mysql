from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.calculation.service import calculate_all
from webapp.modules.solve.service import (
    calculate_output_to_input,
    read_factory_project_with_reverse_stream_values,
    read_factory_project_with_stream_values,
)


solve_bp = Blueprint("solve", __name__)


@solve_bp.route("/input-output", methods=["POST", "OPTIONS"])
def input_to_output():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    route = payload.get("route")

    try:
        result = calculate_all(route=route)
        result["project"] = read_factory_project_with_stream_values()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except FileNotFoundError as exc:
        return api_response(False, "PROJECT_NOT_FOUND", str(exc)), 404
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "\u8f93\u5165\u5230\u8f93\u51fa\u8fd0\u7b97\u5b8c\u6210", result)


@solve_bp.route("/output-input", methods=["POST", "OPTIONS"])
def output_to_input():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    route = str(payload.get("route", "LDX")).upper()

    try:
        result = calculate_output_to_input(route)
        result["project"] = read_factory_project_with_reverse_stream_values()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except FileNotFoundError as exc:
        return api_response(False, "PROJECT_NOT_FOUND", str(exc)), 404
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "\u8f93\u51fa\u5230\u8f93\u5165\u8fd0\u7b97\u5b8c\u6210", result)
