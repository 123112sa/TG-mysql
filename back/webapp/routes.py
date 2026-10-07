from flask import Flask

from webapp.modules.auth.routes import auth_bp
from webapp.modules.calculation.routes import calculation_bp
from webapp.modules.event_custom.routes import event_custom_bp
from webapp.modules.factory_products.routes import factory_products_bp
from webapp.modules.health.routes import health_bp
from webapp.modules.material_calculation.routes import material_calculation_bp
from webapp.modules.projects.routes import projects_bp
from webapp.modules.reports.routes import reports_bp
from webapp.modules.schedule.routes import schedule_bp
from webapp.modules.solve.routes import solve_bp


ROUTE_REGISTRY = [
    {
        "name": "health",
        "blueprint": health_bp,
        "url_prefix": "/api",
        "description": "service health check",
    },
    {
        "name": "auth",
        "blueprint": auth_bp,
        "url_prefix": "/api/auth",
        "description": "login and register APIs",
    },
    {
        "name": "projects",
        "blueprint": projects_bp,
        "url_prefix": "/api/projects",
        "description": "project file APIs backed by graph directory",
    },
    {
        "name": "calculation",
        "blueprint": calculation_bp,
        "url_prefix": "/api/calculation",
        "description": "feed input and calculation APIs",
    },
    {
        "name": "event_custom",
        "blueprint": event_custom_bp,
        "url_prefix": "/api/event-custom",
        "description": "event custom input APIs",
    },
    {
        "name": "material_calculation",
        "blueprint": material_calculation_bp,
        "url_prefix": "/api/material-calculation",
        "description": "material calculation parameters and templates",
    },
    {
        "name": "solve",
        "blueprint": solve_bp,
        "url_prefix": "/api/solve",
        "description": "calculation solve APIs",
    },
    {
        "name": "schedule",
        "blueprint": schedule_bp,
        "url_prefix": "/api/schedule",
        "description": "daily schedule optimization APIs",
    },
    {
        "name": "reports",
        "blueprint": reports_bp,
        "url_prefix": "/api/reports",
        "description": "schedule report download APIs",
    },
    {
        "name": "factory_products",
        "blueprint": factory_products_bp,
        "url_prefix": "/api/factory-products",
        "description": "factory product output APIs",
    },
]


def register_routes(app: Flask) -> None:
    for route in ROUTE_REGISTRY:
        app.register_blueprint(route["blueprint"], url_prefix=route["url_prefix"])
