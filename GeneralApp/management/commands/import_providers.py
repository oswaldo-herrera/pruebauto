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
class Command(BaseCommand):
	help = """Run this command to restore departments cecos"""

	def execute(self, *args, **kwargs):
		self.progress_displayer = ProgressDisplayer()
		self.progress_bar = ''
		property=models.Property.objects.filter(code__contains="OP").first()
		provider, created = models.Provider.objects.get_or_create(
            name="Proveedor de Unidades",
            sap_code="QA-TEST-UNITS",
		)
		provider.properties.set(models.Property.objects.filter(code__contains="OP"))
		provider.save()
		print(provider)
		provider, created = models.Provider.objects.get_or_create(
            name="Proveedor de Servicios",
            sap_code="QA-TEST-SERVICES",
		)
		provider.properties.set(models.Property.objects.filter(code__contains="OP"))
		provider.save()
		print(provider)
		
	
	def handle(self, *args, **kwargs):
		self.execute()