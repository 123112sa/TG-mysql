from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.calculation.repository import read_feed_inputs, read_output_amount, read_output_amounts
from webapp.modules.calculation.service import (
    calculate_all,
    calculate_jz,
    calculate_xh1d,
    calculate_xh23d,
    calculate_yx,
    calculate_zp,
    save_feed_payload,
)


calculation_bp = Blueprint("calculation", __name__)


@calculation_bp.route("/feed-input", methods=["POST", "OPTIONS"])
def save_feed_input():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}

    try:
        rows = save_feed_payload(payload)
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "投料量保存成功", {"inputs": rows})


@calculation_bp.get("/feed-input")
def get_feed_input():
    try:
        rows = read_feed_inputs()
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "投料量读取成功", {"inputs": rows})


@calculation_bp.route("/run", methods=["POST", "OPTIONS"])
def run_all_calculation():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}

    try:
        result = calculate_all(payload if payload else None)
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "系统运算完成", result)


@calculation_bp.get("/output")
def get_all_output():
    try:
        outputs = read_output_amounts()
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "系统输出读取成功", {"outputs": outputs})


@calculation_bp.route("/xh1d/run", methods=["POST", "OPTIONS"])
def run_xh1d_calculation():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = calculate_xh1d()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "XH1D计算完成", result)


@calculation_bp.get("/xh1d/output")
def get_xh1d_output():
    try:
        output = read_output_amount("MXXFLC")
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "XH1D输出读取成功", {"output": output})


@calculation_bp.route("/xh23d/run", methods=["POST", "OPTIONS"])
def run_xh23d_calculation():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = calculate_xh23d()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "XH23D计算完成", result)


@calculation_bp.get("/xh23d/output")
def get_xh23d_output():
    try:
        outputs = [
            read_output_amount("X2_2D"),
            read_output_amount("CZTG"),
        ]
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "XH23D输出读取成功", {"outputs": outputs})


@calculation_bp.route("/yx/run", methods=["POST", "OPTIONS"])
def run_yx_calculation():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = calculate_yx()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "YX计算完成", result)


@calculation_bp.get("/yx/output")
def get_yx_output():
    try:
        output = read_output_amount("TXXHCC")
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "YX输出读取成功", {"output": output})


@calculation_bp.route("/jz/run", methods=["POST", "OPTIONS"])
def run_jz_calculation():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = calculate_jz()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "JZ计算完成", result)


@calculation_bp.get("/jz/output")
def get_jz_output():
    try:
        output = read_output_amount("YTTG")
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "JZ输出读取成功", {"output": output})


@calculation_bp.route("/zp/run", methods=["POST", "OPTIONS"])
def run_zp_calculation():
    if request.method == "OPTIONS":
        return "", 204

    try:
        result = calculate_zp()
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "ZP计算完成", result)


@calculation_bp.get("/zp/output")
def get_zp_output():
    try:
        output = read_output_amount("TG")
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "ZP输出读取成功", {"output": output})
