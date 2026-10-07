from webapp.common.database import get_connection, schema_table_name


INPUT_REVERSE_TABLE = "input_reverse"


def save_reverse_target_amount(input_name: str, input_amount: float) -> dict[str, float | str]:
    table_name = schema_table_name(INPUT_REVERSE_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'INSERT INTO {table_name} ("input_name", "input_amount", "type") '
            'VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE '
            '"input_amount" = VALUES("input_amount"), "type" = VALUES("type")',
            (input_name, input_amount, "V"),
        )

        conn.commit()

    return {
        "inputName": input_name,
        "inputAmount": input_amount,
    }


def keep_only_reverse_target(input_name: str = "TG") -> None:
    table_name = schema_table_name(INPUT_REVERSE_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'DELETE FROM {table_name} WHERE "input_name" <> %s',
            (input_name,),
        )
        conn.commit()


def read_reverse_target_amount(input_name: str = "TG") -> dict[str, float | str] | None:
    table_name = schema_table_name(INPUT_REVERSE_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "input_name", "input_amount" FROM {table_name} WHERE "input_name" = %s',
            (input_name,),
        )
        row = cursor.fetchone()

    if row is None:
        return None

    return {
        "inputName": row[0],
        "inputAmount": row[1],
    }
