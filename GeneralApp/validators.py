import re
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone

class FormatPasswordValidator():
    def __init__(self, min_length=14):
        self.min_length = min_length
    def validate(self, password, user=None):
        if not re.search(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{14,}$', password):
            raise ValidationError(
                "La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?\":{}|<>)"
            )
    
    def get_help_text(self):
        return ""
    
class ExpirationPasswordValidator():
    def __init__(self, min_length=14):
        self.min_length = min_length
    def validate(self, password, user=None):
        # Ajusta la duración de la expiración según tus necesidades
        expiration_duration = timedelta(days=30)

        if user and (user.date_joined or user.password_changed_at):
            last_change_time = user.password_changed_at or user.date_joined
            expiration_time = last_change_time + expiration_duration

            if timezone.now() > expiration_time:
                raise ValidationError(
                    "La contraseña ha expirado. Por favor, actualiza tu contraseña."
                )
    
    def get_help_text(self):
        return ""