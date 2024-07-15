from datetime import date, timedelta, datetime
from django.db import models
from GeneralApp.querysets import CustomQuerySet, parametrization_method
from GeneralApp.models import DEPARTURES, ARRIVALS, INTERHOTEL

class FlightQuerySet(CustomQuerySet):

    days_of_week = ['mon','tue','wed','thu','fri','sat','sun']
    transfer_types = {
        'DEPARTURES':'departure',
        'ARRIVALS':'arrival'
    }

    def operationFlightFilter(self, date, transfer_type):
        date_of_week = self.days_of_week[datetime.strptime(date, '%Y-%m-%d').weekday()]
        FLIGHT_CHOICES = {}
        FLIGHT_CHOICES['DEPARTURES'] = ['departure','both']
        FLIGHT_CHOICES['ARRIVALS'] = ['arrival','both']
        return self.dateSimple(date).filter(self.timeAvailableFilterParametrization(date_of_week,transfer_type),flight_type__in=FLIGHT_CHOICES[transfer_type])

    @parametrization_method
    def timeAvailableFilterParametrization(self,date_of_week,transfer_type):
        field = date_of_week + '_' + self.transfer_types[transfer_type] + '__isnull'
        return {
            ''+field:False
        }
    
class PickUpTimeQuerySet(CustomQuerySet):

    def operationPickUpFilter(self, flight_time, hotel):
        return self.filter(flight_time__lte=flight_time,pick_up__hotel__id=hotel,time__isnull=False).order_by('-flight_time').first()

    def operationLastPickUp(self, hotel):
        return self.filter(pick_up__hotel__id=hotel,time__isnull=False).order_by('-flight_time').first()
    
class ReservationQuerySet(CustomQuerySet):

    def tableOptimization(self):
        from OperationsApp.models import ReservationService
        return self.prefetch_related(
			models.Prefetch(
            "reservation_services",
            ReservationService.objects.tableOptimization(),
            )
		).select_related("user_extension","contact",
            "department_cecos","sale_type")
    
    def reservationType(self):
        return self.annotate(
            arrivals_count=models.Count('reservation_services',filter=models.Q(reservation_services__transfer_type=ARRIVALS)),
            departures_count=models.Count('reservation_services',filter=models.Q(reservation_services__transfer_type=DEPARTURES)),
            reservation_type=models.Case(
                models.When(
                    models.Q(arrivals_count__gte=1,departures_count__gte=1), 
                    then=models.Value('Roundtrip')
                ),
                default=models.Value('One Way')
            ),
        )
    
    def tableAnnotation(self):
        from OperationsApp.models import ReservationService
        
        transfer_type_subquery_arrival = ReservationService.objects.transfer_typeFilterParametrization(prefix="reservation_services__",transfer_type=[ARRIVALS])
        transfer_type_subquery_departure = ReservationService.objects.transfer_typeFilterParametrization(prefix="reservation_services__",transfer_type=[DEPARTURES,INTERHOTEL])
        return self.annotate(
            arrival_date=models.Min("reservation_services__date",filter=transfer_type_subquery_arrival),
            arrival_flight=models.Subquery(ReservationService.objects.filter(ReservationService.objects.transfer_typeFilterParametrization(transfer_type=[ARRIVALS]),reservation=models.OuterRef('pk')).order_by_transfer_type_arrival().order_by('date','relevancy').values('flight_code')[:1]),
            arrival_service=models.Subquery(ReservationService.objects.filter(ReservationService.objects.transfer_typeFilterParametrization(transfer_type=[ARRIVALS]),reservation=models.OuterRef('pk')).order_by_transfer_type_arrival().order_by('date','relevancy').values('service__name')[:1]),
            arrival_hotel=models.Subquery(ReservationService.objects.filter(ReservationService.objects.transfer_typeFilterParametrization(transfer_type=[ARRIVALS]),reservation=models.OuterRef('pk')).order_by_transfer_type_arrival().order_by('date','relevancy').values('destination__name')[:1]),
            departure_date=models.Max("reservation_services__date",filter=transfer_type_subquery_departure),
            departure_flight=models.Subquery(ReservationService.objects.filter(ReservationService.objects.transfer_typeFilterParametrization(transfer_type=[DEPARTURES,INTERHOTEL]),reservation=models.OuterRef('pk')).order_by_transfer_type_departure().order_by('-date','relevancy').values('flight_code')[:1]),
            departure_service=models.Subquery(ReservationService.objects.filter(ReservationService.objects.transfer_typeFilterParametrization(transfer_type=[DEPARTURES,INTERHOTEL]),reservation=models.OuterRef('pk')).order_by_transfer_type_departure().order_by('-date','relevancy').values('service__name')[:1]),
            departure_hotel=models.Subquery(ReservationService.objects.filter(ReservationService.objects.transfer_typeFilterParametrization(transfer_type=[DEPARTURES,INTERHOTEL]),reservation=models.OuterRef('pk')).order_by_transfer_type_departure().order_by('-date','relevancy').values('origin__name')[:1]),
            hotel=models.Case(
                models.When(
                    ~models.Q(departure_hotel=None), 
                    then=models.F('departure_hotel')
                ),
                models.When(
                    ~models.Q(arrival_hotel=None), 
                    then=models.F('arrival_hotel')
                ),
                default=models.Value(None)
            ),
            pax_num=models.Func(models.Sum("reservation_services__adults"), models.Value('.'),models.Sum("reservation_services__childs"),
            function='CONCAT', 
            output_field=models.CharField())
        )
  
