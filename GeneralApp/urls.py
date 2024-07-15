from django.urls import path, include
from rest_framework import routers
from GeneralApp import views

APP_NAME = 'GeneralApp'

router = routers.DefaultRouter()
router.register(r'activities', views.ActivityViewSet)
router.register(r'departmentscecos', views.DepartmentCECOSViewSet)
router.register(r'exchangerates', views.ExchangeRateViewSet)
router.register(r'saletypes', views.SaleTypeViewSet)
router.register(r'properties', views.PropertyViewSet)
router.register(r'hotels', views.HotelViewSet)
router.register(r'hotel_images', views.HotelImageViewSet)
router.register(r'providers', views.ProviderViewSet)
router.register(r'units', views.UnitViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'availability_groups', views.AvailabilityGroupViewSet)
router.register(r'business_groups', views.BusinessGroupViewSet)
router.register(r'operation_types', views.OperationTypeViewSet)
router.register(r'services', views.ServiceViewSet)
router.register(r'service_images', views.ServiceImageViewSet)
router.register(r'representatives', views.RepresentativeViewSet)
router.register(r'stores', views.StoreViewSet)
router.register(r'requests', views.RequestViewSet)
router.register(r'services_list', views.ServiceListViewSet)

groups_list = views.GroupViewSet.as_view({
    'get':'list',
    'post':'create'
})

group_detail = views.GroupViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

availability_groups_list = views.AvailabilityGroupViewSet.as_view({
    'get':'list',
    'post':'create'
})

availability_group_detail = views.AvailabilityGroupViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

business_groups_list = views.BusinessGroupViewSet.as_view({
    'get':'list',
    'post':'create'
})

business_group_detail = views.BusinessGroupViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

operation_types_list = views.OperationTypeViewSet.as_view({
    'get':'list',
    'post':'create'
})

operation_type_detail = views.OperationTypeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

activities_list = views.ActivityViewSet.as_view({
    'get':'list',
    'post':'create'
})

activity_detail = views.ActivityViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

departmentscecos_list = views.DepartmentCECOSViewSet.as_view({
    'get':'list',
    'post':'create'
})

departmentcecos_detail = views.DepartmentCECOSViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

exchangerates_list = views.ExchangeRateViewSet.as_view({
    'get':'list',
    'post':'create'
})

exchangerate_detail = views.ExchangeRateViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

saletypes_list = views.SaleTypeViewSet.as_view({
    'get':'list',
    'post':'create'
})

saletype_detail = views.SaleTypeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

services_list = views.ServiceViewSet.as_view({
    'get':'list',
    'post':'create'
})

service_detail = views.ServiceViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

service_images_list = views.ServiceImageViewSet.as_view({
    'get':'list',
    'post':'create'
})

service_image_detail = views.ServiceImageViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

representatives_list = views.RepresentativeViewSet.as_view({
    'get':'list',
    'post':'create'
})

representative_detail = views.RepresentativeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

user_groups_list = views.UserGroupViewSet.as_view({
    'get':'list',
    'post':'create'
})

user_group_detail = views.UserGroupViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

properties_list = views.PropertyViewSet.as_view({
    'get':'list',
    'post':'create'
})

property_detail = views.PropertyViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

profile_detail = views.ProfileViewSet.as_view({
    'get':'profile',
    'put':'save_profile',
    'patch':'new_password',
})

hotels_list = views.HotelViewSet.as_view({
    'get':'list',
    'post':'create'
})

hotel_detail = views.HotelViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

hotel_images_list = views.HotelImageViewSet.as_view({
    'get':'list',
    'post':'create'
})

hotel_image_detail = views.HotelImageViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

providers_list = views.ProviderViewSet.as_view({
    'get':'list',
    'post':'create'
})

provider_detail = views.ProviderViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

unit_types_list = views.UnitTypeViewSet.as_view({
    'get':'list',
    'post':'create'
})

unit_type_detail = views.UnitTypeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

units_list = views.UnitViewSet.as_view({
    'get':'list',
    'post':'create'
})

unit_detail = views.UnitViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

permission_groups_list = views.ExtendedUserViewSet.as_view({
    'get':'groups_list',
    'post':'create_group'
})

permission_group_detail = views.ExtendedUserViewSet.as_view({
    'get':'group_get',
    'put':'update_group',
    'delete':'delete_group'
})

stores_list = views.StoreViewSet.as_view({
    'get':'list',
    'post':'create'
})

store_detail = views.StoreViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

requests_list = views.RequestViewSet.as_view({
    'get':'list',
})

request_detail = views.RequestViewSet.as_view({
    'get':'retrieve',
})

operation_hotels_list = views.HotelViewSet.as_view({'get':'operation_hotels'})
operation_services_list = views.ServiceViewSet.as_view({'get':'operation_services'})
service_data = views.ServiceViewSet.as_view({'get':'service_data'})
services_list_view = views.ServiceListViewSet.as_view({'get':'list'})
query_fixing = views.QueryFixViewSet.as_view({'get':'query_fixing'})

