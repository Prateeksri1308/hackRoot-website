# app.py — HackRoot (Premium Light Email + robust SMTP)
# Requires: Flask, python-dotenv
import os
import datetime
import html as html_lib
import socket
import traceback
from pathlib import Path
from flask import Flask, request, render_template_string
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.message import EmailMessage
from dotenv import load_dotenv

# -------------------------
# Config
# -------------------------
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-this-secret")

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT") or 0)
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
RECIPIENT = os.environ.get("RECIPIENT_EMAIL")

# Debug & timeouts for SMTP (change while debugging)
SMTP_TIMEOUT = int(os.environ.get("SMTP_TIMEOUT", "20"))  # seconds
SMTP_DEBUG = os.environ.get("SMTP_DEBUG", "false").lower() in ("1", "true", "yes")

# -------------------------
# CDN IMAGE URLs (change to your hosted links)
# Upload the hero_680x280.png to your CDN and set that URL here.
# -------------------------
CDN_LOGO = "https://i.ibb.co/h1Yw8M26/hackRootlogo.png"
CDN_HERO = "https://i.ibb.co/mVSNffQR/robot.png"  # replace with your hero_680x280.png CDN URL

# -------------------------
# Simple landing form
# -------------------------
@app.route("/")
def home():
    return render_template_string("""
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Join HackRoot</title>
        <style>
          body{font-family:Inter,Arial,Helvetica,sans-serif;background:#0b1020;margin:0;padding:32px;color:#e6eef6}
          .card{max-width:760px;margin:0 auto;background:#071426;border-radius:12px;padding:28px;box-shadow:0 18px 50px rgba(2,8,23,0.6)}
          input,textarea{width:100%;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#e6eef6;margin-bottom:12px}
          input::placeholder, textarea::placeholder{color:#7f8b98}
          button{background:#00a8ff;border:none;padding:12px 18px;border-radius:10px;color:#021124;font-weight:800;cursor:pointer}
          a{color:#00a8ff}
          .muted{color:#94a7ba;font-size:13px}
          @media (max-width:520px){body{padding:12px}.card{padding:18px}}
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="margin:0 0 8px">Join / Contact HackRoot</h2>
          <p class="muted" style="margin:0 0 18px">Share a short note and your profile — we'll review it soon.</p>
          <form id="joinForm" action="/submit" method="post">
            <input name="name" placeholder="Your name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="github" placeholder="GitHub / LinkedIn (optional — full URL)" />
            <textarea name="message" rows="5" placeholder="How you'd like to help / quick intro"></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      </body>
    </html>
    """)

# -------------------------
# SMTP helpers (robust)
# -------------------------
def _connect_smtp(host, port, use_ssl):
    """Return a connected SMTP object (not logged in)."""
    if use_ssl:
        server = smtplib.SMTP_SSL(host, port, timeout=SMTP_TIMEOUT)
        if SMTP_DEBUG:
            server.set_debuglevel(1)
    else:
        server = smtplib.SMTP(host, port, timeout=SMTP_TIMEOUT)
        if SMTP_DEBUG:
            server.set_debuglevel(1)
    return server

def send_email_simple(to_email: str, subject: str, body: str):
    """Send plain text email. Handles SSL (port 465) or STARTTLS (other ports)."""
    msg = EmailMessage()
    msg["From"] = f"HackRoot <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    use_ssl = (SMTP_PORT == 465)
    try:
        server = _connect_smtp(SMTP_HOST, SMTP_PORT, use_ssl)
        if not use_ssl:
            server.ehlo()
            # Only call starttls if server supports it
            if server.has_extn("STARTTLS"):
                server.starttls()
                server.ehlo()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
    except (smtplib.SMTPException, socket.timeout, ConnectionRefusedError) as e:
        # during dev print trace; in prod you should log to a file/monitoring
        print("SMTP (simple) failed:", repr(e))
        traceback.print_exc()
        raise

