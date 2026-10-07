from typing import Any

from flask import jsonify


def api_response(success: bool, code, message: str, data: Any = None):
    body = {
        "success": success,
        "code": code,
        "message": message,
    }
    if data is not None:
        body["data"] = data

    return jsonify(body)
