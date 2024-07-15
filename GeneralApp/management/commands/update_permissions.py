from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.models.signals import post_save
from django.db.models import Sum, Q
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.utils.crypto import get_random_string
from GeneralApp.controllers import ProgressDisplayer
from django.contrib.auth.models import Permission

progress_bar = ''
CODE_LENGTH = 10
def generate_id_length():
	return get_random_string(CODE_LENGTH)

class Command(BaseCommand):
	help = """Run this command to restore departments cecos"""
        
	def execute(self, *args, **kwargs):
		self.progress_displayer = ProgressDisplayer()
		self.progress_bar = ''
		permissions = Permission.objects.all()
		for permission in permissions:
			if permission.content_type.app_label in ["GeneralApp","OperationsApp","SalesApp"]:
				if "add_" in permission.codename:
					permission.name = "Puede ingresar {}".format(permission.content_type.name)
					permission.save()
				elif "change_" in permission.codename:
					permission.name = "Puede editar {}".format(permission.content_type.name)
					permission.save()
				elif "delete_" in permission.codename:
					permission.name = "Puede eliminar {}".format(permission.content_type.name)
					permission.save()
				elif "view_" in permission.codename:
					permission.name = "Puede consultar {}".format(permission.content_type.name)
					permission.save()
				print(permission.name)