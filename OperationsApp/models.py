from django.db                          import models
from GeneralApp.models                  import Property, Service, OperationType, Unit, SaleType, UserExtension, DepartmentCECOS, Hotel, TRANSFER_TYPE_CHOICES
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from GeneralApp.utils                   import CustomValidation
from GeneralApp.querysets               import CustomQuerySet
from OperationsApp.querysets            import FlightQuerySet, PickUpTimeQuerySet, ReservationQuerySet, ReservationServiceQuerySet, ReservationCreateTokenQueryset, ReservationLogQuerySet
from rest_framework                     import status
import uuid

def log(action, user, reference, reference_data):
    import json
    from GeneralApp.serializers import UserExtensionSerializer
    from django.contrib.contenttypes.models import ContentType
    try:
        log, created = models.LogData.objects.get_or_create(
            reference_content_type=ContentType.objects.get_for_model(reference),
            reference_object_id = reference.id
        )
        data = []
        if created is False:
            data = json.loads(log.data)
        data.append({
            'timestamp':str(datetime.today()),
            'user': UserExtensionSerializer(user.extension).data,
            'action': action,
            'data': reference_data
        })
        log.data = json.dumps(data)
        log.save()
    except Exception as e:
        print(e)


NORMAL = 'NORMAL'
CONF = 'CONF'
CANCEL = 'CANCEL'
STATUS_CHOICES = (
    (NORMAL, "NORMAL"),
    (CONF, "CONF"),
    (CANCEL, "CANCELADO"),
)
# Create your models here.
class Contact(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="contacts")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Contacto'
        verbose_name_plural = 'Contactos'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.properties.all().values_list('code'))

class PickUp(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.PROTECT, verbose_name="Hotel",related_name="pickups")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedades",related_name="pickups")
    objects = CustomQuerySet.as_manager()

    class Meta:
        unique_together = ('hotel', 'property')
        verbose_name = 'PickUp'
        verbose_name_plural = 'PickUps'

class PickUpTime(models.Model):
    pick_up = models.ForeignKey(PickUp, on_delete=models.CASCADE, verbose_name="Pick up",related_name="pickuptimes")
    flight_time = models.TimeField(verbose_name="Hora de vuelo")
    time = models.TimeField(verbose_name="Hora",null=True, blank=True)
    objects = PickUpTimeQuerySet.as_manager()

    class Meta:
        unique_together = ('pick_up', 'flight_time')
        verbose_name = 'Hora de PickUp'
        verbose_name_plural = 'Horas de PickUp'

    def __str__(self):
        return "[{}] {} {}".format(self.pick_up.hotel.name, self.flight_time, self.time)


class Flight(models.Model):
    FLIGHT_CHOICES = (
        ('departure', 'Salida'),
        ('arrival', 'Llegada'),
        ('both', 'Ambos'),
    )
    flight_type = models.CharField(max_length=9, choices=FLIGHT_CHOICES, verbose_name="Tipo de traslado", default="arrival")
    start_date = models.DateField(verbose_name="Fecha inicio")
    due_date = models.DateField(verbose_name="Fecha fin")
    code = models.CharField(max_length=10, verbose_name="Clave de vuelo")
    origin = models.CharField(max_length=100, verbose_name="Origen",null=True, blank=True)
    destination = models.CharField(max_length=100, verbose_name="Destino",null=True, blank=True)
    mon_arrival = models.TimeField(verbose_name="Lunes llegada",null=True)
    tue_arrival = models.TimeField(verbose_name="Martes llegada",null=True)
    wed_arrival = models.TimeField(verbose_name="Miércoles llegada",null=True)
    thu_arrival = models.TimeField(verbose_name="Jueves llegada",null=True)
    fri_arrival = models.TimeField(verbose_name="Viernes llegada",null=True)
    sat_arrival = models.TimeField(verbose_name="Sábado llegada",null=True)
    sun_arrival = models.TimeField(verbose_name="Domingo llegada",null=True)
    mon_departure = models.TimeField(verbose_name="Lunes salida",null=True)
    tue_departure = models.TimeField(verbose_name="Martes salida",null=True)
    wed_departure = models.TimeField(verbose_name="Miércoles salida",null=True)
    thu_departure = models.TimeField(verbose_name="Jueves salida",null=True)
    fri_departure = models.TimeField(verbose_name="Viernes salida",null=True)
    sat_departure = models.TimeField(verbose_name="Sábado salida",null=True)
    sun_departure = models.TimeField(verbose_name="Domingo salida",null=True)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedades",related_name="flights")
    objects = FlightQuerySet.as_manager()

    class Meta:
        verbose_name = 'Vuelo'
        verbose_name_plural = 'Vuelos'
    