def send_html_email(to_email: str, subject: str, text_body: str, html_body: str, reply_to: str = None):
    """
    Send multipart HTML email. Optionally set Reply-To so replies go to admin (RECIPIENT).
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
    try:
        server = _connect_smtp(SMTP_HOST, SMTP_PORT, use_ssl)
        if not use_ssl:
            server.ehlo()
            if server.has_extn("STARTTLS"):
                server.starttls()
                server.ehlo()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
    except (smtplib.SMTPException, socket.timeout, ConnectionRefusedError) as e:
        print("SMTP (html) failed:", repr(e))
        traceback.print_exc()
        raise

# -------------------------
# Premium Light HTML template (safe placeholders)
# -------------------------
PREMIUM_HTML_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HackRoot — We received your message</title>
<style>
  @media only screen and (max-width:520px) {
    .container{width:100% !important;padding:12px !important}
    .hero{width:100% !important;height:auto !important}
    .cta{display:block !important;width:100% !important;text-align:center !important}
  }
</style>
</head>

<body style="margin:0;padding:0;background:#f3f6fb;font-family:Inter,Arial,Helvetica,sans-serif;color:#dbeffd">

  <!-- preheader -->
  <div style="display:none;max-height:0px;overflow:hidden;mso-hide:all;">
    Thanks for contacting HackRoot — we got your message and will follow up soon.
  </div>

  <!-- LIGHT BACKGROUND OUTER WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f6fb;width:100%;min-width:320px;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- DARK CARD START -->
        <table class="container" width="680" cellpadding="0" cellspacing="0" role="presentation"
               style="width:680px;max-width:680px;border-radius:16px;overflow:hidden;
                      background:linear-gradient(180deg,#061226 0%, #071026 100%);
                      box-shadow:0 30px 80px rgba(1,6,14,0.65);
                      border:1px solid rgba(130,200,255,0.05)">

          <!-- header -->
          <tr>
            <td style="padding:18px 20px;background:linear-gradient(90deg,#031826,#08243a);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="__LOGO__" width="56" height="56" alt="HackRoot"
                         style="display:block;border-radius:10px;
                                box-shadow:0 6px 20px rgba(0,160,255,0.08)">
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-weight:800;font-size:16px;color:#dff6ff">HackRoot</div>
                    <div style="font-size:12px;color:#9ec8e6;margin-top:3px">
                      Community · Request received
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="font-size:12px;color:#6fb2d9">__YEAR__</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- hero -->
          <tr>
            <td style="padding:0;background:linear-gradient(180deg,#071026,#061224);">
              <img class="hero" src="__HERO__" alt="HackRoot hero" width="680"
                   style="display:block;width:100%;height:auto;object-fit:cover;">
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding:22px 28px 28px;background:linear-gradient(180deg,#061224,#061225);color:#dff6ff;">
              <div style="font-size:20px;font-weight:800;color:#ecf9ff;margin-bottom:8px">
                Hi __NAME__,
              </div>

              <div style="font-size:14px;color:#cfeeff;line-height:1.6;margin-bottom:14px">
                Thanks for reaching out. We’ve received your message — one of our team members
                will review it and get back within <strong style="color:#ffffff">24–48 hours</strong>.
              </div>

              <!-- trust badge -->
              <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px">
                <div style="background:rgba(0,168,255,0.08);color:#00b2ff;
                            padding:6px 10px;border-radius:999px;font-weight:800;font-size:12px;
                            border:1px solid rgba(0,168,255,0.08)">
                  Trusted community
                </div>
                <div style="color:#9ec8e6;font-size:13px">1,200+ innovators · fast review lane</div>
              </div>

              <!-- message card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(180deg,#061a28,#04202b);
                             border:1px solid rgba(12,90,140,0.12);
                             padding:14px;border-radius:10px;color:#cfeeff;font-size:14px">
                    <strong style="display:block;margin-bottom:8px;color:#e8fbff">Your message</strong>
                    <div style="white-space:pre-wrap;color:#cfeeff">__MESSAGE__</div>
                  </td>
                </tr>
              </table>

              <!-- primary CTA -->
              <div style="margin-top:16px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:999px;background:linear-gradient(90deg,#00b2ff,#0066ff);
                               box-shadow:0 12px 30px rgba(0,110,255,0.18)">
                      <a class="cta" href="mailto:__RECIPIENT__?subject=Re%3A%20HackRoot"
                         target="_blank"
                         style="display:inline-block;padding:12px 20px;border-radius:999px;
                                color:#021124;font-weight:900;text-decoration:none;font-size:15px;">
                        ✉️ Reply & get faster support
                      </a>
                    </td>
                    <td style="width:12px"></td>
                    <td style="vertical-align:middle">
                      <a href="#" style="font-size:13px;color:#9ec8e6;text-decoration:underline">
                        Help & FAQs
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="font-size:13px;color:#8fb6c8;margin-top:12px">
                Tip: reply to this email for a faster response.
              </div>

              __GITHUB_BLOCK__

              <!-- signature -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.02);padding-top:12px">
                    <div style="font-weight:700;color:#dff6ff">— HackRoot Team</div>
                    <div style="font-size:13px;color:#8fb6c8;margin-top:6px">
                      Innovators Community · 
                      <a href="mailto:__RECIPIENT__"
                         style="color:#9ec8e6;text-decoration:none">__RECIPIENT__</a>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding:12px 20px;background:#041223;text-align:center;
                       color:#6aa2c9;font-size:12px">
              © __YEAR__ HackRoot. All rights reserved.
            </td>
          </tr>

        </table>
        <!-- DARK CARD END -->

      </td>
    </tr>
  </table>
</body>
</html>
"""


