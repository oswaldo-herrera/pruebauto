import os
from datetime import datetime
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

from GeneralApp import models
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
		property=models.Property.objects.get(id=1)
		for TRANSFER_TYPE in models.TRANSFER_TYPE_CHOICES:
			service, created = models.Service.objects.get_or_create(
				code="QA-MARUBAN",
				name="MARUBAN COLECTIVO",
				provider=models.Provider.objects.filter(sap_code="QA-TEST-SERVICES").first(),
				is_transfer=True,
				zones="1,2,3,4,5",
			)
			service.properties.set(models.Property.objects.filter(code__contains="OP"))
			service.save()
			print(service)
			service, created = models.Service.objects.get_or_create(
				code="QA-MARUBAN",
				name="MARUBAN PRIVATE",
				provider=models.Provider.objects.filter(sap_code="QA-TEST-SERVICES").first(),
				is_transfer=True,
				is_colective=False,
				unit=models.Unit.objects.filter(code__contains="QA",is_private=True).order_by('?').first(),
				zones="1,2,3,4,5",
			)
			service.properties.set(models.Property.objects.filter(code__contains="OP"))
			service.save()
			print(service)
		
	
	def handle(self, *args, **kwargs):
		self.execute()