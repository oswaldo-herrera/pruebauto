from datetime import date, datetime, timedelta
from django.db import models

def parametrization_method(method,prefix_key="prefix"):
	"""
	Extends a method to return a django Q() with optionally prefixed fields

	Original method must return a dictionary.
	@prefix_key overrides decorated method prefix parameter lookup.
	"""
	def decorated_method(self,*args,**kwargs):
		prefix	= kwargs.pop(prefix_key,"")
		if prefix and not isinstance(prefix,str):
			raise TypeError(f"Expecting '{prefix_key}' to be string.")

		parametrization	= method(self,*args,**kwargs)
		assert isinstance(parametrization,dict),"Expecting base parametrization method to return dict"

		if prefix:
			parametrization	= {
				f"{prefix}{key}":value
				for key,value
				in parametrization.items()
			}

		return models.Q(**parametrization)
	return decorated_method

class CustomQuerySet(models.QuerySet):
	def bySameProperties(self,user_extension):
		if user_extension.user.is_superuser is True:
			return self.filter(self.bySamePropertiesFilterParametrization(user_extension)|self.adminNoPropertiesFilterParametrization())
		return self.filter(self.bySamePropertiesFilterParametrization(user_extension))

	def bySameProperty(self,user_extension):
		if user_extension.user.is_superuser is True:
			return self.filter(self.bySamePropertyFilterParametrization(user_extension)|self.adminNoPropertyFilterParametrization())
		return self.filter(self.bySamePropertyFilterParametrization(user_extension))
	
	@parametrization_method
	def bySamePropertyFilterParametrization(self,user_extension):
		return {
			'property__in':user_extension.properties.all()
		}
	
	@parametrization_method
	def adminNoPropertyFilterParametrization(self):
		return {
			'property__isnull':True
		}

	@parametrization_method
	def bySamePropertiesFilterParametrization(self,user_extension):
		return {
			'properties__in':user_extension.properties.all()
		}
	
	@parametrization_method
	def adminNoPropertiesFilterParametrization(self):
		return {
			'properties__isnull':True
		}
	
	def dateSimple(self,date):
		return self.filter(self.dateSimpleFilterParametrization(date))
	
	@parametrization_method
	def dateSimpleFilterParametrization(self,date):
		return {
			'start_date__lte':date,
			'due_date__gte':date,
		}
	
	def dateRange(self,start_date,due_date):
		return self.filter(self.dateRangeFilterParametrization(start_date,due_date))
	
	@parametrization_method
	def dateRangeFilterParametrization(self,start_date,due_date):
		return {
			'date__lte':due_date,
			'date__gte':start_date,
		}
	
	@parametrization_method
	def dateSaleRangeFilterParametrization(self,start_date,due_date):
		return {
			'sale_date__lte':due_date,
			'sale_date__gte':start_date,
		}
	
	@parametrization_method
	def dateYearFilterParametrization(self,year):
		return {
			'date__year':year,
		}
	
	def dateRangeInRange(self,start_date,due_date):
		return self.filter(
			self.dateRangeStartInPeriodFilterParametrization(start_date,due_date)|
			self.dateRangeEndInPeriodFilterParametrization(start_date,due_date)|
			self.dateRangeDuringPeriodFilterParametrization(start_date,due_date)
		)
	
	@parametrization_method
	def dateRangeStartInPeriodFilterParametrization(self,start_date,due_date):
		#start_in_period	= Q(start_date__gte=self.start_date, start_date__lte=self.due_date)
		return {
			'start_date__gte':start_date,
			'start_date__lte':due_date,
		}
	
	@parametrization_method
	def dateRangeEndInPeriodFilterParametrization(self,start_date,due_date):
		#end_in_period	= Q(due_date__lte=self.due_date, due_date__gte=self.start_date)
		return {
			'due_date__lte':due_date,
			'due_date__gte':start_date,
		}
	
	@parametrization_method
	def dateRangeDuringPeriodFilterParametrization(self,start_date,due_date):
		#during_peroid	= Q(start_date__lte=self.start_date, due_date__gte=self.due_date)
		return {
			'start_date__lte':start_date,
			'due_date__gte':due_date,
		}
	
	def operation_range(self,start_date,due_date,type,property):
		if type == "ALL":
			return self.filter(
				self.dateRangeFilterParametrization(prefix="reservation_services__",start_date=start_date,due_date=due_date),
				reservation_services__reservation__property=property,
			)
		else:
			return self.filter(
				self.dateRangeFilterParametrization(prefix="reservation_services__",start_date=start_date,due_date=due_date),
				reservation_services__reservation__property=property,
				reservation_services__transfer_type=type
			)
	
	def operation_year(self,year,type,property):
		return self.filter(
			self.dateYearFilterParametrization(prefix="reservation_services__",year=year),
			reservation_services__reservation__property=property,
			reservation_services__transfer_type=type
		)
	
	def sale_range(self,start_date,due_date,property):
		return self.filter(
			self.dateSaleRangeFilterParametrization(prefix="sales__",start_date=start_date,due_date=due_date),
			sales__property=property,
			sales__status__in=['A','R','C']
		)
	
