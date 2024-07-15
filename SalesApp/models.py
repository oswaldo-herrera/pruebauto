from django.db                          import models
from django.core                        import validators
from GeneralApp.models                  import Property, Service, Representative, AvailabilityGroup, Provider, SaleType, UserExtension, DepartmentCECOS, Hotel, TRANSFER_TYPE_CHOICES, Store
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from GeneralApp.utils                   import CustomValidation
from GeneralApp.querysets               import CustomQuerySet
from SalesApp.querysets                 import SaleQuerySet, SalePaymentQuerySet, ScheduleQuerySet, ScheduleAllotmentQuerySet, StoreCardQuerySet, StoreCardChargeQuerySet, PendingPaymentTokenSaleQueryset, SaleLogQuerySet, ServiceRateComissionQuerySet
from rest_framework                     import status
from datetime                           import date
import random
import uuid

discount_choices = (
    ('amount', "Monto"),
    ('percent', "Porcentaje"),
)
CURRENCY_CHOICES = (
    ('MN', 'M.N.'),
    ('USD', 'USD'),
    ('EURO', 'EURO'),
)
# Create your models here.
class PaymentType(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    is_commissionable = models.BooleanField(default=True, verbose_name="¿Es comisionable?")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Tipo de forma de pago'
        verbose_name_plural = 'Tipos de formas de pago'
    def __str__(self):
        return "[{}] {}".format(self.id, self.name)

class PaymentMethod(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    payment_type = models.ForeignKey(PaymentType, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Tipo de forma de pago",related_name="payment_methods")
    room_charge = models.BooleanField(default=False, verbose_name="Cargo a habitacion")
    card_charge = models.BooleanField(default=False, verbose_name="Cargo a tarjeta")
    store_card_charge = models.BooleanField(default=False, verbose_name="Cargo a monedero")
    courtesy = models.BooleanField(default=False, verbose_name="Cortesia")
    is_service_fee = models.BooleanField(default=False, verbose_name="¿Permite Service Fee?")
    currency = models.CharField(default='MN', max_length=4, choices=CURRENCY_CHOICES, verbose_name="Tipo")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedades",related_name="payment_methods")
    objects = CustomQuerySet.as_manager()

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.is_service_fee is True:
            query = PaymentMethod.objects.filter(is_service_fee=True,property=self.property).exclude(id=self.id)
            if query.exists():
                raise CustomValidation('Solo puede haber un tipo de forma de pago que permita service fee.', 'error', status.HTTP_400_BAD_REQUEST)
        if self.room_charge is True or self.card_charge is True or self.store_card_charge is True:
            RC = self.room_charge is True and self.card_charge is True
            RSC = self.room_charge is True and self.store_card_charge is True
            CSC = self.card_charge is True and self.store_card_charge is True
            if RC or RSC or CSC:
                raise CustomValidation('Las formas de pago solo pueden tener un cargo (Habitacion, tarjeta de credito o monedero).', 'error', status.HTTP_400_BAD_REQUEST)
            if self.currency != 'USD':
                raise CustomValidation('Las formas de pago con un cargo solo pueden ser en USD', 'error', status.HTTP_400_BAD_REQUEST)
            # if self.room_charge is True:
            #     query = PaymentMethod.objects.filter(room_charge=True,property=self.property).exclude(id=self.id)
            #     if query.exists():
            #         raise CustomValidation('Solo puede haber una forma de pago con cargo a habitacion por propiedad.', 'error', status.HTTP_400_BAD_REQUEST)
            if self.card_charge is True:
                query = PaymentMethod.objects.filter(card_charge=True,property=self.property).exclude(id=self.id)
                if query.exists():
                    raise CustomValidation('Solo puede haber una forma de pago con cargo a tarjeta de credito por propiedad.', 'error', status.HTTP_400_BAD_REQUEST)
            if self.store_card_charge is True:
                query = PaymentMethod.objects.filter(store_card_charge=True,property=self.property).exclude(id=self.id)
                if query.exists():
                    raise CustomValidation('Solo puede haber una forma de pago con cargo a monedero por propiedad.', 'error', status.HTTP_400_BAD_REQUEST)


    class Meta:
        verbose_name = 'Forma de pago'
        verbose_name_plural = 'Formas de pago'
    def __str__(self):
        return "[{}] {}".format(self.id, self.name)

class ServiceRate(models.Model):
    start_date = models.DateField(verbose_name="Periodo de inicio")
    due_date = models.DateField(verbose_name="Periodo de fin")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, verbose_name="Servicio", related_name="service_rates")
    currency = models.CharField(max_length=4, choices=CURRENCY_CHOICES, verbose_name="Tipo")
    adult_price = models.FloatField(verbose_name="Tarifa adulto")
    child_price = models.FloatField(verbose_name="Tarifa menor",default=0.0)
    hard_rock_comission_adult = models.FloatField(verbose_name="Comisión Hard Rock Adulto",default=0.0)
    hard_rock_comission_child = models.FloatField(verbose_name="Comisión Hard Rock Menor",default=0.0)
    tax = models.FloatField(verbose_name="IVA",default=16)
    exent_import_adult = models.FloatField(verbose_name="Importe Exento Adulto",default=0.0)
    exent_import_child = models.FloatField(verbose_name="Importe Exento Menor",default=0.0)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedades",related_name="service_rates")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Tarifa de servicio'
        verbose_name_plural = 'Tarifas de servicios'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.start_date, self.service.name)

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.due_date <= self.start_date:
            raise CustomValidation('La tarifa no puede vencer antes del inicio.', 'due_date', status.HTTP_400_BAD_REQUEST)
        query = ServiceRate.objects.dateRangeInRange(self.start_date,self.due_date).filter(service=self.service,property=self.property)
        if self.id is not None:
            query = query.exclude(id=self.id)
        if query.exists():
            raise CustomValidation('Ya hay una tafira para ese periodo', 'due_date', status.HTTP_400_BAD_REQUEST)

class ServiceRateComission(models.Model):
    service_rate = models.ForeignKey(ServiceRate, on_delete=models.PROTECT, verbose_name="Servicio", related_name="service_rate_comissions")
    payment_type = models.ForeignKey(PaymentType, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Tipo de forma de pago",related_name="service_rate_comissions")
    comission = models.FloatField(verbose_name="Comisión Hard Rock",default=0.0)
    objects = ServiceRateComissionQuerySet.as_manager()

    class Meta:
        verbose_name = 'Comisión de representantes'
        verbose_name_plural = 'Comisiones de representantes'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.service_rate, self.payment_type.name)
    
class CoordinatorsComission(models.Model):
    date = models.DateField(verbose_name="Fecha de inicio")
    comission = models.FloatField(verbose_name="Comisión",default=0.0)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedades",related_name="coordinators_commisions")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Comisión de coordinadores pagos directos'
        verbose_name_plural = 'Comisiones de coordinadores pagos directos'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.date, self.comission)
    
    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.date < date.today() and self.id is None:
            raise CustomValidation('No se puede registrar una fecha anterior al dia de hoy.', 'date', status.HTTP_400_BAD_REQUEST)


