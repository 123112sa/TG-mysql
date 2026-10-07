from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from flask import current_app

from webapp.common.database import get_connection, schema_table_name


SCHEDULE_PLAN_TABLE = "schedule_plan"
SCHEDULE_RESULT_TABLE = "schedule_result"


def _list_columns(cursor, table_name: str) -> set[str]:
    cursor.execute(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
        (current_app.config["SETTINGS"].mysql_database, table_name),
    )
    return {row[0] for row in cursor.fetchall()}


def _ensure_schedule_tables(cursor) -> None:
    plan_table = schema_table_name(SCHEDULE_PLAN_TABLE)
    result_table = schema_table_name(SCHEDULE_RESULT_TABLE)
    plan_columns = _list_columns(cursor, SCHEDULE_PLAN_TABLE)

    if "plan_name" not in plan_columns:
        cursor.execute(f'ALTER TABLE {plan_table} ADD "plan_name" VARCHAR(128)')

    if "end_date" not in plan_columns:
        cursor.execute(f'ALTER TABLE {plan_table} ADD "end_date" DATE')

    result_columns = _list_columns(cursor, SCHEDULE_RESULT_TABLE)
    if result_columns:
        if "x2_2d_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "x2_2d_amount" DECIMAL(18, 6) DEFAULT 0')
        if "cztg_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "cztg_amount" DECIMAL(18, 6) DEFAULT 0')
        if "txxhcc_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "txxhcc_amount" DECIMAL(18, 6) DEFAULT 0')
        if "yttg_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "yttg_amount" DECIMAL(18, 6) DEFAULT 0')
        if "dnx_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "dnx_amount" DECIMAL(18, 6) DEFAULT 0')
        if "sa_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "sa_amount" DECIMAL(18, 6) DEFAULT 0')
        if "fsa_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "fsa_amount" DECIMAL(18, 6) DEFAULT 0')
        if "nx_amount" not in result_columns:
            cursor.execute(f'ALTER TABLE {result_table} ADD "nx_amount" DECIMAL(18, 6) DEFAULT 0')
        return

    cursor.execute(
        f'''
        CREATE TABLE {result_table} (
            "id" BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            "plan_id" BIGINT NOT NULL,
            "schedule_date" DATE NOT NULL,
            "day_index" INT NOT NULL,
            "jb_amount" DECIMAL(18, 6) DEFAULT 0,
            "mxx_amount" DECIMAL(18, 6) DEFAULT 0,
            "ldx_amount" DECIMAL(18, 6) DEFAULT 0,
            "dnx_amount" DECIMAL(18, 6) DEFAULT 0,
            "sa_amount" DECIMAL(18, 6) DEFAULT 0,
            "fsa_amount" DECIMAL(18, 6) DEFAULT 0,
            "ylsn_amount" DECIMAL(18, 6) DEFAULT 0,
            "nx_amount" DECIMAL(18, 6) DEFAULT 0,
            "product_amount" DECIMAL(18, 6) DEFAULT 0,
            "mxxflc_amount" DECIMAL(18, 6) DEFAULT 0,
            "x2_2d_amount" DECIMAL(18, 6) DEFAULT 0,
            "cztg_amount" DECIMAL(18, 6) DEFAULT 0,
            "txxhcc_amount" DECIMAL(18, 6) DEFAULT 0,
            "yttg_amount" DECIMAL(18, 6) DEFAULT 0,
            "tg_amount" DECIMAL(18, 6) DEFAULT 0
        )
        '''
    )


def _format_date(value) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    return str(value)[:10]


def _format_datetime(value) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return "" if value is None else str(value)