# -------------------------
# Plain text fallback (for email clients and deliverability)
# -------------------------
TEXT_BODY_TEMPLATE = """Hi {NAME},

Thanks for contacting HackRoot. We've received your message and will review it within 24-48 hours.

Your message:
{MESSAGE}

Reply to: {RECIPIENT}

— HackRoot Team
"""

# -------------------------
# Submit route
# -------------------------
@app.route("/submit", methods=["POST"])
def submit():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    github = request.form.get("github", "").strip()
    message = request.form.get("message", "").strip()

    if not name or not email:
        return {"error": "Missing fields"}, 400

    # Admin notification (plain text)
    admin_body = f"""New Join Request:

Name: {name}
Email: {email}
GitHub/LinkedIn: {github}

Message:
{message}
"""
    if RECIPIENT:
        try:
            send_email_simple(RECIPIENT, f"[HackRoot] New request from {name}", admin_body)
        except Exception as e:
            # If admin notify fails, continue — the user should still get their confirmation.
            print("Admin notification failed:", e)

    # Safe escaping for HTML injection and for email rendering
    display_name = " ".join(p.capitalize() for p in name.split())
    safe_name = html_lib.escape(display_name)
    safe_message_html = html_lib.escape(message).replace("\n", "<br>")
    safe_message_text = message

    # Optional GitHub/LinkedIn block
    if github:
        safe_github = html_lib.escape(github)
        github_block = f'''
        <div style="margin-top:12px;font-size:13px;color:#53627a;">
          <strong>Profile</strong>: <a href="{safe_github}" style="color:#007bff;text-decoration:none">{safe_github}</a>
        </div>
        '''
    else:
        github_block = ""

    year_now = datetime.datetime.now().year

    # Assemble HTML safely using replace (avoids conflict with CSS {} in template)
    html_body = (PREMIUM_HTML_TEMPLATE
                 .replace("__NAME__", safe_name)
                 .replace("__MESSAGE__", safe_message_html)
                 .replace("__RECIPIENT__", RECIPIENT or "")
                 .replace("__LOGO__", CDN_LOGO)
                 .replace("__HERO__", CDN_HERO)
                 .replace("__YEAR__", str(year_now))
                 .replace("__GITHUB_BLOCK__", github_block))

    text_body = TEXT_BODY_TEMPLATE.format(
        NAME=display_name,
        MESSAGE=safe_message_text,
        RECIPIENT=RECIPIENT or ""
    )

    try:
        # send confirmation to the user, set Reply-To so replies go to admin RECIPIENT
        send_html_email(email, "Thanks for contacting HackRoot!", text_body, html_body, reply_to=RECIPIENT or SMTP_USER)
    except Exception as e:
        # return error for debugging (in production you may log instead)
        print("Failed sending confirmation:", e)
        return {"error": "Failed to send email", "detail": str(e)}, 500

    return {"status": "ok"}, 200

# -------------------------
# Run
# -------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
