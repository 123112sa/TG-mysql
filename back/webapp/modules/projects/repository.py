import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import current_app


PROJECT_EXTENSION = ".npimsproj"
SAFE_NAME_RE = re.compile(r"^[^<>:\"/\\|?*\x00-\x1f]+$")


def get_graph_dir() -> Path:
    settings = current_app.config["SETTINGS"]
    graph_dir = settings.graph_dir
    graph_dir.mkdir(parents=True, exist_ok=True)
    return graph_dir


def normalize_project_file_name(project_name: str) -> str:
    name = str(project_name or "").strip()
    if not name:
        raise ValueError("工程文件名不能为空")

    if name.lower().endswith(PROJECT_EXTENSION):
        name = name[: -len(PROJECT_EXTENSION)]

    if not name or not SAFE_NAME_RE.match(name) or name in {".", ".."}:
        raise ValueError("工程文件名包含非法字符")

    return f"{name}{PROJECT_EXTENSION}"


def project_path(project_name: str) -> Path:
    graph_dir = get_graph_dir()
    file_name = normalize_project_file_name(project_name)
    path = (graph_dir / file_name).resolve()

    if graph_dir not in path.parents:
        raise ValueError("工程文件路径非法")

    return path


def iso_from_timestamp(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def list_projects() -> list[dict[str, Any]]:
    files = []

    for path in sorted(get_graph_dir().glob(f"*{PROJECT_EXTENSION}"), key=lambda item: item.name.lower()):
        if not path.is_file():
            continue

        stat = path.stat()
        project_name = path.stem
        embedded_project_name = None
        saved_at = None

        try:
            project = json.loads(path.read_text(encoding="utf-8"))
            embedded_project_name = project.get("projectName")
            saved_at = project.get("savedAt")
        except (OSError, json.JSONDecodeError):
            pass

        files.append(
            {
                "projectName": project_name,
                "embeddedProjectName": embedded_project_name,
                "fileName": path.name,
                "savedAt": saved_at,
                "updatedAt": iso_from_timestamp(stat.st_mtime),
                "size": stat.st_size,
            }
        )

    return files


def read_project(project_name: str) -> dict[str, Any]:
    path = project_path(project_name)
    if not path.exists():
        raise FileNotFoundError("工程文件不存在")

    project = json.loads(path.read_text(encoding="utf-8"))
    return normalize_project_load_order(project)


def write_project(project: dict[str, Any]) -> dict[str, Any]:
    validate_project(project)

    project_name = str(project.get("projectName") or "project").strip()
    file_path = project_path(project_name)
    project["projectName"] = file_path.stem
    project["savedAt"] = datetime.now(timezone.utc).isoformat()

    file_path.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")

    stat = file_path.stat()
    return {
        "projectName": project["projectName"],
        "fileName": file_path.name,
        "savedAt": project["savedAt"],
        "updatedAt": iso_from_timestamp(stat.st_mtime),
        "size": stat.st_size,
    }


def delete_project(project_name: str) -> None:
    path = project_path(project_name)
    if not path.exists():
        raise FileNotFoundError("工程文件不存在")

    path.unlink()


def validate_project(project: dict[str, Any]) -> None:
    if not isinstance(project, dict):
        raise ValueError("工程数据格式错误")

    if project.get("format") != "npimsproj":
        raise ValueError("工程文件 format 必须为 npimsproj")

    graph = project.get("graph")
    if not isinstance(graph, dict) or not graph.get("info") or not graph.get("content"):
        raise ValueError("工程文件缺少 graph.info 或 graph.content")


def normalize_project_load_order(project: dict[str, Any]) -> dict[str, Any]:
    graph = project.get("graph")
    if not isinstance(graph, dict):
        return project

    content = graph.get("content")
    if not isinstance(content, dict):
        return project

    ordered_content = {}
    visited = set()

    def visit(canvas_name: str) -> None:
        if canvas_name in visited or canvas_name not in content:
            return

        visited.add(canvas_name)
        canvas = content[canvas_name]
        ordered_content[canvas_name] = canvas

        for sub_model in canvas.get("sub", []) if isinstance(canvas, dict) else []:
            child_name = sub_model.get("name") or sub_model.get("sub")
            if isinstance(child_name, str):
                visit(child_name)

    visit("main")

    entrance = graph.get("info", {}).get("entrance")
    if isinstance(entrance, str):
        visit(entrance)

    for canvas_name in content:
        visit(canvas_name)

    graph["content"] = ordered_content
    return project