class ReservationServiceQuerySet(CustomQuerySet):

    def bySameProvider(self,provider):
        return self.filter(service__provider=provider)

    def operationFilter(self,date,property):
        start_date = date
        due_date = start_date + timedelta(days=1)
        return self.filter(
            date__range=[start_date, due_date],
            reservation__property=property
        ).unitAnnotate().pickupAnnotate().realOperationDateAnnotate().filter(operation_date=date)
    
    def operationFilterTransferType(self,date,transfer_type,property):
        start_date = date
        due_date = start_date + timedelta(days=1)
        return self.filter(
            date__range=[start_date, due_date],
            transfer_type=transfer_type,
            reservation__property=property
        ).unitAnnotate().pickupAnnotate().realOperationDateAnnotate().filter(operation_date=date)
    
    def operationFilterByUnit(self,unit):
        return self.filter(unit_code__istartswith=unit)
    
    def operationFilterByHotel(self,hotel):
        return self.annotate(hotel_id=models.Case(
            models.When(transfer_type=INTERHOTEL, then=models.Case(
                models.When(models.Q(origin__priority=True,destination__priority=False), then=models.F('origin__id')),
                models.When(models.Q(origin__priority=False,destination__priority=True), then=models.F('destination__id')),
                default=models.F('origin__id'),
                output_field=models.IntegerField()
            )),
            models.When(transfer_type=ARRIVALS, then=models.F('destination__id')),
            default=models.F('origin__id'),
            output_field=models.IntegerField()
        )).filter(hotel_id=hotel)
        #return self.filter(models.Q(origin__id=hotel)|models.Q(destination__id=hotel))

    def operationFilterByHotels(self,hotels):
        return self.annotate(hotel_id=models.Case(
            models.When(transfer_type=INTERHOTEL, then=models.Case(
                models.When(models.Q(origin__priority=True,destination__priority=False), then=models.F('origin__id')),
                models.When(models.Q(origin__priority=False,destination__priority=True), then=models.F('destination__id')),
                default=models.F('origin__id'),
                output_field=models.IntegerField()
            )),
            models.When(transfer_type=ARRIVALS, then=models.F('destination__id')),
            default=models.F('origin__id'),
            output_field=models.IntegerField()
        )).filter(hotel_id__in=hotels)
        #return self.filter(models.Q(origin__id__in=hotels)|models.Q(destination__id__in=hotels))
    
    def operationFilterByServices(self,services):
        return self.filter(service__id__in=services)
    
    def operationFilterBySaleTypes(self,sale_types):
        return self.filter(reservation__sale_type__id__in=sale_types)
    
    def operationFilterByOperationTypes(self,operation_types):
        return self.filter(operation_type__id__in=operation_types)

    def operationFilterDateRange(self,start_date, due_date, property):
        due_date_ = due_date + timedelta(days=1)
        return self.filter(
            date__range=[start_date, due_date_],
            reservation__property=property
        ).unitAnnotate().pickupAnnotate().realOperationDateAnnotate().filter(operation_date__range=[start_date, due_date])
    
    def operationFilterDateYear(self,year, property):
        return self.filter(
            date__year=year,
            reservation__property=property
        ).unitAnnotate().pickupAnnotate().realOperationDateAnnotate().self.filter(operation_date__year=year)
    
    def operationGroupByDay(self):
        return self.dates("operation_date", "day")
    
    def operationGroupByMonth(self):
        return self.dates("operation_date", "month")
    
    def operationGroupBySaleType(self):
        return self.order_by("reservation__sale_type__name").values(id_=models.F('reservation__sale_type__id'),name=models.F('reservation__sale_type__name')).distinct()
    
    def operationGroupByHotelOrigin(self):
        return self.order_by("origin__name").values(id_=models.F('origin__id'),name=models.F('origin__name')).distinct()
    
    def operationGroupByHotelDestination(self):
        return self.order_by("destination__name").values(id_=models.F('destination__id'),name=models.F('destination__name')).distinct()
    
    def commentsAnnotate(self):
        from OperationsApp.models import ReservationService
        return self.reservationType().annotate(
            reservation_comment=
            models.Func(
                models.F("reservation_type"), 
                models.Value(' '),
                models.Case(
                    models.When(service__is_colective=True, then=models.Value('COL')),
                    models.When(service__is_colective=False, then=models.Value('PRIV')),
                    default=models.Value('')
                ),
                function='CONCAT', 
                output_field=models.CharField()
            ),
            departure_date=models.Max("reservation__reservation_services__date",filter=models.Q(reservation__reservation_services__transfer_type=DEPARTURES)),
            reservation_coupon_comment=models.F('reservation__amount')
        )
    
    def unitAnnotate(self):
        from OperationsApp.models import Unit
        subquery_unit_id_by_service =models.Subquery(
                Unit.objects.filter(
                    code=models.OuterRef('service__code'),
                ).values('id')[:1])
        subquery_unit_name_by_service =models.Subquery(
                Unit.objects.filter(
                    code=models.OuterRef('service__code'),
                ).values('name')[:1])
        return self.annotate(
            unit_pk=models.functions.Coalesce('unit__id',subquery_unit_id_by_service,models.Value(None)),
            unit_name=models.functions.Coalesce('unit__name',subquery_unit_name_by_service,models.Value(None)),
            unit_code=models.functions.Coalesce('unit__code','service__code',models.Value(None))
        )
    
    def reservationType(self):
        return self.annotate(
            reservation_arrivals_count=models.Count('reservation__reservation_services',filter=models.Q(reservation__reservation_services__transfer_type=ARRIVALS)),
            reservation_departures_count=models.Count('reservation__reservation_services',filter=models.Q(reservation__reservation_services__transfer_type=DEPARTURES)),
            reservation_type=models.Case(
                models.When(
                    models.Q(reservation_arrivals_count__gte=1,reservation_departures_count__gte=1), 
                    then=models.Value('RT')
                ),
                default=models.Value('OW')
            ),
        )
    def order_by_operation(self):
        return self.order_by(models.F('unit_pk').asc(nulls_last=False),'number','pup')
    
    def order_by_units(self, units):
        return self.order_by(
            models.Case(
                *[models.When(unit_value=id_val, then=pos) for pos, id_val in enumerate(units)]
            ),
            'pup'
        )

    def realOperationDateAnnotate(self):
        return self.annotate(
            operation_date=models.Case(
                models.When(transfer_type=DEPARTURES,pup__gt=models.F('flight_time'), then=models.ExpressionWrapper(models.F('date') - timedelta(days=1), output_field=models.DateField())),
                default=models.F('date')
            )
        )

    def pickupAnnotate(self):
        return self.annotate(
            pup=models.functions.Coalesce('real_pick_up_time', 'pick_up_time__time'),
            flight_time=models.Case(
                models.When(~models.Q(real_flight_time__isnull=True), then=models.F('real_flight_time')),
                models.When(flight_field='mon_arrival', then=models.F('flight__mon_arrival')),
                models.When(flight_field='tue_arrival', then=models.F('flight__tue_arrival')),
                models.When(flight_field='wed_arrival', then=models.F('flight__wed_arrival')),
                models.When(flight_field='thu_arrival', then=models.F('flight__thu_arrival')),
                models.When(flight_field='fri_arrival', then=models.F('flight__fri_arrival')),
                models.When(flight_field='sat_arrival', then=models.F('flight__sat_arrival')),
                models.When(flight_field='sun_arrival', then=models.F('flight__sun_arrival')),
                models.When(flight_field='mon_departure', then=models.F('flight__mon_departure')),
                models.When(flight_field='tue_departure', then=models.F('flight__tue_departure')),
                models.When(flight_field='wed_departure', then=models.F('flight__wed_departure')),
                models.When(flight_field='thu_departure', then=models.F('flight__thu_departure')),
                models.When(flight_field='fri_departure', then=models.F('flight__fri_departure')),
                models.When(flight_field='sat_departure', then=models.F('flight__sat_departure')),
                models.When(flight_field='sun_departure', then=models.F('flight__sun_departure')),
                default=models.Value(None),
                output_field=models.fields.TimeField()
            ),
            unit_value=models.Case(
                models.When(unit_pk=None, then=None),
                models.When(unit_pk__isnull=False, then=models.functions.Concat(models.F('unit_pk'),models.Value('-'),models.F('number'),output_field=models.CharField())),
                default=models.Value(None),
                output_field=models.fields.CharField()
            ),
            operation_time=models.Case(
                models.When(transfer_type=ARRIVALS, then=models.F("flight_time")),
                default=models.F("pup"),
                output_field=models.fields.TimeField()
            )
        )
    
    def paxConcatAnnotate(self):
        return self.annotate(
            pax_total=models.Sum(
                models.F("adults") + models.F("childs"),
                output_field=models.IntegerField()
            ),
        )
    
    def paxAggregate(self):
        return self.aggregate(
            pax_total=models.Sum(
                models.F("adults") + models.F("childs"),
                output_field=models.IntegerField()
            ),
        )
    
    def paxTotal(self):
        return self.aggregate(
            adults_total=models.Sum('adults'),
            childs_total=models.Sum('childs')
        )
    
    def lastUnidAsigment(self,unit):
        return self.filter(unit=unit).aggregate(models.Max('number'))

    def tableOptimization(self):
        from SalesApp.models import Sale
        return self.prefetch_related(
			models.Prefetch(
            "sales",
            Sale.objects.tableOptimization(),
            )
		).select_related("reservation","service","origin","operation_type","flight","pick_up_time","unit")
    
    @parametrization_method
    def transfer_typeFilterParametrization(self,transfer_type):
        return {
            'transfer_type__in':transfer_type,
        }
    
    @parametrization_method
    def operationFilterParametrization(self,date):
        return {
            'date':date,
        }
    
    def order_by_transfer_type(self):
        return self.annotate(
            relevancy=models.Case(
                models.When(transfer_type=ARRIVALS, then=1),
                models.When(transfer_type=INTERHOTEL, then=2),
                models.When(transfer_type=DEPARTURES, then=3),
                output_field=models.IntegerField()
            )
        )
    
    def order_by_transfer_type_arrival(self):
        return self.annotate(
            relevancy=models.Case(
                models.When(transfer_type=ARRIVALS, then=1),
                models.When(transfer_type=INTERHOTEL, then=2),
                output_field=models.IntegerField()
            )
        )
    
    def order_by_transfer_type_departure(self):
        return self.annotate(
            relevancy=models.Case(
                models.When(transfer_type=DEPARTURES, then=1),
                models.When(transfer_type=INTERHOTEL, then=2),
                output_field=models.IntegerField()
            )
        ).order_by('-relevancy')
    
    def order_by_time(self):
        return self.order_by('operation_time')
    
    def order_by_operation_time(self):
        return self.order_by('transfer_type','operation_time', models.F('unit').asc(nulls_last=False),'number')
    
    def order_by_unit_operation_time(self):
        return self.order_by('transfer_type','operation_time', 'unit_value')
    
class ReservationLogQuerySet(CustomQuerySet):

    def propertyAnnotate(self,user_extension):
        from OperationsApp.models import Reservation
        return self.annotate(
            property=models.Subquery(
                Reservation.objects.filter(
                    id=models.OuterRef('reservation_id'),
                ).values('property')[:1]),
        ).bySameProperty(user_extension)
    
class ReservationCreateTokenQueryset(models.QuerySet):
	def activeTokenByUid(self,uid):
		date_from = datetime.now() - timedelta(days=1)
		return self.get(uuid=uid,timestamp__gte=date_from)