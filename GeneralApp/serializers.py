import locale
import json
from datetime                   import date, datetime
from rest_framework             import serializers
from django.db.models           import Q, Exists
from django.contrib.auth.models import User, Group
from GeneralApp                 import models

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Property
        fields = ('id', 'name', 'code')

class GroupSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Group
        fields = ('id', 'name', 'properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class UserExtensionSerializer(serializers.ModelSerializer):
    permission_group = serializers.SerializerMethodField()
    permission_group_name = serializers.SerializerMethodField()
    representative = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()
    class Meta:
        model = models.UserExtension
        fields = ('id', 'user', 'representative', 'provider', 'permission_group', 'permission_group_name', 'properties',
            'verification_2fa', 'verification_2fa_method', 'phone')

    def get_representative(self, instance):
        return instance.representative.id if instance.representative is not None else None
    
    def get_provider(self, instance):
        return instance.provider.id if instance.provider is not None else None

    def get_permission_group(self, instance):
        group = instance.user.groups.first()
        return group.id if group is not None else None

    def get_permission_group_name(self, instance):
        group = instance.user.groups.first()
        return group.name if group is not None else ""

    def to_representation(self, instance):
        self.Meta.depth = 1
        representation = super().to_representation(instance)
        self.Meta.depth = 0
        return representation

class ProfileSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    provider_data = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        try:
            return obj.user.get_group_permissions()
        except Exception as e:
            return []
        
    def get_provider_data(self, obj):
        if obj.provider is not None:
            return ProviderSerializer(obj.provider).data
        return None

    class Meta:
        model = models.UserExtension
        fields = ('id', 'user', 'representative', 'provider', 'provider_data', 'properties', 'permissions',)

    def to_representation(self, instance):
        self.Meta.depth = 1
        representation = super().to_representation(instance)
        self.Meta.depth = 0

        return representation

class UserGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name',)

class UserExtensionLoginDataSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.UserExtension
        fields = ('username','properties_data')

    def get_username(self, instance):
        return instance.user.username

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class ActivitySerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Activity
        fields = ('id','name','properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class RepresentativeSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.Representative
        fields = ('id','code','name','active','property','property_name')

class BusinessGroupSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.BusinessGroup
        fields = ('id', 'name','properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class OperationTypeSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.OperationType
        fields = ('id', 'name','properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class DepartmentCECOSSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.DepartmentCECOS
        fields = ('id', 'code', 'name','properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class ExchangeRateSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.ExchangeRate
        fields = ('id', 'start_date', 'type', 'usd_currency', 'euro_currency', 'provider', 'property', 'property_name')

class SaleTypeSerializer(serializers.ModelSerializer):
    department_cecos_name = serializers.ReadOnlyField(source='department_cecos.name')
    operation_type_name = serializers.ReadOnlyField(source='operation_type.name')
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.SaleType
        fields = ('id', 'name', 'is_inner_bussiness', 'is_sale_online', 'sap_code', 'warehouse_code', 'department_cecos', 'department_cecos_name', 'operation_type', 'operation_type_name', 'payment_methods', 'is_service_fee', 'property', 'property_name')

class HotelSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    unit_name = serializers.ReadOnlyField(source='unit.name')
    class Meta:
        model = models.Hotel
        fields = ('id', 'name', 'opera_code', 'zone_id', 'unit', 'unit_name', 'logo', 'priority', 'properties', 'properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data
    
class HotelImageSerializer(serializers.ModelSerializer):
    hotel_name = serializers.ReadOnlyField(source='hotel.name')
    creator_name = serializers.ReadOnlyField(source='creator.user.username')
    class Meta:
        model = models.HotelImage
        fields = ('id', 'position', 'language', 'image', 'hotel', 'hotel_name','creator_name')

class HotelReportOperationSerializer(serializers.ModelSerializer):
    images_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Hotel
        fields = ('id', 'name', 'logo', 'images_data')

    def get_images_data(self, instance):
        queryset = instance.hotel_images.all().order_by('position')
        return HotelImageSerializer(queryset, many=True).data

class ProviderSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Provider
        fields = ('id', 'name', 'business_name', 'tax_key', 'address', 'city', 'phone', 'currency', 'sap_code', 'email', 'url', 'credit_days', 'active', 'properties','properties_data',)

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data
    
class ProviderTableSerializer(ProviderSerializer):
    usd_currency = serializers.ReadOnlyField()
    euro_currency = serializers.ReadOnlyField()
    class Meta(ProviderSerializer.Meta):
        fields = ProviderSerializer.Meta.fields + ('usd_currency','euro_currency')

class UnitTypeSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    class Meta:
        model = models.UnitType
        fields = ('id', 'name', 'property', 'property_name')

class UnitSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    provider_name = serializers.ReadOnlyField(source='provider.name')
    unit_type_name = serializers.ReadOnlyField(source='unit_type.name')
    class Meta:
        model = models.Unit
        fields = ('id', 'code', 'unit_type', 'unit_type_name', 'name', 'capacity', 'is_private', 'provider', 'provider_name', 'property', 'property_name')

class ServiceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        fields = (
            'id', 'code', 'name')

class ServiceFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Service
        fields = (
            'id', 'code', 'name','provider',
            'activity', 'availability_group', 
            'opera_code', 'comments_coupon', 
            'description_po', 'description_es', 
            'description_en', 'is_transfer', 
            'service_fee_amount', 'service_fee',
            'business_group',
            'is_colective', 'unit', 'zones', 
            'properties')

class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.ReadOnlyField(source='provider.name')
    activity_name = serializers.ReadOnlyField(source='activity.name')
    business_group_name = serializers.ReadOnlyField(source='business_group.name')
    availability_group_name = serializers.ReadOnlyField(source='availability_group.name')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    service_fee_data = serializers.SerializerMethodField()
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Service
        fields = (
            'id', 'code', 'name',
            'name_online_sale_es', 'name_online_sale_en',
            'provider', 'provider_name', 
            'activity', 'activity_name', 
            'availability_group', 'availability_group_name', 
            'opera_code', 'comments_coupon', 
            'description_po', 'description_es', 'description_en', 
            'is_transfer', 'is_online_used', 'is_sale_online', 
            'service_fee_amount', 'service_fee', 'service_fee_data',
            'business_group', 'business_group_name', 
            'is_colective', 'unit', 'unit_name', 'zones', 
            'properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data
    
    def get_service_fee_data(self, instance):
        return ServiceFeeSerializer(instance.service_fee).data

class ServiceImageSerializer(serializers.ModelSerializer):
    service_name = serializers.ReadOnlyField(source='service.name')
    creator_name = serializers.ReadOnlyField(source='creator.user.username')
    class Meta:
        model = models.ServiceImage
        fields = ('id', 'title', 'service', 'image', 'service_name','creator_name')
        
class AvailabilityGroupSerializer(serializers.ModelSerializer):
    group_name = serializers.ReadOnlyField(source='group.name')
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.AvailabilityGroup
        fields = ('id', 'name', 'code', 'group', 'group_name', 'properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data
    
class StoreSerializer(serializers.ModelSerializer):
    properties_data = serializers.SerializerMethodField()
    class Meta:
        model = models.Store
        fields = ('id', 'code', 'name','properties','properties_data')

    def get_properties_data(self, instance):
        return PropertySerializer(instance.properties.all(),many=True).data

class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Request
        fields = (
            'id', 'endpoint', 'user', 'response_code',
            'body_request',
            'method','remote_address', 'exec_time', 'date'
        )

    def to_representation(self, instance):
        self.Meta.depth = 1
        representation = super().to_representation(instance)
        self.Meta.depth = 0
        return representation