import re
from django.contrib.auth                import login, logout, get_user_model
from django.contrib.auth.backends       import ModelBackend
from django.utils.decorators			import method_decorator
from django.views.decorators.csrf		import ensure_csrf_cookie, csrf_exempt
from GeneralApp.models                  import PasswordHistory
from django.core.exceptions             import PermissionDenied

def valid_property(request,property):
    from GeneralApp.models import UserExtension
    user_extension = UserExtension.objects.filter(user=request.user).first()
    if not user_extension.properties.filter(id=property.id).exists():
        raise PermissionDenied()

def valid_password(password):
    #pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{14,}$'
    #return bool(re.match(pattern, password))
    errors = []
    if len(password) < 14:
        errors.append("La contraseña debe tener al menos 14 caracteres.")

    # Verificar al menos un carácter en mayúscula
    if not re.search(r'[A-Z]', password):
        errors.append("La contraseña debe contener al menos un carácter en mayúscula.")

    # Verificar al menos un carácter en minúscula
    if not re.search(r'[a-z]', password):
        errors.append("La contraseña debe contener al menos un carácter en minúscula.")

    # Verificar al menos un número
    if not re.search(r'\d', password):
        errors.append("La contraseña debe contener al menos un número.")

    # Verificar al menos dos caracteres especiales
    if not re.search(r'(.*[!@#$¢÷=%^&*()_+].*){2}', password):
        errors.append("La contraseña debe contener al menos dos caracteres especiales (!@#$¢÷=%^&*()_+).")
    i = 1
    error_format = ""
    for error in errors:
        error_format += "{}.- {}\n".format(i,error)
    return len(errors)==0, error_format
    

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwars):
        UserModel = get_user_model()
        try:
            user = UserModel.objects.get(username=username)
        except UserModel.DoesNotExist:
            return None
        else:
            if user.check_password(password):
                return user
        return None
    
    def reset_password_token(self, request, token, password, password_repeat, **kwars):
        if password != password_repeat:
            return False, "La contraseña no coincide"
        validpassword, error_format = valid_password(password)
        if not validpassword:
            return validpassword, error_format
        user = token.user_extension.user
        if user.check_password(password):
            return False, "Esa contraseña es la ultima utilizada"
        user.set_password(password)
        password_history = PasswordHistory.objects.filter(user=user,password=user.password).order_by('-created_at')[:5]
        if len(password_history)>0:
            return False, "No puede usar las ultimas 5 contraseñas"
        user.save()
        return True, "Tu contraseña fue modificada exitosamente."
    
    def reset_temporal_password(self, request, user, password, password_repeat, **kwars):
        if password != password_repeat:
            return False, "La contraseña no coincide"
        validpassword, error_format = valid_password(password)
        if not validpassword:
            return validpassword, error_format
        if user.check_password(password):
            return False, "Esa contraseña es la ultima utilizada"
        user.set_password(password)
        password_history = PasswordHistory.objects.filter(user=user,password=user.password).order_by('-created_at')[:5]
        if len(password_history)>0:
            return False, "No puede usar las ultimas 5 contraseñas"
        user.save()
        return True, "Tu contraseña fue modificada exitosamente."

class ProgressDisplayer():
    def __init__(self):
        self.lenght = 0

    def display_progress(self, text):
        # trailing_spaces = self.lenght - len(text)
        # if trailing_spaces > 0:
        #     text_to_display = text + (' ' * trailing_spaces)
        # else:
        #     text_to_display = text

        print('\r'+text, end='')

    def add_indicator(self, character):
        pass
