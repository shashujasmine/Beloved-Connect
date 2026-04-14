from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import sqlite3
from db import get_db_connection, init_db
from reminder_system import ReminderSystem
from scheduler import start_scheduler
import os
import smtplib
import logging
from email.message import EmailMessage
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("../backend_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully")
        start_scheduler()
        logger.info("Scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed during startup: {e}")


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
    cur.execute("INSERT INTO memories (user_id, title, content, date, shared_with, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))", 
                (current_user["id"], memory.title, memory.content, date_str, memory.shared_with))
    conn.commit()
    memory_id = cur.lastrowid
    row = conn.execute("SELECT * FROM memories WHERE id = ?", (memory_id,)).fetchone()
    conn.close()
    return dict(row)
    
    # Log activity if shared with a beloved one
    if memory.shared_with:
        # Find beloved person with matching email
        conn = get_db_connection()
        beloved = conn.execute("SELECT id FROM beloved WHERE user_id = ? AND (email = ? OR name = ?)", 
                              (current_user["id"], memory.shared_with, memory.shared_with)).fetchone()
        conn.close()
        
        if beloved:
            ReminderSystem.log_activity(
                user_id=current_user["id"],
                beloved_id=beloved['id'],
                activity_type='memory_created',
                details=f'Shared memory: {memory.title}'
            )

        # Send email if shared_with is an email address
        if memory.shared_with and "@" in memory.shared_with:
            try:
                sender_name = current_user.get("name") or current_user.get("username")
                msg = EmailMessage()
                msg['Subject'] = f"A special memory shared by {sender_name}"
                msg['From'] = f"Beloved Connect <{SMTP_USERNAME}>"
                msg['To'] = memory.shared_with
                
                msg.set_content(f"{sender_name} shared a memory with you: {memory.title}\n\n{memory.content}\n\nSent via Beloved Connect")
                
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
                            <div style="font-size: 48px; margin-bottom: 15px;">✨</div>
                            <h1 style="color: #be123c; margin: 0; font-size: 28px; font-weight: 700;">A Memory from {sender_name}</h1>
                            <p style="color: #64748b; font-size: 16px; margin-top: 8px;">They wanted to share this moment with you.</p>
                        </div>
                        
                        <h2 style="color: #334155; margin-bottom: 10px;">{memory.title}</h2>
                        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 24px; border-radius: 4px 12px 12px 4px; margin-bottom: 30px;">
                            <p style="color: #334155; font-size: 18px; line-height: 1.6; margin: 0; white-space: pre-wrap;">{memory.content}</p>
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
                    server.set_debuglevel(1)
                    server.starttls()
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    server.send_message(msg)
                    logger.info(f"Memory email successfully sent to {memory.shared_with}")
                    
            except Exception as e:
                logger.error(f"Failed to send memory email via SMTP: {e}")
    
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
            server.set_debuglevel(1)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            logger.info(f"Email successfully sent to {invitation.email}")
        
        # Update status to sent in DB
        conn = get_db_connection()
        conn.execute("UPDATE invitations SET status = 'sent' WHERE id = ?", (inv_id,))
        conn.commit()
        conn.close()
        item["status"] = "sent"
            
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {invitation.email}: {e}")
        # Optionally update status to failed in DB
        conn = get_db_connection()
        conn.execute("UPDATE invitations SET status = 'failed' WHERE id = ?", (inv_id,))
        conn.commit()
        conn.close()
        item["status"] = "failed"
        # raise HTTPException(status_code=500, detail=f"Mail server error: {str(e)}")

    # Log activity if invitation is to a beloved one
    conn = get_db_connection()
    beloved = conn.execute("SELECT id FROM beloved WHERE user_id = ? AND (email = ? OR name = ?)", 
                          (current_user["id"], invitation.email, invitation.email)).fetchone()
    conn.close()
    
    if beloved:
        ReminderSystem.log_activity(
            user_id=current_user["id"],
            beloved_id=beloved['id'],
            activity_type='invitation_sent',
            details=f'Sent invitation: {invitation.type}'
        )

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
    cur.execute("INSERT INTO notes (user_id, title, content, category, date, shared_with, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
                (current_user["id"], note.title, note.content, note.category, date_str, note.shared_with))
    conn.commit()
    note_id = cur.lastrowid
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    conn.close()
    
    # Reload the note from DB to get the created_at
    note_data = dict(row)

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
                server.set_debuglevel(1)
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                logger.info(f"Note email successfully sent to {note.shared_with}")
                
        except Exception as e:
            logger.error(f"Failed to send note email via SMTP to {note.shared_with}: {e}")
        
        # Log activity if note is shared with a beloved one
        conn = get_db_connection()
        beloved = conn.execute("SELECT id FROM beloved WHERE user_id = ? AND (email = ? OR name = ?)", 
                              (current_user["id"], note.shared_with, note.shared_with)).fetchone()
        conn.close()
        
        if beloved:
            ReminderSystem.log_activity(
                user_id=current_user["id"],
                beloved_id=beloved['id'],
                activity_type='note_shared',
                details=f'Shared note: {note.title}'
            )

    return note_data

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

