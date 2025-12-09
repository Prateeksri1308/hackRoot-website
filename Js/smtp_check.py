# smtp_check.py
import os, smtplib, socket
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

host = os.getenv("SMTP_HOST","smtp.gmail.com")
port = int(os.getenv("SMTP_PORT","587"))
user = os.getenv("SMTP_USER")
pw = os.getenv("SMTP_PASS")

print("Testing SMTP connection to", host, port)
print("Using user:", user)

try:
    print("Resolving host...")
    print(socket.getaddrinfo(host, port)[:1])
except Exception as e:
    print("DNS/resolve error:", e)

try:
    s = smtplib.SMTP(host, port, timeout=15)
    s.set_debuglevel(1)
    s.ehlo()
    s.starttls()
    s.ehlo()
    s.login(user, pw)
    print("Login SUCCESS")
    s.quit()
except Exception as e:
    print("Login FAILED:", repr(e))