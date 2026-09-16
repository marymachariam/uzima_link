import africastalking

from config import settings

africastalking.initialize(settings.AFRICASTALKING_USERNAME, settings.AFRICASTALKING_API_KEY)
sms = africastalking.SMS


def send_otp_sms(phone_number: str, otp_code: str):
    message = f"Your Uzima Link verification code is {otp_code}. It expires in 10 minutes."
    sms.send(message, [phone_number])