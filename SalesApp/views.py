from django.shortcuts 					import render,redirect
from rest_framework                     import viewsets, permissions, status
from rest_framework.response            import Response
from rest_framework.metadata            import SimpleMetadata, BaseMetadata
from django_filters.rest_framework      import DjangoFilterBackend, FilterSet, BooleanFilter, DateFromToRangeFilter, CharFilter
from rest_framework.filters             import OrderingFilter, SearchFilter
from rest_framework.authtoken.models    import Token
from rest_framework.exceptions          import NotFound
from django.core.exceptions             import PermissionDenied
from django.http                        import HttpResponse,JsonResponse
from django.db                          import transaction
from GeneralApp.permissions             import HasCatalogModelPermissions,IsValidUserAuthentication,IsSuperuser,HasManifestViewPermissions,HasManifestEditPermissions,IsCatalogManagement,HasReportPermissions
from GeneralApp.utils                   import CustomValidation
from GeneralApp.views                   import UtopiAppMetadataViewMixin, CustomViewSet, PropertiesMetadataViewMixin, PropertyMetadataViewMixin, link_callback, escape_xml
from GeneralApp.models                  import Service, Provider, ExchangeRate, Property, Hotel, SaleType, AvailabilityGroup, Group as Groupofgroup
from GeneralApp.serializers             import ServiceSerializer, PropertySerializer
from GeneralApp.controllers             import valid_property
from SalesApp                           import serializers, models
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models         import User, Group, Permission
from datetime                           import time, date, datetime, timedelta
from django.utils                       import timezone
import requests
import xmltodict
import json
import uuid
import logging
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from operacionesVP import serverconfig
from xml.sax.saxutils import escape

@csrf_exempt
@require_http_methods(["GET", "POST"])
def webhook_payment_paid(request,uid):
    print(uid)
    if request.method == 'POST':
        body_unicode = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        if body['status'] == "Aprobada":
            credit_charge = models.CreditCharge.objects.get(order_id=uid)
            credit_charge.transaction_id = body['transaccionId']
            credit_charge.status = body['status']
            credit_charge.save()
            print(credit_charge)
        # Puedes acceder a los datos POST a través de request.POST
        
        # Realizar acciones basadas en la información del webhook
        # ...
    return HttpResponse()

@csrf_exempt
@require_http_methods(["GET", "POST"])
def webhook_payment_sale(request,uuid):
	print(uuid)
	if request.method == 'POST':
		body_unicode = request.body.decode('utf-8')
		body = json.loads(body_unicode)
		if body['status'] == "Aprobada":
			ppts = models.PendingPaymentTokenSale.objects.get(uuid=uuid)
			credit_charge = ppts.credit_charge
			credit_charge.transaction_id = body['transaccionId']
			credit_charge.status = body['status']
			credit_charge.save()
			print(credit_charge)
			sale = ppts.sale
			sale.status = 'A'
			sale.save()
			print(credit_charge)
			query_sale = models.Sale.objects.filter(id=ppts.sale.id).ratesAnnotate().first()
			print('ejecutado')
			sale_coupon_send_email(query_sale,request)
	return HttpResponse()

def sale_coupon_send_email(sale,request):
    from GeneralApp.views import EmailsViewSet
    from django.template.loader import get_template
    from io                     import BytesIO
    from xhtml2pdf              import pisa
    if sale.status == "C":
        return Response({
            'msg':"Venta cancelada"
        },400)
    email_recipients = sale.email.split(";")
    coupons = [SaleViewSet.print_coupon_data(sale,"ORIGINAL")]
    context = {
        'coupons' :   coupons,
        'sale_key':   sale.sale_key,
        'host'    :   request.get_host()
    }
    template = get_template('new_sale_coupon_template.html')
    html  = template.render(context)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("latin-1",'replace')), result)
    if not pdf.err:
        email = EmailsViewSet.prepare_html_email_from_template_pdf_attach("emails/coupon-sale/template.html",
                {'sale' : serializers.SaleSerializer(sale).data,},
                email_recipients,
                "Cupon de venta:" + str(sale.sale_key) + ".pdf",
                result
            )
        email.send()
    return Response({'success':True, 'email': sale.email})

def delete_element_safe(object,element):
    try:
        del object[element]
    except:
        pass
    return object

def daterange(start_date, due_date):
    due_date = due_date + timedelta(1)
    for n in range(int((due_date - start_date).days)):
        yield start_date + timedelta(n)

def reform_text(text):
    characters = (
        ('Á','A'),
        ('É','E'),
        ('Í','I'),
        ('Ó','O'),
        ('Ú','U'),
        ('á','a'),
        ('é','e'),
        ('í','i'),
        ('ó','o'),
        ('ú','u')
    )
    for character in characters:
        text_ = text.replace(character[0], character[1])
        text = text_
    return text

def log(sale_key, status, type, user_extension, field, old_data, new_data):
    try:
        reservation_log = models.SaleLog(
            sale_key=sale_key,
            status=status,
            type=type,
            user_extension=user_extension,
            field=field,
            old_data=old_data,
            new_data=new_data,
        )
        reservation_log.save()
    except Exception as e:
        print(e)

def opera_credentials(property):
    HOSTOPERA = getattr(serverconfig,"HOSTOPERA","opera-ows-qas.rcdhotels.com")
    USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERA","IFC.CANTO")
    USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORD","OPERA2024")
    if property.code == "VP-UNICO":
        HOSTOPERA = getattr(serverconfig,"HOSTOPERAUNICO","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERAUNICO","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORDUNICO","OPERA2024")
    if property.code == "VP-NOBU":
        HOSTOPERA = getattr(serverconfig,"HOSTOPERANOBU","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERANOBU","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORDNOBU","OPERA2024")
    if property.code == "VP-AVACUN":
        HOSTOPERA = getattr(serverconfig,"HOSTOPERAAVA","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERAAVA","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORDAVA","OPERA2024")
    return {
        'HOSTOPERA':HOSTOPERA,
        'USERNAMEOPERA':USERNAMEOPERA,
        'USERNAMEPASSWORD':USERNAMEPASSWORD,
    }

def schedule_by_datetime(service_date,availability_group,time):
    week_num = service_date.weekday()
    availabilities = models.Availability.objects.dateSimple(service_date).filter(availability_group=availability_group)
    for availability in availabilities:
        if availability.schedule_1 is not None:
            schedule = schedule_valid(availability.schedule_1,week_num,time)
            if schedule is not None:
                return schedule
        if availability.schedule_2 is not None:
            schedule = schedule_valid(availability.schedule_2,week_num,time)
            if schedule is not None:
                return schedule
        if availability.schedule_3 is not None:
            schedule = schedule_valid(availability.schedule_3,week_num,time)
            if schedule is not None:
                return schedule
        if availability.schedule_4 is not None:
            schedule = schedule_valid(availability.schedule_4,week_num,time)
            if schedule is not None:
                return schedule
        if availability.schedule_5 is not None:
            schedule = schedule_valid(availability.schedule_5,week_num,time)
            if schedule is not None:
                return schedule
        if availability.schedule_6 is not None:
            schedule = schedule_valid(availability.schedule_6,week_num,time)
            if schedule is not None:
                return schedule
        if availability.schedule_7 is not None:
            schedule = schedule_valid(availability.schedule_7,week_num,time)
            if schedule is not None:
                return schedule
    return None
    
def schedule_valid(schedule,week_num,time):
    if schedule.time == time:
        if week_num == 0 and schedule.MON is True:
            return schedule
        if week_num == 1 and schedule.TUE is True:
            return schedule
        if week_num == 2 and schedule.WED is True:
            return schedule
        if week_num == 3 and schedule.THU is True:
            return schedule
        if week_num == 4 and schedule.FRI is True:
            return schedule
        if week_num == 5 and schedule.SAT is True:
            return schedule
        if week_num == 6 and schedule.SUN is True:
            return schedule
    return None

