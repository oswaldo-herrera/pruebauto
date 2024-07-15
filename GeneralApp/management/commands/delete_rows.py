import os
from datetime import datetime
import random
import time

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.models.signals import post_save
from django.db.models import Sum, Q
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.utils.crypto import get_random_string

from GeneralApp import models
from OperationsApp import models as Opmodels
from SalesApp import models as Samodels
from GeneralApp.controllers import ProgressDisplayer

progress_bar = ''
CODE_LENGTH = 10
def generate_id_length():
	return get_random_string(CODE_LENGTH)
class Command(BaseCommand):
	help = """Run this command to restore departments cecos"""

	def execute(self, *args, **kwargs):
		self.progress_displayer = ProgressDisplayer()
		self.progress_bar = ''
		reservation_services = Opmodels.ReservationService.objects.filter(reservation__sale_type__name="TBA")
		for reservation_service in reservation_services:
			Samodels.Sale.objects.filter(reservation_service=reservation_service).update(
				reservation_service=None
			)
			reservation_service.delete()
		Opmodels.Reservation.objects.filter(sale_type__name="TBA").delete()
		models.Service.objects.filter(name="TBA").delete()
		#models.Hotel.objects.filter(opera_code__contains="QA").delete()
		#models.Unit.objects.filter(code__contains="QA").delete()
		#models.UnitType.objects.filter(Q(name="AUTOBUS")|Q(name="BAN")).delete()
		#models.Provider.objects.filter(sap_code__contains="QA").delete()

	def handle(self, *args, **kwargs):
		self.execute()