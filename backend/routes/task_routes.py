from flask import Blueprint, request
from datetime import datetime, timedelta
from database import get_db_connection
from utils.response import json_response

task_bp = Blueprint("task_bp", __name__)


@task_bp.route("/api/tasks", methods=["GET"])
def get_tasks():
    conn = get_db_connection()
    tasks = conn.execute("""
        SELECT *
        FROM tasks
        ORDER BY created_at DESC
    """).fetchall()
    conn.close()

    return json_response({
        "status": "success",
        "data": [dict(task) for task in tasks]
    })


@task_bp.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task_by_id(task_id):
    conn = get_db_connection()
    task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (task_id,)).fetchone()
    conn.close()

    if task is None:
        return json_response({
            "status": "error",
            "message": "Task not found"
        }, 404)

    return json_response({
        "status": "success",
        "data": dict(task)
    })


@task_bp.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json()

    title = data.get("title")
    description = data.get("description", "")
    category = data.get("category", "General")
    deadline = data.get("deadline", "")
    importance = data.get("importance", 3)
    estimated_minutes = data.get("estimated_minutes", 30)

    if not title:
        return json_response({
            "status": "error",
            "message": "title is required"
        }, 400)

    conn = get_db_connection()
    cursor = conn.execute("""
        INSERT INTO tasks (
            title,
            description,
            category,
            deadline,
            importance,
            estimated_minutes,
            status,
            postpone_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title,
        description,
        category,
        deadline,
        importance,
        estimated_minutes,
        "pending",
        0
    ))

    conn.commit()
    task_id = cursor.lastrowid
    conn.close()

    return json_response({
        "status": "success",
        "message": "Task created successfully",
        "data": {
            "id": task_id,
            "title": title,
            "description": description,
            "category": category,
            "deadline": deadline,
            "importance": importance,
            "estimated_minutes": estimated_minutes,
            "status": "pending",
            "postpone_count": 0
        }
    }, 201)


@task_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json()

    title = data.get("title")
    description = data.get("description", "")
    category = data.get("category", "General")
    deadline = data.get("deadline", "")
    importance = data.get("importance", 3)
    estimated_minutes = data.get("estimated_minutes", 30)
    status = data.get("status", "pending")
    postpone_count = data.get("postpone_count", None)

    conn = get_db_connection()

    existing_task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (task_id,)).fetchone()

    if existing_task is None:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Task not found"
        }, 404)

    if postpone_count is None:
        postpone_count = existing_task["postpone_count"]

    if status == "completed" and existing_task["completed_at"] is None:
        completed_at_sql = "CURRENT_TIMESTAMP"
    elif status == "completed":
        completed_at_sql = "completed_at"
    else:
        completed_at_sql = "NULL"

    conn.execute(f"""
        UPDATE tasks
        SET
            title = ?,
            description = ?,
            category = ?,
            deadline = ?,
            importance = ?,
            estimated_minutes = ?,
            status = ?,
            postpone_count = ?,
            completed_at = {completed_at_sql}
        WHERE id = ?
    """, (
        title,
        description,
        category,
        deadline,
        importance,
        estimated_minutes,
        status,
        postpone_count,
        task_id
    ))

    conn.commit()
    conn.close()

    return json_response({
        "status": "success",
        "message": "Task updated successfully"
    })


@task_bp.route("/api/tasks/<int:task_id>/postpone", methods=["PUT"])
def postpone_task(task_id):
    conn = get_db_connection()

    existing_task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (task_id,)).fetchone()

    if existing_task is None:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Task not found"
        }, 404)

    if existing_task["status"] == "completed":
        conn.close()
        return json_response({
            "status": "error",
            "message": "Completed task cannot be postponed"
        }, 400)

    if existing_task["postpone_count"] >= 1:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Task can only be postponed once"
        }, 400)

    if existing_task["deadline"] is None or existing_task["deadline"] == "":
        conn.close()
        return json_response({
            "status": "error",
            "message": "Task without deadline cannot be postponed"
        }, 400)

    try:
        old_deadline = datetime.strptime(existing_task["deadline"], "%Y-%m-%d")
        new_deadline = old_deadline + timedelta(days=1)
        new_deadline_text = new_deadline.strftime("%Y-%m-%d")
    except ValueError:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Invalid deadline format"
        }, 400)

    conn.execute("""
        UPDATE tasks
        SET
            postpone_count = 1,
            deadline = ?
        WHERE id = ?
    """, (new_deadline_text, task_id))

    conn.commit()

    updated_task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (task_id,)).fetchone()

    conn.close()

    return json_response({
        "status": "success",
        "message": "Task postponed successfully",
        "data": dict(updated_task)
    })


@task_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_db_connection()

    existing_task = conn.execute("""
        SELECT *
        FROM tasks
        WHERE id = ?
    """, (task_id,)).fetchone()

    if existing_task is None:
        conn.close()
        return json_response({
            "status": "error",
            "message": "Task not found"
        }, 404)

    conn.execute("""
        DELETE FROM tasks
        WHERE id = ?
    """, (task_id,))

    conn.commit()
    conn.close()

    return json_response({
        "status": "success",
        "message": "Task deleted successfully"
    })


@task_bp.route("/api/analytics/summary", methods=["GET"])
def get_analytics_summary():
    conn = get_db_connection()

    total_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
    """).fetchone()["count"]

    completed_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE status = 'completed'
    """).fetchone()["count"]

    pending_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE status = 'pending'
    """).fetchone()["count"]

    conn.close()

    completion_rate = 0

    if total_tasks > 0:
        completion_rate = round((completed_tasks / total_tasks) * 100, 1)

    return json_response({
        "status": "success",
        "data": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "completion_rate": completion_rate
        }
    })


