from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from webapp.common.database import get_connection, schema_table_name


CONTEXT_TABLE = "material_calculation_context"
TEMPLATE_TABLE = "material_parameter_template"
TEMPLATE_ITEM_TABLE = "material_parameter_template_item"
INPUT_TABLE = "input"
INPUT_REVERSE_TABLE = "input_reverse"
MATERIAL_CODES = ("JB", "MXX", "L/DX", "YLSN")


def _number(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _datetime(value) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return "" if value is None else str(value)


def get_current_context(mode: str) -> dict | None:
    table_name = schema_table_name(CONTEXT_TABLE)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "solve_mode", "route", "version", "updated_at" '
            f'FROM {table_name} WHERE "solve_mode" = %s',
            (mode,),
        )
        row = cursor.fetchone()
    if row is None:
        return None
    return {
        "mode": row[0], "route": row[1], "version": int(row[2] or 1),
        "updatedAt": _datetime(row[3]),
    }


def get_current_inputs() -> dict[str, float]:
    table_name = schema_table_name(INPUT_TABLE)
    placeholders = ", ".join(["%s"] * len(MATERIAL_CODES))
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "input_name", "input_amount" FROM {table_name} '
            f'WHERE "input_name" IN ({placeholders})',
            MATERIAL_CODES,
        )
        rows = cursor.fetchall()
    return {str(row[0]): _number(row[1]) for row in rows}


def get_current_target() -> dict | None:
    table_name = schema_table_name(INPUT_REVERSE_TABLE)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f'SELECT "input_name", "input_amount" FROM {table_name} WHERE "input_name" = %s',
            ("TG",),
        )
        row = cursor.fetchone()
    if row is None:
        return None
    return {"productCode": str(row[0]), "amount": _number(row[1])}


def save_current_configuration(configuration: dict) -> dict:
    context_table = schema_table_name(CONTEXT_TABLE)
    input_table = schema_table_name(INPUT_TABLE)
    reverse_table = schema_table_name(INPUT_REVERSE_TABLE)
    mode = configuration["mode"]
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f'SELECT "version" FROM {context_table} WHERE "solve_mode" = %s', (mode,))
        current = cursor.fetchone()
        next_version = int(current[0] or 0) + 1 if current else 1
        if current:
            cursor.execute(
                f'UPDATE {context_table} SET "route" = %s, "version" = %s, '
                '"updated_at" = CURRENT_TIMESTAMP WHERE "solve_mode" = %s',
                (configuration["route"], next_version, mode),
            )
        else:
            cursor.execute(
                f'INSERT INTO {context_table} ("solve_mode", "route", "version", "updated_at") '
                'VALUES (%s, %s, %s, CURRENT_TIMESTAMP)',
                (mode, configuration["route"], next_version),
            )

        if mode == "input-to-output":
            for material_code, amount in configuration["inputs"].items():
                cursor.execute(
                    f'INSERT INTO {input_table} ("input_name", "input_amount", "type") '
                    'VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE '
                    '"input_amount" = VALUES("input_amount"), "type" = VALUES("type")',
                    (material_code, amount, "V"),
                )
        else:
            target = configuration["target"]
            cursor.execute(
                f'INSERT INTO {reverse_table} ("input_name", "input_amount", "type") '
                'VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE '
                '"input_amount" = VALUES("input_amount"), "type" = VALUES("type")',
                (target["productCode"], target["amount"], "V"),
            )
            cursor.execute(
                f'DELETE FROM {reverse_table} WHERE "input_name" <> %s',
                (target["productCode"],),
            )
        conn.commit()
    return {**configuration, "version": next_version, "updatedAt": ""}


def template_name_exists(name: str, exclude_id: int | None = None) -> bool:
    table_name = schema_table_name(TEMPLATE_TABLE)
    sql = f'SELECT COUNT(1) FROM {table_name} WHERE "template_name" = %s'
    params: tuple = (name,)
    if exclude_id is not None:
        sql += ' AND "id" <> %s'
        params = (name, exclude_id)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        row = cursor.fetchone()
    return bool(row and int(row[0] or 0) > 0)


