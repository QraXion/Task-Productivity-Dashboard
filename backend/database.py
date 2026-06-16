import sqlite3

DATABASE_NAME = "tasks.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'General',
            deadline TEXT,
            importance INTEGER DEFAULT 3,
            estimated_minutes INTEGER DEFAULT 30,
            status TEXT DEFAULT 'pending',
            postpone_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT
        )
    """)

    existing_columns = conn.execute("""
        PRAGMA table_info(tasks)
    """).fetchall()

    column_names = [column["name"] for column in existing_columns]

    if "postpone_count" not in column_names:
        conn.execute("""
            ALTER TABLE tasks
            ADD COLUMN postpone_count INTEGER DEFAULT 0
        """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    default_categories = ["學習", "工作", "健康", "生活"]

    for category in default_categories:
        conn.execute("""
            INSERT OR IGNORE INTO categories (name)
            VALUES (?)
        """, (category,))

    conn.commit()
    conn.close()