"""
Background scheduler that checks for due scheduled messages
and sends them via SMTP automatically.
"""

import threading
import time
import smtplib
import os
import logging
from email.message import EmailMessage
from datetime import datetime, timedelta
from db import get_db_connection
from dotenv import load_dotenv

# Configure logging to match main app or separate
logger = logging.getLogger("scheduler")
if not logger.handlers:
    handler = logging.FileHandler("../backend_debug.log")
    handler.setFormatter(logging.Formatter("%(asctime)s [SCHEDULER] %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

load_dotenv()

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "your_email@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your_app_password")

CHECK_INTERVAL = 60  # seconds


def _send_scheduled_email(message: dict, sender_name: str):
    """Send a single scheduled email via SMTP."""
    msg = EmailMessage()
    subject = message['subject'] or f"A scheduled message from {sender_name}"
    msg['Subject'] = subject
    msg['From'] = f"Beloved Connect <{SMTP_USERNAME}>"
    msg['To'] = message['recipient_email']

    occasion_label = message.get('occasion', '') or 'a special occasion'

    msg.set_content(
        f"A scheduled message from {sender_name}:\n\n"
        f"{message['content']}\n\n"
        f"Occasion: {occasion_label}\n\n"
        f"Sent via Beloved Connect"
    )

    recipient_name = message.get('recipient_name', '') or 'there'
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
                <div style="font-size: 48px; margin-bottom: 15px;">🎁</div>
                <h1 style="color: #be123c; margin: 0; font-size: 28px; font-weight: 700;">
                    {subject}
                </h1>
                <p style="color: #64748b; font-size: 16px; margin-top: 8px;">
                    Hi {recipient_name}, {sender_name} scheduled this special message for you.
                </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff1f2, #fce7f3); border-left: 4px solid #be123c; padding: 24px; border-radius: 4px 12px 12px 4px; margin-bottom: 20px;">
                <p style="color: #334155; font-size: 18px; line-height: 1.6; margin: 0; white-space: pre-wrap; font-style: italic;">
                    "{message['content']}"
                </p>
            </div>
            
            <div style="text-align: center; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
                <span style="color: #64748b; font-size: 14px;">💐 Occasion: <strong>{occasion_label}</strong></span>
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


def _get_next_date(current_date_str: str, recurrence: str) -> str:
    """Calculate the next occurrence date based on recurrence type."""
    dt = datetime.strptime(current_date_str, "%Y-%m-%d")
    if recurrence == "yearly":
        next_dt = dt.replace(year=dt.year + 1)
    elif recurrence == "monthly":
        month = dt.month + 1
        year = dt.year
        if month > 12:
            month = 1
            year += 1
        day = min(dt.day, 28)  # safe day for all months
        next_dt = dt.replace(year=year, month=month, day=day)
    elif recurrence == "weekly":
        next_dt = dt + timedelta(days=7)
    else:
        return ""
    return next_dt.strftime("%Y-%m-%d")


def _process_due_messages():
    """Check for messages that are due and send them."""
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")

    conn = get_db_connection()
    try:
        due_messages = conn.execute(
            """SELECT sm.*, u.name AS sender_name, u.username AS sender_username
               FROM scheduled_messages sm
               JOIN users u ON sm.user_id = u.id
               WHERE sm.status = 'scheduled'
                 AND (sm.scheduled_date < ? OR (sm.scheduled_date = ? AND sm.scheduled_time <= ?))
               ORDER BY sm.scheduled_date ASC, sm.scheduled_time ASC""",
            (today, today, current_time)
        ).fetchall()

        for msg_row in due_messages:
            msg = dict(msg_row)
            sender_name = msg.get('sender_name') or msg.get('sender_username', 'Someone')

            try:
                _send_scheduled_email(msg, sender_name)

                conn.execute(
                    "UPDATE scheduled_messages SET status = 'sent', sent_at = ? WHERE id = ?",
                    (now.isoformat(), msg['id'])
                )

                # Handle recurrence
                recurrence = msg.get('recurrence', 'none')
                if recurrence and recurrence != 'none':
                    next_date = _get_next_date(msg['scheduled_date'], recurrence)
                    if next_date:
                        conn.execute(
                            """INSERT INTO scheduled_messages
                               (user_id, recipient_email, recipient_name, subject,
                                content, scheduled_date, scheduled_time, occasion,
                                status, recurrence)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)""",
                            (msg['user_id'], msg['recipient_email'],
                             msg['recipient_name'], msg['subject'],
                             msg['content'], next_date, msg['scheduled_time'],
                             msg['occasion'], recurrence)
                        )

                conn.commit()
                logger.info(f"Sent scheduled message #{msg['id']} to {msg['recipient_email']}")

            except Exception as e:
                conn.execute(
                    "UPDATE scheduled_messages SET status = 'failed' WHERE id = ?",
                    (msg['id'],)
                )
                conn.commit()
                logger.error(f"Failed to send message #{msg['id']}: {e}")

    except Exception as e:
        logger.error(f"Error processing due messages: {e}")
    finally:
        conn.close()


def _scheduler_loop():
    """Main scheduler loop that runs in a background thread."""
    logger.info("Background scheduler loop started.")
    while True:
        try:
            _process_due_messages()
        except Exception as e:
            logger.error(f"Loop error: {e}")
        time.sleep(CHECK_INTERVAL)


def start_scheduler():
    """Start the background scheduler thread."""
    thread = threading.Thread(target=_scheduler_loop, daemon=True)
    thread.start()
    print("[Scheduler] Scheduler thread launched.")
    return thread