def _template_row(row) -> dict:
    return {
        "id": int(row[0]), "name": row[1], "description": row[2] or "",
        "mode": row[3], "route": row[4],
        "target": ({"productCode": row[5] or "TG", "amount": _number(row[6])}
                   if row[3] == "output-to-input" else None),
        "version": int(row[7] or 1), "createdAt": _datetime(row[8]),
        "updatedAt": _datetime(row[9]),
    }


def _select_template(cursor, template_id: int) -> dict | None:
    template_table = schema_table_name(TEMPLATE_TABLE)
    item_table = schema_table_name(TEMPLATE_ITEM_TABLE)
    cursor.execute(
        f'SELECT "id", "template_name", "description", "solve_mode", "route", '
        '"target_product_code", "target_amount", "version", "created_at", "updated_at" '
        f'FROM {template_table} WHERE "id" = %s',
        (template_id,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    result = _template_row(row)
    cursor.execute(
        f'SELECT "material_code", "input_amount" FROM {item_table} '
        'WHERE "template_id" = %s ORDER BY "sort_order", "id"',
        (template_id,),
    )
    result["inputs"] = {str(item[0]): _number(item[1]) for item in cursor.fetchall()}
    return result


def list_templates() -> list[dict]:
    table_name = schema_table_name(TEMPLATE_TABLE)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f'SELECT "id" FROM {table_name} ORDER BY "updated_at" DESC, "id" DESC')
        ids = [int(row[0]) for row in cursor.fetchall()]
        return [item for template_id in ids if (item := _select_template(cursor, template_id))]


def get_template(template_id: int) -> dict | None:
    with get_connection() as conn:
        return _select_template(conn.cursor(), template_id)


def _insert_items(cursor, template_id: int, inputs: dict[str, float]) -> None:
    table_name = schema_table_name(TEMPLATE_ITEM_TABLE)
    for index, material_code in enumerate(MATERIAL_CODES):
        if material_code in inputs:
            cursor.execute(
                f'INSERT INTO {table_name} '
                '("template_id", "material_code", "input_amount", "sort_order") VALUES (%s, %s, %s, %s)',
                (template_id, material_code, inputs[material_code], index),
            )


def create_template(template: dict) -> dict:
    table_name = schema_table_name(TEMPLATE_TABLE)
    with get_connection() as conn:
        cursor = conn.cursor()
        target = template.get("target") or {}
        cursor.execute(
            f'INSERT INTO {table_name} '
            '("template_name", "description", "solve_mode", "route", '
            '"target_product_code", "target_amount", "version", "created_at", "updated_at") '
            'VALUES (%s, %s, %s, %s, %s, %s, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            (template["name"], template["description"], template["mode"], template["route"],
             target.get("productCode"), target.get("amount")),
        )
        template_id = int(cursor.lastrowid)
        _insert_items(cursor, template_id, template.get("inputs") or {})
        conn.commit()
        return _select_template(cursor, template_id)


def update_template(template_id: int, template: dict, expected_version: int) -> dict | None:
    template_table = schema_table_name(TEMPLATE_TABLE)
    item_table = schema_table_name(TEMPLATE_ITEM_TABLE)
    with get_connection() as conn:
        cursor = conn.cursor()
        target = template.get("target") or {}
        cursor.execute(
            f'UPDATE {template_table} SET "template_name" = %s, "description" = %s, '
            '"solve_mode" = %s, "route" = %s, "target_product_code" = %s, "target_amount" = %s, '
            '"version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP '
            'WHERE "id" = %s AND "version" = %s',
            (template["name"], template["description"], template["mode"], template["route"],
             target.get("productCode"), target.get("amount"), template_id, expected_version),
        )
        if cursor.rowcount == 0:
            return None
        cursor.execute(f'DELETE FROM {item_table} WHERE "template_id" = %s', (template_id,))
        _insert_items(cursor, template_id, template.get("inputs") or {})
        conn.commit()
        return _select_template(cursor, template_id)


def delete_template(template_id: int) -> bool:
    template_table = schema_table_name(TEMPLATE_TABLE)
    item_table = schema_table_name(TEMPLATE_ITEM_TABLE)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f'DELETE FROM {item_table} WHERE "template_id" = %s', (template_id,))
        cursor.execute(f'DELETE FROM {template_table} WHERE "id" = %s', (template_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
    return deleted

