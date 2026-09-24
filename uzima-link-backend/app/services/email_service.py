import os

from brevo import Brevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)
from dotenv import load_dotenv

load_dotenv()

client = Brevo(api_key=os.getenv("BREVO_API_KEY"))

SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Uzima Link")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _base_template(
    title: str,
    body_html: str,
    button_text: str = None,
    button_url: str = None,
    footer_note: str = None,
    accent_color: str = "#059669",
) -> str:
    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <tr>
          <td style="padding: 28px 0 8px 0;" align="center">
            <a href="{button_url}" 
               style="background:{accent_color};color:#ffffff;padding:14px 32px;
                      border-radius:10px;text-decoration:none;font-weight:600;
                      font-size:15px;display:inline-block;letter-spacing:0.3px;">
              {button_text}
            </a>
          </td>
        </tr>
        """

    footer = footer_note or "Uzima Link your health record, wherever care finds you."

    return f"""
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#059669 0%,#0f766e 100%);padding:28px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                            Uzima Link
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h1 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px 0;line-height:1.3;">
                      {title}
                    </h1>
                    <div style="color:#475569;font-size:15px;line-height:1.7;">
                      {body_html}
                    </div>
                    {button_html}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5;">
                      {footer}
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


def _send(to_email: str, to_name: str, subject: str, html_content: str):
    try:
        # Use proper Brevo SDK type classes to avoid payload drops or serialization mismatches
        client.transactional_emails.send_transac_email(
            sender=SendTransacEmailRequestSender(name=SENDER_NAME, email=SENDER_EMAIL),
            to=[SendTransacEmailRequestToItem(email=to_email, name=to_name or "there")],
            subject=subject,
            html_content=html_content,
        )
    except Exception as e:
        print(f"CRITICAL: Failed to send email to {to_email}: {e}")
        raise e


# ====================== EMAILS ======================


def send_verification_email(to_email: str, to_name: str, verification_token: str):
    verify_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    html = _base_template(
        title="Verify your email address",
        body_html=f"""
          Hi <strong>{to_name.split()[0]}</strong>,<br><br>
          Thanks for creating your Uzima Link account. Please confirm your email address so we can activate it.
          <br><br>
          This link will expire in <strong>24 hours</strong>.
        """,
        button_text="Verify Email Address",
        button_url=verify_link,
        footer_note="If you didn't create an account, you can safely ignore this email.",
    )
    _send(to_email, to_name, "Verify your Uzima Link email", html)


def send_login_otp_email(to_email: str, to_name: str, code: str):
    html = _base_template(
        title="Your login code",
        body_html=f"""
          Hi <strong>{(to_name or "there").split()[0]}</strong>,<br><br>
          Use the code below to log in to your Uzima Link account:
          <br><br>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;text-align:center;margin:20px 0;">
            <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#059669;">{code}</span>
          </div>
          This code expires in <strong>10 minutes</strong>.
          <br><br>
          If you didn't request this, please ignore this email.
        """,
        footer_note="For your security, never share this code with anyone.",
    )
    _send(to_email, to_name, f"Your Uzima Link login code: {code}", html)


def send_password_reset_email(to_email: str, reset_token: str, to_name: str = None):
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    html = _base_template(
        title="Reset your password",
        body_html=f"""
          Hi <strong>{(to_name or "there").split()[0]}</strong>,<br><br>
          We received a request to reset the password for your Uzima Link account.
          <br><br>
          Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.
        """,
        button_text="Reset Password",
        button_url=reset_link,
        footer_note="If you didn't request a password reset, you can safely ignore this email.",
    )
    _send(to_email, to_name or "there", "Reset your Uzima Link password", html)


def send_password_changed_email(to_email: str, to_name: str = ""):
    html = _base_template(
        title="Your password was changed",
        body_html=f"""
          Hi <strong>{(to_name or "there").split()[0]}</strong>,<br><br>
          This is a confirmation that the password for your Uzima Link account was just changed.
          <br><br>
          If you made this change, no further action is needed.
          <br><br>
          <strong>If you did not change your password</strong>, please contact support immediately.
        """,
        footer_note="Uzima Link Security Team",
    )
    _send(to_email, to_name, "Your Uzima Link password was changed", html)


