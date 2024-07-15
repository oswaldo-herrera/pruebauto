from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.db                          import models
from django.core                        import validators
from django.dispatch                    import receiver
from django.db.models.signals           import post_delete
from django.contrib.auth.models         import User, Group, AbstractUser
from django.contrib.contenttypes.models import ContentType
from django.utils.crypto                import get_random_string
from GeneralApp                         import querysets
from GeneralApp.utils                   import CustomValidation
from datetime                           import date, datetime, timezone, timedelta
from rest_framework                     import status
from django.utils                       import timezone as util_timezone
import os
import uuid



EMAIL = 'EMAIL'
SMS = 'SMS'
VERIFICATION_2FA_METHOD_CHOICES = (
    (EMAIL, "Por correo"),
    (SMS, "Por sms"),
)
DEPARTURES = 'DEPARTURES'
ARRIVALS = 'ARRIVALS'
INTERHOTEL = 'INTERHOTEL'
TRANSFER_TYPE_CHOICES = (
    (DEPARTURES, "Salidas"),
    (ARRIVALS, "Llegadas"),
    (INTERHOTEL, "InterHotel"),
)
TRANSFER_TYPE_CHOICES_SIMPLE = (
    (DEPARTURES, "S"),
    (ARRIVALS, "L"),
    (INTERHOTEL, "I"),
)
# Create your models here.
class Property(models.Model):
    code = models.CharField(max_length=10, verbose_name="Código")
    name = models.CharField(max_length=80, verbose_name="Nombre")
    coupon_title = models.TextField(max_length=300, null=True, blank=True, verbose_name="Direccion")
    coupon_header = models.TextField(max_length=300, null=True, blank=True, verbose_name="Sucursal")

    class Meta:
        verbose_name = 'Propiedad'
        verbose_name_plural = 'Propiedades'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.code, self.name,)

class UserExtension(models.Model):
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name='extension', verbose_name="Extension de usuario")
    temporal_password = models.BooleanField(default=True, verbose_name='Contraseña temporal')
    first_password = models.CharField(max_length=15, null=True, blank=True, verbose_name='Primera contraseña')
    password_changed_at = models.DateTimeField(default=util_timezone.now)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0,validators=[validators.MaxValueValidator(5),])
    last_failed_login = models.DateTimeField(default=util_timezone.now)
    verification_2fa = models.BooleanField(default=False, verbose_name='Verificacion por 2FA')
    verification_2fa_method = models.CharField(max_length=10, choices=VERIFICATION_2FA_METHOD_CHOICES, verbose_name="Metodo de vefiricacion", default="EMAIL")
    phone = models.CharField(null=True, blank=True, max_length=10, verbose_name="Telefono")
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_expire_time = models.DateTimeField(null=True, blank=True)
    representative = models.ForeignKey('Representative', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Representante",related_name="user_extensions")
    provider = models.ForeignKey('Provider', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Proveedor",related_name="user_extensions")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="user_extensions")
    objects = querysets.UserExtensionQueryset.as_manager()

    class Meta:
        permissions = (
            ('users_management', 'Administrador de usuarios'),
            ('catalogs_management', 'Administrador de catalogos'),
            ('catalogs_view', 'Ver catalogos'),
            ('permission_management', 'Administrador de permisos'),
            ('provider_permission', 'Permisos de proveedor'),
            ('cxp_permission', 'Permisos de CXP'),
        )

    def __str__(self):
        return "[{}] {}".format(self.id, self.user.username)
    
class UserExtensionPasswordReset(models.Model):
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT,related_name="user_extension_password_resets")
    uuid = models.UUIDField(editable=False, default=uuid.uuid4, unique=True)
    used = models.BooleanField(default=False, verbose_name='Token usado')
    timestamp = models.DateTimeField(auto_now=True)
    objects = querysets.UserExtensionPasswordResetQueryset.as_manager()

    def __str__(self):
        return "[{}] {} - {}".format(self.uuid, self.extension.user.email, self.timestamp)

    class Meta:
        permissions = (
            ('users_partners', 'Can View PartnerData'),
        )
    
class UserExtensionPasswordReset(models.Model):
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT,related_name="user_extension_password_resets")
    uuid = models.UUIDField(editable=False, default=uuid.uuid4, unique=True)
    used = models.BooleanField(default=False, verbose_name='Token usado')
    timestamp = models.DateTimeField(auto_now=True)
    objects = querysets.UserExtensionPasswordResetQueryset.as_manager()

    def __str__(self):
        return "[{}] {} - {}".format(self.uuid, self.user_extension.user.email, self.timestamp)

    class Meta:
        permissions = (
            ('users_partners', 'Can View PartnerData'),
        )

class PasswordHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

def update_password_history(sender, instance, **kwargs):
    # Guardar la contraseña actual en el historial antes de cambiarla
    if instance.pk:
        last_password = instance.password
        password_history = PasswordHistory(user=instance, password=last_password)
        password_history.save()

models.signals.pre_save.connect(update_password_history, sender=User)
    
class Representative(models.Model):
    code = models.PositiveIntegerField(verbose_name="Clave",default=0)
    name = models.CharField(max_length=100, verbose_name="Nombre")
    active = models.BooleanField(default=True, verbose_name="¿Esta activo?")
    is_sale_online = models.BooleanField(default=False, verbose_name="¿Es para portal de ventas?")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedades",related_name="representatives")
    objects = querysets.CustomQuerySet.as_manager()

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.is_sale_online is True:
            query = SaleType.objects.filter(is_sale_online=True,property=self.property).exclude(id=self.id)
            if query.exists():
                raise CustomValidation('Solo puede haber un tipo de venta para ventas portal de ventas.', 'error', status.HTTP_400_BAD_REQUEST)

    class Meta:
        verbose_name = 'Representante'
        verbose_name_plural = 'Representantes'

    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.property.code)

class Activity(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="activities")
    objects = querysets.CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Actividad'
        verbose_name_plural = 'Actividades'
            
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.properties.all().values_list('code'))

class BusinessGroup(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="business_groups")
    objects = querysets.CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Grupo de negocio'
        verbose_name_plural = 'Grupos de negocios'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.properties.all().values_list('code'))

class DepartmentCECOS(models.Model):
    code = models.BigIntegerField(verbose_name="Código")
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="departments")
    objects = querysets.CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Departamento CECOS'
        verbose_name_plural = 'Departamentos CECOS'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.properties.all().values_list('code'))

class ExchangeRate(models.Model):
    TYPE_CHOICES = (
        ('SALE', 'Ventas'),
        ('COMISSION', 'Comisiones'),
    )
    start_date = models.DateField(verbose_name="Dia de inicio")
    usd_currency = models.FloatField(verbose_name="Tipo de cambio USD")
    euro_currency = models.FloatField(verbose_name="Tipo de cambio EURO")
    type = models.CharField(max_length=9, choices=TYPE_CHOICES, verbose_name="Tipo", default="SALE")
    provider = models.ForeignKey('Provider', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Proveedor",related_name="exchanges")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="exchanges")
    objects = querysets.ExchangeRateQuerySet.as_manager()

    class Meta:
        unique_together = ('start_date', 'type', 'provider', 'property')
        verbose_name = 'Tipo de cambio'
        verbose_name_plural = 'Tipos de cambios'

    def __str__(self):
        return "[{}] {} {}".format(self.id, self.start_date, self.property)
        
    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        """ if self.start_date < date.today() and self.id is None:
            raise CustomValidation('No se puede registrar una fecha anterior al dia de hoy.', 'start_date', status.HTTP_400_BAD_REQUEST)
        if self.id is not None and self.provider is None:
            exchange_rate = ExchangeRate.objects.get(pk=self.id)
            if self.start_date < exchange_rate.start_date:
                raise CustomValidation('La fecha no puede ser modificada a una fecha anterior.', 'start_date', status.HTTP_400_BAD_REQUEST) """

class OperationType(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="operation_types")
    objects = querysets.CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Tipo de operación'
        verbose_name_plural = 'Tipos de operaciones'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.properties.all().values_list('code'))

