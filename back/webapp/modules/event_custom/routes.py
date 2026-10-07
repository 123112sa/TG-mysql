from flask import Blueprint, request

from webapp.common.responses import api_response
from webapp.modules.event_custom.service import save_event_custom_payload, save_output_target_payload


event_custom_bp = Blueprint("event_custom", __name__)


@event_custom_bp.route("/save", methods=["POST", "OPTIONS"])
def save_event_custom():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}

    try:
        rows = save_event_custom_payload(payload)
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(
        True,
        0,
        "\u4e8b\u4ef6\u81ea\u5b9a\u4e49\u5df2\u4fdd\u5b58",
        {
            "inputs": rows,
        },
    )


@event_custom_bp.route("/output-target/save", methods=["POST", "OPTIONS"])
def save_output_target():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}

    try:
        row = save_output_target_payload(payload)
    except ValueError as exc:
        return api_response(False, "VALIDATION_ERROR", str(exc)), 400
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    return api_response(
        True,
        0,
        "\u8f93\u51fa\u5230\u8f93\u5165\u76ee\u6807\u5df2\u4fdd\u5b58",
        {
            "target": row,
        },
    )
