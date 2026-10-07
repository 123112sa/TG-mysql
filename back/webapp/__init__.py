from flask import Flask

from webapp.common.cors import install_cors
from webapp.config import Settings
from webapp.routes import register_routes


def create_app() -> Flask:
    settings = Settings.load()
    app = Flask(__name__)
    app.json.sort_keys = False
    app.config["SETTINGS"] = settings
    app.secret_key = settings.flask_secret_key

    install_cors(app, settings)
    register_routes(app)

    return app
