from django.urls import path, include
from rest_framework import routers
from SalesApp import views

APP_NAME = 'SalesApp'

router = routers.DefaultRouter()
router.register(r'payment_types', views.PaymentTypeViewSet)
router.register(r'client_types', views.ClientTypeViewSet)
router.register(r'payment_methods', views.PaymentMethodViewSet)
router.register(r'service_rates', views.ServiceRateViewSet)
router.register(r'service_rate_comissions', views.ServiceRateComissionViewSet)
router.register(r'coordinators_comissions', views.CoordinatorsComissionViewSet)
router.register(r'availabilities', views.AvailabilityViewSet)
router.register(r'schedules', views.ScheduleViewSet)
router.register(r'schedule_pickups', views.SchedulePickUpViewSet)
router.register(r'schedule_allotments', views.ScheduleAllotmentViewSet)
router.register(r'discounts', views.DiscountViewSet)
router.register(r'auth_discounts', views.AuthDiscountViewSet)
router.register(r'sale_logs', views.SaleLogViewSet)
router.register(r'store_cards', views.StoreCardViewSet)
router.register(r'store_card_charges', views.StoreCardChargeViewSet)

payment_types_list = views.PaymentTypeViewSet.as_view({
    'get':'list',
    'post':'create'
})

payment_type_detail = views.PaymentTypeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

client_types_list = views.ClientTypeViewSet.as_view({
    'get':'list',
    'post':'create'
})

client_type_detail = views.ClientTypeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

payment_methods_list = views.PaymentMethodViewSet.as_view({
    'get':'list',
    'post':'create'
})

payment_method_detail = views.PaymentMethodViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

service_rates_list = views.ServiceRateViewSet.as_view({
    'get':'list',
    'post':'create'
})

service_rate_detail = views.ServiceRateViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

service_rate_comissions_list = views.ServiceRateComissionViewSet.as_view({
    'get':'list',
    'post':'create'
})

service_rate_comission_detail = views.ServiceRateComissionViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

coordinators_comissions_list = views.CoordinatorsComissionViewSet.as_view({
    'get':'list',
    'post':'create'
})

coordinators_comission_detail = views.CoordinatorsComissionViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

availabilities_list = views.AvailabilityViewSet.as_view({
    'get':'list',
    'post':'create'
})

availability_detail = views.AvailabilityViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

availability_clone = views.AvailabilityViewSet.as_view({
    'put':'availability_clone_from',
})

schedules_list = views.ScheduleViewSet.as_view({
    'get':'list',
    'post':'create'
})

schedule_detail = views.ScheduleViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

schedule_pickups_list = views.SchedulePickUpViewSet.as_view({
    'get':'list',
    'post':'create'
})

schedule_pickup_detail = views.SchedulePickUpViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

schedule_allotments_list = views.ScheduleAllotmentViewSet.as_view({
    'get':'list',
})

schedule_allotment_detail = views.ScheduleAllotmentViewSet.as_view({
    'get':'retrieve',
    'patch':'partial_update',
    'delete':'destroy'
})

discounts_list = views.DiscountViewSet.as_view({
    'get':'list',
    'post':'create'
})

discount_detail = views.DiscountViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

auth_discounts_list = views.AuthDiscountViewSet.as_view({
    'get':'list',
    'post':'create'
})

auth_discount_detail = views.AuthDiscountViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

sale_logs_list = views.SaleLogViewSet.as_view({
    'get':'list',
})

sale_log_detail = views.SaleLogViewSet.as_view({
    'get':'retrieve',
})

store_cards_list = views.StoreCardViewSet.as_view({
    'get':'list',
    'post':'create'
})

store_card_detail = views.StoreCardViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

store_card_charges_list = views.StoreCardChargeViewSet.as_view({
    'get':'list',
    'post':'create'
})

store_card_charge_detail = views.StoreCardChargeViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

sales_table_list = views.SaleTableViewSet.as_view({
    'get':'list',
})

sales_list = views.SaleViewSet.as_view({
    'get':'list',
    'post':'create'
})

