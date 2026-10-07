from webapp.common.database import get_connection, schema_table_name


INPUT_TABLE = "input"
ASSAY_TABLE = "assay"
OUTPUT_TABLE = "output"
RATIO_TABLE = "ratio"
SUPPORTED_INPUT_NAMES = {"JB", "MXX", "YLSN", "L/DX"}
SYSTEM_OUTPUT_NAMES = ("MXXFLC", "X2_2D", "CZTG", "TXXHCC", "YTTG", "TG")


def save_feed_inputs(feed_inputs: dict[str, float]) -> list[dict[str, float | str]]:
    rows = []
    table_name = schema_table_name(INPUT_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()

        for input_name, input_amount in feed_inputs.items():
            cursor.execute(
                f'INSERT INTO {table_name} ("input_name", "input_amount", "type") '
                'VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE '
                '"input_amount" = VALUES("input_amount"), "type" = VALUES("type")',
                (input_name, input_amount, "V"),
            )

            rows.append(
                {
                    "inputName": input_name,
                    "inputAmount": input_amount,
                }
            )

        conn.commit()

    return rows


def read_feed_inputs(input_names: set[str] | None = None) -> list[dict[str, float | str]]:
    table_name = schema_table_name(INPUT_TABLE)
    names = sorted(input_names or SUPPORTED_INPUT_NAMES)
    placeholders = ", ".join(["%s"] * len(names))

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "input_name", "input_amount" FROM {table_name} WHERE "input_name" IN ({placeholders})',
            tuple(names),
        )
        rows = cursor.fetchall()

    return [
        {
            "inputName": row[0],
            "inputAmount": float(row[1]),
        }
        for row in rows
    ]


def read_input_amounts(input_names: set[str]) -> dict[str, float]:
    rows = read_feed_inputs(input_names)
    return {str(row["inputName"]): float(row["inputAmount"]) for row in rows}


def read_assay(equipment: str) -> float:
    table_name = schema_table_name(ASSAY_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "assay" FROM {table_name} WHERE "equipment" = %s',
            (equipment,),
        )
        row = cursor.fetchone()

    if row is None:
        raise ValueError(f"未找到设备{equipment}的收率")

    return float(row[0])


def read_ratios(input_names: set[str]) -> dict[str, float]:
    table_name = schema_table_name(RATIO_TABLE)
    names = sorted(input_names)
    placeholders = ", ".join(["%s"] * len(names))

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "input_name", "ratio" FROM {table_name} WHERE "input_name" IN ({placeholders})',
            tuple(names),
        )
        rows = cursor.fetchall()

    return {str(row[0]): float(row[1]) for row in rows}


def save_output_amount(output_name: str, output_amount: float) -> dict[str, float | str]:
    table_name = schema_table_name(OUTPUT_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'INSERT INTO {table_name} ("output_name", "output_amount", "type") '
            'VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE '
            '"output_amount" = VALUES("output_amount"), "type" = VALUES("type")',
            (output_name, output_amount, "V"),
        )

        conn.commit()

    return {
        "outputName": output_name,
        "outputAmount": output_amount,
    }


def read_output_amount(output_name: str) -> dict[str, float | str] | None:
    table_name = schema_table_name(OUTPUT_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "output_name", "output_amount" FROM {table_name} WHERE "output_name" = %s',
            (output_name,),
        )
        row = cursor.fetchone()

    if row is None:
        return None

    return {
        "outputName": row[0],
        "outputAmount": float(row[1]),
    }


def read_output_amounts(output_names: tuple[str, ...] = SYSTEM_OUTPUT_NAMES) -> list[dict[str, float | str]]:
    rows = []
    for output_name in output_names:
        output = read_output_amount(output_name)
        if output is not None:
            rows.append(output)

    return rows


def require_output_amount(output_name: str) -> float:
    output = read_output_amount(output_name)
    if output is None:
        raise ValueError(f"缺少输出量：{output_name}")

    return float(output["outputAmount"])