urlpatterns = [
    path('',include(router.urls)),
    #Seccion de urls de usuarios
    path('groups/', groups_list, name='rest_groups_list'),
    path('groups/<int:pk>/', group_detail, name='rest_group_detail'),
    path('user_groups/', user_groups_list, name='rest_user_groups_list'),
    path('user_groups/<int:pk>/', user_group_detail, name='rest_user_group_detail'),
    path('availability_groups/', availability_groups_list, name='rest_availability_groups_list'),
    path('availability_groups/<int:pk>/', availability_group_detail, name='rest_availability_group_detail'),
    path('permissions/', views.ExtendedUserViewSet.as_view({'get':'permissions_list'})),
    path('permission_groups/', permission_groups_list, name='rest_permission_groups_list'),
    path('permission_groups/<int:pk>/', permission_group_detail, name='rest_permission_group_detail'),
    path('extended_users/', views.ExtendedUserViewSet.as_view({'get':'list', 'post':'create'}), name='rest_extended_users_create'),
    path('extended_users/<int:pk>/', views.ExtendedUserViewSet.as_view({'get':'fetch', 'put':'update','delete':'destroy'}), name='rest_extended_user_update'),
    path('new_password/<int:pk>/', views.ExtendedUserViewSet.as_view({'patch':'new_password'})),
    path('deactivate_extended_user/<int:pk>/', views.ExtendedUserViewSet.as_view({'patch':'deactivate_user'})),
    path('user_send_welcome_email/<int:pk>/', views.ExtendedUserViewSet.as_view({'post':'user_send_welcome_email'})),
    path('user_send_reset_password_email/<int:pk>/', views.ExtendedUserViewSet.as_view({'post':'user_send_reset_password_email'})),
    path('profile/', profile_detail, name='rest_user_profile'),
    path('profile_send_reset_password_email/', views.ProfileViewSet.as_view({'post':'user_send_reset_password_email'})),
    #Seccion de catalogos generales
    path('activities/', activities_list, name='rest_activities_list'),
    path('activities/<int:pk>/', activity_detail, name='rest_activity_detail'),
    path('business_groups/', business_groups_list, name='rest_business_groups_list'),
    path('business_groups/<int:pk>/', business_group_detail, name='rest_business_group_detail'),
    path('operation_types/', operation_types_list, name='rest_operation_types_list'),
    path('operation_types/<int:pk>/', operation_type_detail, name='rest_operation_type_detail'),
    path('departmentscecos/', departmentscecos_list, name='rest_departmentscecos_list'),
    path('departmentscecos/<int:pk>/', departmentcecos_detail, name='rest_departmentcecos_detail'),
    path('exchangerates/', exchangerates_list, name='rest_exchangerates_list'),
    path('exchangerates/<int:pk>/', exchangerate_detail, name='rest_exchangerate_detail'),
    path('saletypes/', saletypes_list, name='rest_saletypes_list'),
    path('saletypes/<int:pk>/', saletype_detail, name='rest_saletype_detail'),
    path('hotels/', hotels_list, name='rest_hotels_list'),
    path('operations_hotels/', operation_hotels_list, name='rest_operation_hotels_list'),
    path('hotels/<int:pk>/', hotel_detail, name='rest_hotel_detail'),
    path('hotel_images/', hotel_images_list, name='rest_hotel_images_list'),
    path('hotel_images/<int:pk>/', hotel_image_detail, name='rest_hotel_image_detail'),
    path('providers/', providers_list, name='rest_providers_list'),
    path('providers/<int:pk>/', provider_detail, name='rest_provider_detail'),
    path('unit_types/', unit_types_list, name='rest_unit_types_list'),
    path('unit_types/<int:pk>/', unit_type_detail, name='rest_unit_type_detail'),
    path('units/', units_list, name='rest_units_list'),
    path('units/<int:pk>/', unit_detail, name='rest_unit_detail'),
    path('services/', services_list, name='rest_services_list'),
    path('services_list/', services_list_view, name='rest_services_list_view'),
    path('operations_services/', operation_services_list, name='rest_operation_services_list'),
    path('service_data/<int:pk>/', service_data, name='rest_service_data'),
    path('services/<int:pk>/', service_detail, name='rest_service_detail'),
    path('service_images/', service_images_list, name='rest_service_images_list'),
    path('service_images/<int:pk>/', service_image_detail, name='rest_service_image_detail'),
    path('representatives/', representatives_list, name='rest_representatives_list'),
    path('representatives/<int:pk>/', representative_detail, name='rest_representative_detail'),
    path('stores/', stores_list, name='rest_stores_list'),
    path('stores/<int:pk>/', store_detail, name='rest_store_detail'),
    #Seccion de propiedades
    path('properties/', properties_list, name='rest_properties_list'),
    path('properties/<int:pk>/', property_detail, name='rest_property_detail'),
    #Log
    path('requests/', requests_list, name='rest_requests_list'),
    path('requests/<int:pk>/', request_detail, name='rest_request_detail'),
    path('query_fixing/', query_fixing, name='rest_query_fixing'),
]