from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.auth.repository import create_user, find_user


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    user_id = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if not user_id or not password:
        return api_response(False, "VALIDATION_ERROR", "账号和密码不能为空"), 400

    try:
        if find_user(user_id) is not None:
            return api_response(False, "USERNAME_EXISTS", "账号已存在"), 409

        create_user(user_id, password)
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(True, 0, "注册成功")


@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    user_id = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if not user_id or not password:
        return api_response(False, "VALIDATION_ERROR", "账号和密码不能为空"), 400

    try:
        user = find_user(user_id)
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    if user is None:
        return api_response(False, "USERNAME_NOT_FOUND", "账号不存在"), 404

    if user["password"] != password:
        return api_response(False, "PASSWORD_ERROR", "密码错误"), 401

    response_user = {
        "id": user["id"],
        "username": user["id"],
        "displayName": user["id"],
    }

    return api_response(
        True,
        0,
        "登录成功",
        data={
            "user": response_user,
            "token": str(user["id"]),
        },
    )
