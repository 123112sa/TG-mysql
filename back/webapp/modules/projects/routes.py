from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.projects.repository import (
    delete_project,
    list_projects,
    read_project,
    write_project,
)


projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/list", methods=["POST", "OPTIONS"])
def list_project_files():
    if request.method == "OPTIONS":
        return "", 204

    try:
        return api_response(True, 0, "工程文件列表读取成功", list_projects())
    except OSError as exc:
        return api_response(False, "PROJECT_LIST_ERROR", f"工程文件列表读取失败：{exc}"), 500


@projects_bp.route("/open", methods=["POST", "OPTIONS"])
def open_project_file():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    project_name = payload.get("projectName", "")

    try:
        project = read_project(project_name)
        return api_response(True, 0, "工程文件读取成功", project)
    except FileNotFoundError as exc:
        return api_response(False, "PROJECT_NOT_FOUND", str(exc)), 404
    except ValueError as exc:
        return api_response(False, "PROJECT_NAME_INVALID", str(exc)), 400
    except Exception as exc:
        return api_response(False, "PROJECT_OPEN_ERROR", f"工程文件读取失败：{exc}"), 500


@projects_bp.route("/save", methods=["POST", "OPTIONS"])
def save_project_file():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    project = payload.get("project")

    try:
        saved_file = write_project(project)
        return api_response(True, 0, "工程文件保存成功", saved_file)
    except ValueError as exc:
        return api_response(False, "PROJECT_INVALID", str(exc)), 400
    except OSError as exc:
        return api_response(False, "PROJECT_SAVE_ERROR", f"工程文件保存失败：{exc}"), 500


@projects_bp.route("/delete", methods=["POST", "OPTIONS"])
def delete_project_file():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    project_name = payload.get("projectName", "")

    try:
        delete_project(project_name)
        return api_response(True, 0, "工程文件删除成功")
    except FileNotFoundError as exc:
        return api_response(False, "PROJECT_NOT_FOUND", str(exc)), 404
    except ValueError as exc:
        return api_response(False, "PROJECT_NAME_INVALID", str(exc)), 400
    except OSError as exc:
        return api_response(False, "PROJECT_DELETE_ERROR", f"工程文件删除失败：{exc}"), 500


@projects_bp.route("/rename-components", methods=["POST", "OPTIONS"])
def rename_project_components():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    project = payload.get("project")

    if not isinstance(project, dict):
        return api_response(False, "PROJECT_INVALID", "工程数据格式错误"), 400

    return api_response(True, 0, "组件改名规则已接收", project)