class ExchangeRateQuerySet(CustomQuerySet):

	def ProviderNoProperty(self,user_extension):
		return self.filter(self.bySamePropertyFilterParametrization(user_extension)|self.adminNoPropertyFilterParametrization()|self.ProviderNoPropertyFilterParametrization())

	@parametrization_method
	def ProviderNoPropertyFilterParametrization(self):
		return {
			'property__isnull':models.OuterRef("provider__isnull")
		}
	
class ServiceQuerySet(CustomQuerySet):

	def dateSimple(self,date):
		return self.filter(self.dateSimpleFilterParametrization(prefix="service_rates__",date=date))

	def tableOptimization(self):
		from SalesApp.models import ServiceRate
		return self.prefetch_related("service_rates","properties").select_related("provider","activity","availability_group","business_group","unit","service_fee")

	def tableOptimizationServiceFee(self):
		from SalesApp.models import ServiceRate
		return self.select_related("service_fee__provider","service_fee__activity","service_fee__availability_group","service_fee__business_group","service_fee__unit")
	
class UnitQuerySet(CustomQuerySet):
	def operation_pup(self,date):
		from OperationsApp.models import ReservationService
		operation_subquery = ReservationService.objects.operationFilter().operationFilterParametrization(prefix="reservation_services__",date=date)
		return self.filter(operation_subquery).annotate(
            pup=models.Min("pup",filter=operation_subquery)
        )
	
class HotelQuerySet(CustomQuerySet):
	def operation_range_hotel_origin(self,start_date,due_date,type,property):
		return self.filter(
			self.dateRangeFilterParametrization(prefix="reservation_services_origin__",start_date=start_date,due_date=due_date),
			reservation_services_origin__reservation__property=property,
			reservation_services_origin__transfer_type=type
		)
	
	def operation_year_hotel_origin(self,year,type,property):
		return self.filter(
			self.dateYearFilterParametrization(prefix="reservation_services_origin__",year=year),
			reservation_services_origin__reservation__property=property,
			reservation_services_origin__transfer_type=type
		)
	
	def operation_range_hotel_destination(self,start_date,due_date,type,property):
		return self.filter(
			self.dateRangeFilterParametrization(prefix="reservation_services_destination__",start_date=start_date,due_date=due_date),
			reservation_services_destination__reservation__property=property,
			reservation_services_destination__transfer_type=type
		)
	
	def operation_year_hotel_destination(self,year,type,property):
		return self.filter(
			self.dateYearFilterParametrization(prefix="reservation_services_destination__",year=year),
			reservation_services_destination__reservation__property=property,
			reservation_services_destination__transfer_type=type
		)
	
	def operation_range_hotel(self,start_date,due_date,property):
		return self.filter(models.Q(self.dateRangeFilterParametrization(prefix="reservation_services_origin__",start_date=start_date,due_date=due_date),
			reservation_services_origin__reservation__property=property)
			|models.Q(self.dateRangeFilterParametrization(prefix="reservation_services_destination__",start_date=start_date,due_date=due_date),
			reservation_services_destination__reservation__property=property)
		)
	