@task_bp.route("/api/analytics/weekly", methods=["GET"])
def get_weekly_analytics():
    conn = get_db_connection()

    result = conn.execute("""
        SELECT
            DATE(completed_at) AS date,
            COUNT(*) AS completed_tasks
        FROM tasks
        WHERE completed_at IS NOT NULL
        GROUP BY DATE(completed_at)
        ORDER BY DATE(completed_at)
    """).fetchall()

    conn.close()

    weekly_data = []

    for row in result:
        weekly_data.append({
            "date": row["date"],
            "completed_tasks": row["completed_tasks"]
        })

    return json_response({
        "status": "success",
        "data": weekly_data
    })


@task_bp.route("/api/analytics/heatmap", methods=["GET"])
def get_heatmap_analytics():
    conn = get_db_connection()

    result = conn.execute("""
        SELECT
            DATE(completed_at) AS date,
            COUNT(*) AS completed_tasks
        FROM tasks
        WHERE completed_at IS NOT NULL
        GROUP BY DATE(completed_at)
        ORDER BY DATE(completed_at)
    """).fetchall()

    conn.close()

    heatmap_data = []

    for row in result:
        heatmap_data.append({
            "date": row["date"],
            "count": row["completed_tasks"]
        })

    return json_response({
        "status": "success",
        "data": heatmap_data
    })


@task_bp.route("/api/analytics/task-types", methods=["GET"])
def get_task_type_analytics():
    conn = get_db_connection()

    result = conn.execute("""
        SELECT
            category,
            COUNT(*) AS count
        FROM tasks
        GROUP BY category
        ORDER BY count DESC
    """).fetchall()

    conn.close()

    data = []

    for row in result:
        data.append({
            "category": row["category"],
            "count": row["count"]
        })

    return json_response({
        "status": "success",
        "data": data
    })

@task_bp.route("/api/analytics/productivity", methods=["GET"])
def get_productivity_analytics():

    conn = get_db_connection()

    total_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
    """).fetchone()["count"]

    completed_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE status = 'completed'
    """).fetchone()["count"]

    postponed_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE postpone_count > 0
    """).fetchone()["count"]

    overdue_tasks = conn.execute("""
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE status = 'pending'
        AND deadline IS NOT NULL
        AND deadline != ''
        AND DATE(deadline) < DATE('now')
    """).fetchone()["count"]

    category_result = conn.execute("""
        SELECT
            category,
            COUNT(*) AS count
        FROM tasks
        WHERE status = 'completed'
        GROUP BY category
        ORDER BY count DESC
        LIMIT 1
    """).fetchone()

    conn.close()

    completion_rate = 0

    if total_tasks > 0:
        completion_rate = round(
            (completed_tasks / total_tasks) * 100,
            1
        )

    most_active_category = "無資料"

    if category_result:
        most_active_category = category_result["category"]

    return json_response({
        "status": "success",
        "data": {
            "completion_rate": completion_rate,
            "completed_tasks": completed_tasks,
            "postponed_tasks": postponed_tasks,
            "overdue_tasks": overdue_tasks,
            "most_active_category": most_active_category
        }
    })

@task_bp.route("/api/analytics/completion-time", methods=["GET"])
def get_completion_time_analytics():

    conn = get_db_connection()

    result = conn.execute("""
        SELECT
            created_at,
            completed_at
        FROM tasks
        WHERE status = 'completed'
        AND created_at IS NOT NULL
        AND completed_at IS NOT NULL
    """).fetchall()

    conn.close()

    if len(result) == 0:
        return json_response({
            "status": "success",
            "data": {
                "average_days": 0,
                "fastest_days": 0,
                "slowest_days": 0
            }
        })

    completion_days = []

    for row in result:
        created_time = datetime.strptime(row["created_at"], "%Y-%m-%d %H:%M:%S")
        completed_time = datetime.strptime(row["completed_at"], "%Y-%m-%d %H:%M:%S")

        days = (completed_time - created_time).total_seconds() / 86400
        completion_days.append(days)

    average_days = round(sum(completion_days) / len(completion_days), 1)
    fastest_days = round(min(completion_days), 1)
    slowest_days = round(max(completion_days), 1)

    return json_response({
        "status": "success",
        "data": {
            "average_days": average_days,
            "fastest_days": fastest_days,
            "slowest_days": slowest_days
        }
    })