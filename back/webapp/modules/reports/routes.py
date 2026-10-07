from flask import Blueprint, request, send_file

from webapp.common.responses import api_response
from webapp.modules.reports.service import (
    EXCEL_MIME_TYPE,
    get_custom_schedule_report_file,
    get_existing_report_file,
    get_schedule_report_fields,
    get_schedule_report_file,
    list_report_files,
)


reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/list", methods=["GET", "OPTIONS"])
def list_history_reports():
    if request.method == "OPTIONS":
        return "", 204

    try:
        return api_response(True, 0, "历史报表列表读取成功", list_report_files())
    except OSError as exc:
        return api_response(False, "REPORT_LIST_ERROR", f"历史报表列表读取失败：{exc}"), 500


@reports_bp.route("/files/<path:file_name>", methods=["GET"])
def open_history_report(file_name: str):
    try:
        report_path, download_name = get_existing_report_file(file_name)
    except FileNotFoundError as exc:
        return api_response(False, "REPORT_NOT_FOUND", str(exc)), 404
    except ValueError as exc:
        return api_response(False, "REPORT_NAME_INVALID", str(exc)), 400
    except OSError as exc:
        return api_response(False, "REPORT_OPEN_ERROR", f"报表文件读取失败：{exc}"), 500

    return send_file(
        report_path,
        mimetype=EXCEL_MIME_TYPE,
        as_attachment=False,
        download_name=download_name,
    )


@reports_bp.route("/schedule/<int:plan_id>", methods=["GET"])
def download_schedule_report(plan_id: int):
    try:
        report_path, file_name = get_schedule_report_file(plan_id)
    except ValueError as exc:
        return api_response(False, "NOT_FOUND", str(exc)), 404
    except Exception as exc:  # noqa: BLE001
        return api_response(False, "REPORT_ERROR", str(exc)), 500

    return send_file(
        report_path,
        mimetype=EXCEL_MIME_TYPE,
        as_attachment=True,
        download_name=file_name,
    )


@reports_bp.route("/schedule/fields", methods=["GET", "OPTIONS"])
def list_schedule_report_fields():
    if request.method == "OPTIONS":
        return "", 204
    return api_response(True, 0, "报表字段读取完成", get_schedule_report_fields())


@reports_bp.route("/schedule/<int:plan_id>/custom", methods=["POST", "OPTIONS"])
def download_custom_schedule_report(plan_id: int):
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    try:
        report_path, file_name = get_custom_schedule_report_file(plan_id, payload.get("fields") or [])
    except ValueError as exc:
        status = 404 if "未找到" in str(exc) else 400
        return api_response(False, "CUSTOM_REPORT_ERROR", str(exc)), status
    except Exception as exc:  # noqa: BLE001
        return api_response(False, "REPORT_ERROR", str(exc)), 500

    return send_file(
        report_path,
        mimetype=EXCEL_MIME_TYPE,
        as_attachment=True,
        download_name=file_name,
    )