class Reservation(models.Model):
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, blank=True, verbose_name="Estatus", default=NORMAL)
    opera_code = models.CharField(max_length=80, null=True, blank=True, verbose_name="Código Opera")
    pax = models.CharField(max_length=100, verbose_name="Pasajero",null=True, blank=True)
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT, verbose_name="Representante",related_name="reservations")
    contact = models.ForeignKey(Contact, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Contact",related_name="reservations")
    country = models.CharField(max_length=100, verbose_name="Pais")
    email = models.CharField(max_length=100, verbose_name="Correo")
    department_cecos = models.ForeignKey(DepartmentCECOS, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Departamento CECOS",related_name="reservations")
    memberships = models.CharField(max_length=20, verbose_name="Membresías", null=True, blank=True)
    address = models.TextField(verbose_name="Dirección", null=True, blank=True)
    reservation_date = models.DateField(auto_now_add=True, verbose_name="Fecha de reservación")
    sale_type = models.ForeignKey(SaleType, on_delete=models.PROTECT, verbose_name="Tipo de venta", related_name="reservations")
    amount = models.TextField(verbose_name="Comentarios carta confirmación", null=True, blank=True,)
    comments = models.TextField(verbose_name="Comentarios", null=True, blank=True,)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="reservations")
    objects = ReservationQuerySet.as_manager()

    class Meta:
        verbose_name = 'Reservación'
        verbose_name_plural = 'Reservaciónes'
        permissions = (
            ('reservations_management', 'Administracion de ventas'),
            ('access_op_filter_list', 'Reporte de operaciones'),
            ('access_op_filter_coupons', 'Acceso a Cupones de traslados'),
            ('access_filter_summary', 'Acceso a Resumen de operación'),
        )

    def clean(self):
        if self.opera_code != "" and self.opera_code is not None:
            query = Reservation.objects.filter(opera_code=self.opera_code,property=self.property)
            if self.id is not None:
                query = query.exclude(id=self.id)
            if query.exists():
                raise CustomValidation('Esta clave de opera ya fue usada, intente denuevo.', 'error', status.HTTP_400_BAD_REQUEST)

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def __str__(self):
        return "[{}] {} {}".format(self.id, self.opera_code, self.property.code)

NONE = 'none'
NO_SHOW_COST = 'no_show_cost'
NO_SHOW_NO_COST = 'no_show_no_cost'
NO_SHOW_CHOICES = (
    (NONE, "Ninguno"),
    (NO_SHOW_COST, "N/S con costo"),
    (NO_SHOW_NO_COST, "N/S sin costo"),
)

CASH = 'cash'
NO_SHOW = 'no_show'
INVOICE_CHOICES = (
    (NONE, "Ninguno"),
    (CASH, "EFECTIVO"),
    (NO_SHOW, "NO SHOW"),
)
class ReservationService(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.PROTECT, verbose_name="Reservación",related_name="reservation_services")
    date = models.DateField(verbose_name="Fecha de servicio")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, verbose_name="Servicio",related_name="reservation_services")
    origin = models.ForeignKey(Hotel, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Origen", related_name="reservation_services_origin")
    destination = models.ForeignKey(Hotel, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Destino", related_name="reservation_services_destination")
    room = models.CharField(max_length=100, verbose_name="Habitación", null=True, blank=True,)
    transfer_type = models.CharField(max_length=10, choices=TRANSFER_TYPE_CHOICES, verbose_name="Tipo de traslado", default="ARRIVALS")
    adults = models.FloatField(verbose_name="Adultos", default=0)
    childs = models.FloatField(verbose_name="Menores", default=0)
    operation_type = models.ForeignKey(OperationType, on_delete=models.PROTECT, verbose_name="Tipo de operación",related_name="reservation_services")
    confirmation = models.BooleanField(default=True, verbose_name="Confirmación")
    flight_code = models.CharField(max_length=10, verbose_name="Clave de vuelo", null=True, blank=True)
    flight = models.ForeignKey(Flight, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Reservación",related_name="reservation_services")
    flight_field = models.CharField(max_length=13, verbose_name="Campo de vuelo", default='sun_departure')
    real_flight_time = models.TimeField(verbose_name="Tiempo real de vuelo",null=True, blank=True)
    pick_up_time = models.ForeignKey(PickUpTime, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Reservación",related_name="reservation_services")
    real_pick_up_time = models.TimeField(verbose_name="Tiempo real de vuelo",null=True, blank=True)
    comments = models.TextField(verbose_name="Comentarios", null=True, blank=True,)
    asignment = models.BooleanField(default=False, verbose_name="Asignado")
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Unidad",related_name="reservation_services")
    number = models.PositiveIntegerField(verbose_name="",default=0)
    no_show = models.CharField(max_length=15, choices=NO_SHOW_CHOICES, verbose_name="Tipo de traslado", default="none")
    invoice_type = models.CharField(max_length=15, choices=INVOICE_CHOICES, verbose_name="Facturable", default="none")
    invoice_cash_cxp = models.BooleanField(default=False, verbose_name="Efectivo")
    objects = ReservationServiceQuerySet.as_manager()

    class Meta:
        verbose_name = 'Servicio de reservación'
        verbose_name_plural = 'Servicios de reservación'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.reservation.id, self.date)
    
    def clean(self):
        from datetime import date
        if self.date < date.today() and self.id is None:
            raise CustomValidation('No se puede reservar con fecha anterior al dia de la reserva.', 'error', status.HTTP_400_BAD_REQUEST)
        
class ReservationLog(models.Model):
    reservation_id = models.PositiveIntegerField(verbose_name="Referencia#")
    timestamp = models.DateTimeField(auto_now=True)
    type = models.CharField(max_length=50,verbose_name="Tipo de registro")
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT, verbose_name="Responsable",related_name="reservation_logs")
    field = models.CharField(max_length=100, verbose_name="Campo", null=True, blank=True)
    old_data = models.CharField(max_length=100, verbose_name="Viejo dato", null=True, blank=True)
    new_data = models.CharField(max_length=100, verbose_name="Nuevo dato", null=True, blank=True)
    objects = ReservationLogQuerySet.as_manager()

    class Meta:
        verbose_name = 'Registro de reservación'
        verbose_name_plural = 'Registros de reservación'

    def __str__(self):
        return "[{}] {} {} {} {}->{}".format(self.timestamp, self.reservation_id, self.type, self.field, self.old_data, self.new_data)
    
class ReservationCreateToken(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.PROTECT, related_name='extension', verbose_name="Extension de usuario")
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT,related_name="reservation_create_tokens")
    uuid = models.UUIDField(editable=False, default=uuid.uuid4, unique=True)
    timestamp = models.DateTimeField(auto_now=True)
    objects = ReservationCreateTokenQueryset.as_manager()

    class Meta:
        verbose_name = 'Token de creacion de reservacion'
        verbose_name_plural = 'Tokens de creacion de reservacion'

    def __str__(self):
        return "[{}] {} - {}".format(self.uuid, self.reservation, self.user_extension.user.username, self.timestamp)