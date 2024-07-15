from rest_framework             import serializers
from django.db.models           import Q, Exists
from django.contrib.auth.models import User, Group
from OperationsApp              import models
from GeneralApp.models          import Service, Provider
from GeneralApp.serializers     import PropertySerializer

class ContactSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Contact
        fields = ('id', 'name', 'properties', 'properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class ReservationSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    contact_name = serializers.ReadOnlyField(source='contact.name')
    department_cecos_name = serializers.ReadOnlyField(source='department_cecos.name')
    sale_type_name = serializers.ReadOnlyField(source='sale_type.name')
    reservation_services = serializers.SerializerMethodField()
    class Meta:
        model = models.Reservation
        fields = ('id', 
            'opera_code', 'pax',
            'user_extension', 'user_extension_name', 
            'contact', 'contact_name', 
            'country', 'email',
            'department_cecos', 'department_cecos_name', 
            'memberships', 'address', 'reservation_date',
            'sale_type', 'sale_type_name',
            'amount', 'comments',
            'property', 'property_name',
            'reservation_services')
        
    def get_reservation_services(self, instance):
        queryset = instance.reservation_services.all().order_by('date')
        return ReservationServiceSerializer(queryset, many=True).data
    
class ReservationTableSerializer(ReservationSerializer):
    arrival_date = serializers.ReadOnlyField(default=None)
    arrival_flight = serializers.ReadOnlyField(default=None)
    arrival_service = serializers.ReadOnlyField(default=None)
    arrival_hotel = serializers.ReadOnlyField(default=None)
    departure_date = serializers.ReadOnlyField(default=None)
    departure_flight = serializers.ReadOnlyField(default=None)
    departure_service = serializers.ReadOnlyField(default=None)
    departure_hotel = serializers.ReadOnlyField(default=None)
    hotel = serializers.ReadOnlyField(default=None)
    pax_num = serializers.ReadOnlyField()
    sales = serializers.SerializerMethodField()
    class Meta(ReservationSerializer.Meta):
        fields = ReservationSerializer.Meta.fields + (
            'arrival_date','arrival_flight','arrival_service','arrival_hotel',
            'departure_date','departure_flight','departure_service','departure_hotel',
            'hotel','pax_num','status','sales')
        
    def get_sales(self, instance):
        reservation_sales = instance.reservation_services.all().values_list('sales__status', 'sales__sale_key')
        sales = []
        for status, sale_key in reservation_sales:
            if status is not None and sale_key is not None:
                sales.append(f"{status}{str(sale_key).zfill(8)}")
        return sales

class ReservationServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.ReadOnlyField(source='service.name')
    origin_name = serializers.ReadOnlyField(source='origin.name',default=None)
    destination_name = serializers.ReadOnlyField(source='destination.name',default=None)
    flight_time = serializers.SerializerMethodField()
    pick_up_time_data = serializers.ReadOnlyField(source='pick_up_time.time',default=None)
    operation_type_name = serializers.ReadOnlyField(source='operation_type.name',default=None)
    valid_sale = serializers.SerializerMethodField()
    class Meta:
        model = models.ReservationService
        fields = ('id', 'date',
            'reservation', 'asignment',
            'service', 'service_name', 
            'transfer_type', 'adults', 'childs',
            'origin', 'origin_name',
            'destination', 'destination_name',
            'operation_type', 'operation_type_name',
            'confirmation', 'room',
            'flight', 'flight_field', 'flight_code', 'flight_time', 'real_flight_time',
            'pick_up_time', 'pick_up_time_data', 'real_pick_up_time',
            'comments','no_show','unit','valid_sale')
        
    def get_flight_time(self, instance):
        if instance.flight is not None:
            return getattr(instance.flight, instance.flight_field)
        return ''
    
    def get_valid_sale(self,instance):
        from SalesApp.models import Sale
        if instance.sales.exists():
            sales = instance.sales.filter(status='A')
            for sale in sales:
                if not Sale.objects.filter(status='R',sale_key=sale.sale_key).exists():
                    return {
                        'id': sale.id,
                        'status': sale.status,
                        'sale_key': str(sale.sale_key).zfill(8),
                }
        return None

    
class ReservationServiceInvoiceSerializer(ReservationServiceSerializer):
    class Meta(ReservationServiceSerializer.Meta):
        fields = ReservationServiceSerializer.Meta.fields + ('invoice_type','no_show','invoice_cash_cxp')

class ReservationServiceOperationSerializer(ReservationServiceSerializer):
    unit_code = serializers.ReadOnlyField()
    unit_name = serializers.ReadOnlyField()
    unit_is_private = serializers.ReadOnlyField(source='unit.is_private')
    service_is_colective = serializers.ReadOnlyField(source='service.is_colective')
    pup = serializers.ReadOnlyField()
    flight_time = serializers.ReadOnlyField()
    date_operation = serializers.ReadOnlyField()
    pax = serializers.ReadOnlyField(source='reservation.pax')
    reference = serializers.ReadOnlyField(source='reservation.id')
    opera = serializers.ReadOnlyField(source='reservation.opera_code')
    reservation_comments = serializers.SerializerMethodField()
    origin_zone = serializers.ReadOnlyField(source='origin.zone_id',default=None)
    destination_zone = serializers.ReadOnlyField(source='destination.zone_id',default=None)
    class Meta(ReservationServiceSerializer.Meta):
        fields = ReservationServiceSerializer.Meta.fields + ('number','unit_code','unit_name','unit_is_private','service_is_colective','pax','pup', 'flight_time', 'date_operation', 'reference','opera','reservation_comments','origin_zone','destination_zone')

    def get_reservation_comments(self, instance):
        return "{} | {}".format(instance.reservation_comment,instance.reservation.comments)

class ReservationServiceDocumentSerializer(ReservationServiceOperationSerializer):
    pax_total = serializers.ReadOnlyField()
    class Meta(ReservationServiceOperationSerializer.Meta):
        fields = ReservationServiceOperationSerializer.Meta.fields + ('pax_total',)

class ReservationServiceOperationCouponSerializer(ReservationServiceDocumentSerializer):
    origin_logo = serializers.ReadOnlyField(source='origin.logo',default=None)
    destination_logo = serializers.ReadOnlyField(source='destination.logo',default=None)
    reservation_coupon_comment = serializers.SerializerMethodField()
    class Meta(ReservationServiceDocumentSerializer.Meta):
        fields = ReservationServiceDocumentSerializer.Meta.fields + ('origin_logo','destination_logo','reservation_coupon_comment')

    def get_reservation_coupon_comment(self, instance):
        return instance.reservation_coupon_comment

class PickUpSerializer(serializers.ModelSerializer):
    pickuptimes = serializers.SerializerMethodField()
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    hotel_zone = serializers.ReadOnlyField(source='hotel.zone_id')
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.PickUp
        fields = ('id', 'hotel', 'hotel_name', 'hotel_zone', 'property', 'property_name', 'pickuptimes')

    def get_pickuptimes(self, instance):
        queryset = instance.pickuptimes.all().order_by('flight_time')
        return PickUpTimeSerializer(queryset, many=True).data

class PickUpTimeSerializer(serializers.ModelSerializer):
    pick_up_name = serializers.ReadOnlyField(source='pick_up.name')
    class Meta:
        model = models.PickUpTime
        fields = ('id', 'pick_up', 'pick_up_name', 'flight_time', 'time')

class FlightSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.Flight
        fields = (
            'id', 'flight_type', 'start_date', 'due_date', 
            'code', 'origin', 'destination', 
            'mon_arrival', 'tue_arrival', 'wed_arrival', 'thu_arrival', 'fri_arrival', 'sat_arrival', 'sun_arrival', 
            'mon_departure', 'tue_departure', 'wed_departure', 'thu_departure', 'fri_departure', 'sat_departure', 'sun_departure',
            'property', 'property_name')
        
class ReservationLogSerializer(serializers.ModelSerializer):
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    class Meta:
        model = models.ReservationLog
        fields = (
            'id', 'reservation_id', 'timestamp', 'type', 
            'user_extension', 'user_extension_name', 'field', 
            'old_data', 'new_data',)
        
class ReservationCreateTokenSerializer(serializers.ModelSerializer):
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    class Meta:
        model = models.ReservationCreateToken
        fields = (
            'id', 'reservation', 'user_extension', 'user_extension_name', 'uuid', 'timestamp',)