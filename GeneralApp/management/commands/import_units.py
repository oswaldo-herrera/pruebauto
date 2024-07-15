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
		unit_type_bus, created = models.UnitType.objects.get_or_create(
			name="AUTOBUS",
		)
		unit_type_ban, created = models.UnitType.objects.get_or_create(
			name="BAN",
		)
		property=models.Property.objects.filter(code__contains="OP").first()
		unit_colective, created = models.Unit.objects.get_or_create(
			unit_type=unit_type_bus,
			code="QA-MARUBUS",
			name="MARUBUS COLECTIVO",
			capacity=30,
			provider=models.Provider.objects.filter(sap_code="QA-TEST-UNITS").first(),
			property=property,
		)
		print(unit_colective)
		unit_private, created = models.Unit.objects.get_or_create(
			unit_type=unit_type_ban,
			code="QA-MARUBAN",
			name="MARUBAN PRIVATE",
			capacity=5,
			is_private=True,
			provider=models.Provider.objects.filter(sap_code="QA-TEST-UNITS").first(),
			property=property,
		)
		print(unit_private)
		
	
	def handle(self, *args, **kwargs):
		self.execute()