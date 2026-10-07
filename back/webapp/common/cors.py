from flask import Flask

from webapp.config import Settings


def install_cors(app: Flask, settings: Settings) -> None:
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = settings.cors_origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response
