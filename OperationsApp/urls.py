from django.urls import path, include
from rest_framework import routers
from OperationsApp import views

APP_NAME = 'OperationsApp'

router = routers.DefaultRouter()
router.register(r'contacts', views.ContactViewSet)
router.register(r'reservations', views.ReservationViewSet)
router.register(r'reservation_tokens', views.ReservationCreateTokenViewSet)
router.register(r'reservation_logs', views.ReservationLogViewSet)
router.register(r'flights', views.FlightViewSet)
router.register(r'pick_ups', views.PickUpViewSet)

contacts_list = views.ContactViewSet.as_view({
    'get':'list',
    'post':'create'
})

contact_detail = views.ContactViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

reservations_table_list = views.ReservationTableViewSet.as_view({
    'get':'list',
})

reservations_list = views.ReservationViewSet.as_view({
    'get':'list',
    'post':'create'
})

reservation_detail = views.ReservationViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

reservation_create_tokens_list = views.ReservationCreateTokenViewSet.as_view({
    'get':'list',
})

reservation_create_token_detail = views.ReservationCreateTokenViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

reservation_token_list = views.ReservationCreateTokenViewSet.as_view({
    'post':'create_reservation'
})

reservation_token_detail = views.ReservationCreateTokenViewSet.as_view({
    'get':'retrieve_reservation',
    'put':'update_reservation',
})

reservation_logs_list = views.ReservationLogViewSet.as_view({
    'get':'list',
})

reservation_log_detail = views.ReservationLogViewSet.as_view({
    'get':'retrieve',
})

flights_list = views.FlightViewSet.as_view({
    'get':'list',
    'post':'create'
})

flight_detail = views.FlightViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

pick_ups_list = views.PickUpViewSet.as_view({
    'get':'list',
    'post':'create'
})

pick_up_detail = views.PickUpViewSet.as_view({
    'get':'retrieve',
    'put':'update',
    'patch':'partial_update',
    'delete':'destroy'
})

reservation_date	= views.ReservationViewSet.as_view({'get':"date_for_reservation"})
operations_list	= views.ReservationViewSet.as_view({'get':"operations_list"})
operations_list_date	= views.ReservationViewSet.as_view({'get':"operations_list_date"})
operations_unit_last_asigment	= views.ReservationViewSet.as_view({'get':"operations_unit_last_asigment"})
operations_unit_set_last_asigment	= views.ReservationViewSet.as_view({'put':"operations_unit_set_last_asigment"})
operations_unset_unit_asignment = views.ReservationViewSet.as_view({'put':"operations_unset_unit_asignment"})
operations_unset_unit = views.ReservationViewSet.as_view({'put':"operations_unset_unit"})
reservation_confirmation_report_download	= views.ReservationViewSet.as_view({'get':"reservation_confirmation_report_download"})
reservation_confirmation_report_send_email	= views.ReservationViewSet.as_view({'get':"reservation_confirmation_report_send_email"})
operation_report = views.ReservationViewSet.as_view({'get':"operation_report"})
operation_report_send_email = views.ReservationViewSet.as_view({'post':"operation_report_send_email"})
operation_report_list_filters = views.ReservationViewSet.as_view({'get':"operation_report_list_filters"})
operation_report_list_filters_by_year = views.ReservationViewSet.as_view({'get':"operation_report_list_filters_by_year"})
operation_report_list = views.ReservationViewSet.as_view({'get':"operation_report_list"})
operation_report_coupons = views.ReservationViewSet.as_view({'get':"operation_report_coupons"})
operation_report_summary = views.ReservationViewSet.as_view({'get':"operation_report_summary"})
operation_hotels = views.ReservationViewSet.as_view({'get':"operation_hotels"})
operation_units = views.ReservationViewSet.as_view({'get':"operation_units"})
operation_providers = views.ReservationViewSet.as_view({'get':"operation_providers"})
operation_opera_importation = views.ReservationViewSet.as_view({'get':"operation_opera_importation"})
save_reservations_opera = views.ReservationViewSet.as_view({'post':"save_reservations_opera"})
cancel_reservation = views.ReservationViewSet.as_view({'put':"cancel_reservation"})
reactivate_reservation = views.ReservationViewSet.as_view({'put':"reactivate_reservation"})

operation_flights_list	= views.FlightViewSet.as_view({'get':"operation_flights"})

operation_pickuptimes_list	= views.PickUpViewSet.as_view({'get':"operation_pickuptimes"})

invoice_reservation_transfer = views.InvoiceOperationViewSet.as_view({'get':"invoice_reservation_transfer"})
patch_provider = views.InvoiceOperationViewSet.as_view({'patch':"patch_provider"})
patch_cxp = views.InvoiceOperationViewSet.as_view({'patch':"patch_cxp"})
invoice_reservation_report = views.InvoiceOperationViewSet.as_view({'get':"invoice_reservation_report"})

service_list = views.ReservationCreateTokenViewSet.as_view({'get':"service_list"})
operation_type_list = views.ReservationCreateTokenViewSet.as_view({'get':"operation_type_list"})
hotel_list = views.ReservationCreateTokenViewSet.as_view({'get':"hotel_list"})
operation_flights = views.ReservationCreateTokenViewSet.as_view({'get':"operation_flights"})
operation_pickuptimes = views.ReservationCreateTokenViewSet.as_view({'get':"operation_pickuptimes"})
reservation_create_token_date = views.ReservationCreateTokenViewSet.as_view({'get':"date_for_reservation"})
reservation_token_opera = views.ReservationCreateTokenViewSet.as_view({'get':"operation_opera_importation"})