class SaleType(models.Model):
    name = models.CharField(max_length=80, verbose_name="Nombre")
    is_inner_bussiness = models.BooleanField(default=False, verbose_name="¿Es interdepartamental?")
    is_sale_online = models.BooleanField(default=False, verbose_name="¿Es para portal de ventas?")
    sap_code = models.CharField(max_length=80, null=True, blank=True, verbose_name="Código SAP")
    warehouse_code = models.CharField(max_length=80, null=True, blank=True, verbose_name="Código Almacen")
    department_cecos = models.ForeignKey(DepartmentCECOS, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Departamento CECOS",related_name="sale_types")
    operation_type = models.ForeignKey(OperationType, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Tipo de operación",related_name="sale_types")
    is_service_fee = models.BooleanField(default=False, verbose_name="¿Permite Service Fee?")
    payment_methods = models.ManyToManyField('SalesApp.PaymentMethod', null=True, blank=True,verbose_name="Metodos de pago autorizados",related_name="sale_types")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="sales_types")
    objects = querysets.SaleTypeQuerySet.as_manager()

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.is_sale_online is True:
            query = SaleType.objects.filter(is_sale_online=True,property=self.property).exclude(id=self.id)
            if query.exists():
                raise CustomValidation('Solo puede haber un tipo de venta para ventas portal de ventas.', 'error', status.HTTP_400_BAD_REQUEST)

    class Meta:
        verbose_name = 'Tipo de venta'
        verbose_name_plural = 'Tipos de ventas'
        
    def __str__(self):
        return "[{}] {} ".format(self.id, self.name)
    
def upload_to_hotel_logo(instance, filename):
    return 'logo/hotel/{filename}'.format(filename=filename)

class Hotel(models.Model):
    name = models.CharField(max_length=80, verbose_name="Nombre")
    opera_code = models.CharField(max_length=80, null=True, blank=True, verbose_name="Código Opera")
    zone_id = models.IntegerField(default=0,verbose_name="ID Zona")
    unit = models.ForeignKey('Unit', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Unidad RT",related_name="hotels")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="hotels")
    logo = models.ImageField(upload_to=upload_to_hotel_logo, null=True, blank=True)
    priority = models.BooleanField(default=False, verbose_name="¿Es prioridad?")
    objects = querysets.HotelQuerySet.as_manager()

    class Meta:
        verbose_name = 'Hotel'
        verbose_name_plural = 'Hoteles'

    def __str__(self):
        return "[{}] {} {} {}".format(self.id, self.name, self.opera_code, self.properties.all().values_list('code'))
    
def upload_to_hotel(instance, filename):
    return 'hotel/{instance}/{filename}'.format(filename=filename,instance=instance.hotel.id)

class HotelImage(models.Model):
    ENG = 'eng'
    ESP = 'esp'
    POR = 'por'
    LANGUAGES_CHOICES = (
        (ENG, "Ingles"),
        (ESP, "Español"),
        (POR, "Portugues"),
    )
    hotel = models.ForeignKey(Hotel, on_delete=models.PROTECT, verbose_name="Hotel", related_name="hotel_images")
    creator = models.ForeignKey(UserExtension, on_delete=models.PROTECT, related_name="hotel_images")
    position = models.PositiveIntegerField(validators=[validators.MinValueValidator(1)])
    language = models.CharField(max_length=3,choices=LANGUAGES_CHOICES,default=ENG)
    image = models.ImageField(upload_to=upload_to_hotel)

    class Meta:
        unique_together = ('hotel', 'position', 'language')
        verbose_name = 'Imagen de hotel'
        verbose_name_plural = 'Imagenes de hotel'

    def delete(self):
        if os.path.isfile(self.image.path):
            os.remove(self.image.path)
        super().delete()
        
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.position, self.hotel.name)

class Provider(models.Model):
    CURRENCY_CHOICES = (
        ('MN', 'M.N.'),
        ('USD', 'USD'),
    )
    name = models.CharField(max_length=150, verbose_name="Nombre")
    business_name = models.CharField(max_length=150, null=True, blank=True, verbose_name="Nombre Comercial")
    tax_key = models.CharField(max_length=13, null=True, blank=True, verbose_name="RFC")
    address = models.TextField(max_length=300, null=True, blank=True, verbose_name="Dirección")
    city = models.CharField(max_length=80, null=True, blank=True, verbose_name="Ciudad/Estado")
    phone = models.CharField(max_length=10, null=True, blank=True, verbose_name="Telefono")
    currency = models.CharField(max_length=4, choices=CURRENCY_CHOICES, default='MN', verbose_name="Moneda")
    sap_code = models.CharField(max_length=80, null=True, blank=True, verbose_name="Código SAP")
    email = models.EmailField(null=True, blank=True, verbose_name="Correo")
    url = models.URLField(null=True, blank=True, verbose_name="URL")
    credit_days = models.IntegerField(default=0, verbose_name="Dias de crédito")
    active = models.BooleanField(default=True, verbose_name="Activo")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="providers")
    objects = querysets.ProviderQuerySet.as_manager()
    discounts = GenericRelation(
		"SalesApp.Discount",
		related_query_name="provider",
		content_type_field='conditional_content_type',
		object_id_field='conditional_object_id',
	)

    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return "[{}] {} {} {}".format(self.id, self.name, self.sap_code, self.properties.all().values_list('code'))

