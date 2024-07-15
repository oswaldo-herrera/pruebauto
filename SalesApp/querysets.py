from datetime import date
from django.db import models
from GeneralApp.querysets import CustomQuerySet, parametrization_method
from GeneralApp.models import DEPARTURES, ARRIVALS, INTERHOTEL, ExchangeRate
from datetime import datetime, time, timedelta

class ScheduleQuerySet(CustomQuerySet):

    def filterByDate(self,date,property):
        week_num = date.weekday()
        return self.filter(
            models.Q(availabilities_schedule_1__start_date__lte=date,availabilities_schedule_1__due_date__gte=date)|
            models.Q(availabilities_schedule_2__start_date__lte=date,availabilities_schedule_2__due_date__gte=date)|
            models.Q(availabilities_schedule_3__start_date__lte=date,availabilities_schedule_3__due_date__gte=date)|
            models.Q(availabilities_schedule_4__start_date__lte=date,availabilities_schedule_4__due_date__gte=date)|
            models.Q(availabilities_schedule_5__start_date__lte=date,availabilities_schedule_5__due_date__gte=date)|
            models.Q(availabilities_schedule_6__start_date__lte=date,availabilities_schedule_6__due_date__gte=date)|
            models.Q(availabilities_schedule_7__start_date__lte=date,availabilities_schedule_7__due_date__gte=date)
        ).filterByWeekday(week_num).filterByProperty(property)
    
    def filterByProperty(self,property):
        return self.filter(
            models.Q(availabilities_schedule_1__availability_group__properties=property)|
            models.Q(availabilities_schedule_2__availability_group__properties=property)|
            models.Q(availabilities_schedule_3__availability_group__properties=property)|
            models.Q(availabilities_schedule_4__availability_group__properties=property)|
            models.Q(availabilities_schedule_5__availability_group__properties=property)|
            models.Q(availabilities_schedule_6__availability_group__properties=property)|
            models.Q(availabilities_schedule_7__availability_group__properties=property)
        )
    
    def filterByWeekday(self,week_num):
        if week_num == 0:
            return self.filter(MON=True)
        if week_num == 1:
            return self.filter(TUE=True)
        if week_num == 2:
            return self.filter(WED=True)
        if week_num == 3:
            return self.filter(THU=True)
        if week_num == 4:
            return self.filter(FRI=True)
        if week_num == 5:
            return self.filter(SAT=True)
        if week_num == 6:
            return self.filter(SUN=True)

    def filterByService(self,service):
        return self.filter(
            models.Q(availabilities_schedule_1__availability_group__services=service)|
            models.Q(availabilities_schedule_2__availability_group__services=service)|
            models.Q(availabilities_schedule_3__availability_group__services=service)|
            models.Q(availabilities_schedule_4__availability_group__services=service)|
            models.Q(availabilities_schedule_5__availability_group__services=service)|
            models.Q(availabilities_schedule_6__availability_group__services=service)|
            models.Q(availabilities_schedule_7__availability_group__services=service)
        )
    
    def filterByAvailabilityGroup(self,availability_group):
        return self.filter(
            models.Q(availabilities_schedule_1__availability_group=availability_group)|
            models.Q(availabilities_schedule_2__availability_group=availability_group)|
            models.Q(availabilities_schedule_3__availability_group=availability_group)|
            models.Q(availabilities_schedule_4__availability_group=availability_group)|
            models.Q(availabilities_schedule_5__availability_group=availability_group)|
            models.Q(availabilities_schedule_6__availability_group=availability_group)|
            models.Q(availabilities_schedule_7__availability_group=availability_group)
        )
    
    def filterByGroup(self,group):
        return self.filter(
            models.Q(availabilities_schedule_1__availability_group__group=group)|
            models.Q(availabilities_schedule_2__availability_group__group=group)|
            models.Q(availabilities_schedule_3__availability_group__group=group)|
            models.Q(availabilities_schedule_4__availability_group__group=group)|
            models.Q(availabilities_schedule_5__availability_group__group=group)|
            models.Q(availabilities_schedule_6__availability_group__group=group)|
            models.Q(availabilities_schedule_7__availability_group__group=group)
        )
    
