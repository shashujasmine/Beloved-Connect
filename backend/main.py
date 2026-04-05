from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os

app = FastAPI(title="Beloved Connect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ─────────────────────────────────────────────

def read_json(file: str):
    if os.path.exists(file):
        with open(file, "r") as f:
            return json.load(f)
    return []

def write_json(file: str, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=4)

def now_str():
    return datetime.now().strftime("%b %d, %Y")

def new_id():
    return int(datetime.now().timestamp() * 1000)

# ── Models ───────────────────────────────────────────────

class Memory(BaseModel):
    title: str
    content: str
    date: Optional[str] = None
    id: Optional[int] = None

class Invitation(BaseModel):
    mobile: str
    type: str
    content: str
    status: Optional[str] = "pending"

class Note(BaseModel):
    title: str
    content: str
    category: Optional[str] = "me"   # me | beloved | shared
    date: Optional[str] = None
    id: Optional[int] = None

class BelovedPerson(BaseModel):
    name: str
    relation: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    notes: Optional[str] = ""
    id: Optional[int] = None

# ── Files ────────────────────────────────────────────────

FILES = {
    "memories":    "memories.json",
    "invitations": "invitations.json",
    "notes":       "notes.json",
    "beloved":     "beloved.json",
}

# ── Memories ─────────────────────────────────────────────

@app.get("/api/memories", response_model=List[Memory])
async def get_memories():
    return read_json(FILES["memories"])

@app.post("/api/memories", response_model=Memory)
async def add_memory(memory: Memory):
    data = read_json(FILES["memories"])
    item = memory.model_dump()
    item["id"] = new_id()
    if not item.get("date"):
        item["date"] = now_str()
    data.insert(0, item)
    write_json(FILES["memories"], data)
    return item

# ── Invitations ───────────────────────────────────────────

@app.get("/api/invitations")
async def get_invitations():
    return read_json(FILES["invitations"])

@app.post("/api/invitations")
async def send_invitation(invitation: Invitation):
    data = read_json(FILES["invitations"])
    item = invitation.model_dump()
    item["id"] = new_id()
    item["date"] = now_str()
    data.insert(0, item)
    write_json(FILES["invitations"], data)
    return {"message": "Invitation sent successfully", "data": item}

# ── Notes ────────────────────────────────────────────────

@app.get("/api/notes", response_model=List[Note])
async def get_notes():
    return read_json(FILES["notes"])

@app.post("/api/notes", response_model=Note)
async def add_note(note: Note):
    data = read_json(FILES["notes"])
    item = note.model_dump()
    item["id"] = new_id()
    if not item.get("date"):
        item["date"] = now_str()
    data.insert(0, item)
    write_json(FILES["notes"], data)
    return item

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: int):
    data = read_json(FILES["notes"])
    updated = [n for n in data if n["id"] != note_id]
    if len(updated) == len(data):
        raise HTTPException(status_code=404, detail="Note not found")
    write_json(FILES["notes"], updated)
    return {"message": "Note deleted"}

# ── Beloved Ones ──────────────────────────────────────────

@app.get("/api/beloved", response_model=List[BelovedPerson])
async def get_beloved():
    return read_json(FILES["beloved"])

@app.post("/api/beloved", response_model=BelovedPerson)
async def add_beloved(person: BelovedPerson):
    data = read_json(FILES["beloved"])
    item = person.model_dump()
    item["id"] = new_id()
    data.insert(0, item)
    write_json(FILES["beloved"], data)
    return item

@app.delete("/api/beloved/{person_id}")
async def delete_beloved(person_id: int):
    data = read_json(FILES["beloved"])
    updated = [p for p in data if p["id"] != person_id]
    if len(updated) == len(data):
        raise HTTPException(status_code=404, detail="Person not found")
    write_json(FILES["beloved"], updated)
    return {"message": "Person deleted"}
