from django.db.models.signals import Signal
from django.dispatch import receiver

# Señal para registrar eventos de acción
action_signal = Signal()

# Señal para registrar errores
error_signal = Signal()

@receiver(action_signal)
def log_action(sender, **kwargs):
    # Registra automáticamente las acciones
    action_name = kwargs.get('action_name', 'Acción no especificada')
    print(f'Acción registrada: {action_name}')

@receiver(error_signal)
def log_error(sender, **kwargs):
    # Registra automáticamente los errores
    error_message = kwargs.get('error_message', 'Error no especificado')
    print(f'Error registrado: {error_message}')