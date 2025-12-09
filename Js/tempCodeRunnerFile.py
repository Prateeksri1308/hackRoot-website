# app.py
import os
from flask import Flask, request, redirect, url_for, render_template_string, flash
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import secrets
print(secrets.token_hex(32))


load_dotenv()  # loads .env file if present

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-this-secret")

# Required env vars:
SMTP_HOST = os.environ.get("SMTP_HOST")        # e.g. "smtp.gmail.com"
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER")        # your sender email
SMTP_PASS = os.environ.get("SMTP_PASS")        # your SMTP password or app password
RECIPIENT = os.environ.get("RECIPIENT_EMAIL")  # where notifications should go (your mailbox)

if not all([SMTP_HOST, SMTP_USER, SMTP_PASS, RECIPIENT]):
    print("WARNING: Missing SMTP env vars. Set SMTP_HOST, SMTP_USER, SMTP_PASS, RECIPIENT_EMAIL")


@app.route("/")
def home():
    # If you prefer, serve index.html via static files. For demo we inline a simple page.
    html = """
    <!doctype html><html><head><meta charset="utf-8"><title>Join</title></head><body>
    <h2>Join / Contact</h2>
    <form id="joinForm" action="/submit" method="post">
      <input name="name" placeholder="Your name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="github" placeholder="GitHub / LinkedIn (optional)" />
      <textarea name="message" rows="4" placeholder="How you'd like to help"></textarea>
      <button type="submit">Send</button>
    </form>
    </body></html>
    """
    return render_template_string(html)


def send_email(to_email: str, subject: str, body: str, from_name="HackRoot", from_email=None):
    """Send a single email via configured SMTP."""
    if from_email is None:
        from_email = SMTP_USER

    msg = EmailMessage()
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    # Connect and send
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.ehlo()
        if SMTP_PORT == 587:
            smtp.starttls()
            smtp.ehlo()
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)


@app.route("/submit", methods=["POST"])
def submit():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    github = request.form.get("github", "").strip()
    message = request.form.get("message", "").strip()

    if not name or not email:
        flash("Name and email are required.")
        return redirect(url_for("home"))

    # 1) Send notification to your inbox (RECIPIENT)
    subject = f"[HackRoot] New join request from {name}"
    body = f"""
New join request submitted on the website:

Name: {name}
Email: {email}
GitHub/LinkedIn: {github}
Message:
{message}
"""
    try:
        send_email(RECIPIENT, subject, body)
    except Exception as e:
        # Log and inform (for production, use logging)
        print("Error sending notification email:", e)
        flash("Failed to send your request — please try again later.")
        return redirect(url_for("home"))

    # 2) Send confirmation email to the person who submitted
    try:
        confirm_subject = "Thanks for reaching out to HackRoot!"
        confirm_body = f"""Hi {name},

Thanks for contacting HackRoot. We received your message:

"{message}"

We'll review your request and get back to you soon.

— Team HackRoot
"""
        send_email(email, confirm_subject, confirm_body)
    except Exception as e:
        print("Warning: confirmation email failed:", e)
        # still continue; confirmation email is nice-to-have

    flash("Thanks — we received your request. Confirmation sent.")
    return redirect(url_for("home"))


if __name__ == "__main__":
    # For development only. Use a production WSGI server in production.
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
