from webapp.modules.calculation.repository import (
    SUPPORTED_INPUT_NAMES,
    SYSTEM_OUTPUT_NAMES,
    read_assay,
    read_input_amounts,
    read_output_amounts,
    require_output_amount,
    save_feed_inputs,
    save_output_amount,
)
from webapp.modules.optimization_runner import run_input_to_output_model


def parse_amount(value, input_name: str) -> float:
    if value is None or value == "":
        raise ValueError(f"{input_name}不能为空")

    try:
        amount = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{input_name}必须是数字") from exc

    if amount < 0:
        raise ValueError(f"{input_name}不能小于0")

    return amount


def normalize_feed_payload(payload: dict) -> dict[str, float]:
    source = payload.get("inputs", payload)
    if not isinstance(source, dict):
        raise ValueError("请求体必须包含inputs对象")

    feed_inputs = {}
    for input_name in sorted(SUPPORTED_INPUT_NAMES):
        feed_inputs[input_name] = parse_amount(source.get(input_name), input_name)

    return feed_inputs


def save_feed_payload(payload: dict) -> list[dict[str, float | str]]:
    feed_inputs = normalize_feed_payload(payload)
    return save_feed_inputs(feed_inputs)


def require_input_amounts(input_names: tuple[str, ...]) -> dict[str, float]:
    input_amounts = read_input_amounts(set(input_names))
    missing_inputs = [name for name in input_names if name not in input_amounts]
    if missing_inputs:
        raise ValueError(f"缺少投料量：{', '.join(missing_inputs)}")

    return input_amounts


def round_output_amount(amount: float) -> float:
    return round(amount, 3)


def calculate_xh1d() -> dict:
    input_amounts = require_input_amounts(("JB", "MXX"))
    jb_amount = input_amounts["JB"]
    mxx_amount = input_amounts["MXX"]
    assay = read_assay("X1")
    total_input_amount = jb_amount + mxx_amount
    output_amount = round_output_amount(total_input_amount * assay)
    output = save_output_amount("MXXFLC", output_amount)

    return {
        "canvasName": "XH1D",
        "equipment": "X1",
        "assay": assay,
        "formula": "(JB + MXX) * X1",
        "inputs": [
            {
                "inputName": "JB",
                "inputAmount": jb_amount,
            },
            {
                "inputName": "MXX",
                "inputAmount": mxx_amount,
            },
        ],
        "totalInputAmount": round_output_amount(total_input_amount),
        "output": output,
    }


def calculate_xh23d() -> dict:
    input_amounts = require_input_amounts(("L/DX",))
    mxxflc_amount = require_output_amount("MXXFLC")
    ldx_amount = input_amounts["L/DX"]

    x2_2d_assay = read_assay("X2_2D")
    total_input_amount = mxxflc_amount + ldx_amount
    x2_2d_amount = round_output_amount(total_input_amount * x2_2d_assay)
    x2_2d_output = save_output_amount("X2_2D", x2_2d_amount)

    x2_3d_assay = read_assay("X2_3D")
    cztg_amount = round_output_amount(x2_2d_amount * x2_3d_assay)
    cztg_output = save_output_amount("CZTG", cztg_amount)

    return {
        "canvasName": "XH23D",
        "steps": [
            {
                "equipment": "X2_2D",
                "assay": x2_2d_assay,
                "formula": "(MXXFLC + L/DX) * X2_2D",
                "inputs": [
                    {
                        "outputName": "MXXFLC",
                        "outputAmount": mxxflc_amount,
                    },
                    {
                        "inputName": "L/DX",
                        "inputAmount": ldx_amount,
                    },
                ],
                "totalInputAmount": round_output_amount(total_input_amount),
                "output": x2_2d_output,
            },
            {
                "equipment": "X2_3D",
                "assay": x2_3d_assay,
                "formula": "X2_2D * X2_3D",
                "inputs": [
                    x2_2d_output,
                ],
                "output": cztg_output,
            },
        ],
        "outputs": [
            x2_2d_output,
            cztg_output,
        ],
    }


def calculate_yx() -> dict:
    cztg_amount = require_output_amount("CZTG")
    assay = read_assay("YX")
    output_amount = round_output_amount(cztg_amount * assay)
    output = save_output_amount("TXXHCC", output_amount)

    return {
        "canvasName": "YX",
        "equipment": "YX",
        "assay": assay,
        "formula": "CZTG * YX",
        "inputs": [
            {
                "outputName": "CZTG",
                "outputAmount": cztg_amount,
            },
        ],
        "output": output,
    }


def calculate_jz() -> dict:
    input_amounts = require_input_amounts(("YLSN",))
    txxhcc_amount = require_output_amount("TXXHCC")
    ylsn_amount = input_amounts["YLSN"]
    assay = read_assay("JZ")
    total_input_amount = txxhcc_amount + ylsn_amount
    output_amount = round_output_amount(total_input_amount * assay)
    output = save_output_amount("YTTG", output_amount)

    return {
        "canvasName": "JZ",
        "equipment": "JZ",
        "assay": assay,
        "formula": "(TXXHCC + YLSN) * JZ",
        "inputs": [
            {
                "outputName": "TXXHCC",
                "outputAmount": txxhcc_amount,
            },
            {
                "inputName": "YLSN",
                "inputAmount": ylsn_amount,
            },
        ],
        "totalInputAmount": round_output_amount(total_input_amount),
        "output": output,
    }


def calculate_zp() -> dict:
    yttg_amount = require_output_amount("YTTG")
    assay = read_assay("ZP")
    output_amount = round_output_amount(yttg_amount * assay)
    output = save_output_amount("TG", output_amount)

    return {
        "canvasName": "ZP",
        "equipment": "ZP",
        "assay": assay,
        "formula": "YTTG * ZP",
        "inputs": [
            {
                "outputName": "YTTG",
                "outputAmount": yttg_amount,
            },
        ],
        "output": output,
    }


def calculate_all(payload: dict | None = None, *, route: str | None = None) -> dict:
    saved_inputs = None
    if payload:
        saved_inputs = save_feed_payload(payload)

    input_amounts = require_input_amounts(("JB", "MXX", "L/DX", "YLSN"))
    optimization_result = run_input_to_output_model(input_amounts, xh2_route=route)
    output_rows = [
        save_output_amount(output_name, output_amount)
        for output_name, output_amount in optimization_result["outputs"].items()
    ]

    return {
        "inputs": saved_inputs,
        "steps": [
            {
                "model": "tnt_continuous_scheduling_model",
                "route": optimization_result["route"],
                "assays": optimization_result["assays"],
                "modelParameters": optimization_result["modelParameters"],
                "rawMaterial": optimization_result["rawMaterial"],
                "outputs": output_rows,
            }
        ],
        "outputs": read_output_amounts(SYSTEM_OUTPUT_NAMES),
    }
