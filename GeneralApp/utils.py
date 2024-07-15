import random
import string
from rest_framework.exceptions  import APIException
from django.utils.encoding      import force_text
from django.urls                import reverse
from django.http                import HttpResponse
from django.views.generic       import View
from django.utils.encoding      import force_text
from rest_framework             import status
from rest_framework.response    import Response
from django.core.mail           import send_mail
from django.conf                import settings
from operacionesVP              import serverconfig

def generate_otp(length=6):
    characters = string.digits
    otp = ''.join(random.choice(characters) for _ in range(length))
    return otp

def send_otp_email(email, username, code, request):
    from GeneralApp.views           import EmailsViewSet
    context={}
    email_recipients = []
    context={
        'username'  : username,
        'code'      : code,
        'host'      : request.get_host(),
        'environment':getattr(serverconfig,"environment","http"),
    }
    email_recipients = [email]
    email_set            = EmailsViewSet.prepare_html_email_from_template("emails/verification-2FA/template.html",
        context,
        email_recipients,
        EmailsViewSet.CODE_2FA_VERIFICATION_EMAIL_SUBJECT_STRING)
    email_set.send()
    return email_set

class CustomValidation(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error ocurred'

    def __init__(self, detail, field, status_code):
        if status_code is not None:
            self.status_code = status_code
            if detail is not None:
                self.detail = {field: force_text(detail)}
            else:
                self.detail = {'detail': force_text(self.default_detail)}