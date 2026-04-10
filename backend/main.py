from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import sqlite3
from db import get_db_connection, init_db
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "your_email@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your_app_password")
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week
import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

app = FastAPI(title="Beloved Connect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_password_hash(password):

    trunc_pw = password.encode('utf-8')[:71]
    return bcrypt.hashpw(trunc_pw, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    trunc_pw = plain_password.encode('utf-8')[:71]
    return bcrypt.checkpw(trunc_pw, hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    if user is None:
        raise credentials_exception
    return dict(user)

def now_str():
    return datetime.now().strftime("%b %d, %Y")

class UserCreate(BaseModel):
    name: str
    username: str
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str

class Memory(BaseModel):
    title: str
    content: str
    date: Optional[str] = None
    shared_with: Optional[str] = None
    id: Optional[int] = None

class Invitation(BaseModel):
    email: str
    type: str = "message"
    content: str
    status: Optional[str] = "pending"
    id: Optional[int] = None
    date: Optional[str] = None

class Note(BaseModel):
    title: str
    content: str
    category: Optional[str] = "me"   
    date: Optional[str] = None
    shared_with: Optional[str] = None
    id: Optional[int] = None

class BelovedPerson(BaseModel):
    name: str
    relation: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    notes: Optional[str] = ""
    id: Optional[int] = None

@app.post("/api/register")
def register(user: UserCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    existing = cur.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = get_password_hash(user.password)
    cur.execute("INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)", (user.username, hashed_pw, user.name))
    conn.commit()
    conn.close()
    return {"message": "User registered successfully"}

@app.post("/api/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (form_data.username,)).fetchone()
    conn.close()
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/memories", response_model=List[Memory])
def get_memories(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    memories = conn.execute("SELECT * FROM memories WHERE user_id = ? OR shared_with = ? ORDER BY id DESC", (current_user["id"], current_user["username"])).fetchall()
    conn.close()
    return [dict(m) for m in memories]

@app.post("/api/memories", response_model=Memory)
def add_memory(memory: Memory, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    date_str = memory.date or now_str()
    cur.execute("INSERT INTO memories (user_id, title, content, date, shared_with) VALUES (?, ?, ?, ?, ?)", 
                (current_user["id"], memory.title, memory.content, date_str, memory.shared_with))
    conn.commit()
    memory.id = cur.lastrowid
    memory.date = date_str
    conn.close()
    return memory

@app.get("/api/invitations")
def get_invitations(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    invitations = conn.execute("SELECT * FROM invitations WHERE user_id = ? ORDER BY id DESC", (current_user["id"],)).fetchall()
    conn.close()
    return [dict(i) for i in invitations]

@app.post("/api/invitations")
def send_invitation(invitation: Invitation, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    date_str = invitation.date or now_str()
    cur.execute("INSERT INTO invitations (user_id, email, type, content, status, date) VALUES (?, ?, ?, ?, ?, ?)",
                (current_user["id"], invitation.email, invitation.type, invitation.content, invitation.status, date_str))
    conn.commit()
    inv_id = cur.lastrowid
    conn.close()
    item = invitation.model_dump()
    item["id"] = inv_id
    item["date"] = date_str
    
    # Send email via SMTP
    try:
        sender_name = current_user.get("name") or current_user.get("username")
        msg = EmailMessage()
        msg['Subject'] = f"A special message from {sender_name}"
        msg['From'] = f"Beloved Connect <{SMTP_USERNAME}>"
        msg['To'] = invitation.email
        
        
        msg.set_content(f"A special message from {sender_name}:\n\n{invitation.content}\n\nSent via Beloved Connect")
        
        
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf2f8; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">💌</div>
                    <h1 style="color: #be123c; margin: 0; font-size: 28px; font-weight: 700;">Love from {sender_name}</h1>
                    <p style="color: #64748b; font-size: 16px; margin-top: 8px;">They wanted to share something special with you.</p>
                </div>
                
                <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 24px; border-radius: 4px 12px 12px 4px; margin-bottom: 30px;">
                    <p style="color: #334155; font-size: 18px; line-height: 1.6; margin: 0; white-space: pre-wrap; font-style: italic;">"{invitation.content}"</p>
                </div>
                
                <div style="text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                    <p style="margin: 0;">Sent with ❤️ from <b>Beloved Connect</b></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.add_alternative(html_template, subtype='html')

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            
    except Exception as e:
        print(f"Failed to send email via SMTP: {e}")

    return {"message": "Invitation sent successfully", "data": item}

@app.get("/api/notes", response_model=List[Note])
def get_notes(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    notes = conn.execute("SELECT * FROM notes WHERE user_id = ? OR shared_with = ? ORDER BY id DESC", (current_user["id"], current_user["username"])).fetchall()
    conn.close()
    return [dict(n) for n in notes]

@app.post("/api/notes", response_model=Note)
def add_note(note: Note, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    date_str = note.date or now_str()
    cur.execute("INSERT INTO notes (user_id, title, content, category, date, shared_with) VALUES (?, ?, ?, ?, ?, ?)",
                (current_user["id"], note.title, note.content, note.category, date_str, note.shared_with))
    conn.commit()
    note.id = cur.lastrowid
    note.date = date_str
    conn.close()

    # If the note is shared with someone, send them an email
    if note.shared_with:
        try:
            sender_name = current_user.get("name") or current_user.get("username")
            msg = EmailMessage()
            msg['Subject'] = f"A special note shared by {sender_name}"
            msg['From'] = f"Beloved Connect <{SMTP_USERNAME}>"
            msg['To'] = note.shared_with
            
            msg.set_content(f"{sender_name} shared a note with you: {note.title}\n\n{note.content}\n\nSent via Beloved Connect")
            
            html_template = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf2f8; margin: 0; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
                        <h1 style="color: #be123c; margin: 0; font-size: 28px; font-weight: 700;">A Note from {sender_name}</h1>
                        <p style="color: #64748b; font-size: 16px; margin-top: 8px;">They wanted to share this thought with you.</p>
                    </div>
                    
                    <h2 style="color: #334155; margin-bottom: 10px;">{note.title}</h2>
                    <div style="background-color: #f1f5f9; border-left: 4px solid #be123c; padding: 24px; border-radius: 4px 12px 12px 4px; margin-bottom: 30px;">
                        <p style="color: #334155; font-size: 18px; line-height: 1.6; margin: 0; white-space: pre-wrap;">{note.content}</p>
                    </div>
                    
                    <div style="text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                        <p style="margin: 0;">Sent with ❤️ from <b>Beloved Connect</b></p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.add_alternative(html_template, subtype='html')

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                
        except Exception as e:
            print(f"Failed to send note email via SMTP: {e}")

    return note

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, current_user["id"]))
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found")
    conn.commit()
    conn.close()
    return {"message": "Note deleted"}

@app.get("/api/beloved", response_model=List[BelovedPerson])
def get_beloved(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    beloved = conn.execute("SELECT * FROM beloved WHERE user_id = ? ORDER BY id DESC", (current_user["id"],)).fetchall()
    conn.close()
    return [dict(b) for b in beloved]

@app.post("/api/beloved", response_model=BelovedPerson)
def add_beloved(person: BelovedPerson, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO beloved (user_id, name, relation, mobile, email, notes) VALUES (?, ?, ?, ?, ?, ?)",
                (current_user["id"], person.name, person.relation, person.mobile, person.email, person.notes))
    conn.commit()
    person.id = cur.lastrowid
    conn.close()
    return person

@app.delete("/api/beloved/{person_id}")
def delete_beloved(person_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM beloved WHERE id = ? AND user_id = ?", (person_id, current_user["id"]))
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Person not found")
    conn.commit()
    conn.close()
    return {"message": "Person deleted"}
