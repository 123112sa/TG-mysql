from flask import Blueprint

from webapp.common.responses import api_response


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    return api_response(True, 0, "ok")
