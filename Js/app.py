#!/usr/bin/env python3
import os
import datetime
import html as html_lib
import socket
import traceback
import re
import json
import logging
from pathlib import Path
from flask import Flask, request, render_template_string
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.message import EmailMessage
from dotenv import load_dotenv

# -------------------------
# Config & env
# -------------------------
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-this-secret")

# DEV: simple permissive CORS for dev tunnels / local testing
# WARNING: Do NOT use "*" in production if you accept credentials/cookies.
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return response

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT") or 0)
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
RECIPIENT = os.environ.get("RECIPIENT_EMAIL")

SMTP_TIMEOUT = int(os.environ.get("SMTP_TIMEOUT", "20"))
SMTP_DEBUG = os.environ.get("SMTP_DEBUG", "false").lower() in ("1", "true", "yes")

# CDN images (change to your hosted URLs)
CDN_LOGO = os.environ.get("CDN_LOGO") or "https://i.ibb.co/h1Yw8M26/hackRootlogo.png"
CDN_HERO = os.environ.get("CDN_HERO") or "https://i.ibb.co/mVSNffQR/robot.png"

# -------------------------
# Logging
# -------------------------
logger = logging.getLogger("hackroot")
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(message)s")

# -------------------------
# SMTP helpers
# -------------------------
def _connect_smtp(host, port, use_ssl):
    """
    Return connected SMTP object (not logged in). Caller must login/send/quit.
    """
    if use_ssl:
        server = smtplib.SMTP_SSL(host, port, timeout=SMTP_TIMEOUT)
    else:
        server = smtplib.SMTP(host, port, timeout=SMTP_TIMEOUT)
    if SMTP_DEBUG:
        server.set_debuglevel(1)
    return server

def send_email_simple(to_email: str, subject: str, body: str):
    """
    Send plain-text email. Handles SSL (465) and STARTTLS automatically.
    Raises exceptions to caller.
    """
    msg = EmailMessage()
    msg["From"] = f"HackRoot <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    use_ssl = (SMTP_PORT == 465)
    server = _connect_smtp(SMTP_HOST, SMTP_PORT, use_ssl)
    try:
        if not use_ssl:
            server.ehlo()
            if server.has_extn("STARTTLS"):
                server.starttls()
                server.ehlo()
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
    finally:
        try:
            server.quit()
        except Exception:
            pass

def send_html_email(to_email: str, subject: str, text_body: str, html_body: str, reply_to: str = None):
    """
    Send multipart HTML email. Optionally set Reply-To.
    Raises exceptions to caller.
    """
    msg = MIMEMultipart("alternative")
    msg["From"] = f"HackRoot <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    use_ssl = (SMTP_PORT == 465)
    server = _connect_smtp(SMTP_HOST, SMTP_PORT, use_ssl)
    try:
        if not use_ssl:
            server.ehlo()
            if server.has_extn("STARTTLS"):
                server.starttls()
                server.ehlo()
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
    finally:
        try:
            server.quit()
        except Exception:
            pass

# -------------------------
# Email templates
# -------------------------
# Premium HTML template used for confirmation email (responsive)
PREMIUM_HTML_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HackRoot — Message Received</title>