class ScheduleAllotmentQuerySet(CustomQuerySet):

    def allotmentFilter(self,date,property):
        return self.filter(
            date=date,
            reservation__property=property
        )
    
    def filterByService(self,service):
        return self.filter(
            models.Q(schedule__availabilities_schedule_1__availability_group__services=service)|
            models.Q(schedule__availabilities_schedule_2__availability_group__services=service)|
            models.Q(schedule__availabilities_schedule_3__availability_group__services=service)|
            models.Q(schedule__availabilities_schedule_4__availability_group__services=service)|
            models.Q(schedule__availabilities_schedule_5__availability_group__services=service)|
            models.Q(schedule__availabilities_schedule_6__availability_group__services=service)|
            models.Q(schedule__availabilities_schedule_7__availability_group__services=service)
        )
    
    def filterByAvailabilityGroup(self,name):
        return self.filter(
            models.Q(schedule__availabilities_schedule_1__availability_group__name=name)|
            models.Q(schedule__availabilities_schedule_2__availability_group__name=name)|
            models.Q(schedule__availabilities_schedule_3__availability_group__name=name)|
            models.Q(schedule__availabilities_schedule_4__availability_group__name=name)|
            models.Q(schedule__availabilities_schedule_5__availability_group__name=name)|
            models.Q(schedule__availabilities_schedule_6__availability_group__name=name)|
            models.Q(schedule__availabilities_schedule_7__availability_group__name=name)
        )
    
    def filterByGroup(self,name):
        return self.filter(
            models.Q(schedule__availabilities_schedule_1__availability_group__group__name=name)|
            models.Q(schedule__availabilities_schedule_2__availability_group__group__name=name)|
            models.Q(schedule__availabilities_schedule_3__availability_group__group__name=name)|
            models.Q(schedule__availabilities_schedule_4__availability_group__group__name=name)|
            models.Q(schedule__availabilities_schedule_5__availability_group__group__name=name)|
            models.Q(schedule__availabilities_schedule_6__availability_group__group__name=name)|
            models.Q(schedule__availabilities_schedule_7__availability_group__group__name=name)
        )

