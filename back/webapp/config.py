import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file(env_path: Path | None = None) -> None:
    path = env_path or BASE_DIR / ".env"
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip('"').strip("'"))


def resolve_graph_dir(value: str | None) -> Path:
    if not value:
        return (BASE_DIR.parent / "graph").resolve()

    path = Path(value)
    if not path.is_absolute():
        path = BASE_DIR / path

    return path.resolve()


@dataclass(frozen=True)
class Settings:
    mysql_host: str
    mysql_port: int
    mysql_user: str
    mysql_password: str
    mysql_database: str
    mysql_user_table: str
    flask_secret_key: str
    cors_origin: str
    graph_dir: Path

    @classmethod
    def load(cls) -> "Settings":
        load_env_file()
        return cls(
            mysql_host=os.getenv("MYSQL_HOST", "127.0.0.1"),
            mysql_port=int(os.getenv("MYSQL_PORT", "3306")),
            mysql_user=os.getenv("MYSQL_USER", "tg"),
            mysql_password=os.getenv("MYSQL_PASSWORD", ""),
            mysql_database=os.getenv("MYSQL_DATABASE", "tg"),
            mysql_user_table=os.getenv("MYSQL_USER_TABLE", "users"),
            flask_secret_key=os.getenv("FLASK_SECRET_KEY", "change-me-in-production"),
            cors_origin=os.getenv("CORS_ORIGIN", "http://127.0.0.1:5173"),
            graph_dir=resolve_graph_dir(os.getenv("GRAPH_DIR")),
        )
