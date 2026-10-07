from webapp.common.database import get_connection, schema_table_name


OUTPUT_REVERSE_TABLE = "output_reverse"


def save_reverse_output_amount(output_name: str, output_amount: float) -> dict[str, float | str]:
    table_name = schema_table_name(OUTPUT_REVERSE_TABLE)

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


def read_reverse_output_amount(output_name: str) -> dict[str, float | str] | None:
    table_name = schema_table_name(OUTPUT_REVERSE_TABLE)

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
        "outputAmount": row[1],
    }
