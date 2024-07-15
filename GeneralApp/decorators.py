# decorators.py
import time
from functools import wraps
from django.utils.deprecation import MiddlewareMixin
from GeneralApp.signals import action_signal, error_signal
from GeneralApp.models import Request

def log_error(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            # Ejecutar la vista y manejar posibles errores
            return view_func(request, *args, **kwargs)
        except Exception as e:
            # Emitir la señal de error
            error_signal.send(sender=None, error_message=f'{request.method} - {str(e)}')
            # Re-raise the exception to maintain normal error handling
            raise
    return wrapper

class SaveRequest:
    def __init__(self, get_response):
        self.get_response = get_response

        # Filter to log all request to url's that start with any of the strings below.
        # With example below:
        # /example/test/ will be logged.
        # /other/ will not be logged.
        self.prefixs = [
            '/logout',
            '/login',
            '/api',
            '/admin/django_db_logger',
            '/admin/GeneralApp',
            '/admin/OperationsApp',
            '/admin/SalesApp',
            '/admin/auth',
        ]

    def __call__(self, request):
        _t = time.time() # Calculated execution time.
        response = self.get_response(request) # Get response from view function.
        _t = int((time.time() - _t)*1000)    

        # If the url does not start with on of the prefixes above, then return response and dont save log.
        # (Remove these two lines below to log everything)
        if not list(filter(request.get_full_path().startswith, self.prefixs)): 
            return response 
        if "/requests/" in request.get_full_path():
            return response
        if "/api/general/profile/" in request.get_full_path():
            return response
        # Create instance of our model and assign values
        request_log = Request(
            endpoint=request.get_full_path(),
            response_code=response.status_code,
            method=request.method,
            remote_address=self.get_client_ip(request),
            exec_time=_t,
        )

        # Assign user to log if it's not an anonymous user
        if not request.user.is_anonymous:
            request_log.user = request.user

        # Save log in db
        request_log.save() 
        return response

    # get clients ip address
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            _ip = x_forwarded_for.split(',')[0]
        else:
            _ip = request.META.get('REMOTE_ADDR')
        return _ip