class Availability(models.Model):
    availability_group = models.ForeignKey(AvailabilityGroup, on_delete=models.PROTECT, verbose_name="Grupo de disponibilidad", related_name="availabilities")
    start_date = models.DateField(verbose_name="Periodo de inicio")
    due_date = models.DateField(verbose_name="Periodo de fin")
    schedule_1 = models.ForeignKey('Schedule', on_delete=models.PROTECT, verbose_name="Horario 1",related_name="availabilities_schedule_1")
    schedule_2 = models.ForeignKey('Schedule', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario 2",related_name="availabilities_schedule_2")
    schedule_3 = models.ForeignKey('Schedule', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario 3",related_name="availabilities_schedule_3")
    schedule_4 = models.ForeignKey('Schedule', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario 4",related_name="availabilities_schedule_4")
    schedule_5 = models.ForeignKey('Schedule', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario 5",related_name="availabilities_schedule_5")
    schedule_6 = models.ForeignKey('Schedule', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario 6",related_name="availabilities_schedule_6")
    schedule_7 = models.ForeignKey('Schedule', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario 7",related_name="availabilities_schedule_7")
    objects = CustomQuerySet.as_manager()

    class Meta:
        unique_together = ('availability_group', 'start_date')
        verbose_name = 'Disponibilidad'
        verbose_name_plural = 'Disponibilidades'
    def __str__(self):
        return "[{}] {}-{} {}".format(self.id, self.start_date, self.due_date, self.availability_group.name)

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.due_date < self.start_date:
            print(self)
            raise CustomValidation('La disponibilidad no puede vencer antes del inicio.', 'due_date', status.HTTP_400_BAD_REQUEST)
        query = Availability.objects.dateRangeInRange(self.start_date,self.due_date).filter(availability_group=self.availability_group)
        if self.id is not None:
            query = query.exclude(id=self.id)
        if query.exists():
            raise CustomValidation('Ya hay una disponibilidad para ese periodo', 'due_date', status.HTTP_400_BAD_REQUEST)
        

class Schedule(models.Model):
    active = models.BooleanField(default=True, verbose_name="¿Esta activo?")
    limit = models.PositiveIntegerField(verbose_name="Limite", default=0)
    time = models.TimeField(verbose_name="Hora")
    MON = models.BooleanField(default=False,verbose_name="Lunes")
    TUE = models.BooleanField(default=False,verbose_name="Martes")
    WED = models.BooleanField(default=False,verbose_name="Miércoles")
    THU = models.BooleanField(default=False,verbose_name="Jueves")
    FRI = models.BooleanField(default=False,verbose_name="Viernes")
    SAT = models.BooleanField(default=False,verbose_name="Sábado")
    SUN = models.BooleanField(default=False,verbose_name="Domingo")
    objects = ScheduleQuerySet.as_manager()

    class Meta:
        #unique_together = ('availability', 'time')
        verbose_name = 'Horario'
        verbose_name_plural = 'Horarios'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.time, self.limit)
    
class SchedulePickUp(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.PROTECT, verbose_name="Horario",related_name="schedule_pickups")
    hotel = models.ForeignKey(Hotel, on_delete=models.PROTECT, verbose_name="Hotel",related_name="schedule_pickups")
    time = models.TimeField(verbose_name="Pick Up")

    class Meta:
        unique_together = ('schedule', 'hotel')
        verbose_name = 'Pick up de horario'
        verbose_name_plural = 'Pick ups de horario'

class ScheduleAllotment(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Horario",related_name="schedule_allotments")
    schedule_time = models.TimeField(verbose_name="Hora", null=True, blank=True,)
    availability_group = models.ForeignKey(AvailabilityGroup, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Grupo de disponibilidad", related_name="schedule_allotments")
    start_date = models.DateField(verbose_name="Fecha de operación")
    active = models.BooleanField(default=True, verbose_name="¿Esta activo?")
    comments = models.TextField(verbose_name="Comentarios", null=True, blank=True,)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, verbose_name="Propiedad",related_name="schedule_allotments")
    objects = ScheduleAllotmentQuerySet.as_manager()

    class Meta:
        unique_together = ('availability_group', 'schedule_time', 'start_date','property')
        verbose_name = 'Bloque de horario'
        verbose_name_plural = 'bloque de horarios'
    def __str__(self):
        return "[{}] {} {}".format(self.id, self.schedule, self.start_date)

class ClientType(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="client_types")
    objects = CustomQuerySet.as_manager()
    discounts = GenericRelation(
		"Discount",
		related_query_name="client_type",
		content_type_field='conditional_content_type',
		object_id_field='conditional_object_id',
	)

    class Meta:
        verbose_name = 'Tipo de cliente'
        verbose_name_plural = 'Tipos de cliente'

def get_children():
        return {'model__in': [ClientType.__name__, Service.__name__, Provider.__name__,]}

class Discount(models.Model):
    choices = (
        ('clienttype', "Tipo de cliente"),
        ('provider', "Proveedor"),
        ('service', "Servicio"),
    )
    start_date = models.DateField(verbose_name="Periodo de inicio")
    due_date = models.DateField(verbose_name="Periodo de fin")
    discount = models.FloatField(verbose_name="Descuento",default=0.0)
    conditional = GenericForeignKey('conditional_content_type', 'conditional_object_id')
    conditional_content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT,
        help_text="Referencia foranea al modelo ContentType")
    conditional_object_id = models.PositiveIntegerField()
    sale_type = models.ForeignKey(SaleType, on_delete=models.PROTECT, verbose_name="Tipo de venta", related_name="discounts")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="discounts")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Descuento'
        verbose_name_plural = 'Descuentos'

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.due_date <= self.start_date:
            raise CustomValidation('El descuento no puede vencer antes del inicio.', 'due_date', status.HTTP_400_BAD_REQUEST)
        query = Discount.objects.dateRangeInRange(self.start_date,self.due_date).filter(
            conditional_content_type=self.conditional_content_type,
            conditional_object_id=self.conditional_object_id,
            sale_type=self.sale_type,
            property=self.property)
        if self.id is not None:
            query = query.exclude(id=self.id)
        if query.exists():
            raise CustomValidation('Ya hay un descuento para ese periodo', 'due_date', status.HTTP_400_BAD_REQUEST)
        
class Sale(models.Model):
    choices = (
        ('C', "Cancelada"),
        ('P', "Pendiente de pago"),
        ('A', "Vendida"),
        ('R', "Reembolso"),
        ('B', "Bloqueo"),
    )
    service_fee_choices = (
        ('20', "20%"),
        ('25', "25%"),
    )
    status = models.CharField(max_length=1, choices=choices, verbose_name="Estatus")
    sale_key = models.PositiveIntegerField(verbose_name="ID",default=0)
    sale_key_manual = models.CharField(max_length=100, verbose_name="ID manual", null=True, blank=True,)
    sale_reservation_id = models.PositiveIntegerField(verbose_name="ID de reservación", null=True, blank=True,)
    reservation_service = models.ForeignKey('OperationsApp.ReservationService', on_delete=models.PROTECT, null=True, blank=True, related_name='sales')
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT, verbose_name="Usuario",related_name="sales")
    sale_date = models.DateTimeField(verbose_name="Fecha de venta")
    representative = models.ForeignKey(Representative, on_delete=models.PROTECT, verbose_name="Representante",related_name="sales")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, verbose_name="Servicio",related_name="sales")
    service_date = models.DateField(verbose_name="Fecha de servicio")
    service_rate = models.ForeignKey(ServiceRate, on_delete=models.PROTECT, verbose_name="Tarifa de servicio",related_name="sales")
    schedule = models.ForeignKey(Schedule, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Disponibilidad",related_name="sales")
    client_type = models.ForeignKey(ClientType, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Tipo de cliente",related_name="sales")
    time = models.TimeField(verbose_name="Hora de servicio",null=True, blank=True)
    name_pax = models.CharField(max_length=100, verbose_name="Nombre Pax")
    email = models.CharField(max_length=100, verbose_name="Correo",null=True, blank=True)
    sale_type = models.ForeignKey(SaleType, on_delete=models.PROTECT, verbose_name="Tipo de venta", related_name="sales")
    adults = models.FloatField(verbose_name="Adultos", default=0)
    childs = models.FloatField(verbose_name="Menores", default=0)
    discount_type = models.CharField(max_length=10, choices=discount_choices, verbose_name="Tipo de descuento", default='amount')
    discount = models.FloatField(verbose_name="Descuento", default=0.0)
    overcharged = models.FloatField(verbose_name="Cobrado de más", default=0.0)
    sale_service_fee = models.BooleanField(default=False, verbose_name="Venta de tarifa de servicio")
    service_fee = models.FloatField(verbose_name="tarifa de servicio", default=20)
    hotel = models.ForeignKey(Hotel, on_delete=models.PROTECT, verbose_name="Hotel", related_name="sales")
    room = models.CharField(max_length=100, verbose_name="Habitación", null=True, blank=True,)
    confirm_provider = models.CharField(max_length=100, verbose_name="Confirmacion de proveedor", null=True, blank=True,)
    comments = models.TextField(verbose_name="Comentarios", null=True, blank=True,)
    comments_coupon = models.TextField(verbose_name="Comentarios para cupon", null=True, blank=True,)
    unit = models.CharField(max_length=30, verbose_name="Unidad", null=True, blank=True,)
    currency = models.CharField(max_length=4, choices=CURRENCY_CHOICES, verbose_name="Tipo", null=True, blank=True)
    adult_price = models.FloatField(verbose_name="Tarifa adulto", null=True, blank=True)
    child_price = models.FloatField(verbose_name="Tarifa menor", null=True, blank=True)
    hard_rock_comission_adult = models.FloatField(verbose_name="Comisión Hard Rock Adulto", null=True, blank=True)
    hard_rock_comission_child = models.FloatField(verbose_name="Comisión Hard Rock Menor", null=True, blank=True)
    tax = models.FloatField(verbose_name="IVA", null=True, blank=True)
    exent_import_adult = models.FloatField(verbose_name="Importe Exento Adulto", null=True, blank=True)
    exent_import_child = models.FloatField(verbose_name="Importe Exento Menor", null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="sales")
    objects = SaleQuerySet.as_manager()

    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        permissions = (
            ('sales_management', 'Administracion de ventas'),
            ('access_by_representative', 'Acceso a Reporte 1'),
            ('access_summary_by_representatives', 'Acceso a Reporte 2'),
            ('access_summary_by_sales_types_services', 'Acceso a Reporte 3'),
            ('access_summary_by_services', 'Acceso a Reporte 4'),
            ('access_summary_by_hotel', 'Acceso a Reporte 5'),
            ('access_sales_consecutive', 'Acceso a Reporte 6'),
            ('access_summary_by_representatives_services', 'Acceso a Reporte 7'),
            ('access_summary_by_sale_types', 'Acceso a Reporte 8'),
            ('access_vp_filter_sap', 'Acceso a Reporte SAP'),
            ('access_report_sale_by_sale_type_and_hotel', 'Acceso a Reporte A'),
            ('access_report_sale_cost_daily', 'Acceso a Reporte B'),
            ('access_report_refund_by_representatives', 'Acceso a Reporte F'),
            ('access_report_sales_with_discount', 'Acceso a Reporte G'),
            ('access_report_sales_by_representatives_and_providers', 'Acceso a Reporte H'),
            ('access_report_by_payment_method', 'Acceso a Reporte I'),
            ('access_report_by_payment_method_sales', 'Acceso a Reporte I (Vendedores)'),
            ('access_report_sales_pax_by_services', 'Acceso a Reporte J'),
            ('access_summary_by_providers_services', 'Acceso a Reporte K'),
            ('view_operation_vp', 'Puede Consultar Operación VP'),
            ('edit_operation_vp', 'Puede Editar Operación VP'),
        )
        
    class SaleException(Exception):
        pass

    class SaleKeyDuplicateException(SaleException):
        pass

    def __str__(self):
        return "[{}-{}] {} {}".format(self.status, self.sale_key, self.user_extension.user.username, self.sale_date)

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.status == "C" or self.status == "A" or self.status == "B":
            query = Sale.objects.searchSaleByID(self.sale_key,self.id).exclude(status="R")
            if query.exists():
                raise Sale.SaleKeyDuplicateException()
                #raise CustomValidation('Esta clave ya esta usada, intente denuevo.', 'msg', status.HTTP_400_BAD_REQUEST)
        else:
            query = Sale.objects.searchSaleByIDRefund(self.sale_key,self.id)
            if query.exists():
                raise CustomValidation('Este reembolso ya existe, intente denuevo.', 'msg', status.HTTP_400_BAD_REQUEST)

class SalePayment(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, verbose_name="Venta",related_name="sale_payments")
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT, verbose_name="Metodo de pago",related_name="sale_payments")
    amount = models.FloatField(verbose_name="Monto", default=0)
    department_cecos = models.ForeignKey(DepartmentCECOS, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Departamento CECOS",related_name="sale_payments")
    credit_charge = models.ForeignKey('CreditCharge', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Cargo a tarjeta de credito",related_name="sale_payments")
    store_card_charge = models.OneToOneField('StoreCardCharge', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Cargo a monedero",related_name="sale_payment")
    authorization = models.CharField(max_length=30, verbose_name="Autorización",null=True, blank=True)
    objects = SalePaymentQuerySet.as_manager()

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'

class SaleLog(models.Model):
    sale_key = models.PositiveIntegerField(verbose_name="ID")
    status = models.CharField(max_length=1, verbose_name="Estatus")
    timestamp = models.DateTimeField(auto_now=True)
    type = models.CharField(max_length=50,verbose_name="Tipo de registro")
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT, verbose_name="Responsable",related_name="sale_logs")
    field = models.CharField(max_length=100, verbose_name="Campo", null=True, blank=True)
    old_data = models.CharField(max_length=100, verbose_name="Viejo dato", null=True, blank=True)
    new_data = models.CharField(max_length=100, verbose_name="Nuevo dato", null=True, blank=True)
    objects = SaleLogQuerySet.as_manager()

    class Meta:
        verbose_name = 'Registro de venta'
        verbose_name_plural = 'Registros de venta'

    def __str__(self):
        return "[{}][{}-{}] {} {} {}->{}".format(self.timestamp, self.status, self.sale_key, self.type, self.field, self.old_data, self.new_data)

class RoomCharge(models.Model):
    sale_payment = models.OneToOneField(SalePayment, on_delete=models.PROTECT, verbose_name="Venta",related_name="room_charges")
    reservation_opera_id = models.CharField(max_length=30, verbose_name="No. reservación")
    timestamp = models.DateTimeField(auto_now=True)
    account = models.CharField(max_length=50, verbose_name="Cuenta")
    hotel_code = models.CharField(max_length=50, verbose_name="Codigo de hotel")
    room = models.CharField(max_length=50, verbose_name="Habitacion")
    pax = models.CharField(max_length=100, verbose_name="Nombre de pax")
    coupon = models.CharField(max_length=100, verbose_name="Coupon")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Cargo habitación'
        verbose_name_plural = 'Cargos habitación'

class CreditCharge(models.Model):
    transaction_id = models.CharField(max_length=50, verbose_name="No. Authorizacion",null=True, blank=True)
    order_id = models.CharField(max_length=50, verbose_name="No. Orden", unique=True)
    status = models.CharField(max_length=30, verbose_name="Estatus", default="Pendiente")
    timestamp = models.DateTimeField(auto_now=True)
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Pago con tarjeta'
        verbose_name_plural = 'Pagos con tarjeta'

def create_new_ref_number():
    not_unique = True
    while not_unique:
        unique_ref = random.randint(1, 999999)
        if not AuthDiscount.objects.filter(discount_key=unique_ref):
            not_unique = False
    return str(unique_ref)

class AuthDiscount(models.Model):
    timestamp = models.DateTimeField(auto_now=True)
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, verbose_name="Venta",related_name="auth_discounts",null=True, blank=True,)
    discount_key = models.PositiveIntegerField(verbose_name="ID", unique=True, default=create_new_ref_number)
    user_extension = models.ForeignKey(UserExtension, on_delete=models.PROTECT, verbose_name="Usuario",related_name="auth_discounts")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, null=True, blank=True, verbose_name="Propiedad",related_name="auth_discounts")
    objects = CustomQuerySet.as_manager()

    class Meta:
        verbose_name = 'Autorizacion de descuento'
        verbose_name_plural = 'Autorizaciones de descuentos'

STORE_CARD_STATUS = (
    ('active', 'Activa'),
    ('inactive', 'Inactiva'),
    ('lost', 'Perdida'),
)
class StoreCard(models.Model):
    card_key = models.PositiveIntegerField(verbose_name="ID",default=0)
    store = models.ForeignKey(Store, on_delete=models.PROTECT,related_name="store_cards",null=True, blank=True)
    name_pax = models.CharField(max_length=100, verbose_name="Nombre Pax")
    email = models.CharField(max_length=100, verbose_name="Correo")
    nip = models.CharField(max_length=4, validators=[validators.RegexValidator(
        regex=r'^\d{4}$',
        message='Ingresa un texto de 4 caracteres numéricos.',
        code='invalid_format')])
    timestamp = models.DateTimeField(auto_now=True)
    due_date = models.DateField(verbose_name="Fecha de vencimiento")
    status = models.CharField(max_length=30, verbose_name="Estatus", default="active", choices=STORE_CARD_STATUS)
    comments = models.TextField(verbose_name="Comentarios", null=True, blank=True)
    objects = StoreCardQuerySet.as_manager()

    def __str__(self):
        return "[{}-{}] {} {}".format(self.status, self.card_key, self.store.name, self.timestamp.date())

    class Meta:
        unique_together = ('card_key', 'nip')
        verbose_name = 'Tarjeta de monedero'
        verbose_name_plural = 'Tarjetas de monedero'

class StoreCardCharge(models.Model):
    store_card = models.ForeignKey(StoreCard, on_delete=models.PROTECT,related_name="store_card_charges")
    amount = models.FloatField(verbose_name="Monto", default=0)
    timestamp = models.DateTimeField(auto_now=True)
    comments = models.TextField(verbose_name="Comentarios", null=True, blank=True)
    objects = StoreCardChargeQuerySet.as_manager()

    def __str__(self):
        return "[{}] {} {}".format(self.store_card, self.amount, self.timestamp.date())

    class Meta:
        verbose_name = 'Cargo a monedero'
        verbose_name_plural = 'Cargos a monedero'

    def save(self, *vars, **kwargs):
        self.full_clean()
        return super().save(*vars, **kwargs)

    def clean(self):
        if self.store_card.status != "active":
            raise CustomValidation('Esta tarjeta no esta activa.', 'msg', status.HTTP_400_BAD_REQUEST)
        
class PendingPaymentTokenSale(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT,related_name="pending_payment_token_sales")
    uuid = models.UUIDField(editable=False, default=uuid.uuid4, unique=True)
    credit_charge = models.ForeignKey(CreditCharge, on_delete=models.PROTECT,related_name="pending_payment_token_sales")
    url = models.URLField(null=True, blank=True, verbose_name="URL")
    timestamp = models.DateTimeField(auto_now=True)
    objects = PendingPaymentTokenSaleQueryset.as_manager()

    def __str__(self):
        return "[{}] {} - {}".format(self.uuid, self.sale, self.timestamp)

    class Meta:
        permissions = (
            ('users_partners', 'Can View PartnerData'),
        )

    
