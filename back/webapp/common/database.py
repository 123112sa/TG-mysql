from contextlib import contextmanager
import re

import mysql.connector
from flask import current_app

from webapp.config import Settings


IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def quoted_identifier(name: str) -> str:
    if not IDENTIFIER_RE.fullmatch(name):
        raise ValueError(f"非法数据库标识符：{name}")
    return f"`{name}`"


def user_table_name(settings: Settings | None = None) -> str:
    cfg = settings or current_app.config["SETTINGS"]
    return f"{quoted_identifier(cfg.mysql_database)}.{quoted_identifier(cfg.mysql_user_table)}"


def schema_table_name(table_name: str, settings: Settings | None = None) -> str:
    cfg = settings or current_app.config["SETTINGS"]
    return f"{quoted_identifier(cfg.mysql_database)}.{quoted_identifier(table_name)}"


@contextmanager
def get_connection(settings: Settings | None = None):
    cfg = settings or current_app.config["SETTINGS"]

    try:
        conn = mysql.connector.connect(
            host=cfg.mysql_host,
            port=cfg.mysql_port,
            user=cfg.mysql_user,
            password=cfg.mysql_password,
            database=cfg.mysql_database,
            charset="utf8mb4",
            use_unicode=True,
            autocommit=False,
        )
        cursor = conn.cursor()
        cursor.execute(
            "SET SESSION sql_mode = IF(FIND_IN_SET('ANSI_QUOTES', @@SESSION.sql_mode), "
            "@@SESSION.sql_mode, CONCAT_WS(',', NULLIF(@@SESSION.sql_mode, ''), 'ANSI_QUOTES'))"
        )
        cursor.close()
    except mysql.connector.Error as exc:
        if "conn" in locals() and conn.is_connected():
            conn.close()
        raise RuntimeError(f"数据库连接失败：{exc}") from exc

    try:
        yield conn
    finally:
        conn.close()