urlpatterns = [
    path('',include(router.urls)),
    path('contacts/',                                               contacts_list,                                  name='rest_contacts_list'),
    path('contacts/<int:pk>/',                                      contact_detail,                                 name='rest_contact_detail'),
    path('reservations_table/',                                     reservations_table_list,                        name='rest_reservations_table_list'),
    path('reservations/',                                           reservations_list,                              name='rest_reservations_list'),
    path('reservations/<int:pk>/',                                  reservation_detail,                             name='rest_reservation_detail'),
    path('cancel_reservation/<int:pk>/',                            cancel_reservation,                             name='rest_cancel_reservation'),
    path('reactivate_reservation/<int:pk>/',                        reactivate_reservation,                         name='rest_reactivate_reservation'),
    path('reservation_logs/',                                       reservation_logs_list,                          name='rest_reservation_logs_list'),
    path('reservation_logs/<int:pk>/',                              reservation_log_detail,                         name='rest_reservation_log_detail'),
    path('reservation_create_tokens/',                              reservation_create_tokens_list,                 name='rest_reservation_create_tokens_list'),
    path('reservation_create_tokens/<int:pk>/',                     reservation_create_token_detail,                name='rest_reservation_create_token_detail'),
    path('reservation_token/',                                      reservation_token_list,                         name='rest_reservation_token_list'),
    path('reservation_token/<uuid:uid>/',                           reservation_token_detail,                       name='rest_reservation_token_detail'),
    path('reservation_token/date/',                                 reservation_create_token_date,                  name='rest_reservation_create_token_date'),
    path('reservation_token/opera/',                                reservation_token_opera,                        name='rest_reservation_token_opera'),
    path('reservation_token/service_list/',                         service_list,                                   name='rest_service_list'),
    path('reservation_token/hotel_list/',                           hotel_list,                                     name='rest_hotel_list'),
    path('reservation_token/operation_type_list/',                  operation_type_list,                            name='rest_operation_type_list'),
    path('reservation_token/operation_flights/',                    operation_flights,                              name='rest_operation_flights'),
    path('reservation_token/operation_pickuptimes/',                operation_pickuptimes,                          name='rest_operation_pickuptimes'),
    path('reservation/date/',                                       reservation_date,                               name='rest_reservation_date'),
    path('operations_list/',                                        operations_list,                                name='rest_operations_list'),
    path('operations_list_date/',                                   operations_list_date,                           name='rest_operations_list_date'),
    path('operations_unit_last_asigment/',                          operations_unit_last_asigment,                  name='rest_operations_unit_last_asigment'),
    path('operations_unit_set_last_asigment/',                      operations_unit_set_last_asigment,              name='rest_operations_unit_set_last_asigment'),
    path('operations_unset_unit_asignment/',                        operations_unset_unit_asignment,                name='rest_operations_unset_unit_asignment'),
    path('operations_unset_unit/',                                  operations_unset_unit,                          name='rest_operations_unset_unit'),
    path('reservation_confirmation_report_download/<int:pk>/',      reservation_confirmation_report_download,       name='rest_reservation_confirmation_report_download'),
    path('reservation_confirmation_report_send_email/<int:pk>/',    reservation_confirmation_report_send_email,     name='rest_reservation_confirmation_report_send_email'),
    path('operation_report/',                                       operation_report,                               name='rest_operation_report'),
    path('operation_report_list/',                                  operation_report_list,                          name='rest_operation_report_list'),
    path('operation_report_coupons/',                               operation_report_coupons,                       name='rest_operation_report_coupons'),
    path('operation_report_summary/',                               operation_report_summary,                       name='rest_operation_report_summary'),
    path('operation_report_list_filters/',                          operation_report_list_filters,                  name='rest_operation_report_list_filters'),
    path('operation_report_list_filters_by_year/',                  operation_report_list_filters_by_year,          name='rest_operation_report_list_filters_by_year'),
    path('operation_report_send_email/',                            operation_report_send_email,                    name='rest_operation_report_send_email'),
    path('operation_hotels/',                                       operation_hotels,                               name='rest_operation_hotels'),
    path('operation_units/',                                        operation_units,                                name='rest_operation_units'),
    path('operation_providers/',                                    operation_providers,                            name='rest_operation_providers'),
    path('operation_opera_importation/',                            operation_opera_importation,                    name='rest_operation_opera_importation'),
    path('flights/',                                                flights_list,                                   name='rest_flights_list'),
    path('operation_flights/',                                      operation_flights_list,                         name='rest_operation_flights_list'),
    path('flights/<int:pk>/',                                       flight_detail,                                  name='rest_flight_detail'),
    path('pick_ups/',                                               pick_ups_list,                                  name='rest_pick_ups_list'),
    path('operation_pickuptimes/',                                  operation_pickuptimes_list,                     name='rest_operation_pickuptimes_list'),
    path('pick_ups/<int:pk>/',                                      pick_up_detail,                                 name='rest_pick_up_detail'),
    path('invoice_reservation_transfer/',                           invoice_reservation_transfer,                   name='rest_invoice_reservation_transfer'),
    path('invoice_reservation_report/',                             invoice_reservation_report,                     name='rest_invoice_reservation_report'),
    path('patch_provider/',                                         patch_provider,                                 name='rest_patch_provider'),
    path('patch_cxp/',                                              patch_cxp,                                      name='rest_patch_cxp'),
]