import sqlite3
import json

def check_db():
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Scheduled Messages ---")
    cursor.execute("SELECT * FROM scheduled_messages")
    rows = cursor.fetchall()
    for row in rows:
        print(dict(row))
        
    print("\n--- Invitations ---")
    cursor.execute("SELECT * FROM invitations")
    rows = cursor.fetchall()
    for row in rows:
        print(dict(row))
    
    conn.close()

if __name__ == "__main__":
    check_db()
