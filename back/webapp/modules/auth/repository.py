from webapp.common.database import get_connection, user_table_name


def find_user(user_id: str) -> dict | None:
    table_name = user_table_name()
    sql = f'SELECT "ID", "PASSWORD" FROM {table_name} WHERE "ID" = %s'

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, (user_id,))
        row = cursor.fetchone()

    if row is None:
        return None

    return {"id": row[0], "password": row[1]}


def create_user(user_id: str, password: str) -> None:
    table_name = user_table_name()
    sql = f'INSERT INTO {table_name} ("ID", "PASSWORD") VALUES (%s, %s)'

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, (user_id, password))
        conn.commit()