class SaleQuerySet(CustomQuerySet):

    def tableOptimization(self):
        from SalesApp.models import SalePayment, ServiceRateComission
        return self.prefetch_related(
			models.Prefetch(
                "sale_payments",
                SalePayment.objects.tableOptimization(),
            ),
            models.Prefetch(
                "service_rate__service_rate_comissions",
                ServiceRateComission.objects.tableOptimization(),
            )
		).select_related("user_extension","sale_type","service","service_rate","hotel","representative").ratesAnnotate()
    
    def searchSaleByID(self, sale_key, id = None):
        query = self.filter(sale_key=sale_key)
        if id is not None:
            query = query.exclude(id=id)
        return query
    
    def searchSaleByIDRefund(self, sale_key, id = None):
        query = self.filter(sale_key=sale_key).exclude(status='A')
        if id is not None:
            query = query.exclude(id=id)
        return query
    
    def saleFilterByHotels(self,hotels):
        return self.filter(hotel__id__in=hotels)
    
    def saleFilterByServices(self,services):
        return self.filter(service__id__in=services)
    
    def saleFilterBySaleTypes(self,sale_types):
        return self.filter(sale_type__id__in=sale_types)
    
    def saleFilterByProviders(self,providers):
        return self.filter(service__provider__id__in=providers)
    
    def saleFilterByRepresentatives(self,representatives):
        return self.filter(representative__id__in=representatives)

    def saleFilterSaleDateRange(self,start_date, due_date, property):
        return self.filter(
            sale_date__range=(
                datetime.combine(start_date, time.min),
                datetime.combine(due_date, time.max),
            ),
            property=property,
        ).exclude(status="B")
    
    def saleFilterServiceDateRange(self,start_date, due_date, property):
        return self.filter(
            service_date__range=(
                datetime.combine(start_date, time.min),
                datetime.combine(due_date, time.max),
            ),
            property=property,
        ).exclude(status="B")
    
    def saleFilterServiceDate(self, date, property):
        return self.filter(
            service_date=date,
            property=property,
        ).saleRefundMark().filter(has_refund=False).exclude(status="C")
    
    def saleRefundMark(self):
        from SalesApp.models import Sale
        return self.annotate(
            has_refund=models.Exists(Sale.objects.filter(sale_key=models.OuterRef('sale_key'),status='R'))
        )
    
    def saleFilterBySapCode(self,sap_codes):
        return self.filter(service__provider__sap_code__in=sap_codes)
    
    def saleExcludeBySapCode(self,sap_codes):
        return self.exclude(service__provider__sap_code__in=sap_codes)
    
    def saleGroupByDay(self):
        return self.dates("sale_date", "day")
    
    def serviceGroupByDay(self):
        return self.dates("service_date", "day")
    
    def paxTotal(self):
        return self.aggregate(
            adults_total=models.functions.Coalesce(
                models.Sum('adults',filter=models.Q(status="A")|models.Q(status="B")),0,output_field=models.FloatField()) 
                - models.functions.Coalesce(models.Sum('adults',filter=models.Q(status="R")),0,output_field=models.FloatField()),
            childs_total=models.functions.Coalesce(
                models.Sum('childs',filter=models.Q(status="A")|models.Q(status="B")),0,output_field=models.FloatField()) 
                - models.functions.Coalesce(models.Sum('childs',filter=models.Q(status="R")),0,output_field=models.FloatField()),
        )
    
    def paxAggregate(self):
        return self.aggregate(
            pax_total=models.Sum(
                models.F("adults") + models.F("childs"),
                output_field=models.IntegerField()
            ),
        )
    
    def ratesAnnotate(self):
        from SalesApp.models import CoordinatorsComission, Sale, ServiceRate
        subquery_exchange = ExchangeRate.objects.filter(
                start_date__lte=models.OuterRef('sale_date__date'),
                type='SALE',
                property=models.OuterRef('property')
            ).order_by("-start_date")
        subquery_coordinators_comission = models.Subquery(
            CoordinatorsComission.objects.filter(
                date__lte=models.OuterRef('sale_date__date'),
                property=models.OuterRef('property')
            ).order_by("-date").values('comission')[:1]
        )
        return self.annotate(
            usd_currency=models.Subquery(subquery_exchange.values('usd_currency')[:1]),
            euro_currency=models.Subquery(subquery_exchange.values('euro_currency')[:1]),
            coordinators_comission=subquery_coordinators_comission,
            query_service_rate_id=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_currency=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_adult_price=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_child_price=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_exent_import_adult=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_exent_import_child=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_tax=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_hard_rock_comission_adult=models.Value(None, output_field=models.IntegerField()),
            query_service_rate_hard_rock_comission_child=models.Value(None, output_field=models.IntegerField()),
        )


    def ratesAnnotateByServiceDate(self):
        from SalesApp.models import ServiceRate
        subquery_service_rate = ServiceRate.objects.filter(
                start_date__lte=models.OuterRef('service_date'),
                due_date__gte=models.OuterRef('service_date'),
                service=models.OuterRef('service')
            ).order_by("start_date")
        return self.annotate(
            query_service_rate_id=models.functions.Coalesce(subquery_service_rate.values('id')[:1], models.F('service_rate__id')),
            query_service_rate_currency=models.functions.Coalesce(subquery_service_rate.values('currency')[:1], models.F('service_rate__currency')),
            query_service_rate_adult_price=models.functions.Coalesce(subquery_service_rate.values('adult_price')[:1], models.F('service_rate__adult_price')),
            query_service_rate_child_price=models.functions.Coalesce(subquery_service_rate.values('child_price')[:1], models.F('service_rate__child_price')),
            query_service_rate_exent_import_adult=models.functions.Coalesce(subquery_service_rate.values('exent_import_adult')[:1], models.F('service_rate__exent_import_adult')),
            query_service_rate_exent_import_child=models.functions.Coalesce(subquery_service_rate.values('exent_import_child')[:1], models.F('service_rate__exent_import_child')),
            query_service_rate_tax=models.functions.Coalesce(subquery_service_rate.values('tax')[:1], models.F('service_rate__tax')),
            query_service_rate_hard_rock_comission_adult=models.functions.Coalesce(subquery_service_rate.values('hard_rock_comission_adult')[:1], models.F('service_rate__hard_rock_comission_adult')),
            query_service_rate_hard_rock_comission_child=models.functions.Coalesce(subquery_service_rate.values('hard_rock_comission_child')[:1], models.F('service_rate__hard_rock_comission_child')),
        )


    
