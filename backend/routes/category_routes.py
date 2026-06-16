from flask import Blueprint, request
from database import get_db_connection
from utils.response import json_response

category_bp = Blueprint("category_bp", __name__)


@category_bp.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    categories = conn.execute("""
        SELECT *
        FROM categories
        ORDER BY id ASC
    """).fetchall()
    conn.close()

    return json_response({
        "status": "success",
        "data": [dict(category) for category in categories]
    })


@category_bp.route("/api/categories", methods=["POST"])
def create_category():
    data = request.get_json()
    name = data.get("name", "").strip()

    if not name:
        return json_response({
            "status": "error",
            "message": "Category name is required"
        }, 400)

    conn = get_db_connection()

    try:
        cursor = conn.execute("""
            INSERT INTO categories (name)
            VALUES (?)
        """, (name,))

        conn.commit()
        category_id = cursor.lastrowid

    except Exception:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Category already exists"
        }, 400)

    conn.close()

    return json_response({
        "status": "success",
        "message": "Category created successfully",
        "data": {
            "id": category_id,
            "name": name
        }
    }, 201)


@category_bp.route("/api/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    data = request.get_json()
    name = data.get("name", "").strip()

    if not name:
        return json_response({
            "status": "error",
            "message": "Category name is required"
        }, 400)

    conn = get_db_connection()

    existing_category = conn.execute("""
        SELECT *
        FROM categories
        WHERE id = ?
    """, (category_id,)).fetchone()

    if existing_category is None:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Category not found"
        }, 404)

    old_name = existing_category["name"]

    conn.execute("""
        UPDATE categories
        SET name = ?
        WHERE id = ?
    """, (name, category_id))

    conn.execute("""
        UPDATE tasks
        SET category = ?
        WHERE category = ?
    """, (name, old_name))

    conn.commit()
    conn.close()

    return json_response({
        "status": "success",
        "message": "Category updated successfully"
    })


@category_bp.route("/api/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    conn = get_db_connection()

    existing_category = conn.execute("""
        SELECT *
        FROM categories
        WHERE id = ?
    """, (category_id,)).fetchone()

    if existing_category is None:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Category not found"
        }, 404)

    category_name = existing_category["name"]

    conn.execute("""
        DELETE FROM categories
        WHERE id = ?
    """, (category_id,))

    conn.execute("""
        UPDATE tasks
        SET category = '未分類'
        WHERE category = ?
    """, (category_name,))

    conn.execute("""
        INSERT OR IGNORE INTO categories (name)
        VALUES ('未分類')
    """)

    conn.commit()
    conn.close()

    return json_response({
        "status": "success",
        "message": "Category deleted successfully"
    })