from copy import deepcopy

from webapp.modules.calculation.repository import (
    SYSTEM_OUTPUT_NAMES,
    read_assay,
    read_feed_inputs,
    read_output_amounts,
    read_ratios,
)
from webapp.modules.calculation.service import round_output_amount
from webapp.modules.event_custom.repository import keep_only_reverse_target, read_reverse_target_amount
from webapp.modules.optimization_runner import run_output_to_input_model
from webapp.modules.projects.repository import read_project
from webapp.modules.solve.repository import read_reverse_output_amount, save_reverse_output_amount


FACTORY_PROJECT_NAME = "\u5316\u5de5\u5382"

STREAM_VALUE_SOURCES = {
    "\u6d41\u80a1": ("input", "JB"),
    "\u6d41\u80a1_1": ("input", "MXX"),
    "\u6d41\u80a1_2": ("output", "MXXFLC"),
    "\u6d41\u80a1_3": ("output", "MXXFLC"),
    "\u6d41\u80a1_4": ("input", "L/DX"),
    "\u6d41\u80a1_5": ("output", "X2_2D"),
    "\u6d41\u80a1_6": ("output", "CZTG"),
    "\u6d41\u80a1_7": ("output", "CZTG"),
    "\u6d41\u80a1_8": ("output", "TXXHCC"),
    "\u6d41\u80a1_9": ("output", "TXXHCC"),
    "\u6d41\u80a1_10": ("input", "YLSN"),
    "\u6d41\u80a1_11": ("output", "YTTG"),
    "\u6d41\u80a1_12": ("output", "TG"),
    "\u6d41\u80a1_13": ("output", "YTTG"),
}


def format_amount(value: float | int | str) -> str:
    return f"{float(value):.3f}"


def format_stream_label(source_name: str, value: float | int | str) -> str:
    unit = "t" if source_name == "TG" else "L/min"
    return f"{source_name}\n{format_amount(value)}{unit}"


def read_input_value_map() -> dict[str, float]:
    return {
        str(row["inputName"]): float(row["inputAmount"])
        for row in read_feed_inputs()
    }


def read_output_value_map() -> dict[str, float]:
    return {
        str(row["outputName"]): float(row["outputAmount"])
        for row in read_output_amounts(SYSTEM_OUTPUT_NAMES)
    }


def build_stream_replacements() -> dict[str, str]:
    inputs = read_input_value_map()
    outputs = read_output_value_map()
    replacements = {}

    for stream_name, (source_type, source_name) in STREAM_VALUE_SOURCES.items():
        source = inputs if source_type == "input" else outputs
        if source_name not in source:
            raise ValueError(f"\u7f3a\u5c11{source_type}\u6570\u503c\uff1a{source_name}")

        replacements[stream_name] = format_stream_label(source_name, source[source_name])

    return replacements


def build_reverse_stream_replacements() -> dict[str, str]:
    replacements = {}

    for stream_name, (source_type, source_name) in STREAM_VALUE_SOURCES.items():
        if source_name == "TG":
            row = read_reverse_target_amount(source_name)
            value_key = "inputAmount"
        else:
            row = read_reverse_output_amount(source_name)
            value_key = "outputAmount"

        if row is None:
            raise ValueError(f"\u7f3a\u5c11\u53cd\u5411{source_type}\u6570\u503c\uff1a{source_name}")

        replacements[stream_name] = format_stream_label(source_name, row[value_key])

    return replacements


def replace_project_stream_names(project: dict, replacements: dict[str, str]) -> dict:
    next_project = deepcopy(project)
    content = next_project.get("graph", {}).get("content", {})

    if not isinstance(content, dict):
        raise ValueError("\u5de5\u7a0b\u6587\u4ef6\u7f3a\u5c11 graph.content")

    for canvas in content.values():
        if not isinstance(canvas, dict):
            continue

        for model in canvas.get("gm", []):
            if not isinstance(model, dict):
                continue

            name = model.get("name")
            if name in replacements:
                model["sourceName"] = name
                model["name"] = replacements[name]

    return next_project


def read_factory_project_with_stream_values(project_name: str = FACTORY_PROJECT_NAME) -> dict:
    project = read_project(project_name)
    replacements = build_stream_replacements()
    next_project = replace_project_stream_names(project, replacements)
    next_project["streamValues"] = replacements
    return next_project