<style>
  /* Responsive */
  @media only screen and (max-width:520px) {
    .container { width:100% !important; padding:12px !important; }
    .hero { width:100% !important; height:auto !important; }
    .cta { width:100% !important; display:block !important; text-align:center !important; }
  }

  body {
    margin:0;
    padding:0;
    background:#eef3fa;
    font-family:Inter,Arial,Helvetica,sans-serif;
  }

  .card {
    width:680px;
    max-width:680px;
    border-radius:18px;
    overflow:hidden;
    background:#071422;
    color:#e8f6ff;
    box-shadow:0 24px 70px rgba(0,0,0,0.45);
    border:1px solid rgba(130,200,255,0.05);
  }

  .header {
    padding:18px 24px;
    background:linear-gradient(90deg,#03121e,#08263c);
    display:flex;
    align-items:center;
  }

  .logo {
    width:56px;
    height:56px;
    border-radius:12px;
    display:block;
    box-shadow:0 6px 16px rgba(0,168,255,0.12);
  }

  .hero-img {
    width:100%;
    display:block;
    object-fit:cover;
  }

  .body {
    padding:26px 32px 30px;
    background:linear-gradient(180deg,#061525,#061321);
  }

  .message-box {
    background:linear-gradient(180deg,#061c2c,#04202b);
    padding:16px;
    border-radius:12px;
    margin-top:16px;
    border:1px solid rgba(12,90,140,0.12);
    font-size:14px;
    line-height:1.55;
    color:#cfeeff;
  }

  .cta {
    display:inline-block;
    padding:13px 22px;
    border-radius:999px;
    text-decoration:none;
    font-size:15px;
    font-weight:800;
    color:#021124;
    background:linear-gradient(90deg,#00b2ff,#007aff);
    box-shadow:0 10px 22px rgba(0,110,255,0.25);
    margin-top:18px;
  }

  .footer {
    text-align:center;
    padding:14px 18px;
    font-size:12px;
    color:#7fb3d7;
    background:#04121f;
  }
</style>
</head>

<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3fa;padding:24px 0;">
  <tr>
    <td align="center">

      <!-- CARD -->
      <table class="card" role="presentation" cellpadding="0" cellspacing="0">

        <!-- HEADER -->
        <tr>
          <td class="header">
            <img src="__LOGO__" class="logo" alt="HackRoot">
            <div style="padding-left:14px; flex:1;">
              <div style="font-size:18px;font-weight:800;color:#eaf7ff;">HackRoot</div>
              <div style="font-size:12px;color:#9fc7e0;margin-top:4px;">Community · Request confirmed</div>
            </div>
            <div style="color:#7db4d7;font-size:12px;">__YEAR__</div>
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td>
            <img src="__HERO__" class="hero-img hero" alt="HackRoot Hero">
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td class="body">

            <div style="font-size:22px;font-weight:800;color:#f2fbff;margin-bottom:10px;">
              Hi __NAME__,
            </div>

            <div style="font-size:15px;color:#cfeaff;line-height:1.65;margin-bottom:18px;">
              Thanks for reaching out! We’ve received your message — our team will review it and contact you within 
              <strong style="color:white;">24–48 hours.</strong>
            </div>

            <!-- MESSAGE CARD -->
            <div class="message-box">
              <strong style="color:#eafaff;font-size:15px;">Your message:</strong>
              <div style="margin-top:6px;">__MESSAGE__</div>

              __PHONE_BLOCK__
              __GITHUB_BLOCK__
            </div>

            <!-- CTA -->
            <a class="cta" href="mailto:__RECIPIENT__?subject=Re%3A%20HackRoot" target="_blank">
              ✉️ Reply for Faster Support
            </a>

            <div style="font-size:13px;color:#98bed6;margin-top:16px;">
              Tip: replying directly to this email ensures faster communication.
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td class="footer">
            © __YEAR__ HackRoot · All rights reserved.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>
"""


# Plain text fallback
TEXT_BODY_TEMPLATE = """Hi {NAME},

Thanks for contacting HackRoot. We've received your message and will review it within 24-48 hours.

Your message:
{MESSAGE}

Phone: {PHONE}

Reply to: {RECIPIENT}

— HackRoot Team
"""

# -------------------------
# Landing page (simple responsive)
# -------------------------
@app.route("/", methods=["GET"])
def home():
    return render_template_string("""
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Join HackRoot</title>
        <style>
          :root{--bg:#071026;--card:#071426;--accent:#00a8ff;--muted:#94a7ba}
          body{font-family:Inter,Arial,Helvetica,sans-serif;background:linear-gradient(180deg,var(--bg),#05112a);margin:0;color:#e6eef6}
          .card{max-width:760px;margin:36px auto;background:var(--card);border-radius:12px;padding:28px;box-shadow:0 18px 50px rgba(2,8,23,0.6)}
          input,textarea{width:100%;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#e6eef6;margin-bottom:12px}
          input::placeholder, textarea::placeholder{color:#7f8b98}
          button{background:var(--accent);border:none;padding:12px 18px;border-radius:10px;color:#021124;font-weight:800;cursor:pointer}
          @media (max-width:520px){body{padding:12px}.card{padding:18px}}
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="margin:0 0 8px">Join / Contact HackRoot</h2>
          <p style="color:var(--muted);margin:0 0 18px">Share a short note and your profile — we'll review it soon.</p>
          <form id="joinForm" action="/submit" method="post">
            <input name="name" placeholder="Your name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="phone" type="tel" placeholder="Mobile (10 digits)" />
            <input name="github" placeholder="GitHub / LinkedIn (optional)" />
            <textarea name="message" rows="5" placeholder="Message"></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      </body>
    </html>
    """)

# -------------------------
# Submit route
# -------------------------
@app.route("/submit", methods=["POST"])
def submit():
    logger.debug("Incoming /submit from %s", request.remote_addr)
    try:
        received = {k: request.form.get(k) for k in request.form.keys()}
        logger.debug("Form data: %s", json.dumps(received, ensure_ascii=False))
    except Exception:
        received = {}
        logger.exception("Failed to read request.form")

    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    phone = request.form.get("phone", "").strip()
    github = request.form.get("github", "").strip()
    message = request.form.get("message", "").strip()

    # Basic validation
    if not name:
        return {"error": "Missing required field: name"}, 400
    if not email:
        return {"error": "Missing required field: email"}, 400

    # Normalize phone: keep only digits
    phone_digits = re.sub(r"\D", "", phone or "")
    display_phone = "Not provided"
    if phone and not phone_digits:
        return {"error": "Phone provided but contains no digits"}, 400

    if phone_digits:
        # support +91 and 0 prefixes
        if len(phone_digits) == 12 and phone_digits.startswith("91"):
            phone_digits = phone_digits[-10:]
        elif len(phone_digits) == 11 and phone_digits.startswith("0"):
            phone_digits = phone_digits[-10:]

        if len(phone_digits) != 10:
            return {"error": "Phone number must be 10 digits (India) when provided", "received": phone_digits}, 400

        display_phone = "+91" + phone_digits

    # Notify admin (best-effort)
    admin_body = f"""New Join Request:

Name: {name}
Email: {email}
Phone: {display_phone}
GitHub/LinkedIn: {github or 'Not provided'}

Message:
{message}
"""
    if RECIPIENT:
        try:
            send_email_simple(RECIPIENT, f"[HackRoot] New request from {name}", admin_body)
        except Exception as e:
            logger.exception("Admin notification failed: %s", e)

    # Prepare confirmation email
    display_name = " ".join(p.capitalize() for p in name.split())
    safe_name = html_lib.escape(display_name)
    safe_message_html = html_lib.escape(message).replace("\n", "<br>")
    safe_message_text = message

    phone_block = ""
    if display_phone != "Not provided":
        phone_block = f"""
        <div style="margin-top:12px;font-size:13px;color:#9ec8e6">
          <strong>Phone</strong>: {html_lib.escape(display_phone)}
        </div>
        """

    github_block = ""
    if github:
        safe_github = html_lib.escape(github)
        github_block = f'''
        <div style="margin-top:12px;font-size:13px;color:#53627a;">
          <strong>Profile</strong>: <a href="{safe_github}" style="color:#007bff;text-decoration:none">{safe_github}</a>
        </div>
        '''

    year_now = datetime.datetime.now().year
    html_body = (PREMIUM_HTML_TEMPLATE
                 .replace("__NAME__", safe_name)
                 .replace("__MESSAGE__", safe_message_html)
                 .replace("__PHONE_BLOCK__", phone_block)
                 .replace("__RECIPIENT__", RECIPIENT or "")
                 .replace("__LOGO__", CDN_LOGO)
                 .replace("__HERO__", CDN_HERO)
                 .replace("__YEAR__", str(year_now))
                 .replace("__GITHUB_BLOCK__", github_block))

    text_body = TEXT_BODY_TEMPLATE.format(
        NAME=display_name,
        MESSAGE=safe_message_text,
        PHONE=display_phone,
        RECIPIENT=RECIPIENT or ""
    )

    try:
        send_html_email(email, "Thanks for contacting HackRoot!", text_body, html_body, reply_to=RECIPIENT or SMTP_USER)
    except Exception as e:
        logger.exception("Failed sending confirmation: %s", e)
        return {"error": "Failed to send confirmation", "detail": str(e)}, 500

    # Success: return JSON for AJAX clients; form POSTs will also receive this
    return {"status": "ok", "received": received}, 200

# -------------------------
# Run
# -------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