def schedule_availables(service_date,availability_group,property,sale,time):
    week_num = service_date.weekday()
    schedules = []
    availabilities = models.Availability.objects.dateSimple(service_date).filter(availability_group=availability_group)
    for availability in availabilities:
        if availability.schedule_1 is not None:
            data = schedule_available_data(availability_group,availability.schedule_1,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
        if availability.schedule_2 is not None:
            data = schedule_available_data(availability_group,availability.schedule_2,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
        if availability.schedule_3 is not None:
            data = schedule_available_data(availability_group,availability.schedule_3,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
        if availability.schedule_4 is not None:
            data = schedule_available_data(availability_group,availability.schedule_4,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
        if availability.schedule_5 is not None:
            data = schedule_available_data(availability_group,availability.schedule_5,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
        if availability.schedule_6 is not None:
            data = schedule_available_data(availability_group,availability.schedule_6,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
        if availability.schedule_7 is not None:
            data = schedule_available_data(availability_group,availability.schedule_7,week_num,service_date,sale,property,time)
            if data is not None:
                schedules.append(data)
    if time is not None:
        time_text = time_to_text(time)
        for schedule in schedules:
            if schedule['time'] == time_text:
                return schedule
        return None

    return schedules
    
def time_to_text(time):
    text_time = None
    if time is not None and time != "":
        try:
            # Intenta analizar el campo de texto como %H:%M:%S
            text_time = time.strftime("%H:%M")
        except ValueError:
            print("Formato no válido. Se requiere %H:%M:%S o %H:%M.")
    return text_time
        
def schedule_available_data(availability_group,schedule,week_num,service_date,sale,property,time):
    from django.db.models import Sum, F, IntegerField
    schedule_allotment_exist = False
    if time is not None:
        if schedule.time != time:
            return None
    if sale is not None and time is not None and sale.time == schedule.time:
        schedule_allotment_exist = False
    else:
        schedule_allotment_exist = models.ScheduleAllotment.objects.filter(availability_group=availability_group,schedule_time=schedule.time,start_date=service_date,active=False,property=property).exists()
    if schedule.active is True and schedule_allotment_exist is False: 
        schedule_data = serializers.ScheduleSaleSerializer(schedule).data
        if sale is not None:
            total = models.Sale.objects.filter(service__availability_group=availability_group,service_date=service_date,time=schedule.time,status__in=["A","B"]).exclude(id=sale.id).aggregate(
                total=Sum(
                    F("adults") + F("childs"),
                    output_field=IntegerField()
                ))['total']
            total_refund = models.Sale.objects.filter(service__availability_group=availability_group,service_date=service_date,time=schedule.time,status="R").exclude(id=sale.id).aggregate(
                total=Sum(
                    F("adults") + F("childs"),
                    output_field=IntegerField()
                ))['total']
        else:
            total = models.Sale.objects.filter(service__availability_group=availability_group,service_date=service_date,time=schedule.time,status__in=["A","B"]).aggregate(total=Sum(
                    F("adults") + F("childs"),
                    output_field=IntegerField()
                ))['total']
            total_refund = models.Sale.objects.filter(service__availability_group=availability_group,service_date=service_date,time=schedule.time,status="R").aggregate(
                total=Sum(
                    F("adults") + F("childs"),
                    output_field=IntegerField()
                ))['total']
        total = 0 if total is None else total
        total_refund = 0 if total_refund is None else total_refund
        schedule_data['reserved'] = total - total_refund
        if schedule_data['limit'] > schedule_data['reserved']:
            if week_num == 0 and schedule.MON is True:
                return schedule_data
            if week_num == 1 and schedule.TUE is True:
                return schedule_data
            if week_num == 2 and schedule.WED is True:
                return schedule_data
            if week_num == 3 and schedule.THU is True:
                return schedule_data
            if week_num == 4 and schedule.FRI is True:
                return schedule_data
            if week_num == 5 and schedule.SAT is True:
                return schedule_data
            if week_num == 6 and schedule.SUN is True:
                return schedule_data
    return None

# Create your views here.
class PaymentTypeViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.PaymentType.objects.all()
    serializer_class = serializers.PaymentTypeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name',)
    filter_fields = ('id', 'name', 'is_commissionable',)

class ClientTypeViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.ClientType.objects.all()
    serializer_class = serializers.ClientTypeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'property__name',)
    filter_fields = ('id', 'name','property',)

class PaymentMethodViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.PaymentMethod.objects.all()
    serializer_class = serializers.PaymentMethodSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name','payment_type__name', 'property__name',)
    ordering_fields = ('id', 'name', 'payment_type__name', 'currency', 'room_charge', 'card_charge', 'store_card_charge', 'courtesy', 'is_service_fee')
    filter_fields = ('id', 'name', 'payment_type', 'currency', 'room_charge', 'card_charge', 'store_card_charge', 'courtesy', 'is_service_fee', 'sale_types', 'property',)

class ServiceRateViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.ServiceRate.objects.all()
    serializer_class = serializers.ServiceRateSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('start_date', 'due_date', 'service__name', 'service__provider__name', 'currency', 'adult_price', 'child_price', 'hard_rock_comission_adult', 'hard_rock_comission_child','exent_import_adult', 'exent_import_child', 'property__name',)
    ordering_fields = ('start_date', 'due_date', 'service__name', 'adult_price', 'child_price', 'currency','exent_import')
    filter_fields = ('id', 'start_date', 'due_date', 'service', 'currency', 'adult_price', 'child_price', 'hard_rock_comission_adult', 'hard_rock_comission_child','exent_import_adult', 'exent_import_child', 'property',)

    def service_report_print(self, request):
        from SalesApp.controllers import ServiceListController
        type = request.GET['type']
        file = request.GET['file']
        print_due = True if request.GET['print_due'] == 'true' else False
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        services = request.GET.get('services','')
        if services != '':
            services = services.split(',')
        else:
            services = []
        providers = request.GET.get('providers','')
        if providers != '':
            providers = providers.split(',')
        else:
            providers = []
        report_list = ServiceListController(
            request,
            date,
            print_due,
            property,
            type,
            file,
            services,providers)
        return report_list.get_context()

class ServiceRateComissionViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.ServiceRateComission.objects.all()
    serializer_class = serializers.ServiceRateComissionSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('payment_type', 'payment_type__name', 'comission')
    ordering_fields = ('payment_type__name', 'comission')
    filter_fields = ('id', 'service_rate', 'payment_type', 'comission')

class CoordinatorsComissionViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.CoordinatorsComission.objects.all()
    serializer_class = serializers.CoordinatorsComissionSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('date', 'comission','property__name')
    ordering_fields = ('date', 'comission')
    filter_fields = ('id', 'date','comission','property',)

class AvailabilityViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Availability.objects.all()
    serializer_class = serializers.AvailabilitySerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('start_date', 'due_date', 'availability_group', 'availability_group__name',)
    ordering_fields = ('id', 'start_date', 'due_date', 'availability_group__name',
            'schedule_1__time',
            'schedule_2__time',
            'schedule_3__time',
            'schedule_4__time',
            'schedule_5__time',
            'schedule_6__time',
            'schedule_7__time')
    filter_fields = ('id', 'start_date', 'due_date', 'availability_group')

    def create(self, request):
        availability_data = request.data
        availability = models.Availability()
        availability = self.save_availability(availability_data,availability)
        unavailable_sales = self.checksales(availability.availability_group)
        return Response({
            'availability':serializers.AvailabilitySerializer(availability).data,
            'unavailable_sales':unavailable_sales
        })

    def update(self, request, pk):
        availability_data = request.data
        availability = models.Availability.objects.get(id=pk)
        availability = self.save_availability(availability_data,availability)
        unavailable_sales = self.checksales(availability.availability_group)
        return Response({
            'availability':serializers.AvailabilitySerializer(availability).data,
            'unavailable_sales':unavailable_sales
        })
    
    def availability_clone_from(self, request, pk):
        availability_data = request.data
        availability = models.Availability.objects.get(id=pk)
        start_date = datetime.strptime(availability_data['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(availability_data['due_date'], '%Y-%m-%d').date()
        availability_data['id'] = None
        availability_data['schedule_1']['id'] = None
        availability_data['schedule_2']['id'] = None
        availability_data['schedule_3']['id'] = None
        availability_data['schedule_4']['id'] = None
        availability_data['schedule_5']['id'] = None
        availability_data['schedule_6']['id'] = None
        availability_data['schedule_7']['id'] = None
        if due_date < start_date:
            raise CustomValidation('La disponibilidad no puede vencer antes del inicio.', 'due_date', status.HTTP_400_BAD_REQUEST)
        elif start_date <= availability.start_date and due_date >= availability.due_date:
            raise CustomValidation('El corte de fecha no puede reemplazar por completo el periodo actual.', 'due_date', status.HTTP_400_BAD_REQUEST)
        elif due_date < availability.start_date or start_date > availability.due_date:
            raise CustomValidation('El corte de fecha no puede ser fuera del periodo actual.', 'due_date', status.HTTP_400_BAD_REQUEST)
        elif start_date < availability.start_date and due_date < availability.due_date:
            raise CustomValidation('El corte de fecha no puede ser antes del periodo actual.', 'due_date', status.HTTP_400_BAD_REQUEST)
        else:
            if start_date == availability.start_date and due_date < availability.due_date:
                availability.start_date = due_date + timedelta(days=1)
                availability.save()
                new_availability = self.save_availability_with_pickups(availability_data,availability,models.Availability())
            elif start_date > availability.start_date and due_date == availability.due_date:
                availability.due_date = start_date - timedelta(days=1)
                availability.save()
                new_availability = self.save_availability_with_pickups(availability_data,availability,models.Availability())
            elif start_date > availability.start_date and due_date > availability.due_date:
                availability.due_date = start_date - timedelta(days=1)
                availability.save()
                new_availability = self.save_availability_with_pickups(availability_data,availability,models.Availability())
            else:
                clone_availability_due_date = availability.due_date
                availability.due_date = start_date - timedelta(days=1)
                availability.save()
                new_availability = self.save_availability_with_pickups(availability_data,availability,models.Availability())
                clone_availability_start_date = due_date + timedelta(days=1)
                clone_availability = self.clone_availability(clone_availability_start_date,clone_availability_due_date,availability)

        unavailable_sales = self.checksales(new_availability.availability_group)
        return Response({
            'availability':serializers.AvailabilitySerializer(new_availability).data,
            'unavailable_sales':unavailable_sales
        })

                
    def save_availability_with_pickups(self,availability_data,origin_availability,availability):
        availability.start_date = availability_data['start_date']
        availability.due_date = availability_data['due_date']
        availability.availability_group = models.AvailabilityGroup.objects.get(pk=availability_data['availability_group'])

        availability.schedule_1 = self.save_schedule(availability_data['schedule_1'])
        if availability.schedule_1 is not None and origin_availability.schedule_1 is not None:
            self.create_schedule_pickups(origin_availability.schedule_1,availability.schedule_1)

        availability.schedule_2 = self.save_schedule(availability_data['schedule_2'])
        if availability.schedule_2 is not None and origin_availability.schedule_2 is not None:
            self.create_schedule_pickups(origin_availability.schedule_2,availability.schedule_2)

        availability.schedule_3 = self.save_schedule(availability_data['schedule_3'])
        if availability.schedule_3 is not None and origin_availability.schedule_3 is not None:
            self.create_schedule_pickups(origin_availability.schedule_3,availability.schedule_3)

        availability.schedule_4 = self.save_schedule(availability_data['schedule_4'])
        if availability.schedule_4 is not None and origin_availability.schedule_4 is not None:
            self.create_schedule_pickups(origin_availability.schedule_4,availability.schedule_4)

        availability.schedule_5 = self.save_schedule(availability_data['schedule_5'])
        if availability.schedule_5 is not None and origin_availability.schedule_5 is not None:
            self.create_schedule_pickups(origin_availability.schedule_5,availability.schedule_5)

        availability.schedule_6 = self.save_schedule(availability_data['schedule_6'])
        if availability.schedule_6 is not None and origin_availability.schedule_6 is not None:
            self.create_schedule_pickups(origin_availability.schedule_6,availability.schedule_6)

        availability.schedule_7 = self.save_schedule(availability_data['schedule_7'])
        if availability.schedule_7 is not None and origin_availability.schedule_7 is not None:
            self.create_schedule_pickups(origin_availability.schedule_7,availability.schedule_7)

        availability.save()
        return availability

    def save_availability(self,availability_data,availability):
        availability.start_date = availability_data['start_date']
        availability.due_date = availability_data['due_date']
        availability.availability_group = models.AvailabilityGroup.objects.get(pk=availability_data['availability_group'])
        availability.schedule_1 = self.save_schedule(availability_data['schedule_1'])
        availability.schedule_2 = self.save_schedule(availability_data['schedule_2'])
        availability.schedule_3 = self.save_schedule(availability_data['schedule_3'])
        availability.schedule_4 = self.save_schedule(availability_data['schedule_4'])
        availability.schedule_5 = self.save_schedule(availability_data['schedule_5'])
        availability.schedule_6 = self.save_schedule(availability_data['schedule_6'])
        availability.schedule_7 = self.save_schedule(availability_data['schedule_7'])
        availability.save()
        return availability

    def save_schedule(self,schedule_data):
        if schedule_data['id'] is not None:
            schedule = models.Schedule.objects.get(pk=schedule_data['id'])
        elif schedule_data['active'] is False:
            return None
        else:
            schedule = models.Schedule()
        schedule.active = schedule_data['active']
        schedule.limit = schedule_data['limit']
        schedule.time = schedule_data['time']
        schedule.MON = schedule_data['MON']
        schedule.TUE = schedule_data['TUE']
        schedule.WED = schedule_data['WED']
        schedule.THU = schedule_data['THU']
        schedule.FRI = schedule_data['FRI']
        schedule.SAT = schedule_data['SAT']
        schedule.SUN = schedule_data['SUN']
        schedule.save()
        return schedule
    
    def create_schedule_pickups(self,origin_availability_schedule,availability_schedule):
        schedule_pickups = models.SchedulePickUp.objects.filter(schedule=origin_availability_schedule)
        for schedule_pickup in schedule_pickups:
            schedule_pickup.id = None
            schedule_pickup.schedule = availability_schedule
            schedule_pickup.save()
    
    def checksales(self,availability_group):
        unavailable_sales = []
        today = date.today()
        sales = models.Sale.objects.filter(status__in=["A","B"],service_date__gte=today,service__availability_group=availability_group).saleRefundMark().filter(has_refund=False).order_by("service_date","time")
        for sale in sales:
            schedule = schedule_by_datetime(sale.service_date,availability_group,sale.time)
            if schedule is None:
                unavailable_sales.append({
                    'id':sale.sale_key,
                    'date':sale.service_date,
                    'name':sale.service.name,
                    'time':sale.time,
                })
        return unavailable_sales
    
    def clone_availability(self,start_date, due_date, origin_availability):
        availability = models.Availability()
        availability.start_date = start_date
        availability.due_date = due_date
        availability.availability_group = origin_availability.availability_group

        if origin_availability.schedule_1 is not None:
            availability.schedule_1 = self.clone_schedule(origin_availability.schedule_1)
        
        if origin_availability.schedule_2 is not None:
            availability.schedule_2 = self.clone_schedule(origin_availability.schedule_2)

        if origin_availability.schedule_3 is not None:
            availability.schedule_3 = self.clone_schedule(origin_availability.schedule_3)

        if origin_availability.schedule_4 is not None:
            availability.schedule_4 = self.clone_schedule(origin_availability.schedule_4)

        if origin_availability.schedule_5 is not None:
            availability.schedule_5 = self.clone_schedule(origin_availability.schedule_5)

        if origin_availability.schedule_6 is not None:
            availability.schedule_6 = self.clone_schedule(origin_availability.schedule_6)

        if origin_availability.schedule_7 is not None:
            availability.schedule_7 = self.clone_schedule(origin_availability.schedule_7)
        availability.save()

    def clone_schedule(self,orginal_schedule):
        schedule = models.Schedule()
        schedule.active = orginal_schedule.active
        schedule.limit = orginal_schedule.limit
        schedule.time = orginal_schedule.time
        schedule.MON = orginal_schedule.MON
        schedule.TUE = orginal_schedule.TUE
        schedule.WED = orginal_schedule.WED
        schedule.THU = orginal_schedule.THU
        schedule.FRI = orginal_schedule.FRI
        schedule.SAT = orginal_schedule.SAT
        schedule.SUN = orginal_schedule.SUN
        schedule.save()
        self.create_schedule_pickups(orginal_schedule,schedule)
        return schedule



class ScheduleViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Schedule.objects.all()
    serializer_class = serializers.ScheduleSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('id',)
    filter_fields = ('id',)

class SchedulePickUpViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.SchedulePickUp.objects.all()
    serializer_class = serializers.SchedulePickUpSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('id','hotel__name','schedule__time')
    filter_fields = ('id','hotel','schedule')

class ScheduleAllotmentViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.ScheduleAllotment.objects.all()
    serializer_class = serializers.ScheduleAllotmentSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('id','property__name','schedule__time')
    filter_fields = ('id','start_date','schedule_time','availability_group__name','property',)

    def allotment_list(self,request):
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        service = None
        if request.GET.get('service',"") != "":
            service = Service.objects.get(id=request.GET['service'])
        availability_group = None
        if request.GET.get('availability_group',"")  != "":
            availability_group = AvailabilityGroup.objects.get(id=request.GET['availability_group'])
        group = None
        if request.GET.get('group',"") != "":
            group = Groupofgroup.objects.get(id=request.GET['group'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        schedule_ids = []
        for date in daterange(start_date, due_date):
            schedules = models.Schedule.objects.filterByDate(date,property)
            if service is not None:
                schedules = schedules.filterByService(service)
            if availability_group is not None:
                schedules = schedules.filterByAvailabilityGroup(availability_group)
            if group is not None:
                schedules = schedules.filterByGroup(group)
            for schedule in schedules:
                schedule_ids.append(self.update_allotment_list(date,schedule,property))
        allotments = serializers.ScheduleAllotmentSerializer(models.ScheduleAllotment.objects.filter(id__in=schedule_ids).order_by('start_date','availability_group__name','schedule_time'),many=True).data
        return Response(allotments)
    
    def update_allotment_list(self,date,schedule,property):
        availability_group = self.get_availability_group(schedule)
        try:
            schedule_allotment = models.ScheduleAllotment.objects.get(
                availability_group=availability_group,
                schedule_time=schedule.time,
                start_date=date,
                property=property
            )
        except Exception as e:
            print(e)
            schedule_allotment = models.ScheduleAllotment()
            schedule_allotment.schedule_time = schedule.time
            schedule_allotment.availability_group = availability_group
            schedule_allotment.start_date = date
            schedule_allotment.property = property
            schedule_allotment.save()
        return schedule_allotment.id
    
    def get_availability_group(self, schedule):
        if schedule.availabilities_schedule_1.all().count() > 0:
            availability_group = schedule.availabilities_schedule_1.first().availability_group
            return availability_group
        if schedule.availabilities_schedule_2.all().count() > 0:
            availability_group = schedule.availabilities_schedule_2.first().availability_group
            return availability_group
        if schedule.availabilities_schedule_3.all().count() > 0:
            availability_group = schedule.availabilities_schedule_3.first().availability_group
            return availability_group
        if schedule.availabilities_schedule_4.all().count() > 0:
            availability_group = schedule.availabilities_schedule_4.first().availability_group
            return availability_group
        if schedule.availabilities_schedule_5.all().count() > 0:
            availability_group = schedule.availabilities_schedule_5.first().availability_group
            return availability_group
        if schedule.availabilities_schedule_6.all().count() > 0:
            availability_group = schedule.availabilities_schedule_6.first().availability_group
            return availability_group
        if schedule.availabilities_schedule_7.all().count() > 0:
            availability_group = schedule.availabilities_schedule_7.first().availability_group
            return availability_group
        return None
    
    def allotment_patch(self,request):
        allotment_data = request.data
        models.ScheduleAllotment.objects.filter(id__in=allotment_data['schedule_allotments']).update(active=allotment_data['active'])
        return Response()

class AuthDiscountViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.AuthDiscount.objects.all()
    serializer_class = serializers.AuthDiscountSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('timestamp', 'discount_key', 'sale__sale_key', 'sale__discount', 'sale__discount_type', 'sale__representative__name', 'user_extension__user__username')
    ordering_fields = ('timestamp', 'discount_key', 'sale__sale_key', 'sale__discount', 'sale__discount_type', 'sale__representative__name', 'user_extension__user__username')
    filter_fields = ('id','timestamp', 'discount_key', 'sale', 'user_extension')

class DiscountViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Discount.objects.all()
    serializer_class = serializers.DiscountSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('id','start_date', 'due_date', 'discount', 'conditional__name', 'sale_type__name')
    ordering_fields = ('id', 'start_date', 'due_date', 'discount', 'conditional__name', 'sale_type__name')
    filter_fields = ('id','start_date', 'due_date', 'discount', 'conditional_content_type', 'conditional_object_id', 'sale_type')

    def conditional_content_types(self,request):
        content_types = ContentType.objects.filter(model__in=["clienttype","provider","service"])
        content_types_data = []
        choices = dict(models.Discount.choices)
        for content_type in content_types:
            content_types_data.append({
                'id':content_type.id,
                'name':choices[content_type.model],
                'model':content_type.model
            })
        return Response(content_types_data)

class SaleTableFilterSet(FilterSet):
    sale_date = DateFromToRangeFilter(field_name='sale_date')
    service_date = DateFromToRangeFilter(field_name='service_date')
    name_pax = CharFilter(field_name='name_pax',lookup_expr='icontains')
    class Meta:
        model = models.Sale
        fields = [
            'status', 'sale_key', 'sale_key_manual', 'name_pax', 'email', 'service__name',
            'user_extension', 'user_extension__user__username',
            'sale_type__name', 'service_date', 'sale_date',
            'hotel__name', 'representative__name', 'email',]

class SaleLogViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.SaleLog.objects.all()
    serializer_class = serializers.SaleLogSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('timestamp', 'type', 'user_extension__user__name', 'field', 'old_data', 'new_data',)
    ordering_fields = ('sale_key', 'status', 'timestamp', 'type', 'user_extension__user__name', 'field', 'old_data', 'new_data',)
    filter_fields = ('id', 'sale_key', 'status', 'timestamp', 'type', 'user_extension', 'field', 'old_data', 'new_data',)

    def get_queryset(self):
        queryset = self.queryset
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.propertyAnnotate(user_extension).distinct()
        return queryset

class SaleTableViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.Sale.objects.all()
    serializer_class = serializers.SaleTableSerializer
    filterset_class = SaleTableFilterSet
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('sale_key', 'sale_key_manual', 'user_extension__user__username', 
        'service_date', 'sale_date', 'sale_type__name', 'comments', 
        'property__name',)
    order_fields =(
        'sale_date','sale_type__name','name_pax',
        'service_date','hotel__name',
        'representative__name'
    )
    
    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.tableOptimization()
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.bySameProperty(user_extension).distinct()
        return queryset
    
class SaleViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes_by_action = {'date_for_sale': [permissions.AllowAny],
                                    'sale_report_print': [permissions.IsAuthenticated,HasReportPermissions|IsSuperuser],
                                    'operations_list': [permissions.IsAuthenticated,HasManifestViewPermissions|IsSuperuser],
                                    'operations_list_date': [permissions.IsAuthenticated,HasManifestViewPermissions|IsSuperuser],
                                    'operations_unit_set_asigment': [permissions.IsAuthenticated,HasManifestEditPermissions|IsSuperuser],
                                    'default': (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions),}
    
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.Sale.objects.all().tableOptimization()
    serializer_class = serializers.SaleSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('status', 'sale_key', 'name_pax', 'time',
        'user_extension__name', 'representative__name', 'service__name', 'service_date',
        'hotel__name', 'sale_type__name','room',
        'confirm_provider', 'comments', 
        'property', 'property__name',)
    filter_fields = ('id', 'status', 'sale_key', 'name_pax', 'time',
        'user_extension', 'representative', 'service', 'service_date', 'schedule', 
        'hotel', 'sale_type', 'adults', 'childs',
        'discount_type', 'discount',
        'overcharged', 'room', 'confirm_provider', 
        'comments', 'property',)
    
    def get_permissions(self):
        try:
            return [permission() for permission in self.permission_classes_by_action[self.action]]
        except KeyError as e:
            return [permission() for permission in self.permission_classes_by_action['default']]
    
    def sale_reservation_search(self,request):
        from OperationsApp.models import Reservation, ReservationService
        from GeneralApp.models import SaleType
        from GeneralApp.serializers import SaleTypeSerializer
        from SalesApp.serializers import ServiceRateSerializer
        reservation_number = int(request.GET['reservation_number'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        sale_reservations = []
        no_services = ""
        reservation_services = ReservationService.objects.filter(reservation__status='NORMAL',reservation__id=reservation_number,service__properties__in=[property])
        if reservation_services.exists(): 
            for reservation_service in reservation_services:
                service_rate = models.ServiceRate.objects.dateSimple(reservation_service.date).filter(service=reservation_service.service).order_by("start_date").first()
                schedule_sale = True
                if reservation_service.service.availability_group is not None:
                    schedules = schedule_availables(reservation_service.date,reservation_service.service.availability_group,property,None,None)
                    schedule_sale = True if len(schedules) > 0 else False
                
                if service_rate is None:
                    no_services += reservation_service.service.name + ": Este servicio no tiene tarifa \n"
                elif schedule_sale == False:
                    no_services += reservation_service.service.name + ": Este servicio no tiene disponibilidad \n"
                elif models.Sale.objects.filter(sale_reservation_id=reservation_number,reservation_service=reservation_service,status='A').exists():
                    no_services += reservation_service.service.name + ": Ya existe una venta para este servicio \n"
                else:
                    sale_type = SaleType.objects.filter(name=reservation_service.reservation.sale_type.name,property=property).first()
                    representative_id = reservation_service.reservation.user_extension.representative.id if reservation_service.reservation.user_extension.representative is not None else None
                    representative_name = ""
                    if representative_id is not None:
                        representative_name = reservation_service.reservation.user_extension.representative.name
                    else:
                        representative_id = user_extension.representative.id if user_extension.representative is not None else None
                        representative_name = ""
                        if representative_id is not None:
                            representative_name = user_extension.representative.name
                    sale_reservation = {
                        'id':None,
                        'status':"A",
                        'name_pax':reservation_service.reservation.pax,
                        'email':reservation_service.reservation.email,
                        'sale_reservation_id':reservation_number,
                        'reservation_service':reservation_service.id,
                        'user_extension':user_extension.id,
                        'user_extension_name':user_extension.user.username,
                        'sale_date':datetime.now(),
                        'representative':representative_id,
                        'representative_name':representative_name,
                        'sale_service_fee':False,
                        'service_fee':20,
                        'sale_key':None,
                        'service':reservation_service.service.id,
                        'service_data':ServiceSerializer(reservation_service.service).data,
                        'service_date':reservation_service.date,
                        'service_rate':service_rate.id,
                        'service_rate_data':ServiceRateSerializer(service_rate).data,
                        'schedule':None,
                        'schedule_data':None,
                        'schedule_time':"",
                        'schedule_max':0,
                        'schedule_reserved':0,
                        'time':"",
                        'address':reservation_service.reservation.address,
                        'sale_type':sale_type.id if sale_type is not None else None,
                        'sale_type_data':SaleTypeSerializer(sale_type).data if sale_type is not None else None,
                        'client_type':None,
                        'client_type_data':None,
                        'adults':reservation_service.adults if reservation_service.service.is_colective == True else 1,
                        'childs':reservation_service.childs if reservation_service.service.is_colective == True else 0,
                        'discount_type':"amount",
                        'discount':0,
                        'overcharged':0,
                        'hotel':reservation_service.destination.id if reservation_service.transfer_type == "ARRIVALS" else reservation_service.origin.id,
                        'hotel_name':reservation_service.destination.name if reservation_service.transfer_type == "ARRIVALS" else reservation_service.origin.name,
                        'room':reservation_service.room,
                        'confirm_provider':"",
                        'comments':reservation_service.comments,
                        'comments_coupon': "",
                        'property':property.id,
                        'sale_payments':[]
                    }
                    sale_reservations.append(sale_reservation)
                    
            if len(sale_reservations) == 0:
                raise CustomValidation('Servicios no disponibles \n{}'.format(no_services), 'error', status.HTTP_400_BAD_REQUEST)
        else:
            raise CustomValidation('No se encontro la reservación o no es valida para esta propiedad', 'error', status.HTTP_400_BAD_REQUEST)
        return Response(sale_reservations)
        
    def sale_discount(self,request):
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        client_type = models.ClientType.objects.get(id=request.GET['client_type'])
        service = Service.objects.get(id=request.GET['service'])
        sale_type = SaleType.objects.get(id=request.GET['sale_type'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        discounts = models.Discount.objects.dateSimple(date).filter(property=property,sale_type=sale_type)
        if discounts.exists():
            if discounts.filter(service=service).exists():
                return Response(serializers.DiscountSerializer(discounts.filter(service=service).first()).data)
            if discounts.filter(provider=service.provider).exists():
                return Response(serializers.DiscountSerializer(discounts.filter(provider=service).first()).data)
            if discounts.filter(client_type=client_type).exists():
                return Response(serializers.DiscountSerializer(discounts.filter(client_type=client_type).first()).data)
        return Response({
            'msg':"No hay descuento."
        },404)

    def discount_key_search(self, request):
        discount_key = int(request.GET['discount_key'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        auth_discount = models.AuthDiscount.objects.filter(discount_key=discount_key,property=property,sale=None).first()
        if auth_discount is None:
            return Response({
                'id':None
            })
        return Response(serializers.AuthDiscountSerializer(auth_discount).data)
    
    def sale_service_rate(self, request):
        service_date = datetime.strptime(request.GET['service_date'], '%Y-%m-%d').date()
        service = Service.objects.get(id=request.GET['service'])
        service_rate = models.ServiceRate.objects.dateSimple(service_date).filter(service=service).order_by("start_date").first()
        if service_rate is not None:
            return Response({
                'data':serializers.ServiceRateSerializer(service_rate).data
            })
        else:
            return Response({
                'msg':"No hay tarifa"
            },404)
    
    def sale_schedule_available(self, request):
        service_date = datetime.strptime(request.GET['service_date'], '%Y-%m-%d').date()
        service = Service.objects.get(id=request.GET['service'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        sale = request.GET.get('sale', None)
        if sale is not None and sale != "":
            sale = models.Sale.objects.get(id=sale)
        else:
            sale = None
        return Response(schedule_availables(service_date,service.availability_group,property,sale,None))
    
    def date_for_sale(self, request):
        return Response(datetime.now())
    
    def sale_exchange_rate(self, request):
        from GeneralApp.serializers import ExchangeRateSerializer
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        exchange_rate = ExchangeRate.objects.filter(start_date__lte=date,type='SALE',property=property).order_by("-start_date").first()
        if exchange_rate is not None:
            return Response({
                'data':ExchangeRateSerializer(exchange_rate).data
            })
        else:
            return Response({
                'msg':"Tipo de cambio no encontrado"
            },404)
        
    def sale_services(self, request):
        from GeneralApp.serializers import ServiceSerializer
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        sale_service_fee = True if request.GET['sale_service_fee'] == "true" else False
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        services = Service.objects.dateSimple(date).filter(properties__in=[property],parent__isnull=not sale_service_fee).distinct().tableOptimization().tableOptimizationServiceFee()
        results = ServiceSerializer(services,many=True).data
        return Response({
            'results':results
        })
    
    @transaction.atomic
    def create(self, request):
        from django.db.models import Max
        try:
            sale_data = request.data
            auth_discount = None
            if sale_data.get('discount_data', None) is not None:
                auth_discount = models.AuthDiscount.objects.filter(id=sale_data['discount_data']['id'],sale=None).first()
                if auth_discount is None:
                    raise CustomValidation('Descuento: No existe o no esta disponible la autorizacion de descuento {}'.format(sale_data['discount_data']['discount_key']), 'error', status.HTTP_400_BAD_REQUEST)
            sale_payments = request.data.pop('sale_payments')
            service = Service.objects.filter(id=sale_data['service']).first()
            if sale_data['time'] is not None and service.availability_group is not None:
                time = self.text_to_time(sale_data['time'])
                property = Property.objects.filter(id=sale_data['property']).first()
                if self.check_availability(sale_data['adults'],sale_data['childs'],service,sale_data['service_date'],time,property,None) == False:
                    raise CustomValidation('Venta: no hay disponibilidad para el servicio, revise las fechas o la hora', 'error', status.HTTP_400_BAD_REQUEST)
            sale_data = self.reform_sale_data(sale_data)
            #max_sale_key = models.Sale.objects.latest('sale_key').sale_key
            """ sale = models.Sale.objects.select_for_update().order_by('-sale_key').first()
            try:
                sale_data['sale_key'] = sale.sale_key + 1 if sale is not None else 1
                sale_data['sale_date'] = datetime.now()
                new_sale = models.Sale(**sale_data)
                new_sale.save()
            except models.Sale.SaleKeyDuplicateException:
                sale_data['sale_key'] = sale_data['sale_key'] + 1
                sale_data['sale_date'] = datetime.now()
                new_sale = models.Sale(**sale_data)
                new_sale.save() """
            new_sale = self.new_sale_key(sale_data)
            user_extension = models.UserExtension.objects.get(user=request.user)
            log(new_sale.sale_key, new_sale.status,"Nueva venta",user_extension,None,None,None)
            if auth_discount is not None:
                auth_discount.sale = new_sale
                auth_discount.save()
            self.save_sale_payments(new_sale,sale_payments)
            return Response(serializers.SaleSerializer(new_sale).data)
        except models.Sale.SaleKeyDuplicateException:
            transaction.set_rollback(True)
            raise CustomValidation("Error en la secuencia, intente otra vez", 'error', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            if isinstance(e, CustomValidation):
                raise CustomValidation(e.detail['error'], 'error', status.HTTP_400_BAD_REQUEST)
            raise CustomValidation("Error: {}".format(e), 'error', status.HTTP_400_BAD_REQUEST)
        
    def new_sale_key(self,sale_data):
        tries = 1
        new_sale = None
        while new_sale is None and tries < 5:
            try:
                sale = models.Sale.objects.select_for_update().order_by('-sale_key').first()
                sale_data['sale_key'] = sale.sale_key + 1 if sale is not None else 1
                sale_data['sale_date'] = datetime.now()
                new_sale = models.Sale(**sale_data)
                new_sale.save()
            except models.Sale.SaleKeyDuplicateException:
                tries += 1
                new_sale = None
        if new_sale is not None:
            return new_sale
        raise models.Sale.SaleKeyDuplicateException
        
    def refund_sale_force(self, request, pk):
        sale = models.Sale.objects.get(pk=pk)
        if sale.status != "A" and sale.status != "P":
            return Response({
                'error':"Esta venta no es valida para reembolso."
            },400)
        if sale.status == "A": 
            today = date.today()
            sale_date = sale.sale_date.astimezone(timezone.get_current_timezone())
            if today <= sale_date.date():
                return Response({
                    'error':"Solo se pueden hacer reembolsos en dias posteriores a la venta."
                },403)
            sales = models.Sale.objects.filter(sale_key=sale.sale_key,status='R')
            if sales.exists():
                return Response({
                    'error':"Esta venta ya tiene un reembolso"
                },403)
            if not request.user.has_perm('SalesApp.sales_management'):
                return Response({
                    'error':"No tienes permitido hacer un reembolso de esta venta."
                },403)
        if sale.reservation_service is not None:
            sale.reservation_service = None
            sale.save()
        items = models.SalePayment.objects.filter(sale=sale)
        sale.id = None
        sale.status = 'R'
        sale.sale_date = datetime.now()
        sale.save()
        user_extension = models.UserExtension.objects.get(user=request.user)
        log(sale.sale_key, sale.status,"Reembolso de venta (Rembolso OPERA manual)",user_extension,None,None,None)
        for item in items:
            new_sale_payment = models.SalePayment()
            new_sale_payment.sale = sale
            new_sale_payment.payment_method = item.payment_method
            new_sale_payment.amount = item.amount
            new_sale_payment.department_cecos = item.department_cecos
            new_sale_payment.authorization = item.authorization
            new_sale_payment.save()
            if item.payment_method.room_charge is True:
                room_charger = models.RoomCharge()
                room_charger.sale_payment = new_sale_payment
                room_charger.reservation_opera_id = item.room_charges.reservation_opera_id
                room_charger.account = item.room_charges.account
                room_charger.hotel_code = item.room_charges.hotel_code
                room_charger.coupon = item.room_charges.coupon
                room_charger.room = item.room_charges.room
                room_charger.pax = item.room_charges.pax
                room_charger.save()
            if item.payment_method.store_card_charge is True:
                amount = new_sale_payment.amount if sale.status == "R" else -1 * new_sale_payment.amount
                if item.store_card_charge.store_card is not None:
                    self.store_card_charge_request(new_sale_payment,item.store_card_charge.store_card,amount)
        return Response(serializers.SaleSerializer(sale).data)
    
    def refund_sale(self, request, pk):
        sale = models.Sale.objects.get(pk=pk)
        if sale.status != "A" and sale.status != "P":
            return Response({
                'error':"Esta venta no es valida para reembolso."
            },400)
        if sale.status == "A": 
            today = date.today()
            sale_date = sale.sale_date.astimezone(timezone.get_current_timezone())
            if today <= sale_date.date():
                return Response({
                    'error':"Solo se pueden hacer reembolsos en dias posteriores a la venta."
                },403)
            sales = models.Sale.objects.filter(sale_key=sale.sale_key,status='R')
            if sales.exists():
                return Response({
                    'error':"Esta venta ya tiene un reembolso"
                },403)
            if not request.user.has_perm('SalesApp.sales_management'):
                return Response({
                    'error':"No tienes permitido hacer un reembolso de esta venta."
                },403)
        if sale.reservation_service is not None:
            sale.reservation_service = None
            sale.save()
        items = models.SalePayment.objects.filter(sale=sale)
        sale.id = None
        sale.status = 'R'
        sale.sale_date = datetime.now()
        sale.save()
        user_extension = models.UserExtension.objects.get(user=request.user)
        log(sale.sale_key, sale.status,"Reembolso de venta",user_extension,None,None,None)
        for item in items:
            new_sale_payment = models.SalePayment()
            new_sale_payment.sale = sale
            new_sale_payment.payment_method = item.payment_method
            new_sale_payment.amount = item.amount
            new_sale_payment.department_cecos = item.department_cecos
            new_sale_payment.authorization = item.authorization
            new_sale_payment.save()
            if item.payment_method.room_charge is True:
                self.refund_room_charge_request(sale,item,new_sale_payment)
            if item.payment_method.store_card_charge is True:
                amount = new_sale_payment.amount if sale.status == "R" else -1 * new_sale_payment.amount
                if item.store_card_charge.store_card is not None:
                    self.store_card_charge_request(new_sale_payment,item.store_card_charge.store_card,amount)
        return Response(serializers.SaleSerializer(sale).data)
    
    def refund_room_charge_request(self,sale,sale_payment,new_sale_payment):
        opera_key = opera_credentials(sale.property)
        HOSTOPERA = opera_key["HOSTOPERA"]
        USERNAMEOPERA = opera_key["USERNAMEOPERA"]
        USERNAMEPASSWORD = opera_key["USERNAMEPASSWORD"]
        url = "https://{}/OWS_WS_51/ResvAdvanced.asmx?op=PostCharge".format(HOSTOPERA)
        payload = (
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">\n"
            "   <soap:Header>\n"
            "       <OGHeader terminalID=\"CANTO\" xmlns=\"http://webservices.micros.com/og/4.3/Core/\">\n"
            "           <Origin systemType=\"WEB\" />\n"
            "           <Destination systemType=\"PMS\" />\n"
            "           <Authentication>\n"
            "               <UserCredentials>\n"
            "                   <UserName>{}</UserName>\n"
            "                    <UserPassword>{}</UserPassword>\n"
            "               </UserCredentials>\n"
            "           </Authentication>\n"
            "       </OGHeader>\n"
            "   </soap:Header>\n"
            "   <soap:Body>\n"
            "       <PostChargeRequest Account=\"{}\" xmlns=\"http://webservices.micros.com/og/4.3/ResvAdvanced/\" xmlns:c=\"http://webservices.micros.com/og/4.3/Common/\">\n>\n"
            "           <Posting ShortInfo=\"{}\" LongInfo=\"{}\" Charge=\"{}\">\n"
            "               <ReservationRequestBase>\n"
            "                   <HotelReference hotelCode=\"{}\"/>\n"
            "                   <ReservationID>\n"
            "                       <c:UniqueID type=\"EXTERNAL\" source=\"RESV_NAME_ID\">{}</c:UniqueID>\n"
            "                   </ReservationID>\n"
            "               </ReservationRequestBase>\n"
            "           </Posting>\n"
            "       </PostChargeRequest>\n"
            "   </soap:Body>\n"
            "</soap:Envelope>"
        ).format(USERNAMEOPERA,USERNAMEPASSWORD,
            escape(sale_payment.room_charges.account),
            escape(sale_payment.room_charges.coupon),
            escape(sale_payment.room_charges.coupon),
            sale_payment.amount * -1,
            escape(sale_payment.room_charges.hotel_code),
            escape(sale_payment.room_charges.reservation_opera_id))
        headers = {
            'Host': HOSTOPERA,
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://webservices.micros.com/ows/5.1/ResvAdvanced.wsdl#PostCharge'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            my_dict = xmltodict.parse(response.text)
            if my_dict['soap:Envelope']['soap:Body']['PostChargeResponse']['Result']['@resultStatusFlag'] == "SUCCESS":
                room_charger = models.RoomCharge()
                room_charger.sale_payment = new_sale_payment
                room_charger.reservation_opera_id = sale_payment.room_charges.reservation_opera_id
                room_charger.account = sale_payment.room_charges.account
                room_charger.hotel_code = sale_payment.room_charges.hotel_code
                room_charger.coupon = sale_payment.room_charges.coupon
                room_charger.room = sale_payment.room_charges.room
                room_charger.pax = sale_payment.room_charges.pax
                room_charger.save()  
            else:  
                raise CustomValidation(my_dict['soap:Envelope']['soap:Body']['PostChargeResponse']['Result']['c:Text']['c:TextElement'], 'opera', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if isinstance(e, CustomValidation):
                raise CustomValidation('Cargo habitación: {}'.format(e.detail['opera']), 'opera', status.HTTP_400_BAD_REQUEST)
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
            raise CustomValidation('Cargo habitación: Error de servicio, intente mas tarde', 'error', status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk):
        sale = models.Sale.objects.get(pk=pk)
        old_status = sale.status
        if sale.status == "C":
            raise CustomValidation('Esta venta ya esta cancelada', 'error', status.HTTP_400_BAD_REQUEST)
        datetime_ = datetime.now()
        sale_data = request.data
        auth_discount = None
        if sale_data.get('discount_data', None) is not None:
            auth_discount = models.AuthDiscount.objects.filter(id=sale_data['discount_data']['id']).first()
            if auth_discount is not None:
                if auth_discount.sale is not None and auth_discount.sale.id != sale.id:
                    raise CustomValidation('Descuento: No existe o no esta disponible la autorizacion de descuento {}'.format(sale_data['discount_data']['discount_key']), 'error', status.HTTP_400_BAD_REQUEST)
                else:
                    auth_discount.sale = sale
                    auth_discount.save()
            else:
                raise CustomValidation('Descuento: No existe o no esta disponible la autorizacion de descuento {}'.format(sale_data['discount_data']['discount_key']), 'error', status.HTTP_400_BAD_REQUEST)
        service = Service.objects.filter(id=sale_data['service']).first()
        if sale_data['time'] is not None and service.availability_group is not None:
            time = self.text_to_time(sale_data['time'])
            property = Property.objects.filter(id=sale_data['property']).first()
            if self.check_availability(sale_data['adults'],sale_data['childs'],service,sale_data['service_date'],time,property,sale) == False:
                raise CustomValidation('Venta: no hay disponibilidad para el servicio, verifique la fecha o el horario para el servicio', 'error', status.HTTP_400_BAD_REQUEST)
        sale_payments = request.data.pop('sale_payments')
        sale_data = self.reform_sale_data(sale_data,True,sale)
        user_extension = models.UserExtension.objects.get(user=request.user)
        if old_status == "B" and request.data['status'] == "A":
            sale_data['sale_date'] = datetime_
            log(sale.sale_key, sale.status,"Bloqueo a Venta",user_extension,None,None,None)
        self.check_sale_changes(sale,sale_data,user_extension)
        models.Sale.objects.filter(id=pk).update(**sale_data)
        sale = models.Sale.objects.get(pk=pk)
        self.save_sale_payments(sale,sale_payments,False)
        return Response(serializers.SaleSerializer(sale).data)
    
    def text_to_time(self, flight_time):
        try:
            # Intenta analizar el campo de texto como %H:%M:%S
            time = datetime.strptime(flight_time, '%H:%M:%S').time()
        except ValueError:
            try:
                # Si falla, intenta analizar el campo de texto como %H:%M
                time = datetime.strptime(flight_time, '%H:%M').time()
            except ValueError:
                # Si ambos intentos fallan, imprime un mensaje de error o maneja la situación según tu necesidad.
                print("Formato no válido. Se requiere %H:%M:%S o %H:%M.")
                time = None
        return time
    
    def check_availability(self,adults,childs,service,service_date,time,property,sale=None):
        from django.db.models import Sum, F, IntegerField
        date = datetime.strptime(service_date, '%Y-%m-%d').date()
        schedule = schedule_availables(date,service.availability_group,property,sale,time)
        if schedule is None:
            return False
        return int(adults) + int(childs) <= schedule['limit'] - schedule['reserved']
    
    def check_sale_changes(self,sale,sale_data,user_extension):
        title = "Modificacion de venta"
        if sale.service_date.strftime('%Y-%m-%d') != str(sale_data['service_date']):
            log(sale.sale_key,sale.status,title,user_extension,"Fecha de servicio",sale.service_date.strftime('%Y-%m-%d'),str(sale_data['service_date']))
        
        if sale.schedule is not None:
            if sale.schedule.id != sale_data['schedule_id']:
                schedule = models.Schedule.objects.filter(id=sale_data['schedule_id']).first()
                log(sale.sale_key,sale.status,title,user_extension,"Horario",sale.schedule.time,schedule.time)

        if sale.comments != sale_data['comments']:
            comments = (sale.comments[:98] + '..') if len(sale.comments) > 100 else sale.comments
            comments_sale_data = (sale_data['comments'][:98] + '..') if len(sale_data['comments']) > 100 else sale_data['comments']
            log(sale.sale_key,sale.status,title,user_extension,"Comentarios",comments,comments_sale_data)

        if sale.comments_coupon != sale_data['comments_coupon']:
            comments_coupon = (sale.comments_coupon[:98] + '..') if len(sale.comments_coupon) > 100 else sale.comments_coupon
            comments_coupon_sale_data = (sale_data['comments_coupon'][:98] + '..') if len(sale_data['comments_coupon']) > 100 else sale_data['comments_coupon']
            log(sale.sale_key,sale.status,title,user_extension,"Comentarios de cupon",comments_coupon,comments_coupon_sale_data)

        if user_extension.user.has_perm('SalesApp.sales_management'):
            if sale.representative.id != sale_data['representative_id']:
                representative = models.Representative.objects.filter(id=sale_data['representative_id']).first()
                log(sale.sale_key,sale.status,title,user_extension,"Representante",sale.representative.name,representative.name)

    def sale_coupon_send_email(self,request,pk):
        from GeneralApp.views import EmailsViewSet
        from django.template.loader import get_template
        from io                     import BytesIO
        from xhtml2pdf              import pisa
        sale = models.Sale.objects.filter(pk=pk).ratesAnnotate().first()
        if sale.status == "C":
            return Response({
                'msg':"Venta cancelada"
            },400)
        email_recipients = sale.email.split(";")
        coupons = [SaleViewSet.print_coupon_data(sale,"ORIGINAL")]
        context = {
            'coupons' :   coupons,
            'user'    :   request.user,
            'sale_key':   sale.sale_key,
            'host'    :   request.get_host()
        }
        template = get_template('new_sale_coupon_template.html')
        html  = template.render(context)
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("latin-1",'replace')), result)
        if not pdf.err:
            email = EmailsViewSet.prepare_html_email_from_template_pdf_attach("emails/coupon-sale/template.html",
                    {'sale' : serializers.SaleSerializer(sale).data,},
                    email_recipients,
                    "Cupon de venta:" + str(sale.sale_key) + ".pdf",
                    result,
                    "Vacation Planners Reservation Confirmation / Confirmación de Reservación Vacation Planners"
                )
            email.send()
        return Response({'success':True, 'email': sale.email})
    
    def cancel_sale_force(self, request, pk):
        sale = models.Sale.objects.get(pk=pk)
        user_extension = models.UserExtension.objects.get(user=request.user)
        if sale.status != "A" and sale.status != "P" and sale.status != "B":
            return Response({
                'error':"Esta venta no es valida para cancelacion."
            },400)
        if sale.status == "A": 
            today = date.today()
            sale_date = sale.sale_date.astimezone(timezone.get_current_timezone())
            if today > sale_date.date():
                return Response({
                    'error':"No puede cancelar un venta de un dia anterior"
                },400)
            
            sales = models.Sale.objects.filter(sale_key=sale.sale_key,status='R')
            if sales.exists():
                return Response({
                    'error':"No es posible cancelar un venta que ya tenga un reembolso"
                },400)
        if sale.user_extension != user_extension and not request.user.has_perm('SalesApp.sales_management'):
            return Response({
                'error':"No tienes permitido hacer una cancelacion de esta venta."
            },403)
        if sale.reservation_service is not None:
            sale.reservation_service = None
            sale.save()
        sale.status = "C"
        sale.save()
        log(sale.sale_key, sale.status,"Cancelacion de venta (Cancelacion OPERA manual)",user_extension,None,None,None)
        return Response(serializers.SaleSerializer(sale).data)

    def cancel_sale(self, request, pk):
        sale = models.Sale.objects.get(pk=pk)
        user_extension = models.UserExtension.objects.get(user=request.user)
        if sale.status != "A" and sale.status != "P" and sale.status != "B":
            return Response({
                'error':"Esta venta no es valida para cancelacion."
            },400)
        if sale.status == "A": 
            today = date.today()
            sale_date = sale.sale_date.astimezone(timezone.get_current_timezone())
            if today > sale_date.date():
                return Response({
                    'error':"No puede cancelar un venta de un dia anterior"
                },400)
            
            sales = models.Sale.objects.filter(sale_key=sale.sale_key,status='R')
            if sales.exists():
                return Response({
                    'error':"No es posible cancelar un venta que ya tenga un reembolso"
                },400)
        if sale.user_extension != user_extension and not request.user.has_perm('SalesApp.sales_management'):
            return Response({
                'error':"No tienes permitido hacer una cancelacion de esta venta."
            },403)
        if sale.reservation_service is not None:
            sale.reservation_service = None
            sale.save()
        sale.status = "C"
        sale.save()
        log(sale.sale_key, sale.status,"Cancelacion de venta",user_extension,None,None,None)
        for sale_payment in sale.sale_payments.all():
            if sale_payment.payment_method.room_charge is True and hasattr(sale_payment, 'room_charges'):
                self.cancel_room_charge_request(sale,sale_payment)
        return Response(serializers.SaleSerializer(sale).data)

    def cancel_room_charge_request(self,sale,sale_payment,delete_charge = False):
        opera_key = opera_credentials(sale.property)
        HOSTOPERA = opera_key["HOSTOPERA"]
        USERNAMEOPERA = opera_key["USERNAMEOPERA"]
        USERNAMEPASSWORD = opera_key["USERNAMEPASSWORD"]
        url = "https://{}/OWS_WS_51/ResvAdvanced.asmx?op=PostCharge".format(HOSTOPERA)
        payload = (
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">\n"
            "   <soap:Header>\n"
            "       <OGHeader terminalID=\"CANTO\" xmlns=\"http://webservices.micros.com/og/4.3/Core/\">\n"
            "           <Origin systemType=\"WEB\" />\n"
            "           <Destination systemType=\"PMS\" />\n"
            "           <Authentication>\n"
            "               <UserCredentials>\n"
            "                   <UserName>{}</UserName>\n"
            "                   <UserPassword>{}</UserPassword>\n"
            "               </UserCredentials>\n"
            "           </Authentication>\n"
            "       </OGHeader>\n"
            "   </soap:Header>\n"
            "   <soap:Body>\n"
            "       <PostChargeRequest Account=\"{}\" xmlns=\"http://webservices.micros.com/og/4.3/ResvAdvanced/\" xmlns:c=\"http://webservices.micros.com/og/4.3/Common/\">\n>\n"
            "           <Posting ShortInfo=\"{}\" LongInfo=\"{}\" Charge=\"{}\">\n"
            "               <ReservationRequestBase>\n"
            "                   <HotelReference hotelCode=\"{}\"/>\n"
            "                   <ReservationID>\n"
            "                       <c:UniqueID type=\"EXTERNAL\" source=\"RESV_NAME_ID\">{}</c:UniqueID>\n"
            "                   </ReservationID>\n"
            "               </ReservationRequestBase>\n"
            "           </Posting>\n"
            "       </PostChargeRequest>\n"
            "   </soap:Body>\n"
            "</soap:Envelope>"
        ).format(USERNAMEOPERA,USERNAMEPASSWORD,
            escape(sale_payment.room_charges.account),
            escape(sale_payment.room_charges.coupon),
            escape(sale_payment.room_charges.coupon),
            sale_payment.amount * -1,
            escape(sale_payment.room_charges.hotel_code),
            escape(sale_payment.room_charges.reservation_opera_id))
        headers = {
            'Host': HOSTOPERA,
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://webservices.micros.com/ows/5.1/ResvAdvanced.wsdl#PostCharge'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            my_dict = xmltodict.parse(response.text)
            if my_dict['soap:Envelope']['soap:Body']['PostChargeResponse']['Result']['@resultStatusFlag'] == "SUCCESS":
                room_charger = sale_payment.room_charges
                room_charger.delete()
            else:  
                raise CustomValidation(my_dict['soap:Envelope']['soap:Body']['PostChargeResponse']['Result']['c:Text']['c:TextElement'], 'opera', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if isinstance(e, CustomValidation):
                raise CustomValidation('Cargo habitación: {}'.format(e.detail['opera']), 'opera', status.HTTP_400_BAD_REQUEST)
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
            raise CustomValidation('Cargo habitación: Error de servicio, intente mas tarde', 'error', status.HTTP_400_BAD_REQUEST)
         
    def print_sale(self, request, pk):
        from django.template.loader import get_template
        from io                     import BytesIO
        from xhtml2pdf              import pisa
        sale = models.Sale.objects.filter(pk=pk).ratesAnnotate().first()
        exchange_rate = ExchangeRate.objects.filter(start_date__lte=sale.sale_date.date(),type='SALE',property=sale.property).order_by("start_date").first()
        if sale.status == "C":
            return Response({
                'msg':"Esta venta ya esta cancelada"
            },400)
        if sale.status == "B":
            return Response({
                'msg':"No se pueden imprimir bloqueo"
            },400)
        coupons = []
        create = True if request.GET['create'] == 'true' else False
        if create is True:
            coupons.append(SaleViewSet.print_coupon_data(sale,"ORIGINAL"))
            coupons.append(SaleViewSet.print_coupon_data(sale,"COPIA 1"))
            coupons.append(SaleViewSet.print_coupon_data(sale,"COPIA 2"))
        else:
            coupons.append(SaleViewSet.print_coupon_data(sale,"REIMPRESION 1"))
            coupons.append(SaleViewSet.print_coupon_data(sale,"REIMPRESION 2"))
            coupons.append(SaleViewSet.print_coupon_data(sale,"REIMPRESION 3"))

        context = {
            'coupons'                           :   coupons,
            'user'                              :   request.user,
            'sale_key'                          :   sale.sale_key,
            'host'                              :   request.get_host(),
            'environment'                       :   getattr(serverconfig,"environment","http"),
        }
        template = get_template('new_sale_coupon_template.html')
        response = HttpResponse(content_type='application/pdf')
        filename = "Cupón: {} {} .pdf".format(sale.id,datetime.now())
        content = "inline; filename={}".format(filename)
        response['Content-Disposition'] = content
        # find the template and render it.
        html = template.render(context)
        # create a pdf
        pisa_status = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        # if error then show some funny view
        if pisa_status.err:
           raise CustomValidation(pisa_status.err, 'document', status.HTTP_400_BAD_REQUEST)
        return response
    
    def print_coupon_data(sale,title):
        from SalesApp.controllers import sale_subtotal
        import locale
        locale.setlocale( locale.LC_ALL, 'en_US.UTF-8' )
        coupon_title = sale.property.coupon_title if sale.property.coupon_title is not None else ""
        coupon_title = reform_text(coupon_title)
        coupon_header = sale.property.coupon_header if sale.property.coupon_header is not None else ""
        coupon_header = reform_text(coupon_header)
        pup = ""
        if sale.service.availability_group is not None:
            schedule = schedule_by_datetime(sale.service_date,sale.service.availability_group,sale.time)
            if schedule is not None:
                schedule_pickup = schedule.schedule_pickups.filter(hotel=sale.hotel).first()
                if schedule_pickup is not None:
                    pup = schedule_pickup.time
        coupon = {
            'title':title,
            'coupon_title':coupon_title,
            'coupon_header':coupon_header,
            'ID': sale.sale_key,
            'sale_date': sale.sale_date,
            'pax': sale.name_pax,
            'comments_coupon': sale.comments_coupon,
            'hotel': reform_text(sale.hotel.name),
            'room': sale.room,
            'adults': sale.adults,
            'childs': sale.childs,
            'confirm_provider': sale.confirm_provider,
            'provider': reform_text(sale.service.provider.name),
            'service': "{} - {}".format(sale.service.id,sale.service.name),
            'service_comments': sale.service.comments_coupon,
            'service_date': sale.service_date,
            'service_time': sale.time,
            'service_pup': pup,
            'rep':sale.representative.name,
            'property':sale.property.code
        }
        totals = sale_subtotal(sale)
        coupon['subtotal'] = totals['subtotal']
        coupon['discount'] = totals['discount']
        coupon['total'] = totals['total']
        coupon['total_text'] = SaleViewSet.numero_to_letras(totals['total_num'])
        payments = []
        for sale_payment in sale.sale_payments.all():
            payments.append({
                'payment_method':sale_payment.payment_method.name,
                'amount':locale.currency(sale_payment.amount,grouping=True)
            })
        coupon['sale_payments'] = payments
        return coupon
    
    def numero_to_letras(numero):
        indicador = [("",""),("MIL","MIL"),("MILLON","MILLONES"),("MIL","MIL"),("BILLON","BILLONES")]
        entero = int(numero)
        decimal = int(round((numero - entero)*100))
        contador = 0
        numero_letras = ""
        if (entero == 0):
            if decimal > 0:
                return "ZERO " + str(decimal) + "/100 USD"
                # return "CERO " + str(decimal) + "/100 USD"
            else:
                 return "ZERO " + '00' + "/100 USD"
                # return "CERO " + '00' + "/100 USD"
        while entero > 0:
            a = entero % 1000
            if contador == 0:
                en_letras = SaleViewSet.convierte_cifra(a,1).strip()
            else :
                en_letras = SaleViewSet.convierte_cifra(a,0).strip()
            if a==0:
                numero_letras = en_letras+" "+numero_letras
            elif a==1:
                if contador in (1,3):
                    numero_letras = indicador[contador][0]+" "+numero_letras
                else:
                    numero_letras = en_letras+" "+indicador[contador][0]+" "+numero_letras
            else:
                numero_letras = en_letras+" "+indicador[contador][1]+" "+numero_letras
            numero_letras = numero_letras.strip()
            contador = contador + 1
            entero = int(entero / 1000)

        if decimal > 0:
            numero_letras = numero_letras + " " + str(decimal) + "/100 USD"
        else:
            numero_letras = numero_letras + " " + '00' + "/100 USD"
        return numero_letras

    def convierte_cifra(numero,sw):
        lista_centana = ["",("CIEN","CIENTO"),"DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS","SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"]
        lista_decena = ["",("DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISEIS","DIECISIETE","DIECIOCHO","DIECINUEVE"),
                        ("VEINTE","VEINTI"),("TREINTA","TREINTA Y "),("CUARENTA" , "CUARENTA Y "),
                        ("CINCUENTA" , "CINCUENTA Y "),("SESENTA" , "SESENTA Y "),
                        ("SETENTA" , "SETENTA Y "),("OCHENTA" , "OCHENTA Y "),
                        ("NOVENTA" , "NOVENTA Y ")
                    ]
        lista_unidad = ["",("UN" , "UNO"),"DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE"]
        centena = int (numero / 100)
        decena = int((numero -(centena * 100))/10)
        unidad = int(numero - (centena * 100 + decena * 10))

        texto_centena = ""
        texto_decena = ""
        texto_unidad = ""
        #Validad las centenas
        texto_centena = lista_centana[centena]
        if centena == 1:
            if (decena + unidad)!=0:
                texto_centena = texto_centena[1]
            else :
                texto_centena = texto_centena[0]
    
        #Valida las decenas
        texto_decena = lista_decena[decena]
        if decena == 1 :
            texto_decena = texto_decena[unidad]
        elif decena > 1 :
            if unidad != 0 :
                texto_decena = texto_decena[1]
            else:
                texto_decena = texto_decena[0]
        #Validar las unidades
        #print "texto_unidad: ",texto_unidad
        if decena != 1:
            texto_unidad = lista_unidad[unidad]
            if unidad == 1:
                texto_unidad = texto_unidad[sw]

        return "%s %s %s" %(texto_centena,texto_decena,texto_unidad)
    
    def reform_sale_data(self,sale_data,update=False,sale=None):
        sale_data = delete_element_safe(sale_data,'sale_auth_discount')
        sale_data = delete_element_safe(sale_data,'discount_data')
        sale_data = delete_element_safe(sale_data,'sale_date')
        sale_data['representative_id'] = sale_data['representative']
        sale_data = delete_element_safe(sale_data,'representative')
        sale_data = delete_element_safe(sale_data,'representative_name')
        sale_data['reservation_service_id'] = sale_data['reservation_service']
        sale_data = delete_element_safe(sale_data,'reservation_service')
        sale_data['service_id'] = sale_data['service']
        sale_data = delete_element_safe(sale_data,'service')
        sale_data = delete_element_safe(sale_data,'service_data')
        sale_data['user_extension_id'] = sale_data['user_extension']
        sale_data = delete_element_safe(sale_data,'user_extension')
        sale_data = delete_element_safe(sale_data,'user_extension_name')
        sale_data['hotel_id'] = sale_data['hotel']
        sale_data = delete_element_safe(sale_data,'hotel')
        sale_data = delete_element_safe(sale_data,'hotel_name')
        sale_data['service_rate_id'] = sale_data['service_rate']
        if update is True:
            if sale.service_rate.id != int(sale_data['service_rate_id']):
                service_rate = models.ServiceRate.objects.get(id=sale_data['service_rate_id'])
                sale_data['currency'] = service_rate.currency
                sale_data['adult_price'] = service_rate.adult_price
                sale_data['child_price'] = service_rate.child_price
                sale_data['hard_rock_comission_adult'] = service_rate.hard_rock_comission_adult
                sale_data['hard_rock_comission_child'] = service_rate.hard_rock_comission_child
                sale_data['tax'] = service_rate.tax
                sale_data['exent_import_adult'] = service_rate.exent_import_adult
                sale_data['exent_import_child'] = service_rate.exent_import_child
        else:
            sale_data['currency'] = sale_data['service_rate_data']['currency']
            sale_data['adult_price'] = sale_data['service_rate_data']['adult_price']
            sale_data['child_price'] = sale_data['service_rate_data']['child_price']
            sale_data['hard_rock_comission_adult'] = sale_data['service_rate_data']['hard_rock_comission_adult']
            sale_data['hard_rock_comission_child'] = sale_data['service_rate_data']['hard_rock_comission_child']
            sale_data['tax'] = sale_data['service_rate_data']['tax']
            sale_data['exent_import_adult'] = sale_data['service_rate_data']['exent_import_adult']
            sale_data['exent_import_child'] = sale_data['service_rate_data']['exent_import_child']
        sale_data = delete_element_safe(sale_data,'service_rate')
        sale_data = delete_element_safe(sale_data,'service_rate_data')
        sale_data['schedule_id'] = sale_data['schedule']
        sale_data = delete_element_safe(sale_data,'schedule')
        sale_data = delete_element_safe(sale_data,'schedule_time')
        sale_data = delete_element_safe(sale_data,'schedule_max')
        sale_data = delete_element_safe(sale_data,'schedule_reserved')
        sale_data = delete_element_safe(sale_data,'schedule_data')
        if sale_data['time'] == "":
            sale_data = delete_element_safe(sale_data,'time')
        sale_data['sale_type_id'] = sale_data['sale_type']
        sale_data = delete_element_safe(sale_data,'sale_type')
        sale_data = delete_element_safe(sale_data,'sale_type_data')
        sale_data['client_type_id'] = sale_data['client_type']
        sale_data = delete_element_safe(sale_data,'client_type')
        sale_data = delete_element_safe(sale_data,'client_type_data')
        sale_data['property_id'] = sale_data['property']
        sale_data = delete_element_safe(sale_data,'property')
        sale_data = delete_element_safe(sale_data,'sale_key')
        return sale_data
    
    def reform_sale_payment_data(self,sale_payment_data):
        sale_payment_data['department_cecos_id'] = sale_payment_data['department_cecos']
        del sale_payment_data['department_cecos']
        del sale_payment_data['department_cecos_data']
        sale_payment_data['payment_method_id'] = sale_payment_data['payment_method']
        del sale_payment_data['payment_method']
        del sale_payment_data['payment_method_data']
        if sale_payment_data.get('credit_charge_data', None) is not None:
            sale_payment_data['credit_charge_id'] = sale_payment_data['credit_charge_data']['id']
        del sale_payment_data['credit_charge_data']
        del sale_payment_data['room_charge_data']
        return sale_payment_data

    def save_sale_payments(self,sale,sale_payments,create=True):
        if create:
            for sale_payment_data in sale_payments:
                sale_payment_data = self.reform_sale_payment_data(sale_payment_data)
                store_card_charge_data = sale_payment_data.pop('store_card_charge_data')
                sale_payment_data['sale'] = sale
                new_sale_payment = models.SalePayment(
                    **sale_payment_data
                )
                new_sale_payment.save()
                if new_sale_payment.payment_method.room_charge is True:
                    if sale.room != "" and sale.hotel.opera_code != "":
                        self.sale_payment_booking_room_charge(sale,new_sale_payment)
                    else:
                        raise CustomValidation('Venta: Los datos de hotel o la habitación no estan capturados.', 'error', status.HTTP_400_BAD_REQUEST)
                if new_sale_payment.payment_method.store_card_charge is True:
                    if store_card_charge_data is not None:
                        store_card = models.StoreCard.objects.filter(id=store_card_charge_data['store_card']).first()
                        if store_card is None:
                            raise CustomValidation('Venta: Los datos de la monedero no estan capturados.', 'error', status.HTTP_400_BAD_REQUEST)
                        amount = new_sale_payment.amount if sale.status == "R" else -1 * new_sale_payment.amount
                        self.store_card_charge_request(new_sale_payment,store_card,amount)
                    else:
                        raise CustomValidation('Venta: Los datos de la monedero no estan capturados.', 'error', status.HTTP_400_BAD_REQUEST)
        else:
            exclude_ids = []
            items_to_update = []
            items_to_save = []
            for sale_payment_data in sale_payments:
                sale_payment_data = self.reform_sale_payment_data(sale_payment_data)
                sale_payment_data['sale'] = sale
                if sale_payment_data['id'] is not None:
                    exclude_ids.append(sale_payment_data['id'])
                    store_card_charge_data = sale_payment_data.pop('store_card_charge_data')
                    items_to_update.append(sale_payment_data)
                else:
                    items_to_save.append(sale_payment_data)
            items = models.SalePayment.objects.filter(sale=sale)
            if len(exclude_ids) > 0:
                items_to_delete = items.exclude(id__in=exclude_ids)
                items = items.filter(id__in=exclude_ids)
                for item_to_delete in items_to_delete:
                    if item_to_delete.payment_method.room_charge is True and hasattr(item_to_delete, 'room_charges'):
                        self.cancel_room_charge_request(item_to_delete)
                    if item_to_delete.payment_method.store_card_charge is True and item_to_delete.store_card_charge is not None:
                        store_card_charge = item_to_delete.store_card_charge
                        store_card_charge.delete()
                    item_to_delete.delete()
            for item_to_update in items_to_update:
                models.SalePayment.objects.filter(id=item_to_update['id']).update(**item_to_update)
            for item_to_save in items_to_save:
                store_card_charge_data = item_to_save.pop('store_card_charge_data')
                new_sale_payment = models.SalePayment(
                    **item_to_save
                )
                new_sale_payment.save()
                if new_sale_payment.payment_method.room_charge is True:
                    if sale.room != "" or sale.hotel.opera_code != "":
                        self.sale_payment_booking_room_charge(sale,new_sale_payment)
                    else:
                        raise CustomValidation('Venta: Los datos de hotel o la habitación no estan capturados.', 'error', status.HTTP_400_BAD_REQUEST)
                if new_sale_payment.payment_method.store_card_charge is True:
                    if store_card_charge_data is not None:
                        store_card = models.StoreCard.objects.filter(id=store_card_charge_data['store_card']).first()
                        if store_card is None:
                            raise CustomValidation('Venta: Los datos de la monedero no estan capturados.', 'error', status.HTTP_400_BAD_REQUEST)
                        amount = new_sale_payment.amount if sale.status == "R" else -1 * new_sale_payment.amount
                        self.store_card_charge_request(new_sale_payment,store_card,amount)
                    else:
                        raise CustomValidation('Venta: Los datos de la monedero no estan capturados.', 'error', status.HTTP_400_BAD_REQUEST)

    def sale_payment_booking_room_charge(self,sale,sale_payment):
        opera_key = opera_credentials(sale.property)
        HOSTOPERA = opera_key["HOSTOPERA"]
        USERNAMEOPERA = opera_key["USERNAMEOPERA"]
        USERNAMEPASSWORD = opera_key["USERNAMEPASSWORD"]
        url = "https://{}/OWS_WS_51/Reservation.asmx".format(HOSTOPERA)
        payload = (
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">\n"
            "   <soap:Header>\n"
            "       <OGHeader xmlns=\"http://webservices.micros.com/og/4.3/Core/\">\n"
            "            <Origin entityID=\"RCDHOTELS\" systemType=\"WEB\" />\n"
            "            <Destination entityID=\"CHA\" systemType=\"PMS\" />\n"
            "            <Authentication>\n"
            "                <UserCredentials>\n"
            "                    <UserName>{}</UserName>\n"
            "                    <UserPassword>{}</UserPassword>\n"
            "                </UserCredentials>\n"
            "            </Authentication>\n"
            "        </OGHeader>\n"
            "    </soap:Header>\n"
            "    <soap:Body>\n"
            "        <FutureBookingSummaryRequest xmlns:hc=\"http://webservices.micros.com/og/4.3/HotelCommon/\" xmlns=\"http://webservices.micros.com/ows/5.1/Reservation.wsdl\">\n"
            "            <AdditionalFilters GetList=\"true\" RoomNumber=\"{}\" ReservationStatus=\"INHOUSE\">\n"
            "               <HotelReference chainCode=\"{}\" hotelCode=\"{}\" xmlns=\"http://webservices.micros.com/og/4.3/Reservation/\" />\n"
            "            </AdditionalFilters>\n"
            "        </FutureBookingSummaryRequest>\n"
            "    </soap:Body>\n"
            "</soap:Envelope>"
        ).format(USERNAMEOPERA,USERNAMEPASSWORD,
            escape(sale.room),
            escape(sale.hotel.opera_code[0:2]),
            escape(sale.hotel.opera_code))
        headers = {
            'Host': HOSTOPERA,
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://webservices.micros.com/ows/5.1/Reservation.wsdl#FutureBookingSummary'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            my_dict = xmltodict.parse(response.text)
            opera_reservation_id = ""
            name_pax = sale.name_pax
            hotelreservation = None
            if my_dict['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['Result']['@resultStatusFlag'] == "FAIL":
                raise CustomValidation('Reservación no encontrada.', 'error', status.HTTP_400_BAD_REQUEST)
            if isinstance(my_dict['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['HotelReservations']['r:HotelReservation'], list):
                for r_HotelReservation in my_dict['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['HotelReservations']['r:HotelReservation']:
                    start_date = datetime.strptime(r_HotelReservation['r:RoomStays']['hc:RoomStay']['hc:TimeSpan']['hc:StartDate'][0:10], '%Y-%m-%d').date()
                    end_date = datetime.strptime(r_HotelReservation['r:RoomStays']['hc:RoomStay']['hc:TimeSpan']['hc:EndDate'][0:10], '%Y-%m-%d').date()
                    if start_date <= date.today() <= end_date:
                        hotelreservation = r_HotelReservation
            else:
                hotelreservation = my_dict['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['HotelReservations']['r:HotelReservation']
            if hotelreservation is not None:
                opera_reservation_id = hotelreservation['r:UniqueIDList']['c:UniqueID'][1]['#text']
                pax = None
                for profile in hotelreservation['r:ResGuests']['r:ResGuest']['r:Profiles']['Profile']:
                    if not isinstance(profile,str):
                        costumer = profile.get('Customer', None)
                        if costumer is not None:
                            pax = profile
                if pax is not None:
                    name_pax = "{} {} {}".format(pax['Customer']['PersonName'].get('c:nameTitle',""), pax['Customer']['PersonName'].get('c:firstName',""), pax['Customer']['PersonName'].get('c:lastName',""))
                amount = sale_payment.amount * -1  if sale.status == "R" else sale_payment.amount
            else:
                raise CustomValidation('No hay reservacion valida para cargo habitacion.', 'error', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if isinstance(e, CustomValidation):
                raise CustomValidation('Booking: {}'.format(e.detail['error']), 'error', status.HTTP_400_BAD_REQUEST)
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
            print(payload)
            print(response.text)
            raise CustomValidation('Booking: Error de servicio, intente mas tarde.', 'error', status.HTTP_400_BAD_REQUEST)
        coupon = "{}|{}|{}|{}".format(str(sale.sale_key).zfill(8),sale.service.name,sale.confirm_provider,sale.user_extension.user.username)
        self.room_charge_request(sale,sale_payment,sale.service.opera_code,
                coupon,amount,sale.hotel.opera_code,
                opera_reservation_id,sale.room,name_pax)
    
    def room_charge_request(self,sale,sale_payment,account,coupon,amount,hotel_code,reservation_opera_id,room,pax):
        opera_key = opera_credentials(sale.property)
        HOSTOPERA = opera_key["HOSTOPERA"]
        USERNAMEOPERA = opera_key["USERNAMEOPERA"]
        USERNAMEPASSWORD = opera_key["USERNAMEPASSWORD"]
        url = "https://{}/OWS_WS_51/ResvAdvanced.asmx?op=PostCharge".format(HOSTOPERA)
        payload = (
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">\n"
            "   <soap:Header>\n"
            "       <OGHeader terminalID=\"CANTO\" xmlns=\"http://webservices.micros.com/og/4.3/Core/\">\n"
            "           <Origin systemType=\"WEB\" />\n"
            "           <Destination systemType=\"PMS\" />\n"
            "           <Authentication>\n"
            "               <UserCredentials>\n"
            "                   <UserName>{}</UserName>\n"
            "                   <UserPassword>{}</UserPassword>\n"
            "               </UserCredentials>\n"
            "           </Authentication>\n"
            "       </OGHeader>\n"
            "   </soap:Header>\n"
            "   <soap:Body>\n"
            "       <PostChargeRequest Account=\"{}\" xmlns=\"http://webservices.micros.com/og/4.3/ResvAdvanced/\" xmlns:c=\"http://webservices.micros.com/og/4.3/Common/\">\n>\n"
            "           <Posting ShortInfo=\"{}\" LongInfo=\"{}\" Charge=\"{}\">\n"
            "               <ReservationRequestBase>\n"
            "                   <HotelReference hotelCode=\"{}\"/>\n"
            "                   <ReservationID>\n"
            "                       <c:UniqueID type=\"EXTERNAL\" source=\"RESV_NAME_ID\">{}</c:UniqueID>\n"
            "                   </ReservationID>\n"
            "               </ReservationRequestBase>\n"
            "           </Posting>\n"
            "       </PostChargeRequest>\n"
            "   </soap:Body>\n"
            "</soap:Envelope>"
            ).format(USERNAMEOPERA,USERNAMEPASSWORD,
                escape(account),
                escape(coupon),
                escape(coupon),
                amount,
                escape(hotel_code),
                escape(reservation_opera_id))
        headers = {
            'Host': HOSTOPERA,
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://webservices.micros.com/ows/5.1/ResvAdvanced.wsdl#PostCharge'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            my_dict = xmltodict.parse(response.text)
            if my_dict['soap:Envelope']['soap:Body']['PostChargeResponse']['Result']['@resultStatusFlag'] == "SUCCESS":
                room_charger = models.RoomCharge()
                room_charger.sale_payment = sale_payment
                room_charger.reservation_opera_id = reservation_opera_id
                room_charger.account = account
                room_charger.hotel_code = hotel_code
                room_charger.coupon = coupon
                room_charger.room = room
                room_charger.pax = pax
                room_charger.save()
            else:  
                raise CustomValidation(my_dict['soap:Envelope']['soap:Body']['PostChargeResponse']['Result']['c:Text']['c:TextElement'], 'error', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if isinstance(e, CustomValidation):
                raise CustomValidation('Cargo habitación: {}'.format(e.detail['error']), 'error', status.HTTP_400_BAD_REQUEST)
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
            print(payload)
            print(response.text)
            raise CustomValidation('Cargo habitación: Error de servicio, intente mas tarde', 'error', status.HTTP_400_BAD_REQUEST)
        
    def credit_charge_request(self,request):
        url = "https://api-qa.dspayment.zone/api/v2/auth/signin"
        payload = json.dumps({
            "username": "RCD_SevQA",
            "password": "Silice2023"
        })
        headers = {
            'Content-Type': 'application/json'
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        json_data = json.loads(response.text)
        print(response.status_code)
        if response.status_code == 201:
            date_time_now = datetime.now().strftime('%s')
            ordenId = "VP{}".format(date_time_now)
            url = "https://api-qa.dspayment.zone/api/v2/recibo/shopping_car"
            webhook =  "http://{}/webhook_payment_paid/{}".format(request.get_host(),ordenId)
            urlReturn =  "http://{}/api/sales/print_trasaction_payment/{}/".format(request.get_host(),ordenId)
            print(webhook)
            payload = json.dumps({
                "ordenId": ordenId,
                "nombreCliente": request.GET['name_pax'],
                "emailCliente": request.GET['email'],
                "telefonoCliente": "",
                "subtotal": request.GET['amount'],
                "impuestos": "0",
                "concepto": request.GET['payment_method'],
                "total": request.GET['amount'],
                "urlReturn": urlReturn,
                "urlWebhook": webhook,
                "dealerAccountCode": "-demo",
                "items":[
                    {
                        "cantidad": 1,
                        "producto": request.GET['payment_method'], 
                        "precio": float(request.GET['amount']),
                        "moneda": "USD"
                    },
                ]
            })
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer {}'.format(json_data['data']['token'])
            }
            response = requests.request("POST", url, headers=headers, data=payload)
            json_data = json.loads(response.text)
            print(json_data)
            if response.status_code == 201:
                credit_charge, created = models.CreditCharge.objects.get_or_create(
                    order_id=ordenId,
                )
                return Response({
                    'url':json_data['url'],
                    'webhook':webhook,
                    'credit_charge':credit_charge.id
                })
        message = json_data.get('message',None)
        if message is None:
            message = json_data.get('error',"Ocurrio un error en su solicitud, intente mas tarde")
        return Response({'error':message},response.status_code)
        
    def credit_charge_confirmation(self,request,pk):
        credit_charge = models.CreditCharge.objects.get(id=pk)
        if credit_charge.status != "Pendiente" and credit_charge.transaction_id is not None:
            return Response(serializers.CreditChargeSerializer(credit_charge).data)
        return Response({'error':"el pago no se ha confirmado"},404)
    
    def store_card_search_valid(self,request):
        store_card_search_data = request.data
        store_card = models.StoreCard.objects.filter(card_key=int(store_card_search_data['card_key'])).balanceTotal().first()
        if store_card is None:
            return Response({'error':"No se encontro ese numero de monedero"},404)
        if store_card.status != "active":
            return Response({'error':"Esta monedero no esta disponible"},404)
        if store_card.due_date < date.today():
            return Response({'error':"Esta monedero esta vencida"},404)
        if store_card.nip != store_card_search_data['nip']:
            return Response({'error':"Nip incorrecto"},404)
        if store_card.total < float(store_card_search_data['amount']):
            return Response({'error':"No hay saldo suficiente para esa monedero"},404)
        return Response({
            'store_card':store_card.id,
            'store_card_name':store_card.name_pax,
            'store_card_card_key':store_card.card_key,
        })
    
    def store_card_charge_request(self,sale_payment,store_card,amount):
        new_store_card_charge = models.StoreCardCharge()
        new_store_card_charge.store_card = store_card
        new_store_card_charge.amount = amount
        new_store_card_charge.save()
        sale_payment.store_card_charge = new_store_card_charge
        sale_payment.save()
    
    def print_trasaction_payment(self, request, uid):
        from django.template.loader import get_template
        from io                     import BytesIO
        from xhtml2pdf              import pisa
        credit_charge = models.CreditCharge.objects.get(order_id=uid)
        if credit_charge.status == "Pendiente" or credit_charge.transaction_id is None:
            return Response({
                'msg':"Esta transaccion no esta confirmada"
            },400)
        url = "https://api-qa.dspayment.zone/api/v2/auth/signin"
        payload = json.dumps({
            "username": "RCD_SevQA",
            "password": "Silice2023"
        })
        headers = {
            'Content-Type': 'application/json'
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        json_data = json.loads(response.text)
        print(response.status_code)
        if response.status_code == 201:
            url = "https://api-qa.dspayment.zone/api/v2/cobro/findTransaccion/{}".format(credit_charge.transaction_id)
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer {}'.format(json_data['data']['token'])
            }
            response = requests.request("GET", url, headers=headers)
            json_data = json.loads(response.text)
            print(json_data)
            print(response.status_code)
            if response.status_code == 200:
                context = {
                    'data'     :   json_data['data'],
                    'user'     :   request.user,
                    'host'     :   request.get_host()
                }
                template = get_template('sale_transaction_template.html')
                html  = template.render(context)
                result = BytesIO()
                pdf = pisa.pisaDocument(BytesIO(html.encode("latin-1",'replace')), result)
                if not pdf.err:
                    response = HttpResponse(result.getvalue(), content_type='application/pdf')
                    filename = "Trasaccion: {} {} .pdf".format(uid,datetime.now())
                    content = "inline; filename={}".format(filename)
                    response['Content-Disposition'] = content
                    return response
                raise CustomValidation(pdf.err, 'document', status.HTTP_400_BAD_REQUEST)
        message = json_data.get('message',None)
        if message is None:
            message = json_data.get('error',"Ocurrio un error en su solicitud, intente mas tarde")
        return Response({'error':message},response.status_code)

    def sale_report_list_filters(self,request):
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        date_filter = request.GET.get('date_filter','xFechaVenta')
        refunds_only = request.GET.get('refunds_only','false')
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        sales = models.Sale.objects.tableOptimization()
        if refunds_only == 'true':
            sales = sales.filter(status='R')
        if date_filter == "xFechaVenta":
            sales = sales.saleFilterSaleDateRange(
                start_date,due_date,property
            )
        elif date_filter == "xFechaServicio":
            sales = sales.saleFilterServiceDateRange(
                start_date,due_date,property
            )
        else:
            raise CustomValidation("No hay filtro para busqueda de fechas", 'date_filter', status.HTTP_400_BAD_REQUEST)
        hotels_values = sales.order_by('hotel').distinct('hotel').values('hotel','hotel__name')
        hotels = []
        for hotel_value in hotels_values:
            hotels.append({
                'id':hotel_value['hotel'],
                'name':hotel_value['hotel__name']
            })
        services_values = sales.order_by('service').distinct('service').values('service','service__name')
        services = []
        for service_value in services_values:
            services.append({
                'id':service_value['service'],
                'name':service_value['service__name']
            })
        sale_types_values = sales.order_by('sale_type').distinct('sale_type').values('sale_type','sale_type__name')
        sale_types = []
        for sale_type_value in sale_types_values:
            sale_types.append({
                'id':sale_type_value['sale_type'],
                'name':sale_type_value['sale_type__name']
            })
        providers_values = sales.order_by('service__provider').distinct('service__provider').values('service__provider','service__provider__name')
        providers = []
        for provider_value in providers_values:
            providers.append({
                'id':provider_value['service__provider'],
                'name':provider_value['service__provider__name']
            })
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        if not self.user_has_perm_report(user_extension) and self.request.user.has_perm('SalesApp.access_report_by_payment_method_sales') and self.request.user.is_superuser is False:
            representatives = [{
                'id':user_extension.representative.id,
                'name':user_extension.representative.name,
            },]
        else:
            representatives_values = sales.order_by('representative').distinct('representative').values('representative','representative__name','representative__code')
            representatives = []
            for representative_value in representatives_values:
                representatives.append({
                    'id':representative_value['representative'],
                    'name':str(representative_value['representative__code'])+" "+representative_value['representative__name']
                })
        return Response({
            'hotels': hotels,
            'services': services,
            'providers': providers,
            'sale_types': sale_types,
            'representatives': representatives,
        })
    
    def user_has_perm_report(self,user_extension):
        from django.contrib.auth.models import Permission
        permissions = Permission.objects.filter(group__in=user_extension.user.groups.all(),codename__contains="SalesApp.access_report_")
        return permissions.count() > 1
    
    def sale_report_print(self, request):
        from SalesApp.controllers import SaleListController
        type = request.GET['type']
        file = request.GET['file']
        with_out_tax = True if request.GET['with_out_tax'] == 'true' else False
        date_filter = request.GET.get('date_filter','xFechaVenta')
        just_import = request.GET.get('just_import', False)
        just_import = True if just_import == 'true' else False
        summary = request.GET.get('summary', False)
        summary = True if summary == 'true' else False
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        hotels = request.GET.get('hotels','')
        if hotels != '':
            hotels = hotels.split(',')
        else:
            hotels = []
        services = request.GET.get('services','')
        if services != '':
            services = services.split(',')
        else:
            services = []
        sale_types = request.GET.get('sale_types','')
        if sale_types != '':
            sale_types = sale_types.split(',')
        else:
            sale_types = []
        providers = request.GET.get('providers','')
        if providers != '':
            providers = providers.split(',')
        else:
            providers = []
        representatives = request.GET.get('representatives','')
        if representatives != '':
            representatives = representatives.split(',')
        else:
            representatives = []
        if request.user.is_superuser is False:
            if type == "report_by_payment_method":
                if not request.user.has_perm('SalesApp.access_report_by_payment_method') and not request.user.has_perm('SalesApp.access_report_by_payment_method_sales'):
                    raise PermissionDenied()
            else:
                if not request.user.has_perm('SalesApp.access_{}'.format(type)):
                    raise PermissionDenied()
        report_list = SaleListController(
            request,
            start_date,
            due_date,
            property,
            type,
            file,
            sale_types,hotels,services,providers,
            representatives,
            with_out_tax,
            date_filter,
            just_import,summary)
        return report_list.get_context()
    
    def sale_report_sap_filters(self,request):
        from django.db.models import Q
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        date_filter = request.GET.get('date_filter','xFechaVenta')
        transfer_service = request.GET.get('transfer_service','')
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        sales = models.Sale.objects.tableOptimization()
        if date_filter == "xFechaVenta":
            sales = sales.saleFilterSaleDateRange(
                start_date,due_date,property
            )
        elif date_filter == "xFechaServicio":
            sales = sales.saleFilterServiceDateRange(
                start_date,due_date,property
            )
        else:
            raise CustomValidation("No hay filtro para busqueda de fechas", 'date_filter', status.HTTP_400_BAD_REQUEST)
        currency = request.GET.get('currency','USD')
        if currency == "MN" or currency == "USD":
            sales = sales.filter(service__provider__currency=currency)
        if transfer_service == 'true':
            sales = sales.filter(Q(service__is_transfer=True)|Q(service__business_group__name="Transportación"))
        else:
            sales = sales.filter(service__is_transfer=False)
        providers = sales.order_by('service__provider__sap_code').distinct('service__provider__sap_code').values('service__provider__name','service__provider__sap_code')
        sap_codes = []
        for provider in providers:
            print(provider)
            sap_codes.append({
                'id':provider['service__provider__sap_code'],
                'name':provider['service__provider__name']
            })

        return Response({
            'sap_codes': sap_codes,
        })

    def sale_report_sap_print(self, request):
        from SalesApp.controllers import SaleSAPReportController
        with_out_tax = True if request.GET['with_out_tax'] == 'true' else False
        date_filter = request.GET.get('date_filter','xFechaVenta')
        transfer_service = True if request.GET['transfer_service'] == 'true' else False
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        currency = request.GET.get('currency','')
        sap_codes = request.GET.get('sap_codes','')
        if sap_codes != "RCD" and sap_codes != "-RCD" and sap_codes != '':
            sap_codes = sap_codes.split(',')
        report_sap = SaleSAPReportController(
            request,
            start_date,
            due_date,
            property,
            transfer_service,
            sap_codes,
            currency,
            date_filter,
            with_out_tax
        )
        return report_sap.get_context()

    def operations_list(self,request):
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        operations_data = []
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        for date in daterange(start_date, due_date):
            sales = models.Sale.objects.tableOptimization().saleFilterServiceDate(date,property).filter(service__availability_group__isnull=False)
            services = sales.order_by('service').values_list('service', flat=True).distinct('service')
            for service in services:
                service_object = Service.objects.get(id=service)
                service_data = ServiceSerializer(service_object).data
                sales_by_service = sales.filter(service__id=service)
                times = sales_by_service.exclude(time__isnull=True).order_by('time').values_list('time', flat=True).distinct('time')
                for time in times:
                    schedule = schedule_by_datetime(date,service_object.availability_group,time)
                    if schedule is not None:
                        sales_by_time = sales_by_service.filter(time=time).saleRefundMark().filter(has_refund=False)
                        if sales_by_time.exists():
                            operation = {
                                'date':date.strftime('%Y-%m-%d'),
                                'time':schedule.time,
                                'service':service_data,
                                'property':PropertySerializer(property).data,
                            }
                            operation.update(sales_by_time.paxAggregate())
                            operations_data.append(operation)
                
        return Response(operations_data)
    
    def operations_list_date(self,request):
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        service = Service.objects.get(id=request.GET['service'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        sales = models.Sale.objects.tableOptimization().saleFilterServiceDate(date,property)
        if service.availability_group.group is not None:
            sales = sales.filter(service__availability_group__group=service.availability_group.group).order_by('service__name')
        else:
            sales = sales.filter(service__availability_group=service.availability_group).order_by('service__name')
        return Response({
            'operation':serializers.SaleWithPickUpSerializer(sales, many=True).data
        })
    
    def operations_unit_set_asigment(self,request):
        sales = models.Sale.objects.filter(id__in=request.data['sales'])
        unit = request.data['unit']
        for sale in sales:
            sale.unit = unit
            sale.save()
        return Response({'success':True})
    
    def operation_report_list(self,request):
        from SalesApp.controllers  import OperatorReportController
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        service = Service.objects.get(id=request.GET['service'])
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        report_list = OperatorReportController(
            request,
            date,
            service.availability_group,
            property)
        return report_list.get_context()

class StoreCardViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.StoreCard.objects.all().balanceTotal()
    serializer_class = serializers.StoreCardWithBalanceSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('card_key', 'name_pax', 'email', 'due_date', 'status', 'timestamp')
    ordering_fields = ('id', 'card_key', 'name_pax', 'email', 'due_date', 'status', 'timestamp')
    filter_fields = ('id', 'card_key', 'name_pax', 'email', 'due_date', 'comments', 'status', 'timestamp')

    def generar_pin(self):
        import random
        pin = ''.join([str(random.randrange(10)) for _ in range(4)])
        return pin

    def create(self, request):
        from django.db.models import Max
        store_card_data = request.data
        initial_import = int(request.data.pop('initial_import'))
        store_card_key_max = models.StoreCard.objects.aggregate(Max('card_key'))
        if store_card_key_max['card_key__max'] is not None:
            store_card_data['card_key'] = store_card_key_max['card_key__max'] + 1
        else:
            store_card_data['card_key'] = 1
        store_card_data['nip'] = self.generar_pin()
        store_card_data['store_id'] = store_card_data['store']
        store_card_data = delete_element_safe(store_card_data,'store')
        new_store_card = models.StoreCard(**store_card_data)
        new_store_card.save()
        if initial_import > 0:
            initial_card_store_charge = models.StoreCardCharge()
            initial_card_store_charge.store_card = new_store_card
            initial_card_store_charge.amount = initial_import
            initial_card_store_charge.comments = "Saldo de inicio"
            initial_card_store_charge.save()
        return Response(serializers.StoreCardWithBalanceSerializer(new_store_card).data)
    
    def store_card_send_email(self, request, pk):
        from GeneralApp.views           import EmailsViewSet
        store_card = models.StoreCard.objects.get(pk=pk)
        context={}
        email_recipients = []
        context={
            'store_card'  : store_card,
            'host'      : request.get_host(),
            'environment':getattr(serverconfig,"environment","http"),
        }
        email_recipients = [store_card.email]
        email_set            = EmailsViewSet.prepare_html_email_from_template("emails/store-card/template.html",
            context,
            email_recipients,
            "Confirmación de Datos de Monedero de Saldo")
        email_set.send()
        return Response()

class StoreCardChargeViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.StoreCardCharge.objects.all()
    serializer_class = serializers.StoreCardChargeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('store_card__card_key', 'amount', 'comments')
    ordering_fields = ('id', 'store_card', 'amount', 'comments', 'timestamp')
    filter_fields = ('id', 'store_card', 'amount', 'comments', 'timestamp')

class SaleTokenViewSet(viewsets.ModelViewSet):
    permission_classes_by_action = {'vp_list': [permissions.AllowAny],
                                    'sale_token_data': [permissions.AllowAny],
                                    'get_list_services_available': [permissions.AllowAny],
                                    'retrieve_sale': [permissions.AllowAny],
                                    'sale_token_payment': [permissions.AllowAny],
                                    'sale_token_print': [permissions.AllowAny],
                                    'create_sale_token': [permissions.AllowAny],
                                    'default': (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsSuperuser),}
    queryset = models.Sale.objects.all().tableOptimization()
    serializer_class = serializers.SaleSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('status', 'sale_key', 'name_pax', 'time',
        'user_extension__name', 'representative__name', 'service__name', 'service_date',
        'hotel__name', 'sale_type__name','room',
        'confirm_provider', 'comments', 
        'property', 'property__name',)
    filter_fields = ('id', 'status', 'sale_key', 'name_pax', 'time',
        'user_extension', 'representative', 'service', 'service_date', 'schedule', 
        'hotel', 'sale_type', 'adults', 'childs',
        'discount_type', 'discount',
        'overcharged', 'room', 'confirm_provider', 
        'comments', 'property',)
    
    def get_permissions(self):
        try:
            return [permission() for permission in self.permission_classes_by_action[self.action]]
        except KeyError as e:
            return [permission() for permission in self.permission_classes_by_action['default']]
    
    def vp_list(self,request):
        from GeneralApp.models import Property
        from GeneralApp.serializers import PropertySerializer
        properties = Property.objects.filter(code__contains="VP")
        return Response(PropertySerializer(properties, many=True).data) 
    
    def sale_token_data(self,request,pk):
        from django.db.models import Q
        from GeneralApp.models import Property, UserExtension, Representative, SaleType, Hotel
        from GeneralApp.serializers import PropertySerializer, UserExtensionSerializer, RepresentativeSerializer, SaleTypeSerializer, HotelSerializer, ExchangeRateSerializer
        from SalesApp.models import ClientType
        from SalesApp.serializers import ClientTypeSerializer, PaymentMethodSerializer
        property = Property.objects.filter(id=pk,code__contains="VP").first()
        if property is None:
            print('propiedad')
            raise CustomValidation('Este hotel no esta disponible', 'error', status.HTTP_400_BAD_REQUEST)
        perm = Permission.objects.get(codename='sales_management')
        user_extension = UserExtension.objects.filter(
                Q(user__groups__permissions=perm) | Q(user__user_permissions=perm),
                properties__id__exact=property.id,
            ).first()
        if user_extension is None:
            print('usuario')
            raise CustomValidation('Este hotel no esta disponible', 'error', status.HTTP_400_BAD_REQUEST)
        exchange_rate = ExchangeRate.objects.filter(start_date__lte=date.today(),type='SALE',property=property).order_by("-start_date").first()
        if exchange_rate is None:
            raise CustomValidation('No hay tipo de cambio disponible', 'error', status.HTTP_400_BAD_REQUEST)
        representative = None
        if user_extension.representative is not None:
            representative = user_extension.representative
        else:
            representative = Representative.objects.filter(property=property,is_sale_online=True, active=True).first()
        client_type = ClientType.objects.filter(property=property).first()
        sale_type = SaleType.objects.filter(property=property,is_sale_online=True).first()
        hotel = Hotel.objects.filter(properties__id__exact=property.id).first()
        if representative is None or client_type is None or sale_type is None or hotel is None:
            print('{}|{}|{}|{}'.format(representative,client_type,sale_type,hotel))
            raise CustomValidation('Este hotel no esta disponible', 'error', status.HTTP_400_BAD_REQUEST)
        payment_methods = sale_type.payment_methods.filter(Q(currency='MN') | Q(currency='USD'),card_charge=True)
        if not payment_methods.exists():
            print('metodo de pago')
            raise CustomValidation('Este hotel no esta disponible', 'error', status.HTTP_400_BAD_REQUEST)
        return Response({
            'user_extension':UserExtensionSerializer(user_extension).data,
            'representative':RepresentativeSerializer(representative).data,
            'client_type':ClientTypeSerializer(client_type).data,
            'sale_type':SaleTypeSerializer(sale_type).data,
            'hotel':HotelSerializer(hotel).data,
            'exchange_rate':ExchangeRateSerializer(exchange_rate).data,
        })
    
    def get_list_services_available(self,request,pk):
        from GeneralApp.serializers import ServiceSerializer
        service_list = []
        property = Property.objects.filter(id=pk,code__contains="VP").first()
        adults = int(request.GET['adults'])
        childs = int(request.GET['childs'])
        service_date = datetime.strptime(request.GET['service_date'], '%Y-%m-%d').date()
        services = Service.objects.dateSimple(service_date).filter(properties__in=[property],is_sale_online=True).distinct()
        for service in services:
            service_rate = models.ServiceRate.objects.dateSimple(service_date).filter(service=service).order_by("start_date")
            if childs > 0:
                service_rate = service_rate.filter(child_price__gt=0)
            service_rate = service_rate.first()
            if service_rate is not None:
                service_data = {
                    'service': ServiceSerializer(service).data,
                    'service_rate': serializers.ServiceRateSerializer(service_rate).data
                }
                service_has_availability_group,schedules=self.schedule_availables(service_date,service,property,adults,childs)
                if service_has_availability_group is True and len(schedules)>0:
                    service_data['schedules'] = schedules
                    service_list.append(service_data)
                elif service_has_availability_group is False:
                    service_data['schedules'] = None
                    service_data['service_rate'] = serializers.ServiceRateSerializer(service_rate).data
                    service_list.append(service_data)
        return Response(service_list)
    
    def schedule_availables(self,service_date,service,property,adults,childs):
        service_has_availability_group = False
        week_num = service_date.weekday()
        schedules = []
        availabilities = models.Availability.objects.dateSimple(service_date).filter(availability_group=service.availability_group)
        for availability in availabilities:
            service_has_availability_group = True
            if availability.schedule_1 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_1,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
            if availability.schedule_2 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_2,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
            if availability.schedule_3 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_3,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
            if availability.schedule_4 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_4,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
            if availability.schedule_5 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_5,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
            if availability.schedule_6 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_6,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
            if availability.schedule_7 is not None:
                data = schedule_available_data(service.availability_group,availability.schedule_7,week_num,service_date,None,property,None)
                if data is not None:
                    reserved = data['reserved'] + adults + childs
                    if data['limit'] >= reserved:
                        schedules.append(data)
        return service_has_availability_group,schedules
    
    def retrieve_sale(self, request, uid):
        from GeneralApp.serializers import ExchangeRateSerializer
        ppts = models.PendingPaymentTokenSale.objects.get(uuid=uid)
        exchange_rate = ExchangeRate.objects.filter(start_date__lte=ppts.sale.sale_date.date(),type='SALE',property=ppts.sale.property).order_by("-start_date").first()
        ppts_data = serializers.PendingPaymentTokenSaleSerializer(ppts).data
        ppts_data['exchange_rate'] = ExchangeRateSerializer(exchange_rate).data
        return Response(ppts_data)
    
    @transaction.atomic
    def create_sale_token(self, request):
        from SalesApp.controllers import sale_subtotal
        from GeneralApp.serializers import ExchangeRateSerializer
        from django.db.models import Max, Q
        try:
            sale_data = request.data
            sale_payments = request.data.pop('sale_payments')
            service = Service.objects.filter(id=sale_data['service']).first()
            if sale_data['time'] is not None and service.availability_group is not None:
                time = self.text_to_time(sale_data['time'])
                property = Property.objects.filter(id=sale_data['property']).first()
                if self.check_availability(sale_data['adults'],sale_data['childs'],service,sale_data['service_date'],time,property,None) == False:
                    raise CustomValidation('Venta: no hay disponibilidad para el servicio, revise las fechas o la hora', 'error', status.HTTP_400_BAD_REQUEST)
            print('checks ready')
            sale_data = self.reform_sale_data(sale_data)
            new_sale = self.new_sale_key(sale_data)
            print('create sale')
            sale_payment = models.SalePayment()
            sale_payment.sale = new_sale
            sale_payment.payment_method = new_sale.sale_type.payment_methods.filter(currency='USD',card_charge=True).first()
            query_new_sale = models.Sale.objects.filter(id=new_sale.id).ratesAnnotate().first()
            totals = sale_subtotal(query_new_sale)
            sale_payment.amount = totals['total_num']
            sale_payment.save()
            print('create sale payment')
            uuid_ = uuid.uuid4()
            credit_charge_data = self.credit_charge_request(request.get_host(),new_sale,sale_payment,uuid_)
            ppts = models.PendingPaymentTokenSale()
            ppts.uuid = uuid_
            ppts.credit_charge = credit_charge_data['credit_charge']
            ppts.url = credit_charge_data['url']
            ppts.sale = new_sale
            ppts.save()
            exchange_rate = ExchangeRate.objects.filter(start_date__lte=ppts.sale.sale_date.date(),type='SALE',property=ppts.sale.property).order_by("-start_date").first()
            ppts_data = serializers.PendingPaymentTokenSaleSerializer(ppts).data
            ppts_data['exchange_rate'] = ExchangeRateSerializer(exchange_rate).data
            return Response(ppts_data)
        except models.Sale.SaleKeyDuplicateException:
            transaction.set_rollback(True)
            raise CustomValidation("Error en la secuencia, intente otra vez", 'error', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            if isinstance(e, CustomValidation):
                raise CustomValidation(e.detail['error'], 'error', status.HTTP_400_BAD_REQUEST)
            raise CustomValidation("Error: {}".format(e), 'error', status.HTTP_400_BAD_REQUEST)
    
    def new_sale_key(self,sale_data):
        tries = 1
        new_sale = None
        while new_sale is None and tries < 3:
            try:
                sale = models.Sale.objects.select_for_update().order_by('-sale_key').first()
                sale_data['sale_key'] = sale.sale_key + 1 if sale is not None else 1
                sale_data['sale_date'] = datetime.now()
                new_sale = models.Sale(**sale_data)
                new_sale.save()
            except models.Sale.SaleKeyDuplicateException:
                tries += 1
                new_sale = None
        if new_sale is not None:
            return new_sale
        raise models.Sale.SaleKeyDuplicateException
    
    def text_to_time(self, flight_time):
        try:
            # Intenta analizar el campo de texto como %H:%M:%S
            time = datetime.strptime(flight_time, '%H:%M:%S').time()
        except ValueError:
            try:
                # Si falla, intenta analizar el campo de texto como %H:%M
                time = datetime.strptime(flight_time, '%H:%M').time()
            except ValueError:
                # Si ambos intentos fallan, imprime un mensaje de error o maneja la situación según tu necesidad.
                print("Formato no válido. Se requiere %H:%M:%S o %H:%M.")
                time = None
        return time
    
    def check_availability(self,adults,childs,service,service_date,time,property,sale=None):
        from django.db.models import Sum, F, IntegerField
        date = datetime.strptime(service_date, '%Y-%m-%d').date()
        schedule = schedule_availables(date,service.availability_group,property,sale,time)
        if schedule is None:
            return False
        return int(adults) + int(childs) <= schedule['limit'] - schedule['reserved']
    
    def reform_sale_data(self,sale_data,refund=False):
        sale_data = delete_element_safe(sale_data,'sale_auth_discount')
        sale_data = delete_element_safe(sale_data,'discount_data')
        sale_data = delete_element_safe(sale_data,'sale_date')
        sale_data['representative_id'] = sale_data['representative']
        sale_data = delete_element_safe(sale_data,'representative')
        sale_data = delete_element_safe(sale_data,'representative_name')
        sale_data['reservation_service_id'] = sale_data['reservation_service']
        sale_data = delete_element_safe(sale_data,'reservation_service')
        sale_data['service_id'] = sale_data['service']
        sale_data = delete_element_safe(sale_data,'service')
        sale_data = delete_element_safe(sale_data,'service_data')
        sale_data['user_extension_id'] = sale_data['user_extension']
        sale_data = delete_element_safe(sale_data,'user_extension')
        sale_data = delete_element_safe(sale_data,'user_extension_name')
        sale_data['hotel_id'] = sale_data['hotel']
        sale_data = delete_element_safe(sale_data,'hotel')
        sale_data = delete_element_safe(sale_data,'hotel_name')
        sale_data['service_rate_id'] = sale_data['service_rate']
        sale_data = delete_element_safe(sale_data,'service_rate')
        sale_data = delete_element_safe(sale_data,'service_rate_data')
        sale_data['schedule_id'] = sale_data['schedule']
        sale_data = delete_element_safe(sale_data,'schedule')
        sale_data = delete_element_safe(sale_data,'schedule_time')
        sale_data = delete_element_safe(sale_data,'schedule_max')
        sale_data = delete_element_safe(sale_data,'schedule_reserved')
        sale_data = delete_element_safe(sale_data,'schedule_data')
        if sale_data['time'] == "":
            sale_data = delete_element_safe(sale_data,'time')
        sale_data['sale_type_id'] = sale_data['sale_type']
        sale_data = delete_element_safe(sale_data,'sale_type')
        sale_data = delete_element_safe(sale_data,'sale_type_data')
        sale_data['client_type_id'] = sale_data['client_type']
        sale_data = delete_element_safe(sale_data,'client_type')
        sale_data = delete_element_safe(sale_data,'client_type_data')
        sale_data['property_id'] = sale_data['property']
        sale_data = delete_element_safe(sale_data,'property')
        if refund is False:
            sale_data = delete_element_safe(sale_data,'sale_key')
        return sale_data
        
    def credit_charge_request(self,host,sale,sale_payment,uuid_):
        url = "https://api-qa.dspayment.zone/api/v2/auth/signin"
        payload = json.dumps({
            "username": "RCD_SevQA",
            "password": "Silice2023"
        })
        headers = {
            'Content-Type': 'application/json'
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        json_data = json.loads(response.text)
        print(response.status_code)
        if response.status_code == 201:
            date_time_now = datetime.now().strftime('%s')
            ordenId = "VP{}".format(date_time_now)
            url = "https://api-qa.dspayment.zone/api/v2/recibo/shopping_car"
            webhook =  "http://{}/webhook_payment/{}".format(host,uuid_)
            print(webhook)
            #webhook = "https://sistemasvp.free.beeceptor.com"
            urlReturn =  "http://{}/api/sales/print_sale_token/{}/".format(host,uuid_)
            print(urlReturn)
            print(sale_payment.payment_method.name)
            payload = json.dumps({
                "ordenId": ordenId,
                "nombreCliente": sale.name_pax,
                "emailCliente": sale.email,
                "telefonoCliente": "",
                "subtotal": str(sale_payment.amount),
                "impuestos": "0",
                "concepto": sale_payment.payment_method.name,
                "total": str(sale_payment.amount),
                "urlReturn": urlReturn,
                "urlWebhook": webhook,
                "dealerAccountCode": "-demo",
                "items":[
                    {
                        "cantidad": 1,
                        "producto": sale_payment.payment_method.name, 
                        "precio": sale_payment.amount,
                        "moneda": "USD"
                    },
                ]
            })
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer {}'.format(json_data['data']['token'])
            }
            response = requests.request("POST", url, headers=headers, data=payload)
            json_data = json.loads(response.text)
            print(json_data)
            if response.status_code == 201:
                credit_charge, created = models.CreditCharge.objects.get_or_create(
                    order_id=ordenId,
                )
                return {
                    'url':json_data['url'],
                    'webhook':webhook,
                    'credit_charge':credit_charge
                }
        message = json_data.get('message',None)
        if message is None:
            message = json_data.get('error',"Ocurrio un error en su solicitud, intente mas tarde")
        raise CustomValidation(message, 'error', status.HTTP_400_BAD_REQUEST)
    
    def sale_token_payment(self, request, uid):
        from GeneralApp.serializers import ExchangeRateSerializer
        ppts = models.PendingPaymentTokenSale.objects.get(uuid=uid)
        if ppts.credit_charge.status == "Aprobada" and ppts.credit_charge.transaction_id is not None:
            return redirect('/api/sales/print_sale_token/'+str(ppts.uuid)+'/')
        if abs(datetime.now() - ppts.credit_charge.timestamp.replace(tzinfo=None)) > timedelta(hours=1):
            credit_charge_data = self.credit_charge_request(request.get_host(),ppts.sale,ppts.sale.sale_payments.first(),ppts.uuid)
            ppts.credit_charge = credit_charge_data['credit_charge']
            ppts.url = credit_charge_data['url']
            ppts.save()
        return redirect(ppts.url)
    
    def sale_token_print(self, request, uid):
        from io                     import BytesIO
        from xhtml2pdf              import pisa
        from GeneralApp.serializers import ExchangeRateSerializer
        from django.template.loader import get_template
        ppts = models.PendingPaymentTokenSale.objects.get(uuid=uid)
        if ppts.credit_charge.status == "Aprobada" and ppts.credit_charge.transaction_id is not None:
            sale = models.Sale.objects.filter(id=ppts.sale.id).ratesAnnotate().first()
            if sale.status != "C" or sale.status != "B":
                coupons = []
                coupons.append(SaleViewSet.print_coupon_data(sale,"REIMPRESION"))
                context = {
                    'coupons'                           :   coupons,
                    'user'                              :   request.user,
                    'sale_key'                          :   sale.sale_key,
                    'host'                              :   request.get_host()
                }
                template = get_template('new_sale_coupon_template.html')
                html  = template.render(context)
                result = BytesIO()
                pdf = pisa.pisaDocument(BytesIO(html.encode("latin-1",'replace')), result)
                if not pdf.err:
                    response = HttpResponse(result.getvalue(), content_type='application/pdf')
                    filename = "Cupón: {} {} .pdf".format(sale.id,datetime.now())
                    content = "inline; filename={}".format(filename)
                    response['Content-Disposition'] = content
                    return response
                raise CustomValidation(pdf.err, 'document', status.HTTP_400_BAD_REQUEST)
            return redirect('/')
        return redirect('/api/sales/sale_token/payment/'+str(ppts.uuid)+'/')


        

