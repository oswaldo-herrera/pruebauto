import os
from datetime import datetime, time as date_time
import random
import time

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.models.signals import post_save
from django.db.models import Sum
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.utils.crypto import get_random_string

from OperationsApp import models
from GeneralApp import models as Generalmodels
from GeneralApp.controllers import ProgressDisplayer

progress_bar = ''
CODE_LENGTH = 10
def generate_id_length():
	return get_random_string(CODE_LENGTH)
def generate_date_arrival():
    year = 2023
    month = 5
    day = random.randint(1, 14)
    date = datetime(year, month, day)
    return date
def generate_date_departure():
    year = 2023
    month = 5
    day = random.randint(14, 28)
    date = datetime(year, month, day)
    return date
def generate_date():
    year = 2023
    month = 5
    day = random.randint(1, 28)
    date = datetime(year, month, day)
    return date
def generate_time():
    hour = random.randint(0, 23)
    time.sleep(0.1)
    minute = random.randint(0, 59)
    time_ = date_time(hour, minute,0,0)
    return time_
class Command(BaseCommand):
	help = """Run this command to restore departments cecos"""
	
	def add_arguments(self,parser):
		parser.add_argument(
			"-n",
			help="Limit of rows per file to parse",
		)

	def execute(self, *args, **kwargs):
		call_command("delete_rows")
		#call_command("import_providers")
		#call_command("import_units")
		call_command("import_services")
		#call_command("import_hotels")
		self.progress_displayer = ProgressDisplayer()
		self.progress_bar = ''
		self._rows_limit = int(kwargs['n']) if kwargs['n'] else 0
		rows = 50 if not self._rows_limit else self._rows_limit
		property=Generalmodels.Property.objects.filter(code__contains="OP").first()
		for irow in range(0,rows):
			reservation, created = models.Reservation.objects.get_or_create(
				opera_code="QATEST",
		        pax=generate_id_length(),
			    user_extension_id=1,
			    country="mexico",
			    email=generate_id_length()+"@opvp.com",
			    sale_type=Generalmodels.SaleType.objects.filter(property=property).order_by('?').first(),
			    property=property,
			    comments=generate_id_length()
			)
			print(reservation)
			time.sleep(0.1)
			n = random.randint(1, 4)
			i = 0
			while i<n:
				o = random.randint(0, 2)
				time.sleep(0.1)
				if o == 0:
					self.create_arrival_service(reservation,property)
				elif o == 1:
					self.create_departure_service(reservation,property)
				elif o == 2:
					self.create_interhotel_service(reservation,property)
				i = i + 1
			
		print(" - {} reservations parsed.".format(rows))
		
	def create_arrival_service(self,reservation,property):
		reservation_service, created = models.ReservationService.objects.get_or_create(
			reservation=reservation,
			date=generate_date_arrival(),
			real_pick_up_time=generate_time(),
			transfer_type="ARRIVALS",
			service=Generalmodels.Service.objects.filter(code__contains="QA",is_transfer=True).order_by('?').first(),
			destination=Generalmodels.Hotel.objects.filter(opera_code__contains="QA",properties__in=[property]).order_by('?').first(),
			adults=random.randrange(1, 5),
			childs=random.randrange(1, 5),
			operation_type=Generalmodels.OperationType.objects.filter(properties=property).order_by('?').first(),
			comments=generate_id_length(),
			flight_code=generate_id_length()
		)
		print(reservation_service)

	def create_departure_service(self,reservation,property):
		reservation_service, created = models.ReservationService.objects.get_or_create(
			reservation=reservation,
			date=generate_date_departure(),
			real_pick_up_time=generate_time(),
			transfer_type="DEPARTURES",
			service=models.Service.objects.filter(code__contains="QA",is_transfer=True).order_by('?').first(),
			origin=Generalmodels.Hotel.objects.filter(opera_code__contains="QA",properties__in=[property]).order_by('?').first(),
			adults=random.randrange(1, 5),
			childs=random.randrange(1, 5),
			operation_type=Generalmodels.OperationType.objects.filter(properties=property).order_by('?').first(),
			comments=generate_id_length(),
			flight_code=generate_id_length()
		)
		print(reservation_service)

	def create_interhotel_service(self,reservation,property):
		origin = Generalmodels.Hotel.objects.filter(opera_code__contains="QA",zone_id=random.randrange(1, 3),properties__in=[property]).order_by('?').first()
		time.sleep(0.1)
		destination = Generalmodels.Hotel.objects.filter(opera_code__contains="QA",zone_id=random.randrange(3, 5),properties__in=[property]).order_by('?').first()
		reservation_service, created = models.ReservationService.objects.get_or_create(
			reservation=reservation,
			date=generate_date(),
			real_pick_up_time=generate_time(),
			transfer_type="INTERHOTEL",
			service=models.Service.objects.filter(code__contains="QA",is_transfer=True).order_by('?').first(),
			origin=origin,
			destination=destination,
			adults=random.randrange(1, 5),
			childs=random.randrange(1, 5),
			operation_type=Generalmodels.OperationType.objects.filter(properties=property).order_by('?').first(),
			comments=generate_id_length()
		)
		print(reservation_service)
	
	def handle(self, *args, **kwargs):
		self.execute()