def read_factory_project_with_reverse_stream_values(project_name: str = FACTORY_PROJECT_NAME) -> dict:
    project = read_project(project_name)
    replacements = build_reverse_stream_replacements()
    next_project = replace_project_stream_names(project, replacements)
    next_project["streamValues"] = replacements
    return next_project


def require_reverse_target_amount(input_name: str) -> float:
    row = read_reverse_target_amount(input_name)
    if row is None:
        raise ValueError(f"\u7f3a\u5c11\u53cd\u5411\u8f93\u5165\u91cf\uff1a{input_name}")

    return float(row["inputAmount"])


def require_reverse_output_amount(output_name: str) -> float:
    row = read_reverse_output_amount(output_name)
    if row is None:
        raise ValueError(f"\u7f3a\u5c11\u53cd\u5411\u8f93\u51fa\u91cf\uff1a{output_name}")

    return float(row["outputAmount"])


def require_reverse_ratios(input_names: tuple[str, ...]) -> dict[str, float]:
    ratios = read_ratios(set(input_names))
    missing_ratios = [name for name in input_names if name not in ratios]
    if missing_ratios:
        raise ValueError(f"\u7f3a\u5c11\u53cd\u5411\u914d\u6bd4\uff1a{', '.join(missing_ratios)}")

    return ratios


def require_nonzero_assay(equipment: str) -> float:
    assay = read_assay(equipment)
    if assay == 0:
        raise ValueError(f"{equipment}\u6536\u7387\u4e0d\u80fd\u4e3a0")

    return assay


def calculate_reverse_zp() -> dict:
    tg_amount = require_reverse_target_amount("TG")
    assay = require_nonzero_assay("ZP")

    yttg_amount = round_output_amount(tg_amount / assay)
    output = save_reverse_output_amount("YTTG", yttg_amount)

    return {
        "canvasName": "ZP",
        "equipment": "ZP",
        "assay": assay,
        "formula": "TG / ZP",
        "inputs": [
            {
                "inputName": "TG",
                "inputAmount": tg_amount,
            }
        ],
        "output": output,
    }


def calculate_reverse_jz() -> dict:
    yttg_amount = require_reverse_output_amount("YTTG")
    assay = require_nonzero_assay("JZ")
    ratios = require_reverse_ratios(("TXXHCC", "YLSN"))
    txxhcc_ratio = ratios["TXXHCC"]
    ylsn_ratio = ratios["YLSN"]

    total_input_amount = yttg_amount / assay
    txxhcc_amount = round_output_amount(total_input_amount * txxhcc_ratio)
    ylsn_amount = round_output_amount(total_input_amount * ylsn_ratio)
    txxhcc_output = save_reverse_output_amount("TXXHCC", txxhcc_amount)
    ylsn_output = save_reverse_output_amount("YLSN", ylsn_amount)

    return {
        "canvasName": "JZ",
        "equipment": "JZ",
        "assay": assay,
        "formula": "YTTG / JZ, then split by ratio(TXXHCC/YLSN)",
        "inputs": [
            {
                "outputName": "YTTG",
                "outputAmount": yttg_amount,
            }
        ],
        "totalInputAmount": round_output_amount(total_input_amount),
        "outputs": [
            {
                **txxhcc_output,
                "ratio": txxhcc_ratio,
            },
            {
                **ylsn_output,
                "ratio": ylsn_ratio,
            },
        ],
    }


def calculate_reverse_yx() -> dict:
    txxhcc_amount = require_reverse_output_amount("TXXHCC")
    assay = require_nonzero_assay("YX")

    cztg_amount = round_output_amount(txxhcc_amount / assay)
    output = save_reverse_output_amount("CZTG", cztg_amount)

    return {
        "canvasName": "YX",
        "equipment": "YX",
        "assay": assay,
        "formula": "TXXHCC / YX",
        "inputs": [
            {
                "outputName": "TXXHCC",
                "outputAmount": txxhcc_amount,
            }
        ],
        "output": output,
    }


