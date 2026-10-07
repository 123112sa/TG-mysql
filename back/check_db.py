import mysql.connector

from webapp.config import Settings


def main() -> None:
    settings = Settings.load()

    print(f"MYSQL_HOST={settings.mysql_host}")
    print(f"MYSQL_PORT={settings.mysql_port}")
    print(f"MYSQL_USER={settings.mysql_user}")
    print(f"MYSQL_DATABASE={settings.mysql_database}")
    print(f"MYSQL_USER_TABLE={settings.mysql_user_table}")

    try:
        conn = mysql.connector.connect(
            host=settings.mysql_host,
            port=settings.mysql_port,
            user=settings.mysql_user,
            password=settings.mysql_password,
            database=settings.mysql_database,
            charset="utf8mb4",
            use_unicode=True,
        )
    except Exception as exc:
        raise SystemExit(f"数据库连接失败：{exc}") from exc

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        print("MySQL数据库连接成功")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
