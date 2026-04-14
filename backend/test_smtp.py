import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

print(f"Testing SMTP for {SMTP_USERNAME} on {SMTP_SERVER}:{SMTP_PORT}...")

msg = EmailMessage()
msg['Subject'] = "Test Email from Beloved Connect"
msg['From'] = f"Beloved Connect <{SMTP_USERNAME}>"
msg['To'] = SMTP_USERNAME # Send to self
msg.set_content("This is a test email to verify SMTP settings.")

try:
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.set_debuglevel(1)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
    print("Test email sent successfullly!")
except Exception as e:
    print(f"Failed to send test email: {e}")
