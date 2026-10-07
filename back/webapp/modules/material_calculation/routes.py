from __future__ import annotations

from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.material_calculation import service


material_calculation_bp = Blueprint("material_calculation", __name__)


def _success(message: str, data=None, status: int = 200):
    return api_response(True, 0, message, data), status


def _execute(action):
    try:
        return action()
    except service.MaterialNotFoundError as exc:
        return api_response(False, "NOT_FOUND", str(exc)), 404
    except service.MaterialConflictError as exc:
        return api_response(False, "VERSION_CONFLICT", str(exc)), 409
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500


@material_calculation_bp.route("/parameters/current", methods=["GET", "PUT", "OPTIONS"])
def current_parameters():
    if request.method == "OPTIONS":
        return "", 204
    if request.method == "GET":
        return _execute(
            lambda: _success(
                "当前参数获取成功",
                service.get_current_parameters(request.args.get("mode", "")),
            )
        )
    payload = request.get_json(silent=True) or {}
    return _execute(lambda: _success("参数保存成功", service.save_current_parameters(payload)))


@material_calculation_bp.route("/templates", methods=["GET", "POST", "OPTIONS"])
def templates():
    if request.method == "OPTIONS":
        return "", 204
    if request.method == "GET":
        return _execute(lambda: _success("模板列表获取成功", service.list_template_payloads()))
    payload = request.get_json(silent=True) or {}
    return _execute(lambda: _success("模板创建成功", service.create_template_payload(payload), 201))


@material_calculation_bp.route(
    "/templates/<int:template_id>", methods=["GET", "PUT", "DELETE", "OPTIONS"]
)
def template_detail(template_id: int):
    if request.method == "OPTIONS":
        return "", 204
    if request.method == "GET":
        return _execute(lambda: _success("模板获取成功", service.get_template_payload(template_id)))
    if request.method == "PUT":
        payload = request.get_json(silent=True) or {}
        return _execute(
            lambda: _success("模板更新成功", service.update_template_payload(template_id, payload))
        )

    def delete_action():
        service.delete_template_payload(template_id)
        return _success("模板删除成功")

    return _execute(delete_action)


@material_calculation_bp.route("/templates/<int:template_id>/copy", methods=["POST", "OPTIONS"])
def copy_template(template_id: int):
    if request.method == "OPTIONS":
        return "", 204
    payload = request.get_json(silent=True) or {}
    return _execute(
        lambda: _success("模板复制成功", service.copy_template_payload(template_id, payload), 201)
    )

