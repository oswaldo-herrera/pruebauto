import re
import os
import secrets
import string
from django.shortcuts                   import render
from django.db.models                   import QuerySet
from rest_framework                     import viewsets, permissions, status
from rest_framework.response            import Response
from rest_framework.metadata            import SimpleMetadata, BaseMetadata
from django_filters.rest_framework      import DjangoFilterBackend, FilterSet, BooleanFilter
from rest_framework.filters             import OrderingFilter, SearchFilter
from rest_framework.authtoken.models    import Token
from rest_framework.exceptions          import NotFound
from GeneralApp.permissions             import HasCatalogModelPermissions,IsValidUserAuthentication,IsSuperuser,IsUserManagement,IsSuperuserOrSafe,IsCatalogManagement
from GeneralApp.utils                   import CustomValidation
from GeneralApp                         import serializers, models
from django.core.mail                   import EmailMultiAlternatives
from django.contrib.contenttypes.models import ContentType
from email.mime.image                   import MIMEImage
from django.template.loader             import render_to_string
from django.contrib.auth.models         import User, Group, Permission
from django.core.exceptions             import ObjectDoesNotExist
from django.utils.html                  import strip_tags
from operacionesVP.settings             import DEFAULT_FROM_EMAIL
from operacionesVP.settings             import BASE_DIR as OperacionesVPBASE_DIR
from django.conf                        import settings
from django.contrib.auth.hashers        import make_password
from GeneralApp.decorators              import log_error
from operacionesVP                      import serverconfig

def escape_xml( str_xml: str ):
    str_xml = str_xml.replace("&", "&amp;")
    str_xml = str_xml.replace("<", "&lt;")
    str_xml = str_xml.replace(">", "&gt;")
    str_xml = str_xml.replace("\"", "&quot;")
    str_xml = str_xml.replace("'", "&apos;")
    return str_xml

def link_callback(uri, rel):
    from django.contrib.staticfiles import finders
    """
    Convert HTML URIs to absolute system paths so xhtml2pdf can access those
    resources
    """
    result = finders.find(uri)
    if result:
        if not isinstance(result, (list, tuple)):
                result = [result]
        result = list(os.path.realpath(path) for path in result)
        path=result[0]
    else:
        sUrl = settings.STATIC_URL        # Typically /static/
        sRoot = settings.STATIC_ROOT      # Typically /home/userX/project_static/
        mUrl = settings.MEDIA_URL         # Typically /media/
        mRoot = settings.MEDIA_ROOT       # Typically /home/userX/project_static/media/

        if uri.startswith(mUrl):
            path = os.path.join(mRoot, uri.replace(mUrl, ""))
        elif uri.startswith(sUrl):
            path = os.path.join(sRoot, uri.replace(sUrl, ""))
        else:
            return uri

    # make sure that file exists
    if not os.path.isfile(path):
        raise RuntimeError(
                'media URI must start with %s or %s' % (sUrl, mUrl)
        )
    return path

# Create your views here.
class CustomViewSet(viewsets.ViewSet):
	def DoesNotExistCatchDecorator(method):
		def wrapper(*args,**kwargs):
			try:
				return method(*args,**kwargs)
			except ObjectDoesNotExist:
				return Response({'code':"not-found"},404)
		return wrapper
class CustomModelViewSet(viewsets.ModelViewSet):
	pass

class UtopiAppMetadata(SimpleMetadata):
    """
    This class serves to disable rest_framework's default permissions
    checking (in the context of metadata), for compability with
    JavaScript UtopiApp.
    """
    def determine_actions(self, request, view):
        actions = {}
        for method in {'PUT', 'POST'} & set(view.allowed_methods):
            serializer = view.get_serializer()
            actions[method] = self.get_serializer_info(serializer)

        return actions

class UtopiAppMetadataViewMixin:
    metadata_class  = UtopiAppMetadata