class UnitType(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad", related_name="unit_types")
    objects = querysets.CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Tipo de unidad'
        verbose_name_plural = 'Tipo de unidades'
    def __str__(self):
        return "[{}] {} ".format(self.id, self.name)

class Unit(models.Model):
    unit_type = models.ForeignKey(UnitType, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Tipo", related_name="units")
    code = models.CharField(max_length=10, verbose_name="Clave")
    name = models.CharField(max_length=80, verbose_name="Nombre")
    is_private = models.BooleanField(default=False, verbose_name="¿Es privado?")
    capacity = models.IntegerField(default=0,  verbose_name="Capacidad")
    provider = models.ForeignKey(Provider, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Proveedor", related_name="units")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad", related_name="units")
    objects = querysets.UnitQuerySet.as_manager()

    class Meta:
        verbose_name = 'Unidad'
        verbose_name_plural = 'Unidades'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.code)

class Service(models.Model):
    code = models.CharField(blank=True, max_length=10, verbose_name="Código")
    name = models.CharField(max_length=80, verbose_name="Nombre")
    name_online_sale_es = models.CharField(max_length=100, verbose_name="Nombre Portal de Ventas Español", default="Nombre Portal de Ventas Español")
    name_online_sale_en = models.CharField(max_length=100, verbose_name="Nombre Portal de Ventas Ingles", default="Nombre Portal de Ventas Ingles")
    provider = models.ForeignKey(Provider, on_delete=models.PROTECT, verbose_name="Proveedor", related_name="services")
    activity = models.ForeignKey(Activity, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Actividad", related_name="services")
    availability_group = models.ForeignKey('AvailabilityGroup', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Grupo de disponibilidad", related_name="services")
    opera_code = models.CharField(max_length=80, null=True, blank=True, verbose_name="Código Opera")
    comments_coupon = models.TextField(verbose_name="Comentarios para cupon", null=True, blank=True,)
    description_po = models.TextField(null=True, blank=True,verbose_name='Descripción en portugues')
    description_es = models.TextField(null=True, blank=True,verbose_name='Descripción en español')
    description_en = models.TextField(null=True, blank=True,verbose_name='Descripción en ingles')
    is_transfer = models.BooleanField(default=True, verbose_name="¿Es servicio de transporte?")
    is_online_used = models.BooleanField(default=False, verbose_name="¿Se usa para online?")
    is_sale_online = models.BooleanField(default=False, verbose_name="¿Es para portal de ventas?")
    business_group = models.ForeignKey(BusinessGroup, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Grupo de negocios", related_name="services")
    is_colective = models.BooleanField(default=True, verbose_name="¿Es colectivo?")
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Unidad",related_name="services")
    zones = models.CharField(max_length=100, null=True, blank=True, verbose_name="Zonas")
    service_fee = models.ForeignKey('self', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Service fee", related_name="parent")
    service_fee_amount = models.CharField(max_length=30, verbose_name="Monto(s) de tarifa de servicio", default="20,")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="services")
    objects = querysets.ServiceQuerySet.as_manager()
    discounts = GenericRelation(
		"SalesApp.Discount",
		related_query_name="service",
		content_type_field='conditional_content_type',
		object_id_field='conditional_object_id',
	)

    class Meta:
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'

    def __str__(self):
        return "[{}] {} {} {}".format(self.id, self.name, self.code, self.properties.all().values_list('code'))

def upload_to(instance, filename):
    return 'services/{instance}/{filename}'.format(filename=filename,instance=instance.service.id)

class ServiceImage(models.Model):
    service = models.ForeignKey(Service, on_delete=models.PROTECT, verbose_name="Servicio", related_name="service_images")
    creator = models.ForeignKey(UserExtension, on_delete=models.PROTECT, related_name="service_images")
    title = models.CharField(max_length=80, blank=False, null=False)
    image = models.ImageField(upload_to=upload_to)

    def delete(self):
        if os.path.isfile(self.image.path):
            os.remove(self.image.path)
        super().delete()

    class Meta:
        verbose_name = 'Imagen de servicio'
        verbose_name_plural = 'Imagenes de servicios'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.title, self.service.name)

@receiver(post_delete, sender=ServiceImage)
def post_save_image(sender, instance, *args, **kwargs):
    try:
        instance.image.delete(save=False)
    except:
        pass

class Group(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="groups")
    objects = querysets.GroupQuerySet.as_manager()

    class Meta:
        verbose_name = 'Grupo de grupos'
        verbose_name_plural = 'Grupos de grupos'
    def __str__(self):
        return "[{}] {}".format(self.id, self.name,)

class AvailabilityGroup(models.Model):
    group = models.ForeignKey(Group, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Grupo de grupos", related_name="availability_groups")
    code = models.CharField(max_length=100, verbose_name="Clave")
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="availability_groups")
    objects = querysets.AvailabilityGroupQuerySet.as_manager()

    class Meta:
        verbose_name = 'Grupo de disponibilidad'
        verbose_name_plural = 'Grupos de disponibilidad'
    def __str__(self):
        return "[{}] {}".format(self.id, self.name)
    
class Store(models.Model):
    code = models.BigIntegerField(verbose_name="Código")
    name = models.CharField(max_length=100, verbose_name="Nombre")
    properties = models.ManyToManyField(Property, null=True, blank=True,verbose_name="Propiedades",related_name="stores")
    objects = querysets.CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Tienda'
        verbose_name_plural = 'Tiendas'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.name, self.properties.all().values_list('code'))
    
class Request(models.Model):
    endpoint = models.CharField(max_length=500, null=True) # The url the user requested
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True) # User that made request, if authenticated
    response_code = models.PositiveSmallIntegerField() # Response status code
    method = models.CharField(max_length=10, null=True)  # Request method
    remote_address = models.CharField(max_length=20, null=True) # IP address of user
    exec_time = models.IntegerField(null=True) # Time taken to create the response
    date = models.DateTimeField(auto_now=True) # Date and time of request
    body_request = models.TextField() # Request data