class SalePaymentQuerySet(CustomQuerySet):

    def tableOptimization(self):
        return self.select_related("sale","department_cecos","payment_method","payment_method__payment_type")
    
    def amountAggregateByPaymentMethod(self,payment_method_id):
        return self.aggregate(
            amount_total=models.functions.Coalesce(
                models.Sum('amount',filter=models.Q(payment_method__id=payment_method_id)),0,output_field=models.FloatField()) 
        )

    
class ServiceRateComissionQuerySet(CustomQuerySet):

    def tableOptimization(self):
        return self.select_related("service_rate","payment_type")
    
class StoreCardQuerySet(CustomQuerySet):
    def balanceTotal(self):
        from SalesApp.models import StoreCardCharge 
        deposited_subquery_q = StoreCardCharge.objects.depositedFilterParametrization(prefix="store_card_charges__")
        used_subquery_q = StoreCardCharge.objects.usedFilterParametrization(prefix="store_card_charges__")
        return self.prefetch_related(models.Prefetch("store_card_charges")).annotate(
            last_charge_date=models.Max("store_card_charges__timestamp"),
            last_used_date=models.Max("store_card_charges__timestamp",filter=used_subquery_q),
            deposited_amount=models.functions.Coalesce(models.Sum("store_card_charges__amount",filter=deposited_subquery_q),0.0),
            used_amount=models.functions.Coalesce(models.Sum("store_card_charges__amount",filter=used_subquery_q),0.0),
            count=models.Count("store_card_charges__pk"),
            total=models.functions.Coalesce(models.Sum("store_card_charges__amount"),0.0),
        )
    
class StoreCardChargeQuerySet(CustomQuerySet):

    @parametrization_method
    def depositedFilterParametrization(self):
        return {
            'amount__gt':0,
        }
    @parametrization_method
    def usedFilterParametrization(self):
        return {
            'amount__lt':0,
        }
    
class SaleLogQuerySet(CustomQuerySet):

    def propertyAnnotate(self,user_extension):
        from SalesApp.models import Sale
        return self.annotate(
            property=models.Subquery(
                Sale.objects.filter(
                    sale_key=models.OuterRef('sale_key'),
                ).order_by("-sale_date").values('property')[:1]),
        ).bySameProperty(user_extension)

    
class PendingPaymentTokenSaleQueryset(models.QuerySet):

	def activeTokenByUid(self,uid):
		date_from = datetime.now() - timedelta(days=1)
		return self.get(uuid=uid,used=False,timestamp__gte=date_from)
	
	def activeTokenByExpansion(self,user_extension):
		date_from = datetime.now() - timedelta(days=1)
		return self.filter(used=False,timestamp__gte=date_from,user_extension=user_extension).first()

