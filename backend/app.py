from flask import Flask
from flask_cors import CORS

from database import init_db
from routes.task_routes import task_bp
from routes.category_routes import category_bp
from routes.ai_routes import ai_bp
from utils.response import json_response

app = Flask(__name__)
CORS(app)

init_db()

app.register_blueprint(task_bp)
app.register_blueprint(category_bp)
app.register_blueprint(ai_bp)

@app.route("/api/health", methods=["GET"])
def health_check():
    return json_response({
        "status": "success",
        "message": "AI Task Productivity Backend is running"
    })


if __name__ == "__main__":
    app.run(debug=True)