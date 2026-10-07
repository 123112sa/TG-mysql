from flask import Blueprint

from webapp.common.responses import api_response
from webapp.modules.calculation.repository import read_output_amount


factory_products_bp = Blueprint("factory_products", __name__)


@factory_products_bp.get("")
def get_factory_product():
    try:
        output = read_output_amount("TG")
    except RuntimeError as exc:
        return api_response(False, "DATABASE_ERROR", str(exc)), 500

    amount = 0.0
    if output is not None and output.get("outputAmount") is not None:
        amount = round(float(output["outputAmount"]), 3)

    return api_response(
        True,
        0,
        "出厂产品读取成功",
        {
            "productName": "硬质糖果成品",
            "amount": amount,
            "unit": "吨",
        },
    )