class SaleTypeQuerySet(CustomQuerySet):
	def operation_range(self,start_date,due_date,type,property):
		if type == "ALL":
			return self.filter(
				self.dateRangeFilterParametrization(prefix="reservations__reservation_services__",start_date=start_date,due_date=due_date),
				reservations__property=property
			)
		else:
			return self.filter(
				self.dateRangeFilterParametrization(prefix="reservations__reservation_services__",start_date=start_date,due_date=due_date),
				reservations__property=property,
				reservations__reservation_services__transfer_type=type
			)
	
	def operation_year(self,year,type,property):
		return self.filter(
			self.dateYearFilterParametrization(prefix="reservations__reservation_services__",year=year),
			reservations__property=property,
			reservations__reservation_services__transfer_type=type
		)
	
class UserExtensionQueryset(models.QuerySet):
    def bySameProperties(self,properties):
        return self.filter(properties__in=properties)
	
class UserExtensionPasswordResetQueryset(models.QuerySet):

	def activeTokenByUid(self,uid):
		date_from = datetime.now() - timedelta(days=1)
		return self.get(uuid=uid,used=False,timestamp__gte=date_from)
	
	def activeTokenByExpansion(self,user_extension):
		date_from = datetime.now() - timedelta(days=1)
		return self.filter(used=False,timestamp__gte=date_from,user_extension=user_extension).first()
    
class GroupQuerySet(CustomQuerySet):
    def filterBySchedule(self,schedule):
        return self.filter(
            models.Q(availability_groups__availabilities__schedule_1=schedule)|
            models.Q(availability_groups__availabilities__schedule_2=schedule)|
            models.Q(availability_groups__availabilities__schedule_3=schedule)|
            models.Q(availability_groups__availabilities__schedule_4=schedule)|
            models.Q(availability_groups__availabilities__schedule_5=schedule)|
            models.Q(availability_groups__availabilities__schedule_6=schedule)|
            models.Q(availability_groups__availabilities__schedule_7=schedule)
        )
    
class AvailabilityGroupQuerySet(CustomQuerySet):
    def filterBySchedule(self,schedule):
        return self.filter(
            models.Q(availabilities__schedule_1=schedule)|
            models.Q(availabilities__schedule_2=schedule)|
            models.Q(availabilities__schedule_3=schedule)|
            models.Q(availabilities__schedule_4=schedule)|
            models.Q(availabilities__schedule_5=schedule)|
            models.Q(availabilities__schedule_6=schedule)|
            models.Q(availabilities__schedule_7=schedule)
        )
	
class ProviderQuerySet(CustomQuerySet):
	def AnnotateLastExchange(self):
		from GeneralApp.models import ExchangeRate
		exchangeRatesUSDSQ = ExchangeRate.objects.filter(
			provider=models.OuterRef('pk')
		).order_by('-start_date').values('usd_currency')[:1]
		exchangeRatesEUROSQ = ExchangeRate.objects.filter(
			provider=models.OuterRef('pk')
		).order_by('-start_date').values('euro_currency')[:1]
		return self.annotate(
    		usd_currency=models.Subquery(exchangeRatesUSDSQ),
			euro_currency=models.Subquery(exchangeRatesEUROSQ)
		)
	
	def filterLastExchange(self,search):
		print(search)
		return self.filter(
    		models.Q(usd_currency=search)|
			models.Q(euro_currency=search)
		)

		