from flask import Blueprint
from database import get_db_connection
from utils.response import json_response

ai_bp = Blueprint("ai_bp", __name__)


@ai_bp.route("/api/ai/suggest", methods=["GET", "POST"])
def suggest_task():

    conn = get_db_connection()

    tasks = conn.execute("""
        SELECT *
        FROM tasks
        WHERE status = 'pending'
    """).fetchall()

    conn.close()

    if len(tasks) == 0:
        return json_response({
            "status": "success",
            "data": {
                "suggestion": "目前沒有待完成任務",
                "reason": [
                    "所有任務皆已完成"
                ]
            }
        })

    tasks = [dict(task) for task in tasks]

    ranked_tasks = sorted(
        tasks,
        key=lambda task: (
            -int(task["postpone_count"]),
            -int(task["importance"]),
            task["deadline"] if task["deadline"] else "9999-12-31",
            int(task["estimated_minutes"])
        )
    )

    best_task = ranked_tasks[0]

    reasons = []

    if int(best_task["postpone_count"]) > 0:
        reasons.append(f"此任務已延後 {best_task['postpone_count']} 次")

    if int(best_task["importance"]) >= 4:
        reasons.append("重要性較高")

    if best_task["deadline"]:
        reasons.append("截止日期較接近")

    if int(best_task["estimated_minutes"]) <= 120:
        reasons.append("預估完成時間較短")

    reasons.append("目前尚未完成")

    return json_response({
        "status": "success",
        "data": {
            "task": best_task["title"],
            "category": best_task["category"],
            "deadline": best_task["deadline"],
            "importance": best_task["importance"],
            "estimated_minutes": best_task["estimated_minutes"],
            "postpone_count": best_task["postpone_count"],
            "suggestion": f"建議優先完成：{best_task['title']}",
            "reason": reasons
        }
    })