def _to_number(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _to_int(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return int(value)
    return int(value)


def _plan_row_to_dict(row) -> dict:
    return {
        "id": _to_int(row[0]),
        "planName": row[1],
        "startDate": _format_date(row[2]),
        "endDate": _format_date(row[3]) if row[3] is not None else "",
        "planningDays": int(row[4] or 0),
        "targetAmount": _to_number(row[5]),
        "route": row[6] or "MXX",
        "status": row[7] or "",
        "remark": row[8] or "",
        "createdAt": _format_datetime(row[9]),
    }


def schedule_plan_name_exists(plan_name: str) -> bool:
    plan_table = schema_table_name(SCHEDULE_PLAN_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        _ensure_schedule_tables(cursor)
        cursor.execute(
            f'SELECT COUNT(1) FROM {plan_table} WHERE "plan_name" = %s',
            (plan_name,),
        )
        row = cursor.fetchone()
        return bool(row and int(row[0] or 0) > 0)


def save_schedule_result(schedule: dict) -> dict:
    plan = schedule["plan"]
    daily_results = schedule["dailyResults"]
    plan_table = schema_table_name(SCHEDULE_PLAN_TABLE)
    result_table = schema_table_name(SCHEDULE_RESULT_TABLE)
    plan_name = str(plan.get("planName") or "").strip() or f"{plan['startDate']}_{plan['planningDays']}d_{plan['route']}"

    with get_connection() as conn:
        cursor = conn.cursor()
        _ensure_schedule_tables(cursor)

        cursor.execute(
            f'SELECT COUNT(1) FROM {plan_table} WHERE "plan_name" = %s',
            (plan_name,),
        )
        row = cursor.fetchone()
        if row and int(row[0] or 0) > 0:
            raise ValueError("方案名称已存在，请重新命名")

        cursor.execute(
            f'''
            INSERT INTO {plan_table}
            ("plan_name", "start_date", "end_date", "planning_days", "target_amount", "route", "status", "created_at")
            VALUES (%s, %s, %s, %s, %s, %s, 'SUCCESS', CURRENT_TIMESTAMP)
            ''',
            (
                plan_name,
                plan["startDate"],
                plan["endDate"],
                plan["planningDays"],
                plan["targetAmount"],
                plan["route"],
            ),
        )

        plan_id = _to_int(cursor.lastrowid)

        if plan_id is None:
            raise RuntimeError("未能获取多负荷优化记录ID")

        for item in daily_results:
            cursor.execute(
                f'''
                INSERT INTO {result_table}
                ("plan_id", "schedule_date", "day_index", "jb_amount", "mxx_amount", "ldx_amount",
                 "dnx_amount", "sa_amount", "fsa_amount", "ylsn_amount", "nx_amount", "product_amount",
                 "mxxflc_amount", "x2_2d_amount", "cztg_amount", "txxhcc_amount", "yttg_amount", "tg_amount")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''',
                (
                    plan_id,
                    item["date"],
                    item["dayIndex"],
                    item["jb"],
                    item["mxx"],
                    item["ldx"],
                    item.get("dnx", 0),
                    item.get("sa", 0),
                    item.get("fsa", 0),
                    item["ylsn"],
                    item.get("nx", 0),
                    item["product"],
                    item["mxxflc"],
                    item["x2_2d"],
                    item["cztg"],
                    item["txxhcc"],
                    item["yttg"],
                    item["tg"],
                ),
            )

        conn.commit()

    return {"id": plan_id, "planName": plan_name}


def list_schedule_plans() -> list[dict]:
    plan_table = schema_table_name(SCHEDULE_PLAN_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        _ensure_schedule_tables(cursor)
        cursor.execute(
            f'''
            SELECT "id", "plan_name", "start_date", "end_date", "planning_days", "target_amount",
                   "route", "status", "remark", "created_at"
            FROM {plan_table}
            ORDER BY "created_at" DESC, "id" DESC
            '''
        )
        return [_plan_row_to_dict(row) for row in cursor.fetchall()]


def get_schedule_plan(plan_id: int) -> dict | None:
    plan_table = schema_table_name(SCHEDULE_PLAN_TABLE)
    result_table = schema_table_name(SCHEDULE_RESULT_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        _ensure_schedule_tables(cursor)
        cursor.execute(
            f'''
            SELECT "id", "plan_name", "start_date", "end_date", "planning_days", "target_amount",
                   "route", "status", "remark", "created_at"
            FROM {plan_table}
            WHERE "id" = %s
            ''',
            (plan_id,),
        )
        plan_row = cursor.fetchone()
        if not plan_row:
            return None

        cursor.execute(
            f'''
            SELECT "schedule_date", "day_index", "jb_amount", "mxx_amount", "ldx_amount",
                   "dnx_amount", "sa_amount", "fsa_amount", "ylsn_amount", "nx_amount",
                   "product_amount", "mxxflc_amount", "x2_2d_amount", "cztg_amount",
                   "txxhcc_amount", "yttg_amount", "tg_amount"
            FROM {result_table}
            WHERE "plan_id" = %s
            ORDER BY "day_index" ASC, "schedule_date" ASC
            ''',
            (plan_id,),
        )

        daily_results = []
        day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        for row in cursor.fetchall():
            schedule_date = row[0]
            daily_results.append(
                {
                    "date": _format_date(schedule_date),
                    "dayIndex": int(row[1] or 0),
                    "dayName": day_names[schedule_date.weekday()] if hasattr(schedule_date, "weekday") else "",
                    "jb": _to_number(row[2]),
                    "mxx": _to_number(row[3]),
                    "ldx": _to_number(row[4]),
                    "dnx": _to_number(row[5]),
                    "sa": _to_number(row[6]),
                    "fsa": _to_number(row[7]),
                    "ylsn": _to_number(row[8]),
                    "nx": _to_number(row[9]),
                    "product": _to_number(row[10]),
                    "mxxflc": _to_number(row[11]),
                    "x2_2d": _to_number(row[12]),
                    "cztg": _to_number(row[13]),
                    "txxhcc": _to_number(row[14]),
                    "yttg": _to_number(row[15]),
                    "tg": _to_number(row[16]),
                }
            )

    return {"plan": _plan_row_to_dict(plan_row), "dailyResults": daily_results}


def delete_schedule_plan(plan_id: int) -> bool:
    plan_table = schema_table_name(SCHEDULE_PLAN_TABLE)
    result_table = schema_table_name(SCHEDULE_RESULT_TABLE)

    with get_connection() as conn:
        cursor = conn.cursor()
        _ensure_schedule_tables(cursor)

        cursor.execute(
            f'SELECT COUNT(1) FROM {plan_table} WHERE "id" = %s',
            (plan_id,),
        )
        row = cursor.fetchone()
        if not row or int(row[0] or 0) <= 0:
            return False

        cursor.execute(
            f'DELETE FROM {result_table} WHERE "plan_id" = %s',
            (plan_id,),
        )
        cursor.execute(
            f'DELETE FROM {plan_table} WHERE "id" = %s',
            (plan_id,),
        )
        conn.commit()

    return True
