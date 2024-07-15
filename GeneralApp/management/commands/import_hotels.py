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
		i = 1
		while i < 6:
			hotel, created = models.Hotel.objects.get_or_create(
				name="Hotel " + str(i),
				opera_code="QA-TEST-HOTELS",
				zone_id=i,
				unit=models.Unit.objects.filter(code="QA-MARUBUS").first(),
			)
			hotel.properties.set(models.Property.objects.filter(code__contains="OP"))
			hotel.save()
			print(hotel)
			i=i+1

	def handle(self, *args, **kwargs):
		self.execute()