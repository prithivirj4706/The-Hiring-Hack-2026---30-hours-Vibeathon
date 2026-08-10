"""Minimal SMTP email sender for account verification codes.

If SMTP_HOST isn't configured, falls back to printing the code to the backend
console instead of failing registration outright — lets the app run locally
without needing real mail credentials, while still working for real once
SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD are set in .env.
"""

import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def send_verification_email(to_email: str, name: str, code: str) -> None:
    subject = "Verify your CareerPulse AI account"
    body = (
        f"Hi {name},\n\n"
        f"Your verification code is: {code}\n\n"
        f"This code expires in {settings.verification_code_expire_minutes} minutes.\n"
        f"If you didn't request this, you can ignore this email.\n"
    )

    if not settings.smtp_host:
        print(f"[DEV MODE — no SMTP configured] Verification code for {to_email}: {code}")
        return

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email
    message["To"] = to_email

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to_email], message.as_string())
