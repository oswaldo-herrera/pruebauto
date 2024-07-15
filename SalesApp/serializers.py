from rest_framework             import serializers
from django.db.models           import Q, Exists
from django.contrib.auth.models import User, Group
from SalesApp                   import models
from GeneralApp.models          import Service, Provider

class PaymentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PaymentType
        fields = ('id', 'name', 'is_commissionable')

class ClientTypeSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.ClientType
        fields = ('id', 'name','property', 'property_name')

class PaymentMethodSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    payment_type_name = serializers.SerializerMethodField()
    class Meta:
        model = models.PaymentMethod
        fields = ('id', 'name', 'payment_type', 'payment_type_name', 'currency', 'room_charge', 'card_charge', 'store_card_charge', 'courtesy', 'is_service_fee', 'property', 'property_name')

    def get_payment_type_name(self, instance):
        return instance.payment_type.name if instance.payment_type is not None else ""

class ServiceRateSerializer(serializers.ModelSerializer):
    service_name = serializers.ReadOnlyField(source='service.name')
    class Meta:
        model = models.ServiceRate
        fields = ('id', 'start_date', 'due_date', 'service', 'service_name', 'currency', 'tax', 'adult_price', 'child_price', 'hard_rock_comission_adult', 'hard_rock_comission_child', 'exent_import_adult', 'exent_import_child')

class ServiceRateComissionSerializer(serializers.ModelSerializer):
    payment_type_name = serializers.ReadOnlyField(source='payment_type.name')
    class Meta:
        model = models.ServiceRateComission
        fields = ('id', 'service_rate', 'payment_type', 'payment_type_name', 'comission')

class CoordinatorsComissionSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.CoordinatorsComission
        fields = ('id', 'date', 'comission', 'property', 'property_name')

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Schedule
        fields = ('id', 'active', 'limit', 'time', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN',)

class SchedulePickUpSerializer(serializers.ModelSerializer):
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    class Meta:
        model = models.SchedulePickUp
        fields = ('id', 'schedule', 'hotel', 'hotel_name', 'time')

class ScheduleAllotmentSerializer(serializers.ModelSerializer):
    schedule_limit = serializers.SerializerMethodField()
    property_name = serializers.ReadOnlyField(source='property.name')
    reserved = serializers.SerializerMethodField()
    availability_group_name = serializers.ReadOnlyField(source='availability_group.name')
    group_name = serializers.ReadOnlyField(source='availability_group.group.name')
    class Meta:
        model = models.ScheduleAllotment
        fields = ('id', 'schedule', 'schedule_time', 'schedule_limit', 'start_date', 'reserved', 'active', 'availability_group_name', 'group_name', 'comments', 'property', 'property_name')

    def get_reserved(self, instance):
        from django.db.models import Sum, F, IntegerField
        total = models.Sale.objects.filter(service__availability_group=instance.availability_group,service_date=instance.start_date,time=instance.schedule_time,status__in=["A","B"]).aggregate(
            total=Sum(
                F("adults") + F("childs"),
                output_field=IntegerField()
            ))['total']
        total_refund = models.Sale.objects.filter(service__availability_group=instance.availability_group,service_date=instance.start_date,time=instance.schedule_time,status="R").aggregate(
            total=Sum(
                F("adults") + F("childs"),
                output_field=IntegerField()
            ))['total']
        total = 0 if total is None else total
        total_refund = 0 if total_refund is None else total_refund
        return total - total_refund
    
    def get_schedule_limit(self, instance):
        from SalesApp.views import schedule_by_datetime
        schedule = schedule_by_datetime(instance.start_date,instance.availability_group,instance.schedule_time)
        if schedule is not None:
            return schedule.limit
        return ""


class SchedulePickUpSaleSerializer(serializers.ModelSerializer):
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    time = serializers.TimeField(format="%H:%M")
    class Meta:
        model = models.SchedulePickUp
        fields = ('hotel', 'hotel_name', 'time')

class ScheduleSaleSerializer(serializers.ModelSerializer):
    pick_ups = serializers.SerializerMethodField()
    time = serializers.TimeField(format="%H:%M")
    class Meta:
        model = models.Schedule
        fields = ('id', 'limit', 'time', 'pick_ups')

    def get_pick_ups(self, instance):
        return SchedulePickUpSaleSerializer(instance.schedule_pickups.all(), many=True).data

class AvailabilitySerializer(serializers.ModelSerializer):
    availability_group_name = serializers.ReadOnlyField(source='availability_group.name')
    schedule_1 = ScheduleSerializer()
    schedule_1_time = serializers.ReadOnlyField(source='schedule_1.time')
    schedule_2 = ScheduleSerializer()
    schedule_2_time = serializers.ReadOnlyField(source='schedule_2.time')
    schedule_3 = ScheduleSerializer()
    schedule_3_time = serializers.ReadOnlyField(source='schedule_3.time')
    schedule_4 = ScheduleSerializer()
    schedule_4_time = serializers.ReadOnlyField(source='schedule_4.time')
    schedule_5 = ScheduleSerializer()
    schedule_5_time = serializers.ReadOnlyField(source='schedule_5.time')
    schedule_6 = ScheduleSerializer()
    schedule_6_time = serializers.ReadOnlyField(source='schedule_6.time')
    schedule_7 = ScheduleSerializer()
    schedule_7_time = serializers.ReadOnlyField(source='schedule_7.time')
    class Meta:
        model = models.Availability
        fields = ('id', 'start_date', 'due_date', 'availability_group', 'availability_group_name','schedule_1','schedule_1_time','schedule_2','schedule_2_time','schedule_3','schedule_3_time','schedule_4','schedule_4_time','schedule_5','schedule_5_time','schedule_6','schedule_6_time','schedule_7','schedule_7_time')

class DiscountSerializer(serializers.ModelSerializer):
    conditional_name = serializers.SerializerMethodField(label="Condicional")
    sale_type_name = serializers.ReadOnlyField(source='sale_type.name')
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.Discount
        fields = ('id', 'start_date', 'due_date', 'discount', 'conditional_name', 'conditional_content_type', 'conditional_object_id', 'sale_type', 'sale_type_name','property', 'property_name')

    def get_conditional_name(self, instance):
        conditional = "No encontrado"
        instance.conditional_content_type.model
        if instance.conditional_content_type.model == "clienttype":
            conditional = models.ClientType.objects.get(pk=instance.conditional_object_id).name
        if instance.conditional_content_type.model == "provider":
            conditional = Provider.objects.get(pk=instance.conditional_object_id).name
        if instance.conditional_content_type.model == "service":
            conditional = Service.objects.get(pk=instance.conditional_object_id).name
        choices = dict(models.Discount.choices)
        return "{}: {}".format(choices[instance.conditional_content_type.model], conditional)
    
class AuthDiscountSerializer(serializers.ModelSerializer):
    sale_key = serializers.ReadOnlyField(source='sale.sale_key')
    discount = serializers.ReadOnlyField(source='sale.discount')
    discount_type = serializers.ReadOnlyField(source='sale.discount_type')
    representative_name = serializers.ReadOnlyField(source='sale.representative.name')
    property_name = serializers.ReadOnlyField(source='property.name')
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    class Meta:
        model = models.AuthDiscount
        fields = ('id', 'timestamp', 'discount_key', 'sale_key', 'discount', 'discount_type', 'representative_name', 'user_extension', 'user_extension_name', 'property', 'property_name',)
    
class SaleTableSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    representative_name = serializers.ReadOnlyField(source='representative.name')
    service_name = serializers.ReadOnlyField(source='service.name')
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    schedule_data = serializers.ReadOnlyField(source='schedule.time',default=None)
    time = serializers.TimeField(format="%H:%M")
    service_rate = ServiceRateSerializer()
    sale_type_name = serializers.ReadOnlyField(source='sale_type.name')
    sale_payments = serializers.SerializerMethodField()
    totals = serializers.SerializerMethodField()
    class Meta:
        model = models.Sale
        fields = ('id', 
            'status', 'sale_key', 'sale_key_manual', 
            'email', 'name_pax',
            'user_extension', 'user_extension_name', 
            'service_name', 'representative', 'representative_name',
            'service_date', 'service_rate',
            'schedule', 'schedule_data', 'time',
            'hotel', 'hotel_name',
            'sale_date', 'sale_type', 'sale_type_name',
            'sale_service_fee', 'service_fee', 'adults', 'childs',
            'discount_type', 'discount',
            'overcharged', 'room',
            'confirm_provider', 'client_type',
            'comments', 'comments_coupon',
            'property', 'property_name',
            'totals', 'sale_payments')
        
    def get_sale_payments(self, instance):
        queryset = instance.sale_payments.all().order_by('id')
        return SalePaymentSerializer(queryset, many=True).data
    
    def get_totals(self, instance):
        from SalesApp.controllers import sale_subtotal
        return sale_subtotal(instance)
    
class SaleSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    representative_name = serializers.ReadOnlyField(source='representative.name')
    service_data = serializers.SerializerMethodField()
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    client_type_data = serializers.SerializerMethodField()
    schedule_time = serializers.ReadOnlyField(source='schedule.time',default=None)
    time = serializers.TimeField(format="%H:%M")
    schedule_data = serializers.SerializerMethodField()
    service_rate_data = serializers.SerializerMethodField()
    sale_type_data = serializers.SerializerMethodField()
    sale_payments = serializers.SerializerMethodField()
    sale_auth_discount = serializers.SerializerMethodField()
    class Meta:
        model = models.Sale
        fields = ('id', 
            'status', 'sale_key', 'sale_key_manual',
            'email', 'name_pax', 'sale_reservation_id', 'reservation_service',
            'user_extension', 'user_extension_name', 
            'representative', 'representative_name',
            'service', 'service_data', 
            'sale_date', 'service_date', 
            'service_rate', 'service_rate_data', 
            'schedule', 'schedule_data', 'schedule_time', 'time',
            'hotel', 'hotel_name',
            'sale_service_fee', 'service_fee',
            'sale_type', 'sale_type_data',
            'adults', 'childs',
            'discount_type', 'discount',
            'overcharged', 'room',
            'client_type', 'client_type_data',
            'confirm_provider', 'comments', 'comments_coupon',
            'unit', 'property', 'property_name',
            'sale_payments','sale_auth_discount')
        
    def get_service_rate_data(self, instance):
        return ServiceRateSerializer(instance.service_rate).data
    
    def get_service_data(self, instance):
        from GeneralApp.serializers import ServiceSerializer
        return ServiceSerializer(instance.service).data
    
    def get_schedule_data(self, instance):
        return ScheduleSerializer(instance.schedule).data
    
    def get_sale_type_data(self, instance):
        from GeneralApp.serializers import SaleTypeSerializer
        return SaleTypeSerializer(instance.sale_type).data

    def get_client_type_data(self, instance):
        return ClientTypeSerializer(instance.client_type).data

    def get_sale_auth_discount(self, instance):
        auth_discount = instance.auth_discounts.first()
        if auth_discount is not None:
            return AuthDiscountSerializer(auth_discount).data
        return None
        
    def get_sale_payments(self, instance):
        queryset = instance.sale_payments.all().order_by('id')
        return SalePaymentSerializer(queryset, many=True).data
    
class SaleWithPickUpSerializer(SaleSerializer):
    pup = serializers.SerializerMethodField()
    all_comments = serializers.SerializerMethodField()
    service_name = serializers.ReadOnlyField(source='service.name')
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    sale_type_name = serializers.ReadOnlyField(source='sale_type.name')
    class Meta(SaleSerializer.Meta):
        fields = SaleSerializer.Meta.fields + ('pup','all_comments','service_name','hotel_name','sale_type_name')

    def get_pup(self, instance):
        from SalesApp.views import schedule_by_datetime
        schedule_pickup = None
        if instance.service.availability_group is not None:
            schedule = schedule_by_datetime(instance.service_date,instance.service.availability_group,instance.time)
            if schedule is not None:
                schedule_pickup = schedule.schedule_pickups.filter(hotel=instance.hotel).first()
                if schedule_pickup is not None:
                    return SchedulePickUpSaleSerializer(schedule_pickup).data            
        return schedule_pickup
    
    def get_all_comments(self, instance):
        return "{}{}".format(
            instance.comments + "//" if instance.comments != "" else "",
            instance.comments_coupon
        )

class SalePaymentSerializer(serializers.ModelSerializer):
    room_charge_data = serializers.SerializerMethodField()
    credit_charge_data = serializers.SerializerMethodField()
    payment_method_data = serializers.SerializerMethodField()
    department_cecos_data = serializers.SerializerMethodField()
    store_card_charge_data = serializers.SerializerMethodField()
    class Meta:
        model = models.SalePayment
        fields = ('id', 'amount',
            'sale', 'authorization',
            'department_cecos', 'department_cecos_data', 
            'payment_method', 'payment_method_data', 'room_charge_data', 'credit_charge_data', 'store_card_charge_data')
        
    def get_room_charge_data(self, instance):
        if instance.payment_method.room_charge is True and hasattr(instance, 'room_charges'):
            return RoomChargeSerializer(instance.room_charges).data
        return None
    
    def get_credit_charge_data(self, instance):
        if instance.payment_method.card_charge is True and instance.credit_charge is not None:
            return CreditChargeSerializer(instance.credit_charge).data
        return None
    
    def get_store_card_charge_data(self, instance):
        if instance.payment_method.store_card_charge is True and instance.store_card_charge is not None:
            return StoreCardChargeWithStoreCardDataSerializer(instance.store_card_charge).data
        return None
        
    def get_payment_method_data(self, instance):
        return PaymentMethodSerializer(instance.payment_method).data
    
    def get_department_cecos_data(self, instance):
        from GeneralApp.serializers import DepartmentCECOSSerializer
        return DepartmentCECOSSerializer(instance.department_cecos).data
    
class SaleLogSerializer(serializers.ModelSerializer):
    user_extension_name = serializers.ReadOnlyField(source='user_extension.user.username')
    class Meta:
        model = models.SaleLog
        fields = (
            'id', 'sale_key', 'status', 'timestamp', 'type', 
            'user_extension', 'user_extension_name', 'field', 
            'old_data', 'new_data',)
    
class RoomChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RoomCharge
        fields = ('id', 'sale_payment', 'reservation_opera_id', 
            'timestamp', 'account', 'hotel_code', 
            'room', 'pax', 'coupon')

class CreditChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CreditCharge
        fields = ('id', 'transaction_id', 'order_id', 'status', 'timestamp')

class StoreCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.StoreCard
        fields = ('id', 'card_key', 'name_pax', 'email', 'nip', 'due_date', 'comments', 'status', 'timestamp')

class StoreCardWithBalanceSerializer(serializers.ModelSerializer):
    store_name = serializers.ReadOnlyField(source='store.name')
    last_charge_date = serializers.ReadOnlyField()
    last_used_date = serializers.ReadOnlyField()
    deposited_amount = serializers.ReadOnlyField()
    used_amount = serializers.ReadOnlyField()
    count = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()
    class Meta:
        model = models.StoreCard
        fields = ('id', 'card_key', 'name_pax', 'email', 
            'store', 'store_name', 'due_date', 'comments', 'status', 'timestamp',
            'last_charge_date', 'last_used_date', 'deposited_amount', 
            'used_amount', 'count', 'total')

class StoreCardChargeSerializer(serializers.ModelSerializer):
    sale = serializers.SerializerMethodField()
    class Meta:
        model = models.StoreCardCharge
        fields = ('id', 'store_card', 'sale', 'amount', 'comments', 'timestamp')
        
    def get_sale(self, instance):
        try:
            if instance.sale_payment:
                return "{}{}".format(instance.sale_payment.sale.status,str(instance.sale_payment.sale.sale_key).zfill(8))
        except:
            return None
        
class StoreCardChargeWithStoreCardDataSerializer(serializers.ModelSerializer):
    store_card_card_key = serializers.ReadOnlyField(source='store_card.card_key')
    store_card_name = serializers.ReadOnlyField(source='store_card.name_pax')
    class Meta:
        model = models.StoreCardCharge
        fields = ('id', 'store_card', 'amount', 'comments', 'timestamp', 'store_card_card_key', 'store_card_name')
    
class PendingPaymentTokenSaleSerializer(serializers.ModelSerializer):
    sale = SaleSerializer()
    credit_charge = CreditChargeSerializer()
    class Meta:
        model = models.PendingPaymentTokenSale
        fields = ('id', 'sale', 'credit_charge', 'uuid', 'url', 'timestamp')
