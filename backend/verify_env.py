import os
from dotenv import load_dotenv

load_dotenv()
username = os.environ.get("SMTP_USERNAME")
password = os.environ.get("SMTP_PASSWORD")

print(f"SMTP_USERNAME: [{username}]")
print(f"SMTP_PASSWORD starts with: [{password[:4] if password else 'None'}]")
print(f"SMTP_PASSWORD ends with: [{password[-1] if password else 'None'}]")