sale_detail = views.SaleViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})
allotment_list = views.ScheduleAllotmentViewSet.as_view({'get':"allotment_list",'patch':"allotment_patch"})
sale_reservation_search = views.SaleViewSet.as_view({'get':"sale_reservation_search"})
sale_discount = views.SaleViewSet.as_view({'get':"sale_discount"})
conditional_content_types = views.DiscountViewSet.as_view({'get':"conditional_content_types"})
discount_key_search = views.SaleViewSet.as_view({'get':"discount_key_search"})
operations_list	= views.SaleViewSet.as_view({'get':"operations_list"})
operations_list_date	= views.SaleViewSet.as_view({'get':"operations_list_date"})
operations_unit_set_asigment	= views.SaleViewSet.as_view({'put':"operations_unit_set_asigment"})
operation_report_list = views.SaleViewSet.as_view({'get':"operation_report_list"})
sale_schedule_available = views.SaleViewSet.as_view({'get':"sale_schedule_available"})
sale_service_rate = views.SaleViewSet.as_view({'get':"sale_service_rate"})
service_report_print = views.ServiceRateViewSet.as_view({'get':"service_report_print"})
sale_date	= views.SaleViewSet.as_view({'get':"date_for_sale"})
sale_exchange_rate = views.SaleViewSet.as_view({'get':"sale_exchange_rate"})
sale_services = views.SaleViewSet.as_view({'get':"sale_services"})
cancel_sale = views.SaleViewSet.as_view({'put':"cancel_sale"})
cancel_sale_force = views.SaleViewSet.as_view({'put':"cancel_sale_force"})
refund_sale = views.SaleViewSet.as_view({'put':"refund_sale"})
refund_sale_force = views.SaleViewSet.as_view({'put':"refund_sale_force"})
print_sale = views.SaleViewSet.as_view({'get':"print_sale"})
credit_charge_request = views.SaleViewSet.as_view({'get':"credit_charge_request"})
credit_charge_confirmation = views.SaleViewSet.as_view({'get':"credit_charge_confirmation"})
store_card_search_valid = views.SaleViewSet.as_view({'post':"store_card_search_valid"})
print_trasaction_payment = views.SaleViewSet.as_view({'get':"print_trasaction_payment"})
sale_coupon_send_email = views.SaleViewSet.as_view({'get':"sale_coupon_send_email"})
sale_report_list_filters = views.SaleViewSet.as_view({'get':"sale_report_list_filters"})
sale_report_print = views.SaleViewSet.as_view({'get':"sale_report_print"})
sale_report_sap_filters = views.SaleViewSet.as_view({'get':"sale_report_sap_filters"})
sale_report_sap_print = views.SaleViewSet.as_view({'get':"sale_report_sap_print"})
store_card_send_email = views.StoreCardViewSet.as_view({'get':"store_card_send_email"})