# ── Timeline ──────────────────────────────────────────────────────────────────

@app.get("/api/timeline")
def get_timeline(
    sort: str = "desc",           # "asc" | "desc"
    person: Optional[str] = None, # filter by shared_with email/username
    current_user: dict = Depends(get_current_user)
):
    """
    Returns a merged, chronologically sorted list of memories + notes
    belonging to (or shared with) the current user.
    Each item has: id, kind ("memory"|"note"), title, content, date,
                   shared_with, created_at, category (notes only).
    """
    conn = get_db_connection()

    # Build WHERE clause for optional person filter
    person_clause = ""
    person_params_m: list = []
    person_params_n: list = []

    if person:
        person_clause = " AND (shared_with = ? OR shared_with = ?)"
        person_params_m = [person, person]
        person_params_n = [person, person]

    memories_rows = conn.execute(
        f"""SELECT id, 'memory' AS kind, title, content, date,
                   COALESCE(shared_with, '') AS shared_with,
                   COALESCE(created_at, date) AS created_at,
                   '' AS category
            FROM memories
            WHERE user_id = ?{person_clause}""",
        [current_user["id"]] + person_params_m
    ).fetchall()

    notes_rows = conn.execute(
        f"""SELECT id, 'note' AS kind, title, content, date,
                   COALESCE(shared_with, '') AS shared_with,
                   COALESCE(created_at, date) AS created_at,
                   COALESCE(category, '') AS category
            FROM notes
            WHERE user_id = ?{person_clause}""",
        [current_user["id"]] + person_params_n
    ).fetchall()

    conn.close()

    try:
        # Merge and sort
        items = [dict(r) for r in memories_rows] + [dict(r) for r in notes_rows]
        reverse = sort.lower() != "asc"
        
        # Robust sorting: handle None or empty created_at
        def get_sort_key(x):
            val = x.get("created_at")
            if val is None:
                return ""
            return str(val)
            
        items.sort(key=get_sort_key, reverse=reverse)
        return items
    except Exception as e:
        logger.error(f"Error processing timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ActivityLog(BaseModel):
    activity_type: str
    beloved_id: int
    details: Optional[str] = ""

class ReminderResponse(BaseModel):
    id: Optional[int] = None
    reminder_type: str
    message: str
    beloved_name: Optional[str] = None
    created_at: Optional[str] = None
    is_read: int = 0

# ── Reminders & Activity Tracking ────────────────────────────────────────────

@app.post("/api/activity/log")
def log_activity(
    activity: ActivityLog,
    current_user: dict = Depends(get_current_user)
):
    """
    Log an interaction with a beloved one.
    
    Activity types: 'message', 'call', 'visit', 'memory_created', 'note_shared', 'invitation_sent'
    """
    ReminderSystem.log_activity(
        user_id=current_user["id"],
        beloved_id=activity.beloved_id,
        activity_type=activity.activity_type,
        details=activity.details
    )
    return {"message": "Activity logged successfully"}

@app.get("/api/reminders", response_model=List[ReminderResponse])
def get_reminders(current_user: dict = Depends(get_current_user)):
    """Get all pending reminders for the current user."""
    reminders = ReminderSystem.get_pending_reminders(current_user["id"])
    return [ReminderResponse(**r) for r in reminders]

@app.post("/api/reminders/generate")
def generate_reminders(current_user: dict = Depends(get_current_user)):
    """Generate new reminders based on activity analysis."""
    reminders = ReminderSystem.generate_reminders(current_user["id"])
    return {
        "message": f"Generated {len(reminders)} reminders",
        "reminders": reminders
    }

@app.put("/api/reminders/{reminder_id}/read")
def mark_reminder_read(reminder_id: int, current_user: dict = Depends(get_current_user)):
    """Mark a reminder as read."""
    success = ReminderSystem.mark_reminder_read(reminder_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder marked as read"}

@app.put("/api/reminders/{reminder_id}/dismiss")
def dismiss_reminder(reminder_id: int, current_user: dict = Depends(get_current_user)):
    """Dismiss a reminder."""
    success = ReminderSystem.dismiss_reminder(reminder_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder dismissed"}

@app.get("/api/stats/activity")
def get_activity_stats(
    beloved_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get activity statistics for the current user."""
    stats = ReminderSystem.get_activity_stats(current_user["id"], beloved_id)
    return {"stats": stats}

@app.get("/api/beloved/{person_id}/last-contact")
def get_last_contact_info(
    person_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get last contact information for a beloved one."""
    conn = get_db_connection()
    result = conn.execute("""
        SELECT id, name, last_contact FROM beloved 
        WHERE id = ? AND user_id = ?
    """, (person_id, current_user["id"])).fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Person not found")
    
    person = dict(result)
    if person['last_contact']:
        last_contact_dt = datetime.fromisoformat(person['last_contact'])
        days_since = (datetime.now() - last_contact_dt).days
    else:
        days_since = None
    
    return {
        "id": person['id'],
        "name": person['name'],
        "last_contact": person['last_contact'],
        "days_since": days_since
    }

# ── Scheduled Messages ────────────────────────────────────────────────────────

class ScheduledMessage(BaseModel):
    recipient_email: str
    recipient_name: Optional[str] = ""
    subject: Optional[str] = ""
    content: str
    scheduled_date: str
    scheduled_time: Optional[str] = "09:00"
    occasion: Optional[str] = ""
    recurrence: Optional[str] = "none"
    id: Optional[int] = None
    status: Optional[str] = "scheduled"
    created_at: Optional[str] = None
    sent_at: Optional[str] = None

@app.get("/api/scheduled-messages")
def get_scheduled_messages(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    messages = conn.execute(
        "SELECT * FROM scheduled_messages WHERE user_id = ? ORDER BY scheduled_date ASC, scheduled_time ASC",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return [dict(m) for m in messages]

@app.post("/api/scheduled-messages")
def create_scheduled_message(msg: ScheduledMessage, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO scheduled_messages
           (user_id, recipient_email, recipient_name, subject, content,
            scheduled_date, scheduled_time, occasion, status, recurrence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)""",
        (current_user["id"], msg.recipient_email, msg.recipient_name,
         msg.subject, msg.content, msg.scheduled_date, msg.scheduled_time,
         msg.occasion, msg.recurrence)
    )
    conn.commit()
    new_id = cur.lastrowid
    row = conn.execute("SELECT * FROM scheduled_messages WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    return dict(row)

@app.put("/api/scheduled-messages/{msg_id}")
def update_scheduled_message(msg_id: int, msg: ScheduledMessage, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    existing = conn.execute(
        "SELECT * FROM scheduled_messages WHERE id = ? AND user_id = ?",
        (msg_id, current_user["id"])
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    if existing["status"] == "sent":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot edit a sent message")
    conn.execute(
        """UPDATE scheduled_messages SET
           recipient_email = ?, recipient_name = ?, subject = ?,
           content = ?, scheduled_date = ?, scheduled_time = ?,
           occasion = ?, recurrence = ?
           WHERE id = ? AND user_id = ?""",
        (msg.recipient_email, msg.recipient_name, msg.subject,
         msg.content, msg.scheduled_date, msg.scheduled_time,
         msg.occasion, msg.recurrence, msg_id, current_user["id"])
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM scheduled_messages WHERE id = ?", (msg_id,)).fetchone()
    conn.close()
    return dict(updated)

@app.put("/api/scheduled-messages/{msg_id}/cancel")
def cancel_scheduled_message(msg_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    existing = conn.execute(
        "SELECT * FROM scheduled_messages WHERE id = ? AND user_id = ?",
        (msg_id, current_user["id"])
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    if existing["status"] == "sent":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot cancel a sent message")
    conn.execute(
        "UPDATE scheduled_messages SET status = 'cancelled' WHERE id = ? AND user_id = ?",
        (msg_id, current_user["id"])
    )
    conn.commit()
    conn.close()
    return {"message": "Scheduled message cancelled"}

@app.delete("/api/scheduled-messages/{msg_id}")
def delete_scheduled_message(msg_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM scheduled_messages WHERE id = ? AND user_id = ?",
        (msg_id, current_user["id"])
    )
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    conn.commit()
    conn.close()
    return {"message": "Scheduled message deleted"}