class PropertiesMetadataViewMixin:
    metadata_class  = UtopiAppMetadata
    def get_queryset(self):
        queryset = self.queryset
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.bySameProperties(user_extension).distinct()
        return queryset

class PropertyMetadataViewMixin:
    metadata_class  = UtopiAppMetadata
    def get_queryset(self):
        queryset = self.queryset
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.bySameProperty(user_extension).distinct()
        return queryset
    
class ProviderMetadataViewMixin:
    metadata_class  = UtopiAppMetadata
    def get_queryset(self):
        queryset = self.queryset
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.bySameProvider(user_extension.provider).distinct()
        return queryset

class UserGroupViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,IsSuperuserOrSafe)
    queryset = Group.objects.all()
    serializer_class = serializers.UserGroupSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name')
    filter_fields = ('id', 'name')

class QueryFixViewSet(viewsets.ViewSet):
    permission_classes = (permissions.IsAuthenticated,IsSuperuser,)

    def query_fixing(self, request):
        from django.http import HttpResponse
        import datetime
        import csv
        from SalesApp.models import Sale, ScheduleAllotment, AvailabilityGroup, SchedulePickUp, ServiceRate
        from SalesApp.serializers import SaleSerializer, SaleTableSerializer, SchedulePickUpSerializer
        from OperationsApp.models import ReservationService
        from OperationsApp.serializers import ReservationServiceSerializer
        start_date = datetime.datetime.strptime(request.GET['start_date'], '%Y-%m-%d').date()
        due_date = datetime.datetime.strptime(request.GET['due_date'], '%Y-%m-%d').date()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="Registro de cambio ' + str(datetime.datetime.now()) + '.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'ID',
            'Data',
        ])
        sales = Sale.objects.filter(sale_date__gte=start_date,sale_date__lte=due_date).exclude(status="R")
        for sale in sales:
            query = Sale.objects.searchSaleByID(sale.sale_key,sale.id).exclude(status="R")
            if query.exists():
                writer.writerow([
                    sale.id,
                    "{}{}".format(sale.status,sale.sale_key),
                ])
        return response


class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,)
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'properties__name', 'properties__code')
    filter_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'properties__name', 'properties__code')
    metadata_class = UtopiAppMetadata

    def profile(self, request):
        user = request.user
        try:
            user_extension = models.UserExtension.objects.get(user=user)
        except:
            raise CustomValidation("Ese usuario no tiene acceso al sistema", 'id', status.HTTP_400_BAD_REQUEST)
        return Response(serializers.ProfileSerializer(user_extension).data)

    def save_profile(self, request):
        user_data = request.data
        user = request.user
        try:
            user_extension = models.UserExtension.objects.get(user=user)
        except:
            raise CustomValidation("Ese usuario no tiene acceso al sistema", 'id', status.HTTP_400_BAD_REQUEST)
        user = user_extension.user
        user.username = user_data['user']['username']
        user.first_name = user_data['user']['first_name']
        user.last_name = user_data['user']['last_name']
        user.save()

        return Response(serializers.ProfileSerializer(user_extension).data)

    def new_password(self, request):
        user = request.user
        try:
            user_extension = models.UserExtension.objects.get(user=user)
        except:
            raise CustomValidation("Ese usuario no existe", 'password', status.HTTP_400_BAD_REQUEST)
        user_data = request.data
        if user_data['password'] == user_data['password_repet']:
            user = user_extension.user
            user.set_password(user_data['password'])
            user.save()
        else:
            raise CustomValidation("La contraseña no coincide", 'password', status.HTTP_400_BAD_REQUEST)
        return Response(serializers.UserExtensionSerializer(user_extension).data)

    def user_send_reset_password_email(self,request):
        user = request.user
        try:
            user_extension = models.UserExtension.objects.get(user=user)
        except:
            raise CustomValidation("Ese usuario no tiene acceso al sistema", 'id', status.HTTP_400_BAD_REQUEST)
        user_extension_password_reset = models.UserExtensionPasswordReset.objects.activeTokenByExpansion(user_extension)
        if user_extension_password_reset is None:
            user_extension_password_reset = models.UserExtensionPasswordReset()
            user_extension_password_reset.user_extension = user_extension
            user_extension_password_reset.save()
        return Response(EmailsViewSet.reset_password_email(user_extension,user_extension_password_reset,request))

class ExtendedUserViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,IsSuperuser|IsUserManagement)
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'properties__name', 'properties__code')
    filter_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'properties__name', 'properties__code')
    metadata_class = UtopiAppMetadata
    queryset = models.UserExtension.objects.all()
    serializer_class = serializers.UserExtensionSerializer

    def permissions_list(self, request):
        from django.db.models import Q
        permissions = Permission.objects.filter(Q(content_type__app_label="GeneralApp")|Q(content_type__app_label="SalesApp")|Q(content_type__app_label="OperationsApp"))
        permissions_to_return = []
        for group in permissions:
            permissions_to_return.append({
                'id':group.id,
                'name':group.name
            })
        return Response(permissions_to_return)

    def groups_list(self, request):
        groups = Group.objects.all()
        groups_to_return = []
        for group in groups:
            groups_to_return.append({
                'id':group.id,
                'name':group.name
            })
        return Response(groups_to_return)
    
    def group_get(self,request,pk):
        group = Group.objects.get(pk=pk)
        return Response({
            'id':group.id,
            'name':group.name,
            'permissions':group.permissions.values_list('id', flat=True)
        })
    
    def create_group(self,request):
        group_data = request.data
        new_group = Group()
        new_group.name = group_data['name']
        new_group.save()
        permissions = Permission.objects.filter(id__in=group_data['permissions'])
        new_group.permissions.set(permissions)
        new_group.save()
        return Response({
            'id':new_group.id,
            'name':new_group.name,
            'permissions':new_group.permissions.values_list('id', flat=True)
        })
    
    def generar_contrasena(self,):
        while True:
            contrasena = ''.join(secrets.choice(string.ascii_letters + string.digits + r'!@#$%^&*(),.?":{}|<>') for _ in range(14))
            if re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])', contrasena):
                return contrasena

    def update_group(self,request,pk):
        group_data = request.data
        group = Group.objects.get(pk=pk)
        group.name = group_data['name']
        permissions = Permission.objects.filter(id__in=group_data['permissions'])
        group.permissions.set(permissions)
        group.save()
        return Response({
            'id':group.id,
            'name':group.name,
            'permissions':group.permissions.values_list('id', flat=True)
        })

    def delete_group(self,request,pk):
        Group.objects.filter(id=pk).delete()
        return Response()

    def new_password(self, request, pk):
        try:
            user_extension = models.UserExtension.objects.get(id=pk)
        except:
            raise CustomValidation("Ese usuario no existe", 'password', status.HTTP_400_BAD_REQUEST)
        user_data = request.data
        if user_data['password'] == user_data['password_repet']:
            user = user_extension.user
            user.set_password(user_data['password'])
            user.save()
        else:
            raise CustomValidation("La contraseña no coincide", 'password', status.HTTP_400_BAD_REQUEST)
        return Response(serializers.UserExtensionSerializer(user_extension).data)

    def deactivate_user(self, request, pk):
        try:
            user_extension = models.UserExtension.objects.get(id=pk)
        except:
            raise CustomValidation("Ese usuario no existe", 'user', status.HTTP_400_BAD_REQUEST)
        request_user = request.user
        user = user_extension.user
        if request_user.id == user.id:
            raise CustomValidation("No se puede desactivar el usuario que esta usando", 'user', status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save()
        return Response(serializers.UserExtensionSerializer(user_extension).data)

    def fetch(self, request, pk):
        try:
            user_extension = models.UserExtension.objects.get(id=pk)
        except:
            raise CustomValidation("Ese usuario no existe", 'id', status.HTTP_400_BAD_REQUEST)

        user = user_extension.user
        user_permissions = self.get_user_permissions(user)

        user_extension_to_return = serializers.UserExtensionSerializer(user_extension).data
        user_extension_to_return['user'].pop('user_permissions')
        user_extension_to_return['user']['permissions'] = user_permissions

        return Response(user_extension_to_return)

    def get_user_permissions(self, user):
        permissions_to_return = []
        #permissions = user.user_permissions.all() | Permission.objects.filter(group__user=user)
        #permissions = Permission.objects.filter(user=user).values('name')
        permissions = Permission.objects.filter(group__user=user).values('name')

        for permission in permissions:
            permissions_to_return.append(permission['name'])

        return permissions_to_return

    def create(self, request):
        user_data = request.data
        new_user = User()
        new_user_extension = models.UserExtension()

        new_user.username = user_data['user']['username']
        new_user.first_name = user_data['user']['first_name']
        new_user.last_name = user_data['user']['last_name']

        new_user.email= user_data['user']["email"]
        password = self.generar_contrasena()
        new_user.set_password(password)
        
        if 'Administrador de usuarios' in self.get_user_permissions(request.user):
            new_user.is_superuser = user_data['user']['is_superuser']
            new_user.is_active = user_data['user']['is_active']
        try:
            new_user.save()
        except Exception as e:
            print(e)
            raise CustomValidation("Ese nombre de usuario ya fue usado", 'username', status.HTTP_400_BAD_REQUEST)
        groups = Group.objects.filter(id=user_data['permission_group'])
        new_user.groups.set(groups)
        new_user.save()
        Token.objects.create(user=new_user)
        new_user_extension.user = new_user
        new_user_extension.first_password = password
        new_user_extension.verification_2fa = user_data['verification_2fa']
        new_user_extension.verification_2fa_method = user_data['verification_2fa_method']
        new_user_extension.phone = user_data['phone']
        if user_data['representative'] is not None:
            new_user_extension.representative_id = user_data['representative']
        else:
            new_user_extension.representative_id = None

        if user_data['provider'] is not None:
            new_user_extension.provider_id = user_data['provider']
        else:
            new_user_extension.provider_id = None
        new_user_extension.save()
        properties = models.Property.objects.filter(id__in=user_data['properties'])
        new_user_extension.properties.set(properties)
        new_user_extension.save()
        
        user_extension_to_return = serializers.UserExtensionSerializer(new_user_extension).data
        EmailsViewSet.welcome_email_with_password(new_user_extension.user.id,new_user_extension.first_password,request)
        return Response(user_extension_to_return)

    def update(self, request, pk):
        user_data = request.data
        user_extension = models.UserExtension.objects.get(id=pk)
        user = user_extension.user
        user.username = user_data['user']['username']
        user.first_name = user_data['user']['first_name']
        user.last_name = user_data['user']['last_name']
        if user_data['user']["email"] != user.email:
            if not User.objects.filter(email=user_data['user']["email"]).exclude(id=pk).exists():
                user.email= user_data['user']["email"]
        if 'Administrador de usuarios' in self.get_user_permissions(request.user):
            user.is_superuser = user_data['user']['is_superuser']
            user.is_active = user_data['user']['is_active']
        groups = Group.objects.filter(id=user_data['permission_group'])
        user.groups.set(groups)
        user.save()
        if user_data['representative'] is not None:
            user_extension.representative_id = user_data['representative']
        else:
            user_extension.representative_id = None

        if user_data['provider'] is not None:
            user_extension.provider_id = user_data['provider']
        else:
            user_extension.provider_id = None
        
        user_extension.verification_2fa = user_data['verification_2fa']
        user_extension.verification_2fa_method = user_data['verification_2fa_method']
        user_extension.phone = user_data['phone']

        properties = models.Property.objects.filter(id__in=user_data['properties'])

        user_extension.properties.set(properties)
        user_extension.save()
        user_extension_to_return = serializers.UserExtensionSerializer(user_extension).data
        return Response(user_extension_to_return)
    
    def destroy(self, request, pk):
        user_extension = models.UserExtension.objects.get(id=pk)
        user = user_extension.user
        user_extension.delete()
        user.delete()
        return Response()
    
    def user_send_welcome_email(self,request,pk):
        user_extension = models.UserExtension.objects.get(pk=pk)
        return Response(EmailsViewSet.welcome_email_with_password(user_extension.user.id,user_extension.first_password,request))
        
    def user_send_reset_password_email(self,request,pk):
        user_extension = models.UserExtension.objects.get(pk=pk)
        user_extension_password_reset = models.UserExtensionPasswordReset.objects.activeTokenByExpansion(user_extension)
        if user_extension_password_reset is None:
            user_extension_password_reset = models.UserExtensionPasswordReset()
            user_extension_password_reset.user_extension = user_extension
            user_extension_password_reset.save()
        return Response(EmailsViewSet.reset_password_email(user_extension,user_extension_password_reset,request))

class PropertyViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsSuperuser)
    queryset = models.Property.objects.all()
    serializer_class = serializers.PropertySerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'code',)
    filter_fields = ('id', 'name', 'code')

class ActivityViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Activity.objects.all()
    serializer_class = serializers.ActivitySerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'properties')

class RepresentativeViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Representative.objects.all()
    serializer_class = serializers.RepresentativeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('code','name', 'property__name', 'property__code')
    filter_fields = ('id', 'code', 'name', 'active', 'property')

class BusinessGroupViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.BusinessGroup.objects.all()
    serializer_class = serializers.BusinessGroupSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'properties')

class OperationTypeViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.OperationType.objects.all()
    serializer_class = serializers.OperationTypeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'properties')

class DepartmentCECOSViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.DepartmentCECOS.objects.all()
    serializer_class = serializers.DepartmentCECOSSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'code', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'code', 'properties')

class WidgetFilter(FilterSet):
    no_provider = BooleanFilter(field_name='provider', lookup_expr='isnull')
    class Meta:
        model = models.ExchangeRate
        fields = ('id', 'start_date', 'usd_currency', 'euro_currency', 'provider', 'property')

class ExchangeRateViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.ExchangeRate.objects.all()
    filterset_class = WidgetFilter
    serializer_class = serializers.ExchangeRateSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('start_date', 'type', 'usd_currency', 'euro_currency', 'provider__name', 'property__name', 'property__code')
    filter_fields = ('id', 'start_date', 'type', 'usd_currency', 'euro_currency', 'provider', 'property')

    def get_queryset(self):
        queryset = self.queryset
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        queryset = queryset.ProviderNoProperty(user_extension).distinct()
        return queryset

class SaleTypeViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.SaleType.objects.all()
    serializer_class = serializers.SaleTypeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'sap_code', 'warehouse_code', 'department_cecos__name', 'operation_type__name', 'property__name', 'property__code')
    ordering_fields = ('name', 'sap_code', 'warehouse_code', 'department_cecos__name', 'is_inner_bussiness',)
    filter_fields = ('id', 'name', 'is_inner_bussiness', 'sap_code', 'warehouse_code', 'department_cecos', 'operation_type', 'property')

class HotelViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Hotel.objects.all()
    serializer_class = serializers.HotelSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'opera_code', 'zone_id', 'unit__name', 'properties__name', 'properties__code')
    ordering_fields = ('name', 'opera_code', 'zone_id', 'unit__name',)
    filter_fields = ('name', 'opera_code', 'zone_id', 'unit', 'properties',)

    def operation_hotels(self, request):
        service = models.Service.objects.get(id=request.GET['service'])
        zones = service.zones.split(",")
        hotels = models.Hotel.objects.filter(properties__id=request.GET['property'],zone_id__isnull=False,zone_id__in=zones)
        return Response(serializers.HotelSerializer(hotels,many=True).data)
    
class HotelImageViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.HotelImage.objects.all().order_by('language','position')
    serializer_class = serializers.HotelImageSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('position', 'hotel__name', 'creator__name')
    ordering_fields = ('position', 'hotel__name', 'creator__name')
    filter_fields = ('id', 'position', 'hotel', 'creator')

    def perform_create(self, serializer):
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        serializer.save(creator=user_extension)

class ProviderViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Provider.objects.all().AnnotateLastExchange()
    serializer_class = serializers.ProviderTableSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'business_name', 'tax_key', 'address', 'city', 'phone', 'currency', 'sap_code', 'email', 'url', 'credit_days', 'active', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'business_name', 'tax_key', 'address', 'city', 'phone', 'currency', 'sap_code', 'email', 'url', 'credit_days', 'active', 'properties',)

class UnitTypeViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.UnitType.objects.all()
    serializer_class = serializers.UnitTypeSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name','property__name', 'property__code',)
    filter_fields = ('id', 'name', 'property')

class UnitViewSet(PropertyMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Unit.objects.all()
    serializer_class = serializers.UnitSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('unit_type__name', 'code', 'name', 'is_private', 'capacity', 'provider__name', 'property__name', 'property__code',)
    ordering_fields = ('unit_type__name', 'code', 'name', 'is_private', 'capacity', 'provider__name',)
    filter_fields = ('id', 'unit_type',  'code', 'name', 'is_private', 'capacity', 'provider', 'property')

class ServiceListViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Service.objects.all().tableOptimization()
    serializer_class = serializers.ServiceListSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('properties__name', 'properties__code')
    ordering_fields = ('name',)
    filter_fields = ('properties',)

class ServiceFilter(FilterSet):
    no_service_fee = BooleanFilter(field_name='service_fee', lookup_expr='isnull')
    class Meta:
        model = models.Service
        fields = ('id', 'code', 'name', 'provider', 'activity', 'opera_code', 'description_po', 'description_es', 'description_en', 'is_transfer', 'service_fee_amount', 'service_fee', 'business_group', 'availability_group', 'is_colective', 'zones', 'properties',)

class ServiceViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Service.objects.all().tableOptimization()
    serializer_class = serializers.ServiceSerializer
    filterset_class = ServiceFilter
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('id', 'code', 'name', 'provider__name', 'activity__name', 'opera_code', 'description_po', 'description_es', 'description_en', 'business_group__name', 'availability_group__name', 'zones', 'properties__name', 'properties__code')
    ordering_fields = ('code', 'name', 'provider__name', 'activity__name', 'opera_code', 'business_group__name', 'availability_group__name')
    filter_fields = ('id', 'code', 'name', 'provider', 'activity', 'opera_code', 'description_po', 'description_es', 'description_en', 'is_transfer', 'service_fee_amount', 'service_fee', 'business_group', 'availability_group', 'is_colective', 'zones', 'properties',)

    def operation_services(self, request):
        services = models.Service.objects.filter(properties__id=request.GET['property'],is_transfer=True)
        return Response(serializers.ServiceSerializer(services,many=True).data)
    
    def service_data(self, request, pk):
        from django.conf import settings
        service = models.Service.objects.get(id=pk)
        context = {
            'name':service.name,
            'description_po':service.description_po,
            'description_es':service.description_es,
            'description_en':service.description_en,
            'activity':service.activity.name if service.activity else "",
            'business_group':service.business_group.name if service.business_group else "",
            'images':[]
        }
        service_images = models.ServiceImage.objects.filter(service=service)
        key = 1
        for service_image in service_images:
            image_data = {
                'src':service_image.image.url,
                'altText':service_image.title,
                'key':key
            }
            context['images'].append(image_data)
            key = key + 1
        return Response(context)

    def services_list(self, request):
        return Response(serializers.ServiceListSerializer(self.queryset,many=True).data)

class ServiceImageViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.ServiceImage.objects.all()
    serializer_class = serializers.ServiceImageSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('title', 'service__name', 'creator__name')
    ordering_fields = ('title', 'service__name', 'creator__name')
    filter_fields = ('id', 'title', 'service', 'creator')

    def perform_create(self, serializer):
        user_extension = models.UserExtension.objects.get(user=self.request.user)
        serializer.save(creator=user_extension)

class AvailabilityGroupViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.AvailabilityGroup.objects.all()
    serializer_class = serializers.AvailabilityGroupSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('code','name', 'group__name', 'properties__name', 'properties__code')
    ordering_fields = ('id', 'code', 'name', 'group__name',)
    filter_fields = ('id', 'code', 'name', 'group', 'properties',)

class GroupViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Group.objects.all()
    serializer_class = serializers.GroupSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'properties',)