properties_list = views.SaleTokenViewSet.as_view({'get':"vp_list"})
sale_token_data = views.SaleTokenViewSet.as_view({'get':"sale_token_data"})
sale_token_services_sales = views.SaleTokenViewSet.as_view({'get':"get_list_services_available"})
sale_token_list = views.SaleTokenViewSet.as_view({
    'post':'create_sale_token'
})
sale_token_detail = views.SaleTokenViewSet.as_view({
    'get':'retrieve_sale',
})
sale_token_payment = views.SaleTokenViewSet.as_view({
    'get':'sale_token_payment',
})
sale_token_print = views.SaleTokenViewSet.as_view({
    'get':'sale_token_print',
})
urlpatterns = [
    path('',include(router.urls)),
    path('payment_types/',                      payment_types_list,             name='rest_payment_types_list'),
    path('payment_types/<int:pk>/',             payment_type_detail,            name='rest_payment_type_detail'),
    path('client_types/',                       client_types_list,              name='rest_client_types_list'),
    path('client_types/<int:pk>/',              client_type_detail,             name='rest_client_type_detail'),
    path('payment_methods/',                    payment_methods_list,           name='rest_payment_methods_list'),
    path('payment_methods/<int:pk>/',           payment_method_detail,          name='rest_payment_method_detail'),
    path('service_rates/',                      service_rates_list,             name='rest_service_rates_list'),
    path('service_rates/<int:pk>/',             service_rate_detail,            name='rest_service_rate_detail'),
    path('sale_service_rate/',                  sale_service_rate,              name='rest_sale_service_rate'),
    path('service_report_print/',               service_report_print,           name='rest_service_report_print'),
    path('service_rate_comissions/',            service_rate_comissions_list,   name='rest_service_rate_comissions_list'),
    path('service_rate_comissions/<int:pk>/',   service_rate_comission_detail,  name='rest_service_rate_comission_detail'),
    path('coordinators_comissions/',            coordinators_comissions_list,   name='rest_coordinators_comissions_list'),
    path('coordinators_comissions/<int:pk>/',   coordinators_comission_detail,  name='rest_coordinators_comission_detail'),
    path('availabilities/',                     availabilities_list,            name='rest_availabilities_list'),
    path('availabilities/<int:pk>/',            availability_detail,            name='rest_availability_detail'),
    path('availabilities_clone_from/<int:pk>/', availability_clone,             name='rest_availability_clone'),
    path('schedules/',                          schedules_list,                 name='rest_schedules_list'),
    path('schedules/<int:pk>/',                 schedule_detail,                name='rest_schedule_detail'),
    path('schedule_pickups/',                   schedule_pickups_list,          name='rest_schedule_pickups_list'),
    path('schedule_pickups/<int:pk>/',          schedule_pickup_detail,         name='rest_schedule_pickup_detail'),
    path('schedule_allotments/',                schedule_allotments_list,       name='rest_schedule_allotments_list'),
    path('schedule_allotments/<int:pk>/',       schedule_allotment_detail,      name='rest_schedule_allotment_detail'),
    path('allotment_list/',                     allotment_list,                 name='rest_allotment_list'),
    path('sale_schedule_available/',            sale_schedule_available,        name='rest_sale_schedule_available'),
    path('discounts/',                          discounts_list,                 name='rest_discounts_list'),
    path('discounts/<int:pk>/',                 discount_detail,                name='rest_discount_detail'),
    path('auth_discounts/',                     auth_discounts_list,            name='rest_auth_discounts_list'),
    path('auth_discounts/<int:pk>/',            auth_discount_detail,           name='rest_auth_discount_detail'),
    path('store_cards/',                        store_cards_list,               name='rest_store_cards_list'),
    path('store_cards/<int:pk>/',               store_card_detail,              name='rest_store_card_detail'),
    path('store_card_send_email/<int:pk>/',     store_card_send_email,          name='rest_store_card_send_email'),
    path('store_card_charges/',                 store_card_charges_list,        name='rest_store_card_charges_list'),
    path('store_card_charges/<int:pk>/',        store_card_charge_detail,       name='rest_store_card_charge_detail'),
    path('discount_key_search/',                discount_key_search,            name='rest_discount_key_search'),
    path('sale_reservation_search/',            sale_reservation_search,        name='rest_sale_reservation_search'),
    path('sale_discount/',                      sale_discount,                  name='rest_sale_discount'),
    path('conditional_content_types/',          conditional_content_types,      name='rest_conditional_content_types'),
    path('sale/date/',                          sale_date,                      name='rest_sale_date'),
    path('exchange_rate/',                      sale_exchange_rate,             name='rest_sale_exchange_rate'),
    path('sale_services/',                      sale_services,                  name='rest_sale_services'),
    path('sales_table/',                        sales_table_list,               name='rest_sales_table_list'),
    path('sales/',                              sales_list,                     name='rest_sales_list'),
    path('sales/<int:pk>/',                     sale_detail,                    name='rest_sale_detail'),
    path('sale_logs/',                          sale_logs_list,                 name='rest_sale_logs_list'),
    path('sale_logs/<int:pk>/',                 sale_log_detail,                name='rest_sale_log_detail'),
    path('refund_sale/<int:pk>/',               refund_sale,                    name='rest_refund_sale'),
    path('refund_sale_force/<int:pk>/',         refund_sale_force,              name='rest_refund_sale_force'),
    path('cancel_sale/<int:pk>/',               cancel_sale,                    name='rest_cancel_sale'),
    path('cancel_sale_force/<int:pk>/',         cancel_sale_force,              name='rest_cancel_sale_force'),
    path('print_sale/<int:pk>/',                print_sale,                     name='rest_print_sale'),
    path('credit_charge_request/',              credit_charge_request,          name='rest_credit_charge_request'),
    path('credit_charge_confirmation/<int:pk>/',credit_charge_confirmation,     name='rest_credit_charge_confirmation'),
    path('store_card_search_valid/',            store_card_search_valid,        name='rest_store_card_search_valid'),
    path('print_trasaction_payment/<str:uid>/', print_trasaction_payment,       name='rest_print_trasaction_payment'),
    path('operations_list/',                    operations_list,                name='rest_operations_list'),
    path('operations_list_date/',               operations_list_date,           name='rest_operations_list_date'),
    path('operations_unit_set_asigment/',       operations_unit_set_asigment,   name='rest_operations_unit_set_asigment'),
    path('operation_report_list/',              operation_report_list,          name='rest_operation_report_list'),
    path('sale_report_list_filters/',           sale_report_list_filters,       name='rest_sale_report_list_filters'),
    path('sale_report_print/',                  sale_report_print,              name='rest_sale_report_print'),
    path('sale_report_sap_filters/',            sale_report_sap_filters,        name='rest_sale_report_sap_filters'),
    path('sale_report_sap_print/',              sale_report_sap_print,          name='rest_sale_report_sap_print'),
    path('sale_coupon_send_email/<int:pk>/',    sale_coupon_send_email,         name='rest_sale_coupon_send_email'),
    #Token Sale
    path('sale_token/properties/',              properties_list,                name='rest_properties_list'),
    path('sale_token/create_data/<int:pk>/',    sale_token_data,                name='rest_sale_token_data'),
    path('sale_token/services_sales/<int:pk>/', sale_token_services_sales,      name='rest_sale_token_services_sales'),
    path('sale_token/',                         sale_token_list,                name='rest_sale_token_list'),
    path('sale_token/<uuid:uid>/',              sale_token_detail,              name='rest_sale_token_detail'),
    path('sale_token/payment/<uuid:uid>/',      sale_token_payment,             name='rest_sale_token_payment'),
    path('print_sale_token/<uuid:uid>/',        sale_token_print,               name='rest_sale_token_print'),
]