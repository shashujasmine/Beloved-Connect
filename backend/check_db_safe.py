import sqlite3

def check_db():
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Invitations ---")
    cursor.execute("SELECT id, email, status, date FROM invitations ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row['id']}, Email: {row['email']}, Status: {row['status']}, Date: {row['date']}")
    
    print("\n--- Scheduled Messages ---")
    cursor.execute("SELECT id, recipient_email, status, scheduled_date FROM scheduled_messages ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row['id']}, Email: {row['recipient_email']}, Status: {row['status']}, Date: {row['scheduled_date']}")

    conn.close()

if __name__ == "__main__":
    check_db()
