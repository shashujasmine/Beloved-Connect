from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

def create_token(username):
    to_encode = {"sub": username}
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

if __name__ == "__main__":
    # Get a username from the DB
    import sqlite3
    conn = sqlite3.connect('app.db')
    user = conn.execute("SELECT username FROM users LIMIT 1").fetchone()
    conn.close()
    
    if user:
        token = create_token(user[0])
        print(token)
    else:
        print("No users found")