class StoreViewSet(PropertiesMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsValidUserAuthentication,HasCatalogModelPermissions|IsCatalogManagement)
    queryset = models.Store.objects.all()
    serializer_class = serializers.StoreSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('name', 'properties__name', 'properties__code')
    filter_fields = ('id', 'name', 'properties')

class RequestViewSet(UtopiAppMetadataViewMixin,viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,IsSuperuser)
    queryset = models.Request.objects.all()
    serializer_class = serializers.RequestSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter,)
    search_fields = ('endpoint', 'user__username', 'method', 'exec_time', 'date')
    filter_fields = ('id', 'endpoint', 'user', 'response_code', 'method','remote_address', 'exec_time', 'date')
    ordering_fields = ('id', 'endpoint', 'user__username', 'response_code', 'method', 'exec_time', 'date')

class EmailsViewSet(viewsets.ViewSet):
    exclude_from_schema = True

    IMAGES_PATH                  = os.path.join(OperacionesVPBASE_DIR,"FrontEndApp","templates","users","emails")

    HEAD_TAG_REGEX               = re.compile("<head[^>]+>.*</head>")
    EMBEDDED_IMG_TAG_REGEX       = re.compile("<img[^>]+src=\"([^\"]+)\"[^>]*>")

    DEFAULT_EMAIL_SUBJECT_STRING = "Vacation Planners"
    WELCOME_EMAIL_SUBJECT_STRING = "Bienvenido al sistema de VP"
    RESET_PASSWORD_EMAIL_SUBJECT_STRING = "Restablecimiento de contraseña"
    CODE_2FA_VERIFICATION_EMAIL_SUBJECT_STRING = "Código de Acceso de Autenticación de Dos Factores (2FA)"
    TOKEN_RESERVATION_EMAIL_SUBJECT_STRING = "Reservacion en linea"

    def html_to_plain_text(html):
        head_tag_match = EmailsViewSet.HEAD_TAG_REGEX.search(html)

        if head_tag_match:
            plain_text  = html.replace(head_tag_match.group(0),"")
        else:
            plain_text  = html

        return strip_tags(plain_text)
    
    # Does not support multiple images with the same name.
    # Searches for images in <project_folder>/FrontEndApp/templates/users/emails/
    def prepare_html_images(html):
        prepared_html      = html
        images             = []
        embedded_img_match = EmailsViewSet.EMBEDDED_IMG_TAG_REGEX.search(prepared_html)

        while embedded_img_match:
            image_src   = embedded_img_match.group(1)
            image_path  = os.path.join(EmailsViewSet.IMAGES_PATH,image_src)
            if os.path.exists(image_path) and os.path.isfile(image_path):
                image_name      = os.path.basename(image_path)
                prepared_html   = prepared_html.replace(image_src,"cid:{}".format(image_name))
                image           = MIMEImage(open(image_path,"rb").read())
                image.add_header("Content-ID","<{}>".format(image_name))
                images.append(image)

            embedded_img_match = EmailsViewSet.EMBEDDED_IMG_TAG_REGEX.search(prepared_html,embedded_img_match.end())

        return prepared_html,images

    def prepare_html_email_from_template(template,context,email_recipients,subject=DEFAULT_EMAIL_SUBJECT_STRING,from_email=DEFAULT_FROM_EMAIL):
        email_html        = render_to_string(template,context)

        email_html,images = EmailsViewSet.prepare_html_images(email_html)
        email_plain       = EmailsViewSet.html_to_plain_text(email_html)

        email   = EmailMultiAlternatives(subject,email_plain,from_email,email_recipients)
        for image in images:
            email.attach(image)
        email.attach_alternative(email_html,"text/html")
        return email

    def prepare_html_email_from_template_pdf_attach(template,context,email_recipients,pdf_name,pdf,subject=DEFAULT_EMAIL_SUBJECT_STRING,from_email=DEFAULT_FROM_EMAIL):
        #from GeneralApp.models import EmailLog
        email_html        = render_to_string(template,context)

        email_html,images = EmailsViewSet.prepare_html_images(email_html)
        email_plain       = EmailsViewSet.html_to_plain_text(email_html)

        email   = EmailMultiAlternatives(subject,email_plain,from_email,email_recipients)
        for image in images:
            email.attach(image)
        email.attach_alternative(email_html,"text/html")
        email.attach(pdf_name, pdf.getvalue(), "application/pdf")
        """ for email_recipient in email_recipients:
            email_log = EmailLog(
                to_email=email_recipient,
                attachment=True,
                subject=subject,
            )
            email_log.save() """

        return email

    def reset_password_email(extension,token,request):
        from django.conf		import settings
        context={}
        email_recipients = []
        email = extension.user.email
        context={
            'name'      : extension.user.get_full_name(),
            'username'  : extension.user.username,
            'uuid'      : token.uuid,
            'host'      : request.get_host(),
            'environment':getattr(serverconfig,"environment","http"),
        }
        print(context)
        email_recipients = [email]
        email_set            = EmailsViewSet.prepare_html_email_from_template("emails/reset-password/template.html",
            context,
            email_recipients,
            EmailsViewSet.RESET_PASSWORD_EMAIL_SUBJECT_STRING)

        email_set.send()

        return {
            'code'    : "success",
            'message' : "Se ha enviado un correo de reinicio de contraseña al {}".format(email),
        }
    
    def welcome_email_with_password(pk,password,request):
        from django.conf		import settings
        extension = models.UserExtension.objects.get(user__id=pk)
        email = ''
        context={}
        email = extension.user.email
        context={
            'name'      : extension.user.get_full_name(),
            'username'  : extension.user.username,
            'password'  : password,
            'host'      : request.get_host(),
            'environment':getattr(serverconfig,"environment","http"),
        }
        email_recipients = [email]
        email_set            = EmailsViewSet.prepare_html_email_from_template("emails/welcome/template.html",
            context,
            email_recipients,
            EmailsViewSet.WELCOME_EMAIL_SUBJECT_STRING
        )
        email_set.send()

        return {
            'code'    : "success",
            'message' : "Se ha enviado un correo de bienvenida al correo {}".format(email),
        }
    
    def reservation_token(email,token,request):
        from django.conf		import settings
        context={}
        email_recipients = []
        context={
            'uuid'      : token.uuid,
            'host'      :request.get_host(),
            'environment':getattr(serverconfig,"environment","http"),
        }
        email_recipients = [email]
        email_set            = EmailsViewSet.prepare_html_email_from_template("emails/reservation-token/template.html",
            context,
            email_recipients,
            EmailsViewSet.TOKEN_RESERVATION_EMAIL_SUBJECT_STRING)

        email_set.send()

        return {
            'code'    : "success",
            'message' : "Se ha enviado un correo con el formulario de reserva al {}".format(email),
        }