def send_welcome_email(to_email: str, to_name: str, role: str):
    role_label = {
        "patient": "patient",
        "doctor": "doctor",
        "kiosk_operator": "kiosk operator",
    }.get(role, role)

    html = _base_template(
        title=f"Welcome to Uzima Link, {to_name.split()[0]}!",
        body_html=f"""
          Your account has been successfully created as a <strong>{role_label}</strong>.
          <br><br>
          You can now access your health records, manage appointments, and stay connected with your care providers — all in one place.
        """,
        button_text="Go to Dashboard",
        button_url=f"{FRONTEND_URL}/login",
        footer_note="We're glad to have you on board.",
    )
    _send(to_email, to_name, "Welcome to Uzima Link", html)


def send_staff_invite_email(
    to_email: str, to_name: str, role: str, facility_name: str, invite_code: str
):
    role_label = {"doctor": "doctor", "kiosk_operator": "frontdesk operator"}.get(
        role, role
    )
    register_link = f"{FRONTEND_URL}/register/{role}?invite_code={invite_code}"
    html = _base_template(
        title="You've been invited to Uzima Link",
        body_html=f"""
          Hi <strong>{to_name.split()[0]}</strong>,<br><br>
          You've been invited to join <strong>{facility_name}</strong> on Uzima Link as a <strong>{role_label}</strong>.
          <br><br>
          Your facility invite code:
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;text-align:center;margin:20px 0;">
            <span style="font-size:24px;font-weight:700;letter-spacing:2px;color:#059669;">{invite_code}</span>
          </div>
          Use this code when you register your account.
        """,
        button_text="Register Now",
        button_url=register_link,
    )
    _send(
        to_email, to_name, f"You've been invited to Uzima Link ({facility_name})", html
    )


def send_admin_kyc_notification(admin_email: str, subject_name: str, role: str):
    html = _base_template(
        title="New identity verification pending",
        body_html=f"""
          <strong>{subject_name}</strong> ({role}) has submitted identity verification and is waiting for review.
        """,
        button_text="Review Pending KYC",
        button_url=f"{FRONTEND_URL}/admin/kyc",
    )
    _send(admin_email, "Admin", "New KYC submission pending review", html)


def send_doctor_approval_email(
    to_email: str, to_name: str, facility_name: str, invite_code: str
):
    login_link = f"{FRONTEND_URL}/login/staff"
    html = _base_template(
        title="You're approved!",
        body_html=f"""
          Hi <strong>{to_name.split()[0]}</strong>,<br><br>
          Your identity has been verified and your account at <strong>{facility_name}</strong> is now active.
          <br><br>
          As the verified lead doctor, you can share your facility's unique invite code with your authorized frontdesk / kiosk operators so they can securely join your facility:
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;text-align:center;margin:20px 0;">
            <span style="font-size:24px;font-weight:700;letter-spacing:2px;color:#059669;">{invite_code}</span>
          </div>
          Keep this code secure. Authorized staff will require it during registration.
        """,
        button_text="Log In to Staff Portal",
        button_url=login_link,
        footer_note="Uzima Link Security Team — Protecting patient data at all costs.",
    )
    _send(
        to_email,
        to_name,
        "Your Uzima Link doctor account is approved & facility code generated",
        html,
    )


def send_patient_kyc_approved_email(to_email: str, to_name: str):
    html = _base_template(
        title="You're verified!",
        body_html=f"""
          Hi <strong>{(to_name or "there").split()[0]}</strong>,<br><br>
          Your identity has been verified and your Uzima Link account is now fully active.
          <br><br>
          You can now log in and start using your health record.
        """,
        button_text="Log In",
        button_url=f"{FRONTEND_URL}/login",
    )
    _send(to_email, to_name or "there", "Your Uzima Link account is verified", html)