def calculate_reverse_xh23d() -> dict:
    cztg_amount = require_reverse_output_amount("CZTG")
    x2_3d_assay = require_nonzero_assay("X2_3D")
    x2_2d_amount = round_output_amount(cztg_amount / x2_3d_assay)
    x2_2d_output = save_reverse_output_amount("X2_2D", x2_2d_amount)

    x2_2d_assay = require_nonzero_assay("X2_2D")
    ratios = require_reverse_ratios(("MXXFLC", "L/DX"))
    mxxflc_ratio = ratios["MXXFLC"]
    ldx_ratio = ratios["L/DX"]

    total_input_amount = x2_2d_amount / x2_2d_assay
    mxxflc_amount = round_output_amount(total_input_amount * mxxflc_ratio)
    ldx_amount = round_output_amount(total_input_amount * ldx_ratio)
    mxxflc_output = save_reverse_output_amount("MXXFLC", mxxflc_amount)
    ldx_output = save_reverse_output_amount("L/DX", ldx_amount)

    return {
        "canvasName": "XH23D",
        "steps": [
            {
                "equipment": "X2_3D",
                "assay": x2_3d_assay,
                "formula": "CZTG / X2_3D",
                "inputs": [
                    {
                        "outputName": "CZTG",
                        "outputAmount": cztg_amount,
                    }
                ],
                "output": x2_2d_output,
            },
            {
                "equipment": "X2_2D",
                "assay": x2_2d_assay,
                "formula": "X2_2D / assay, then split by ratio(MXXFLC/L/DX)",
                "inputs": [
                    x2_2d_output,
                ],
                "totalInputAmount": round_output_amount(total_input_amount),
                "outputs": [
                    {
                        **mxxflc_output,
                        "ratio": mxxflc_ratio,
                    },
                    {
                        **ldx_output,
                        "ratio": ldx_ratio,
                    },
                ],
            },
        ],
        "outputs": [
            x2_2d_output,
            mxxflc_output,
            ldx_output,
        ],
    }


def calculate_reverse_xh1d() -> dict:
    mxxflc_amount = require_reverse_output_amount("MXXFLC")
    assay = require_nonzero_assay("X1")
    ratios = require_reverse_ratios(("JB", "MXX"))
    jb_ratio = ratios["JB"]
    mxx_ratio = ratios["MXX"]

    total_input_amount = mxxflc_amount / assay
    jb_amount = round_output_amount(total_input_amount * jb_ratio)
    mxx_amount = round_output_amount(total_input_amount * mxx_ratio)
    jb_output = save_reverse_output_amount("JB", jb_amount)
    mxx_output = save_reverse_output_amount("MXX", mxx_amount)

    return {
        "canvasName": "XH1D",
        "equipment": "X1",
        "assay": assay,
        "formula": "MXXFLC / X1, then split by ratio(JB/MXX)",
        "inputs": [
            {
                "outputName": "MXXFLC",
                "outputAmount": mxxflc_amount,
            }
        ],
        "totalInputAmount": round_output_amount(total_input_amount),
        "outputs": [
            {
                **jb_output,
                "ratio": jb_ratio,
            },
            {
                **mxx_output,
                "ratio": mxx_ratio,
            },
        ],
    }


def calculate_output_to_input(route: str = "LDX") -> dict:
    keep_only_reverse_target("TG")
    tg_amount = require_reverse_target_amount("TG")
    optimization_result = run_output_to_input_model(tg_amount, xh2_route=route)

    saved_outputs = [
        save_reverse_output_amount(output_name, output_amount)
        for output_name, output_amount in optimization_result["outputs"].items()
    ]

    jb_amount = require_reverse_output_amount("JB")
    mxx_amount = require_reverse_output_amount("MXX")
    ldx_amount = require_reverse_output_amount("L/DX")
    ylsn_amount = require_reverse_output_amount("YLSN")

    return {
        "jb": jb_amount,
        "mxx": mxx_amount,
        "ldx": ldx_amount,
        "ylsn": ylsn_amount,
        "route": optimization_result["route"],
        "steps": [
            {
                "model": "tnt_continuous_reverse_model",
                "route": optimization_result["route"],
                "assays": optimization_result["assays"],
                "modelParameters": optimization_result["modelParameters"],
                "outputs": saved_outputs,
            }
        ],
        "outputs": [
            read_reverse_output_amount("YTTG"),
            read_reverse_output_amount("TXXHCC"),
            read_reverse_output_amount("CZTG"),
            read_reverse_output_amount("X2_2D"),
            read_reverse_output_amount("MXXFLC"),
            read_reverse_output_amount("YLSN"),
            read_reverse_output_amount("L/DX"),
            read_reverse_output_amount("JB"),
            read_reverse_output_amount("MXX"),
        ],
    }
