from django.shortcuts                   import render
from rest_framework                     import viewsets, permissions, status
from rest_framework.response            import Response
from rest_framework.metadata            import SimpleMetadata, BaseMetadata
from django_filters.rest_framework      import DjangoFilterBackend, FilterSet, BooleanFilter, DateFromToRangeFilter, CharFilter
from rest_framework.filters             import OrderingFilter, SearchFilter
from rest_framework.authtoken.models    import Token
from django.http                        import HttpResponse,JsonResponse
from django.core.exceptions             import PermissionDenied
from GeneralApp.permissions             import HasCatalogModelPermissions,IsProviderManagement,IsCxPManagement,IsCatalogManagement,IsSuperuser,IsValidUserAuthentication
from GeneralApp.utils                   import CustomValidation
from GeneralApp.views                   import UtopiAppMetadataViewMixin, CustomViewSet, PropertiesMetadataViewMixin, PropertyMetadataViewMixin, EmailsViewSet, ProviderMetadataViewMixin, escape_xml
from GeneralApp.models                  import Service, Provider, Property, TRANSFER_TYPE_CHOICES, Unit, Hotel, SaleType, OperationType, DepartmentCECOS
from GeneralApp.serializers             import ProviderSerializer, HotelSerializer, SaleTypeSerializer, OperationTypeSerializer
from GeneralApp.controllers             import valid_property
from OperationsApp                      import serializers, models, querysets
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models         import User, Group, Permission
from datetime                           import time, date, datetime, timezone, timedelta
import logging
from operacionesVP import serverconfig
from xml.sax.saxutils import escape

def daterange(start_date, due_date):
    due_date = due_date + timedelta(1)
    for n in range(int((due_date - start_date).days)):
        yield start_date + timedelta(n)

def get_boolean_from_request(request, key, method='POST'):
	" gets the value from request and returns it's boolean state "
	value = getattr(request, method).get(key, False)
	
	if value == 'False' or value == 'false' or value == '0' or value == 0:
		value = False
	elif value: 
		value = True
	else:
		value = False
		
	return value

def log(reservation_id, type, user_extension, field, old_data, new_data):
    try:
        reservation_log = models.ReservationLog(
            reservation_id=reservation_id,
            type=type,
            user_extension=user_extension,
            field=field,
            old_data=old_data,
            new_data=new_data,
        )
        reservation_log.save()
    except Exception as e:
        db_logger = logging.getLogger('db')
        db_logger.exception(e)

def opera_credentials(brand):
    HOSTOPERA = getattr(serverconfig,"HOSTOPERA","opera-ows-qas.rcdhotels.com")
    USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERA","IFC.CANTO")
    USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORD","OPERA2024")
    USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORD","OPERA2024")
    HOTEL_KEY = ""
    if brand == "UNICO":
        HOTEL_KEY = "UHPCM"
        HOSTOPERA = getattr(serverconfig,"HOSTOPERAUNICO","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERAUNICO","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORDUNICO","OPERA2024")
    if brand == "NOBU":
        HOTEL_KEY = "NHSJD"
        HOSTOPERA = getattr(serverconfig,"HOSTOPERANOBU","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERANOBU","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORDNOBU","OPERA2024")
    if brand == "AVA":
        HOTEL_KEY = "AHCUN"
        HOSTOPERA = getattr(serverconfig,"HOSTOPERAAVA","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERAAVA","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORDAVA","OPERA2024")
    return {
        'HOSTOPERA':HOSTOPERA,
        'USERNAMEOPERA':USERNAMEOPERA,
        'USERNAMEPASSWORD':USERNAMEPASSWORD,
        'HOTEL_KEY':HOTEL_KEY
    }

        
# Create your views here.
class ContactViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Contact.objects.all()
    serializer_class = serializers.ContactSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'properties')

class ReservationTableFilterSet(FilterSet):
    reservation_date = DateFromToRangeFilter(field_name='reservation_date')
    arrival_date = DateFromToRangeFilter(field_name='arrival_date',label='Llegada')
    arrival_flight = CharFilter(field_name='arrival_flight',lookup_expr='icontains')
    arrival_service = CharFilter(field_name='arrival_service',lookup_expr='icontains')
    arrival_hotel = CharFilter(field_name='arrival_hotel',lookup_expr='icontains')
    departure_date = DateFromToRangeFilter(field_name='departure_date',label='Salida')
    departure_flight = CharFilter(field_name='departure_flight',lookup_expr='icontains')
    departure_service = CharFilter(field_name='departure_service',lookup_expr='icontains')
    departure_hotel = CharFilter(field_name='departure_hotel',lookup_expr='icontains')
    pax = CharFilter(field_name='pax',lookup_expr='icontains')
    opera_code = CharFilter(field_name='opera_code',lookup_expr='icontains')
    class Meta:
        model = models.Reservation
        fields = ['id', 'opera_code', 'pax',
        'user_extension', 'user_extension__user__username','contact', 'country', 'email',
        'department_cecos', 'address', 'reservation_date',
        'sale_type', 'sale_type__name', 'amount', 'property',]

class ReservationTableViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.Reservation.objects.all()
    serializer_class = serializers.ReservationTableSerializer
    filterset_class = ReservationTableFilterSet
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('opera_code','user_extension__user__name', 
        'contact__name', 'country', 'email',
        'department_cecos__name', 'address', 'reservation_date',  
        'sale_type__name','amount', 'comments', 
        'property', 'property__name',)
    order_fields =(
        'date','sale_type__name','pax','opera_code'
        'pax_num','id','arrival_date','arrival_flight'
        'arrival_service','arrival_hotel','departure_date',
        'departure_flight','departure_service','departure_hotel',
        'hotel'
    )
    
    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.tableAnnotation().tableOptimization()
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.bySameProperty(user_extension).distinct()
        return queryset

class ReservationViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.Reservation.objects.all()
    serializer_class = serializers.ReservationSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('opera_code','user_extension__user__name', 
        'contact__name', 'country', 'email',
        'department_cecos__name', 'address', 'reservation_date',  
        'sale_type__name','amount', 'comments', 
        'property', 'property__name',)
    filter_fields = ('id', 'opera_code', 
        'user_extension','contact', 'country', 'email',
        'department_cecos', 'address', 'reservation_date',
        'sale_type', 'amount', 'property',)
    
    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.tableOptimization()
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.bySameProperty(user_extension).distinct()
        return queryset
    
    def date_for_reservation(self, request):
        return Response(date.today())
    
    def create(self, request):
        reservation_data = request.data
        reservation_services = request.data.pop('reservation_services')
        reservation_data = self.reform_reservation_data(reservation_data)
        new_reservation = models.Reservation(**reservation_data)
        new_reservation.save()
        user_extension = models.UserExtension.objects.get(user=request.user)
        log(new_reservation.id,"Nueva reserva",user_extension,None,None,None)
        self.save_reservation_services(new_reservation,reservation_services,user_extension)
        return Response(serializers.ReservationSerializer(new_reservation).data)

    def update(self, request, pk):
        reservation = models.Reservation.objects.get(pk=pk)
        if reservation.status == "CANCEL":
            raise CustomValidation('Esta reservación ya esta cancelada', 'error', status.HTTP_400_BAD_REQUEST)
        reservation_data = request.data
        reservation_services = request.data.pop('reservation_services')
        reservation_data = self.reform_reservation_data(reservation_data)
        user_extension = models.UserExtension.objects.get(user=request.user)
        self.check_reservation_changes(models.Reservation.objects.get(id=pk),reservation_data,user_extension)
        #models.Reservation.objects.filter(id=pk).update(**reservation_data)
        reservation = models.Reservation.objects.get(id=pk)
        reservation.__dict__.update(**reservation_data)
        reservation.full_clean()
        reservation.save()
        reservation = models.Reservation.objects.get(pk=pk)
        self.save_reservation_services(reservation,reservation_services,user_extension,False)
        return Response(serializers.ReservationSerializer(reservation).data)
    
    def check_reservation_changes(self,reservation,reservation_data,user_extension):
        title = "Modificacion de reserva"

        if reservation.reservation_date.strftime('%Y-%m-%d') != str(reservation_data['reservation_date']):
            log(reservation.id,title,user_extension,"Fecha de reservación",reservation.reservation_date.strftime('%Y-%m-%d'),str(reservation_data['reservation_date']))

        if reservation.sale_type.id != reservation_data['sale_type_id']:
            sale_type = SaleType.objects.get(id=reservation_data['sale_type_id'])
            log(reservation.id,title,user_extension,"Tipo de venta",reservation.sale_type.name,sale_type.name)

        reference_value = reservation.contact.id if reservation.contact is not None else None
        contact_id = int(reservation_data.get('contact_id', None)) if reservation_data.get('contact_id', None) is not None else None
        if reference_value != contact_id:
            contact = models.Contact.objects.get(id=contact_id)
            log(reservation.id,title,user_extension,"Contacto",reservation.contact.name if reservation.contact is not None else "", contact.name if contact is not None else "")
        
        reference_value = reservation.department_cecos.id if reservation.department_cecos is not None else None
        department_cecos_id = int(reservation_data.get('department_cecos_id', None))  if reservation_data.get('department_cecos_id', None) is not None else None
        if reference_value != department_cecos_id:
            department_cecos = DepartmentCECOS.objects.get(id=department_cecos_id)
            log(reservation.id,title,user_extension,"Departamento Cecos",reservation.department_cecos.name if reservation.department_cecos is not None else "", department_cecos.name if department_cecos is not None else "")
        
        if reservation.opera_code != reservation_data['opera_code']:
            log(reservation.id,title,user_extension,"Opera code",reservation.opera_code,str(reservation_data['opera_code']))

        if reservation.pax != reservation_data['pax']:
            log(reservation.id,title,user_extension,"Pasajero",reservation.pax,str(reservation_data['pax']))

        if reservation.country != reservation_data['country']:
            log(reservation.id,title,user_extension,"Pais",reservation.country,str(reservation_data['country']))
        
        if reservation.email != reservation_data['email']:
            log(reservation.id,title,user_extension,"Correo",reservation.email,str(reservation_data['email']))

        if reservation.memberships != reservation_data['memberships']:
            log(reservation.id,title,user_extension,"Membresia",reservation.memberships,str(reservation_data['memberships']))

        if reservation.address != reservation_data['address']:
            log(reservation.id,title,user_extension,"Direccion",reservation.address,str(reservation_data['address']))
        
        if reservation.amount != reservation_data['amount']:
            if reservation.amount is not None:
                amount = (reservation.amount[:98] + '..') if len(reservation.amount) > 100 else reservation.amount
            else: 
                amount = ""
            if reservation_data['amount'] is not None:
                amount_reservation_data = (reservation_data['amount'][:98] + '..') if len(reservation_data['amount']) > 100 else reservation_data['amount']
            else: 
                amount_reservation_data = ""
            log(reservation.id,title,user_extension,"Comentarios carta confirmacion",amount,amount_reservation_data)

        if reservation.property.id != int(reservation_data['property_id']):
            property = Property.objects.get(id=reservation_data['property_id'])
            log(reservation.id,title,user_extension,"Propiedad",reservation.property.name,property.name)

        if reservation.comments != reservation_data['comments']:
            if reservation.comments is not None:
                comments = (reservation.comments[:98] + '..') if len(reservation.comments) > 100 else reservation.comments
            else: 
                comments = ""
            if reservation_data['comments'] is not None:
                comments_reservation_data = (reservation_data['comments'][:98] + '..') if len(reservation_data['comments']) > 100 else reservation_data['comments']
            else:
                comments_reservation_data = ""
            log(reservation.id,title,user_extension,"Comentarios",comments,comments_reservation_data)
    
    def reform_reservation_data(self,reservation_data):
        reservation_data['contact_id'] = reservation_data['contact']
        del reservation_data['contact']
        reservation_data['user_extension_id'] = reservation_data['user_extension']
        del reservation_data['user_extension']
        del reservation_data['user_extension_name']
        reservation_data['department_cecos_id'] = reservation_data['department_cecos']
        del reservation_data['department_cecos']
        reservation_data['sale_type_id'] = reservation_data['sale_type']
        del reservation_data['sale_type']
        reservation_data['property_id'] = reservation_data['property']
        del reservation_data['property']
        return reservation_data
    
    def reform_reservation_service_data(self,reservation_service_data):
        from SalesApp.views import delete_element_safe
        reservation_service_data['service_id'] = reservation_service_data['service']
        del reservation_service_data['service']
        del reservation_service_data['service_name']
        reservation_service_data['origin_id'] = reservation_service_data['origin']
        del reservation_service_data['origin']
        del reservation_service_data['origin_name']
        reservation_service_data['destination_id'] = reservation_service_data['destination']
        del reservation_service_data['destination']
        del reservation_service_data['destination_name']
        reservation_service_data['operation_type_id'] = reservation_service_data['operation_type']
        del reservation_service_data['operation_type']
        del reservation_service_data['operation_type_name']
        reservation_service_data['flight_id'] = reservation_service_data['flight']
        del reservation_service_data['flight']
        del reservation_service_data['flight_time']
        reservation_service_data['real_flight_time'] = reservation_service_data['real_flight_time'] if reservation_service_data['real_flight_time'] != "" else None
        reservation_service_data['pick_up_time_id'] = reservation_service_data['pick_up_time']
        del reservation_service_data['pick_up_time']
        del reservation_service_data['pick_up_time_data']
        reservation_service_data['real_pick_up_time'] = reservation_service_data['real_pick_up_time'] if reservation_service_data['real_pick_up_time'] != "" else None
        reservation_service_data = delete_element_safe(reservation_service_data,'valid_sale')

        return reservation_service_data

    def save_reservation_services(self,reservation,reservation_services,user_extension,create=True):
        try:
            if create:
                for reservation_service_data in reservation_services:
                    reservation_service_data = self.reform_reservation_service_data(reservation_service_data)
                    reservation_service_data['reservation'] = reservation
                    new_reservation_service = models.ReservationService(
                        **reservation_service_data
                    )
                    new_reservation_service.save()
                    new_reservation_service_date = datetime.strptime(new_reservation_service.date, '%Y-%m-%d').date()
                    if new_reservation_service.transfer_type == "DEPARTURES":
                        log(reservation.id,"Nueva salida {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    elif new_reservation_service.transfer_type == "ARRIVALS":
                        log(reservation.id,"Nueva llegada {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    elif new_reservation_service.transfer_type == "INTERHOTEL":
                        log(reservation.id,"Nuevo Interhotel {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
            else:
                exclude_ids = []
                items_to_update = []
                items_to_save = []
                for reservation_service_data in reservation_services:
                    reservation_service_data = self.reform_reservation_service_data(reservation_service_data)
                    reservation_service_data['reservation'] = reservation
                    if reservation_service_data['id'] is not None:
                        exclude_ids.append(reservation_service_data['id'])
                        items_to_update.append(reservation_service_data)
                    else:
                        items_to_save.append(reservation_service_data)
                items = models.ReservationService.objects.filter(reservation=reservation)
                if len(exclude_ids) > 0:
                    items_to_delete = items.exclude(id__in=exclude_ids)
                    items = items.filter(id__in=exclude_ids)
                    for item_to_delete in items_to_delete:
                        if item_to_delete.transfer_type == "DEPARTURES":
                            log(reservation.id,"Eliminación de salida {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                        elif item_to_delete.transfer_type == "ARRIVALS":
                            log(reservation.id,"Eliminación llegada {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                        elif item_to_delete.transfer_type == "INTERHOTEL":
                            log(reservation.id,"Eliminación Interhotel {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    items_to_delete.delete()
                elif len(exclude_ids) == 0 and len(items_to_update) == 0 and len(items_to_save) == 0:
                    for item_to_delete in items:
                        if item_to_delete.transfer_type == "DEPARTURES":
                            log(reservation.id,"Eliminación de salida {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                        elif item_to_delete.transfer_type == "ARRIVALS":
                            log(reservation.id,"Eliminación llegada {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                        elif item_to_delete.transfer_type == "INTERHOTEL":
                            log(reservation.id,"Eliminación Interhotel {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    items.delete()
                    
                for item_to_update in items_to_update:
                    reservation_service = models.ReservationService.objects.filter(id=item_to_update['id']).first()
                    if reservation_service is not None:
                        self.check_reservation_service_changes(reservation,reservation_service,item_to_update,user_extension)
                for item_to_save in items_to_save:
                    new_reservation_service = models.ReservationService(
                        **item_to_save
                    )
                    new_reservation_service.save()
                    new_reservation_service_date = datetime.strptime(new_reservation_service.date, '%Y-%m-%d').date()
                    if new_reservation_service.transfer_type == "DEPARTURES":
                        log(reservation.id,"Nueva salida {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    elif new_reservation_service.transfer_type == "ARRIVALS":
                        log(reservation.id,"Nueva llegada {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    elif new_reservation_service.transfer_type == "INTERHOTEL":
                        log(reservation.id,"Nuevo Interhotel {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
        except Exception as e:
            raise CustomValidation('Ha ocurrido un error al guardar, verifique los datos de reserva. Error:{}'.format(e), 'error', status.HTTP_400_BAD_REQUEST)

    def check_reservation_service_changes(self,reservation,reservation_service,item_to_update,user_extension):
        title = ""
        if reservation_service.transfer_type == "DEPARTURES":
            title = "Modificación de salida {}".format(reservation_service.date.strftime('%d/%m/%Y'))
        elif reservation_service.transfer_type == "ARRIVALS":
            title = "Modificación llegada {}".format(reservation_service.date.strftime('%d/%m/%Y'))
        elif reservation_service.transfer_type == "INTERHOTEL":
            title = "Modificación Interhotel {}".format(reservation_service.date.strftime('%d/%m/%Y'))

        if reservation_service.room != item_to_update['room']:
            reservation_service.room = item_to_update['room']
            log(reservation.id,title,user_extension,"Habitación",reservation_service.room,item_to_update['room'])

        if reservation_service.confirmation != item_to_update['confirmation']:
            reservation_service.confirmation = item_to_update['confirmation']
            log(reservation.id,title,user_extension,"Confirmación",reservation_service.confirmation, item_to_update['confirmation'])

        if reservation_service.comments != item_to_update['comments']:
            if reservation_service.comments is not None:
                comments = (reservation_service.comments[:98] + '..') if len(reservation_service.comments) > 100 else reservation_service.comments
            else: 
                comments = ""
            if item_to_update['comments'] is not None:
                comments_reservation_data = (item_to_update['comments'][:98] + '..') if len(item_to_update['comments']) > 100 else item_to_update['comments']
            else:
                comments_reservation_data = ""
            reservation_service.comments = item_to_update['comments']
            log(reservation.id,title,user_extension,"Comentarios",comments,comments_reservation_data)

        reference_value = reservation_service.flight.id if reservation_service.flight is not None else None
        reservation_service.flight_code = item_to_update['flight_code']
        reservation_service.flight_field = item_to_update['flight_field']
        flight_id = int(item_to_update.get('flight_id', None))  if item_to_update.get('flight_id', None) is not None else None
        if reference_value != flight_id:
            flight = models.Flight.objects.filter(id=flight_id).first()
            log(reservation.id,title,user_extension,"Vuelo",reservation_service.flight.code if reservation_service.flight is not None else "", flight.code if flight is not None else "")
            reservation_service.flight = flight

        value = self.time_to_text(reservation_service.real_flight_time)
        if value != item_to_update['real_flight_time']:
            reservation_service.real_flight_time = item_to_update['real_flight_time']
            log(reservation.id,title,user_extension,"Tiempo real de vuelo",value,item_to_update['real_flight_time'])

        value = self.time_to_text(reservation_service.real_pick_up_time)
        if value != item_to_update['real_pick_up_time']:
            reservation_service.real_pick_up_time = item_to_update['real_pick_up_time']
            log(reservation.id,title,user_extension,"Tiempo real de pick up",value,item_to_update['real_pick_up_time'])
        pick_up_time = None
        if item_to_update['pick_up_time_id'] is not None:
            pick_up_time = models.PickUpTime.objects.filter(id=item_to_update['pick_up_time_id']).first()
        reservation_service.pick_up_time = pick_up_time

        if reservation_service.date.strftime('%Y-%m-%d') != item_to_update['date']:
            old_date = reservation_service.date.strftime('%Y-%m-%d')
            reservation_service.date = item_to_update['date']
            log(reservation.id,title,user_extension,"Fecha de traslado",old_date,item_to_update['date'])

        if (self.check_valid_sale(reservation_service) == False and reservation_service.unit is None) or user_extension.user.has_perm("OperationsApp.reservations_management") or reservation_service.transfer_type == "DEPARTURES":
            reference_value = reservation_service.origin.id if reservation_service.origin is not None else None
            origin_id = int(item_to_update.get('origin_id', None))  if item_to_update.get('origin_id', None) is not None else None
            if reference_value != origin_id:
                origin = Hotel.objects.filter(id=origin_id).first()
                reservation_service.origin = origin
                log(reservation.id,title,user_extension,"Origen",reservation_service.origin.name if reservation_service.origin is not None else "", origin.name if origin is not None else "")
            
        if (self.check_valid_sale(reservation_service) == False and reservation_service.unit is None) or user_extension.user.has_perm("OperationsApp.reservations_management"):

            if reservation_service.service.id != int(item_to_update['service_id']):
                service = Service.objects.get(id=item_to_update['service_id'])
                reservation_service.service = service
                log(reservation.id,title,user_extension,"Servicio",reservation_service.service.name,service.name)
        
            reference_value = reservation_service.destination.id if reservation_service.destination is not None else None
            destination_id = int(item_to_update.get('destination_id', None))  if item_to_update.get('destination_id', None) is not None else None
            if reference_value != destination_id:
                destination = Hotel.objects.filter(id=destination_id).first()
                reservation_service.destination = destination
                log(reservation.id,title,user_extension,"Destino",reservation_service.destination.name if reservation_service.destination is not None else "", destination.name if destination is not None else "")

            if reservation_service.transfer_type != item_to_update['transfer_type']:
                reservation_service.transfer_type = item_to_update['transfer_type']
                transfers = dict(TRANSFER_TYPE_CHOICES)
                log(reservation.id,title,user_extension,"Tipo de traslado",transfers[reservation_service.transfer_type],transfers[str(item_to_update['transfer_type'])])

            if int(reservation_service.adults) != int(item_to_update['adults']):
                reservation_service.adults = int(item_to_update['adults'])
                log(reservation.id,title,user_extension,"Adultos",int(reservation_service.adults),int(item_to_update['adults']))

            if int(reservation_service.childs) != int(item_to_update['childs']):
                reservation_service.childs = int(item_to_update['childs'])
                log(reservation.id,title,user_extension,"Menores",int(reservation_service.childs),int(item_to_update['childs']))

            if reservation_service.operation_type.id != int(item_to_update['operation_type_id']):
                operation_type = OperationType.objects.filter(id=item_to_update['operation_type_id']).first()
                reservation_service.operation_type = operation_type
                log(reservation.id,title,user_extension,"Tipo de operación",reservation_service.operation_type.name,operation_type.name)
            
        reservation_service.save()

    def check_valid_sale(self,reservation_service):
        from SalesApp.models import Sale
        sales = reservation_service.sales.filter(status='A')
        for sale in sales:
            if not Sale.objects.filter(status='R',sale_key=sale.sale_key).exists():
                return True
        return False

    def time_to_text(self, time):
        text_time = None
        if time is not None and time != "":
            try:
                # Intenta analizar el campo de texto como %H:%M:%S
                text_time = time.strftime("%H:%M:%S")
            except ValueError:
                print("Formato no válido. Se requiere %H:%M:%S o %H:%M.")
        return text_time

    def cancel_reservation(self, request, pk):
        from SalesApp.models import Sale
        from django.db.models import Q
        reservation = models.Reservation.objects.get(pk=pk)
        user_extension = models.UserExtension.objects.get(user=request.user)
        if reservation.status != "NORMAL":
            return Response({
                'error':"Esta reservación no es valida para cancelacion."
            },400)
        else:
            for reservation_service in reservation.reservation_services.all():
                if reservation_service.sales.exists():
                    sales = reservation_service.sales.filter(status='A')
                    for sale in sales:
                        if not Sale.objects.filter(status='R',sale_key=sale.sale_key).exists():
                            return Response({
                                'error':"Esta reservación tiene ventas activas."
                            },400)

        if reservation.status == "CANCEL": 
            if reservation.user_extension != user_extension and not request.user.has_perm("OperationsApp.reservations_management"):
                return Response({
                    'error':"No tienes permitido hacer una cancelacion de esta reserva."
                },403)
        
        reservation.status = "CANCEL"
        reservation.save()
        log(reservation.id,"Cancelación de reservación",user_extension,None,None,None)
        return Response(serializers.ReservationSerializer(reservation).data)
    
    def reactivate_reservation(self, request, pk):
        from SalesApp.models import Sale
        from django.db.models import Q
        reservation = models.Reservation.objects.get(pk=pk)
        user_extension = models.UserExtension.objects.get(user=request.user)
        if reservation.status != "CANCEL":
            return Response({
                'error':"Esta reservación no es valida para cancelacion."
            },400)

        if reservation.status == "NORMAL": 
            if reservation.user_extension != user_extension and not request.user.has_perm("OperationsApp.reservations_management"):
                return Response({
                    'error':"No tienes permitido hacer una cancelacion de esta reserva."
                },403)
        
        reservation.status = "NORMAL"
        reservation.save()
        log(reservation.id,"Reactivacion de reservación",user_extension,None,None,None)
        return Response(serializers.ReservationSerializer(reservation).data)

    def operations_list(self,request):
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        operations_data = []
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        for date in daterange(start_date, due_date):
            for TRANSFER_TYPE in TRANSFER_TYPE_CHOICES:
                reservation_services = models.ReservationService.objects.tableOptimization().exclude(reservation__status="CANCEL").operationFilterTransferType(date,TRANSFER_TYPE[0],property)
                if reservation_services:
                    operation = {
                        'date':date.strftime('%Y-%m-%d'),
                        'transfer_type':TRANSFER_TYPE[1],
                    }
                    operation.update(reservation_services.paxTotal())
                    operations_data.append(operation)
                
        return Response(operations_data)
    
    def units_agroups(self,reservation_services):
        reservation_services = reservation_services.filter(unit_value__isnull=False).order_by('pup', 'unit_value')
        units = [
            None,
        ]
        for reservation_service in reservation_services:
            filtered = filter(lambda element: reservation_service.unit_value == element, units)
            if len(list(filtered)) == 0:
                units.append(reservation_service.unit_value)
        return units
    
    def operations_list_date(self,request):
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        #units = Unit.objects.operation_pup(date)
        asignment = True
        reservation_services_data = []
        while(asignment):
            reservation_services = models.ReservationService.objects.tableOptimization().exclude(reservation__status="CANCEL").operationFilter(date,property).commentsAnnotate().order_by_operation()
            asignment, reservation_services_data = self.collect_transfers_asigment(reservation_services,date,property)
        units_group = self.units_agroups(reservation_services)
        reservation_services = reservation_services.order_by_units(units_group)
        asignment, reservation_services_data = self.collect_transfers_asigment(reservation_services,date,property)
        providers = Provider.objects.filter(units__in=reservation_services.values_list('unit', flat=True)).distinct()
        return Response({
            'providers':ProviderSerializer(providers,many=True).data,
            'operation':reservation_services_data
        })
    
    def collect_transfers_asigment(self,reservation_services,date,property):
        reservation_services_data = []
        asignment = False
        for reservation_service in reservation_services:
            if reservation_service.asignment is False: 
                if reservation_service.service.is_colective is True:
                    hotel = None
                    if reservation_service.transfer_type == "DEPARTURES":
                        hotel = reservation_service.origin
                    elif reservation_service.transfer_type == "ARRIVALS":
                        hotel = reservation_service.destination
                    if hotel is not None:
                        reservation_service.unit = hotel.unit
                        asignment = True
                else:
                    unit = reservation_service.service.unit
                    reservation_service.unit = unit
                    asignment = True
                    if unit is not None:
                        data = models.ReservationService.objects.tableOptimization().exclude(reservation__status="CANCEL").operationFilter(date,property).lastUnidAsigment(unit)
                        if data['number__max'] is not None:
                            reservation_service.number = data['number__max'] + 1
                        else:
                            reservation_service.number = 1
                reservation_service.asignment = True
                reservation_service.save()
            reservation_services_data.append(serializers.ReservationServiceOperationSerializer(reservation_service).data)
        return asignment, reservation_services_data
        
    def operations_unit_last_asigment(self,request):
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        unit = Unit.objects.get(id=request.GET['unit'])
        data = models.ReservationService.objects.tableOptimization().exclude(reservation__status="CANCEL").operationFilter(date,property).lastUnidAsigment(unit)
        if data['number__max'] is not None:
            return Response({'asigment':data['number__max']})
        else:
            return Response({'asigment':0})
    
    def operations_unit_set_last_asigment(self,request):
        reservation_services = models.ReservationService.objects.filter(id__in=request.data['reservation_services']).exclude(reservation__status="CANCEL")
        unit = Unit.objects.get(id=request.data['unit'])
        asigment = int(request.data['asigment'])
        if unit.is_private:
            for reservation_service in reservation_services:
                reservation_service.unit = unit
                reservation_service.number = asigment
                asigment = asigment + 1
                reservation_service.save()
        else:
            for reservation_service in reservation_services:
                reservation_service.unit = unit
                reservation_service.number = 0
                reservation_service.save()
        return Response({'success':True})

    def operations_unset_unit_asignment(self,request):
        reasigment = request.data.get('reasigment', False)
        reservation_services = models.ReservationService.objects.filter(id__in=request.data['reservation_services']).exclude(reservation__status="CANCEL")
        for reservation_service in reservation_services:
            reservation_service.unit = None
            if reasigment:
                reservation_service.asignment = False
            reservation_service.save()
        return Response({'success':True})
    
    def operations_unset_unit(self,request):
        reservation_services = models.ReservationService.objects.filter(id__in=request.data['reservation_services']).exclude(reservation__status="CANCEL")
        for reservation_service in reservation_services:
            reservation_service.unit = None
            reservation_service.save()
        return Response({'success':True})
    
    def operation_report(self,request):
        from OperationsApp.controllers  import OperatorReportController
        date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        unit = request.GET.get('unit',"")
        hotels = request.GET.get('hotels',"")
        if hotels != "":
            hotels = hotels.split(',')
        else:
            hotels = []
        type = request.GET['type']
        operation_report_controller = OperatorReportController(
            request,
            date,
            property,
            type,
            unit,
            hotels)            
        return operation_report_controller.get_context()
    
    def operation_report_send_email(self,request):
        from OperationsApp.controllers  import OperatorReportController
        date = datetime.strptime(request.data['date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.data['property'])
        unit = request.data.get('unit',"")
        hotels = request.data.get('hotels',"")
        if hotels != "":
            hotels = hotels.split(',')
        else:
            hotels = []
        type = request.data['type']
        providers_ids = request.data.get('providers',[])
        operation_report_controller = OperatorReportController(
            request,
            date,
            property,
            type,
            unit,
            hotels)            
        operation_report_controller.get_context_for_providers(providers_ids)
        return Response({'success':True})
    
    def reservation_confirmation_report(self,reservation,host):
        from GeneralApp.serializers import HotelReportOperationSerializer
        from GeneralApp.models      import ARRIVALS, DEPARTURES, INTERHOTEL
        from django.template.loader import get_template
        from io                     import BytesIO
        from xhtml2pdf              import pisa
        first_reservation_service = models.ReservationService.objects.filter(reservation=reservation).order_by_transfer_type().unitAnnotate().pickupAnnotate().realOperationDateAnnotate().order_by('operation_date','relevancy').first()
        first_hotel = None
        reservation_services = []
        hotel_images = []
        if first_reservation_service is not None:
            if first_reservation_service.transfer_type == "ARRIVALS":
                first_hotel = first_reservation_service.destination
            elif first_reservation_service.transfer_type == "DEPARTURES":
                first_hotel = first_reservation_service.origin
            else:
                if first_reservation_service.destination.priority == True and first_reservation_service.origin.priority == False:
                    first_hotel = first_reservation_service.destination
                else:
                    first_hotel = first_reservation_service.origin
                
        reservation_services = models.ReservationService.objects.filter(reservation=reservation).unitAnnotate().pickupAnnotate().paxConcatAnnotate().realOperationDateAnnotate().tableOptimization()
        reservation_services_arrivals = reservation_services.filter(reservation=reservation,transfer_type=ARRIVALS).order_by('operation_date')
        reservation_services_departures = reservation_services.filter(reservation=reservation,transfer_type=DEPARTURES).order_by('operation_date')
        reservation_services_interhotels = reservation_services.filter(reservation=reservation,transfer_type=INTERHOTEL).order_by('operation_date')
        comments = []
        if reservation.amount != None and reservation.amount != "":
            comments.append(reservation.amount)
        elif reservation.reservation_type == 'Roundtrip':
            comments.append("Round trip- " + ("SHARED SERVICE" if first_reservation_service.service.is_colective else "PRIVATE SERVICE"))
        else:
            comments.append("One way- " + ("SHARED SERVICE" if first_reservation_service.service.is_colective else "PRIVATE SERVICE"))
        
        context = {
            'host'                              :   host,
            'environment'                       :   getattr(serverconfig,"environment","http"),
            'first_hotel'                       :   first_hotel,
            'pax'                               :   reservation.pax,
            'reference'                         :   reservation.id,
            'comments'                          :   comments,
            'hotel_images'                      :   [],
            'reservation_services_arrivals'     :   reservation_services_arrivals,
            'reservation_services_departures'   :   reservation_services_departures,
            'reservation_services_interhotels'   :   reservation_services_interhotels,
        }
        template = get_template('confirmation_letter_template.html')
        lang = "eng"
        if "MEX" in reservation.country or "ESP" in reservation.country or "COLM" in reservation.country or "VENZ" in reservation.country or "MX" in reservation.country:
            lang = "esp"
            template = get_template('confirmation_letter_template_es.html')
        elif "BR" in reservation.country or "PORT" in reservation.country:
            lang = "por"
            template = get_template('confirmation_letter_template_po.html')
        if first_hotel is not None:
            hotel_images = first_hotel.hotel_images.filter(language=lang).order_by("position")
            for hotel_image in hotel_images:
                context['hotel_images'].append(hotel_image.image)
        html  = template.render(context)
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("latin-1",'replace')), result)
        if not pdf.err:
            return result
        raise CustomValidation(pdf.err, 'document', status.HTTP_400_BAD_REQUEST)
    
    def reservation_confirmation_report_send_email(self,request,pk):
        reservation = models.Reservation.objects.reservationType().get(pk=pk)
        if reservation.status == "CANCEL":
            return Response({
                'msg':"Reservación cancelada"
            },400)
        email_recipients = reservation.email.split(";")
        result = self.reservation_confirmation_report(reservation,request.get_host())
        template = "emails/confirmation-reservation/template.html"
        print(reservation.property.name)
        if reservation.property.code == "OP-PC":
            template = "emails/confirmation-reservation/template_pc.html"
        email = EmailsViewSet.prepare_html_email_from_template_pdf_attach(template,
                {'reservation' : serializers.ReservationSerializer(reservation).data,},
                email_recipients,
                "Carta confirmacion Referencia:" + str(reservation.id) + ".pdf",
                result,
                "On Tour Transportation Confirmation / Confirmación de Transportación On Tour"
            )
        email.send()
        return Response({'success':True, 'email': reservation.email})

    def reservation_confirmation_report_download(self,request,pk):
        reservation = models.Reservation.objects.reservationType().get(pk=pk)
        if reservation.status == "CANCEL":
            return Response({
                'msg':"Reservación cancelada"
            },400)
        result = self.reservation_confirmation_report(reservation,request.get_host())
        response = HttpResponse(result.getvalue(), content_type='application/pdf')
        filename = "Carta confirmacion Referencia:" + str(reservation.id) + ".pdf"
        content = "inline; filename={}".format(filename)
        response['Content-Disposition'] = content
        return response
    
    def operation_opera_importation(self,request):
        import requests
        import xmltodict
        import json
        opera_code = request.GET['opera_code']
        brand = request.GET['brand']
        user = request.user
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        opera_key = opera_credentials(brand)
        HOSTOPERA = opera_key["HOSTOPERA"]
        USERNAMEOPERA = opera_key["USERNAMEOPERA"]
        USERNAMEPASSWORD = opera_key["USERNAMEPASSWORD"]
        HOTEL_KEY = opera_key["HOTEL_KEY"]
        url = "https://{}/OWS_WS_51/Reservation.asmx".format(HOSTOPERA)
        opera_code = escape(opera_code)
        if HOTEL_KEY != "":
            payload = self.payload_for_non_hr_hotel(USERNAMEOPERA,USERNAMEPASSWORD,opera_code,HOTEL_KEY)
        else:
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
                "            <AdditionalFilters GetList=\"true\">\n"
                "                <ConfirmationNumber type=\"INTERNAL\" xmlns=\"http://webservices.micros.com/og/4.3/Reservation/\">{}</ConfirmationNumber>\n"
                "            </AdditionalFilters>\n"
                "        </FutureBookingSummaryRequest>\n"
                "    </soap:Body>\n"
                "</soap:Envelope>"
            ).format(USERNAMEOPERA,USERNAMEPASSWORD,opera_code)
        headers = {
            'Host': HOSTOPERA,
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://webservices.micros.com/ows/5.1/Reservation.wsdl#FutureBookingSummary'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            opera_data = xmltodict.parse(response.text)
            if opera_data['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['Result']['@resultStatusFlag'] == "FAIL":
                print(payload)
                print(response.text)
                raise CustomValidation('No se encontro esa reserva', 'error', status.HTTP_400_BAD_REQUEST)
            hotelreservation = opera_data['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['HotelReservations']['r:HotelReservation']
            hotel = Hotel.objects.filter(
                opera_code=hotelreservation['r:RoomStays']['hc:RoomStay']['hc:HotelReference']['@hotelCode'],
                properties=property
            ).first()
            if hotel is None:
                raise CustomValidation('No se encontro hotel para esta propiedad.', 'error', status.HTTP_400_BAD_REQUEST)
            reservation = models.Reservation.objects.filter(opera_code=hotelreservation['r:UniqueIDList']['c:UniqueID'][0]['#text']).first()
            if reservation is not None:
                if reservation.status != "CANCEL" and hotelreservation['@reservationStatus'] != "CANCELED":
                    return Response({'success':True,'reservation':serializers.ReservationSerializer(reservation).data})
                else:
                    raise CustomValidation('La reserva esta cancelada', 'error', status.HTTP_400_BAD_REQUEST)
            else:
                if hotelreservation['@reservationStatus'] != "CANCELED" and hotelreservation['@reservationStatus'] != "CHECKEDOUT":
                    reservation = {
                        'id':None,
                        'opera_code':hotelreservation['r:UniqueIDList']['c:UniqueID'][0]['#text'],
                        'pax':"",
                        'country':"",
                        'address':"",
                        'email':"",
                        'reservation_services':[],
                    }
                    pax = None
                    for profile in hotelreservation['r:ResGuests']['r:ResGuest']['r:Profiles']['Profile']:
                        if not isinstance(profile,str):
                            costumer = profile.get('Customer', None)
                            if costumer is not None:
                                pax = profile
                    if pax is not None:
                        reservation['pax'] = "{} {}".format(pax['Customer']['PersonName'].get('c:firstName',""), pax['Customer']['PersonName'].get('c:lastName',""))
                        address = pax.get('Addresses',None)
                        if address is not None:
                            reservation['country'] = address['NameAddress'].get('c:countryCode',"TBA")
                            reservation['address'] = address['NameAddress'].get('c:AddressLine',"TBA")
                        email = pax.get('EMails',None)
                        if email is not None:
                            reservation['email'] = email.get('NameEmail',"")
                    reservation['user_extension'] = user.extension.id
                    reservation['user_extension_name'] = user.username
                    reservation['contact'] = None
                    reservation['property'] = property.id
                    reservation['department_cecos'] = None
                    reservation['memberships'] = ""
                    reservation['sale_type'] = None
                    reservation['amount'] = 0
                    reservation['reservation_date'] = date.today()
                    reservation_service = {
                        'id':None,
                        'reservation': None,
                        'asignment': False,
                        'date': datetime.strptime(hotelreservation['r:RoomStays']['hc:RoomStay']['hc:TimeSpan']['hc:StartDate'][0:10], '%Y-%m-%d').date(),
                        'confirmation': False,
                        'service': None,
                        'service_name': None,
                        'origin': None,
                        'origin_name': "",
                        'destination': hotel.id if hotel is not None else None,
                        'destination_name': hotel.name if hotel is not None else "",
                        'room': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:RoomTypes']['hc:RoomType'].get('hc:RoomNumber',""),
                        'transfer_type': "ARRIVALS",
                        'adults': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:GuestCounts']['hc:GuestCount'][0]['@count'],
                        'childs': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:GuestCounts']['hc:GuestCount'][1]['@count'],
                        'operation_type': None,
                        'operation_type_name': "",
                        'flight': None,
                        'flight_time': "",
                        'flight_field': "sun_departure",
                        'flight_code': "",
                        'real_flight_time': None,
                        'pick_up_time': None,
                        'pick_up_time_data': None,
                        'real_pick_up_time': None,
                        'comments': "",
                        'no_show': "none",
                        'unit': None,
                        'valid_sale': None,
                    }
                    reservation['reservation_services'].append(reservation_service)
                    reservation_service = {
                        'id':None,
                        'reservation': None,
                        'asignment': False,
                        'date': datetime.strptime(hotelreservation['r:RoomStays']['hc:RoomStay']['hc:TimeSpan']['hc:EndDate'][0:10], '%Y-%m-%d').date(),
                        'confirmation': False,
                        'service': None,
                        'service_name': None,
                        'origin': hotel.id if hotel is not None else None,
                        'origin_name': hotel.name if hotel is not None else "",
                        'destination': None,
                        'destination_name': "",
                        'room': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:RoomTypes']['hc:RoomType'].get('hc:RoomNumber',""),
                        'transfer_type': "DEPARTURES",
                        'adults': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:GuestCounts']['hc:GuestCount'][0]['@count'],
                        'childs': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:GuestCounts']['hc:GuestCount'][1]['@count'],
                        'operation_type': None,
                        'operation_type_name': "",
                        'flight': None,
                        'flight_time': "",
                        'flight_field': "sun_departure",
                        'flight_code': "",
                        'real_flight_time': None,
                        'pick_up_time': None,
                        'pick_up_time_data': None,
                        'real_pick_up_time': None,
                        'comments': "",
                        'no_show': "none",
                        'unit': None,
                        'valid_sale': None,
                    }
                    reservation['reservation_services'].append(reservation_service)
                    return Response({'success':True,'reservation':reservation})
                else:
                    raise CustomValidation('La reserva esta cancelada', 'error', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if isinstance(e, CustomValidation):
                raise CustomValidation('Servicio Opera: {}'.format(e.detail['error']), 'error', status.HTTP_400_BAD_REQUEST)
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
            print(payload)
            raise CustomValidation('Servicio Opera: Error de servicio, intente mas tarde', 'error', status.HTTP_400_BAD_REQUEST)
        
    def payload_for_non_hr_hotel(self,USERNAMEOPERA,USERNAMEPASSWORD,opera_code,HOTEL_KEY):
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
            "            <AdditionalFilters GetList=\"true\">\n"
            "                <HotelReference hotelCode=\"{}\" xmlns=\"http://webservices.micros.com/og/4.3/Reservation/\" />\n"
            "                <ConfirmationNumber type=\"INTERNAL\" xmlns=\"http://webservices.micros.com/og/4.3/Reservation/\">{}</ConfirmationNumber>\n"
            "            </AdditionalFilters>\n"
            "        </FutureBookingSummaryRequest>\n"
            "    </soap:Body>\n"
            "</soap:Envelope>"
        ).format(USERNAMEOPERA,USERNAMEPASSWORD,HOTEL_KEY,opera_code)
        return payload
   
    def operation_report_list_filters(self,request):
        from OperationsApp.controllers  import OperationListController
        type = request.GET['type']
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        if type == "ARRIVALS":
            hotels = Hotel.objects.operation_range_hotel_destination(start_date,due_date,type,property).distinct().order_by('name').values('id','name')
        elif type == "ALL":
            hotels = Hotel.objects.operation_range_hotel(start_date,due_date,property).distinct().order_by('name').values('id','name')
        else:
            hotels = Hotel.objects.operation_range_hotel_origin(start_date,due_date,type,property).distinct().order_by('name').values('id','name')
        sale_types = SaleType.objects.operation_range(start_date,due_date,type,property).distinct().order_by('name').values('id','name')
        services = Service.objects.operation_range(start_date,due_date,type,property).distinct().order_by('name').values('id','name')
        operation_types = OperationType.objects.operation_range(start_date,due_date,type,property).distinct().order_by('name').values('id','name')
        return Response({
            'hotels': hotels,
            'services':services,
            'sale_types': sale_types,
            'operation_types': operation_types,
        })
    
    def operation_report_list_filters_by_year(self,request):
        from OperationsApp.controllers  import OperationListController
        type = request.GET['type']
        year = request.GET['year']
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        if type == "ARRIVALS":
            hotels = Hotel.objects.operation_year_hotel_destination(year,type,property).distinct().order_by('name').values('id','name')
        else:
            hotels = Hotel.objects.operation_year_hotel_origin(year,type,property).distinct().order_by('name').values('id','name')
        sale_types = SaleType.objects.operation_year(year,type,property).distinct().order_by('name').values('id','name')
        return Response({
            'hotels': hotels,
            'sale_types': sale_types,
        })
    
    def operation_report_list(self,request):
        from OperationsApp.controllers  import OperationListController
        type = request.GET['type']
        file = request.GET['file']
        reservation_confirm = request.GET['reservation_confirm']
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
        operation_types = request.GET.get('operation_types','')
        if operation_types != '':
            operation_types = operation_types.split(',')
        else:
            operation_types = []
        if request.user.is_superuser is False:
            if not request.user.has_perm('OperationsApp.access_op_filter_list'):
                raise PermissionDenied()
        report_list = OperationListController(
            request,
            start_date,
            due_date,
            property,
            type,
            file,
            sale_types,hotels,services,operation_types,reservation_confirm)
        return report_list.get_context()
    
    def operation_report_coupons(self,request):
        from OperationsApp.controllers  import OperationCouponController
        type = request.GET['type']
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
        operation_types = request.GET.get('operation_types','')
        if operation_types != '':
            operation_types = operation_types.split(',')
        else:
            operation_types = []
        if request.user.is_superuser is False:
            if not request.user.has_perm('OperationsApp.access_op_filter_coupons'):
                raise PermissionDenied()
        report_list = OperationCouponController(
            request,
            start_date,
            due_date,
            property,
            type,
            sale_types,
            hotels,
            services,
            operation_types)
        return report_list.get_context()
    
    def operation_report_summary(self,request):
        from OperationsApp.controllers  import OperationSummaryController
        type = request.GET['type']
        file = request.GET['file']
        sort_by = request.GET['sort_by']
        print_total = get_boolean_from_request(request,'print_total','GET')
        year = request.GET.get('year',None)
        if year is None:
            start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
            due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        else:
            start_date = None
            due_date = None
        property = Property.objects.get(id=request.GET['property'])
        valid_property(request,property)
        hotels = request.GET.get('hotels','')
        if hotels != '':
            hotels = hotels.split(',')
        else:
            hotels = []
        sale_types = request.GET.get('sale_types','')
        if sale_types != '':
            sale_types = sale_types.split(',')
        else:
            sale_types = []
        if request.user.is_superuser is False:
            if not request.user.has_perm('OperationsApp.access_filter_summary'):
                raise PermissionDenied()
        report_summary = OperationSummaryController(
            request,
            start_date,
            due_date,
            year,
            property,
            type,
            print_total,
            file,
            sort_by,
            sale_types,hotels)
        return report_summary.get_context()

class FlightViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.Flight.objects.all()
    serializer_class = serializers.FlightSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('flight_type', 'start_date', 'due_date', 'code', 'origin', 
            'destination', 'property__name')
    filter_fields = ('id', 'flight_type', 'start_date', 'due_date', 'code', 'origin', 
            'destination', 'property')
    
    def operation_flights(self, request):
        flights = models.Flight.objects.operationFlightFilter(request.GET['date'],request.GET['transfer_type']).filter(property__id=request.GET['property'])
        date_of_week = querysets.FlightQuerySet.days_of_week[datetime.strptime(request.GET['date'], '%Y-%m-%d').weekday()]
        field = date_of_week + '_' + querysets.FlightQuerySet.transfer_types[request.GET['transfer_type']]
        flights_to_return = []
        for flight in flights:
            flight_data = serializers.FlightSerializer(flight).data
            flight_data['field'] = field
            flights_to_return.append(flight_data)
        return Response({
            'results':flights_to_return,
        })

class PickUpViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.PickUp.objects.all()
    serializer_class = serializers.PickUpSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('hotel', 'hotel__name', 'property', 'property__name')
    filter_fields = ('id', 'hotel', 'property')

    def operation_pickuptimes(self, request):
        pickuptime = models.PickUpTime.objects.filter(pick_up__property__id=request.GET['property']).operationPickUpFilter(request.GET['flight_time'],request.GET['hotel'])
        first_flight_time = time(0,31,0)
        flight_time = self.text_to_time(request.GET['flight_time'])
        if pickuptime is None and first_flight_time > flight_time:
            pickuptime = models.PickUpTime.objects.filter(pick_up__property__id=request.GET['property']).operationLastPickUp(request.GET['hotel'])
        pick_up_time = serializers.PickUpTimeSerializer(pickuptime).data
        return Response({
            'pick_up': pick_up_time if pickuptime is not None else pickuptime
        })

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

    def create(self, request):
        pick_up_data = request.data
        new_pick_up = models.PickUp(
            hotel_id=pick_up_data['hotel'],
            property_id=pick_up_data['property']
        )
        new_pick_up.save()
        self.save_pick_up_times(new_pick_up,pick_up_data['pickuptimes'])
        return Response(serializers.PickUpSerializer(new_pick_up).data)

    def update(self, request, pk):
        pick_up_data = request.data
        models.PickUp.objects.filter(id=pk).update(
            hotel_id=pick_up_data['hotel'],
            property_id=pick_up_data['property']
        )
        pick_up = models.PickUp.objects.get(pk=pk)
        self.save_pick_up_times(pick_up,pick_up_data['pickuptimes'],False)
        return Response(serializers.PickUpSerializer(pick_up).data)

    def save_pick_up_times(self,pick_up,pickuptimes,create=True):
        if create:
            flight_time = time(0,31,0)
            i = 0
            while i < 24:
                new_pick_up_time = models.PickUpTime(
                    pick_up=pick_up,
                    flight_time=flight_time,
                    time=pickuptimes[i].get('time',time(0,0,0)),
                )
                new_pick_up_time.save()
                i = i + 1
                dt = datetime.combine(date.today(), flight_time) + timedelta(hours=1)
                flight_time = dt.time()
        else:
            for pickuptime in pickuptimes:
                pick_up_time = models.PickUpTime.objects.get(pk=pickuptime['id'])
                pick_up_time.time = pickuptime['time']
                pick_up_time.save()

class ReservationLogViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.ReservationLog.objects.all()
    serializer_class = serializers.ReservationLogSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('timestamp', 'type', 'user_extension__user__name', 'field', 'old_data', 'new_data',)
    ordering_fields = ('reservation_id','timestamp', 'type', 'user_extension__user__name', 'field', 'old_data', 'new_data',)
    filter_fields = ('id', 'reservation_id','timestamp', 'type', 'user_extension', 'field', 'old_data', 'new_data',)

    def get_queryset(self):
        queryset = self.queryset
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.propertyAnnotate(user_extension).distinct()
        return queryset

class InvoiceOperationViewSet(ProviderMetadataViewMixin,viewsets.ModelViewSet):

    permission_classes_by_action = {'patch_provider': (permissions.IsAuthenticated,IsValidUserAuthentication,IsProviderManagement|IsSuperuser),
                                    'patch_cxp': (permissions.IsAuthenticated,IsValidUserAuthentication,IsCxPManagement|IsSuperuser),
                                    'default': (permissions.IsAuthenticated,IsValidUserAuthentication,IsProviderManagement|IsCxPManagement|IsSuperuser),}
    queryset = models.ReservationService.objects.all()
    serializer_class = serializers.ReservationSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)

    def get_permissions(self):
        try:
            return [permission() for permission in self.permission_classes_by_action[self.action]]
        except KeyError as e:
            return [permission() for permission in self.permission_classes_by_action['default']]

    def invoice_reservation_transfer(self,request):
        from SalesApp.controllers  import sale_subtotal
        from GeneralApp.models     import ExchangeRate, Provider
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        today = date.today()
        if start_date <= today and due_date <= today:
            user_extension = models.UserExtension.objects.get(user=self.request.user)
            provider = user_extension.provider
            if request.user.has_perm('GeneralApp.cxp_permission') or request.user.is_superuser:
                provider = Provider.objects.get(id=request.GET['provider'])
            reservations_services = models.ReservationService.objects.dateRange(start_date,due_date).bySameProvider(provider).distinct()
            reservations_services_to_return = []
            for reservations_service in reservations_services:
                reservations_service_data = serializers.ReservationServiceInvoiceSerializer(reservations_service).data
                sale = reservations_service.sales.filter(status="A").ratesAnnotate().first()
                if sale is not None:
                    reservations_service_data['coupon'] = str(sale.sale_key).zfill(8)
                    sale_total = sale_subtotal(sale)
                    reservations_service_data['cost_usd'] = sale_total['total_cost_num']
                    reservations_service_data['cost_currency'] = 0
                else:
                    reservations_service_data['coupon'] = None
                    reservations_service_data['cost_usd'] = 0
                    reservations_service_data['cost_currency'] = 0
                provider = reservations_service.service.provider
                if provider.currency == "MN":
                    exchange_rate = ExchangeRate.objects.filter(start_date__lte=reservations_service.date,provider=provider).order_by("-start_date").first()
                    if exchange_rate is not None:
                        reservations_service_data['cost_currency'] = reservations_service_data['cost_usd']*exchange_rate.usd_currency
                reservations_services_to_return.append(reservations_service_data)
        else:
            raise CustomValidation("La fecha no puede ser mayor al dia de hoy", 'error', status.HTTP_400_BAD_REQUEST)
        return Response(reservations_services_to_return)
    
    def invoice_reservation_report(self,request):
        from OperationsApp.controllers  import InvoiceOperationReportController
        from GeneralApp.models     import Provider
        start_date = datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        today = date.today()
        print(today)
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        provider = user_extension.provider
        if request.user.has_perm('GeneralApp.cxp_permission') or request.user.is_superuser:
            provider = Provider.objects.get(id=request.GET['provider'])
        report_invoice = InvoiceOperationReportController(
            request,
            start_date,
            due_date,
            provider,
            request.GET['type'])
        return report_invoice.get_context()
        
    def patch_provider(self,request):
        list = request.data['list']
        for reservations_service_data in list:
            models.ReservationService.objects.filter(id=reservations_service_data['id']).update(
                invoice_type=reservations_service_data['invoice_type'],
                no_show=reservations_service_data['no_show']
            )
        return Response({'success':True})
    
    def patch_cxp(self,request):
        list = request.data['list']
        for reservations_service_data in list:
            models.ReservationService.objects.filter(id=reservations_service_data['id']).update(
                invoice_cash_cxp=reservations_service_data['invoice_cash_cxp'],
                no_show=reservations_service_data['no_show']
            )
        return Response({'success':True})

class ReservationCreateTokenViewSet(viewsets.ModelViewSet):
    permission_classes_by_action = {'retrieve_reservation': [permissions.AllowAny],
                                    'update_reservation': [permissions.AllowAny],
                                    'date_for_reservation': [permissions.AllowAny],
                                    'operation_opera_importation': [permissions.AllowAny],
                                    'service_list': [permissions.AllowAny],
                                    'operation_type_list': [permissions.AllowAny],
                                    'hotel_list': [permissions.AllowAny],
                                    'operation_flights': [permissions.AllowAny],
                                    'operation_pickuptimes': [permissions.AllowAny],
                                    'default': (permissions.IsAuthenticated,HasCatalogModelPermissions|IsSuperuser),}
    
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions)
    queryset = models.ReservationCreateToken.objects.all()
    serializer_class = serializers.ReservationCreateTokenSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)

    def get_permissions(self):
        try:
            return [permission() for permission in self.permission_classes_by_action[self.action]]
        except KeyError as e:
            return [permission() for permission in self.permission_classes_by_action['default']]
        
    def date_for_reservation(self, request):
        return Response(date.today())
        
    def operation_opera_importation(self,request):
        import requests
        import xmltodict
        import json
        from GeneralApp.models import UserExtension
        opera_code = request.GET['opera_code']
        if request.GET['user'] is None:
            user_extension =  UserExtension.objects.get(id=1)
        else:
            user_extension =  UserExtension.objects.get(id=request.GET['user'])
        HOSTOPERA = getattr(serverconfig,"HOSTOPERA","opera-ows-qas.rcdhotels.com")
        USERNAMEOPERA = getattr(serverconfig,"USERNAMEOPERA","IFC.CANTO")
        USERNAMEPASSWORD = getattr(serverconfig,"USERNAMEPASSWORD","OPERA2024")
        url = "https://{}/OWS_WS_51/Reservation.asmx"
        opera_code = escape(opera_code)
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
            "            <AdditionalFilters GetList=\"true\">\n"
            "                <ConfirmationNumber type=\"INTERNAL\" xmlns=\"http://webservices.micros.com/og/4.3/Reservation/\">{}</ConfirmationNumber>\n"
            "            </AdditionalFilters>\n"
            "        </FutureBookingSummaryRequest>\n"
            "    </soap:Body>\n"
            "</soap:Envelope>"
        ).format(USERNAMEOPERA,USERNAMEPASSWORD,opera_code)
        headers = {
            'Host': HOSTOPERA,
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://webservices.micros.com/ows/5.1/Reservation.wsdl#FutureBookingSummary'
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload)
            opera_data = xmltodict.parse(response.text)
            if opera_data['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['Result']['@resultStatusFlag'] == "FAIL":
                raise CustomValidation('No se encontro esa reserva', 'error', status.HTTP_400_BAD_REQUEST)
            hotelreservation = opera_data['soap:Envelope']['soap:Body']['FutureBookingSummaryResponse']['HotelReservations']['r:HotelReservation']
            hotel = Hotel.objects.filter(
                opera_code=hotelreservation['r:RoomStays']['hc:RoomStay']['hc:HotelReference']['@hotelCode'],
                properties__code__contains="OP"
            ).first()
            if hotel is None:
                raise CustomValidation('No se encontro esa reserva', 'error', status.HTTP_400_BAD_REQUEST)
            else:
                property = hotel.properties.filter(code__contains="OP").first()
            reservation = models.Reservation.objects.filter(opera_code=hotelreservation['r:UniqueIDList']['c:UniqueID'][0]['#text']).first()
            if reservation is not None:
                raise CustomValidation('Ya existe una reserva para ese codigo opera', 'error', status.HTTP_400_BAD_REQUEST)
            else:
                if hotelreservation['@reservationStatus'] != "CANCELED" and hotelreservation['@reservationStatus'] != "CHECKEDOUT":
                    reservation = {
                        'id':None,
                        'opera_code':hotelreservation['r:UniqueIDList']['c:UniqueID'][0]['#text'],
                        'pax':"",
                        'country':"",
                        'address':"",
                        'email':"",
                        'reservation_services':[],
                    }
                    pax = None
                    for profile in hotelreservation['r:ResGuests']['r:ResGuest']['r:Profiles']['Profile']:
                        if not isinstance(profile,str):
                            costumer = profile.get('Customer', None)
                            if costumer is not None:
                                pax = profile
                    if pax is not None:
                        reservation['pax'] = "{} {} {}".format(pax['Customer']['PersonName'].get('c:nameTitle',""), pax['Customer']['PersonName'].get('c:firstName',""), pax['Customer']['PersonName'].get('c:lastName',""))
                        address = pax.get('Addresses',None)
                        if address is not None:
                            reservation['country'] = address['NameAddress'].get('c:countryCode',"TBA")
                            reservation['address'] = address['NameAddress'].get('c:AddressLine',"TBA")
                        email = pax.get('EMails',None)
                        if email is not None:
                            reservation['email'] = email.get('NameEmail',"")
                    reservation['user_extension'] = user_extension.id
                    reservation['user_extension_name'] = user_extension.user.username
                    contact = models.Contact.objects.filter(properties=property).first()
                    reservation['contact'] = contact.id if contact is not None else None
                    reservation['property'] = property.id
                    reservation['department_cecos'] = None
                    reservation['memberships'] = ""
                    sale_type = SaleType.objects.filter(property=property).first()
                    reservation['sale_type'] = sale_type.id if sale_type is not None else None
                    reservation['amount'] = ""
                    reservation['reservation_date'] = date.today()
                    service_online = None
                    services = Service.objects.filter(properties=property,is_transfer=True,is_online_used=True)
                    for service in services:
                        zones = service.zones.split(",")
                        if str(hotel.zone_id) in zones:
                            service_online = service
                    if service_online is None:
                        raise CustomValidation('No hay servicio disponible para ese hotel, comuniquese con nuestros representantes para revisar este problema', 'error', status.HTTP_400_BAD_REQUEST)
                    operation_type = OperationType.objects.filter(properties=property).first()
                    reservation_service_data = {
                        'transfer_type':"ARRIVALS",
                        'service': service_online.id,
                        'service_name': service_online.name,
                        'destination': hotel.id if hotel is not None else None,
                        'destination_name': hotel.name if hotel is not None else "",
                        'room': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:RoomTypes']['hc:RoomType'].get('hc:RoomNumber',""),
                        'adults': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:GuestCounts']['hc:GuestCount'][0]['@count'],
                        'childs': hotelreservation['r:RoomStays']['hc:RoomStay']['hc:GuestCounts']['hc:GuestCount'][1]['@count'],
                        'operation_type': operation_type.id,
                        'operation_type_name': operation_type.name,
                        'flight': None,
                        'flight_time': "",
                        'flight_field': "sun_departure",
                        'flight_code': "",
                        'real_flight_time': None,
                        'pick_up_time': None,
                        'pick_up_time_data': None,
                        'real_pick_up_time': None,
                        'comments': "",
                        'no_show': "none",
                    }
                    return Response({'success':True,'reservation':reservation,'reservation_service_data':reservation_service_data})
                else:
                    raise CustomValidation('La reserva esta cancelada', 'error', status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if isinstance(e, CustomValidation):
                raise CustomValidation('Servicio Opera: {}'.format(e.detail['error']), 'error', status.HTTP_400_BAD_REQUEST)
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
            raise CustomValidation('Servicio Opera: Error de servicio, intente mas tarde', 'error', status.HTTP_400_BAD_REQUEST)
        
    def retrieve_reservation(self, request, uid):
        from GeneralApp.serializers import DepartmentCECOSSerializer, SaleTypeSerializer
        token = models.ReservationCreateToken.objects.activeTokenByUid(uid)
        departments_cecos = DepartmentCECOS.objects.filter(properties=token.reservation.property)
        sale_types = SaleType.objects.filter(pk=token.reservation.sale_type.id)
        contacts = models.Contact.objects.filter(pk=token.reservation.contact.id)
        return Response({
            'data':serializers.ReservationSerializer(token.reservation).data,
            'departments_cecos':DepartmentCECOSSerializer(departments_cecos,many=True).data,
            'sale_types':SaleTypeSerializer(sale_types,many=True).data,
            'contacts':serializers.ContactSerializer(contacts,many=True).data
        })

    def create_reservation(self, request):
        reservation_data = request.data
        reservation_services = request.data.pop('reservation_services')
        reservation_data = self.reform_reservation_data(reservation_data)
        new_reservation = models.Reservation(**reservation_data)
        new_reservation.save()
        user_extension = models.UserExtension.objects.get(user=request.user)
        log(new_reservation.id,"Nueva reserva Online",user_extension,None,None,None)
        self.save_reservation_services(new_reservation,reservation_services,user_extension)
        reservation_create_token = models.ReservationCreateToken()
        reservation_create_token.reservation = new_reservation
        reservation_create_token.user_extension = new_reservation.user_extension
        reservation_create_token.save()
        return Response({
            'uuid':reservation_create_token.uuid,
            'reservation':serializers.ReservationSerializer(reservation_create_token.reservation).data,
        })

    def update_reservation(self, request, uid):
        token = models.ReservationCreateToken.objects.activeTokenByUid(uid)
        if token.reservation == None:
            reservation_data = request.data
            reservation_services = request.data.pop('reservation_services')
            reservation_data =  self.reform_reservation_data(reservation_data)
            user_extension = models.UserExtension.objects.get(user=request.user)
            self.check_reservation_changes(models.Reservation.objects.get(id=token.reservation.id),reservation_data,user_extension)
            models.Reservation.objects.filter(id=token.reservation.id).update(**reservation_data)
            reservation = models.Reservation.objects.get(pk=token.reservation.id)
            self.save_reservation_services(reservation,reservation_services,user_extension,False)
            return Response(serializers.ReservationSerializer(reservation).data)
        else:
            return Response({'error':"La reservacion ya fue guardada, ya no se permiten mas modificaciones"},404)
        
    def check_reservation_changes(self,reservation,reservation_data,user_extension):
        title = "Modificacion de reserva"

        if reservation.reservation_date.strftime('%Y-%m-%d') != str(reservation_data['reservation_date']):
            log(reservation.id,title,user_extension,"Fecha de reservación",reservation.reservation_date.strftime('%Y-%m-%d'),str(reservation_data['reservation_date']))

        if reservation.sale_type.id != reservation_data['sale_type_id']:
            sale_type = SaleType.objects.get(id=reservation_data['sale_type_id'])
            log(reservation.id,title,user_extension,"Tipo de venta",reservation.sale_type.name,sale_type.name)

        reference_value = reservation.contact.id if reservation.contact is not None else None
        contact_id = int(reservation_data.get('contact_id', None)) if reservation_data.get('contact_id', None) is not None else None
        if reference_value != contact_id:
            contact = models.Contact.objects.get(id=contact_id)
            log(reservation.id,title,user_extension,"Contacto",reservation.contact.name if reservation.contact is not None else "", contact.name if contact is not None else "")
        
        reference_value = reservation.department_cecos.id if reservation.department_cecos is not None else None
        department_cecos_id = int(reservation_data.get('department_cecos_id', None))  if reservation_data.get('department_cecos_id', None) is not None else None
        if reference_value != department_cecos_id:
            department_cecos = DepartmentCECOS.objects.get(id=department_cecos_id)
            log(reservation.id,title,user_extension,"Departamento Cecos",reservation.department_cecos.name if reservation.department_cecos is not None else "", department_cecos.name if department_cecos is not None else "")
        
        if reservation.opera_code != reservation_data['opera_code']:
            log(reservation.id,title,user_extension,"Opera code",reservation.opera_code,str(reservation_data['opera_code']))

        if reservation.pax != reservation_data['pax']:
            log(reservation.id,title,user_extension,"Pasajero",reservation.pax,str(reservation_data['pax']))

        if reservation.country != reservation_data['country']:
            log(reservation.id,title,user_extension,"Pais",reservation.country,str(reservation_data['country']))
        
        if reservation.email != reservation_data['email']:
            log(reservation.id,title,user_extension,"Correo",reservation.email,str(reservation_data['email']))

        if reservation.memberships != reservation_data['memberships']:
            log(reservation.id,title,user_extension,"Membresia",reservation.memberships,str(reservation_data['memberships']))

        if reservation.address != reservation_data['address']:
            log(reservation.id,title,user_extension,"Direccion",reservation.address,str(reservation_data['address']))
        
        if reservation.amount != reservation_data['amount']:
            log(reservation.id,title,user_extension,"Comentarios carta confirmacion",reservation.amount,str(reservation_data['amount']))

        if reservation.property.id != int(reservation_data['property_id']):
            property = Property.objects.get(id=reservation_data['property_id'])
            log(reservation.id,title,user_extension,"Propiedad",reservation.property.name,property.name)

        if reservation.comments != reservation_data['comments']:
            log(reservation.id,title,user_extension,"Comentarios",reservation.comments,str(reservation_data['comments']))
    
    def reform_reservation_data(self,reservation_data):
        reservation_data['contact_id'] = reservation_data['contact']
        del reservation_data['contact']
        reservation_data['user_extension_id'] = reservation_data['user_extension']
        del reservation_data['user_extension']
        del reservation_data['user_extension_name']
        reservation_data['department_cecos_id'] = reservation_data['department_cecos']
        del reservation_data['department_cecos']
        reservation_data['sale_type_id'] = reservation_data['sale_type']
        del reservation_data['sale_type']
        reservation_data['property_id'] = reservation_data['property']
        del reservation_data['property']
        return reservation_data
    
    def reform_reservation_service_data(self,reservation_service_data):
        reservation_service_data['service_id'] = reservation_service_data['service']
        del reservation_service_data['service']
        del reservation_service_data['service_name']
        reservation_service_data['origin_id'] = reservation_service_data['origin']
        del reservation_service_data['origin']
        del reservation_service_data['origin_name']
        reservation_service_data['destination_id'] = reservation_service_data['destination']
        del reservation_service_data['destination']
        del reservation_service_data['destination_name']
        reservation_service_data['operation_type_id'] = reservation_service_data['operation_type']
        del reservation_service_data['operation_type']
        del reservation_service_data['operation_type_name']
        reservation_service_data['flight_id'] = reservation_service_data['flight']
        del reservation_service_data['flight']
        del reservation_service_data['flight_time']
        reservation_service_data['real_flight_time'] = reservation_service_data['real_flight_time'] if reservation_service_data['real_flight_time'] != "" else None
        reservation_service_data['pick_up_time_id'] = reservation_service_data['pick_up_time']
        del reservation_service_data['pick_up_time']
        del reservation_service_data['pick_up_time_data']
        reservation_service_data['real_pick_up_time'] = reservation_service_data['real_pick_up_time'] if reservation_service_data['real_pick_up_time'] != "" else None
        return reservation_service_data

    def save_reservation_services(self,reservation,reservation_services,user_extension,create=True):
        if create:
            for reservation_service_data in reservation_services:
                reservation_service_data = self.reform_reservation_service_data(reservation_service_data)
                reservation_service_data['reservation'] = reservation
                new_reservation_service = models.ReservationService(
                    **reservation_service_data
                )
                new_reservation_service.save()
                new_reservation_service_date = datetime.strptime(new_reservation_service.date, '%Y-%m-%d').date()
                if new_reservation_service.transfer_type == "DEPARTURES":
                    log(reservation.id,"Nueva salida {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                elif new_reservation_service.transfer_type == "ARRIVALS":
                    log(reservation.id,"Nueva llegada {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                elif new_reservation_service.transfer_type == "INTERHOTEL":
                    log(reservation.id,"Nuevo Interhotel {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
        else:
            exclude_ids = []
            items_to_update = []
            items_to_save = []
            for reservation_service_data in reservation_services:
                reservation_service_data = self.reform_reservation_service_data(reservation_service_data)
                reservation_service_data['reservation'] = reservation
                if reservation_service_data['id'] is not None:
                    exclude_ids.append(reservation_service_data['id'])
                    items_to_update.append(reservation_service_data)
                else:
                    items_to_save.append(reservation_service_data)
            items = models.ReservationService.objects.filter(reservation=reservation)
            if len(exclude_ids) > 0:
                items_to_delete = items.exclude(id__in=exclude_ids)
                items = items.filter(id__in=exclude_ids)
                for item_to_delete in items_to_delete:
                    if item_to_delete.transfer_type == "DEPARTURES":
                        log(reservation.id,"Eliminación de salida {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    elif item_to_delete.transfer_type == "ARRIVALS":
                        log(reservation.id,"Eliminación llegada {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                    elif item_to_delete.transfer_type == "INTERHOTEL":
                        log(reservation.id,"Eliminación Interhotel {}".format(item_to_delete.date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                items_to_delete.delete()
                
            for item_to_update in items_to_update:
                reservation_service = models.ReservationService.objects.filter(id=item_to_update['id']).first()
                if reservation_service is not None:
                    self.check_reservation_service_changes(reservation,reservation_service,item_to_update,user_extension)
                models.ReservationService.objects.filter(id=item_to_update['id']).update(**item_to_update)
            for item_to_save in items_to_save:
                new_reservation_service = models.ReservationService(
                    **item_to_save
                )
                new_reservation_service.save()
                new_reservation_service_date = datetime.strptime(new_reservation_service.date, '%Y-%m-%d').date()
                if new_reservation_service.transfer_type == "DEPARTURES":
                    log(reservation.id,"Nueva salida {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                elif new_reservation_service.transfer_type == "ARRIVALS":
                    log(reservation.id,"Nueva llegada {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)
                elif new_reservation_service.transfer_type == "INTERHOTEL":
                    log(reservation.id,"Nuevo Interhotel {}".format(new_reservation_service_date.strftime('%d/%m/%Y')),user_extension,None,None,None)

    def check_reservation_service_changes(self,reservation,reservation_service,item_to_update,user_extension):
        title = ""
        if reservation_service.transfer_type == "DEPARTURES":
            title = "Modificación de salida {}".format(reservation_service.date.strftime('%d/%m/%Y'))
        elif reservation_service.transfer_type == "ARRIVALS":
            title = "Modificación llegada {}".format(reservation_service.date.strftime('%d/%m/%Y'))
        elif reservation_service.transfer_type == "INTERHOTEL":
            title = "Modificación Interhotel {}".format(reservation_service.date.strftime('%d/%m/%Y'))

        if reservation_service.date.strftime('%Y-%m-%d') != item_to_update['date']:
            log(reservation.id,title,user_extension,"Fecha de traslado",reservation_service.date.strftime('%Y-%m-%d'),item_to_update['date'])

        if reservation_service.service.id != int(item_to_update['service_id']):
            service = Service.objects.get(id=item_to_update['service_id'])
            log(reservation.id,title,user_extension,"Servicio",reservation_service.service.name,service.name)

        reference_value = reservation_service.origin.id if reservation_service.origin is not None else None
        origin_id = int(item_to_update.get('origin_id', None))  if item_to_update.get('origin_id', None) is not None else None
        if reference_value != origin_id:
            origin = Hotel.objects.filter(id=origin_id).first()
            log(reservation.id,title,user_extension,"Origen",reservation_service.origin.name if reservation_service.origin is not None else "", origin.name if origin is not None else "")
        
        reference_value = reservation_service.destination.id if reservation_service.destination is not None else None
        destination_id = int(item_to_update.get('destination_id', None))  if item_to_update.get('destination_id', None) is not None else None
        if reference_value != destination_id:
            destination = Hotel.objects.filter(id=destination_id).first()
            log(reservation.id,title,user_extension,"Destino",reservation_service.destination.name if reservation_service.destination is not None else "", destination.name if destination is not None else "")
        
        if reservation_service.room != item_to_update['room']:
            log(reservation.id,title,user_extension,"Habitación",reservation_service.room,item_to_update['room'])

        if reservation_service.transfer_type != item_to_update['transfer_type']:
            transfers = dict(TRANSFER_TYPE_CHOICES)
            log(reservation.id,title,user_extension,"Tipo de traslado",transfers[reservation_service.transfer_type],transfers[str(item_to_update['transfer_type'])])

        if int(reservation_service.adults) != int(item_to_update['adults']):
            log(reservation.id,title,user_extension,"Adultos",int(reservation_service.adults),int(item_to_update['adults']))

        if int(reservation_service.childs) != int(item_to_update['childs']):
            log(reservation.id,title,user_extension,"Menores",int(reservation_service.childs),int(item_to_update['childs']))

        if reservation_service.operation_type.id != int(item_to_update['operation_type_id']):
            operation_type = OperationType.objects.get(id=item_to_update['operation_type_id'])
            log(reservation.id,title,user_extension,"Tipo de operación",reservation_service.operation_type.name,operation_type.name)

        if reservation_service.confirmation != item_to_update['confirmation']:
            log(reservation.id,title,user_extension,"Confirmación",reservation_service.confirmation, item_to_update['confirmation'])

        reference_value = reservation_service.flight.id if reservation_service.flight is not None else None
        flight_id = int(item_to_update.get('flight_id', None))  if item_to_update.get('flight_id', None) is not None else None
        if reference_value != flight_id:
            flight = models.Flight.objects.filter(id=flight_id).first()
            log(reservation.id,title,user_extension,"Vuelo",reservation_service.flight.code if reservation_service.flight is not None else "", flight.code if flight is not None else "")

        value = reservation_service.real_flight_time.strftime("%H:%M:%S") if reservation_service.real_flight_time is not None else None
        if value != item_to_update['real_flight_time']:
            log(reservation.id,title,user_extension,"Tiempo real de vuelo",value,item_to_update['real_flight_time'])

        value = reservation_service.real_pick_up_time.strftime("%H:%M:%S") if reservation_service.real_pick_up_time is not None else None
        if value != item_to_update['real_pick_up_time']:
            log(reservation.id,title,user_extension,"Tiempo real de pick up",value,item_to_update['real_pick_up_time'])

        if reservation_service.comments != item_to_update['comments']:
            log(reservation.id,title,user_extension,"Comentarios",reservation_service.comments,item_to_update['comments'])
    
    def service_list(self, request):
        from GeneralApp.serializers import ServiceSerializer
        token = None
        try:
            token = models.ReservationCreateToken.objects.activeTokenByUid(request.GET['token'])
        except Exception as e:
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
        if token is not None:
            services = Service.objects.filter(properties=token.reservation.property,is_transfer=True,is_online_used=True)
        else:
            property = Property.objects.get(id=request.GET['property'])
            services = Service.objects.filter(properties=property,is_transfer=True,is_online_used=True)
        return Response(ServiceSerializer(services, many=True).data)
    
    def operation_type_list(self, request):
        from GeneralApp.serializers import OperationTypeSerializer
        token = None
        try:
            token = models.ReservationCreateToken.objects.activeTokenByUid(request.GET['token'])
        except Exception as e:
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
        if token is not None:
            operation_types = OperationType.objects.filter(id=token.operation_type.id)
        else:
            property = Property.objects.get(id=request.GET['property'])
            operation_types = OperationType.objects.filter(properties=property)
        return Response(OperationTypeSerializer(operation_types, many=True).data)
    
    def hotel_list(self, request):
        token = None
        service = Service.objects.get(id=request.GET['service'])
        zones = service.zones.split(",")
        try:
            token = models.ReservationCreateToken.objects.activeTokenByUid(request.GET['token'])
        except Exception as e:
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
        if token is not None:
            hotels = Hotel.objects.filter(properties=token.reservation.property,zone_id__isnull=False,zone_id__in=zones)
        else:
            property = Property.objects.get(id=request.GET['property'])
            hotels = Hotel.objects.filter(properties=property,zone_id__isnull=False,zone_id__in=zones)
        return Response(HotelSerializer(hotels,many=True).data)
    
    def operation_flights(self, request):
        token = None
        try:
            token = models.ReservationCreateToken.objects.activeTokenByUid(request.GET['token'])
        except Exception as e:
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
        if token is not None:
            flights = models.Flight.objects.operationFlightFilter(request.GET['date'],request.GET['transfer_type']).filter(property=token.reservation.property)
        else:
            property = Property.objects.get(id=request.GET['property'])
            flights = models.Flight.objects.operationFlightFilter(request.GET['date'],request.GET['transfer_type']).filter(property=property)
        date_of_week = querysets.FlightQuerySet.days_of_week[datetime.strptime(request.GET['date'], '%Y-%m-%d').weekday()]
        field = date_of_week + '_' + querysets.FlightQuerySet.transfer_types[request.GET['transfer_type']]
        flights_to_return = []
        for flight in flights:
            flight_data = serializers.FlightSerializer(flight).data
            flight_data['field'] = field
            flights_to_return.append(flight_data)
        return Response({
            'results':flights_to_return,
        })
    
    def operation_pickuptimes(self, request):
        try:
            token = models.ReservationCreateToken.objects.activeTokenByUid(request.GET['token'])
        except Exception as e:
            db_logger = logging.getLogger('db')
            db_logger.exception(e)
        if token is not None:
            pickuptime = models.PickUpTime.objects.filter(pick_up__property=token.reservation.property).operationPickUpFilter(request.GET['flight_time'],request.GET['hotel'])
        else:
            property = Property.objects.get(id=request.GET['property'])
            pickuptime = models.PickUpTime.objects.filter(pick_up__property=property).operationPickUpFilter(request.GET['flight_time'],request.GET['hotel'])
        pick_up_time = serializers.PickUpTimeSerializer(pickuptime).data
        return Response({
            'pick_up': pick_up_time if pickuptime is not None else pickuptime
        })