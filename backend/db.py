import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "app.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            username TEXT UNIQUE,
            password_hash TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            content TEXT,
            date TEXT,
            shared_with TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    # Migration: add created_at to existing memories table if missing
    try:
        c.execute('ALTER TABLE memories ADD COLUMN created_at TIMESTAMP')
    except Exception:
        pass
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            content TEXT,
            category TEXT,
            date TEXT,
            shared_with TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    # Migration: add created_at to existing notes table if missing
    try:
        c.execute('ALTER TABLE notes ADD COLUMN created_at TIMESTAMP')
    except Exception:
        pass
    c.execute('''
        CREATE TABLE IF NOT EXISTS invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            email TEXT,
            type TEXT,
            content TEXT,
            status TEXT,
            date TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS beloved (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            relation TEXT,
            mobile TEXT,
            email TEXT,
            notes TEXT,
            last_contact TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    # Migration: add last_contact to existing beloved table if missing
    try:
        c.execute('ALTER TABLE beloved ADD COLUMN last_contact TIMESTAMP')
    except Exception:
        pass
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            beloved_id INTEGER,
            activity_type TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            details TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(beloved_id) REFERENCES beloved(id)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            beloved_id INTEGER,
            reminder_type TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            due_date TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            is_dismissed INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(beloved_id) REFERENCES beloved(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            recipient_email TEXT NOT NULL,
            recipient_name TEXT DEFAULT '',
            subject TEXT DEFAULT '',
            content TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            scheduled_time TEXT DEFAULT '09:00',
            occasion TEXT DEFAULT '',
            status TEXT DEFAULT 'scheduled',
            recurrence TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

# init_db() - moved to main.py startup for better control and to avoid reload loops
